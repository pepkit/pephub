import os
import pydantic
import jwt
import json
import requests

from secrets import token_hex
from dotenv import load_dotenv
from typing import Union, List, Optional
from datetime import datetime, timedelta

from fastapi import Depends
from fastapi.responses import Response
from fastapi.exceptions import HTTPException
from fastapi.security import HTTPBearer, APIKeyCookie
from pydantic import BaseModel
from pepdbagent import PEPDatabaseAgent
from pepdbagent.const import DEFAULT_TAG
from pepdbagent.models import (
    AnnotationModel,
    NamespaceReturnModel
)
from qdrant_client import QdrantClient
from qdrant_client.http.exceptions import ResponseHandlingException
from sentence_transformers import SentenceTransformer


from .const import (
    DEFAULT_POSTGRES_HOST,
    DEFAULT_POSTGRES_PASSWORD,
    DEFAULT_POSTGRES_PORT,
    DEFAULT_POSTGRES_USER,
    DEFAULT_POSTGRES_DB,
    DEFAULT_QDRANT_HOST,
    DEFAULT_QDRANT_PORT,
    DEFAULT_HF_MODEL,
)



load_dotenv()

# Scheme for the Authorization header
token_auth_scheme = HTTPBearer()
JWT_SECRET = token_hex(32)
JWT_EXPIRATION = 360  # minutes

pephub_cookie = APIKeyCookie(name="pephub_session")
pephub_cookie.auto_error = False


class UserData(BaseModel):
    login: str
    id: int
    organizations: Optional[List[str]]


class CLIAuthSystem:
    GITHUB_BASE_API_URL = "https://api.github.com"

    def get_jwt(self, access_token: str) -> str:
        """
        Based on access token request GitHub for user data and encode it using secret.
        """
        user_data = self._request_user_data_from_github(access_token)
        return self.jwt_encode_user_data(user_data.dict())

    @staticmethod
    def _request_user_data_from_github(access_token: str) -> UserData:
        response = requests.get(
            f"{CLIAuthSystem.GITHUB_BASE_API_URL}/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json",
            },
        )
        try:
            return UserData(**json.loads(response.content.decode("utf-8")))
        except (
            AttributeError,
            UnicodeDecodeError,
            json.JSONDecodeError,
            pydantic.ValidationError,
        ):
            raise HTTPException(
                status_code=400,
                detail="Can't decode GitHub response. Please check it manually.",
            )

    @staticmethod
    def jwt_encode_user_data(user_data: dict) -> str:
        exp = datetime.utcnow() + timedelta(minutes=JWT_EXPIRATION)
        encoded_user_data = jwt.encode(
            {**user_data, "exp": exp}, JWT_SECRET, algorithm="HS256"
        )
        if isinstance(encoded_user_data, bytes):
            encoded_user_data = encoded_user_data.decode("utf-8")
        return encoded_user_data


def get_db() -> PEPDatabaseAgent:
    """
    Grab a temporary connection to the database.
    """
    agent = PEPDatabaseAgent(
        user=os.environ.get("POSTGRES_USER") or DEFAULT_POSTGRES_USER,
        password=os.environ.get("POSTGRES_PASSWORD") or DEFAULT_POSTGRES_PASSWORD,
        host=os.environ.get("POSTGRES_HOST") or DEFAULT_POSTGRES_HOST,
        database=os.environ.get("POSTGRES_DB") or DEFAULT_POSTGRES_DB,
        port=os.environ.get("POSTGRES_PORT") or DEFAULT_POSTGRES_PORT,
    )
    try:
        yield agent
    finally:
        agent.close_connection()


def set_session_info(response: Response, session_info: dict):
    """
    Encodes a dict in a JWT and stores it in a cookie. Read the results
    with the partner function, read_session_info.

    @param response: Response object passed through from API endpoint
    @param session_info: Dict of session variables to store in cookie
    """
    session_info_encoded = CLIAuthSystem.jwt_encode_user_data(session_info)
    response.set_cookie("pephub_session", session_info_encoded)
    return True


def read_session_info(session_info_encoded: str = Depends(pephub_cookie)):
    """
    Reads and decodes a JWT, returning the decoded variables.

    @param session_info_encoded: JWT provided via FastAPI injection from the API cookie.
    """
    if session_info_encoded is None:
        return None
    try:
        session_info = jwt.decode(
            session_info_encoded, JWT_SECRET, algorithms=["HS256"]
        )
    except jwt.exceptions.InvalidSignatureError as e:
        print(e)
        return None
    except jwt.exceptions.DecodeError as e:
        print(e)
        return None
    except jwt.exceptions.ExpiredSignatureError:
        raise HTTPException(403, "The token has expired, please log in again.")
    return session_info


def get_organizations_from_session_info(
    session_info: Union[dict, None] = Depends(read_session_info)
) -> List:
    organizations = []
    if session_info:
        organizations = session_info.get("orgs")
    return organizations


def get_user_from_session_info(
    session_info: Union[dict, None] = Depends(read_session_info)
) -> str:
    user = None
    if session_info:
        user = session_info.get("login")
    return user


def get_project(
    namespace: str,
    project: str,
    tag: Optional[str] = DEFAULT_TAG,
    agent: PEPDatabaseAgent = Depends(get_db),
):
    if proj := agent.project.get(namespace, project, tag):
        yield proj
    else:
        raise HTTPException(
            404,
            f"PEP '{namespace}/{project}:{tag or DEFAULT_TAG}' does not exist in database. Did you spell it correctly?",
        )


def get_project_annotation(
    namespace: str,
    project: str,
    tag: Optional[str] = DEFAULT_TAG,
    agent: PEPDatabaseAgent = Depends(get_db),
) -> AnnotationModel:
    if project_annotation := agent.annotation.get(namespace, project, tag):
        yield project_annotation
    else:
        raise HTTPException(
            404,
            f"PEP '{namespace}/{project}:{tag or DEFAULT_TAG}' does not exist in database. Did you spell it correctly?",
        )

# TODO: This isn't used; do we still need it?
def get_namespaces(
    agent: PEPDatabaseAgent = Depends(get_db),
    user: str = Depends(get_user_from_session_info),
) -> List[NamespaceReturnModel]:
    yield agent.namespace.get(admin=user)


def verify_user_can_write_namespace(
    namespace: str,
    session_info: Union[dict, None] = Depends(read_session_info),
    orgs: List = Depends(get_organizations_from_session_info),
):
    """
    Authorization flow for writing to a namespace.

    See: https://github.com/pepkit/pephub/blob/master/docs/authentication.md#submiting-a-new-pep
    """
    if session_info is None:
        raise HTTPException(
            401,
            f"User must be logged in to write to namespace: '{namespace}'.",
        )
    if session_info["login"] != namespace and namespace not in orgs:
        raise HTTPException(
            403,
            f"User does not have permission to write to namespace: '{namespace}'.",
        )


def verify_user_can_read_project(
    project: str,
    namespace: str,
    tag: Optional[str] = DEFAULT_TAG,
    project_annotation: AnnotationModel = Depends(get_project_annotation),
    session_info: Union[dict, None] = Depends(read_session_info),
    orgs: List = Depends(get_organizations_from_session_info),
):
    """
    Authorization flow for reading a project from the database.

    See: https://github.com/pepkit/pephub/blob/master/docs/authentication.md#reading-peps
    """
    if project_annotation.is_private:
        if session_info is None:
            # raise 404 since we don't want to reveal that the project exists
            raise HTTPException(
                404, f"Project, '{namespace}/{project}:{tag}', not found."
            )
        elif any(
            [
                session_info.get("login") != namespace
                and namespace
                not in orgs,  # user doesnt own namespace or is not member of organization
            ]
        ):
            # raise 404 since we don't want to reveal that the project exists
            raise HTTPException(
                404, f"Project, '{namespace}/{project}:{tag}', not found."
            )


def verify_user_can_write_project(
    project: str,
    namespace: str,
    tag: Optional[str] = DEFAULT_TAG,
    project_annotation: AnnotationModel = Depends(get_project_annotation),
    session_info: Union[dict, None] = Depends(read_session_info),
    orgs: List = Depends(get_organizations_from_session_info),
):
    """
    Authorization flow for writing a project to the database.

    See: https://github.com/pepkit/pephub/blob/master/docs/authentication.md#writing-peps
    """
    if project_annotation.is_private:
        if session_info is None:  # user not logged in
            # raise 404 since we don't want to reveal that the project exists
            raise HTTPException(
                404, f"Project, '{namespace}/{project}:{tag}', not found."
            )
        elif any([            
                session_info["login"] != namespace
                and namespace
                not in orgs,  # user doesnt own namespace or is not member of organization
            ]
        ):
            # raise 404 since we don't want to reveal that the project exists
            raise HTTPException(
                404, f"Project, '{namespace}/{project}:{tag}', not found."
            )
    else:
        # AUTHENTICATION REQUIRED
        if session_info is None:
            raise HTTPException(
                401,
                f"Please authenticate before editing project.",
            )
        # AUTHORIZATION REQUIRED
        if session_info["login"] != namespace and namespace not in orgs:
            raise HTTPException(
                403,
                f"The current authenticated user does not have permission to edit this project.",
            )


def parse_boolean_env_var(env_var: str) -> bool:
    """
    Helper function to parse a boolean environment variable
    """
    return env_var.lower() in ["true", "1", "t", "y", "yes"]


def get_qdrant_enabled() -> bool:
    """
    Check if qdrant is enabled
    """
    return parse_boolean_env_var(os.environ.get("QDRANT_ENABLED", "false"))


def get_qdrant(
    qdrant_enabled: bool = Depends(get_qdrant_enabled),
) -> Union[QdrantClient, None]:
    """
    Return connection to qdrant client
    """
    # return None if qdrant is not enabled
    if not qdrant_enabled:
        try:
            yield None
        finally:
            pass
    # else try to connect, test connectiona and return client if connection is successful.
    qdrant = QdrantClient(
        host=os.environ.get("QDRANT_HOST", DEFAULT_QDRANT_HOST),
        port=os.environ.get("QDRANT_PORT", DEFAULT_QDRANT_PORT),
        api_key=os.environ.get("QDRANT_API_KEY", None),
    )
    try:
        # test the connection first
        qdrant.list_full_snapshots()
        yield qdrant
    except ResponseHandlingException as e:
        print(f"Error getting qdrant client: {e}")
        yield None
    finally:
        # no need to close the connection
        pass


def get_sentence_transformer() -> SentenceTransformer:
    """
    Return sentence transformer encoder
    """
    model = SentenceTransformer(os.getenv("HF_MODEL", DEFAULT_HF_MODEL))
    try:
        yield model
    finally:
        # no need to do anything
        pass


def get_namespace_info(namespace: str, agent: PEPDatabaseAgent = Depends(get_db)):
    """
    Get the information on a namespace, if it exists.
    """
    if namespace_info := agent.namespace.get(query=namespace):
        yield namespace_info
    else:
        raise HTTPException(
            404,
            f"Namespace '{namespace}' does not exist in database. Did you spell it correctly?",
        )


def verify_namespace_exists(namespace: str, agent: PEPDatabaseAgent = Depends(get_db)):
    if not agent.namespace.get(query=namespace):
        raise HTTPException(
            404,
            f"Namespace '{namespace}' does not exist in database. Did you spell it correctly?",
        )
    else:
        yield namespace
