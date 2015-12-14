#!/usr/bin/env bash

########################################
# Check if a given executable exists
# Arguments:
#  Name of the required executable
########################################
require() {
  hash $1 2>/dev/null || { echo >&2 $1" is not installed. Aborting."; exit 1; }
}

########################################
# Encrypt with KMS
# Arguments:
#   Plaintext
# Returns:
#   Base-64 encoded ciphertext blob
########################################
kms_encrypt() {
  aws kms encrypt \
  --key-id ${KMS_KEY_ID} \
  --plaintext "${1}" \
  --query CiphertextBlob \
  --output text | base64 -D
}

########################################
# Encrypt with KMS (clear)
# Arguments:
#   Plaintext
# Returns:
#   Encoded ciphertext blob string
########################################
kms_encrypt_clear() {
  aws kms encrypt \
  --key-id ${KMS_KEY_ID} \
  --plaintext "${1}" \
  --query CiphertextBlob \
  --output text
}

########################################
# Decript with KMS
# Arguments:
#   Ciphertext blob file
# Returns:
#   Plaintext
########################################
kms_decrypt() {
  aws kms decrypt \
  --ciphertext-blob fileb://${1} \
  --query Plaintext \
  --output text | base64 -D
}

########################################
# Print the help text
########################################
print_help() {
printf "Usage: docker.sh <command>

Available commands:
  encrypt [--clear]  <plaintext>   encrypt text
  decrypt            <file>        decrypt ciphertext

Required environment variables:
  KMS_KEY_ID\n"
}

require "aws"
require "base64"

if [ -z "${KMS_KEY_ID}" ]; then
  echo "Error: KMS_KEY_ID not set"
  exit 1
fi

case $1 in
encrypt)
  if [ "$2" == "--clear" ]; then
    kms_encrypt_clear $3 # (plaintext)
  else
    kms_encrypt $2 # (plaintext)
  fi
  ;;
decrypt)
  kms_decrypt $2 # (file path)
  ;;
*)
  print_help
  exit 1
  ;;
esac

exit 0
