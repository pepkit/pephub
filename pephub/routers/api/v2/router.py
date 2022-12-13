from fastapi import APIRouter
from pephub.const import BASE_TEMPLATES_PATH
from peppy import __version__ as peppy_version
from platform import python_version

from ...._version import __version__ as pephub_version
from ....dependencies import *


from dotenv import load_dotenv

load_dotenv()

ALL_VERSIONS = {
    "pephub_version": pephub_version,
    "peppy_version": peppy.__version__,
    "python_version": python_version(),
    "api_version": 2,
}

api = APIRouter(prefix="/api/v2", tags=["api", "base", "v2"])


@api.get("/")
async def api_base():
    """
    Base API endpoint.
    """
    return {
        **ALL_VERSIONS,
        "message": "Welcome to the PEPHub API.",
    }
