# Deployment

## Introduction

PEPhub is a web application. As such, we've configured it for deployment with Docker. To deploy PEPhub within Docker, you need to first build the container, then run it with the proper environment variables.

## Building the container

Build the container with:

```
docker build -t pephub .
```

## Running the container

Make sure you've configured all the necessary environment variables. You can read more about those [here](docs/server-settings.md). We use `.env` files and `source` our environment like so: `source environment/production.test.env`. Then, you can simply run pephub with `docker run -p 80:80 pephub`. You need to ensure you are injecting your environment variables into the container. You can do this by either setting them one-by-one with the `--env` flag, or you may use our provided `launch_docker.sh` script to inject your environment variables from a `.env` file. A workflow might look like this:

```
source environment/production.test.env
./launch_docker.sh
```
