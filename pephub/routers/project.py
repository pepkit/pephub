from fastapi import APIRouter, Depends, Query
from fastapi.responses import FileResponse
from starlette.responses import JSONResponse
from tempfile import TemporaryFile

# eido
import eido

# import the pep storage
from ..main import _PEP_STORAGE_PATH

# peppy
import peppy

# fetch peps
from ..main import _PEP_STORES

# load dependencies
from ..dependencies import *

# route examples
from ..route_examples import *

router = APIRouter(
    prefix="/pep/{namespace}/{pep_id}",
    dependencies=[
        Depends(verify_namespace), 
        Depends(verify_project), 
        Depends(validate_pep)
    ],
    tags=["project"]
)

@router.get("/", summary="Fetch a PEP",)
async def get_pep(namespace: str = example_namespace, pep_id: str = example_pep_id, proj: peppy.Project = Depends(validate_pep)):
    """
    Fetch a PEP from a certain namespace
    """
    return {
        "pep": proj
    }

# @router.get("/zip")
# async def zip_pep(namespace: str, pep_id: str, proj: peppy.Project = Depends(validate_pep)):
#     """Zip a pep"""
#     with TemporaryFile('w') as tmp:
#         tmp.write(proj.to_yaml())
#         return FileResponse(tmp.name, filename=f"{namespace}_{pep_id}.yaml")

# fetch configuration file
@router.get("/config")
async def get_config(namespace: str = "demo", pep_id: str = "BiocProject"):
    return FileResponse(_PEP_STORES[namespace][pep_id])

# fetch samples for project
@router.get("/samples")
async def get_samples(proj: peppy.Project = Depends(validate_pep)):
    return proj.samples

# fetch specific sample for project
@router.get("/samples/{sample_name}")
async def get_sample(namespace: str, pep_id: str, sample_name: str, download: bool = False, proj: peppy.Project = Depends(validate_pep)):
    # check that the sample exists
    # by mapping the list of sample objects
    # to a list of sample names
    if sample_name not in map(lambda s: s['sample_name'], proj.samples):
        raise HTTPException(status_code=404, detail=f"sample '{sample_name}' not found")
    if download:
        sample_file_path = f"{_PEP_STORAGE_PATH}/{namespace}/{pep_id}/{proj.get_sample(sample_name)['file_path']}"
        return FileResponse(sample_file_path)
    else:
        return proj.get_sample(sample_name)

# fetch all subsamples inside a pep
@router.get("/subsamples")
async def get_subsamples(namespace: str, pep_id: str, download: bool = False, proj: peppy.Project = Depends(validate_pep)):
    subsamples = proj.subsample_table
    # check if subsamples exist
    if subsamples is not None:
        if download:
            return proj.subsample_table.to_csv()
        else:
            return str(proj.subsample_table.to_dict())
    else:
        return f"Project '{namespace}/{pep_id}' does not have any subsamples."

@router.get("/convert")
async def convert_pep(proj: peppy.Project = Depends(validate_pep), filter: str = example_filter):
    """
    Convert a PEP to a specific format, f. For a list of available formats/filters,
    see /eido/filters.

    See, http://eido.databio.org/en/latest/filters/#convert-a-pep-into-an-alternative-format-with-a-filter
    for more information.
    """
    if filter is None:
        filter = "basic" # default to basic
    return JSONResponse(eido.run_filter(proj, filter))