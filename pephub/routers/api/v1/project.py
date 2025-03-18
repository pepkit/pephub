import logging
from typing import Annotated, Any, Callable, Dict, List, Optional, Union

import eido
import numpy as np
import pandas as pd
import peppy
import yaml
from dotenv import load_dotenv
from fastapi import APIRouter, Body, Depends, Query
from fastapi.exceptions import HTTPException
from fastapi.responses import JSONResponse, PlainTextResponse, FileResponse
from pepdbagent import PEPDatabaseAgent
from pepdbagent.exceptions import (
    ProjectNotFoundError,
    ProjectUniqueNameError,
    SampleAlreadyExistsError,
    SampleAlreadyInView,
    SampleNotFoundError,
    SampleNotInViewError,
    ViewAlreadyExistsError,
    ViewNotFoundError,
    HistoryNotFoundError,
)
from pepdbagent.models import (
    AnnotationList,
    AnnotationModel,
    CreateViewDictModel,
    ProjectViews,
    HistoryAnnotationModel,
)
from peppy.const import SAMPLE_DF_KEY, SAMPLE_RAW_DICT_KEY

# from ....const import SAMPLE_CONVERSION_FUNCTIONS
from ....dependencies import (
    DEFAULT_TAG,
    get_config,
    get_db,
    get_namespace_access_list,
    get_project,
    get_project_annotation,
    get_subsamples,
    verify_user_can_fork,
    verify_user_can_read_project,
    get_user_from_session_info,
)
from ....helpers import zip_conv_result, zip_pep
from ...models import (
    ForkRequest,
    ProjectOptional,
    ProjectRawModel,
    ProjectRawRequest,
    ProjectHistoryResponse,
    SamplesResponseModel,
    ConfigResponseModel,
    StandardizerResponse,
)
from ....const import (
    MAX_PROCESSED_PROJECT_SIZE,
    BEDMS_REPO_URL,
    MAX_STANDARDIZED_PROJECT_SIZE,
)
from .helpers import verify_updated_project

# from bedms import AttrStandardizer

_LOGGER = logging.getLogger(__name__)

load_dotenv()

projects = APIRouter(
    prefix="/api/v1/projects",
    tags=["projects"],
)
project = APIRouter(
    prefix="/api/v1/projects/{namespace}/{project}",
    tags=["project"],
    dependencies=[Depends(verify_user_can_read_project)],
)


@projects.get(
    "",
    summary="Get list of annotations for list of projects",
    response_model=AnnotationList,
)
async def get_namespace_projects_list(
    namespace_access: List[str] = Depends(get_namespace_access_list),
    agent: PEPDatabaseAgent = Depends(get_db),
    registry_paths: Annotated[str, Query()] = None,
):
    paths = registry_paths.split(",") if registry_paths else None
    if paths is None:
        raise HTTPException(
            status_code=400,
            detail="Please provide a list of registry paths to fetch annotations for.",
        )
    return agent.annotation.get_by_rp_list(registry_paths=paths, admin=namespace_access)


@project.get(
    "",
    summary="Fetch a PEP",
    response_model=ProjectRawRequest,
    response_model_by_alias=False,
)
async def get_a_pep(
    proj: dict = Depends(get_project),
):
    """
    Fetch a PEP from a certain namespace

    Don't have a namespace or project?

    Use the following:

        project: example
        namespace: databio

    """
    try:
        raw_project = ProjectRawModel(**proj)
        return raw_project
    except Exception:
        raise HTTPException(500, "Unexpected project error!")


@project.patch(
    "",
    summary="Update a PEP",
)
async def update_pep(
    namespace: str,
    project: str,
    updated_project: ProjectOptional,
    tag: Optional[str] = DEFAULT_TAG,
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
    user_name: Optional[str] = Depends(get_user_from_session_info),
):
    """
    Update a PEP from a certain namespace

    Don't have a namespace or project?

    Use the following:

        project: example
        namespace: databio
    """
    if namespace not in (list_of_admins or []):
        raise HTTPException(
            detail="You do not have permission to update this project.",
            status_code=401,
        )

    # run the validation if either the sample table or project config is updated
    if any(
        [
            updated_project.project_config_yaml,
            updated_project.sample_table,
            updated_project.subsample_tables,
        ]
    ):
        new_project = await verify_updated_project(updated_project)
    else:
        new_project = None

    update_dict = updated_project.model_dump(
        exclude_unset=True,
        exclude={"sample_table", "project_config_yaml", "subsample_tables"},
    )
    if new_project:
        update_dict.update(project=new_project)
        try:
            new_name = new_project.name or project
        except NotImplementedError:
            new_name = new_project.name = project
    else:
        new_name = project
    agent.project.update(
        update_dict=update_dict,
        namespace=namespace,
        name=project,
        tag=tag,
        user=user_name,
    )

    # fetch latest name and tag
    tag = updated_project.tag or tag

    return JSONResponse(
        content={
            "message": "PEP updated",
            "registry": f"{namespace}/{new_name}:{tag}",
            "api_endpoint": f"/api/v1/namespaces/{namespace}/{new_name}?tag={tag}",
            "project": updated_project.model_dump(),
        },
        status_code=202,
    )


@project.delete("", summary="Delete a PEP")
async def delete_a_pep(
    namespace: str,
    project: str,
    tag: Optional[str] = DEFAULT_TAG,
    agent: PEPDatabaseAgent = Depends(get_db),
):
    """
    Delete a PEP from a certain namespace
    """
    proj = agent.project.exists(namespace, project, tag=tag)

    if not proj:
        raise HTTPException(
            status_code=404, detail=f"Project {namespace}/{project}:{tag} not found"
        )

    try:
        agent.project.delete(namespace, project, tag=tag)
        return JSONResponse(
            content={
                "message": "PEP deleted.",
                "registry": f"{namespace}/{project}:{tag}",
            },
            status_code=202,
        )

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not delete PEP. Server error: {e}",
        )


@project.get("/samples", response_model=Union[SamplesResponseModel, str, list, dict])
async def get_pep_samples(
    proj: dict = Depends(get_project),
    format: Optional[str] = None,
    raw: Optional[bool] = True,
):
    """
    Get samples from a certain project and namespace

    Don't have a namespace or project?

    Use the following:

        project: example
        namespace: databio


    To convert project use format parameter. Available formats are: basic, csv, yaml, json
    """

    AVALIABLE_FORMATS = ["basic", "csv", "yaml", "json"]

    if format:

        if format not in AVALIABLE_FORMATS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid format '{format}'. Valid formats are: {AVALIABLE_FORMATS}",
            )

        if isinstance(proj, dict):
            if len(proj["_sample_dict"]) > MAX_PROCESSED_PROJECT_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail=f"Project is too large. View raw samples, or create a view. Limit is {MAX_PROCESSED_PROJECT_SIZE} samples.",
                )
            proj = peppy.Project.from_dict(proj)

        if format == "json":
            return {
                "samples": [sample.to_dict() for sample in proj.samples],
            }
        elif format == "csv":
            return eido.convert_project(proj, "csv")["samples"]
        elif format == "yaml":
            return eido.convert_project(proj, "yaml-samples")["samples"]
        elif format == "basic":
            return eido.convert_project(proj, "basic")

    if raw:
        df = pd.DataFrame(proj[SAMPLE_RAW_DICT_KEY])
        return SamplesResponseModel(
            count=df.shape[0],
            items=df.replace({np.nan: None}).to_dict(orient="records"),
        )
    if isinstance(proj, dict):
        if len(proj["_sample_dict"]) > MAX_PROCESSED_PROJECT_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"Project is too large. View raw samples, or create a view. Limit is {MAX_PROCESSED_PROJECT_SIZE} samples.",
            )
        proj = peppy.Project.from_dict(proj)
    return [sample.to_dict() for sample in proj.samples]


@project.get("/config", summary="Get project configuration file")
async def get_pep_config(
    config: dict = Depends(get_config),
):
    """
    Get project configuration file from a certain project and namespace

    Use the following:

        project: example
        namespace: databio
        tag: default
    """
    return ConfigResponseModel(
        config=yaml.dump(config, sort_keys=False),
    )


@project.get(
    "/samples/{sample_name}",
    summary="Get a particular sample",
)
async def get_sample(
    namespace: str,
    project: str,
    sample_name: str,
    tag: Optional[str] = DEFAULT_TAG,
    raw: Optional[bool] = True,
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
    proj_annotation: AnnotationModel = Depends(get_project_annotation),
):
    """
    Get a particular sample from a certain project and namespace

    Don't have a sample name, namespace, or project?

    Use the following:

        sample_name: 4-1_11102016
        project: example
        namespace: databio
    """
    if proj_annotation.is_private and namespace not in list_of_admins:
        raise HTTPException(
            detail="Project does not exist.",
            status_code=404,
        )
    try:
        if raw:
            sample_dict = agent.sample.get(
                namespace, project, tag=tag, sample_name=sample_name, raw=True
            )
        else:
            sample_dict = agent.sample.get(
                namespace, project, tag=tag, sample_name=sample_name, raw=False
            ).to_dict()

        return sample_dict
    except SampleNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"Sample '{sample_name}' not found in project '{namespace}/{project}:{tag}'",
        )


@project.patch(
    "/samples/{sample_name}",
    summary="Update particular sample in a project",
)
async def update_sample(
    namespace: str,
    project: str,
    sample_name: str,
    tag: Optional[str] = DEFAULT_TAG,
    update_dict: dict = Body(...),
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
):
    """
    Update a particular sample from a certain project and namespace.
    """
    if namespace not in list_of_admins:
        raise HTTPException(
            detail="Sample does not exist, or you do not have permission to update this sample.",
            status_code=404,
        )
    try:
        agent.sample.update(
            namespace,
            name=project,
            tag=tag,
            sample_name=sample_name,
            update_dict=update_dict,
        )
        return JSONResponse(
            content={
                "message": "Sample updated.",
                "registry": f"{namespace}/{project}:{tag}",
            },
            status_code=202,
        )
    except SampleNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Sample does not exist, or you do not have permission to update this sample.",
        )


@project.post(
    "/samples/{sample_name}",
    summary="Upload sample to a project",
)
async def upload_sample(
    namespace: str,
    project: str,
    tag: Optional[str] = DEFAULT_TAG,
    sample_dict: dict = Body(...),
    overwrite: Optional[bool] = False,
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
):
    """
    Upload a particular sample to a certain project and namespace.
    """
    if namespace not in list_of_admins:
        raise HTTPException(
            detail="You do not have permission to upload this sample.",
            status_code=401,
        )
    try:
        agent.sample.add(
            namespace,
            name=project,
            tag=tag,
            sample_dict=sample_dict,
            overwrite=overwrite,
        )
        return JSONResponse(
            content={
                "message": "Sample uploaded successfully.",
                "registry": f"{namespace}/{project}:{tag}",
            },
            status_code=202,
        )

    except SampleAlreadyExistsError:
        raise HTTPException(
            status_code=409,
            detail="Sample already exists in project. Use 'overwrite' parameter to overwrite.",
        )

    except Exception as _:
        raise HTTPException(
            status_code=400,
            detail="Could not upload sample. Server error!",
        )


@project.delete(
    "/samples/{sample_name}",
    summary="Delete sample from the project",
)
async def delete_sample(
    namespace: str,
    project: str,
    sample_name: str,
    tag: Optional[str] = DEFAULT_TAG,
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
):
    """
    Delete a particular sample from a certain project and namespace.
    """
    if namespace not in list_of_admins:
        raise HTTPException(
            detail="You do not have permission to delete this sample.",
            status_code=401,
        )
    try:
        agent.sample.delete(namespace, name=project, tag=tag, sample_name=sample_name)
        return JSONResponse(
            content={
                "message": "Sample deleted successfully.",
                "registry": f"{namespace}/{project}:{tag}",
            },
            status_code=202,
        )
    except SampleNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Sample not found in project.",
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Could not delete sample. Server error!",
        )


@project.get("/subsamples", response_model=SamplesResponseModel)
async def get_subsamples_endpoint(
    subsamples: peppy.Project = Depends(get_subsamples),
    download: bool = False,
):
    """
    Get subsamples from a certain project and namespace

    Don't have a namespace, or project?

    Use the following:

        project: example
        namespace: databio
    """

    if subsamples:
        try:
            subsamples = pd.DataFrame(
                subsamples[0]
            )  # TODO: update this enpoint, so that it has access to all subsample tables
        except IndexError:
            subsamples = pd.DataFrame()
        if download:
            return subsamples.to_csv()
        else:
            return SamplesResponseModel(
                count=subsamples.shape[0],
                items=subsamples.to_dict(orient="records"),
            )

    else:
        return SamplesResponseModel(
            count=0,
            items=[],
        )


@project.get("/convert")
async def convert_pep(
    proj: dict = Depends(get_project),
    filter: Optional[str] = "basic",
    format: Optional[str] = "plain",
):
    """
    Convert a PEP to a specific format, f. For a list of available formats/filters,
    see /eido/filters.

    See, http://eido.databio.org/en/latest/filters/#convert-a-pep-into-an-alternative-format-with-a-filter
    for more information.

    Don't have a namespace, or project?

    Use the following:

        project: example
        namespace: databio

    """
    # default to basic
    if filter is None:
        filter = "basic"  # default to basic

    # validate filter exists
    filter_list = eido.get_available_pep_filters()
    if filter not in filter_list:
        raise HTTPException(
            400, f"Unknown filter '{filter}'. Available filters: {filter_list}"
        )

    # generate result
    peppy_project = peppy.Project.from_dict(proj)
    conv_result = eido.run_filter(peppy_project, filter, verbose=False)

    if format == "plain":
        return_str = "\n".join([conv_result[k] for k in conv_result])
        resp_obj = PlainTextResponse(return_str)
    elif format == "json":
        resp_obj = JSONResponse(conv_result)
    else:
        resp_obj = zip_conv_result(conv_result)  # returns zip file in Response() object

    return resp_obj


@project.get("/zip", response_class=FileResponse)
async def zip_pep_for_download(proj: Dict[str, Any] = Depends(get_project)):
    """
    Zip a pep

    Don't have a namespace, or project?

    Use the following:

        project: example
        namespace: databio

    """
    return zip_pep(proj)


@project.post(
    "/forks",
    summary="Fork project to user namespace.",
    dependencies=[Depends(verify_user_can_fork)],
)
async def fork_pep_to_namespace(
    fork_request: ForkRequest,
    proj_annotation: AnnotationModel = Depends(get_project_annotation),
    agent: PEPDatabaseAgent = Depends(get_db),
    description: Optional[str] = "",
    private: Optional[bool] = False,
):
    """
    Fork a project for a particular namespace you have write access to.

    Don't know your namespace and/project? Log in to see.

    """
    fork_to = fork_request.fork_to
    fork_name = fork_request.fork_name
    fork_tag = fork_request.fork_tag
    try:
        agent.project.fork(
            original_namespace=proj_annotation.namespace,
            original_name=proj_annotation.name,
            original_tag=proj_annotation.tag,
            fork_namespace=fork_to,
            fork_name=fork_name,
            fork_tag=fork_tag,
            description=description or proj_annotation.description,
            private=private or proj_annotation.is_private,
        )

    except ProjectUniqueNameError as _:
        raise HTTPException(
            status_code=400,
            detail=f"Project '{fork_to}/{fork_name}:{fork_tag}' already exists in namespace",
        )

    return JSONResponse(
        content={
            "namespace": fork_to,
            "project_name": fork_name,
            "tag": fork_tag,
            "registry_path": f"{fork_to}/{fork_name}:{fork_tag}",
        },
        status_code=202,
    )


@project.get("/annotation", response_model=AnnotationModel)
async def get_project_annotation(
    proj_annotation: AnnotationModel = Depends(get_project_annotation),
):
    """
    Get project annotation from a certain project and namespace
    """
    return proj_annotation


#### Views ####
@project.get(
    "/views",
    summary="get list of views for a project",
    tags=["views"],
    response_model=ProjectViews,
)
def get_views(
    namespace: str,
    project: str,
    tag: str = DEFAULT_TAG,
    agent: PEPDatabaseAgent = Depends(get_db),
):
    return agent.view.get_views_annotation(namespace, project, tag=tag)


@project.get(
    "/views/{view}",
    summary="Fetch a project view",
    response_model=Union[ProjectRawModel, dict],
    tags=["views"],
)
async def get_view_of_the_project(
    namespace: str,
    project: str,
    view: str,
    tag: str = DEFAULT_TAG,
    raw: bool = True,
    agent: PEPDatabaseAgent = Depends(get_db),
):
    """
    Fetch a view of the project.
    """
    try:
        if raw:
            return ProjectRawModel(
                **agent.view.get(
                    namespace=namespace,
                    name=project,
                    view_name=view,
                    tag=tag,
                    raw=raw,
                )
            )
        else:
            return agent.view.get(
                namespace=namespace,
                name=project,
                view_name=view,
                tag=tag,
                raw=raw,
            ).to_dict()
    except ViewNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"View '{view}' not found in project '{namespace}/{project}:{tag}'",
        )


@project.post(
    "/views/{view}",
    summary="Create a view",
    tags=["views"],
)
async def create_view_of_the_project(
    namespace: str,
    project: str,
    view: str,
    tag: str = DEFAULT_TAG,
    description: str = "",
    sample_names: List[str] = None,
    no_fail: bool = False,
    namespace_access_list: List[str] = Depends(get_namespace_access_list),
    agent: PEPDatabaseAgent = Depends(get_db),
):
    """
    Create a view of the project.
    """
    if namespace not in namespace_access_list:
        raise HTTPException(
            detail="You do not have permission to create this view.",
            status_code=401,
        )
    try:
        agent.view.create(
            view_name=view,
            no_fail=no_fail,
            description=description,
            view_dict=CreateViewDictModel(
                project_namespace=namespace,
                project_name=project,
                project_tag=tag,
                sample_list=sample_names,
            ),
        )
    except SampleNotFoundError as e:
        raise HTTPException(
            status_code=404,
            detail=f"Sample '{e}' not found in project '{namespace}/{project}:{tag}'",
        )
    except ProjectNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"Project '{namespace}/{project}:{tag}' not found",
        )
    except ViewAlreadyExistsError as e:
        _LOGGER.error(f"Could not create view. Error: {e}")
        raise HTTPException(
            status_code=409,
            detail="A view with this name already exists in the project.",
        )
    return JSONResponse(
        content={
            "message": "View created successfully.",
            "registry": f"{namespace}/{project}:{tag}",
        },
        status_code=202,
    )


@project.get(
    "/views/{view}/zip",
    summary="Zip a view",
    tags=["views"],
    response_class=FileResponse,
)
async def zip_view_of_the_view(
    namespace: str,
    project: str,
    view: str,
    tag: str = DEFAULT_TAG,
    agent: PEPDatabaseAgent = Depends(get_db),
):
    """
    Zip a view of the project.
    """
    return zip_pep(
        agent.view.get(
            namespace=namespace,
            name=project,
            view_name=view,
            tag=tag,
            raw=False,
        )
    )


@project.post(
    "/views/{view}/{sample_name}",
    summary="Add sample to the view",
    tags=["views"],
)
async def add_sample_to_view(
    namespace: str,
    project: str,
    view: str,
    sample_name: str,
    tag: str = DEFAULT_TAG,
    namespace_access_list: List[str] = Depends(get_namespace_access_list),
    agent: PEPDatabaseAgent = Depends(get_db),
):
    if namespace not in namespace_access_list:
        raise HTTPException(
            detail="You do not have permission to add sample to this view.",
            status_code=401,
        )
    try:
        agent.view.add_sample(
            namespace=namespace,
            name=project,
            tag=tag,
            view_name=view,
            sample_name=sample_name,
        )
    except SampleAlreadyInView:
        raise HTTPException(
            status_code=409,
            detail=f"Sample '{sample_name}' already in view '{view}'",
        )
    except SampleNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"Sample '{sample_name}' not found in project '{namespace}/{project}:{tag}'",
        )
    return JSONResponse(
        content={
            "message": "Sample added to view successfully.",
            "registry": f"{namespace}/{project}:{tag}",
        },
        status_code=202,
    )


@project.delete(
    "/views/{view}/{sample_name}",
    summary="Delete sample from the view",
    tags=["views"],
)
def delete_sample_from_view(
    namespace: str,
    project: str,
    view: str,
    sample_name: str,
    tag: str = DEFAULT_TAG,
    namespace_access_list: List[str] = Depends(get_namespace_access_list),
    agent: PEPDatabaseAgent = Depends(get_db),
):
    if namespace not in namespace_access_list:
        raise HTTPException(
            detail="You do not have permission to delete sample from this view.",
            status_code=401,
        )
    try:
        agent.view.remove_sample(
            namespace=namespace,
            name=project,
            tag=tag,
            view_name=view,
            sample_name=sample_name,
        )
    except SampleNotInViewError:
        raise HTTPException(
            status_code=404,
            detail=f"Sample '{sample_name}' not found in view '{view}'",
        )
    except ViewNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"View '{view}' not found in project '{namespace}/{project}:{tag}'",
        )
    return JSONResponse(
        content={
            "message": "Sample deleted from view successfully.",
            "registry": f"{namespace}/{project}:{tag}",
        },
        status_code=202,
    )


@project.delete(
    "/views/{view}",
    summary="Delete a view",
    tags=["views"],
)
def delete_view(
    namespace: str,
    project: str,
    view: str,
    tag: str = DEFAULT_TAG,
    namespace_access_list: List[str] = Depends(get_namespace_access_list),
    agent: PEPDatabaseAgent = Depends(get_db),
):
    if namespace not in namespace_access_list:
        raise HTTPException(
            detail="You do not have permission to delete this view.",
            status_code=401,
        )
    try:
        agent.view.delete(
            project_namespace=namespace,
            project_name=project,
            project_tag=tag,
            view_name=view,
        )
    except ViewNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"View '{view}' not found in project '{namespace}/{project}:{tag}'",
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Could not delete view. Server error!",
        )
    return JSONResponse(
        content={
            "message": "View deleted successfully.",
            "registry": f"{namespace}/{project}:{tag}",
        },
        status_code=202,
    )


@project.get(
    "/history",
    summary="Get project history",
    response_model=HistoryAnnotationModel,
)
def get_project_history(
    namespace: str,
    project: str,
    tag: str = DEFAULT_TAG,
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
):
    """
    Get full project history
    """
    if namespace not in (list_of_admins or []):
        raise HTTPException(
            detail="History not found for this project",
            status_code=404,
        )
    return agent.project.get_history(namespace, project, tag=tag)


@project.get(
    "/history/{history_id}",
    summary="Get project history by id",
    response_model=ProjectHistoryResponse,
)
def get_project_history_by_id(
    namespace: str,
    project: str,
    history_id: int,
    tag: str = DEFAULT_TAG,
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
):
    """
    Get a project dict from history by id
    """
    if namespace not in (list_of_admins or []):
        raise HTTPException(
            detail="History not found",
            status_code=404,
        )
    try:
        project_at_history = agent.project.get_project_from_history(
            namespace,
            project,
            tag=tag,
            history_id=history_id,
            raw=True,
            with_id=True,
        )
        # convert the config to a yaml string
        project_at_history["_config"] = yaml.dump(project_at_history["_config"])
        return project_at_history

    except ProjectNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"Project '{namespace}/{project}:{tag}' not found",
        )
    except HistoryNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"History '{history_id}' not found in project '{namespace}/{project}:{tag}'",
        )


@project.delete(
    "/history/{history_id}",
    summary="delete project history by id",
    response_model=ProjectHistoryResponse,
)
def delete_project_history_by_id(
    namespace: str,
    project: str,
    history_id: int,
    tag: str = DEFAULT_TAG,
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
):
    """
    Delete a project from history by id
    """
    if namespace not in (list_of_admins or []):
        raise HTTPException(
            detail="History not found for this project",
            status_code=404,
        )
    try:
        agent.project.delete_history(namespace, project, tag=tag, history_id=history_id)
        return JSONResponse(
            content={
                "message": "History deleted.",
                "registry": f"{namespace}/{project}:{tag}",
            },
            status_code=202,
        )

    except Exception as _e:
        raise HTTPException(
            status_code=400,
            detail="Could not delete history. Server error.",
        )


@project.post(
    "/history/{history_id}/restore",
    summary="Restore project history by id",
)
def restore_project_history_by_id(
    namespace: str,
    project: str,
    history_id: int,
    tag: str = DEFAULT_TAG,
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
    user_name: Optional[str] = Depends(get_user_from_session_info),
):
    """
    Restore a project from history by id
    """
    if namespace not in (list_of_admins or []):
        raise HTTPException(
            detail="History not found for this project",
            status_code=404,
        )
    try:
        agent.project.restore(
            namespace,
            project,
            tag=tag,
            history_id=history_id,
            user=user_name,
        )
        return JSONResponse(
            content={
                "message": "Project restored.",
                "registry": f"{namespace}/{project}:{tag}",
            },
            status_code=202,
        )

    except ProjectNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"Project '{namespace}/{project}:{tag}' not found",
        )
    except HistoryNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"History '{history_id}' not found in project '{namespace}/{project}:{tag}'",
        )


@project.get(
    "/history/{history_id}/zip",
    summary="Zip a project history by id",
    response_class=FileResponse,
)
def get_zip_snapshot(
    namespace: str,
    project: str,
    history_id: int,
    tag: str = DEFAULT_TAG,
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
):
    """
    Get a project dict from history by id
    """
    if namespace not in (list_of_admins or []):
        raise HTTPException(
            detail="History not found",
            status_code=404,
        )
    try:

        return zip_pep(
            agent.project.get_project_from_history(
                namespace,
                project,
                tag=tag,
                history_id=history_id,
                raw=True,
            )
        )

    except ProjectNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"Project '{namespace}/{project}:{tag}' not found",
        )
    except HistoryNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"History '{history_id}' not found in project '{namespace}/{project}:{tag}'",
        )


@project.delete(
    "/history",
    summary="Delete all project history",
)
def delete_full_history(
    namespace: str,
    project: str,
    tag: str = DEFAULT_TAG,
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
):
    """
    Delete all project history
    """
    if namespace not in (list_of_admins or []):
        raise HTTPException(
            detail="History not found for this project",
            status_code=404,
        )
    try:
        agent.project.delete_history(namespace, project, tag=tag)
        return JSONResponse(
            content={
                "message": "History deleted.",
                "registry": f"{namespace}/{project}:{tag}",
            },
            status_code=202,
        )

    except Exception as _e:
        raise HTTPException(
            status_code=400,
            detail="Could not delete history. Server error.",
        )


# @project.post(
#     "/standardize",
#     summary="Standardize PEP metadata column headers",
#     response_model=StandardizerResponse,
# )
# async def get_standardized_cols(
#     pep: dict = Depends(get_project),
#     schema: str = "",
# ):
#     """
#     Standardize PEP metadata column headers using BEDms.

#     :param pep: PEP string to be standardized
#     :param schema: Schema for AttrStandardizer

#     :return dict: Standardized results
#     """

#     if schema == "" or schema not in ["ENCODE", "BEDBASE", "FAIRTRACKS"]:
#         raise HTTPException(
#             status_code=404,
#             detail="Schema not available! Available schemas are ENCODE, BEDBASE and FAIRTRACKS.",
#         )

#     if len(pep["_sample_dict"]) > MAX_STANDARDIZED_PROJECT_SIZE:
#         # raise HTTPException(
#         #     status_code=400,
#         #     detail=f"Project is too large. Cannot standardize. "
#         #            f"Limit is {MAX_STANDARDIZED_PROJECT_SIZE} samples.",
#         # )
#         prj = peppy.Project.from_dict(
#             {
#                 "_config": pep["_config"],
#                 "_sample_dict": pep["_sample_dict"][:50],
#             }
#         )
#     else:
#         prj = peppy.Project.from_dict(pep)
#     model = AttrStandardizer(repo_id=BEDMS_REPO_URL, model_name=schema.lower())

#     try:
#         results = model.standardize(pep=prj)
#     except Exception as e:
#         _LOGGER.error(f"Error standardizing PEP. {e}")
#         raise HTTPException(
#             status_code=400,
#             detail=f"Error standardizing PEP.",
#         )

#     return StandardizerResponse(results=results)
