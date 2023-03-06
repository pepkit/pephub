import peppy
import eido
import pandas as pd
from peppy.const import SAMPLE_RAW_DICT_KEY, CONFIG_KEY, PEP_LATEST_VERSION
from typing import List, Optional
from fastapi import APIRouter, Request, Depends, Response, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from ...dependencies import get_project
from ...view_dependencies import (
    read_session_cookie,
    get_user_from_session_info,
    get_organizations_from_session_info,
    verify_user_can_read_project,
    get_project_annotation,
)

from ...helpers import get_project_sample_names
from ...const import BASE_TEMPLATES_PATH, DEFAULT_TAG, ALL_VERSIONS
from ..models import AnnotationModel

templates = Jinja2Templates(directory=BASE_TEMPLATES_PATH)

project = APIRouter(tags=["project", "user interface", "interface"])


@project.get(
    "/{namespace}/{project}",
    summary="View a visual summary of a particular project.",
    response_class=HTMLResponse,
    dependencies=[Depends(verify_user_can_read_project)],
)
async def project_view(
    request: Request,
    namespace: str,
    project: str,
    tag: Optional[str] = DEFAULT_TAG,
    peppy_project: peppy.Project = Depends(get_project),
    project_annotation: AnnotationModel = Depends(get_project_annotation),
    session_info: dict = Depends(read_session_cookie),
    user: str = Depends(get_user_from_session_info),
    user_orgs: List[str] = Depends(get_organizations_from_session_info),
    edit: bool = False,
):
    """
    Returns HTML response with a visual summary of the project.
    """
    samples = [s.to_dict() for s in peppy_project.samples]
    try:
        pep_version = project.pep_version
    except Exception:
        pep_version = PEP_LATEST_VERSION
    return templates.TemplateResponse(
        "project.html",
        {
            "namespace": namespace,
            "project": project,
            "tag": tag,
            "project_dict": peppy_project.to_dict(),
            "pep_version": pep_version,
            "sample_table_columns": peppy_project.sample_table.columns.to_list(),
            "samples": samples,
            "n_samples": len(samples),
            "request": request,
            "peppy_version": ALL_VERSIONS["peppy_version"],
            "python_version": ALL_VERSIONS["python_version"],
            "pephub_version": ALL_VERSIONS["pephub_version"],
            "filters": eido.get_available_pep_filters(),
            "logged_in": session_info is not None,
            "is_editing": edit,
            "session_info": session_info,
            "is_private": peppy_project.is_private,
            "description": project_annotation.description,
            "last_update_date": project_annotation.last_update_date,
            "submission_date": project_annotation.submission_date,
            "digest": project_annotation.digest,
            "can_edit": user == namespace or namespace in user_orgs,
        },
    )


@project.get(
    "/{namespace}/{project}/edit",
    summary="Enter the project editor page.",
    response_class=HTMLResponse,
)
async def project_edit(
    request: Request,
    namespace: str,
    tag: Optional[str] = DEFAULT_TAG,
    project: peppy.Project = Depends(get_project),
    project_annoatation: AnnotationModel = Depends(get_project_annotation),
    session_info: dict = Depends(read_session_cookie),
    edit: bool = False,
):
    """
    Returns page to let you edit a project.
    """
    samples = [s.to_dict() for s in project.samples]
    raw_prj = project.to_dict(extended=True)
    project_pd = pd.DataFrame(raw_prj[SAMPLE_RAW_DICT_KEY])
    project_csv = project_pd.to_csv(index=False)
    project_col = list(project_pd.columns)
    project_yaml = project[CONFIG_KEY].to_yaml()

    try:
        pep_version = project.pep_version
    except Exception:
        pep_version = PEP_LATEST_VERSION
    return templates.TemplateResponse(
        "edit_project.html",
        {
            "namespace": namespace,
            "project": project,
            "tag": tag,
            "project_dict": project.to_dict(extended=True),
            "pep_version": pep_version,
            "sample_table_columns": project_col,
            "samples": samples,
            "request": request,
            "peppy_version": ALL_VERSIONS["peppy_version"],
            "python_version": ALL_VERSIONS["python_version"],
            "pephub_version": ALL_VERSIONS["pephub_version"],
            "logged_in": session_info is not None,
            "is_editing": edit,
            "session_info": session_info,
            "is_private": project_annoatation.is_private,
            "description": project_annoatation.description or "",
            "last_update": project_annoatation.last_update_date,
            "sample_table_csv": project_csv,
            "project_config_yaml": project_yaml,
        },
    )


# display a view for a specific sample
@project.get("/{namespace}/{project}/samples/{sample_name}/")
async def get_sample_view(
    request: Request,
    namespace: str,
    project: str,
    sample_name: str,
    tag: Optional[str] = DEFAULT_TAG,
    proj: peppy.Project = Depends(get_project),
    session_info: dict = Depends(read_session_cookie),
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
            "tag": tag,
            "attrs": attrs,
            "request": request,
            "namespace": namespace,
            "project_name": project,
            "peppy_version": ALL_VERSIONS["peppy_version"],
            "python_version": ALL_VERSIONS["python_version"],
            "pephub_version": ALL_VERSIONS["pephub_version"],
            "logged_in": session_info is not None,
            "session_info": session_info,
        },
    )


@project.get("/{namespace}/{project}/deleted")
async def deleted_pep(
    request: Request,
    session_info: dict = Depends(read_session_cookie),
):
    namespaces = session_info["orgs"] + [session_info["login"]]
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
