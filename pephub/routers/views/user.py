from typing import Union
from fastapi import APIRouter, Request, Depends
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates

from pepdbagent import PEPDatabaseAgent
from ...dependencies import get_db
from ...view_dependencies import get_user_from_session_info, read_session_cookie
from ...const import BASE_TEMPLATES_PATH, ALL_VERSIONS

templates = Jinja2Templates(directory=BASE_TEMPLATES_PATH)

user = APIRouter(tags=["interface"])


@user.get("/me")
def me(
    request: Request,
    user: Union[str, None] = Depends(get_user_from_session_info),
    session_info: dict = Depends(read_session_cookie),
    agent: PEPDatabaseAgent = Depends(get_db),
):
    """
    Display the user's profile page.
    """
    if session_info is None:
        return RedirectResponse(url="/auth/login")
    else:
        namespace_info = agent.namespace.get(query=user).results[0]
        projects = agent.annotation.get(namespace=user).results
        return templates.TemplateResponse(
            "profile.html",
            {
                "request": request,
                "session_info": session_info,
                "python_version": ALL_VERSIONS["python_version"],
                "pephub_version": ALL_VERSIONS["pephub_version"],
                "logged_in": session_info is not None,
                "namespace_info": namespace_info,
                "projects": projects,
            },
        )
