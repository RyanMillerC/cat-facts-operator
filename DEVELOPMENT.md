# Development

## How it works

This project follows the Kubernetes [Operator Pattern].

It uses a [Controller] which provides a reconcile function responsible for
synchronizing resources untile the desired state is reached on the cluster.

Additionally, this project includes a React JS-based OpenShift Console Dynamic
Plugin, under the *./console* directory. For details on developing the console
plugin, view [./console/README.md](console/README.md).

The remainder of this document is specifically for developing and validating
the Go-based operator.

## Running in development mode

For actual releases, always install through OLM (OperatorHub). To run against a
cluster while developing, one of two methods can be used:

* [Run operator locally against a remote cluster](#run-operator-locally-against-a-remote-cluster)
* [Run operator in a Pod on a cluster](#run-operator-in-a-pod-on-a-cluster)

### Run operator locally against a remote cluster

Run the operator on your machine from your local directory against a cluster's
API.

```bash
oc login
oc apply -f ./config/crd/bases

# If running Linux/amd64
make run

# If running MacOS/arm64 (M series processor)
GOOS=darwin GOARCH=arm64 make run
```

### Run operator in a Pod on a cluster

This will run the operator in a Pod on an OpenShift cluster. It will create a
container image under your user account in Quay.

**NOTE:** If you're doing this for the first time, the repo in Quay will be set
to private. You will need to change the permission on the repo to public before
running `make deploy`.

```bash
# Set environment variables
export USER=rymiller # Replace with your username
export IMAGE_TAG_BASE="quay.io/${USER}/cat-facts-operator"

# Build and push container image
make docker-build docker-push bundle

# Deploy to OpenShift
make install
make deploy
```

**NOTE:** If the operator Pod is already running on the cluster, you may need
to manually kill the controller Pod to force a redeploy using the latest
container image in Quay.

## Undeploy controller

UnDeploy the controller to the cluster:

```sh
make undeploy
```

## Modifying the API definitions

If you are editing the API definitions, generate the manifests such as CRs or
CRDs using:

```sh
make manifests
```

**NOTE:** Run `make --help` for more information on all potential `make` targets

More information can be found via the [Kubebuilder Documentation]

[CC BY-SA 4.0]: https://creativecommons.org/licenses/by-sa/4.0
[cat-icons]: https://openmoji.org/library/#group=smileys-emotion%2Fcat-face
[Controllers]: https://kubernetes.io/docs/concepts/architecture/controller/
[Kubebuilder Documentation]: https://book.kubebuilder.io/introduction.html
[Operator Pattern]: https://kubernetes.io/docs/concepts/extend-kubernetes/operator/
