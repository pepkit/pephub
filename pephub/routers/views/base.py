import jinja2
from fastapi import APIRouter, Request
from starlette.templating import Jinja2Templates
from peppy import __version__ as peppy_version
from platform import python_version
from dotenv import load_dotenv

from ..._version import __version__ as pephub_version
from ...dependencies import *
from ...const import BASE_TEMPLATES_PATH


load_dotenv()

templates = Jinja2Templates(directory=BASE_TEMPLATES_PATH)
je = jinja2.Environment(loader=jinja2.FileSystemLoader(BASE_TEMPLATES_PATH))

ALL_VERSIONS = {
    "pephub_version": pephub_version,
    "peppy_version": peppy_version,
    "python_version": python_version(),
    "api_version": 1,
}

views = APIRouter(tags=["views", "user interface", "interface"])


@views.get("/")
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
            logged_in=session_info is not None,
            is_landing_page=True,
        ),
    )
