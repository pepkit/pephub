from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse

import peppy

# fetch peps
from ..db import download_peps, load_data_tree
download_peps()
PEP_STORES = load_data_tree()

# load dependencies
from ..dependencies import *

router = APIRouter(
    prefix="/{namespace}/{pep_id}",
    dependencies=[Depends(verify_namespace), Depends(verify_project), Depends(validate_pep)]
)

@router.get("/")
async def get_pep(namespace: str, pep_id: str):
    proj = peppy.Project(PEP_STORES[namespace][pep_id])
    return {
        "pep": proj
    }

# fetch configuration file
@router.get("/config")
async def get_config(namespace: str, pep_id: str):
    return FileResponse(PEP_STORES[namespace][pep_id])

# fetch samples for project
@router.get("/samples")
async def get_samples(namespace: str, pep_id: str):
    proj = peppy.Project(PEP_STORES[namespace][pep_id])
    return proj.samples

# fetch specific sample for project
@router.get("/samples/{sample_name}")
async def get_samples(namespace: str, pep_id: str, sample_name: str):
    proj = peppy.Project(PEP_STORES[namespace][pep_id])
    return proj.get_sample(sample_name)