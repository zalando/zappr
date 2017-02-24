#!/bin/bash

echo "Set up dev database"
docker exec -it zappr-postgres-dev sh -c "exec psql -c 'create database zappr;' -U postgres"
docker exec -it zappr-postgres-dev sh -c "exec psql -c 'create schema zappr_data;' -U postgres zappr"
docker exec -it zappr-postgres-dev sh -c "exec psql -c 'create schema zappr_meta;' -U postgres zappr"

echo "Set up test database"
docker exec -it zappr-postgres-test sh -c "exec psql -c 'create database zappr;' -U postgres"
docker exec -it zappr-postgres-test sh -c "exec psql -c 'create schema zappr_data;' -U postgres zappr"
docker exec -it zappr-postgres-test sh -c "exec psql -c 'create schema zappr_meta;' -U postgres zappr"
