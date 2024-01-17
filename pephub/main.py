import logging
import coloredlogs

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ._version import __version__ as server_v
from .const import PKG_NAME, TAGS_METADATA, ALL_VERSIONS
from .routers.api.v1.base import api as api_base
from .routers.api.v1.namespace import (
    namespace as api_namespace,
    namespaces as api_namespaces,
)
from .routers.api.v1.project import project as api_project, projects as api_projects
from .routers.api.v1.user import user as api_user
from .routers.api.v1.search import search as api_search
from .routers.auth.base import auth as auth_router
from .routers.eido.eido import router as eido_router

_LOGGER_PEPDBAGENT = logging.getLogger("pepdbagent")
coloredlogs.install(
    logger=_LOGGER_PEPDBAGENT,
    level=logging.INFO,
    datefmt="%b %d %Y %H:%M:%S",
    fmt="[%(levelname)s] [%(asctime)s] [PEPDBAGENT] %(message)s",
)

_LOGGER_PEPPY = logging.getLogger("peppy")
coloredlogs.install(
    logger=_LOGGER_PEPPY,
    level=logging.ERROR,
    datefmt="%b %d %Y %H:%M:%S",
    fmt="[%(levelname)s] [%(asctime)s] [PEPPY] %(message)s",
)

_LOGGER_PEPHUB = logging.getLogger("uvicorn.access")
coloredlogs.install(
    logger=_LOGGER_PEPHUB,
    level=logging.INFO,
    datefmt="%b %d %Y %H:%M:%S",
    fmt="[%(levelname)s] [%(asctime)s] [PEPHUB] %(message)s",
)


# build server
app = FastAPI(
    title=PKG_NAME,
    description="A web interface and RESTful API for PEPs",
    docs_url="/api/v1/docs",
    version=server_v,
    tags=TAGS_METADATA,
)

# CORS is required for the validation HTML SPA to work externally
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# build routes
app.include_router(api_base)
app.include_router(api_user)
app.include_router(api_namespace)
app.include_router(api_namespaces)
app.include_router(api_project)
app.include_router(api_projects)
app.include_router(api_search)
app.include_router(auth_router)
app.include_router(eido_router)


# base
@app.get("/")
async def api_base():
    """
    Base API endpoint.
    """
    return {
        **ALL_VERSIONS,
        "message": "Welcome to the PEPHub API.",
    }
