#!/bin/bash

keyfile="key-bash-test.json"
key=$1

if [[ -n "$key" ]]; then
    echo "{
  \"apiKey\":\"$key\"
}" > ${keyfile}
fi