import jinja2
from fastapi import APIRouter, Depends
from starlette.responses import HTMLResponse
from starlette.templating import Jinja2Templates
from ..const import BASE_TEMPLATES_PATH, STATICS_PATH

# fetch peps
from ..main import _PEP_STORES

# load dependencies
from ..dependencies import *

templates = Jinja2Templates(directory=BASE_TEMPLATES_PATH)
je = jinja2.Environment(loader=jinja2.FileSystemLoader(BASE_TEMPLATES_PATH))

router = APIRouter(
    tags=["root"]
)

@router.get("/")
async def main():
    return HTMLResponse(je.get_template("index.html").render())

@router.get("/pep-list", summary="Return list of all available PEPs")
async def return_all_peps():
    return _PEP_STORES

    
