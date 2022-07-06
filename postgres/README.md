# pep_db

### How to create new postgres db: 


https://dev.to/andre347/how-to-easily-create-a-postgres-database-in-docker-4moj


0) Go into this directory and then run the following lines
1) docker build -t pep-base-sql ./
2) docker run --name pep-base-sql -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=docker -p 5432:5432 -d pep-base-sql
3) docker start pep-base-sql


### How to connect to the docker

docker exec -it 65f bash
psql -U postgres -d pep-base-sql