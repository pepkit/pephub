from dotenv import load_dotenv
from fastapi import APIRouter

from ....const import ALL_VERSIONS

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
