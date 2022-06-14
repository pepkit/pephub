from typing import Union
from fastapi import Response
from ubiquerg import VersionInHelpParser

from os.path import exists
from yaml import safe_load
import os
import zipfile
import io

from pephub.exceptions import PepHubException

from ._version import __version__ as v
from .const import DEFAULT_PORT, PKG_NAME


def build_parser():
    """
    Building argument parser
    :return argparse.ArgumentParser
    """
    banner = "%(prog)s - PEP web server"
    additional_description = (
        "For subcommand-specific options, type: '%(prog)s <subcommand> -h'"
    )
    additional_description += "\nhttps://github.com/pepkit/pepserver"

    parser = VersionInHelpParser(
        prog=PKG_NAME, description=banner, epilog=additional_description
    )

    parser.add_argument(
        "-V", "--version", action="version", version="%(prog)s {v}".format(v=v)
    )

    msg_by_cmd = {"serve": "run the server"}

    subparsers = parser.add_subparsers(dest="command")

    def add_subparser(cmd, description):
        return subparsers.add_parser(cmd, description=description, help=description)

    sps = {}
    # add arguments that are common for both subparsers
    for cmd, desc in msg_by_cmd.items():
        sps[cmd] = add_subparser(cmd, desc)
        sps[cmd].add_argument(
            "-c",
            "--config",
            required=False,
            dest="config",
            help=f"A path to the pepserver config file",
        ),
        sps[cmd].add_argument(
            "-d",
            "--dbg",
            action="store_true",
            dest="debug",
            help="Set logger verbosity to debug",
        )

    sps["serve"].add_argument(
        "-p",
        "--port",
        dest="port",
        type=int,
        help="The port the webserver should be run on.",
        default=DEFAULT_PORT,
    )

    sps["serve"].add_argument(
        "-r",
        "--reload",
        action="store_true",
        default=False,
        help="Live reloading with uvicorn",
    )

    return parser


def read_server_configuration(path: str) -> dict:
    """Read in a server configuration file at a specified path"""
    if not exists(path):
        raise FileNotFoundError(f"Configuration file at {path} could not be found.")
    with open(path, "r") as f:
        cfg = safe_load(f)
        if cfg.get("data") is None:
            raise PepHubException("'data' section is required in the configuration file.")
        if cfg["data"].get("path") is None:
            raise PepHubException("No path to PEPs was specified in the configuration file.")

        return {
            'data': {
                'path': cfg['data']['path'],
                'index': cfg['data'].get('index')
            }
        }

def zip_conv_result(conv_result: dict):
    zip_filename = "conversion_result.zip"
    
    mf = io.BytesIO()

    with zipfile.ZipFile(mf, mode="w",compression=zipfile.ZIP_DEFLATED) as zf:
        for name, res in conv_result.items():
            # Add file, at correct path
            zf.writestr(name, str.encode(res))

    # Grab ZIP file from in-memory, make response with correct MIME-type
    resp = Response(mf.getvalue(), media_type="application/x-zip-compressed", headers={
        'Content-Disposition': f'attachment;filename={zip_filename}'
    })

    return resp