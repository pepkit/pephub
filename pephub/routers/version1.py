from fastapi import APIRouter, Depends

import peppy

# fetch peps
from ..db import download_peps, load_data_tree
download_peps()
PEP_STORES = load_data_tree()

# load dependencies
from ..dependencies import *

router = APIRouter(
    prefix="/v1"
)

@router.get("/")
async def root():
    return {
        "message": "welcome to the pepserver"
    }

@router.get("/pep-list")
async def return_all_peps():
    return PEP_STORES

    
