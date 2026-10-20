from typing import List, Literal, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from fastembed.embedding import TextEmbedding as Embedding
from pepdbagent import PEPDatabaseAgent
from pepdbagent.models import IndexSearchResult, NamespaceList
from qdrant_client import QdrantClient
from qdrant_client.models import (
    SparseVector,
    Prefetch,
    FusionQuery,
    Fusion,
    SearchParams,
    FieldCondition,
    MatchValue,
    Filter,
)
from sentence_transformers import SparseEncoder

from ....const import DEFAULT_QDRANT_COLLECTION_NAME
from ....dependencies import (
    get_db,
    get_namespace_access_list,
    get_qdrant,
    get_sentence_transformer,
    get_sparse_model,
)
from ...models import SearchQuery, SearchReturnModel
from qdrant_client.models import ScoredPoint
from pepdbagent.models import Namespace

load_dotenv()

search = APIRouter(prefix="/api/v1/search", tags=["search"])


@search.get(
    "/namespaces", summary="Search for namespaces", response_model=NamespaceList
)
async def search_for_namespaces(
    limit: Optional[int] = 1_000,
    query: Optional[str] = "",
    offset: Optional[int] = 0,
    agent: PEPDatabaseAgent = Depends(get_db),
) -> NamespaceList:
    return agent.namespace.get(limit=limit, query=query or "", offset=offset)


@search.get(
    "/samples",
    summary="Search for samples by organism, assay, tissue, and sample type",
    response_model=IndexSearchResult,
)
def search_for_samples(
    organism: List[str] = Query(
        None, description="Term ID or name, e.g. NCBITaxon:9606 or Homo sapiens"
    ),
    assay: List[str] = Query(
        None, description="Term ID or name, e.g. EFO:0007045 or ATAC-seq"
    ),
    tissue: List[str] = Query(
        None,
        description="Tissue or cell type, as a term ID or name, e.g. UBERON:0002107 "
        "or liver. Also matches every term below it (liver finds hepatocyte).",
    ),
    sample_type: List[str] = Query(
        None,
        description="tissue, primary cell, cell line, organoid, in vitro "
        "differentiated cells, cell-free sample, or whole organisms",
    ),
    min_confidence: Literal["low", "medium", "high"] = "low",
    match: Literal["any", "best"] = Query(
        "any",
        description="any: a sample matches if any of its claims for a field matches. "
        "best: only its highest-confidence claims for that field count.",
    ),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    agent: PEPDatabaseAgent = Depends(get_db),
) -> IndexSearchResult:
    """
    Find samples by what the sample index says about them. Different parameters
    combine with AND; repeat a parameter to combine its values with OR. Each result
    lists the claims that matched, with their confidence and the submitter text they
    came from.
    """
    if not (organism or assay or tissue or sample_type):
        raise HTTPException(
            status_code=400,
            detail="Give at least one of: organism, assay, tissue, sample_type",
        )
    return agent.index.search(
        organism=organism,
        assay=assay,
        tissue=tissue,
        sample_type=sample_type,
        min_confidence=min_confidence,
        match=match,
        limit=limit,
        offset=offset,
    )


# perform a search
@search.post("/", summary="Search for a PEP", response_model=SearchReturnModel)
async def search_for_pep(
    query: SearchQuery,
    qdrant: QdrantClient = Depends(get_qdrant),
    model: Embedding = Depends(get_sentence_transformer),
    model_sparse: SparseEncoder = Depends(get_sparse_model),
    agent: PEPDatabaseAgent = Depends(get_db),
    namespace_access: List[str] = Depends(get_namespace_access_list),
) -> SearchReturnModel:
    """
    Perform a search for PEPs. This can be done using qdrant (semantic search),
    or with basic SQL string matches.
    """
    limit = query.limit
    offset = query.offset

    # get namespaces:
    namespaces: list[Namespace] = agent.namespace.get(
        query=query.query, admin=namespace_access, limit=limit, offset=offset
    ).results

    if qdrant is not None:
        dense_query = list(list(model.embed(query.query))[0])

        if model_sparse:
            sparse_result = model_sparse.encode(query.query).coalesce()
            sparse_embeddings = SparseVector(
                indices=sparse_result.indices().tolist()[0],
                values=sparse_result.values().tolist(),
            )
        else:
            sparse_embeddings = None

        must_statement = [
            FieldCondition(
                key="name",
                match=MatchValue(value=query.query),
            )
        ]

        if sparse_embeddings:
            hybrid_query = [
                # Dense retrieval: semantic understanding
                Prefetch(query=dense_query, using="dense", limit=limit + offset),
                # Sparse retrieval: exact technical term matching
                Prefetch(query=sparse_embeddings, using="sparse", limit=limit + offset),
                # Exact match retrieval: precise filtering
                Prefetch(filter=Filter(must=must_statement), limit=10),
            ]
        else:
            hybrid_query = [
                # Dense retrieval: semantic understanding
                Prefetch(query=dense_query, using="dense", limit=limit + offset),
                # Exact match retrieval: precise filtering
                Prefetch(filter=Filter(must=must_statement), limit=10),
            ]

        vector_results = qdrant.query_points(
            collection_name=DEFAULT_QDRANT_COLLECTION_NAME,
            limit=limit,
            offset=offset,
            prefetch=hybrid_query,
            query=FusionQuery(fusion=Fusion.RRF),
            with_payload=True,
            with_vectors=False,
            search_params=SearchParams(
                exact=True,
            ),
            # query_filter=(
            #     models.Filter(must=should_statement) if should_statement else None
            # ),
        ).points

        return SearchReturnModel(
            query=query.query,
            results=vector_results,
            namespace_hits=namespaces,
            limit=limit,
            offset=offset,
            total=len(vector_results),
        )

    else:
        # fallback to SQL search
        results = agent.annotation.get(query=query.query, limit=limit, offset=offset)

        # emulate qdrant response from the SQL search
        # for frontend compatibility
        parsed_results = [
            ScoredPoint(
                id=f"{r.namespace}/{r.name}:{r.tag}",
                version=0,
                score=1.0,  # SQL search, so we just set the score to 1.0
                payload={
                    "description": r.description,
                    "registry": f"{r.namespace}/{r.name}:{r.tag}",
                },
                vector=None,
            )
            for r in results.results
        ]

        return SearchReturnModel(
            query=query.query,
            results=parsed_results,
            namespace_hits=namespaces,
            limit=limit,
            offset=offset,
            total=results.count,
        )
