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
    project: peppy.Project = Depends(get_project),
    project_annoatation: dict = Depends(get_project_annotation),
    session_info: dict = Depends(read_session_info),
    edit: bool = False,
):
    """Returns HTML response with a visual summary of the project."""

    samples = [s.to_dict() for s in project.samples]
    try:
        pep_version = project.pep_version
    except Exception:
        pep_version = "2.1.0"
    return templates.TemplateResponse(
        "project.html",
        {
            "namespace": namespace,
            "project": project,
            "tag": tag,
            "project_dict": project.to_dict(),
            "pep_version": pep_version,
            "sample_table_columns": project.sample_table.columns.to_list(),
            "samples": samples,
            "n_samples": len(samples),
            "request": request,
            "peppy_version": peppy_version,
            "python_version": python_version(),
            "pephub_version": pephub_version,
            "filters": eido.get_available_pep_filters(),
            "logged_in": session_info is not None,
            "is_editing": edit,
            "session_info": session_info,
            "is_private": project_annoatation.is_private,
            "description": project_annoatation.description,
            "last_update": project_annoatation.last_update,
        },
    )


@project.get(
    "/edit",
    summary="Enter the project editor page.",
    response_class=HTMLResponse,
)
async def project_edit(
    request: Request,
    namespace: str,
    tag: str = None,
    project: peppy.Project = Depends(get_project),
    project_annoatation: dict = Depends(get_project_annotation),
    session_info: dict = Depends(read_session_info),
    edit: bool = False,
):
    """
    Returns page to let you edit a project.
    """
    if session_info is None or session_info["login"] != namespace:
        raise HTTPException(
            status_code=403, detail="You are not allowed to edit this project."
        )

    samples = [s.to_dict() for s in project.samples]
    try:
        pep_version = project.pep_version
    except Exception:
        pep_version = "2.1.0"
    return templates.TemplateResponse(
        "edit_project.html",
        {
            "namespace": namespace,
            "project": project,
            "tag": tag,
            "project_dict": project.to_dict(),
            "pep_version": pep_version,
            "sample_table_columns": project.sample_table.columns.to_list(),
            "samples": samples,
            "request": request,
            "peppy_version": peppy_version,
            "python_version": python_version(),
            "pephub_version": pephub_version,
            "logged_in": session_info is not None,
            "is_editing": edit,
            "session_info": session_info,
            "is_private": project_annoatation.is_private,
            "description": project_annoatation.description,
            "last_update": project_annoatation.last_update,
            "sample_table_csv": project.sample_table.to_csv(),
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


@project.get("/deleted")
async def deleted_pep(
    request: Request,
    session_info: dict = Depends(read_session_info),
    namespaces: List[str] = Depends(get_namespaces),
):
    templ_vars = {"request": request}
    return templates.TemplateResponse(
        "successful_delete.html",
        dict(
            templ_vars,
            **ALL_VERSIONS,
            namespaces=namespaces,
            session_info=session_info,
            logged_in=session_info is not None,
        ),
    )
