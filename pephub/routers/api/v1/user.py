from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import RedirectResponse, JSONResponse
from platform import python_version

from ...._version import __version__ as pephub_version
from ....dependencies import *
from ....const import BASE_TEMPLATES_PATH

user = APIRouter(prefix="/api/v1/me", tags=["profile"])

templates = Jinja2Templates(directory=BASE_TEMPLATES_PATH)


# return users data from session_info
@user.get("/")
def profile_data(
    session_info=Depends(read_session_info),
    db: Connection = Depends(get_db),
):
    """
    Return the user's profile data.
    """
    if session_info is None:
        return RedirectResponse(url="/auth/login")
    else:
        peps = db.get_namespace_info(session_info["login"], user=session_info["login"])
        return JSONResponse(
            content={
                "session_info": session_info,
                "peps": [pep.dict() for pep in peps.projects],
            }
        )
