import logging

import logmuse

# Set up logging before importing the rest of pephub, so lines logged at import
# time get the same format. Each line names the logger it came from.
logmuse.init_logger("", make_root=True, level=logging.INFO, datefmt="%b %d %Y %H:%M:%S")
# Other libraries log warnings only. peprs is noisy, so errors only.
logging.getLogger().setLevel(logging.WARNING)
logging.getLogger("pephub").setLevel(logging.INFO)
logging.getLogger("pepdbagent").setLevel(logging.INFO)
logging.getLogger("peprs").setLevel(logging.ERROR)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded

from ._version import __version__ as server_v
from .const import ALL_VERSIONS, PKG_NAME, TAGS_METADATA
from .limiter import _custom_rate_limit_exceeded_handler, limiter
from .routers.api.v1.base import api as api_base
from .routers.api.v1.namespace import namespace as api_namespace
from .routers.api.v1.namespace import namespaces as api_namespaces
from .routers.api.v1.project import project as api_project
from .routers.api.v1.project import projects as api_projects
from .routers.api.v1.schemas import groups as api_groups
from .routers.api.v1.schemas import schemas as api_schemas
from .routers.api.v1.search import search as api_search
from .routers.auth.base import auth as auth_router
from .routers.eido.eido import router as eido_router

# uvicorn and pepdbagent give their loggers their own handlers. Send their lines
# through the root handler instead, so every line has the same format.
for name in ("uvicorn", "uvicorn.access", "pepdbagent"):
    logging.getLogger(name).handlers.clear()
    logging.getLogger(name).propagate = True

# build server
app = FastAPI(
    title=PKG_NAME,
    description="A web interface and RESTful API for PEPs",
    docs_url="/api/v1/docs",
    version=server_v,
    openapi_tags=TAGS_METADATA,
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
