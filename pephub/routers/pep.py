from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pephub.const import BASE_TEMPLATES_PATH
from peppy import __version__ as peppy_version
from platform import python_version

# load dependencies
from ..dependencies import *


router = APIRouter(prefix="/pep", tags=["pep"])

templates = Jinja2Templates(directory=BASE_TEMPLATES_PATH)


@router.get("/")
async def get_all_namespaces(db: Connection = Depends(get_db), user=Depends(get_user_from_namespace_info)):
    return {"namespaces": [n.namespace for n in db.get_namespaces_info_by_list(user)]}


@router.get("/list")
async def get_all_projects(db: Connection = Depends(get_db), user=Depends(get_user_from_namespace_info)):
    return {"namespaces": db.get_namespaces_info_by_list(user)}


@router.get(
    "/view",
    summary="View a visual summary of the peps on the server",
    response_class=HTMLResponse,
)
async def pep_view(
    request: Request,
    db: Connection = Depends(get_db),
    session_info: dict = Depends(read_session_info),
):
    """Returns HTML response with a visual summary of thhe peps on the server"""
    nspaces = db.get_namespaces_info_by_list()
    return templates.TemplateResponse(
        "pep.html",
        {
            "nspaces": nspaces,
            "request": request,
            "peppy_version": peppy_version,
            "python_version": python_version(),
            "logged_in": session_info is not None,
        },
    )
