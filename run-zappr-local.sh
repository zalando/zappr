echo "DB_HOST: ${DB_HOST}"
echo "DM_IP: ${DM_IP}"
echo
eval "$(docker-machine env default)"
echo $(docker-machine env default)
GCI=$GITHUB_CLIENT_ID
short="${GCI:0:5}" ; echo "GITHUB_CLIENT_ID: ${short}....";
GCS=$GITHUB_CLIENT_SECRET
short="${GCS:0:5}" ; echo "GITHUB_CLIENT_SECRET: ${short}....";

npm install
npm run build
#npm run all

docker-compose up zappr
