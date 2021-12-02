# pephub
[TODO]

## How to `serve`

### Building container

In the same directory as the `Dockerfile`:

```
docker build -t databio/pephub .
```

### Running container for development:

You can run it directly after installing with `pip install`, like this:

```
pephub serve -p 5000
```

Better, though, is to use the container. Mount the source code directory:

```
docker run -p 5000:80 \
-e MODULE_NAME="pephub.main" \
-v $(pwd)/pephub:/app/pephub \
databio/pephub /start-reload.sh
```

Your development server with hot-reloading will be served at http://localhost:5000

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