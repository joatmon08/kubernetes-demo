#!/bin/bash -

SERVICE=${1}
API_ENDPOINT=${2}
PORT=${3}
NAMESPACE=${4:-default}


while true; do
    printf "\nCurrent Date: $(date)\n"
    curl -i 127.0.0.1:8001/api/v1/namespaces/${NAMESPACE}/services/${SERVICE}${PORT}/proxy${API_ENDPOINT}
    printf "\n"
    sleep 5
done