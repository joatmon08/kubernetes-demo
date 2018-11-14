# Kubernetes Container Visualizer

This simple visualizer shows a set of pods related to services based on a namespace.

It is based on the [gcp-live-visualizer](https://github.com/brendandburns/gcp-live-k8s-visualizer)
but with some modifications.

## Pre-Requisites
* Kubernetes cluster
* Access to Kubernetes proxy via `kubectl`

## Setup Instructions
1. Go into this repository.
1. Target the Kubernetes cluster using `kubectl`.
1. Create a deployment & service with a `demo` label, complete with
   the application name. If you want to show dependencies, you can
   use the `uses` label with a comma-separated list to point to
   other services the pods need to use.
1. Start the visualization. This requires access to the Kubernetes proxy.
   ```
   make visualize
   ```
1. Go to http://127.0.0.1:8001/visualize/.

## Demo Instructions
There are two scripts that need to be run for the demo. One can be run
in the background to kill pods, while the other checks the endpoints
to ensure it remains alive and well.
1. Make sure the Kubernetes proxy and visualizer are up.
2. Run `whac-a-pod.sh`. This takes a service and namespace and deletes
   a random number of pods.
   ```
   bash whac-a-pod.sh [service name] [optional: namespace, default]
   ```
3. In a separate shell, run `check-endpoint.sh`. This is an infinite loop
   that checks the API endpoint of a service to ensure it is up.
   ```
   bash check-endpoint.sh [service name] [API endpoint] [optional: ':port'] [optional: namespace, default]
   ```
4. Open the visualizer on one side and the `check-endpoint` script on the
   other.

## Configurations
* If you want to point to a different namespace, you must go into `script.js`
  and edit the `var namespace` to use a separate one.
* Deployments, pods, and services must have a `demo` label to show up.
* Adding a `uses` label and a comma-separated list of services will visualize dependencies.