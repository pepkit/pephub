from platform import python_version

import jinja2
import requests
import yaml
from dotenv import load_dotenv
from fastapi import APIRouter, Request
from fastapi.exceptions import HTTPException
from fastapi.responses import HTMLResponse
from starlette.templating import Jinja2Templates

from ..._version import __version__ as pephub_version
from ...const import EIDO_TEMPLATES_PATH, peprs_version

load_dotenv()

templates = Jinja2Templates(directory=EIDO_TEMPLATES_PATH)
je = jinja2.Environment(loader=jinja2.FileSystemLoader(EIDO_TEMPLATES_PATH))

ALL_VERSIONS = {
    "pephub_version": pephub_version,
    "peprs_version": peprs_version,
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

    # peprs.eido has no read_schema helper, so fetch and parse the YAML directly.
    try:
        resp = requests.get(f"http://schema.databio.org/{namespace}/{project}")
        resp.raise_for_status()
        schema = yaml.safe_load(resp.text)
    except Exception:
        raise HTTPException(status_code=404, detail="Schema not found")

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
