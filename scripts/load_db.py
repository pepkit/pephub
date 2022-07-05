import argparse
import os
from time import sleep
from tqdm import tqdm
from pepagent import PepAgent
import peppy

from utils import (
    is_valid_namespace,
    is_valid_project,
    extract_project_file_name
)

def build_argparser() -> argparse.ArgumentParser:
    """Build the cli arg parser"""
    parser = argparse.ArgumentParser(description='Upload directory of PEPs')
    parser.add_argument(
        '-d',
        '-db-url',
        dest='db_url',
        default=None,
        type=str, 
        help='Database connection string.'
    )
    parser.add_argument(
        '--user',
        dest='user',
        default='postgres',
        type=str,
        help='Username for postgresql instance'
    )
    parser.add_argument(
        '--password',
        dest='password',
        type=str,
        default='admin',
        help='Password for postgresql instance'
    )
    parser.add_argument(
        '-p',
        '--port',
        dest='port',
        default='5432',
        help='Port for postgresql instance'
    )
    parser.add_argument(
        '-s',
        '--host',
        dest='hostname',
        default='localhost',
        help='Hostname of postgresql instance'
    )
    parser.add_argument(
        '-n',
        '--name',
        dest='name',
        default='postgres',
        help="Database name"
    )
    parser.add_argument(
        'files',
        type=str,
        help='Path to PEPs to upload.'
    )
    return parser

def build_connection_string(args: argparse.Namespace) -> str:
    """Build a connection string using the cli args"""
    return (
        f"postgresql://{args.user}:{args.password}@{args.hostname}:{args.port}/{args.name}"
    )

# build and parse args
parser = build_argparser()
args = parser.parse_args()

# generate connection string
cnx_str = args.db_url or build_connection_string(args)
cnx_str_censored = cnx_str.replace(
    args.password, "*"*len(args.password)
)
print(f"Connecting to {cnx_str_censored}")
print(f"Uploading PEPs in: {args.files}")

# init pep agent
pagent = PepAgent(
    host=args.hostname,
    port=args.port,
    database=args.name,
    user=args.user,
    password=args.password
)

# get file path
FILE_PATH = args.files

# traverse directory
for name in tqdm(os.listdir(FILE_PATH), desc="Uploading repository", leave=True):
    # build a path to the namespace
    path_to_namespace = f"{FILE_PATH}/{name}"
    name = name.lower()

    if is_valid_namespace(path_to_namespace):
        # traverse projects
        for proj in tqdm(
            os.listdir(path_to_namespace), desc=f"Uploading {name}", leave=True
        ):  
            # build path to project
            path_to_proj = f"{path_to_namespace}/{proj}"
            proj = proj.lower()

            if is_valid_project(path_to_proj):
                p = peppy.Project(
                    f"{path_to_proj}/{extract_project_file_name(path_to_proj)}"
                )
                pagent.upload_project(
                    p, name
                )