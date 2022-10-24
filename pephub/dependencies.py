import os
import jwt
import peppy
from fastapi import HTTPException, Depends
from fastapi.responses import Response
from fastapi.security import HTTPBearer
from fastapi.security import APIKeyCookie
from pepdbagent import Connection
from pepdbagent.const import DEFAULT_TAG
from dotenv import load_dotenv
from typing import Union
from pephub.config_loader import config
from .const import (
    DEFAULT_POSTGRES_HOST,
    DEFAULT_POSTGRES_PASSWORD,
    DEFAULT_POSTGRES_PORT,
    DEFAULT_POSTGRES_USER,
    DEFAULT_POSTGRES_DB
)

load_dotenv()

# Scheme for the Authorization header
token_auth_scheme = HTTPBearer()

pephub_cookie = APIKeyCookie(name="pephub_session")
pephub_cookie.auto_error = False


def get_db():
    # create database
    pepdb = Connection(
        user=os.environ.get("POSTGRES_USER") or DEFAULT_POSTGRES_USER,
        password=os.environ.get("POSTGRES_PASSWORD") or DEFAULT_POSTGRES_PASSWORD,
        host=os.environ.get("POSTGRES_HOST") or DEFAULT_POSTGRES_HOST,
        database=os.environ.get("POSTGRES_DB") or DEFAULT_POSTGRES_DB,
        port=os.environ.get("POSTGRES_PORT") or DEFAULT_POSTGRES_PORT
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
    session_info_encoded = jwt.encode(session_info, config.JWT_SECRET)
    response.set_cookie("pephub_session", session_info_encoded)
    return True


def read_session_info(session_info_encoded: str = Depends(pephub_cookie)):
    """
    Reads and decodes a JWT, returning the decoded variables.

    @param session_info_encoded: JWT provided via FastAPI injection from the API cookie.
    """

    try:
        session_info = jwt.decode(session_info_encoded, config.JWT_SECRET, algorithms=["HS256"])
    except jwt.exceptions.InvalidSignatureError as e:
        print(e)
        return None
    except jwt.exceptions.DecodeError as e:
        print(e)
        return None
    return session_info


def get_user_from_namespace_info(session_info: Union[dict, None] = Depends(read_session_info)) -> Union[str, None]:
    current_user = None
    if session_info:
        current_user = session_info.get("user")
    return current_user


def get_project(
    namespace: str,
    pep_id: str,
    tag: str = None,
    db: Connection = Depends(get_db),
    user=Depends(get_user_from_namespace_info),
):
    if proj := db.get_project(namespace, pep_id, tag):
        _check_user_access(user, namespace, proj)
        yield proj
    else:
        raise HTTPException(404, f"PEP '{namespace}/{pep_id}:{tag or DEFAULT_TAG}' does not exist in database. Did you spell it correctly?")


def _check_user_access(user: str, namespace: str, project: peppy.Project):
    if project.is_private:
        if user == namespace:
            return project
        else:
            raise HTTPException(403, f"The user {user} does not have permission to view or pull this project.")
    else:
        return project
