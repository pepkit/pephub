from typing import List

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pepdbagent import PEPDatabaseAgent

from fastembed.embedding import FlagEmbedding as Embedding
from qdrant_client import QdrantClient

from ....dependencies import (
    get_db,
    get_qdrant,
    get_sentence_transformer,
    get_namespace_access_list,
)
from ...models import SearchQuery
from ....const import DEFAULT_QDRANT_COLLECTION_NAME


from dotenv import load_dotenv

load_dotenv()

search = APIRouter(prefix="/api/v1/search", tags=["search"])


# perform a search
@search.post("/", summary="Search for a PEP")
async def search_for_pep(
    query: SearchQuery,
    qdrant: QdrantClient = Depends(get_qdrant),
    model: Embedding = Depends(get_sentence_transformer),
    agent: PEPDatabaseAgent = Depends(get_db),
    namespace_access: List[str] = Depends(get_namespace_access_list),
):
    """
    Perform a search for PEPs. This can be done using qdrant (semantic search),
    or with basic SQL string matches.
    """
    limit = query.limit
    offset = query.offset
    score_threshold = query.score_threshold
    if qdrant is not None:
        try:
            query_vec = list(model.embed(query.query))[0]
            # count = len(qdrant.search(
            #     collection_name=(
            #         query.collection_name or DEFAULT_QDRANT_COLLECTION_NAME
            #     ),
            #     query_vector=query_vec,
            #     limit=1e99, # get everything above the threshold
            #     offset=offset,
            #     score_threshold=score_threshold,
            # ))
            results = qdrant.search(
                collection_name=(
                    query.collection_name or DEFAULT_QDRANT_COLLECTION_NAME
                ),
                query_vector=query_vec,
                limit=limit,
                offset=offset,
                score_threshold=score_threshold,
            )
            namespaces = agent.namespace.get(admin=namespace_access)
            namespace_hits = [
                n.namespace
                for n in namespaces.results
                if query.query.lower() in n.namespace.lower()
            ]
            # TODO: make this a helper function
            namespace_hits.extend(
                [
                    n
                    for n in list(
                        set(
                            [
                                r.dict()["payload"]["registry"].split("/")[0]
                                for r in results
                            ]
                        )
                    )
                    if n not in namespace_hits
                ]
            )
            return JSONResponse(
                content={
                    "query": query.query,
                    "results": [r.dict() for r in results],
                    "namespace_hits": namespace_hits,
                    "limit": limit,
                    "offset": offset,
                }
            )
        except Exception as e:
            # TODO: this isnt proper error handling. Also we need to use a logger
            print("Qdrant search failed, falling back to SQL search. Reason: ", e)
    else:
        # fallback to SQL search
        namespaces = agent.namespace.get(admin=namespace_access).results
        results = agent.annotation.get(
            query=query.query, limit=limit, offset=offset
        ).results

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

        namespace_hits = [
            n.namespace
            for n in namespaces
            if query.query.lower() in n.namespace.lower()
        ]
        namespace_hits.extend(
            [
                n
                for n in list(
                    set(
                        [r["payload"]["registry"].split("/")[0] for r in parsed_results]
                    )
                )
                if n not in namespace_hits
            ]
        )
        return JSONResponse(
            content={
                "query": query.query,
                "results": parsed_results,
                "namespace_hits": namespace_hits,
            }
        )
