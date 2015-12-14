#!/usr/bin/env bash

########################################
# Check if a given executable exists
# Arguments:
#  name - Executable name
########################################
is_installed() {
  if [ -z "$(hash $1 2>/dev/null || { echo False; })" ]; then
    echo True
  else
    echo False
  fi
}

########################################
# Create a random hexadecimal string.
# Arguments:
#  number of bytes
########################################
rand_bad() {
  local s
  local n=$(($1 * 2))
  for i in $(seq 1 ${n}); do
    s="$s$(echo "obase=16; $(($RANDOM % 16))" | bc)"
  done;
  echo "$s"
}

########################################
# Use openssl for a random hex string.
# Arguments:
#  number of bytes
########################################
rand_good() {
  echo "$(openssl rand -hex $1)"
}

if $(is_installed "openssl"); then
  echo $(rand_good ${1-16})
else
  echo $(rand_bad ${1-16})
fi
