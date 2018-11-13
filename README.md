# Kubernetes Container Visualizer

This simple visualizer shows a set of pods related to services based on a namespace.

It is based on the [gcp-live-visualizer](https://github.com/brendandburns/gcp-live-k8s-visualizer)
but with some modifications.

## Pre-Requisites
* Kubernetes cluster
* Access to Kubernetes proxy via `kubectl`

## Instructions
1. Go into this repository.
1. Target the Kubernetes cluster using `kubectl`.
1. Create a deployment & service with a `demo` label, complete with
   the application name. If you want to show dependencies, you can
   use the `uses` label with a comma-separated list to point to
   other services the pods need to use.
1. Start the proxy.
   ```
   kubectl proxy --www=. --www-prefix=/visualize/
   ```
1. Go to http://127.0.0.1:8001/visualize/.

## Configurations
* If you want to point to a different namespace, you must go into `script.js`
  and edit the `var namespace` to use a separate one.
* Deployments, pods, and services must have a `demo` label to show up.
* Adding a `uses` label and a comma-separated list of services will visualize dependencies.