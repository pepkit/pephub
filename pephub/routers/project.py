from fastapi import APIRouter, Depends, Query
from fastapi.responses import FileResponse

from ..main import _PEP_STORAGE_PATH

# peppy
import peppy

# fetch peps
from ..main import _PEP_STORES

# load dependencies
from ..dependencies import *

router = APIRouter(
    prefix="/pep/{namespace}/{pep_id}",
    dependencies=[Depends(verify_namespace), Depends(verify_project), Depends(validate_pep)],
    tags=["project"]
)

@router.get("/", summary="Fetch a PEP")
async def get_pep(namespace: str, pep_id: str,):
    """
    Fetch a PEP from a certain namespace
    """
    proj = peppy.Project(_PEP_STORES[namespace][pep_id])
    return {
        "pep": proj
    }

# fetch configuration file
@router.get("/config")
async def get_config(namespace: str, pep_id: str):
    return FileResponse(_PEP_STORES[namespace][pep_id])

# fetch samples for project
@router.get("/samples")
async def get_samples(namespace: str, pep_id: str):
    proj = peppy.Project(_PEP_STORES[namespace][pep_id])
    return proj.samples

# fetch specific sample for project
@router.get("/samples/{sample_name}")
async def get_samples(namespace: str, pep_id: str, sample_name: str, download: bool = False):
    proj = peppy.Project(_PEP_STORES[namespace][pep_id])
    if sample_name not in map(lambda s: s['sample_name'], proj.samples):
        raise HTTPException(status_code=404, detail=f"sample '{sample_name}' not found")
    if download:
        sample_file_path = f"{_PEP_STORAGE_PATH}/{namespace}/{pep_id}/{proj.get_sample(sample_name)['file_path']}"
        return FileResponse(sample_file_path)
    else:
        return proj.get_sample(sample_name)
