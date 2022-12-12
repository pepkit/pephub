import os
import peppy
from fastapi import Depends
from fastapi.responses import Response
from fastapi.security import HTTPBearer
from fastapi.security import APIKeyCookie
from pepdbagent import Connection
from pepdbagent.const import DEFAULT_TAG
from pepdbagent.models import NamespaceModel
from dotenv import load_dotenv
from typing import Union
from .const import (
    DEFAULT_POSTGRES_HOST,
    DEFAULT_POSTGRES_PASSWORD,
    DEFAULT_POSTGRES_PORT,
    DEFAULT_POSTGRES_USER,
    DEFAULT_POSTGRES_DB,
)
from datetime import datetime, timedelta
import pydantic
import jwt
import json
from fastapi.exceptions import HTTPException
import requests
from pydantic import BaseModel
from typing import List, Optional
from secrets import token_hex


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
        encoded_user_data =  jwt.encode({**user_data, "exp": exp}, JWT_SECRET, algorithm="HS256")
        if isinstance(encoded_user_data, bytes):
            encoded_user_data = encoded_user_data.decode("utf-8")
        return encoded_user_data


def get_db():
    # create database
    pepdb = Connection(
        user=os.environ.get("POSTGRES_USER") or DEFAULT_POSTGRES_USER,
        password=os.environ.get("POSTGRES_PASSWORD") or DEFAULT_POSTGRES_PASSWORD,
        host=os.environ.get("POSTGRES_HOST") or DEFAULT_POSTGRES_HOST,
        database=os.environ.get("POSTGRES_DB") or DEFAULT_POSTGRES_DB,
        port=os.environ.get("POSTGRES_PORT") or DEFAULT_POSTGRES_PORT,
    )
    try:
        yield pepdb
    finally:
        pepdb.close_connection()


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
    pep_id: str,
    tag: str = None,
    db: Connection = Depends(get_db),
    user=Depends(get_user_from_session_info),
    organizations=Depends(get_organizations_from_session_info),
):
    if proj := db.get_project(namespace, pep_id, tag):
        _check_user_access(user, organizations, namespace, proj)
        yield proj
    else:
        raise HTTPException(
            404,
            f"PEP '{namespace}/{pep_id}:{tag or DEFAULT_TAG}' does not exist in database. Did you spell it correctly?",
        )


def get_namespaces(
    db: Connection = Depends(get_db),
    user: str = Depends(get_user_from_session_info),
    organizations: List[str] = Depends(get_organizations_from_session_info),
) -> List[NamespaceModel]:
    yield db.get_namespaces_info_by_list(user=user)


def _check_user_access(
    user: str, organizations: List, namespace: str, project: peppy.Project
):
    if project.is_private:
        if user == namespace or namespace in organizations:
            return project
        else:
            raise HTTPException(
                403, f"The user does not have permission to view or pull this project."
            )
    else:
        return project
