from fastapi import APIRouter, Request, Depends
from fastapi.templating import Jinja2Templates
from fastapi.responses import RedirectResponse
from platform import python_version
from pepdbagent import PEPDatabaseAgent

from .._version import __version__ as pephub_version
from ..dependencies import get_db

# from ..view_dependencies import *
from ..const import BASE_TEMPLATES_PATH

router = APIRouter(prefix="/profile", tags=["profile"])

templates = Jinja2Templates(directory=BASE_TEMPLATES_PATH)


@router.get("/")
def profile(
    request: Request,
    session_info=Depends(read_session_cookie),
    agent: PEPDatabaseAgent = Depends(get_db),
):
    """
    Display the user's profile page.
    """
    if session_info is None:
        return RedirectResponse(url="/auth/login")
    else:
        namespace_info = agent.namespace.get(
            namespace=session_info["login"], admin=session_info["login"]
        )
        return templates.TemplateResponse(
            "profile.html",
            {
                "request": request,
                "session_info": session_info,
                "python_version": python_version(),
                "pephub_version": pephub_version,
                "logged_in": session_info is not None,
                "namespace_info": namespace_info,
                "projects": namespace_info.projects,
            },
        )
