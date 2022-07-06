from fastapi import HTTPException
import os
from pepagent import PepAgent
from dotenv import load_dotenv

load_dotenv()

def get_db():
    # create database
    pepdb = PepAgent(
        user=os.environ.get("POSTGRES_USER"),
        password=os.environ.get("POSTGRES_PASSWORD")
    )
    try:
        yield pepdb
    finally:
        pepdb.close_connection()