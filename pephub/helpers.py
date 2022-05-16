from typing import Union
from ubiquerg import VersionInHelpParser

from os.path import exists
from yaml import safe_load

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
        return safe_load(f)
