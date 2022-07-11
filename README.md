# pephub
[TODO]

### Running development server:

The server has been Dockerized and packaged with a [postgres](https://hub.docker.com/_/postgres) image to be run with [`docker compose`](https://docs.docker.com/compose/). This lets you run everything at once and develop without having to manage database instances. The `docker-compose.yml` file is written such that it mounts the database storage info to a folder called `postgres-data` at the root of the repository. This lets you load the database once and have it persist its state after restarting the container.

To run:

```console
docker compose up --build
```

`pephub` now runs/listens on http://localhost:8000  
`postgres` now runs/listens on http://localhost:5432

On subsequent startups, you may ignore the `--build` flag if nothing on the Dockerfile or dependency list has changed.

### Running container for production:
Build the container:

```
docker build -t pephubserver .
```

Run the container using the pephub `cli` as entrypoint:

```
docker run --rm -d -p 80:80 \
--name pephubservercon \
pephubserver pephub serve
```

### Running tests:
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