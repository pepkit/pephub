import argparse
import os

import peppy
from pepdbagent import PEPDatabaseAgent as Connection
from tqdm import tqdm
from utils import extract_project_file_name, is_valid_namespace, is_valid_project


def build_argparser() -> argparse.ArgumentParser:
    """Build the cli arg parser"""
    parser = argparse.ArgumentParser(description="Upload directory of PEPs")
    parser.add_argument(
        "-d",
        "-db-url",
        dest="db_url",
        default=None,
        type=str,
        help="Database connection string.",
    )
    parser.add_argument(
        "--user",
        dest="user",
        default="postgres",
        type=str,
        help="Username for postgresql instance",
    )
    parser.add_argument(
        "--password",
        dest="password",
        type=str,
        default="docker",
        help="Password for postgresql instance",
    )
    parser.add_argument(
        "-p", "--port", dest="port", default="5432", help="Port for postgresql instance"
    )
    parser.add_argument(
        "-s",
        "--host",
        dest="hostname",
        default="localhost",
        help="Hostname of postgresql instance",
    )
    parser.add_argument(
        "-b", "--database", dest="name", default="pep-db", help="Database name"
    )
    parser.add_argument("--files", type=str, help="Path to PEPs to upload.")
    parser.add_argument("--force", action="store_true", help="Force overwrite")
    return parser


def build_connection_string(args: argparse.Namespace) -> str:
    """Build a connection string using the cli args"""
    return f"postgresql://{args.user}:{args.password}@{args.hostname}:{args.port}/{args.name}"


# build and parse args
parser = build_argparser()
args = parser.parse_args()

# generate connection string
cnx_str = args.db_url or build_connection_string(args)
cnx_str_censored = cnx_str.replace(args.password, "*" * len(args.password))
print(f"Connecting to {cnx_str_censored}")
print(f"Uploading PEPs in: {args.files}")

# init pep agent
pagent = Connection(
    host=args.hostname,
    port=args.port,
    database=args.name,
    user=args.user,
    password=args.password,
)

# get file path
FILE_PATH = args.files

failed_project_list = []
# traverse directory
for namespace in tqdm(os.listdir(FILE_PATH), desc="Uploading repository", leave=True):
    # build a path to the namespace
    path_to_namespace = f"{FILE_PATH}/{namespace}"
    namespace = namespace.lower()

    if is_valid_namespace(path_to_namespace):
        # traverse projects
        for proj_name in tqdm(
            os.listdir(path_to_namespace), desc=f"Uploading {namespace}", leave=True
        ):
            # build path to project
            path_to_proj = f"{path_to_namespace}/{proj_name}"
            proj_name = proj_name.lower()
            print(f"Uploading: {path_to_proj}")
            if is_valid_project(path_to_proj):
                try:
                    project_dict = peppy.Project(
                        f"{path_to_proj}/{extract_project_file_name(path_to_proj)}"
                    )
                    pagent.project.create(
                        project=project_dict,
                        namespace=namespace,
                        name=proj_name,
                        description=f"Uploaded from, {path_to_proj}",
                        overwrite=args.force,
                    )
                except Exception:
                    print(f"Failed to load project: {path_to_proj}")
                    failed_project_list.append(path_to_proj)
                    continue

if failed_project_list:
    print("Failed to upload the following projects:")
    for proj in failed_project_list:
        print(f"# -- {proj}")
