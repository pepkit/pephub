#!/bin/bash
mkdir -p postgres
curl "https://raw.githubusercontent.com/pepkit/pepdbagent/62_add_columns/pep_db/Dockerfile" > postgres/Dockerfile
curl "https://raw.githubusercontent.com/pepkit/pepdbagent/62_add_columns/pep_db/pep_db.sql" > postgres/pep_db.sql
echo "\nVOLUME ./postgres/volumes/ /var/lib/postgresql/data" >> postgres/Dockerfile