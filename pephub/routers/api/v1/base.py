from fastapi import APIRouter, __version__ as fastapi_version
from peppy import __version__ as peppy_version
from platform import python_version
from pepdbagent import __version__ as pepdbagent_version

from ...._version import __version__ as pephub_version
from ....dependencies import *
from ....const import ALL_VERSIONS


from dotenv import load_dotenv

load_dotenv()

api = APIRouter(prefix="/api/v1", tags=["base"])


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
