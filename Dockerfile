FROM python:3.10
LABEL authors="Nathan LeRoy, Nathan Sheffield"

RUN apt-get update
RUN apt-get install -y --no-install-recommends git

EXPOSE 5432
EXPOSE 6333
EXPOSE 80

WORKDIR /app
COPY . /app
RUN python -m pip install --upgrade pip
RUN pip install .

CMD ["uvicorn", "pephub.main:app", "--host", "0.0.0.0", "--port", "8000"]