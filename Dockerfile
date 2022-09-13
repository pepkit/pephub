FROM tiangolo/uvicorn-gunicorn:python3.8
LABEL authors="Nathan LeRoy, Michal Stolarczyk, Nathan Sheffield"

EXPOSE 5432

COPY . /app
RUN python -m pip install --upgrade pip
RUN pip install .