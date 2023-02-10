<img src="https://img.shields.io/badge/fastapi-109989?style=for-the-badge&logo=FASTAPI&logoColor=white" /> <img src="https://img.shields.io/badge/Python-FFD43B?style=for-the-badge&logo=python&logoColor=blue" /> <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" />

# pephub
**pephub** is a biological metadata server that lets you view, store, and share your [PEPs](https://pep.databio.org/en/latest/). It acts as a *database* to store PEPs, an *API* to programmatically read and write PEPs, and a *user interface* to view and manage these PEPs in the database.

## Setup
Already have everything setup? Skip to [running pephub](#running). Two things are required to run pephub: 1) A pephub database, and 2) The pephub server.

### 1. Database Setup
*pephub* is backed by a [postgres](https://www.postgresql.org/) database to store PEPs. You can easily create a new pephub-compatible postgres instance locally:

```
sh setup_db.sh
docker pull postgres
docker build -t pephub_db postgres/
docker run -p 5432:54432 pephub_db
```

You should now have a pephub-compatible postgres instance running at http://localhost:5432.

Have PEPs you want to load? We have provided a [convenient script](scripts/load_db.py) to load a directory of PEPS into the database.

### 2. `pephub` Server Setup
Install dependencies using `pip` (*We suggest using virtual environments*):

```
python -m venv .venv && source .venv/bin/activate
pip install -r requirements/requirements-all.txt
```

### 3. (*Optional*) GitHub Authentication Client Setup
*pephub* uses GitHub for namespacing and authentication. As such, a GitHub application capable of logging in users is required. See the [GitHub instructions](https://docs.github.com/en/developers/apps/building-github-apps/creating-a-github-app) for information on setting up a new GitHub app.

### 4. (*Optional*) Vector Database Setup
We've added [semantic-search](https://huggingface.co/course/chapter5/6?fw=tf#using-embeddings-for-semantic-search) capabilities to pephub. Optionally, you may host an instance of the [qdrant](https://qdrant.tech/) **vector database** to store embeddings computed using a sentence transformer that has mined and processed any relevant metadata from PEPs. If no database connection settings are supplied, pephub will default to SQL search. Read more [here](docs/semantic-search.md). To run qdrant locally, simply run the following:


```
docker pull qdrant/qdrant
docker run -p 6333:6333 \
    -v $(pwd)/qdrant_storage:/qdrant/storage \
    qdrant/qdrant
```

## Running
*pephub* is configured to be run many different ways. Regardless of how you run it, however, pephub requires many configuration parameters to function. Configuration settings are supplied to pephub through environment variables to allow for flexible development and deployment. The following settings are **required** to run pephub. While pephub has built-in defaults for these settings, you should provide them youself to ensure compatability:

- `POSTGRES_HOST`: The hostname of the pephub database server
- `POSTGRES_DB`: The name of the database inside the postgres server
- `POSTGRES_USER`: Username for the database
- `POSTGRES_PASSWORD`: Password for the user
- `POSTGRES_PORT`: Port for postgres database
- `GH_CLIENT_ID`: Client ID for the github application that authenticates users
- `GH_CLIENT_SECRET`: Client secret for the github application that authenticates users
- `REDIRECT_URI`: A redirect URI that matches that of the GitHub application

You must set these environment variables prior to running pephub. Alternatively, you may store them locally in a `.env` file. This file will get loaded and exported to your environment when the server starts up. We've included an [example](environment/template.env) `.env` file with this repository.

You can read more about server settings and configuration [here](docs/server-settings.md).

### Running For Development:

**1. Ensure database is setup and running.**  
See [here](#1-database-setup) if you've not setup a database.

**2. Start pephub.**  
You can run pephub natively using the following:

```
uvicorn pephub.main:app --reload
```

*pephub* should now be running at http://localhost:8000.

## Running with docker:

### Option 1. Standalone `docker`:

If you already have a public database instance running, you can choose to build and run the server container only. 

**1. Environment:**  
Ensure that you have your [environment](docs/server-settings.md) properly configured. Store your settings inside a `.env` file. You can inject these into the container using the `--env-file` flag.

**2. Start container:**
```
docker build -t pephub .
docker run -p 8000:8000 --env-file .env pephub
```

Alternatively, you can inject your environmnet variables one-by-one:

```
docker run -p 8000:8000 \
  -e POSTGRES_HOST=localhost \
  -e POSTGRES_DB=pep-db \
  ...
  pephub
```

### Option 2. `docker compose`:
The server has been Dockerized and packaged with a [postgres](https://hub.docker.com/_/postgres) image to be run with [`docker compose`](https://docs.docker.com/compose/). This lets you run everything at once and develop without having to manage database instances. The `docker-compose.yaml` file is written such that it mounts the database storage info to a folder called `postgres/` at the root of the repository. This lets you load the database once and have it persist its state after restarting the container.

You can start a development environment in three steps:

**1. Obtain the latest database schema:**
```console
sh setup_db.sh
```

**2. Curate your environment:**
Since we are running in `docker`, we need to supply environment variables to the container. The `docker-compose.yaml` file is written such that you can supply a `.env` file at the root with your configurations. See the [example env file](environment/template.env) for reference. See [here](docs/server-settings.md) for a detailed explanation of all configurable server settings. For now, you can simply copy the `env` file:

```
cp environment/template.env .env
```

**3. Build and start the containers:**
If you are running on an Apple M1 chip, you will need to set the following env variable prior to running `docker compose`:

```console
export DOCKER_DEFAULT_PLATFORM=linux/amd64
```

```console
docker compose up --build
```

`pephub` now runs/listens on http://localhost:8000  
`postgres` now runs/listens on http://localhost:5432

**3. Utilize the [`load_db`](scripts/load_db.py) script to populate the database with `examples/`:**
```console
cd scripts
python load_db.py \
--username docker \
--password password \
--database pephub
../examples
```

*Note: If you wish to run the development environment with a pubic database, curate your `.env` file as such.*

## Running container for production:
Build the container:

```
docker build -t pephubserver .
```

Run the container using the pephub `cli` as entrypoint. Ensure that you provide it with the necessary environment variables:

```
docker run --rm -d -p 80:80 \
--name pephubservercon \
--env-file .env \
pephubserver pephub serve
```

## Running tests:
Just as our development environment is identical to our production environment, we are going to run our tests in the same environment as well:

Build our test container:

```
docker build -t pephubserver-tests .
```

Run the container with the pre-written shell script:

```
./run_tests.sh
```
_Note you may need to update permissions on this file to run directly. (`chmod +x run_tests.sh`)_

Otherwise you can run the following command directly:

```
docker run --rm \
--name pephubserver-tests \
-v $(pwd)/tests:/app/tests \
pephubserver-tests
```
