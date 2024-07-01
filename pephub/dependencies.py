import json
import logging
import os
from datetime import datetime, timedelta
from secrets import token_hex
from typing import Any, Dict, List, Optional, Union
from cachetools import cached, TTLCache

import jwt
import pydantic
import requests
from dotenv import load_dotenv
from fastapi import Depends, Header, Query
from fastapi.exceptions import HTTPException
from fastapi.security import HTTPBearer
from fastembed.embedding import FlagEmbedding as Embedding
from pepdbagent import PEPDatabaseAgent
from pepdbagent.const import DEFAULT_TAG
from pepdbagent.exceptions import ProjectNotFoundError
from pepdbagent.models import AnnotationModel, Namespace, ListOfNamespaceInfo
from pydantic import BaseModel
from qdrant_client import QdrantClient
from qdrant_client.http.exceptions import ResponseHandlingException

from .const import (
    DEFAULT_HF_MODEL,
    DEFAULT_POSTGRES_DB,
    DEFAULT_POSTGRES_HOST,
    DEFAULT_POSTGRES_PASSWORD,
    DEFAULT_POSTGRES_PORT,
    DEFAULT_POSTGRES_USER,
    DEFAULT_QDRANT_HOST,
    DEFAULT_QDRANT_PORT,
    JWT_EXPIRATION,
    JWT_SECRET,
)
from .routers.models import ForkRequest

_LOGGER_PEPHUB = logging.getLogger("uvicorn.access")

load_dotenv()

# Scheme for the Authorization header
token_auth_scheme = HTTPBearer()


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


# database connection
agent = PEPDatabaseAgent(
    user=os.environ.get("POSTGRES_USER") or DEFAULT_POSTGRES_USER,
    password=os.environ.get("POSTGRES_PASSWORD") or DEFAULT_POSTGRES_PASSWORD,
    host=os.environ.get("POSTGRES_HOST") or DEFAULT_POSTGRES_HOST,
    database=os.environ.get("POSTGRES_DB") or DEFAULT_POSTGRES_DB,
    port=os.environ.get("POSTGRES_PORT") or DEFAULT_POSTGRES_PORT,
)

# sentence_transformer model
embedding_model = Embedding(
    model_name=os.getenv("HF_MODEL", DEFAULT_HF_MODEL), max_length=512
)
# embedding_model = None


def generate_random_auth_code() -> str:
    """
    Generate a random 32-digit code.
    """
    n_bytes = int(32 / 2)
    return token_hex(n_bytes)


def generate_random_device_code() -> str:
    """
    Generate a random 8-digit code
    """
    n_bytes = int(8 / 2)
    return token_hex(n_bytes)


def get_db() -> PEPDatabaseAgent:
    """
    Grab a temporary connection to the database.
    """
    return agent


def read_authorization_header(Authorization: str = Header(None)) -> Union[dict, None]:
    """
    Reads and decodes a JWT, returning the decoded variables.

    :param Authorization: JWT provided via FastAPI injection from the API cookie.
    """
    if Authorization is None:
        return None
    else:
        Authorization = Authorization.replace("Bearer ", "")
    try:
        # Python jwt.decode verifies content as well so this is safe.
        session_info = jwt.decode(Authorization, JWT_SECRET, algorithms=["HS256"])
    except jwt.exceptions.InvalidSignatureError as e:
        _LOGGER_PEPHUB.error(e)
        return None
    except jwt.exceptions.DecodeError as e:
        _LOGGER_PEPHUB.error(e)
        return None
    except jwt.exceptions.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="JWT has expired")
    return session_info


def get_organizations_from_session_info(
    session_info: Union[dict, None] = Depends(read_authorization_header)
) -> List[str]:
    organizations = []
    if session_info:
        organizations = session_info.get("orgs")
    return organizations


def get_user_from_session_info(
    session_info: Union[dict, None] = Depends(read_authorization_header)
) -> Union[str, None]:
    user = None
    if session_info:
        user = session_info.get("login")
    return user


def get_namespace_access_list(
    user: str = Depends(get_user_from_session_info),
    orgs: List[str] = Depends(get_organizations_from_session_info),
) -> List[str]:
    """
    Return a list of namespaces that the current user has access to. Function
    will return None if there is no logged in user
    """
    access_rights = []
    if user:
        access_rights.append(user)
        access_rights.extend(orgs)
        return access_rights
    else:
        return []


def get_project(
    namespace: str,
    project: str,
    tag: Optional[str] = DEFAULT_TAG,
    agent: PEPDatabaseAgent = Depends(get_db),
    with_id: Optional[bool] = Query(
        False,
        description="Return the project with the samples pephub_id",
        include_in_schema=False,
    ),
) -> Dict[str, Any]:
    try:
        proj = agent.project.get(namespace, project, tag, raw=True, with_id=with_id)
        yield proj
    except ProjectNotFoundError:
        raise HTTPException(
            404,
            f"PEP '{namespace}/{project}:{tag or DEFAULT_TAG}' does not exist in database. Did you spell it correctly?",
        )


def get_config(
    namespace: str,
    project: str,
    tag: Optional[str] = DEFAULT_TAG,
    agent: PEPDatabaseAgent = Depends(get_db),
) -> Dict[str, Any]:
    try:
        config = agent.project.get_config(namespace, project, tag)
        yield config
    except ProjectNotFoundError:
        raise HTTPException(
            404,
            f"PEP '{namespace}/{project}:{tag or DEFAULT_TAG}' does not exist in database. Did you spell it correctly?",
        )


def get_subsamples(
    namespace: str,
    project: str,
    tag: Optional[str] = DEFAULT_TAG,
    agent: PEPDatabaseAgent = Depends(get_db),
) -> Dict[str, Any]:
    try:
        subsamples = agent.project.get_subsamples(namespace, project, tag)
        yield subsamples
    except ProjectNotFoundError:
        raise HTTPException(
            404,
            f"PEP '{namespace}/{project}:{tag or DEFAULT_TAG}' does not exist in database. Did you spell it correctly?",
        )


def get_project_annotation(
    namespace: str,
    project: str,
    tag: Optional[str] = DEFAULT_TAG,
    agent: PEPDatabaseAgent = Depends(get_db),
    namespace_access_list: List[str] = Depends(get_namespace_access_list),
) -> AnnotationModel:
    try:
        anno = agent.annotation.get(
            namespace, project, tag, admin=namespace_access_list
        ).results[0]
        yield anno
    except ProjectNotFoundError:
        raise HTTPException(
            404,
            f"PEP '{namespace}/{project}:{tag or DEFAULT_TAG}' does not exist in database. Did you spell it correctly?",
        )


def verify_user_can_write_namespace(
    namespace: str,
    session_info: Union[dict, None] = Depends(read_authorization_header),
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
    namespace: str,
    project: str,
    tag: Optional[str] = DEFAULT_TAG,
    project_annotation: AnnotationModel = Depends(get_project_annotation),
    session_info: Union[dict, None] = Depends(read_authorization_header),
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


def verify_user_can_fork(
    fork_request: ForkRequest,
    namespace_access_list: List[str] = Depends(get_namespace_access_list),
) -> bool:
    fork_namespace = fork_request.fork_to
    if fork_namespace in (namespace_access_list or []):
        yield
    else:
        raise HTTPException(401, "Unauthorized to fork this repo")


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
        url=os.environ.get("QDRANT_HOST", DEFAULT_QDRANT_HOST),
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


def get_sentence_transformer() -> Embedding:
    """
    Return sentence transformer encoder
    """
    return embedding_model


def get_namespace_info(
    namespace: str,
    agent: PEPDatabaseAgent = Depends(get_db),
    user: str = Depends(get_user_from_session_info),
) -> Namespace:
    """
    Get the information on a namespace, if it exists.
    """
    # TODO: is this the best way to do this? By grabbing the first result?
    try:
        yield agent.namespace.get(query=namespace, admin=user).results[0]
    except IndexError:
        # namespace doesnt exist in database, so we must return a blank namespace
        yield Namespace(
            namespace=namespace,
            number_of_projects=0,
            number_of_samples=0,
        )


@cached(TTLCache(maxsize=100, ttl=5*60))
def get_pepdb_namespace_info(limit: int = 10) -> ListOfNamespaceInfo:
    """
    Get the information on the biggest namespaces in the database.
    """
    return agent.namespace.info(limit=limit)
