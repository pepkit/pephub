import jinja2
from fastapi import APIRouter, Depends
from platform import python_version
from starlette.responses import FileResponse 
from starlette.requests import Request
from starlette.templating import Jinja2Templates
from ..const import BASE_TEMPLATES_PATH
import peppy

# load dependencies
from ..dependencies import *

templates = Jinja2Templates(directory=BASE_TEMPLATES_PATH)
je = jinja2.Environment(loader=jinja2.FileSystemLoader(BASE_TEMPLATES_PATH))

router = APIRouter(
    tags=["root"],
)

ALL_VERSIONS = {
    "peppy_version": peppy.__version__,
    "python_version": python_version(),
}

@router.get("/")
async def main(request: Request):
    templ_vars = {"request": request}
    return templates.TemplateResponse("index.html", dict(templ_vars, **ALL_VERSIONS))