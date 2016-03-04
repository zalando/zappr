#!/usr/bin/env bash

readonly DOCKER_REGISTRY="registry-write.opensource.zalan.do"
readonly DOCKER_USER="opensource"
readonly DOCKER_REPO="zappr"
readonly DOCKER_IMG=${DOCKER_REGISTRY}/${DOCKER_USER}/${DOCKER_REPO}

########################################
# Return the current git version
########################################
git_version() {
  echo $(git describe --tags --always)
}

########################################
# Return 'dirty' or an empty string
########################################
git_scm_status() {
  if [ -n "$(git status --porcelain)" ]; then echo "dirty"; else echo ""; fi
}

########################################
# Write the scm-source.json file.
# See http://docs.stups.io/en/latest/user-guide/application-development.html
# Arguments:
#  SCM URL - URL of the code repository
########################################
write_scm_source() {
  local scm_url=$1
  local scm_version=$(git rev-parse HEAD)
  local scm_author=$USER
  local scm_status=$(git_scm_status)
  printf "{
  \"url\": \"${scm_url}\",
  \"revision\": \"${scm_version}\",
  \"author\": \"${scm_author}\",
  \"status\": \"${scm_status}\"
}" > scm-source.json
}

########################################
# Build the node application.
########################################
npm_build() {
  if [ ! -d "node_modules" ]; then
    npm install
  fi
  npm run dist
}

########################################
# Build the Docker image
# Arguments:
#  tag  - Docker image version tag
#  args - Misc. arguments
########################################
docker_build() {
  if [ "$#" -eq 0 -o "${1:0:1}" = '-' ]; then
    # no version was provided, only args
    local version=$(git_version)
    local args=${@}
  else
    # version was provided as 1st argument
    local version=${1:-"$(git_version)"}
    local args=${@:2}
  fi

  local img=${DOCKER_IMG}:${version}

  docker build ${args} -t ${img} . \
  && echo "Built ${img}"
}

# Usage: ./build.sh (<tag>) ([args])
npm_build \
&& write_scm_source \
&& docker_build ${@}
