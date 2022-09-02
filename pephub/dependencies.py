from fastapi import HTTPException, Depends
import os
from pepdbagent import Connection
from pepdbagent.const import DEFAULT_TAG
from dotenv import load_dotenv

from .const import (
    DEFAULT_POSTGRES_HOST,
    DEFAULT_POSTGRES_PASSWORD,
    DEFAULT_POSTGRES_PORT,
    DEFAULT_POSTGRES_USER,
    DEFAULT_POSTGRES_DB
)

load_dotenv()


def get_db():
    # create database
    pepdb = Connection(
        user=os.environ.get("POSTGRES_USER") or DEFAULT_POSTGRES_USER,
        password=os.environ.get("POSTGRES_PASSWORD") or DEFAULT_POSTGRES_PASSWORD,
        host=os.environ.get("POSTGRES_HOST") or DEFAULT_POSTGRES_HOST,
        database=os.environ.get("POSTGRES_DB") or DEFAULT_POSTGRES_DB,
        port=os.environ.get("POSTGRES_PORT") or DEFAULT_POSTGRES_PORT
    )
    try:
        yield pepdb
    finally:
        pepdb.close_connection()

def get_project(
    namespace: str,
    pep_id: str,
    tag: str = None,
    db: Connection = Depends(get_db),
):
    proj = db.get_project(namespace, pep_id, tag)
    if proj is not None:
        yield proj
    else:
        used_tag = tag or DEFAULT_TAG
        raise HTTPException(404, f"PEP '{namespace}/{pep_id}:{used_tag}' does not exist in database. Did you spell it correctly?")
