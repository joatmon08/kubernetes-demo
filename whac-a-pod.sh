#!/bin/bash -

SERVICE=${1}
NAMESPACE=${2:-default}
INTERVAL=${3:-10}

while true; do
    pod_list=($(kubectl get pods -n ${NAMESPACE}  -l demo=${SERVICE} -o go-template --template '{{range .items}}{{.metadata.name}}{{"\n"}}{{end}}'))
    rand=$[$RANDOM % ${#pod_list[@]}]
    deletion_list=${pod_list[@]:${rand}:${#pod_list[@]}}
    pods_to_delete=$( IFS=$'\n'; echo "${deletion_list[*]}" )
    kubectl delete pods -n ${NAMESPACE} ${pods_to_delete}
    sleep ${INTERVAL}
done