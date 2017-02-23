#!/bin/bash
docker exec -it zappr_postgres_1 sh -c "exec psql -c 'create database zappr;' -U postgres"
docker exec -it zappr_postgres_1 sh -c "exec psql -c 'create schema zappr_data;' -U postgres zappr"
docker exec -it zappr_postgres_1 sh -c "exec psql -c 'create schema zappr_meta;' -U postgres zappr"
