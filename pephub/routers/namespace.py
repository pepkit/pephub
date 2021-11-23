from fastapi import APIRouter, Depends
from pydantic import BaseModel

# fetch peps
from ..main import _PEP_STORES

# load dependencies
from ..dependencies import *

router = APIRouter(
    prefix="/pep/{namespace}",
    dependencies=[Depends(verify_namespace)],
    tags=["namespace"]
)

@router.get("/", summary="Fetch details about a particular namespace.")
async def get_namespace(namespace: str):
    """
    Fetch namespace. Returns a
    """
    return _PEP_STORES[namespace]