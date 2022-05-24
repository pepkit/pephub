from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.templating import Jinja2Templates

from pephub.const import BASE_TEMPLATES_PATH

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
    
    return templates.TemplateResponse("pep.html", {'pep_stores': _PEP_STORES, 'request': request})