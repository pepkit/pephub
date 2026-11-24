"""
Query encoders for semantic search.

``LocalEncoder`` loads the models in this process. ``TEIEncoder`` calls servers
that speak the Hugging Face Text Embeddings Inference (TEI) API, one base URL per
model. The ML libraries are only imported inside ``LocalEncoder``, so
``EMBEDDING_MODE=tei`` never loads fastembed, sentence-transformers or torch.
"""

import logging
from typing import List, Optional, Protocol

import httpx
from qdrant_client.models import SparseVector

from .const import PKG_NAME

_LOGGER = logging.getLogger(PKG_NAME)

TIMEOUT = 10  # seconds


class EncoderError(Exception):
    """Base class for embedding errors."""


class EncoderConfigError(EncoderError):
    """Bad settings, missing ML libraries, a rejected API key, or the wrong model."""


class EncoderUnavailable(EncoderError):
    """The embedding server is unreachable, failing, or sent a bad response."""


class EncoderInputError(EncoderError):
    """The embedding server rejected the query text."""


class Encoder(Protocol):
    has_sparse: bool

    def embed_dense(self, text: str) -> List[float]: ...

    def embed_sparse(self, text: str) -> Optional[SparseVector]: ...

    def check(self) -> None: ...

    def describe(self) -> str: ...


class LocalEncoder:
    """Embed queries with models loaded in this process."""

    has_sparse = True

    def __init__(self, dense_model: str, sparse_model: str):
        try:
            from fastembed.embedding import TextEmbedding
            from sentence_transformers import SparseEncoder
        except ImportError as e:
            raise EncoderConfigError(
                f"EMBEDDING_MODE=local needs fastembed and sentence-transformers ({e}). "
                "Install requirements/requirements-embed-local.txt, "
                "or set EMBEDDING_MODE=tei."
            ) from e
        self.dense_name = dense_model
        self.sparse_name = sparse_model
        self.dense_model = TextEmbedding(model_name=dense_model, max_length=512)
        self.sparse_model = SparseEncoder(sparse_model)

    def embed_dense(self, text: str) -> List[float]:
        return list(list(self.dense_model.embed(text))[0])

    def embed_sparse(self, text: str) -> SparseVector:
        result = self.sparse_model.encode(text).coalesce()
        return SparseVector(
            indices=result.indices().tolist()[0],
            values=result.values().tolist(),
        )

    def check(self) -> None:
        pass

    def describe(self) -> str:
        return f"local dense={self.dense_name}, sparse={self.sparse_name}"


class TEIEncoder:
    """
    Embed queries by calling TEI servers. The constructor does no network I/O;
    call ``check()`` at startup to confirm the servers run the expected models.
    """

    def __init__(
        self,
        dense_url: str,
        dense_model: str,
        sparse_url: Optional[str] = None,
        sparse_model: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout: float = TIMEOUT,
        transport: Optional[httpx.BaseTransport] = None,
    ):
        headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}

        def client(url: str) -> httpx.Client:
            return httpx.Client(
                base_url=url, headers=headers, timeout=timeout, transport=transport
            )

        self.dense_url = dense_url.rstrip("/")
        self.dense_model = dense_model
        self._dense_http = client(self.dense_url)
        self.sparse_url = sparse_url.rstrip("/") if sparse_url else None
        self.sparse_model = sparse_model
        self._sparse_http = client(self.sparse_url) if self.sparse_url else None

    @property
    def has_sparse(self) -> bool:
        return self._sparse_http is not None

    @staticmethod
    def _request(client: httpx.Client, method: str, path: str, body=None):
        url = str(client.base_url).rstrip("/") + path
        try:
            resp = client.request(method, path, json=body)
        except httpx.HTTPError as e:
            raise EncoderUnavailable(f"{url} unreachable: {e!r}") from e
        if resp.status_code in (401, 403):
            raise EncoderConfigError(f"{url} rejected the API key (EMBEDDING_API_KEY)")
        if resp.status_code in (400, 413, 422):
            raise EncoderInputError(f"{url} rejected the query: {resp.text[:300]}")
        if not resp.is_success:
            raise EncoderUnavailable(
                f"{url} returned {resp.status_code}: {resp.text[:300]}"
            )
        try:
            return resp.json()
        except ValueError as e:
            raise EncoderUnavailable(f"{url} sent a reply that is not JSON") from e

    def embed_dense(self, text: str) -> List[float]:
        data = self._request(
            self._dense_http, "POST", "/embed", {"inputs": text, "truncate": True}
        )
        try:
            (vector,) = data
        except (TypeError, ValueError) as e:
            raise EncoderUnavailable(f"{self.dense_url}/embed sent a bad reply") from e
        return vector

    def embed_sparse(self, text: str) -> Optional[SparseVector]:
        if self._sparse_http is None:
            return None
        data = self._request(
            self._sparse_http,
            "POST",
            "/embed_sparse",
            {"inputs": text, "truncate": True},
        )
        try:
            (terms,) = data
            return SparseVector(
                indices=[t["index"] for t in terms], values=[t["value"] for t in terms]
            )
        except (TypeError, ValueError, KeyError) as e:
            raise EncoderUnavailable(
                f"{self.sparse_url}/embed_sparse sent a bad reply"
            ) from e

    def _check_server(self, client: httpx.Client, expected: str, kind: str) -> None:
        url = str(client.base_url).rstrip("/")
        info = self._request(client, "GET", "/info")
        model_id = info.get("model_id")
        if expected not in (model_id, info.get("served_model_name")):
            raise EncoderConfigError(
                f"{kind} server at {url} serves '{model_id}', expected '{expected}'"
            )
        # a TEI server started without --pooling splade serves the right model
        # but returns the wrong kind of vector
        pooling = info.get("model_type", {}).get("embedding", {}).get("pooling")
        if kind == "sparse" and pooling not in (None, "splade"):
            raise EncoderConfigError(
                f"sparse server at {url} uses {pooling} pooling, not splade"
            )
        dtype = info.get("model_dtype")
        if dtype and dtype != "float32":
            _LOGGER.warning(
                f"{kind} server at {url} runs '{model_id}' as {dtype}; search "
                f"results will differ from the float32 model the index was built with"
            )

    def check(self) -> None:
        self._check_server(self._dense_http, self.dense_model, "dense")
        if self._sparse_http is not None:
            self._check_server(self._sparse_http, self.sparse_model, "sparse")

    def describe(self) -> str:
        sparse = (
            f"{self.sparse_url} ({self.sparse_model})" if self.has_sparse else "off"
        )
        return f"tei dense={self.dense_url} ({self.dense_model}), sparse={sparse}"
