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
  - [Embeddings](#embeddings)
    - [`EMBEDDING_MODE`](#embedding_mode)
    - [`EMBEDDING_DENSE_MODEL`](#embedding_dense_model)
    - [`EMBEDDING_SPARSE_MODEL`](#embedding_sparse_model)
    - [`EMBEDDING_DENSE_URL`](#embedding_dense_url)
    - [`EMBEDDING_SPARSE_URL`](#embedding_sparse_url)
    - [`EMBEDDING_API_KEY`](#embedding_api_key)
    - [`EMBEDDING_TIMEOUT`](#embedding_timeout)
    - [Startup checks](#startup-checks)

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

## Embeddings

Semantic search embeds each query as a dense vector and, optionally, a sparse (SPLADE) vector. These settings are only used when Qdrant is enabled. The models must match the ones used to build the Qdrant index.

### `EMBEDDING_MODE`

- Description: Where embeddings come from. `local` loads the models in the PEPhub process (needs `requirements/requirements-embed-local.txt`). `tei` calls Hugging Face Text Embeddings Inference servers. Any other value stops the server at startup.
- Required: No
- Default Value: local

### `EMBEDDING_DENSE_MODEL`

- Description: In `local` mode, the fastembed model to load. In `tei` mode, the model id the dense server is expected to serve; startup fails if `/info` reports a different one. If unset in `tei` mode, the served model is only logged.
- Required: No
- Default Value: sentence-transformers/all-MiniLM-L6-v2 (local mode)

### `EMBEDDING_SPARSE_MODEL`

- Description: In `local` mode, the sentence-transformers SPLADE model to load; set it to an empty string to turn sparse search off. In `tei` mode, the model id the sparse server is expected to serve (optional).
- Required: No
- Default Value: prithivida/Splade_PP_en_v2 (local mode)

### `EMBEDDING_DENSE_URL`

- Description: `tei` mode only. Base URL of the TEI server for the dense model, e.g. `http://localhost:8080`.
- Required: Yes, in `tei` mode

### `EMBEDDING_SPARSE_URL`

- Description: `tei` mode only. Base URL of the TEI server for the sparse model. It must be a different server than the dense one, started with `--pooling splade`. Leave unset for dense-only search.
- Required: No

### `EMBEDDING_API_KEY`

- Description: `tei` mode only. Sent as `Authorization: Bearer <key>` to the TEI servers (start them with `--api-key`).
- Required: No

### `EMBEDDING_TIMEOUT`

- Description: `tei` mode only. Seconds to wait for a TEI server.
- Required: No
- Default Value: 10

### Startup checks

When Qdrant is enabled, PEPhub checks its embedding setup before serving and exits with an error if it finds a problem:

- in `tei` mode, each server's `/info` must report an embedding model (with SPLADE pooling for the sparse server) and, if you set the model variables, the expected model id;
- the dense vector length must equal the size of the `dense` vector in the `pephub` Qdrant collection;
- if sparse embeddings are configured, the collection must have a `sparse` vector.

The length check cannot tell apart two models with the same size, so make sure the model matches the one that built the index. If a TEI server fails while serving a search, the request returns a 503 error.
