import json
from datetime import date
from typing import List, Union, Tuple
from fastapi import Response, Depends, UploadFile
from fastapi.exceptions import HTTPException
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
        "-r",
        "--reload",
        dest="reload",
        type=bool,
        help="Run the server in reload configuration",
        default=False,
    )

    sps["serve"].add_argument(
        "--log-level",
        dest="log_level",
        type=str,
        help="The level of logging to use",
        default="INFO",
    )

    sps["serve"].add_argument(
        "--uvicorn-log-level",
        dest="uvicorn_log_level",
        type=str,
        help="The level of logging to use for uvicorn",
        default="info",
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


def get_project_sample_names(proj: peppy.Project) -> List[str]:
    """
    Given a peppy.Project instance, return a list of it's sample names
    """
    return map(lambda s: s["sample_name"], proj.samples)


def zip_pep(project: peppy.Project) -> Response:
    """
    Zip a project up to download
    :param project: peppy project to zip
    """
    content_to_zip = {}

    if project.config:
        prj_cof_file = project.config_file or "config.yaml"
        cfg_filename_base = basename(prj_cof_file)
        content_to_zip[cfg_filename_base] = project.config.to_yaml()

    if project.sample_table is not None:
        sample_table_filename = basename(
            project.to_dict().get("sample_table", "sample_table.csv")
        )
        content_to_zip[sample_table_filename] = project.sample_table.to_csv()

    if project.subsample_table is not None:
        if not isinstance(project.subsample_table, list):
            subsample_table_filename = basename(
                project.to_dict().get("subsample_table", "subsample_table.csv")
            )
            content_to_zip[subsample_table_filename] = project.subsample_table.to_csv()
        else:
            subsample_table_filenames = project.to_dict().get(
                "subsample_table", "subsample_table.csv"
            )
            for sstable, sstable_filename in zip(
                project.subsample_table, subsample_table_filenames
            ):
                subsample_table_filename = basename(sstable_filename)
                content_to_zip[subsample_table_filename] = sstable.to_csv()

    zip_filename = project.name or f"downloaded_pep_{date.today()}"
    return zip_conv_result(content_to_zip, filename=(project.name or zip_filename))


def zip_conv_result(conv_result: dict, filename: str = "conversion_result.zip"):
    """

    """
    mf = io.BytesIO()

    with zipfile.ZipFile(mf, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for name, res in conv_result.items():
            # Add file, at correct path
            zf.writestr(name, str.encode(res))

    # Grab ZIP file from in-memory, make response with correct MIME-type
    resp = Response(
        mf.getvalue(),
        media_type="application/x-zip-compressed",
        headers={"Content-Disposition": f"attachment;filename={filename}"},
    )

    return resp


def build_authorization_url(
    client_id: str,
    redirect_uri: str,
    state: str,
) -> str:
    """
    Helper function to build an authorization url
    for logging in with GitHub
    """
    auth_url = f"https://github.com/login/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&state={state}&scope=read:org"
    return auth_url


def find_yaml_file_in_file_list(files: List[UploadFile]) -> Union[UploadFile, None]:
    """
    Given a list of files uploaded by a user, find the
    file that ends with `.yaml` and return it. If no file
    is found, return None
    """
    for file in files:
        if file.filename.endswith(".yaml"):
            return file
    return None


def find_csv_file_in_file_list(files: List[UploadFile]) -> Union[UploadFile, None]:
    """
    Given a list of files uploaded by a user, find the
    file that ends with `.csv` and return it. If no file
    is found, return None
    """
    for file in files:
        if file.filename.endswith(".csv"):
            return file
    return None


def parse_user_file_upload(files: List[UploadFile]) -> UploadFile:
    """
    Parse through files upload by a user and return the UploadFile object
    that should be used to instantiate a peppy.Project instance.

    ```mermaid
    graph TD;
      A[User uploads files] --> B{Included `.yaml` file?}
      B -- Yes --> C[Init project using `file.yaml`]
      B -- No --> D{Included `.csv` file?}
      D -- No --> E[Return `400`]
      D -- Yes --> F[Init project from `csv`]
    ```
    """
    yaml_file = find_yaml_file_in_file_list(files)
    if yaml_file is not None:
        return yaml_file
    else:
        csv_file = find_csv_file_in_file_list(files)
        if csv_file is not None:
            return csv_file
        else:
            raise HTTPException(
                status_code=400, detail="No .yaml or .csv file was found in the upload."
            )


def split_upload_files_on_init_file(
    all_files: List[UploadFile], init_file: UploadFile
) -> Tuple[UploadFile, List[UploadFile]]:
    """
    Given a list of files uploaded by a user and the file that should be used
    to init a peppy project, split the files into two objects, one being
    the init file and the other a list containing all other files.
    """
    other_files = [file for file in all_files if file.filename != init_file.filename]
    return init_file, other_files


def parse_upload_files_by_folder(files: List[UploadFile]):
    """
    Parsing list of directories into nested dictionary
    """
    file_dict = {}
    for file in files:
        file_dict[file.filename] = file.file.read()
    return file_dict
