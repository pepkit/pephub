FROM tiangolo/uvicorn-gunicorn:python3.8
LABEL authors="Nathan LeRoy, Michal Stolarczyk, Nathan Sheffield"

RUN mkdir /app/requirements
COPY requirements/requirements-all.txt /app/requirements/requirements-all.txt 
RUN python -m pip install --upgrade pip
RUN pip install -r requirements/requirements-all.txt

COPY . /app

CMD [ "uvicorn", "pephub.main:app", "--reload"]