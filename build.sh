#!/usr/bin/env bash

readonly DOCKER_REGISTRY="pierone.stups.zalan.do"
readonly DOCKER_USER="hackweek"
readonly DOCKER_REPO="zappr"
readonly DOCKER_IMG=${DOCKER_REGISTRY}/${DOCKER_USER}/${DOCKER_REPO}

########################################
# Return the current git version
########################################
git_version() {
  echo $(git describe --tags --always)
}

npm_build() {
  if [ ! -d "node_modules" ]; then
    npm install
  fi
  npm run build
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

  docker build ${args} -t ${img} .
  echo "Built ${img}"
}

# Usage: ./build.sh (<tag>) ([args])
npm_build && docker_build ${@}
