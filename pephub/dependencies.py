from fastapi import HTTPException
import os
from pepdbagent import Connection
from dotenv import load_dotenv

from .const import (
    DEFAULT_POSTGRES_HOST,
    DEFAULT_POSTGRES_PASSWORD,
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
        database=os.environ.get("POSTGRES_DB") or DEFAULT_POSTGRES_DB
    )
    try:
        yield pepdb
    finally:
        pepdb.close_connection()
