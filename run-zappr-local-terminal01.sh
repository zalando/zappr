#!/bin/bash
# http://redsymbol.net/articles/unofficial-bash-strict-mode/
set -euo pipefail
IFS=$'\n\t'

docker-machine stop || true
# start with a new docker machine
docker-machine start
eval "$(docker-machine env default)"
export DM_IP="$(docker-machine ip)"
export DB_HOST="$(docker-machine ip)"
echo "DB_HOST: ${DB_HOST} - DM_IP: ${DM_IP}"
echo "issuing docker-compose postgres-dev"
docker-compose up postgres-dev
