import eido
import yaml
import pandas as pd
from io import StringIO
from typing import Callable
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse, PlainTextResponse
from peppy import __version__ as peppy_version
from peppy import Sample, Project
from platform import python_version

from ...._version import __version__ as pephub_version
from ...models import ProjectOptional
from ....helpers import zip_conv_result, get_project_sample_names, zip_pep
from ....dependencies import *
from ....const import SAMPLE_CONVERSION_FUNCTIONS, VALID_UPDATE_KEYS


from dotenv import load_dotenv

load_dotenv()

ALL_VERSIONS = {
    "pephub_version": pephub_version,
    "peppy_version": peppy_version,
    "python_version": python_version(),
    "api_version": 1,
}

project = APIRouter(
    prefix="/api/v1/projects/{namespace}/{project}", tags=["api", "project", "v1"]
)


@project.get("/", summary="Fetch a PEP")
async def get_a_pep(proj: peppy.Project = Depends(get_project)):
    """
    Fetch a PEP from a certain namespace
    """

    samples = [s.to_dict() for s in proj.samples]
    sample_table_indx = proj.sample_table_index

    # this assumes the first sample's attributes
    # is representative of all samples attributes
    # -- is this the case?
    sample_attributes = proj._samples[0]._attributes
    try:
        pep_version = proj.pep_version
    except Exception:
        pep_version = "2.1.0"
    return {
        "pep": proj.to_dict(),
        "pep_version": pep_version,
        "samples": samples,
        "sample_table_indx": sample_table_indx,
        "sample_attributes": sample_attributes,
    }


# https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#update-a-repository
# update a project (pep)
@project.patch("/", summary="Update a PEP")
async def update_a_pep(
    project: str,
    namespace: str,
    updated_project: ProjectOptional,
    tag: Optional[str] = DEFAULT_TAG,
    db: Connection = Depends(get_db),
):
    """
    Update a PEP from a certain namespace
    """
    # pull current project from database
    peppy_project = db.get_project(namespace, project, tag=tag)
    raw_peppy_project = db.get_raw_project(namespace, project, tag=tag)

    # update sample table
    if updated_project.sample_table_csv is not None:
        # create pandas df from csv in memory
        sample_table_csv = StringIO(updated_project.sample_table_csv)
        sample_table_df = pd.read_csv(sample_table_csv)

        # drop any empty columns
        sample_table_df = sample_table_df.dropna(axis=1, how="all")

        # create a new project from the sample table
        # populate with current project data
        new_proj_from_new_samples = Project().from_pandas(sample_table_df)
        new_proj_from_new_samples.name = project
        new_proj_from_new_samples.description = peppy_project.description

        # validate each sample in the table according to the project
        for s in new_proj_from_new_samples.samples:
            sample_name: str = s.sample_name
            try:
                eido.validate_sample(
                    new_proj_from_new_samples,
                    sample_name,
                    "http://schema.databio.org/pep/2.0.0.yaml",  # just use the base PEP schema for now
                )
            except Exception as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Sample {sample_name} failed validation: {e}",
                )

        # if we get through all samples, then update project in the database
        db.update_item(
            {
                "project": new_proj_from_new_samples,
            },
            namespace,
            project,
            tag,
        )

    # update project config
    if updated_project.project_config_yaml is not None:
        # get project_dict from yaml
        yaml_dict = yaml.safe_load(updated_project.project_config_yaml)
        new_raw_project_from_yaml = raw_peppy_project.copy()
        new_raw_project_from_yaml["_config"] = yaml_dict
        new_raw_project_from_yaml["description"] = peppy_project.description
        new_raw_project_from_yaml["name"] = project
        new_project = Project().from_dict(new_raw_project_from_yaml)

        db.update_item(
            {
                "project": new_project,
            },
            namespace,
            project,
            tag=tag,
        )
    
    # update "meta meta data"
    for k, v in updated_project.dict().items():
        # skip the sample table and project config
        if k not in ["project_config_yaml", "sample_table_csv"]:
            # this is here just to make it work...
            if k == "is_private":
                k = "private"
            if v is not None:
                if hasattr(peppy_project, k):
                    setattr(peppy_project, k, v)
                    db.update_item(
                        {
                            "project": peppy_project,
                        },
                        namespace,
                        project,
                        tag=tag,
                    )
                elif k in VALID_UPDATE_KEYS:
                    db.update_item(
                        {
                            "project": peppy_project,
                            k: v,
                        },
                        namespace,
                        project,
                        tag=tag,
                    )
                else:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid update key: {k}",
                    )

    return JSONResponse(
        content={
            "message": "PEP updated",
            "registry": f"{namespace}/{project}:{tag}",
            "api_endpoint": f"/api/v1/namespaces/{namespace}/{project}",
            "project": updated_project.dict(),
        },
        status_code=202,
    )


# delete a PEP
@project.delete("/", summary="Delete a PEP")
async def delete_a_pep(
    namespace: str,
    project: str,
    tag: Optional[str] = DEFAULT_TAG,
    db: Connection = Depends(get_db),
    session_info: dict = Depends(read_session_info),
):
    """
    Delete a PEP from a certain namespace
    """
    if session_info is None or namespace != session_info["login"]:
        raise HTTPException(
            status_code=403, detail="You are not authorized to delete this PEP"
        )
    proj = db.get_project(namespace, project, tag=tag)

    if proj is None:
        raise HTTPException(
            status_code=404, detail=f"Project {namespace}/{project}:{tag} not found"
        )

    db.delete_project(namespace, project, tag=tag)

    return JSONResponse(
        content={
            "message": "PEP deleted",
            "registry": f"{namespace}/{project}:{tag}",
        },
        status_code=202,
    )


# fetch samples for project
@project.get("/samples")
async def get_pep_samples(
    proj: peppy.Project = Depends(get_project),
    format: Optional[str] = None,
):
    if format is not None:
        conversion_func: Callable = SAMPLE_CONVERSION_FUNCTIONS.get(format, None)
        if conversion_func is not None:
            return PlainTextResponse(content=conversion_func(proj.sample_table))
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid format '{format}'. Valid formats are: {list(SAMPLE_CONVERSION_FUNCTIONS.keys())}",
            )
    else:
        return JSONResponse(
            {
                "count": len(proj.samples),
                "items": [s.to_dict() for s in proj.samples],
            }
        )


# # fetch specific sample for project
@project.get("/samples/{sample_name}")
async def get_sample(sample_name: str, proj: peppy.Project = Depends(get_project)):
    # check that the sample exists
    # by mapping the list of sample objects
    # to a list of sample names
    if sample_name not in get_project_sample_names(proj):
        raise HTTPException(status_code=404, detail=f"sample '{sample_name}' not found")
    sample = proj.get_sample(sample_name)
    return sample


# fetch all subsamples inside a pep
@project.get("/subsamples")
async def get_subsamples(
    namespace: str,
    project: str,
    proj: peppy.Project = Depends(get_project),
    download: bool = False,
):
    subsamples = proj.subsample_table
    # check if subsamples exist
    if subsamples is not None:
        if download:
            return proj.subsample_table.to_csv()
        else:
            return proj.subsample_table.to_dict()
    else:
        return f"Project '{namespace.lower()}/{project.lower()}' does not have any subsamples."


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
