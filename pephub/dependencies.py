from fastapi import HTTPException
import peppy

from .db import load_data_tree
PEP_STORES = load_data_tree()

# verify namespace
def verify_namespace(namespace: str) -> None:
    if namespace not in PEP_STORES:
        raise HTTPException(status_code=404, detail=f"namespace '{namespace}' not found.")

# verify project id
def verify_project(namespace: str, pep_id: str) -> None:
    if pep_id not in PEP_STORES[namespace]:
        raise HTTPException(status_code=404, detail=f"pep_id '{pep_id}' not found in namespace {namespace}")

# valdiate the PEP
def validate_pep(namespace: str, pep_id: str) -> None:
    # validate pep
    try:
        proj = peppy.Project(PEP_STORES[namespace][pep_id])
    except NotImplementedError as nie:
        raise HTTPException(status_code=400, detail=f"Error loading PEP. {nie}")