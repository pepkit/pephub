from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.templating import Jinja2Templates

from pephub.const import BASE_TEMPLATES_PATH, INFO_KEY
from peppy import __version__ as peppy_version
from platform import python_version

# fetch peps
from ..main import _PEP_STORES

# load dependencies
from ..dependencies import *


router = APIRouter(
    prefix="/pep",
    tags=["pep"],
)

templates = Jinja2Templates(directory=BASE_TEMPLATES_PATH)

@router.get("/", summary="View a visual summary of the peps on the server", response_class=HTMLResponse)
async def pep_view(request: Request):
    """Returns HTML response with a visual summary of thhe peps on the server"""
    pep_data = _PEP_STORES.get_namespaces()
    return JSONResponse({
        'namespaces': pep_data
    })

@router.get("/view", summary="View a visual summary of the peps on the server", response_class=HTMLResponse)
async def pep_view(request: Request):
    """Returns HTML response with a visual summary of thhe peps on the server"""
    pep_data = _PEP_STORES.get_namespaces()
    return templates.TemplateResponse("pep.html", {
        'pep_data': pep_data, 
        'request': request,
        'peppy_version': peppy_version,
        'python_version': python_version()
    })