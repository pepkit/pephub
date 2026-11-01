import logging

import coloredlogs
import logmuse
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded


from ._version import __version__ as server_v
from .const import ALL_VERSIONS, PKG_NAME, TAGS_METADATA
from .limiter import limiter, _custom_rate_limit_exceeded_handler
from .routers.api.v1.base import api as api_base
from .routers.api.v1.namespace import namespace as api_namespace
from .routers.api.v1.namespace import namespaces as api_namespaces
from .routers.api.v1.project import project as api_project
from .routers.api.v1.project import projects as api_projects
from .routers.api.v1.search import search as api_search
from .routers.api.v1.schemas import schemas as api_schemas
from .routers.api.v1.schemas import groups as api_groups
from .routers.auth.base import auth as auth_router
from .routers.eido.eido import router as eido_router

DATE_FMT = "%b %d %Y %H:%M:%S"

# This module is the application entry point (uvicorn loads `pephub.main:app`),
# so it is where logging gets configured. Don't move this into `__init__.py`.
#
# Configuring the root logger covers pephub and its dependencies at once. Each
# line is tagged with its logger name, so there is no need to attach a handler
# per package to identify where a message came from.
logmuse.init_logger("", make_root=True, level=logging.INFO, datefmt=DATE_FMT)

# peprs is noisy at INFO.
logging.getLogger("peprs").setLevel(logging.ERROR)

# uvicorn owns its own logger tree: `uvicorn.access` and its parent both have
# propagate=False, so the root handler above cannot reach them. Access logs have
# to be formatted explicitly to match everything else.
coloredlogs.install(
    logger=logging.getLogger("uvicorn.access"),
    level=logging.INFO,
    datefmt=DATE_FMT,
    fmt="[%(levelname)s] [%(asctime)s] [%(name)s] %(message)s",
)


# build server
app = FastAPI(
    title=PKG_NAME,
    description="A web interface and RESTful API for PEPs",
    docs_url="/api/v1/docs",
    version=server_v,
    tags=TAGS_METADATA,
)

# import logfire
# from .dependencies import agent
# logfire.configure()
# from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
# SQLAlchemyInstrumentor().instrument(engine=agent.connection)
#
# # logfire.instrument_fastapi(app)

# rate limiting

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _custom_rate_limit_exceeded_handler)

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
app.include_router(api_namespaces)
app.include_router(api_namespace)
app.include_router(api_project)
app.include_router(api_projects)
app.include_router(api_search)
app.include_router(api_schemas)
app.include_router(api_groups)
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
