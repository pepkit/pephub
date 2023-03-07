# WARNING!
# This file is intended to be used for the *view* endpoints only. I.e.,
# endpoints that are used to render the front-end application.
#
# they are specific variants of the main dependencies.py file that
# supports the API. Please consider using one of those before using
# this file.

import logging
import jwt

from typing import Union, List, Optional
from fastapi import Depends
from fastapi.exceptions import HTTPException
from fastapi.security.api_key import APIKeyCookie
from pepdbagent import PEPDatabaseAgent
from pepdbagent.exceptions import ProjectNotFoundError

from .dependencies import JWT_SECRET, get_db
from .const import DEFAULT_TAG
from .routers.models import AnnotationModel

pephub_cookie = APIKeyCookie(name="pephub_session")
pephub_cookie.auto_error = False

_LOGGER_PEPHUB = logging.getLogger("uvicorn.access")


# This method is to be used only for the front-end application,
# since we use server-side rendering and require the session
# info to be available on the first load of the page (render ui
# based on jinja templating). This is specific to the front-end,
# and the front-end knows to provide a cookie in the request.
#
# backend API calls should use the read_authorization_header method which looks
# for an Authorization header instead.
def read_session_cookie(session_info_encoded=Depends(pephub_cookie)):
    if session_info_encoded is None:
        return None
    try:
        # Python jwt.decode verifies content as well so this is safe.
        session_info = jwt.decode(
            session_info_encoded, JWT_SECRET, algorithms=["HS256"]
        )
    except jwt.exceptions.InvalidSignatureError as e:
        _LOGGER_PEPHUB.error(e)
        return None
    except jwt.exceptions.DecodeError as e:
        _LOGGER_PEPHUB.error(e)
        return None
    except jwt.exceptions.ExpiredSignatureError:
        raise None
    return session_info


def get_organizations_from_session_info(
    session_info: Union[dict, None] = Depends(read_session_cookie)
) -> List[str]:
    organizations = []
    if session_info:
        organizations = session_info.get("orgs")
    return organizations


def get_user_from_session_info(
    session_info: Union[dict, None] = Depends(read_session_cookie)
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
        return None


def get_project_annotation(
    namespace: str,
    project: str,
    tag: Optional[str] = DEFAULT_TAG,
    agent: PEPDatabaseAgent = Depends(get_db),
    namespace_access_list: List[str] = Depends(get_namespace_access_list),
) -> AnnotationModel:
    # TODO: Is just grabbing the first annotation the right thing to do?
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
    session_info: Union[dict, None] = Depends(read_session_cookie),
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
    session_info: Union[dict, None] = Depends(read_session_cookie),
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
    session_info: Union[dict, None] = Depends(read_session_cookie),
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
        elif any(
            [
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
