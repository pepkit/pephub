from fastapi import APIRouter, Depends

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
    proj = validate_pep(namespace, pep_id)
    return {
        "pep": proj
    }