from fastapi import APIRouter, __version__ as fastapi_version
from fastapi.responses import JSONResponse
from peppy import __version__ as peppy_version
from platform import python_version
from pepdbagent.models import ProjectSearchResultModel

from ...._version import __version__ as pephub_version
from ....dependencies import *
from ...models import SearchQuery
from ....const import DEFAULT_QDRANT_COLLECTION_NAME


from dotenv import load_dotenv

load_dotenv()

ALL_VERSIONS = {
    "pephub_version": pephub_version,
    "peppy_version": peppy_version,
    "python_version": python_version(),
    "fastapi_version": fastapi_version,
    "api_version": 1,
}

search = APIRouter(prefix="/api/v1/search", tags=["api", "search", "v1"])

# perform a search
@search.post("/", summary="Search for a PEP")
async def search_for_pep(
    query: SearchQuery,
    qdrant: QdrantClient = Depends(get_qdrant),
    model: SentenceTransformer = Depends(get_sentence_transformer),
    db: Connection = Depends(get_db),
    limit: int = 20,
):
    """
    Perform a search for PEPs. This can be done using qdrant (semantic search),
    or with basic SQL string matches.
    """
    if qdrant is not None:
        try:
            query_vec = model.encode(query.query)
            results = qdrant.search(
                collection_name=(
                    query.collection_name or DEFAULT_QDRANT_COLLECTION_NAME
                ),
                query_vector=query_vec,
                limit=limit,
            )
            return JSONResponse(
                content={
                    "query": query.query,
                    "results": [r.dict() for r in results],
                    "namespace_hits": list(
                        set(
                            [
                                r.dict()["payload"]["registry"].split("/")[0]
                                for r in results
                            ]
                        )
                    ),
                }
            )
        except Exception as e:
            print("Qdrant search failed, falling back to SQL search. Reason: ", e)
    else:
        # fallback to SQL search on GEO projects
        namespaces = db.get_namespaces_info_by_list()
        results: List[ProjectSearchResultModel] = []
        for namespace in namespaces:
            try:
                res = db.search.project(
                    namespace=namespace, search_str=query.query, limit=limit
                )
                results.extend(res.results)
            except:
                results.extend([])

        # emulate qdrant response from the SQL search
        # for frontend compatibility
        parsed_results = [
            {
                "id": None,
                "version": 0,
                "score": None,
                "payload": {
                    "description": r.description,
                    "registry": f"{r.namespace}/{r.name}:{r.tag}",
                },
                "vector": None,
            }
            for r in results
        ]
        return JSONResponse(
            content={
                "query": query.query,
                "results": parsed_results,
                "namespace_hits": list(
                    set(
                        [r["payload"]["registry"].split("/")[0] for r in parsed_results]
                    )
                ),
            }
        )
