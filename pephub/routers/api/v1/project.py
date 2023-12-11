import eido
import yaml
import pandas as pd
import peppy
from typing import Callable, Literal, Union, Optional
from fastapi import APIRouter, Depends
from fastapi.exceptions import HTTPException
from fastapi.responses import JSONResponse, PlainTextResponse
from peppy import Project
from peppy.const import (
    SAMPLE_RAW_DICT_KEY,
    CONFIG_KEY,
    SAMPLE_DF_KEY,
    SUBSAMPLE_RAW_LIST_KEY,
)

from pepdbagent import PEPDatabaseAgent
from pepdbagent.exceptions import ProjectUniqueNameError
from pepdbagent.models import AnnotationModel

from dotenv import load_dotenv


from ...models import ProjectOptional, ProjectRawModel, ForkRequest
from ....helpers import zip_conv_result, get_project_sample_names, zip_pep
from ....dependencies import (
    get_db,
    get_project,
    get_project_annotation,
    get_namespace_access_list,
    verify_user_can_fork,
    verify_user_can_read_project,
    DEFAULT_TAG,
)
from ....const import SAMPLE_CONVERSION_FUNCTIONS, VALID_UPDATE_KEYS


load_dotenv()

project = APIRouter(
    prefix="/api/v1/projects/{namespace}/{project}",
    tags=["project"],
    dependencies=[Depends(verify_user_can_read_project)],
)


@project.get("", summary="Fetch a PEP")
async def get_a_pep(
    proj: Union[peppy.Project, dict] = Depends(get_project),
    proj_annotation: AnnotationModel = Depends(get_project_annotation),
):
    """
    Fetch a PEP from a certain namespace

    Don't have a namespace or project?

    Use the following:

        project: example
        namespace: databio

    """
    if not isinstance(proj, peppy.Project):
        try:
            raw_project = ProjectRawModel(**proj)
        except Exception:
            raise HTTPException(500, "Unexpected project error!")
        return raw_project.model_dump(by_alias=False)
    samples = [s.to_dict() for s in proj.samples]
    sample_table_index = proj.sample_table_index

    # this assumes the first sample's attributes
    # is representative of all samples attributes
    # -- is this the case?
    sample_attributes = proj._samples[0]._attributes

    proj_dict = proj.to_dict()
    proj_annotation_dict = proj_annotation.model_dump()

    # default to name from annotation
    if hasattr(proj, "name") and hasattr(proj_annotation, "name"):
        try:
            del proj_dict["name"]
        except KeyError:
            pass

    # default to description from annotation
    if hasattr(proj, "description") and hasattr(proj_annotation, "description"):
        try:
            del proj_dict["description"]
        except KeyError:
            pass

    return dict(
        **proj_dict,
        **proj_annotation_dict,
        samples=samples,
        sample_table_indx=sample_table_index,
        sample_attributes=sample_attributes,
    )


@project.patch(
    "",
    summary="Update a PEP",
)
async def update_a_pep(
    namespace: str,
    project: str,
    updated_project: ProjectOptional,
    tag: Optional[str] = DEFAULT_TAG,
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
):
    """
    Update a PEP from a certain namespace

    Don't have a namespace or project?

    Use the following:

        project: example
        namespace: databio
    """
    # if not logged in, they cant update
    if namespace not in (list_of_admins or []):
        return JSONResponse(
            content={
                "message": "Unauthorized for updating projects.",
            },
            status_code=401,
        )

    current_project = agent.project.get(namespace, project, tag=tag)
    raw_peppy_project = agent.project.get(namespace, project, tag=tag, raw=True)
    new_raw_project = raw_peppy_project.copy()

    # sample table update
    if updated_project.sample_table is not None:
        new_raw_project[SAMPLE_RAW_DICT_KEY] = updated_project.sample_table
        new_raw_project[CONFIG_KEY] = dict(current_project.config)

    # subsample table update
    if updated_project.subsample_tables is not None:
        new_raw_project[SUBSAMPLE_RAW_LIST_KEY] = updated_project.subsample_tables

    if updated_project.description:
        new_raw_project["_config"]["description"] = updated_project.description

    # project config update
    if updated_project.project_config_yaml is not None:
        yaml_dict = yaml.safe_load(updated_project.project_config_yaml)
        new_raw_project[CONFIG_KEY] = yaml_dict

    # run the validation if either the sample table or project config is updated
    if any(
        [
            updated_project.project_config_yaml is not None,
            updated_project.sample_table is not None,
            updated_project.subsample_tables is not None,
        ]
    ):
        try:
            new_project = Project().from_dict(new_raw_project)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Could not create PEP from provided yaml. Error: {e}",
            )

        try:
            # validate project (it will also validate samples)
            eido.validate_project(
                new_project, "http://schema.databio.org/pep/2.1.0.yaml"
            )
        except Exception as _:
            raise HTTPException(
                status_code=400,
                detail="Could not validate PEP. Please check your PEP and try again.",
            )

        # if we get through all samples, then update project in the database
        agent.project.update(
            {
                "project": new_project,
                "pep_schema": updated_project.pep_schema,
            },
            namespace,
            project,
            tag,
        )

        # grab latest project and return to user
        raw_peppy_project = agent.project.get(namespace, project, tag=tag, raw=True)
        return {
            "project": raw_peppy_project,
            "project_annotation": agent.annotation.get(
                namespace, project, tag=tag, admin=list_of_admins
            ),
            "message": "Project updated successfully",
        }

    # update "meta meta data"
    update_dict = {}  # dict used to pass to the `db.update_item` function
    for k, v in updated_project.model_dump(exclude_unset=True).items():
        # is the value an attribute of the peppy project?
        if k in new_raw_project:
            new_raw_project[k] = v
        # otherwise is it a valid update key?
        elif k in VALID_UPDATE_KEYS:
            update_dict[k] = v
        else:
            print(f"Invalid update key: {k}")
            continue
            # raising HTTPException causes problems downstream with web apps.
            # raise HTTPException(
            #     status_code=400,
            #     detail=f"Invalid update key: {k}",
            # )

    agent.project.update(
        dict(project=Project().from_dict(new_raw_project), **update_dict),
        namespace,
        project,
        tag,
    )

    # fetch latest project and return to user
    # update tag and project values
    project = updated_project.name or project
    tag = updated_project.tag or tag
    raw_peppy_project = agent.project.get(namespace, project, tag=tag, raw=True)

    return JSONResponse(
        content={
            "message": "PEP updated",
            # "project": raw_peppy_project,
            "registry": f"{namespace}/{project}:{tag}",
            "api_endpoint": f"/api/v1/namespaces/{namespace}/{project}",
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


@project.get("/samples")
async def get_pep_samples(
    proj: peppy.Project = Depends(get_project),
    format: Optional[str] = None,
    raw: Optional[bool] = False,
):
    """
    Get samples from a certain project and namespace

    Don't have a namespace or project?

    Use the following:

        project: example
        namespace: databio
    """
    if format is not None:
        conversion_func: Callable = SAMPLE_CONVERSION_FUNCTIONS.get(format, None)
        if conversion_func is not None:
            return PlainTextResponse(content=conversion_func(proj[SAMPLE_DF_KEY]))
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid format '{format}'. Valid formats are: {list(SAMPLE_CONVERSION_FUNCTIONS.keys())}",
            )
    else:
        if raw:
            df = pd.DataFrame(proj[SAMPLE_RAW_DICT_KEY])
            return JSONResponse(
                {
                    "count": df.shape[0],
                    "items": df.to_dict(orient="records"),
                }
            )
        else:
            return JSONResponse(
                {
                    "count": len(proj.samples),
                    "items": [s.to_dict() for s in proj.samples],
                }
            )


@project.get("/config", summary="Get project configuration file")
async def get_pep_config(
    proj: Union[peppy.Project, dict] = Depends(get_project),
    format: Optional[Literal["JSON", "String"]] = "JSON",
    raw: Optional[bool] = False,
):
    """
    Get project configuration file from a certain project and namespace

    Don't have a namespace or project?

    Use the following:

        project: example
        namespace: databio
    """
    if raw:
        proj_config = proj[CONFIG_KEY]
    else:
        proj_config = proj.to_dict(extended=True, orient="records")[CONFIG_KEY]
    if format == "JSON":
        return JSONResponse(proj_config)
    return JSONResponse(
        {
            "config": yaml.dump(proj_config, sort_keys=False),
        }
    )


@project.get("/samples/{sample_name}")
async def get_sample(sample_name: str, proj: peppy.Project = Depends(get_project)):
    """
    Get a particular sample from a certain project and namespace

    Don't have a sample name, namespace, or project?

    Use the following:

        sample_name: 4-1_11102016
        project: example
        namespace: databio
    """
    if sample_name not in get_project_sample_names(proj):
        raise HTTPException(status_code=404, detail=f"sample '{sample_name}' not found")
    sample = proj.get_sample(sample_name)
    return sample


@project.get("/subsamples")
async def get_subsamples(
    proj: peppy.Project = Depends(get_project),
    download: bool = False,
):
    """
    Get subsamples from a certain project and namespace

    Don't have a namespace, or project?

    Use the following:

        project: example
        namespace: databio
    """
    subsamples = proj[SUBSAMPLE_RAW_LIST_KEY]
    if subsamples is not None:
        try:
            subsamples = pd.DataFrame(
                proj[SUBSAMPLE_RAW_LIST_KEY][0]
            )  # TODO: this seems like a bug @Alex can you check this?
        except IndexError:
            subsamples = pd.DataFrame()
        if download:
            return subsamples.to_csv()
        else:
            return JSONResponse(
                {
                    "count": subsamples.shape[0],
                    "items": subsamples.to_dict(orient="records"),
                }
            )

    else:
        return JSONResponse(
            {
                "count": 0,
                "items": [],
            }
        )


@project.get("/convert")
async def convert_pep(
    proj: peppy.Project = Depends(get_project),
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
    conv_result = eido.run_filter(proj, filter, verbose=False)

    if format == "plain":
        return_str = "\n".join([conv_result[k] for k in conv_result])
        resp_obj = PlainTextResponse(return_str)
    elif format == "json":
        resp_obj = JSONResponse(conv_result)
    else:
        resp_obj = zip_conv_result(conv_result)  # returns zip file in Response() object

    return resp_obj


@project.get("/zip")
async def zip_pep_for_download(proj: peppy.Project = Depends(get_project)):
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
    proj: peppy.Project = Depends(get_project),
    proj_annotation: AnnotationModel = Depends(get_project_annotation),
    agent: PEPDatabaseAgent = Depends(get_db),
):
    """
    Fork a project for a particular namespace you have write access to.

    Don't know your namespace and/project? Log in to see.

    """
    fork_to = fork_request.fork_to
    fork_name = fork_request.fork_name
    fork_tag = fork_request.fork_tag
    try:
        agent.project.create(
            project=proj,
            namespace=fork_to,
            name=fork_name,
            tag=fork_tag or DEFAULT_TAG,
            description=proj_annotation.description,
            pep_schema=proj_annotation.pep_schema,
        )
    except ProjectUniqueNameError as e:
        return JSONResponse(
            content={
                "message": f"Project '{fork_to}/{fork_name}:{fork_tag}' already exists in namespace",
                "error": f"{e}",
                "status_code": 400,
            },
            status_code=400,
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


@project.get("/annotation")
async def get_project_annotation(
    proj_annotation: AnnotationModel = Depends(get_project_annotation),
):
    """
    Get project annotation from a certain project and namespace
    """
    return proj_annotation
