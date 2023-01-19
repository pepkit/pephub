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
from ...helpers import get_project_sample_names
from ...const import BASE_TEMPLATES_PATH, DEFAULT_QDRANT_COLLECTION_NAME

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

views = APIRouter(tags=["views", "user interface", "interface"])


@views.get("/")
async def main(
    request: Request,
    session_info: dict = Depends(read_session_info),
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


@views.get("/search")
async def search_view(
    request: Request,
    query: str = "",
    collection_name: str = DEFAULT_QDRANT_COLLECTION_NAME,
    session_info=Depends(read_session_info),
):

    return templates.TemplateResponse(
        "search.html",
        {
            "request": request,
            "query": query,
            "collection_name": collection_name,
            "session_info": session_info,
            "logged_in": session_info is not None,
        },
    )


@views.get("/submit", dependencies=[Depends(verify_user_can_write_namespace)])
async def submit_pep_form(request: Request, session_info=Depends(read_session_info)):
    if session_info is not None:
        return templates.TemplateResponse(
            "submit.html",
            {
                "namespace": session_info["login"],
                "session_info": session_info,
                "logged_in": session_info is not None,
                "request": request,
                "peppy_version": peppy.__version__,
                "python_version": python_version(),
                "pephub_version": pephub_version,
            },
        )
    else:
        return RedirectResponse(url="/auth/login")


@views.get("/me")
def me(
    request: Request,
    user: Union[str, None] = Depends(get_user_from_session_info),
    session_info: dict = Depends(read_session_info),
    agent: PEPDatabaseAgent = Depends(get_db),
):
    """
    Display the user's profile page.
    """
    if session_info is None:
        return RedirectResponse(url="/auth/login")
    else:
        namespace_info = agent.namespace.get(query=user).results[0]
        projects = agent.annotation.get(namespace=user).results
        return templates.TemplateResponse(
            "profile.html",
            {
                "request": request,
                "session_info": session_info,
                "python_version": python_version(),
                "pephub_version": pephub_version,
                "logged_in": session_info is not None,
                "namespace_info": namespace_info,
                "projects": projects,
            },
        )


@views.get(
    "/{namespace}",
    summary="View a visual summary of a particular namespace.",
    response_class=HTMLResponse,
)
async def namespace_view(
    request: Request,
    namespace: str,
    user: str = Depends(get_user_from_session_info),
    session_info: dict = Depends(read_session_info),
    agent: PEPDatabaseAgent = Depends(get_db),
    user_orgs: List[str] = Depends(get_organizations_from_session_info),
):
    """Returns HTML response with a visual summary of the namespace."""
    try:
        nspace = agent.namespace.get(query=namespace).results[0]
    except IndexError:
        nspace = {
            "namespace": namespace,
            "number_of_projects": 0,
            "number_of_samples": 0,
        }

    return templates.TemplateResponse(
        "namespace.html",
        {
            # is this the right way to do this? Grab the first result?
            "namespace": nspace,
            "request": request,
            "peppy_version": peppy_version,
            "python_version": python_version(),
            "pephub_version": pephub_version,
            "logged_in": user is not None,
            "session_info": session_info,
            "orgs": user_orgs,
            "can_edit": user == namespace or namespace in user_orgs,
        },
    )


@views.get(
    "/{namespace}/{project}",
    summary="View a visual summary of a particular project.",
    response_class=HTMLResponse,
    dependencies=[Depends(verify_user_can_read_project)],
)
async def project_view(
    request: Request,
    namespace: str,
    tag: Optional[str] = DEFAULT_TAG,
    project: peppy.Project = Depends(get_project),
    project_annoatation: dict = Depends(get_project_annotation),
    session_info: dict = Depends(read_session_info),
    edit: bool = False,
):
    """
    Returns HTML response with a visual summary of the project.
    """
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
            "is_private": project.is_private,
            "description": project_annoatation.description,
            "last_update_date": project_annoatation.last_update_date,
            "submission_date": project_annoatation.submission_date,
        },
    )


@views.get(
    "/{namespace}/{project}/edit",
    summary="Enter the project editor page.",
    response_class=HTMLResponse,
    dependencies=[Depends(verify_user_can_write_project)],
)
async def project_edit(
    request: Request,
    namespace: str,
    tag: Optional[str] = DEFAULT_TAG,
    project: peppy.Project = Depends(get_project),
    project_annoatation: dict = Depends(get_project_annotation),
    session_info: dict = Depends(read_session_info),
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
        pep_version = "2.1.0"
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
            "peppy_version": peppy_version,
            "python_version": python_version(),
            "pephub_version": pephub_version,
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
@views.get("/{namespace}/{project}/samples/{sample_name}/")
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


@views.get("/{namespace}/{project}/deleted")
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
