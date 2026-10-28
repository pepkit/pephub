"""
Query encoders for semantic search.

Two encoders share one small interface (``Encoder``):

- ``LocalEncoder`` loads fastembed / sentence-transformers models in-process.
- ``TEIEncoder`` calls any server that speaks the Hugging Face Text Embeddings
  Inference (TEI) HTTP API: ``GET /info``, ``POST /embed``, ``POST /embed_sparse``.
  TEI serves one model per server, so the dense and sparse models each get
  their own base URL.

The heavy ML libraries are only imported inside ``LocalEncoder``, so a server
running with ``EMBEDDING_MODE=tei`` never loads fastembed, sentence-transformers,
or torch.
"""

import logging
from typing import List, Optional, Protocol

import httpx
from qdrant_client.models import SparseVector

from .const import DEFAULT_EMBEDDING_TIMEOUT, PKG_NAME

_LOGGER = logging.getLogger(PKG_NAME)

LOCAL_EMBED_INSTALL_HINT = (
    "Install them with `uv pip install -r requirements/requirements-embed-local.txt` "
    "(install CPU torch first to keep the install small), "
    "or set EMBEDDING_MODE=tei to get embeddings from a TEI server."
)

# TEI error types that mean "this query is the problem", compared lowercase
_INPUT_ERROR_TYPES = {"empty", "validation", "tokenizer"}
_INPUT_ERROR_STATUSES = {400, 413, 422}


class EncoderError(Exception):
    """Base class for all embedding errors."""


class EncoderConfigError(EncoderError):
    """Missing or invalid settings, missing local ML libraries, or a rejected API key."""


class EncoderModelMismatch(EncoderError):
    """The embedding server or model does not match what pephub expects."""


class EncoderUnavailable(EncoderError):
    """The embedding server is unreachable, failing, or returned garbage."""


class EncoderInputError(EncoderError):
    """The embedding server rejected the query text itself."""


class Encoder(Protocol):
    """What the search route and startup checks need from an encoder."""

    has_sparse: bool

    def embed_dense(self, text: str) -> List[float]: ...

    def embed_sparse(self, text: str) -> Optional[SparseVector]: ...

    def check(self) -> None:
        """Startup self-check. Raises an ``EncoderError`` on problems."""

    def describe(self) -> str:
        """One line for logs. Never includes the API key."""


class LocalEncoder:
    """
    Embed queries with models loaded in this process.
    """

    def __init__(self, dense_model: str, sparse_model: Optional[str]):
        try:
            from fastembed.embedding import TextEmbedding
            from sentence_transformers import SparseEncoder
        except ImportError as e:
            raise EncoderConfigError(
                f"EMBEDDING_MODE=local needs fastembed and sentence-transformers, "
                f"but they are not installed ({e}). {LOCAL_EMBED_INSTALL_HINT}"
            ) from e

        self._dense_name = dense_model
        self._sparse_name = sparse_model or None
        _LOGGER.info(f"Dense model in use (local): {dense_model}")
        self.dense_model = TextEmbedding(model_name=dense_model, max_length=512)

        if sparse_model:
            _LOGGER.info(f"Sparse model in use (local): {sparse_model}")
            self.sparse_model = SparseEncoder(sparse_model)
        else:
            self.sparse_model = None

    @property
    def has_sparse(self) -> bool:
        return self.sparse_model is not None

    def embed_dense(self, text: str) -> List[float]:
        return list(list(self.dense_model.embed(text))[0])

    def embed_sparse(self, text: str) -> Optional[SparseVector]:
        if self.sparse_model is None:
            return None
        result = self.sparse_model.encode(text).coalesce()
        return SparseVector(
            indices=result.indices().tolist()[0],
            values=result.values().tolist(),
        )

    def check(self) -> None:
        # models are loaded in __init__, nothing more to verify
        return None

    def describe(self) -> str:
        return f"local dense={self._dense_name}, sparse={self._sparse_name or 'off'}"


class TEIEncoder:
    """
    Embed queries by calling Hugging Face Text Embeddings Inference servers.

    The constructor does no network I/O; call ``check()`` at startup.
    """

    def __init__(
        self,
        dense_url: str,
        sparse_url: Optional[str] = None,
        api_key: Optional[str] = None,
        expected_dense_model: Optional[str] = None,
        expected_sparse_model: Optional[str] = None,
        timeout: float = DEFAULT_EMBEDDING_TIMEOUT,
        transport: Optional[httpx.BaseTransport] = None,
    ):
        if not dense_url:
            raise EncoderConfigError("EMBEDDING_MODE=tei requires EMBEDDING_DENSE_URL")
        self.dense_url = dense_url.rstrip("/")
        self.sparse_url = sparse_url.rstrip("/") if sparse_url else None
        if self.sparse_url and self.sparse_url == self.dense_url:
            raise EncoderConfigError(
                "EMBEDDING_DENSE_URL and EMBEDDING_SPARSE_URL are the same; "
                "a TEI server serves one model, so the dense and sparse models "
                "need separate servers"
            )
        self.expected_dense_model = expected_dense_model or None
        self.expected_sparse_model = expected_sparse_model or None

        headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}

        def make_client(url: str) -> httpx.Client:
            return httpx.Client(
                base_url=url,
                headers=headers,
                timeout=timeout,
                transport=transport,
            )

        self._dense_http = make_client(self.dense_url)
        self._sparse_http = make_client(self.sparse_url) if self.sparse_url else None

    @property
    def has_sparse(self) -> bool:
        return self._sparse_http is not None

    # -- HTTP plumbing --------------------------------------------------

    @staticmethod
    def _request(client: httpx.Client, method: str, path: str, body=None):
        url = str(client.base_url).rstrip("/")
        try:
            resp = client.request(method, path, json=body)
        except httpx.HTTPError as e:
            msg = f"embedding server at {url} unreachable: {e!r}"
            _LOGGER.error(msg)
            raise EncoderUnavailable(msg) from e

        if resp.is_success:
            try:
                return resp.json()
            except ValueError as e:
                msg = f"unexpected response shape from {url}{path}"
                _LOGGER.error(msg)
                raise EncoderUnavailable(msg) from e

        if resp.status_code in (401, 403):
            # TEI sends an empty body here, so do not try to parse it
            msg = f"embedding server at {url} rejected the API key (EMBEDDING_API_KEY)"
            _LOGGER.error(msg)
            raise EncoderConfigError(msg)

        error_text, error_type = resp.text[:300], None
        try:
            payload = resp.json()
            if isinstance(payload, dict):
                error_text = str(payload.get("error", error_text))
                error_type = payload.get("error_type")
        except ValueError:
            pass
        error_type = error_type.lower() if isinstance(error_type, str) else None

        if error_type is not None:
            is_input = error_type in _INPUT_ERROR_TYPES
        else:
            is_input = resp.status_code in _INPUT_ERROR_STATUSES
        if is_input:
            _LOGGER.info(f"{url}{path} rejected the input: {error_text}")
            raise EncoderInputError(error_text)
        msg = f"{url}{path} returned {resp.status_code} {error_type or ''}: {error_text}"
        _LOGGER.error(msg)
        raise EncoderUnavailable(msg.replace("  ", " "))

    @staticmethod
    def _bad_shape(client: httpx.Client, path: str) -> EncoderUnavailable:
        msg = f"unexpected response shape from {str(client.base_url).rstrip('/')}{path}"
        _LOGGER.error(msg)
        return EncoderUnavailable(msg)

    # -- encoding -------------------------------------------------------

    def embed_dense(self, text: str) -> List[float]:
        data = self._request(
            self._dense_http, "POST", "/embed", {"inputs": text, "truncate": True}
        )
        if (
            not isinstance(data, list)
            or len(data) != 1
            or not isinstance(data[0], list)
            or not data[0]
            or not all(isinstance(x, (int, float)) for x in data[0])
        ):
            raise self._bad_shape(self._dense_http, "/embed")
        return data[0]

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
            if not isinstance(data, list) or len(data) != 1:
                raise ValueError
            indices = [int(item["index"]) for item in data[0]]
            values = [float(item["value"]) for item in data[0]]
        except (ValueError, TypeError, KeyError):
            raise self._bad_shape(self._sparse_http, "/embed_sparse")
        return SparseVector(indices=indices, values=values)

    # -- startup check --------------------------------------------------

    def _check_server(
        self, client: httpx.Client, kind: str, expected: Optional[str], env_name: str
    ) -> None:
        url = str(client.base_url).rstrip("/")
        info = self._request(client, "GET", "/info")
        if not isinstance(info, dict):
            raise self._bad_shape(client, "/info")
        model_type = info.get("model_type")
        embedding = model_type.get("embedding") if isinstance(model_type, dict) else None
        if embedding is None:
            raise EncoderModelMismatch(
                f"{kind} server at {url} is not an embedding model "
                f"(model_type: {model_type})"
            )
        if kind == "sparse":
            pooling = embedding.get("pooling") if isinstance(embedding, dict) else None
            if pooling is not None and pooling != "splade":
                raise EncoderModelMismatch(
                    f"sparse server at {url} is not running with SPLADE pooling "
                    f"(pooling: {pooling})"
                )

        model_id = info.get("model_id")
        served = info.get("served_model_name")
        if expected:
            if expected not in (model_id, served):
                raise EncoderModelMismatch(
                    f"{kind} server at {url} serves '{model_id}', "
                    f"expected '{expected}' ({env_name})"
                )
        else:
            _LOGGER.info(f"{kind} server at {url} serves model '{model_id}'")

    def check(self) -> None:
        self._check_server(
            self._dense_http, "dense", self.expected_dense_model, "EMBEDDING_DENSE_MODEL"
        )
        if self._sparse_http is not None:
            self._check_server(
                self._sparse_http,
                "sparse",
                self.expected_sparse_model,
                "EMBEDDING_SPARSE_MODEL",
            )

    def describe(self) -> str:
        dense = f"tei dense={self.dense_url}"
        if self.expected_dense_model:
            dense += f" ({self.expected_dense_model})"
        if self.sparse_url:
            sparse = f"sparse={self.sparse_url}"
            if self.expected_sparse_model:
                sparse += f" ({self.expected_sparse_model})"
        else:
            sparse = "sparse=off"
        return f"{dense}, {sparse}"
