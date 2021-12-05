import jinja2
from fastapi import APIRouter, Depends
from platform import python_version
from starlette.responses import HTMLResponse
from starlette.requests import Request
from starlette.templating import Jinja2Templates
from ..const import BASE_TEMPLATES_PATH, STATICS_PATH
import peppy

# fetch peps
from ..main import _PEP_STORES

# load dependencies
from ..dependencies import *

templates = Jinja2Templates(directory=BASE_TEMPLATES_PATH)
je = jinja2.Environment(loader=jinja2.FileSystemLoader(BASE_TEMPLATES_PATH))

router = APIRouter(
    tags=["root"]
)

ALL_VERSIONS = {
    "peppy_version": peppy.__version__,
    "python_version": python_version(),
}

@router.get("/")
async def main(request: Request):
    templ_vars = {"request": request}
    return templates.TemplateResponse("index.html", dict(templ_vars, **ALL_VERSIONS))

@router.get("/pep-list", summary="Return list of all available PEPs")
async def return_all_peps():
    return _PEP_STORES

    
