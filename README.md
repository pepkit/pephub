<img src="https://img.shields.io/badge/fastapi-109989?style=for-the-badge&logo=FASTAPI&logoColor=white" /> <img src="https://img.shields.io/badge/Python-FFD43B?style=for-the-badge&logo=python&logoColor=blue" /> <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" />

# pephub

**pephub** is a biological metadata server that lets you view, store, and share your sample metadata in form of [PEPs](https://pep.databio.org/en/latest/). It acts as a _database_ to store PEPs, an _API_ to programmatically read and write PEPs, and a _user interface_ to view and manage these PEPs in the database.

## Setup

Already have everything setup? Skip to [running pephub](#running). Two things are required to run pephub: 1) A pephub database, and 2) The pephub server.

### 1. Database Setup

_pephub_ is backed by a [postgres](https://www.postgresql.org/) database to store PEPs. You can easily create a new pephub-compatible postgres instance locally:

```
docker pull postgres
docker run \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=docker \
  -e POSTGRES_DB=pep-db \
  -p 5432:5432 \
  postgres
```

You should now have a pephub-compatible postgres instance running at http://localhost:5432.

Have PEPs you want to load? We have provided a [convenient script](scripts/load_db.py) to load a directory of PEPS into the database.

### 2. `pephub` Server Setup

Install dependencies using `pip` (_We suggest using virtual environments_):

```
python -m venv venv && source venv/bin/activate
pip install -r requirements/requirements-all.txt
```

### 3. (_Optional_) GitHub Authentication Client Setup

_pephub_ uses GitHub for namespacing and authentication. As such, a GitHub application capable of logging in users is required. We've [included instructions](https://github.com/pepkit/pephub/blob/master/docs/authentication.md#setting-up-github-oauth-for-your-own-server) for setting this up locally using your own GitHub account.

### 4. (_Optional_) Vector Database Setup

We've added [semantic-search](https://huggingface.co/course/chapter5/6?fw=tf#using-embeddings-for-semantic-search) capabilities to pephub. Optionally, you may host an instance of the [qdrant](https://qdrant.tech/) **vector database** to store embeddings computed using a sentence transformer that has mined and processed any relevant metadata from PEPs. If no qdrant connection settings are supplied, pephub will default to SQL search. Read more [here](docs/semantic-search.md). To run qdrant locally, simply run the following:

```
docker pull qdrant/qdrant
docker run -p 6333:6333 \
    -v $(pwd)/qdrant_storage:/qdrant/storage \
    qdrant/qdrant
```

## Running

_pephub_ is configured to be run a few different ways. Regardless of how you run it, however, pephub requires many configuration parameters to function. Configuration settings are supplied to pephub through environment variables to allow for flexible development and deployment. The following settings are **required** to run pephub. While pephub has built-in defaults for these settings, you should provide them youself to ensure compatability:

- `POSTGRES_HOST`: The hostname of the PEPhub database server
- `POSTGRES_DB`: The name of the database inside the postgres server
- `POSTGRES_USER`: Username for the database
- `POSTGRES_PASSWORD`: Password for the user
- `POSTGRES_PORT`: Port for postgres database
- `GH_CLIENT_ID`: Client ID for the GitHub application that authenticates users
- `GH_CLIENT_SECRET`: Client secret for the GitHub application that authenticates users
- `BASE_URI`: A BASE URI of the PEPhub (e.g. localhost:8000)

You must set these environment variables prior to running PEPhub. We've provided `env` files inside [`environment`](./environment) which you may `source` to load your environment. Alternatively, you may store them locally in a `.env` file. This file will get loaded and exported to your environment when the server starts up. We've included an [example](environment/template.env) `.env` file with this repository.

You can read more about server settings and configuration [here](docs/server-settings.md).

## Development:

PEPhub consists of a FatsAPI backend, and a React frontend. to get started with development, there are three things you need to do:

**1. Ensure database is set up and running.**  
See [here](#1-database-setup) if you've not setup a database.

**2. Start pephub.**  
You can run pephub natively using the following:

```
uvicorn pephub.main:app --reload
```

_pephub_ should now be running at http://localhost:8000.

**3. Start the React development server:**

_Important:_ To make the development server work, you must include a `.env.local` file inside `web/` with the following contents:

```
VITE_API_HOST=http://localhost:8000
```

This ensures that the frontend development server will proxy requests to the backend server. You can now run the frontend development server:

```bash
cd web
npm install # yarn install
npm start # yarn dev
```

The pephub frontend development server should now be running at http://localhost:5173/.

## Running with docker:

### Option 1. Standalone `docker`:

If you already have a public database instance running, you can choose to build and run the server container only. **A note to Apple Silicon (M1/M2) users**: If you have issues running, try setting your default docker platform with `export DOCKER_DEFAULT_PLATFORM=linux/amd64` to get the container to build and run properly. See [this issue](https://github.com/pepkit/pephub/issues/87) for more information.

**1. Environment:**
Ensure that you have your [environment](docs/server-settings.md) properly configured. To manage secrets in your environment, we leverage `pass` and curated [`.env` files](environment/production.env). You can use our `launch_docker.sh` script to start your container with these `.env` files.

**2. Build and start container:**

```
docker build -t pephub .
./launch_docker.sh

```

Alternatively, you can inject your environment variables one-by-one:

```

docker run -p 8000:8000 \
 -e POSTGRES_HOST=localhost \
 -e POSTGRES_DB=pep-db \
 ...
pephub

```

Or, provide your own `.env` file:

```

docker run -p 8000:8000 \
 --env-file path/to/.env \
 pephub

```

### Option 2. `docker compose`:

The server has been Dockerized and packaged with a [postgres](https://hub.docker.com/_/postgres) image to be run with [`docker compose`](https://docs.docker.com/compose/). This lets you run everything at once and develop without having to manage database instances.

You can start a development environment in two steps:

**1. Curate your environment:**
Since we are running in `docker`, we need to supply environment variables to the container. The `docker-compose.yaml` file is written such that you can supply a `.env` file at the root with your configurations. See the [example env file](environment/template.env) for reference. See [here](docs/server-settings.md) for a detailed explanation of all configurable server settings. For now, you can simply copy the `env` file:

```
cp environment/template.env .env
```

**2. Build and start the containers:**
If you are running on an Apple M-Series chip, you will need to set the following env variable prior to running `docker compose`:

```console
export DOCKER_DEFAULT_PLATFORM=linux/amd64
```

```console
docker compose up --build
```

`pephub` now runs/listens on http://localhost:8000  
`postgres` now runs/listens on http://localhost:5432

**3. (_Optional_) Utilize the [`load_db`](scripts/load_db.py) script to populate the database with `examples/`:**

```console
cd scripts
python load_db.py \
--username docker \
--password password \
--database pephub
../examples
```

**4. (_Optional_) GitHub Authentication Client Setup**

_pephub_ uses GitHub for namespacing and authentication. As such, a GitHub application capable of logging in users is required. We've [included instructions](https://github.com/pepkit/pephub/blob/master/docs/authentication.md#setting-up-github-oauth-for-your-own-server) for setting this up locally using your own GitHub account.

**5. (_Optional_) Vector Database Setup**

We've added [semantic-search](https://huggingface.co/course/chapter5/6?fw=tf#using-embeddings-for-semantic-search) capabilities to pephub. Optionally, you may host an instance of the [qdrant](https://qdrant.tech/) **vector database** to store embeddings computed using a sentence transformer that has mined and processed any relevant metadata from PEPs. If no qdrant connection settings are supplied, pephub will default to SQL search. Read more [here](docs/semantic-search.md). To run qdrant locally, simply run the following:

```
docker pull qdrant/qdrant
docker run -p 6333:6333 \
    -v $(pwd)/qdrant_storage:/qdrant/storage \
    qdrant/qdrant
```

_Note: If you wish to run the development environment with a pubic database, curate your `.env` file as such._
