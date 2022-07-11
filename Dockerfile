FROM tiangolo/uvicorn-gunicorn:python3.8
LABEL authors="Nathan LeRoy, Michal Stolarczyk, Nathan Sheffield"

COPY . /app
RUN python -m pip install --upgrade pip

RUN mkdir -p -m 0700 ~/.ssh && ssh-keyscan github.com >> ~/.ssh/known_hosts
RUN --mount=type=ssh pip install .