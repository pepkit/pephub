FROM tiangolo/uvicorn-gunicorn:python3.8
LABEL authors="Nathan LeRoy, Michal Stolarczyk, Nathan Sheffield"

COPY . /app
RUN python -m pip install --upgrade pip
RUN pip install -r requirements/requirements-all.txt

CMD [ "uvicorn", "pephub.main:app", "--reload"]