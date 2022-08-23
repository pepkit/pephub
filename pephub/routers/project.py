import json
import tempfile
from fastapi import APIRouter, Depends, Request
from fastapi.responses import FileResponse
from starlette.responses import JSONResponse, HTMLResponse, PlainTextResponse
from typing import Optional
from fastapi.templating import Jinja2Templates
import tempfile

import eido
import peppy

from pephub.const import BASE_TEMPLATES_PATH
from peppy import __version__ as peppy_version
from platform import python_version
from ..crud import get_pep
from ..helpers import zip_conv_result, zip_pep
from .._version import __version__ as pephub_version
from ..dependencies import *
from ..route_examples import *

router = APIRouter(
    prefix="/pep/{namespace}/{pep_id}",
    tags=["project"],
)

templates = Jinja2Templates(directory=BASE_TEMPLATES_PATH)


@router.get(
    "/",
    summary="Fetch a PEP",
)
async def get_a_pep(
    db: PepAgent = Depends(get_db),
    namespace: str = example_namespace,
    pep_id: str = example_pep_id,
):
    """
    Fetch a PEP from a certain namespace
    """
    proj = get_pep(db, namespace, pep_id)

    if proj is not None:
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
    else:
        raise HTTPException(
            404, {"message": f"Project '{namespace}/{pep_id}' not found in database."}
        )


@router.get("/zip")
async def zip_pep_for_download(
    namespace: str, pep_id: str, db: PepAgent = Depends(get_db)
):
    """Zip a pep"""
    proj = get_pep(db, namespace, pep_id)
    return zip_pep(proj)


# fetch configuration file
# @router.get("/config")
# async def get_config(namespace: str, pep_id: str, db: PepAgent = Depends(get_db)):
#     proj = get_pep(db, namespace, pep_id)
#     return proj.config_file


# fetch samples for project
@router.get("/samples")
async def get_pep_samples(
    db: PepAgent = Depends(get_db),
    namespace: str = example_namespace,
    pep_id: str = example_pep_id,
):
    # remove "private attributes"
    proj = get_pep(db, namespace, pep_id)
    return {"samples": proj.samples}


# # fetch specific sample for project
@router.get("/samples/{sample_name}")
async def get_sample(
    sample_name: str,
    db: PepAgent = Depends(get_db),
    namespace: str = example_namespace,
    pep_id: str = example_pep_id,
):
    proj = get_pep(db, namespace, pep_id)
    # check that the sample exists
    # by mapping the list of sample objects
    # to a list of sample names
    if sample_name not in map(lambda s: s["sample_name"], proj.samples):
        raise HTTPException(status_code=404, detail=f"sample '{sample_name}' not found")
    # if download:
    #     sample_file_path = f"{_PEP_STORAGE_PATH}/{namespace.lower()}/{pep_id.lower()}/{proj.get_sample(sample_name)['file_path']}"
    #     return FileResponse(sample_file_path)
    else:
        return proj.get_sample(sample_name).to_dict()


# display a view for a specific sample
@router.get("/samples/{sample_name}/view")
async def get_sample_view(
    namespace: str,
    pep_id: str,
    request: Request,
    sample_name: str,
    db: PepAgent = Depends(get_db),
):
    """Returns HTML response with a visual summary of the sample."""
    proj = get_pep(db, namespace, pep_id)
    if sample_name not in map(lambda s: s["sample_name"], proj.samples):
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
            "project_name": pep_id,
            "peppy_version": peppy_version,
            "python_version": python_version(),
            "pephub_version": pephub_version,
        },
    )


# fetch all subsamples inside a pep
@router.get("/subsamples")
async def get_subsamples(
    namespace: str,
    pep_id: str,
    db: PepAgent = Depends(get_db),
    download: bool = False,
):
    proj = get_pep(db, namespace, pep_id)
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
    namespace: str,
    pep_id: str,
    db: PepAgent = Depends(get_db),
    filter: Optional[str] = "basic",
    format: Optional[str] = "plain",
):
    """
    Convert a PEP to a specific format, f. For a list of available formats/filters,
    see /eido/filters.

    See, http://eido.databio.org/en/latest/filters/#convert-a-pep-into-an-alternative-format-with-a-filter
    for more information.
    """
    proj = get_pep(db, namespace, pep_id)
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
        resp_obj = zip_conv_result(conv_result)  # returns zip file in Response() object

    return resp_obj


@router.get(
    "/view",
    summary="View a visual summary of a particular project.",
    response_class=HTMLResponse,
)
async def project_view(
    request: Request, namespace: str, pep_id: str, db: PepAgent = Depends(get_db)
):
    """Returns HTML response with a visual summary of the project."""
    proj = get_pep(db, namespace, pep_id)
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
        },
    )
