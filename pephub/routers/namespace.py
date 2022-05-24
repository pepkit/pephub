from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.templating import Jinja2Templates

from pephub.const import BASE_TEMPLATES_PATH

# fetch peps
from ..main import _PEP_STORES

# load dependencies
from ..dependencies import *

# examples
from ..route_examples import example_namespace

router = APIRouter(
    prefix="/pep/{namespace}",
    dependencies=[Depends(verify_namespace)],
    tags=["namespace"],
)

templates = Jinja2Templates(directory=BASE_TEMPLATES_PATH)

@router.get("/", summary="Fetch details about a particular namespace.")
async def get_namespace(namespace: str):
    """Fetch namespace. Returns a JSON representation of the namespace and the projects inside it."""
    projects = [
    {
        'name': _PEP_STORES[namespace.lower()][p]['name'],
        'n_samples': _PEP_STORES[namespace.lower()][p]['n_samples'],
        'href': _PEP_STORES[namespace.lower()][p]['href']
        # skip the 'cfg' attribute
    }   for p in _PEP_STORES[namespace.lower()]
    ]
    return JSONResponse(content=projects)

@router.get("/view", summary="View a visual summary of a particular namespace.", response_class=HTMLResponse)
async def namespace_view(request: Request, namespace: str):
    """Returns HTML response with a visual summary of the namespace."""
    projects = [
    {
        'name': _PEP_STORES[namespace.lower()][p]['name'],
        'n_samples': _PEP_STORES[namespace.lower()][p]['n_samples'],
        'href': _PEP_STORES[namespace.lower()][p]['href']
        # skip the 'cfg' attribute
    }   for p in _PEP_STORES[namespace.lower()]
    ]
    return templates.TemplateResponse("namespace.html", {'namespace': namespace, 'request': request})