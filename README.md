<!--
    This first chunk is HTML so it can be centered. I didn't have any luck
    wrapping all the elements in a <p> element with align="center". 🤷
-->
<p align="center">
    <img src="docs/img/smiling_cat.svg" alt="Smiling Cat Icon" height="100" width="100" />
</p>
<h1 align="center">
    Cat Facts Operator
</h1>
<h4 align="center">
    A Kubernetes operator for all you cool cats and kittens.
</h4>
<p align="center">
    <img src="docs/img/catalog_view.png" alt="Cat Facts Operator catalog view" />
</p>

## Description

This is a Go-based Operator built with the Operator SDK. I built this as a
proof-of-concept to learn operator development and distribution through
Operator Lifecycle Management (OLM). This operator includes an OpenShift
Dynamic Console Plugin that serves a front-end to manage operator resources.
This operator *

### What Does It Do?

Cat Facts Operator provides a Custom Resource Definition (CRD) for *CatFact*. A
CatFact is a Kubernetes resource that contains metadata along with a fact about
cats. It uses https://catfact.ninja/fact to generate facts about cats.

## Requirements

* OKD/OpenShift 4.11 or later

**NOTE:** Cat Facts Operator should work on older versions of OpenShift and
on other Kubernetes distributions; **however, the console dynamic plugin UI
(the main feature of this operator) will not be installed.** The controller and
CatFact CRD will install and should work as expected.

## Installing

Cat Facts Operator is distributed through an OLM catalog. Cat Facts Operator is
not included in any default OperatorHub catalog so you'll need to create a
CatalogSource to install it.

Use the *Import YAML* feature of the OpenShift console or `oc` command line
interface to create the CatalogSource object below.

![Import YAML feature of OpenShift console](docs/img/import_yaml.png)

```yaml
# Apply this object to your cluster to add the catalog to OperatorHub.
# After ~1 minute, search for "Cat Facts" in OperatorHub.
apiVersion: operators.coreos.com/v1alpha1
kind: CatalogSource
metadata:
  name: cat-facts-catalog
  namespace: openshift-marketplace
spec:
  sourceType: grpc
  image: quay.io/rymiller/cat-facts-catalog:latest
  displayName: Cat Facts Catalog
  publisher: Ryan Miller
  updateStrategy:
    registryPoll:
      interval: 10m
```

After ~1 minute, navigate to OperatorHub and search for "Cat Facts".

![Search for Cat Facts](docs/img/operatorhub_search.png)

Follow the prompts to install operator page. Accept the default options for
everything **except for Console Plugin**. For security, OpenShift defaults
*Console Plugin* to *Disabled* on operators that come from non-official
catalogs. Select *Enable* for *Console plugin* and install the operator.

![Install the operator](docs/img/install_operator.png)

Within ~1 minute after the installation completes, you will be prompted to
refresh your OpenShift console in the top-right corner.

![Refresh OpenShift web console](docs/img/refresh_web_console.png)

## How to Use Cat Facts

1. Navigate to *Cat Facts > Cat Fact Catalog* on the left-side navigation pane
   of the OpenShift console
2. Select *Create CatFact*
3. Select the new CatFact card to view it
4. Select *Create CatFact* again
5. Select *Create CatFact* 20 more times!!
6. If you get bored and want to delete all your CatFacts, select
   *Delete All CatFacts*
7. 🎉

## Uninstalling

To uninstall, go to *Operators > Installed Operators* in the OpenShfit console.
Select the Cat Facts Operator and uninstall.

After uninstalling, run these commands to clean up resources the operator
leaves behind:

```bash
# Remove all CatFacts
oc delete -n cat-facts-operator $(oc get -n cat-facts-operator catfacts -o name)

# Remove the CatFacts CRD
oc delete crd catfacts.taco.moe

# Remove the OpenShift console plugin
oc delete consoleplugin cat-facts-operator-console-plugin

# Remove the cat-facts-operator namespace
oc delete namespace cat-facts-operator

# Optional: Remove the Cat Facts OLM CatalogSource
oc delete -n openshift-marketplace catalogsource cat-facts-catalog
```

## Acknowledgments

Cat icons/emojis used in this project were created by Emily Jäger, licensed under
[CC BY-SA 4.0] and are [available here][cat-icons].

## Development

### How it works

This project follows the Kubernetes [Operator Pattern].

It uses a [Controller] which provides a reconcile function responsible for
synchronizing resources untile the desired state is reached on the cluster.

Additionally, this project includes a React JS-based OpenShift Console Dynamic
Plugin, under the ./console directory. For details on developing the console
plugin, view ./console/README.md.

### Validate your changes locally against a remote cluster

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

### Validate your changes in a Pod on a cluster

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

### Undeploy controller

UnDeploy the controller to the cluster:

```sh
make undeploy
```

### Modifying the API definitions

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
