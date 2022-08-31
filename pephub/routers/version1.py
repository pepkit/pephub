import jinja2
from fastapi import APIRouter, Depends
from platform import python_version
from starlette.requests import Request
from starlette.templating import Jinja2Templates

from .._version import __version__ as pephub_version
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
    "pephub_version": pephub_version,
    "peppy_version": peppy.__version__,
    "python_version": python_version(),
}


@router.get("/")
async def main(request: Request, db: Connection = Depends(get_db)):
    templ_vars = {"request": request}
    namespaces = db.get_namespaces_info_by_list()
    return templates.TemplateResponse(
        "index.html",
        dict(
            templ_vars,
            **ALL_VERSIONS,
            namespaces=namespaces,
        ),
    )

@router.get("/_version")
async def version():
    return dict(**ALL_VERSIONS)

# @router.get("/pep-list")
# async def pep_list():
#     namespaces = _PEP_STORES.get_namespaces()
#     return [
#         dict(
#             **n,
#             projects=_PEP_STORES.get_projects(n['name']))
#             for n in namespaces
#     ]
