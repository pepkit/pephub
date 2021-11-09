from fastapi import APIRouter, Depends

import peppy

# fetch peps
from ..db import download_peps, load_data_tree
download_peps()
PEP_STORES = load_data_tree()

# load dependencies
from ..dependencies import *

router = APIRouter(
    prefix="/{namespace}",
    dependencies=[Depends(verify_namespace)]
)

@router.get("/")
async def get_namespace(namespace: str):
    return PEP_STORES[namespace]