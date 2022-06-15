from enum import Enum
import json
from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import FileResponse
from starlette.responses import JSONResponse, HTMLResponse, PlainTextResponse
from typing import Optional
from fastapi.templating import Jinja2Templates

from pephub.const import BASE_TEMPLATES_PATH, INFO_KEY
from peppy import __version__ as peppy_version
from platform import python_version

from pephub.helpers import zip_conv_result
from .._version import __version__ as pephub_version

import eido
import peppy
from ..main import _PEP_STORAGE_PATH, _PEP_STORES
from ..dependencies import *
from ..route_examples import *

router = APIRouter(
    prefix="/pep/{namespace}/{pep_id}",
    dependencies=[
        Depends(verify_namespace),
        Depends(verify_project),
        Depends(validate_pep),
    ],
    tags=["project"],
)

templates = Jinja2Templates(directory=BASE_TEMPLATES_PATH)

@router.get(
    "/",
    summary="Fetch a PEP",
)
async def get_pep(
    namespace: str = example_namespace,
    pep_id: str = example_pep_id,
    proj: peppy.Project = Depends(validate_pep),
):
    """
    Fetch a PEP from a certain namespace
    """
    return {"pep": proj.to_dict()}


# @router.get("/zip")
# async def zip_pep(namespace: str, pep_id: str, proj: peppy.Project = Depends(validate_pep)):
#     """Zip a pep"""
#     with TemporaryFile('w') as tmp:
#         tmp.write(proj.to_yaml())
#         return FileResponse(tmp.name, filename=f"{namespace}_{pep_id}.yaml")

# fetch configuration file
@router.get("/config")
async def get_config(namespace: str = "demo", pep_id: str = "BiocProject"):
    return FileResponse(_PEP_STORES[namespace.lower()][pep_id.lower()]['cfg'])


# fetch samples for project
@router.get("/samples")
async def get_samples(proj: peppy.Project = Depends(validate_pep)):
    # remove "private attributes"
    return JSONResponse([s.to_dict() for s in proj.samples])


# fetch specific sample for project
@router.get("/samples/{sample_name}")
async def get_sample(
    namespace: str,
    pep_id: str,
    sample_name: str,
    download: bool = False,
    proj: peppy.Project = Depends(validate_pep),
):
    # check that the sample exists
    # by mapping the list of sample objects
    # to a list of sample names
    if sample_name not in map(lambda s: s["sample_name"], proj.samples):
        raise HTTPException(status_code=404, detail=f"sample '{sample_name}' not found")
    if download:
        sample_file_path = f"{_PEP_STORAGE_PATH}/{namespace.lower()}/{pep_id.lower()}/{proj.get_sample(sample_name)['file_path']}"
        return FileResponse(sample_file_path)
    else:
        return proj.get_sample(sample_name).to_dict()

# display a view for a specific sample
@router.get("/samples/{sample_name}/view")
async def get_sample_view(
    namespace: str,
    pep_id: str,
    request: Request,
    sample_name: str,
    proj: peppy.Project = Depends(validate_pep),
):
    """Returns HTML response with a visual summary of the sample."""
    sample = proj.get_sample(sample_name)
    attrs = sample._attributes
    return templates.TemplateResponse("sample.html", {
        'project': proj,
        'sample': sample,
        'attrs': attrs,
        'request': request,
        'namespace': namespace,
        'project_name': pep_id,
        'peppy_version': peppy_version,
        'python_version': python_version(),
        'pephub_version': pephub_version,
    })


# fetch all subsamples inside a pep
@router.get("/subsamples")
async def get_subsamples(
    namespace: str,
    pep_id: str,
    download: bool = False,
    proj: peppy.Project = Depends(validate_pep),
):
    subsamples = proj.subsample_table
    # check if subsamples exist
    if subsamples is not None:
        if download:
            return proj.subsample_table.to_csv()
        else:
            return proj.subsample_table.to_dict()
    else:
        return f"Project '{namespace.lower()}/{pep_id.lower()}' does not have any subsamples."


@router.get("/convert")
async def convert_pep(
    proj: peppy.Project = Depends(validate_pep), 
    filter: Optional[str] = "basic",
    format: Optional[str] = "plain"
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

    format_list = ["plain", "zip", "json"]
    if format not in format_list:
        raise HTTPException(
            400, f"Unknown format '{format}'. Availble formats: {format_list}"
        )
    
    if format == "plain":
        return_str = "\n".join([conv_result[k] for k in conv_result])
        resp_obj = PlainTextResponse(return_str)
    elif format == "json":
        resp_obj = JSONResponse(conv_result)
    else:
        resp_obj = zip_conv_result(conv_result) # returns zip file in Response() object

    return resp_obj

@router.get("/view", summary="View a visual summary of a particular project.", response_class=HTMLResponse)
async def project_view(request: Request, namespace: str, pep_id: str, peppy_obj: peppy.Project = Depends(validate_pep)):
    """Returns HTML response with a visual summary of the project."""
    proj = _PEP_STORES.get_project(namespace, pep_id)
    samples = [s.to_dict() for s in peppy_obj.samples]
    try:
        pep_version = peppy_obj.pep_version
    except Exception: 
        pep_version = "2.1.0"
    return templates.TemplateResponse("project.html", {
        'project': proj,
        'project_dict': peppy_obj.to_dict(),
        'pep_version': pep_version,
        'sample_table_columns': peppy_obj.sample_table.columns.to_list(),
        'samples': samples,
        'n_samples': len(samples),
        'request': request,
        'peppy_version': peppy_version,
        'python_version': python_version(),
        'pephub_version': pephub_version,
        'filters': eido.get_available_pep_filters()
    })