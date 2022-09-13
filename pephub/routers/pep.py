from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from pephub.const import BASE_TEMPLATES_PATH
from peppy import __version__ as peppy_version
from platform import python_version

# load dependencies
from ..dependencies import *


router = APIRouter(
    prefix="/pep",
    tags=["pep"],
)

templates = Jinja2Templates(directory=BASE_TEMPLATES_PATH)

@router.get(
    "/"
)
async def get_all_namespaces(db:PepAgent = Depends(get_db)):
    namespaces = db.get_namespaces()
    return {
        'namespaces': [n['namespace'] for n in namespaces]
    }

@router.get(
    "/list"
)
async def get_all_projects(db:PepAgent = Depends(get_db)):
    namespaces = db.get_namespaces()
    return {
        'namespaces': namespaces
    }


@router.get("/")
async def get_all_namespaces(db: Connection = Depends(get_db)):
    namespaces = db.get_namespaces_info_by_list()
    return {"namespaces": [n["namespace"] for n in namespaces]}


@router.get("/list")
async def get_all_projects(db: Connection = Depends(get_db)):
    namespaces = db.get_namespaces_info_by_list()
    return {"namespaces": namespaces}


@router.get(
    "/view",
    summary="View a visual summary of the peps on the server",
    response_class=HTMLResponse,
)
async def pep_view(request: Request, db: Connection = Depends(get_db), session_info: dict = Depends(read_session_info)):
    """Returns HTML response with a visual summary of thhe peps on the server"""
    nspaces = db.get_namespaces_info_by_list()
    return templates.TemplateResponse(
        "pep.html",
        {
            "nspaces": nspaces,
            "request": request,
            "peppy_version": peppy_version,
            "python_version": python_version(),
            "logged_in": session_info is not None
        },
    )
