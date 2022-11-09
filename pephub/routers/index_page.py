import jinja2
from typing import Union, List
from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from platform import python_version
from starlette.requests import Request
from starlette.templating import Jinja2Templates
from pepdbagent.models import NamespaceModel
from .._version import __version__ as pephub_version
from ..const import BASE_TEMPLATES_PATH
from ..dependencies import *

templates = Jinja2Templates(directory=BASE_TEMPLATES_PATH)
je = jinja2.Environment(loader=jinja2.FileSystemLoader(BASE_TEMPLATES_PATH))

router = APIRouter(tags=["root"])

ALL_VERSIONS = {
    "pephub_version": pephub_version,
    "peppy_version": peppy.__version__,
    "python_version": python_version(),
}


@router.get("/")
async def main(
    request: Request,
    session_info: dict = Depends(read_session_info),
    namespaces: List[str] = Depends(get_namespaces),
):
    templ_vars = {"request": request}
    return templates.TemplateResponse(
        "index.html",
        dict(
            templ_vars,
            **ALL_VERSIONS,
            namespaces=namespaces,
            session_info=session_info,
            logged_in=session_info is not None
        ),
    )


@router.get("/_version")
async def version():
    return dict(**ALL_VERSIONS)


@router.get("/submit", summary="Submit a PEP to the current namespace")
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
