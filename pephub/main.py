import sys

import logmuse
import uvicorn
from fastapi import FastAPI

try: from pephub.db import load_data_tree
except: from .db import load_data_tree

# set up global pep storage
global _PEP_STORES # the object in memory to read from
global _PEP_STORAGE_PATH # the actual file path to the peps
_PEP_STORES = {}
_PEP_STORAGE_PATH = ""

from ._version import __version__ as server_v
from .const import LOG_FORMAT, PKG_NAME, TAGS_METADATA
from .helpers import build_parser, read_server_configuration
from .routers import version1, namespace, project

# build server
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
    # set up the logger
    global _LOGGER
    parser = build_parser()
    args = parser.parse_args()

    # populate config
    # read in the configration file
    cfg = read_server_configuration(args.config)

    # read in files
    _PEP_STORAGE_PATH = cfg["data"]["path"]
    load_data_tree(_PEP_STORAGE_PATH, _PEP_STORES)

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