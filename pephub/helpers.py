from tempfile import TemporaryDirectory
from fastapi import Response
from ubiquerg import VersionInHelpParser

from os.path import exists, basename
from yaml import safe_load
import zipfile
import io

import peppy

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
        "-d",
        "--debug",
        dest="debug",
        help="Run the server with debug mode on",
        type=bool,
        default=False,
    )
    sps["serve"].add_argument(
        "-r",
        "--reload",
        dest="reload",
        type=bool,
        help="Run the server in reload configuration",
        default=False,
    )

    return parser


def read_server_configuration(path: str) -> dict:
    """Read in a server configuration file at a specified path"""
    if not exists(path):
        raise FileNotFoundError(f"Configuration file at {path} could not be found.")
    with open(path, "r") as f:
        cfg = safe_load(f)
        if cfg.get("data") is None:
            raise PepHubException(
                "'data' section is required in the configuration file."
            )
        if cfg["data"].get("path") is None:
            raise PepHubException(
                "No path to PEPs was specified in the configuration file."
            )

        return {
            "data": {"path": cfg["data"]["path"], "index": cfg["data"].get("index")}
        }

def zip_pep(project: peppy.Project) -> Response:
    """Zip a project up to download"""
    mf = io.BytesIO()
    with TemporaryDirectory() as dirpath:
        # convert project to files on disk
        files = []
        if project.config:
            cfg_filename = basename(project.config_file)
            files.append(cfg_filename)
            with open(f"{dirpath}/{cfg_filename}", 'w') as cfg_fh:
                cfg_fh.write(project.to_yaml())
        if project.sample_table:
            sample_table_filename = project.to_dict().get('sample_table', "sample_table.csv")
            files.append(sample_table_filename)
            with open(f"{dirpath}/{sample_table_filename}", 'w') as stable_fh:
                stable_fh.write(project.sample_table.to_csv())
        if project.subsample_table:
            subsample_table_filename = project.to_dict().get('subsample_table', "subsample_table.csv")
            files.append(subsample_table_filename)
            with open(f"{dirpath}/{subsample_table_filename}", 'w') as subtable_fh:
                subtable_fh.write(project.subsample_table.to_csv())
        
        
def zip_conv_result(conv_result: dict):
    zip_filename = "conversion_result.zip"

    mf = io.BytesIO()

    with zipfile.ZipFile(mf, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for name, res in conv_result.items():
            # Add file, at correct path
            zf.writestr(name, str.encode(res))

    # Grab ZIP file from in-memory, make response with correct MIME-type
    resp = Response(
        mf.getvalue(),
        media_type="application/x-zip-compressed",
        headers={"Content-Disposition": f"attachment;filename={zip_filename}"},
    )

    return resp
