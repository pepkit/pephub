from fastapi import HTTPException
import os
from pepagent import PepAgent
from dotenv import load_dotenv
from pepagent import PepAgent

from .const import ( 
    DEFAULT_POSTGRES_HOST, 
    DEFAULT_POSTGRES_PASSWORD, 
    DEFAULT_POSTGRES_USER
)

load_dotenv()

def get_db():
    # create database
    pepdb = PepAgent(
        user=os.environ.get("POSTGRES_USER") or DEFAULT_POSTGRES_USER,
        password=os.environ.get("POSTGRES_PASSWORD") or DEFAULT_POSTGRES_PASSWORD,
        host=os.environ.get("POSTGRES_HOST") or DEFAULT_POSTGRES_HOST,
    )
    try:
        yield pepdb
    finally:
        pepdb.close_connection()
