# -------------
# BUILD FRONTEND
# -------------
FROM node:16 as build

WORKDIR /src

COPY web/package.json ./
COPY web/* ./

# remove any .env files that made it in somehow...
RUN rm -f .env
RUN rm -f .env.local
RUN rm -f .env.*

RUN npm install --silent

# build
RUN npm run build

# -------------
# BUILD BACKEND
# -------------
FROM python:3.10-slim
LABEL authors="Nathan LeRoy, Nathan Sheffield"

RUN apt-get update
RUN apt-get install -y --no-install-recommends git

EXPOSE 5432
EXPOSE 6333
EXPOSE 80

WORKDIR /app
COPY . /app

# remove anything in web/ since all we need 
# is the dist folder from the frontend build
RUN rm -rf web/*

COPY --from=build /src/dist web/dist/
RUN python -m pip install --upgrade pip
RUN pip install -r requirements/requirements-all.txt

CMD ["uvicorn", "pephub.main:app", "--host", "0.0.0.0", "--port", "80"]
