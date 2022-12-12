from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import RedirectResponse
from platform import python_version

from .._version import __version__ as pephub_version

from ..dependencies import *
from ..const import BASE_TEMPLATES_PATH

router = APIRouter(prefix="/profile", tags=["profile"])

templates = Jinja2Templates(directory=BASE_TEMPLATES_PATH)

# return users data from session_info
@router.get("/data")
def profile_data(
    request: Request,
    session_info=Depends(read_session_info),
    db: Connection = Depends(get_db),
):
    """
    Return the user's profile data.
    """
    if session_info is None:
        return RedirectResponse(url="/auth/login")
    else:
        peps = db.get_namespace_info(session_info['login'], user=session_info["login"])
        return {
            "request": request,
            "session_info": session_info,
            "python_version": python_version(),
            "pephub_version": pephub_version,
            "logged_in": session_info is not None,
            "peps": peps
        }



@router.get("/")
def profile(
    request: Request,
    session_info=Depends(read_session_info),
    db: Connection = Depends(get_db),
):
    """
    Display the user's profile page.
    """
    if session_info is None:
        return RedirectResponse(url="/auth/login")
    else:
        namespace_info = db.get_namespace_info(session_info['login'], user=session_info["login"])
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