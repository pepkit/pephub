import jinja2
import eido
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from starlette.templating import Jinja2Templates
from peppy import __version__ as peppy_version
from platform import python_version
from dotenv import load_dotenv

from ..._version import __version__ as pephub_version
from ...dependencies import *
from ...const import BASE_TEMPLATES_PATH
from ...helpers import get_project_sample_names


load_dotenv()

templates = Jinja2Templates(directory=BASE_TEMPLATES_PATH)
je = jinja2.Environment(loader=jinja2.FileSystemLoader(BASE_TEMPLATES_PATH))

ALL_VERSIONS = {
    "pephub_version": pephub_version,
    "peppy_version": peppy_version,
    "python_version": python_version(),
    "api_version": 1,
}

project = APIRouter(
    prefix="/{namespace}/{project}",
    tags=["views", "user interface", "interface", "projects", "PEP"],
)


@project.get(
    "/",
    summary="View a visual summary of a particular project.",
    response_class=HTMLResponse,
)
async def project_view(
    request: Request,
    namespace: str,
    tag: str = None,
    proj: peppy.Project = Depends(get_project),
    session_info: dict = Depends(read_session_info),
    edit: bool = False,
):
    """Returns HTML response with a visual summary of the project."""

    samples = [s.to_dict() for s in proj.samples]
    try:
        pep_version = proj.pep_version
    except Exception:
        pep_version = "2.1.0"
    return templates.TemplateResponse(
        "project.html",
        {
            "namespace": namespace,
            "project": proj,
            "tag": tag,
            "project_dict": proj.to_dict(),
            "pep_version": pep_version,
            "sample_table_columns": proj.sample_table.columns.to_list(),
            "samples": samples,
            "n_samples": len(samples),
            "request": request,
            "peppy_version": peppy_version,
            "python_version": python_version(),
            "pephub_version": pephub_version,
            "filters": eido.get_available_pep_filters(),
            "logged_in": session_info is not None,
            "session_info": session_info,
        },
    )


# display a view for a specific sample
@project.get("/samples/{sample_name}/")
async def get_sample_view(
    request: Request,
    namespace: str,
    project: str,
    sample_name: str,
    proj: peppy.Project = Depends(get_project),
    session_info: dict = Depends(read_session_info),
):
    """Returns HTML response with a visual summary of the sample."""
    if sample_name not in get_project_sample_names(proj):
        raise HTTPException(status_code=404, detail=f"sample '{sample_name}' not found")
    sample = proj.get_sample(sample_name)
    attrs = sample._attributes
    return templates.TemplateResponse(
        "sample.html",
        {
            "project": proj,
            "sample": sample,
            "attrs": attrs,
            "request": request,
            "namespace": namespace,
            "project_name": project,
            "peppy_version": peppy_version,
            "python_version": python_version(),
            "pephub_version": pephub_version,
            "logged_in": session_info is not None,
        },
    )
