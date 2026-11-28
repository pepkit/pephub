# Server Settings

Server settings are supplied through environment variables. You may choose to manually export/inject these variables, or you can provide the server with a `.env` file. Upon server start-up, these variables will be injected into the environment.

## Quick Find

- [Server Settings](#server-settings)
  - [Quick Find](#quick-find)
  - [General](#general)
  - [Postgres](#postgres)
    - [`POSTGRES_HOST`](#postgres_host)
    - [`POSTGRES_DB`](#postgres_db)
    - [`POSTGRES_USER`](#postgres_user)
    - [`POSTGRES_PASSWORD`](#postgres_password)
    - [`POSTGRES_PORT`](#postgres_port)
  - [Qdrant](#qdrant)
    - [`QDRANT_HOST`](#qdrant_host)
    - [`QDRANT_PORT`](#qdrant_port)
    - [`QDRANT_ENABLED`](#qdrant_enabled)
    - [`QDRANT_API_KEY`](#qdrant_api_key)
  - [Github Client](#github-client)
    - [`GH_CLIENT_ID`](#gh_client_id)
    - [`GH_CLIENT_SECRET`](#gh_client_secret)
    - [`REDIRECT_URI`](#redirect_uri)
  - [Search embeddings](#search-embeddings)
    - [`EMBEDDING_MODE`](#embedding_mode)
    - [`EMBEDDING_DENSE_MODEL`](#embedding_dense_model)
    - [`EMBEDDING_SPARSE_MODEL`](#embedding_sparse_model)
    - [`EMBEDDING_DENSE_URL`](#embedding_dense_url)
    - [`EMBEDDING_SPARSE_URL`](#embedding_sparse_url)
    - [`EMBEDDING_API_KEY`](#embedding_api_key)

## General

Coming soon...

## Postgres

### `POSTGRES_HOST`

- Description: Hostname of the PostgreSQL server
- Required: Yes
- Default Value: localhost

### `POSTGRES_DB`

- Description: Name of the PostgreSQL database
- Required: Yes
- Default Value: pephub

### `POSTGRES_USER`

- Description: PostgreSQL username
- Required: Yes
- Default Value: postgres

### `POSTGRES_PASSWORD`

- Description: PostgreSQL password
- Required: Yes
- Default Value: docker

### `POSTGRES_PORT`

- Description: PostgreSQL port
- Required: Yes
- Default Value: 5432

## Qdrant

### `QDRANT_HOST`

- Description: Hostname of the Qdrant server
- Required: No
- Default Value: localhost

### `QDRANT_PORT`

- Description: Port of the Qdrant server
- Required: No
- Default Value: 6333

### `QDRANT_ENABLED`

- Description: Enable/disable Qdrant functionality
- Required: No
- Default Value: False

### `QDRANT_API_KEY`

- Description: API key for connecting to Qdrant
- Required: No
- Default Value: Not applicable

## Github Client

### `GH_CLIENT_ID`

- Description: GitHub client ID
- Required: Yes
- Default Value: Not applicable

### `GH_CLIENT_SECRET`

- Description: GitHub client secret
- Required: Yes
- Default Value: Not applicable

### `REDIRECT_URI`

- Description: URI to redirect to after GitHub OAuth flow
- Required: Yes
- Default Value: http://localhost:8000/auth/callback

## Search embeddings

Semantic search turns each query into a dense vector and a sparse vector. They must come from the same models that built the Qdrant index. PEPhub can load the models itself (`local` mode), or ask a server that speaks the Hugging Face [Text Embeddings Inference](https://github.com/huggingface/text-embeddings-inference) (TEI) API (`tei` mode). TEI mode saves about 1.2 GB of memory.

Local mode needs the ML libraries, which are in their own requirements file. The Docker images include them, unless you build with `--build-arg LOCAL_EMBED=false`:

```bash
uv pip install --torch-backend cpu -r requirements/requirements-embed-local.txt
```

When Qdrant is enabled, PEPhub checks the setup at startup. It stops if a server serves the wrong model, rejects the key, or gives vectors that do not fit the Qdrant collection. If the server is down, PEPhub still starts, and searches return a 503 error until the server is back.

### `EMBEDDING_MODE`

- Description: `local` loads the models in PEPhub; `tei` gets the vectors from TEI servers
- Required: No
- Default Value: `local`

### `EMBEDDING_DENSE_MODEL`

- Description: Dense model. Local mode loads it; TEI mode checks that the server serves it
- Required: No
- Default Value: `sentence-transformers/all-MiniLM-L6-v2`

### `EMBEDDING_SPARSE_MODEL`

- Description: Sparse model, used the same way
- Required: No
- Default Value: `prithivida/Splade_PP_en_v2`

### `EMBEDDING_DENSE_URL`

- Description: TEI mode: base URL of the dense model server, for example `https://embeddings.example.org/tei/all-MiniLM-L6-v2`
- Required: In TEI mode

### `EMBEDDING_SPARSE_URL`

- Description: TEI mode: base URL of the sparse model server, for example `https://embeddings.example.org/tei/splade-pp-en-v2`. Needed when the Qdrant collection has sparse vectors
- Required: In TEI mode, for hybrid search

### `EMBEDDING_API_KEY`

- Description: TEI mode: key sent as `Authorization: Bearer <key>`
- Required: No
