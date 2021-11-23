from fastapi import APIRouter, Depends
from pydantic import BaseModel

# fetch peps
from ..db import download_peps, load_data_tree
download_peps()
PEP_STORES = load_data_tree()

# load dependencies
from ..dependencies import *

router = APIRouter(
    prefix="/{namespace}",
    dependencies=[Depends(verify_namespace)],
    tags=["namespace"]
)

@router.get("/", summary="Fetch details about a particular namespace.")
async def get_namespace(namespace: str):
    """
    Fetch namespace. Returns a
    """
    return PEP_STORES[namespace]