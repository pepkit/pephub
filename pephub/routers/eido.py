from fastapi import APIRouter, Depends

import peppy
import eido
from starlette.requests import Request
from starlette.responses import HTMLResponse
from starlette.responses import JSONResponse
from yacman import load_yaml

print("Schemas list")
print(load_yaml("schemas.yaml"))

schemas_to_test = load_yaml("schemas.yaml")

# load dependencies
from ..dependencies import *

router = APIRouter(
	prefix="/eido",
    tags=["eido"]
)

@router.get("/", summary="Welcome.")
async def root() -> dict:
    return {
        "message": "eido"
    }

@router.get("/schemas")
async def status(request: Request):
    return JSONResponse(schemas_to_test)

@router.get("/validate", summary="Return list of all available PEPs")
async def return_all_peps():
    return PEP_STORES

    
