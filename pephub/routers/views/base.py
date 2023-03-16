import jinja2
import eido
import peppy

from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse, HTMLResponse
from starlette.templating import Jinja2Templates
from peppy import __version__ as peppy_version
from peppy.const import SAMPLE_RAW_DICT_KEY, CONFIG_KEY
from platform import python_version
from dotenv import load_dotenv

from ..._version import __version__ as pephub_version
from ...dependencies import *
from ...view_dependencies import *
from ...const import BASE_TEMPLATES_PATH

import pandas as pd

load_dotenv()

templates = Jinja2Templates(directory=BASE_TEMPLATES_PATH)
je = jinja2.Environment(loader=jinja2.FileSystemLoader(BASE_TEMPLATES_PATH))

ALL_VERSIONS = {
    "pephub_version": pephub_version,
    "peppy_version": peppy_version,
    "python_version": python_version(),
    "api_version": 1,
}

views = APIRouter(tags=["views"])


@views.get("/")
async def main(
    request: Request,
    session_info: dict = Depends(read_session_cookie),
):
    templ_vars = {"request": request}
    return templates.TemplateResponse(
        "index.html",
        dict(
            templ_vars,
            **ALL_VERSIONS,
            session_info=session_info,
            logged_in=session_info is not None,
            is_landing_page=True,
        ),
    )


@views.get("/login/success")
async def successful_login(request: Request, code: str):
    return templates.TemplateResponse(
        "login_success.html",
        {
            "request": request,
            "code": code,
        },
    )


@views.get("/login/device/success")
def login_success(request: Request):
    return templates.TemplateResponse(
        "login_success_default.html", {"request": request}
    )