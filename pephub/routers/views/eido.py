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
from ...const import EIDO_TEMPLATES_PATH


load_dotenv()

templates = Jinja2Templates(directory=EIDO_TEMPLATES_PATH)
je = jinja2.Environment(loader=jinja2.FileSystemLoader(EIDO_TEMPLATES_PATH))

ALL_VERSIONS = {
    "pephub_version": pephub_version,
    "peppy_version": peppy_version,
    "python_version": python_version(),
    "api_version": 1,
}

views = APIRouter(prefix="/eido", tags=["views", "user interface", "interface"])

@views.get("/schema/{namespace}/{project}", response_class=HTMLResponse)
async def get_schema(request: Request, namespace: str, project: str):
    """
    Takes namespace and project values for a schema endpoint
    and returns a custom validator HTML page.
    """
    # endpoint to schema.databio.org/...
    # like pipelines/ProseqPEP.yaml

    schema = eido.read_schema(f"http://schema.databio.org/{namespace}/{project}")

    return templates.TemplateResponse(
        "schema.html",
        {
            "request": request,
            "namespace": namespace,
            "project": project,
            "schema": schema,
        },
    )



@views.get("/schemas")
async def schemas(
    request: Request,
):
    templ_vars = {"request": request}
    return templates.TemplateResponse(
        "schemas.html",
        dict(
            templ_vars,
            **ALL_VERSIONS,
            is_landing_page=True,
        ),
    )