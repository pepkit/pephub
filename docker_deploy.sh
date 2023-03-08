#!/bin/bash

source environment/production.env

docker run -p 8000:8000 \
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
    pephub