from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.templating import Jinja2Templates

from pephub.const import BASE_TEMPLATES_PATH
from peppy import __version__ as peppy_version
from platform import python_version

from .._version import __version__ as pephub_version

# load dependencies
from ..dependencies import *

# examples
from ..route_examples import example_namespace

router = APIRouter(
    prefix="/pep/{namespace}",
    tags=["namespace"],
)

templates = Jinja2Templates(directory=BASE_TEMPLATES_PATH)


@router.get("/", summary="Fetch details about a particular namespace.")
async def get_namespace(
    namespace: str,
    db: PepAgent = Depends(get_db),
):
    """Fetch namespace. Returns a JSON representation of the namespace."""
    nspace = db.get_namespace(namespace)
    return JSONResponse(content=nspace)


# @router.get("/projects", summary="Fetch all projects inside a particular namespace.")
# async def get_namespace_projects(namespace: str, limit: int = 100):
#     """Fetch the projects for a particular namespace"""
#     projects = _PEP_STORES.get_projects(namespace)
#     if limit:
#         return JSONResponse(content={k: projects[k] for k in list(projects.keys())[:limit]})
#     else:
#         return JSONResponse(content=projects)

# @router.get("/view", summary="View a visual summary of a particular namespace.", response_class=HTMLResponse)
# async def namespace_view(request: Request, namespace: str):
#     """Returns HTML response with a visual summary of the namespace."""
#     nspace = _PEP_STORES.get_namespace(namespace)
#     tot_samples = sum([nspace[PROJECTS_KEY][p][INFO_KEY][N_SAMPLES_KEY] for p in nspace['projects'] ])
#     return templates.TemplateResponse("namespace.html", {
#         'namespace': nspace,
#         'request': request,
#         'tot_samples': tot_samples,
#         'peppy_version': peppy_version,
#         'python_version': python_version(),
#         'pephub_version': pephub_version
#     })
