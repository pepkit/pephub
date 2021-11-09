from fastapi import APIRouter, Depends

import peppy

# fetch peps
from ..db import download_peps, load_data_tree
download_peps()
PEP_STORES = load_data_tree()

# load dependencies
from ..dependencies import *

router = APIRouter(
    prefix="/v1",
    dependencies=[Depends(verify_namespace), Depends(verify_project), Depends(validate_pep)]
)

@router.get("/")
async def root():
    return {
        "message": "welcome to the pepserver"
    }

@router.get("/pep-list")
async def return_all_peps():
    return PEP_STORES

@router.get("/{namespace}")
async def get_namespace(namespace: str):
    return PEP_STORES[namespace]

@router.get("/{namespace}/{pep_id}")
async def get_pep(namespace: str, pep_id: str):
    proj = peppy.Project(PEP_STORES[namespace][pep_id])
    return {
        "pep": proj
    }

    
