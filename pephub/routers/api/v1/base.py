from fastapi import APIRouter, __version__ as fastapi_version
from peppy import __version__ as peppy_version
from platform import python_version

from ...._version import __version__ as pephub_version
from ....dependencies import *


from dotenv import load_dotenv

load_dotenv()

ALL_VERSIONS = {
    "pephub_version": pephub_version,
    "peppy_version": peppy_version,
    "python_version": python_version(),
    "fastapi_version": fastapi_version,
    "api_version": 1,
}

api = APIRouter(prefix="/api/v1", tags=["api", "base", "v1"])


@api.get("/")
async def api_base():
    """
    Base API endpoint.
    """
    return {
        **ALL_VERSIONS,
        "message": "Welcome to the PEPHub API.",
    }


@api.get("/_version")
async def version():
    return dict(**ALL_VERSIONS)
