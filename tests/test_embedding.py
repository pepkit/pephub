"""
Search embeddings from a TEI server (EMBEDDING_MODE=tei), and the startup checks
that make sure the vectors match the Qdrant index. No network or database needed.
"""

import json
import os
import subprocess
import sys
from unittest import mock

import httpx
import pytest
from qdrant_client.models import SparseVector

from pephub.embedding import (
    EncoderConfigError,
    EncoderInputError,
    EncoderUnavailable,
    TEIEncoder,
)

# one TEI base URL per model
DENSE_URL = "http://embed.test/tei/all-MiniLM-L6-v2"
SPARSE_URL = "http://embed.test/tei/splade-pp-en-v2"
DENSE_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
SPARSE_MODEL = "prithivida/Splade_PP_en_v2"
DENSE = [0.1, 0.2, 0.3]
SPARSE = [{"index": 5, "value": 0.7}, {"index": 42, "value": 1.3}]

# GET /info replies, as TEI 1.9 sends them
INFO = {
    "/tei/all-MiniLM-L6-v2/info": {
        "model_id": DENSE_MODEL,
        "served_model_name": "all-MiniLM-L6-v2",
        "model_dtype": "float32",
        "model_type": {"embedding": {"pooling": "mean"}},
        "max_input_length": 512,
    },
    "/tei/splade-pp-en-v2/info": {
        "model_id": SPARSE_MODEL,
        "served_model_name": "splade-pp-en-v2",
        "model_dtype": "float32",
        "model_type": {"embedding": {"pooling": "splade"}},
        "max_input_length": 512,
    },
}


def fake_tei(seen, info=INFO):
    def handler(request):
        seen.append(request)
        path = request.url.path
        if path in info:
            return httpx.Response(200, json=info[path])
        if path == "/tei/all-MiniLM-L6-v2/embed":
            return httpx.Response(200, json=[DENSE])
        if path == "/tei/splade-pp-en-v2/embed_sparse":
            return httpx.Response(200, json=[SPARSE])
        return httpx.Response(404)

    return handler


def make(handler):
    return TEIEncoder(
        dense_url=DENSE_URL,
        dense_model=DENSE_MODEL,
        sparse_url=SPARSE_URL,
        sparse_model=SPARSE_MODEL,
        api_key="ems_test",
        transport=httpx.MockTransport(handler),
    )


def test_embed_dense_and_sparse():
    seen = []
    enc = make(fake_tei(seen))
    assert enc.embed_dense("lung cancer") == DENSE
    assert enc.embed_sparse("lung cancer") == SparseVector(
        indices=[5, 42], values=[0.7, 1.3]
    )
    assert [str(r.url) for r in seen] == [
        DENSE_URL + "/embed",
        SPARSE_URL + "/embed_sparse",
    ]
    assert all(r.headers["authorization"] == "Bearer ems_test" for r in seen)
    assert json.loads(seen[0].content) == {"inputs": "lung cancer", "truncate": True}


def reply(status, body=b""):
    return lambda request: httpx.Response(status, content=body)


def refuse(request):
    raise httpx.ConnectError("refused", request=request)


@pytest.mark.parametrize(
    "handler, error",
    [
        (reply(401), EncoderConfigError),
        (reply(400, b'{"error": "empty"}'), EncoderInputError),
        (reply(413), EncoderInputError),
        (reply(500), EncoderUnavailable),
        (refuse, EncoderUnavailable),
        (reply(200, b"not json"), EncoderUnavailable),
        (reply(200, b"[]"), EncoderUnavailable),
    ],
)
def test_dense_errors(handler, error):
    with pytest.raises(error):
        make(handler).embed_dense("q")


def test_bad_sparse_reply():
    with pytest.raises(EncoderUnavailable):
        make(reply(200, b'[[{"idx": 1}]]')).embed_sparse("q")


def test_check_passes_and_warns_on_int8(caplog):
    info = dict(INFO)
    sparse_path = "/tei/splade-pp-en-v2/info"
    info[sparse_path] = dict(INFO[sparse_path], model_dtype="int8")
    with caplog.at_level("WARNING", logger="pephub"):
        make(fake_tei([], info)).check()
    assert "int8" in caplog.text


@pytest.mark.parametrize(
    "path, change",
    [
        ("/tei/all-MiniLM-L6-v2/info", {"model_id": "x", "served_model_name": "x"}),
        (
            "/tei/splade-pp-en-v2/info",
            {"model_type": {"embedding": {"pooling": "cls"}}},
        ),
    ],
)
def test_check_rejects_wrong_model(path, change):
    info = dict(INFO)
    info[path] = dict(INFO[path], **change)
    with pytest.raises(EncoderConfigError):
        make(fake_tei([], info)).check()


@pytest.fixture(scope="module")
def deps():
    with mock.patch("pepdbagent.PEPDatabaseAgent"):
        import pephub.dependencies as d
    return d


class FakeEncoder:
    def __init__(self, dim=3, has_sparse=True, down=False):
        self.dim, self.has_sparse, self.down = dim, has_sparse, down

    def check(self):
        if self.down:
            raise EncoderUnavailable("unreachable")

    def embed_dense(self, text):
        return [0.0] * self.dim

    def describe(self):
        return "fake"


def fake_qdrant(size=3, sparse=True):
    q = mock.MagicMock()
    params = q.get_collection.return_value.config.params
    params.vectors = {"dense": mock.Mock(size=size)}
    params.sparse_vectors = {"sparse": mock.Mock()} if sparse else None
    return q


@pytest.mark.parametrize(
    "encoder, qdrant",
    [
        (FakeEncoder(dim=4), fake_qdrant()),
        (FakeEncoder(has_sparse=True), fake_qdrant(sparse=False)),
        (FakeEncoder(has_sparse=False), fake_qdrant(sparse=True)),
    ],
)
def test_build_encoder_rejects_mismatch(deps, monkeypatch, encoder, qdrant):
    monkeypatch.setattr(deps, "initialize_encoder", lambda: encoder)
    with pytest.raises(EncoderConfigError):
        deps.build_encoder(qdrant)


def test_build_encoder(deps, monkeypatch):
    assert deps.build_encoder(None) is None
    for enc in [FakeEncoder(), FakeEncoder(down=True)]:
        monkeypatch.setattr(deps, "initialize_encoder", lambda: enc)
        assert deps.build_encoder(fake_qdrant()) is enc


def test_tei_mode_does_not_import_ml_libs():
    # a fresh interpreter, so imports from other tests don't count
    code = """
import sys
from unittest import mock
with mock.patch("pepdbagent.PEPDatabaseAgent"):
    import pephub.dependencies as d
d.initialize_encoder()
loaded = [m for m in ("sentence_transformers", "torch") if m in sys.modules]
assert not loaded, loaded
"""
    env = dict(
        os.environ,
        EMBEDDING_MODE="tei",
        EMBEDDING_DENSE_URL=DENSE_URL,
        QDRANT_ENABLED="false",
    )
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
    result = subprocess.run(
        [sys.executable, "-c", code], cwd=root, env=env, capture_output=True, text=True
    )
    assert result.returncode == 0, result.stderr
