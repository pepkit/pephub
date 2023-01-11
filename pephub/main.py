import logging
import sys
import uvicorn
import coloredlogs

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles

from ._version import __version__ as server_v
from .const import PKG_NAME, TAGS_METADATA
from .helpers import build_parser
from .routers.api.v1.base import api as api_base
from .routers.api.v1.namespace import namespace as api_namespace
from .routers.api.v1.project import project as api_project
from .routers.api.v1.user import user as api_user
from .routers.api.v1.search import search as api_search
from .routers.auth.base import auth as auth_router
from .routers.views.base import views as views_base
from .const import STATICS_PATH, EIDO_PATH

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
app.include_router(api_project)
app.include_router(api_search)
app.include_router(auth_router)
app.include_router(views_base)

# mount the landing html/assets
app.mount("/static", StaticFiles(directory=STATICS_PATH), name="root_static")

# The eido validator is an SPA that can be served as a static HTML
# file. These can only be added on the main app, not on a router
app.mount("/eido/validator", StaticFiles(directory=EIDO_PATH), name="eido_validator")

def main():
    # set up the logger
    global _LOGGER
    parser = build_parser()
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        print("No subcommand given")
        sys.exit(1)

    if args.command == "serve":
        uvicorn.run(
            app, host="0.0.0.0", port=args.port, debug=args.debug, reload=args.reload
        )

    else:
        _LOGGER.error(f"unknown command: {args.command}")
        sys.exit(1)
