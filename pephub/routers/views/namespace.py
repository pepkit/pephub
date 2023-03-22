from typing import List
from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from pepdbagent import PEPDatabaseAgent
from ...dependencies import get_db
from ...view_dependencies import (
    read_session_cookie,
    get_user_from_session_info,
    get_organizations_from_session_info,
)
from ...const import BASE_TEMPLATES_PATH, ALL_VERSIONS

templates = Jinja2Templates(directory=BASE_TEMPLATES_PATH)

namespace = APIRouter(tags=["interface"])


@namespace.get(
    "/{namespace}",
    summary="View a visual summary of a particular namespace.",
    response_class=HTMLResponse,
)
async def namespace_view(
    request: Request,
    namespace: str,
    session_info: dict = Depends(read_session_cookie),
    user: str = Depends(get_user_from_session_info),
    user_orgs: List[str] = Depends(get_organizations_from_session_info),
    agent: PEPDatabaseAgent = Depends(get_db),
):
    """Returns HTML response with a visual summary of the namespace."""
    try:
        nspace = agent.namespace.get(query=namespace).results[0]
    except IndexError:
        nspace = {
            "namespace": namespace,
            "number_of_projects": 0,
            "number_of_samples": 0,
        }

    return templates.TemplateResponse(
        "namespace.html",
        {
            # is this the right way to do this? Grab the first result?
            "namespace": nspace,
            "request": request,
            "peppy_version": ALL_VERSIONS["peppy_version"],
            "python_version": ALL_VERSIONS["python_version"],
            "pephub_version": ALL_VERSIONS["pephub_version"],
            "logged_in": user is not None,
            "session_info": session_info,
            "orgs": user_orgs,
            "can_edit": user == namespace or namespace in user_orgs,
        },
    )
