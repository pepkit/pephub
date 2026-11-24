# Deployment

We provide a [publicly available instance of pephub](https://pephub.databio.org) free to use. However, there are many reasons why you might wish to deploy your own instance. Because of this, we provide detailed instructions and docker containers to spin up your own instance of pephub.


### Build the container

```
docker build -t pephub.databio.org .
```

### Run

PEPhub requires many parameters to run. You can read more about those [here](https://github.com/pepkit/pephub/blob/master/docs/server-settings.md). These must be injected as environment variables. You can manually do this and inject one-by-one. There is an example script in the repo called `launch_docker.sh`.

```
launch_docker.sh
```

The basic steps are:

1. Initialize env vars

```bash
source /home/nsheff/code/pephub/environment/production.env
```

2. Run with docker:

```bash
docker run --rm -p 80:80 \
    --env POSTGRES_HOST=$POSTGRES_HOST \
    --env POSTGRES_DB=$POSTGRES_DB \
    --env POSTGRES_USER=$POSTGRES_USER \
    --env POSTGRES_PASSWORD=$POSTGRES_PASSWORD \
    --env QDRANT_HOST=$QDRANT_HOST \
    --env QDRANT_PORT=$QDRANT_PORT \
    --env QDRANT_ENABLED=$QDRANT_ENABLED \
    --env QDRANT_API_KEY=$QDRANT_API_KEY \
    --env HF_MODEL=$HF_MODEL \
    --env GH_CLIENT_ID=$GH_CLIENT_ID \
    --env GH_CLIENT_SECRET=$GH_CLIENT_SECRET \
    --env REDIRECT_URI=$REDIRECT_URI \
    --env SERVER_ENV=$SERVER_ENV \
    --name pephub pephub
```

3. Visit http://localhost:80 to view the server.
