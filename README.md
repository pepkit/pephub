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

PEPhub's semantic search turns each query into embedding vectors. Choose how with the `EMBEDDING_MODE` environment variable. The models must match the ones used to build the Qdrant index.

**Local mode (default).** PEPhub loads the models itself. This needs the ML libraries (fastembed, sentence-transformers, torch):

```bash
uv pip install -r requirements/requirements-all.txt
uv pip install torch --index-url https://download.pytorch.org/whl/cpu  # optional: CPU-only torch
uv pip install -r requirements/requirements-embed-local.txt
```

**TEI mode.** PEPhub asks [Hugging Face Text Embeddings Inference](https://github.com/huggingface/text-embeddings-inference) (TEI) servers for the vectors, so it never loads the ML libraries and uses much less memory. TEI serves one model per server: run one for the dense model and, optionally, one for the sparse (SPLADE) model.

```bash
docker run -p 8080:80 -v $PWD/tei-data:/data ghcr.io/huggingface/text-embeddings-inference:cpu-1.9 \
  --model-id BAAI/bge-small-en-v1.5
docker run -p 8081:80 -v $PWD/tei-data:/data ghcr.io/huggingface/text-embeddings-inference:cpu-1.9 \
  --model-id prithivida/Splade_PP_en_v2 --pooling splade

EMBEDDING_MODE=tei EMBEDDING_DENSE_URL=http://localhost:8080 EMBEDDING_SPARSE_URL=http://localhost:8081
```

To protect a TEI server, start it with `--api-key <key>` and give PEPhub the same key in `EMBEDDING_API_KEY`. Leave out `EMBEDDING_SPARSE_URL` for dense-only search.

At startup PEPhub checks the servers and the Qdrant collection, and stops with a clear message if something does not match. If a TEI server fails during a search, the request returns a 503 error. See [server settings](docs/developer/server-settings.md#embeddings) for every `EMBEDDING_*` variable.

The Docker images include the local ML libraries by default. Build with `--build-arg LOCAL_EMBED=false` for a slim image that only works in TEI mode.
