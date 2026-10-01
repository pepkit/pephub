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
  - [Sentence Transformer](#sentence-transformer)
    - [`HF_MODEL`](#hf_model)

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

## Sentence Transformer

### `HF_MODEL`

- Description: HuggingFace model name
- Required: No
- Default Value: "BAAI/bge-small-en-v1.5"
