import eido
import peppy
import yaml
import pandas as pd
from io import StringIO
from typing import Callable
from fastapi import APIRouter, Depends, Form
from fastapi.responses import JSONResponse, PlainTextResponse
from pepdbagent import PEPDatabaseAgent
from pepdbagent.exceptions import ProjectUniqueNameError
from peppy import Project
from peppy.const import (
    SAMPLE_RAW_DICT_KEY,
    CONFIG_KEY,
    SAMPLE_DF_KEY,
    SUBSAMPLE_RAW_DICT_KEY,
)

from ...models import ProjectOptional, ProjectRawModel, ForkRequest
from ....helpers import zip_conv_result, get_project_sample_names, zip_pep
from ....dependencies import *
from ....const import SAMPLE_CONVERSION_FUNCTIONS, VALID_UPDATE_KEYS, ALL_VERSIONS

from pepdbagent.exceptions import ProjectUniqueNameError

from dotenv import load_dotenv

load_dotenv()

project = APIRouter(
    prefix="/api/v1/projects/{namespace}/{project}",
    tags=["project"],
    dependencies=[Depends(verify_user_can_read_project)],
)


@project.get("", summary="Fetch a PEP")
async def get_a_pep(
    proj: peppy.Project = Depends(get_project),
    proj_annotation: AnnotationModel = Depends(get_project_annotation),
    raw: bool = False,
):
    """
    Fetch a PEP from a certain namespace
    """
    if raw:
        try:
            raw_project = ProjectRawModel(**proj.to_dict(extended=True))
        except Exception:
            raise HTTPException(500, f"Unexpected project error!")
        return raw_project.dict(by_alias=False)

    samples = [s.to_dict() for s in proj.samples]
    sample_table_index = proj.sample_table_index

    # this assumes the first sample's attributes
    # is representative of all samples attributes
    # -- is this the case?
    sample_attributes = proj._samples[0]._attributes

    proj_dict = proj.to_dict()
    proj_annotation_dict = proj_annotation.dict()

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
    project: str,
    namespace: str,
    updated_project: ProjectOptional,
    tag: Optional[str] = DEFAULT_TAG,
    agent: PEPDatabaseAgent = Depends(get_db),
    list_of_admins: Optional[list] = Depends(get_namespace_access_list),
):
    """
    Update a PEP from a certain namespace
    """
    # if not logged in, they cant update
    if namespace not in (list_of_admins or []):
        return JSONResponse(
            content={
                "message": "Unothorized for updating projects.",
            },
            status_code=401,
        )

    current_project = agent.project.get(namespace, project, tag=tag)
    raw_peppy_project = agent.project.get(namespace, project, tag=tag, raw=True)
    new_raw_project = raw_peppy_project.copy()

    # sample table update
    if updated_project.sample_table is not None:
        sample_table_df = pd.DataFrame.from_dict(updated_project.sample_table)
        sample_table_df_json = sample_table_df.to_dict()

        new_raw_project[SAMPLE_RAW_DICT_KEY] = sample_table_df_json
        new_raw_project[CONFIG_KEY] = current_project.config.to_dict()

    # subsample table update
    if updated_project.subsample_list is not None:
        subsample_peppy_list = []
        for subsample in updated_project.subsample_list:
            subsample_str = subsample.rstrip(",")
            subsample_str = StringIO(subsample_str)
            subsample_pd = pd.read_csv(subsample_str)
            subsample_df = subsample_pd.to_dict()

            subsample_peppy_list.append(subsample_df)

        new_raw_project[SUBSAMPLE_RAW_DICT_KEY] = subsample_peppy_list

    # project config update
    if updated_project.project_config_yaml is not None:
        yaml_dict = yaml.safe_load(updated_project.project_config_yaml)
        new_raw_project[CONFIG_KEY] = yaml_dict

    # run the validation if either the sample table or project config is updated
    if any(
        [
            updated_project.project_config_yaml is not None,
            updated_project.sample_table is not None,
        ]
    ):
        try:
            new_project = Project().from_dict(new_raw_project)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Could not create PEP from provided yaml. Error: {e}",
            )
        # validate each sample in the table according to the project
        for s in new_project.samples:
            sample_name: str = s.sample_name
            try:
                eido.validate_sample(
                    new_project,
                    sample_name,
                    "http://schema.databio.org/pep/2.0.0.yaml",  # just use the base PEP schema for now
                )
            except Exception as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Sample {sample_name} failed validation: {e}",
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
    for k, v in updated_project.dict(exclude_unset=True).items():
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
            "project": updated_project.dict(),
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

    agent.project.delete(namespace, project, tag=tag)

    return JSONResponse(
        content={
            "message": "PEP deleted",
            "registry": f"{namespace}/{project}:{tag}",
        },
        status_code=202,
    )


@project.get("/samples")
async def get_pep_samples(
    proj: peppy.Project = Depends(get_project),
    format: Optional[str] = None,
    raw: Optional[bool] = False,
):
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


@project.get("/samples/{sample_name}")
async def get_sample(sample_name: str, proj: peppy.Project = Depends(get_project)):
    if sample_name not in get_project_sample_names(proj):
        raise HTTPException(status_code=404, detail=f"sample '{sample_name}' not found")
    sample = proj.get_sample(sample_name)
    return sample


@project.get("/subsamples")
async def get_subsamples(
    namespace: str,
    project: str,
    proj: peppy.Project = Depends(get_project),
    download: bool = False,
):
    subsamples = proj[SUBSAMPLE_RAW_DICT_KEY]
    if subsamples is not None:
        subsamples = pd.DataFrame(
            proj[SUBSAMPLE_RAW_DICT_KEY][0]
        )  # TODO: this seems like a bug @Alex can you check this?
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
    """Zip a pep"""
    return zip_pep(proj)


@project.post(
    "/forks",
    summary="Fork project to user namespace.",
    dependencies=[Depends(verify_user_can_fork)],
)
async def fork_pep_to_namespace(
    fork_request: ForkRequest,
    proj: peppy.Project = Depends(get_project),
    agent: PEPDatabaseAgent = Depends(get_db),
):
    fork_to = fork_request.fork_to
    fork_name = fork_request.fork_name
    fork_tag = fork_request.fork_tag
    proj.description = fork_request.fork_description or ""
    try:
        agent.project.create(
            project=proj, namespace=fork_to, name=fork_name, tag=fork_tag or DEFAULT_TAG
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
