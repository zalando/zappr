#!/usr/bin/env bash

readonly DOCKER_REGISTRY=${DOCKER_REGISTRY-"registry-write.opensource.zalan.do"}
readonly DOCKER_USER=${DOCKER_USER-"opensource"}
readonly DOCKER_REPO=${DOCKER_REPO-"zappr"}
readonly DOCKER_IMG=${DOCKER_REGISTRY}/${DOCKER_USER}/${DOCKER_REPO}
readonly DOCKER_BASE_IMAGE="registry.opensource.zalan.do/stups/node:5.10-23"
# If set, run the Node.js build inside a Docker container and mount this directory.
readonly DOCKER_RUN_WORKING_DIRECTORY=${DOCKER_RUN_WORKING_DIRECTORY-""}
# Which app configuration to use (opensource, enterprise).
readonly APP_CONFIG=${APP_CONFIG-"opensource"}

########################################
# Return the current git version
########################################
git_version() {
  echo $(git describe --tags --always)
}

########################################
# Build the node application locally.
########################################
npm_build_local() {
  echo >&2 "npm build locally..."
  if [ ! -d "node_modules" ]; then
    npm install
  fi
  npm run dist
}

########################################
# Build the node application inside Docker.
########################################
npm_build_inside_container() {
  echo >&2 "npm build inside container..."
  local workdir="/opt/zappr"
  docker run --rm \
    -v $1:${workdir} \
    -w ${workdir} \
    ${DOCKER_BASE_IMAGE} \
    /bin/bash -c "npm install && npm run dist"
}

npm_build() {
  if [ -n "$DOCKER_RUN_WORKING_DIRECTORY" ]; then
    npm_build_inside_container ${DOCKER_RUN_WORKING_DIRECTORY}
  else
    npm_build_local
  fi
}

########################################
# Build the Docker image
# Arguments:
#  tag  - Docker image version tag
#  args - Misc. arguments
########################################
docker_build() {
  echo >&2 "docker build..."
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
  echo >&2 "building $img"

  docker build ${args} --build-arg APP_CONFIG=${APP_CONFIG} -t ${img} . \
  && echo ${img}
}

# Usage: ./build.sh (<tag>) ([args])
#
# Options:
#     DOCKER_RUN_WORKING_DIRECTORY - build inside a container with this directory mounted
#
npm_build \
&& docker_build ${@}
