#!/usr/bin/env bash

readonly DOCKER_REGISTRY=${DOCKER_REGISTRY-"registry-write.opensource.zalan.do"}
readonly DOCKER_USER=${DOCKER_USER-"opensource"}
readonly DOCKER_REPO=${DOCKER_REPO-"zappr"}
readonly DOCKER_IMG=${DOCKER_REGISTRY}/${DOCKER_USER}/${DOCKER_REPO}
readonly DOCKER_BASE_IMAGE="registry.opensource.zalan.do/stups/node:5.10-23"
# If set, run the Node.js build inside a Docker container and mount this directory.
readonly DOCKER_RUN_WORKING_DIRECTORY=${DOCKER_RUN_WORKING_DIRECTORY-""}

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

  docker build ${args} -t ${img} . \
  && echo ${img}
}

# Usage: ./build.sh (<tag>) ([args])
#
# Options:
#     DOCKER_RUN_WORKING_DIRECTORY - build inside a container with this directory mounted
#
npm_build \
&& write_scm_source \
&& docker_build ${@}
