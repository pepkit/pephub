FROM tiangolo/uvicorn-gunicorn:python3.9-slim
LABEL authors="Nathan LeRoy, Nathan Sheffield"

RUN apt-get update
RUN apt-get install -y --no-install-recommends git

EXPOSE 5432

COPY . /app
RUN python -m pip install --upgrade pip
RUN pip install .