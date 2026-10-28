import json
import os
import subprocess
import sys
from unittest import mock

import httpx
import pytest

myPath = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, myPath + "/../")

from qdrant_client.models import SparseVector  # noqa: E402

from pephub.embedding import (  # noqa: E402
    EncoderConfigError,
    EncoderError,
    EncoderInputError,
    EncoderModelMismatch,
    EncoderUnavailable,
    TEIEncoder,
)

DENSE_URL = "http://dense.test"
SPARSE_URL = "http://sparse.test"
DENSE = [0.1, 0.2, 0.3]
SPARSE = [{"index": 5, "value": 0.7}, {"index": 42, "value": 1.3}]

# shapes of GET /info from TEI v1.9.4
DENSE_INFO = {
    "model_id": "BAAI/bge-small-en-v1.5",
    "model_sha": None,
    "model_dtype": "float32",
    "served_model_name": "BAAI/bge-small-en-v1.5",
    "model_type": {"embedding": {"pooling": "cls"}},
    "max_input_length": 512,
    "version": "1.9.4",
}
SPARSE_INFO = dict(
    DENSE_INFO,
    model_id="prithivida/Splade_PP_en_v2",
    served_model_name="prithivida/Splade_PP_en_v2",
    model_type={"embedding": {"pooling": "splade"}},
)


def fake_tei(seen, info=None):
    """A fake TEI v1.9.4: /info, /embed on the dense host, /embed_sparse on the sparse host."""

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(request)
        host, path = request.url.host, request.url.path
        if path == "/info":
            default = SPARSE_INFO if host == "sparse.test" else DENSE_INFO
            return httpx.Response(200, json=(info or {}).get(host, default))
        if path == "/embed" and host == "dense.test":
            return httpx.Response(200, json=[DENSE])
        if path == "/embed_sparse" and host == "sparse.test":
            return httpx.Response(200, json=[SPARSE])
        return httpx.Response(404, text="")

    return handler


def make(handler, sparse=True, api_key="sk-test", **kwargs):
    return TEIEncoder(
        dense_url=DENSE_URL + "/",
        sparse_url=SPARSE_URL if sparse else None,
        api_key=api_key,
        transport=httpx.MockTransport(handler),
        **kwargs,
    )


def test_dense_request_and_response():
    seen = []
    enc = make(fake_tei(seen))
    assert enc.embed_dense("hello") == DENSE
    (req,) = seen
    assert str(req.url) == "http://dense.test/embed"
    assert json.loads(req.content) == {"inputs": "hello", "truncate": True}
    assert req.headers["authorization"] == "Bearer sk-test"


def test_sparse_request_and_response():
    seen = []
    enc = make(fake_tei(seen))
    result = enc.embed_sparse("hello")
    assert result == SparseVector(indices=[5, 42], values=[0.7, 1.3])
    (req,) = seen
    assert str(req.url) == "http://sparse.test/embed_sparse"
    assert json.loads(req.content) == {"inputs": "hello", "truncate": True}


def test_no_sparse_url():
    seen = []
    enc = make(fake_tei(seen), sparse=False)
    assert enc.has_sparse is False
    assert enc.embed_sparse("hello") is None
    assert seen == []


def test_no_api_key_sends_no_auth_header():
    seen = []
    enc = make(fake_tei(seen), api_key=None)
    enc.embed_dense("hello")
    assert "authorization" not in seen[0].headers


def test_same_url_for_dense_and_sparse_is_rejected():
    with pytest.raises(EncoderConfigError):
        TEIEncoder(dense_url="http://x.test", sparse_url="http://x.test/")


def test_missing_dense_url_is_rejected():
    with pytest.raises(EncoderConfigError):
        TEIEncoder(dense_url="")


def test_describe_hides_api_key():
    enc = make(fake_tei([]), expected_dense_model="m")
    assert "sk-test" not in enc.describe()
    assert DENSE_URL in enc.describe()


def status_handler(status, body):
    def handler(request):
        if isinstance(body, (dict, list)):
            return httpx.Response(status, json=body)
        return httpx.Response(status, content=body)

    return handler


def tei_error(error, error_type):
    return {"error": error, "error_type": error_type}


ERROR_CASES = [
    (401, b"", EncoderConfigError),
    (403, b"", EncoderConfigError),
    (400, tei_error("empty", "Empty"), EncoderInputError),
    (413, tei_error("too many", "Validation"), EncoderInputError),
    (422, tei_error("tokenize", "Tokenizer"), EncoderInputError),
    (400, tei_error("empty", "empty"), EncoderInputError),
    (413, tei_error("too many", "validation"), EncoderInputError),
    (424, tei_error("boom", "Backend"), EncoderUnavailable),
    (424, tei_error("boom", "backend"), EncoderUnavailable),
    (429, tei_error("busy", "Overloaded"), EncoderUnavailable),
    (503, tei_error("down", "Unhealthy"), EncoderUnavailable),
    (500, b"Internal Server Error", EncoderUnavailable),
    (404, b"", EncoderUnavailable),
    # no error_type: fall back on the status code
    (413, b"too long", EncoderInputError),
    (502, b"bad gateway", EncoderUnavailable),
]


@pytest.mark.parametrize("status,body,expected", ERROR_CASES)
def test_error_mapping(status, body, expected):
    enc = make(status_handler(status, body))
    with pytest.raises(expected) as e:
        enc.embed_dense("hello")
    assert type(e.value) is expected
    assert "sk-test" not in str(e.value)


def test_unavailable_message_has_tei_error_text():
    enc = make(status_handler(424, tei_error("model crashed", "Backend")))
    with pytest.raises(EncoderUnavailable) as e:
        enc.embed_dense("hello")
    assert "model crashed" in str(e.value)
    assert "424" in str(e.value)


def test_connect_error_and_timeout():
    def refuse(request):
        raise httpx.ConnectError("connection refused", request=request)

    def slow(request):
        raise httpx.ReadTimeout("timed out", request=request)

    for handler in (refuse, slow):
        with pytest.raises(EncoderUnavailable):
            make(handler).embed_dense("hello")
        with pytest.raises(EncoderUnavailable):
            make(handler).embed_sparse("hello")


@pytest.mark.parametrize(
    "body",
    [{"nope": 1}, [], [[]], [DENSE, DENSE], ["x"], [["a", "b"]]],
)
def test_malformed_dense_body(body):
    with pytest.raises(EncoderUnavailable):
        make(status_handler(200, body)).embed_dense("hello")


def test_non_json_200_body():
    with pytest.raises(EncoderUnavailable):
        make(status_handler(200, b"<html>")).embed_dense("hello")


@pytest.mark.parametrize("body", [{"a": 1}, [[{"idx": 1}]], [[1, 2]], []])
def test_malformed_sparse_body(body):
    with pytest.raises(EncoderUnavailable):
        make(status_handler(200, body)).embed_sparse("hello")


# -- check() ---------------------------------------------------------------


def test_check_passes_on_model_id():
    seen = []
    enc = make(
        fake_tei(seen),
        expected_dense_model="BAAI/bge-small-en-v1.5",
        expected_sparse_model="prithivida/Splade_PP_en_v2",
    )
    enc.check()
    assert [r.url.path for r in seen] == ["/info", "/info"]
    assert all(r.headers["authorization"] == "Bearer sk-test" for r in seen)


def test_check_passes_on_served_model_name():
    info = {"dense.test": dict(DENSE_INFO, model_id="/data/model", served_model_name="my-name")}
    make(fake_tei([], info), sparse=False, expected_dense_model="my-name").check()


def test_check_without_expected_model_passes():
    make(fake_tei([])).check()


def test_check_model_mismatch_names_both():
    enc = make(fake_tei([]), expected_dense_model="sentence-transformers/all-MiniLM-L6-v2")
    with pytest.raises(EncoderModelMismatch) as e:
        enc.check()
    assert "BAAI/bge-small-en-v1.5" in str(e.value)
    assert "all-MiniLM-L6-v2" in str(e.value)


def test_check_sparse_model_mismatch():
    enc = make(fake_tei([]), expected_sparse_model="other/splade")
    with pytest.raises(EncoderModelMismatch):
        enc.check()


def test_check_rejects_reranker():
    info = {"dense.test": dict(DENSE_INFO, model_type={"reranker": {}})}
    with pytest.raises(EncoderModelMismatch):
        make(fake_tei([], info), sparse=False).check()


def test_check_rejects_sparse_server_without_splade_pooling():
    info = {"sparse.test": dict(SPARSE_INFO, model_type={"embedding": {"pooling": "cls"}})}
    with pytest.raises(EncoderModelMismatch) as e:
        make(fake_tei([], info)).check()
    assert "SPLADE" in str(e.value)


def test_check_info_401_is_config_error():
    with pytest.raises(EncoderConfigError):
        make(status_handler(401, b"")).check()


def test_check_unreachable_is_unavailable():
    def refuse(request):
        raise httpx.ConnectError("refused", request=request)

    with pytest.raises(EncoderUnavailable):
        make(refuse).check()


# -- verify_encoder --------------------------------------------------------


@pytest.fixture(scope="module")
def deps():
    with mock.patch("pepdbagent.PEPDatabaseAgent"):
        import pephub.dependencies as d
    return d


class FakeEncoder:
    def __init__(self, dim=3, has_sparse=True):
        self.dim = dim
        self.has_sparse = has_sparse
        self.checked = False

    def embed_dense(self, text):
        return [0.0] * self.dim

    def embed_sparse(self, text):
        return None

    def check(self):
        self.checked = True

    def describe(self):
        return "fake"


def fake_qdrant(size=3, sparse=True):
    q = mock.MagicMock()
    params = q.get_collection.return_value.config.params
    params.vectors = {"dense": mock.Mock(size=size)}
    params.sparse_vectors = {"sparse": mock.Mock()} if sparse else None
    return q


def test_verify_ok(deps):
    enc = FakeEncoder()
    deps.verify_encoder(enc, fake_qdrant())
    assert enc.checked


def test_verify_dimension_mismatch(deps):
    with pytest.raises(EncoderModelMismatch) as e:
        deps.verify_encoder(FakeEncoder(dim=384), fake_qdrant(size=768))
    assert "384" in str(e.value) and "768" in str(e.value)


def test_verify_sparse_missing_from_collection(deps):
    with pytest.raises(EncoderModelMismatch):
        deps.verify_encoder(FakeEncoder(), fake_qdrant(sparse=False))


def test_verify_dense_only_encoder_ignores_missing_sparse(deps):
    deps.verify_encoder(FakeEncoder(has_sparse=False), fake_qdrant(sparse=False))


def test_verify_missing_collection_is_skipped(deps, caplog):
    q = mock.MagicMock()
    q.get_collection.side_effect = RuntimeError("collection not found")
    enc = FakeEncoder(dim=5)
    deps.verify_encoder(enc, q)
    assert enc.checked


# -- initialize_encoder ----------------------------------------------------


def test_initialize_encoder_unknown_mode(deps, monkeypatch):
    monkeypatch.setenv("EMBEDDING_MODE", "remote")
    with pytest.raises(EncoderConfigError) as e:
        deps.initialize_encoder()
    assert "local" in str(e.value) and "tei" in str(e.value)


def test_initialize_encoder_tei_requires_url(deps, monkeypatch):
    monkeypatch.setenv("EMBEDDING_MODE", "tei")
    monkeypatch.delenv("EMBEDDING_DENSE_URL", raising=False)
    with pytest.raises(EncoderConfigError) as e:
        deps.initialize_encoder()
    assert "EMBEDDING_DENSE_URL" in str(e.value)


def test_initialize_encoder_bad_timeout(deps, monkeypatch):
    monkeypatch.setenv("EMBEDDING_MODE", "tei")
    monkeypatch.setenv("EMBEDDING_DENSE_URL", "http://tei.test")
    monkeypatch.setenv("EMBEDDING_TIMEOUT", "soon")
    with pytest.raises(EncoderConfigError):
        deps.initialize_encoder()


def test_initialize_encoder_tei_reads_settings(deps, monkeypatch):
    monkeypatch.setenv("EMBEDDING_MODE", "tei")
    monkeypatch.setenv("EMBEDDING_DENSE_URL", "http://d.test")
    monkeypatch.setenv("EMBEDDING_SPARSE_URL", "http://s.test")
    monkeypatch.setenv("EMBEDDING_DENSE_MODEL", "m1")
    monkeypatch.setenv("EMBEDDING_SPARSE_MODEL", "m2")
    monkeypatch.setenv("EMBEDDING_API_KEY", "k")
    monkeypatch.setenv("EMBEDDING_TIMEOUT", "3")
    enc = deps.initialize_encoder()
    assert isinstance(enc, TEIEncoder)
    assert enc.has_sparse
    assert (enc.expected_dense_model, enc.expected_sparse_model) == ("m1", "m2")
    assert enc._dense_http.headers["authorization"] == "Bearer k"
    assert enc._dense_http.timeout.read == 3


def test_build_encoder_without_qdrant(deps):
    assert deps.build_encoder(None) is None


def test_build_encoder_fails_fast(deps, monkeypatch):
    monkeypatch.setenv("EMBEDDING_MODE", "tei")
    monkeypatch.delenv("EMBEDDING_DENSE_URL", raising=False)
    with pytest.raises(EncoderError):
        deps.build_encoder(fake_qdrant())


# -- search route ----------------------------------------------------------


class FailingEncoder(FakeEncoder):
    def __init__(self, error):
        super().__init__()
        self.error = error

    def embed_dense(self, text):
        raise self.error


@pytest.mark.parametrize(
    "error,status",
    [
        (EncoderUnavailable("server at http://tei.test unreachable"), 503),
        (EncoderInputError("inputs cannot be empty"), 400),
    ],
)
def test_search_route_maps_encoder_errors(deps, error, status):
    from fastapi.testclient import TestClient

    # the auth router reads BASE_URI at import time
    os.environ.setdefault("BASE_URI", "http://localhost:8000")
    from pephub.main import app

    agent = mock.MagicMock()
    app.dependency_overrides[deps.get_encoder] = lambda: FailingEncoder(error)
    app.dependency_overrides[deps.get_qdrant] = lambda: mock.MagicMock()
    app.dependency_overrides[deps.get_db] = lambda: agent
    try:
        client = TestClient(app)
        resp = client.post("/api/v1/search/", json={"query": "lung"})
    finally:
        app.dependency_overrides.clear()
    assert resp.status_code == status
    assert str(error) in resp.json()["detail"]


# -- import hygiene --------------------------------------------------------


def run_python(code, **env_overrides):
    env = dict(os.environ, **env_overrides)
    return subprocess.run(
        [sys.executable, "-c", code],
        cwd=os.path.join(myPath, ".."),
        env=env,
        capture_output=True,
        text=True,
    )


HEAVY_CHECK = """
import importlib.util, sys
heavy = ["sentence_transformers", "torch"]
# qdrant-client imports fastembed on its own when it is installed, so
# fastembed is only checked in an install without the local extras.
if importlib.util.find_spec("fastembed") is None:
    heavy.append("fastembed")
loaded = [m for m in heavy if m in sys.modules]
assert not loaded, loaded
"""


def test_tei_mode_does_not_import_ml_libs():
    # fresh interpreter so other tests' imports don't leak in;
    # the database agent is mocked so no postgres is needed
    code = (
        """
from unittest import mock
with mock.patch("pepdbagent.PEPDatabaseAgent"):
    import pephub.dependencies as d
assert d.get_encoder() is None
"""
        + HEAVY_CHECK
    )
    result = run_python(
        code,
        EMBEDDING_MODE="tei",
        EMBEDDING_DENSE_URL="http://tei.test",
        QDRANT_ENABLED="false",
    )
    assert result.returncode == 0, result.stderr


def test_building_tei_encoder_does_not_import_ml_libs():
    code = (
        """
from pephub.embedding import TEIEncoder
TEIEncoder(dense_url="http://tei.test")
"""
        + HEAVY_CHECK
    )
    result = run_python(code)
    assert result.returncode == 0, result.stderr


def test_local_mode_without_ml_libs_explains_fix():
    try:
        import fastembed  # noqa: F401
        import sentence_transformers  # noqa: F401

        pytest.skip("local embedding libraries are installed")
    except ImportError:
        pass
    from pephub.embedding import LocalEncoder

    with pytest.raises(EncoderConfigError) as e:
        LocalEncoder(dense_model="x", sparse_model="y")
    assert "requirements-embed-local.txt" in str(e.value)
    assert "EMBEDDING_MODE=tei" in str(e.value)
