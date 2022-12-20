# pephub
**pephub** is a server that allows you to view, store, and share a repository of [PEPs](https://pep.databio.org/en/latest/). It provides a simple user interface to navigate the PEP repository as well as a programmatic API to access and share PEPs.

## Setup
pephub is backed by a [postgres](https://www.postgresql.org/) database to store PEPs. It utilizes a [special client](https://github.com/pepkit/pephub_db) to interface the database and read/write PEPs from the database through [peppy](https://github.com/pepkit/peppy).

To begin, you will need a database of PEPs. You may follow instructions [here](https://github.com/pepkit/pepdbagent/blob/master/docs/db_tutorial.md) to get that running. Once you have a database with the proper schema, you may load your database. This repository is packaged with a [convenient script](./scripts) to load a local folder of PEPs into the database.

After the database is loaded and running, you can now run the pephub server.

## Installation and Running
Simply install the pephub server:

```console
pip install pephub
```

Provide the server with your database credentials through environment variables. You can also provide a `.env` file which will auto-populate the environment. A template for that can be found [here](environment/template.env).

```console
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=...
export POSTGRES_HOST=...
export POSTGRES_DATABASE=...
export GH_CLIENT_ID=...
export GH_CLIENT_SECRET=...
...
```

The following environment variables are **required:**

And run the server! (here we are running on port 8000):

```console
pephub serve -p 8000
```

View your PEPs at http://localhost:8000

## Running the development server:
PEPhub is a [FastAPI](https://fastapi.tiangolo.com/) server. As such, the easiest way to run is with `uvicorn`. The server requires many parameters to function. Namely, the database and authentication secrets. These should be stored in an `.env` folder at the root of the repository. You may use the provided environment file [template](environment/template.env) in this repository. Remember you will need two things: 1) A postgres instance with PEPs and 2) A github application for authentication.

Once you have a proper environment, you can run the server with the following command:

```console
uvicorn pephub.main:app --reload
```

If you are using VSCode, we also have [pre-configured settings](.vscode/launch.json) for the `launch.json` file to attach a debugger.

## Running development server with docker:

The server has been Dockerized and packaged with a [postgres](https://hub.docker.com/_/postgres) image to be run with [`docker compose`](https://docs.docker.com/compose/). This lets you run everything at once and develop without having to manage database instances. The `docker-compose.yml` file is written such that it mounts the database storage info to a folder called `postgres-data` at the root of the repository. This lets you load the database once and have it persist its state after restarting the container.

You can start a development environment in three steps:

**1. Obtain the latest database schema:**
```console
sh setup_dev.sh
```

**2. Build and start the containers:**

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

**Note: If you wish to run the development environment with a pubic database, create a **new** `.env` file and alter your `docker-compose.yaml` file.**

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