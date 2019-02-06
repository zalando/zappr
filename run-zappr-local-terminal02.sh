#!/bin/bash
# http://redsymbol.net/articles/unofficial-bash-strict-mode/
set -euo pipefail
IFS=$'\n\t'

eval "$(docker-machine env default)"
export DM_IP="$(docker-machine ip)"
export DB_HOST="$(docker-machine ip)"
echo "DB_HOST: ${DB_HOST} - DM_IP: ${DM_IP}"

./init_db.sh || true

echo "issuing npm install, npm run build & npm run all with env variables:"
npm install
npm run build
GITHUB_CLIENT_ID=<your-client-id> GITHUB_CLIENT_SECRET=<your-client-secret> HOST_ADDR=https://<your-app-name>.localtunnel.me/ npm run all
