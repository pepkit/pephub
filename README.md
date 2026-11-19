<p align="center"><img src="https://img.shields.io/badge/fastapi-109989?style=for-the-badge&logo=FASTAPI&logoColor=white" /> <img src="https://img.shields.io/badge/Python-FFD43B?style=for-the-badge&logo=python&logoColor=blue" /> <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" />
</p>

<p align="center">
  <a href="https://pephub.databio.org"><img src="./docs/imgs/pephub_logo_big.svg" alt="PEPhub"></a>


</p>

**PEPhub** is a biological metadata server that lets you view, store, and share your sample metadata in form of [PEPs](https://pep.databio.org/en/latest/). It has 3 components: 1) a _database_ where PEPs are stored; 2) an _API_ to programmatically read and write PEPs in the database; and 3) a web-based _user interface_ to view and manage these PEPs via a front-end.

---

**Deployed public instance**: <a href="https://pephub.databio.org/" target="_blank">https://pephub.databio.org/</a>

**API**: <a href="https://pephub-api.databio.org/api/v1/docs" target="_blank">https://pephub-api.databio.org/api/v1/docs</a>

**Documentation**: <a href="https://pep.databio.org/pephub" target="_blank">https://pep.databio.org/pephub</a>

**Source Code**: <a href="https://github.com/pepkit/pephub" target="_blank">https://github.com/pepkit/pephub</a>

--  -



## Search embeddings

PEPhub's semantic search turns each query into two vectors: a dense one (`sentence-transformers/all-MiniLM-L6-v2`) and a sparse one (`prithivida/Splade_PP_en_v2`). They must come from the same models that built the Qdrant index. The `EMBEDDING_MODE` setting picks where they come from.

**Local mode (default).** PEPhub loads the models itself. This needs the ML libraries (fastembed, sentence-transformers, torch):

```bash
uv pip install -r requirements/requirements-all.txt
uv pip install torch --index-url https://download.pytorch.org/whl/cpu  # optional: CPU-only torch
uv pip install -r requirements/requirements-embed-local.txt
```

**TEI mode.** PEPhub asks an embedding server for the vectors, so it never loads the models and uses much less memory. Any server that speaks the [Hugging Face Text Embeddings Inference](https://github.com/huggingface/text-embeddings-inference) (TEI) API works. Each model has its own base URL. For the lab's embedapi service:

```bash
EMBEDDING_MODE=tei
EMBEDDING_DENSE_URL=https://embed.databio.org/tei/all-MiniLM-L6-v2
EMBEDDING_SPARSE_URL=https://embed.databio.org/tei/splade-pp-en-v2
EMBEDDING_API_KEY=ems_...   # an embedapi service key
```

Or run your own TEI servers, one per model:

```bash
docker run -p 8080:80 -v $PWD/tei-data:/data ghcr.io/huggingface/text-embeddings-inference:cpu-1.9 \
  --model-id sentence-transformers/all-MiniLM-L6-v2
docker run -p 8081:80 -v $PWD/tei-data:/data ghcr.io/huggingface/text-embeddings-inference:cpu-1.9 \
  --model-id prithivida/Splade_PP_en_v2 --pooling splade

EMBEDDING_MODE=tei EMBEDDING_DENSE_URL=http://localhost:8080 EMBEDDING_SPARSE_URL=http://localhost:8081
```

| Setting | Meaning |
|---|---|
| `EMBEDDING_MODE` | `local` (default) or `tei` |
| `EMBEDDING_DENSE_MODEL` | Dense model. Local mode loads it; TEI mode checks the server serves it. Default `sentence-transformers/all-MiniLM-L6-v2` |
| `EMBEDDING_SPARSE_MODEL` | Sparse model, same idea. Default `prithivida/Splade_PP_en_v2`. Empty turns sparse search off in local mode |
| `EMBEDDING_DENSE_URL` | TEI mode: base URL for the dense model (required) |
| `EMBEDDING_SPARSE_URL` | TEI mode: base URL for the sparse model. Leave it out for dense-only search |
| `EMBEDDING_API_KEY` | TEI mode: sent as `Authorization: Bearer <key>` |
| `EMBEDDING_TIMEOUT` | TEI mode: seconds to wait for the server. Default 10 |

At startup PEPhub checks the setup when Qdrant is enabled. It stops with a clear message if a server serves the wrong model, rejects the key, or gives vectors of the wrong size for the Qdrant collection. If the server is down, PEPhub still starts; searches return a 503 error until the server is back.

The Docker images include the local ML libraries by default. Build with `--build-arg LOCAL_EMBED=false` for a slim image that only works in TEI mode.
