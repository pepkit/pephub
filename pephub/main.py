import sys

import logmuse
import uvicorn
from fastapi import FastAPI

from ._version import __version__ as server_v
from .const import LOG_FORMAT, PKG_NAME, TAGS_METADATA
from .helpers import build_parser

from .routers import version1, namespace, project

app = FastAPI(
    title=PKG_NAME,
    description="a web interface and RESTful API for PEPs",
    version=server_v,
    tags=TAGS_METADATA
)

# build routes
app.include_router(version1.router)
app.include_router(namespace.router)
app.include_router(project.router)

def main():
    global _LOGGER
    parser = build_parser()
    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        print("No subcommand given")
        sys.exit(1)
    logger_args = (
        dict(name=PKG_NAME, fmt=LOG_FORMAT, level=5)
        if args.debug
        else dict(name=PKG_NAME, fmt=LOG_FORMAT)
    )
    _LOGGER = logmuse.setup_logger(**logger_args)

    if args.command == "serve":
        uvicorn.run(app, host="0.0.0.0", port=args.port, debug=args.debug)

    else:
        _LOGGER.error(f"unknown command: {args.command}")
        sys.exit(1)