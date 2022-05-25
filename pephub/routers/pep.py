from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.templating import Jinja2Templates

from pephub.const import BASE_TEMPLATES_PATH
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

@router.get("/view", summary="View a visual summary of the peps on the server", response_class=HTMLResponse)
async def pep_view(request: Request):
    """Returns HTML response with a visual summary of thhe peps on the server"""
    pep_data = sorted([{
        'namespace': n,
        'n_projects': len(_PEP_STORES[n].keys()),
        'total_samples': sum(_PEP_STORES[n][p]['n_samples'] for p in _PEP_STORES[n])
    } for n in _PEP_STORES],
    key=lambda nspace: nspace['namespace'].lower()
    )
    return templates.TemplateResponse("pep.html", {
        'pep_data': pep_data, 
        'request': request,
        'peppy_version': peppy_version,
        'python_version': python_version()
    })