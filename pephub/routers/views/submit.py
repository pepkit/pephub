import jinja2
from fastapi import Request, APIRouter
from fastapi.responses import RedirectResponse
from starlette.templating import Jinja2Templates
from platform import python_version
from dotenv import load_dotenv

from .base import views
from ..._version import __version__ as pephub_version
from ...dependencies import *
from ...const import BASE_TEMPLATES_PATH


load_dotenv()

templates = Jinja2Templates(directory=BASE_TEMPLATES_PATH)
je = jinja2.Environment(loader=jinja2.FileSystemLoader(BASE_TEMPLATES_PATH))

submit = APIRouter(
    prefix="/submit", tags=["views", "user interface", "interface", "projects", "PEP"]
)


@submit.get("/", summary="Submit a PEP to the current namespace")
async def submit_pep_form(request: Request, session_info=Depends(read_session_info)):
    if session_info is not None:
        return templates.TemplateResponse(
            "submit.html",
            {
                "namespace": session_info["login"],
                "session_info": session_info,
                "logged_in": session_info is not None,
                "request": request,
                "peppy_version": peppy.__version__,
                "python_version": python_version(),
                "pephub_version": pephub_version,
            },
        )
    else:
        return RedirectResponse(url="/auth/login")
