# -------------
# BUILD BACKEND
# -------------
FROM python:3.13-slim
LABEL authors="Nathan LeRoy, Nathan Sheffield, Oleksandr Khoroshevskyi"

RUN apt-get update
RUN apt-get install -y gcc
RUN apt-get install -y libpq-dev
RUN apt-get install -y --no-install-recommends git

EXPOSE 5432
EXPOSE 6333
EXPOSE 80

WORKDIR /app
COPY . /app

RUN python -m pip install --upgrade pip
RUN python -m pip install uv
RUN uv pip install -r requirements/requirements-all.txt --no-cache-dir --system

# In-process embedding models (EMBEDDING_MODE=local, the default).
# Build with `--build-arg LOCAL_EMBED=false` for a slim image that only
# supports EMBEDDING_MODE=tei (embeddings from a TEI server).
ARG LOCAL_EMBED=true
RUN if [ "$LOCAL_EMBED" = "true" ]; then \
        uv pip install torch --index-url https://download.pytorch.org/whl/cpu --system && \
        uv pip install -r requirements/requirements-embed-local.txt --no-cache-dir --system; \
    fi

CMD ["uvicorn", "pephub.main:app", "--host", "0.0.0.0", "--port", "80"]
