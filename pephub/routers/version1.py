from fastapi import APIRouter, Depends

import peppy

# fetch peps
from ..main import _PEP_STORES

# load dependencies
from ..dependencies import *

router = APIRouter(
    tags=["root"]
)

@router.get("/", summary="Welcome.")
async def root() -> dict:
    return {
        "message": "welcome to the pepserver"
    }

@router.get("/pep-list", summary="Return list of all available PEPs")
async def return_all_peps():
    return _PEP_STORES

    
