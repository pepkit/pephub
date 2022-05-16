from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

# fetch peps
from ..main import _PEP_STORES

# load dependencies
from ..dependencies import *

# examples
from ..route_examples import example_namespace

router = APIRouter(
    prefix="/pep/{namespace}",
    dependencies=[Depends(verify_namespace)],
    tags=["namespace"],
)


@router.get("/", summary="Fetch details about a particular namespace.")
async def get_namespace(namespace):
    """Fetch namespace. Returns a JSON representation of the namespace and the projects inside it."""
    return JSONResponse(content=_PEP_STORES[namespace.lower()])
