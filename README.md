# Cat Facts Operator

An operator for all you cool cats and kittens.

## Description

This is a Go-based Operator built with the Operator SDK. I built this as a
proof-of-concept to learn operator development and distribution through
Operator Lifecycle Management (OLM). This operator includes an OpenShift
Dynamic Console Plugin that serves a front-end to manage operator resources.

### What Does It Do?

Cat Facts Operator provides a Custom Resource Definition (CRD) for *CatFact*. A
CatFact is a Kubernetes resource that contains metadata along with a fact about
cats. It uses https://catfact.ninja/fact to generate facts about cats.

## Requirements

* OpenShift 4.12
    * Cat Facts Operator **may** work on other versions of OpenShift but they
      have not been tested.

## Installing

Cat Facts Operator is distributed through an OLM catalog. Cat Facts Operator is
not included in any default OperatorHub catalog so you'll need to create a
CatalogSource to install it.

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
catalogs. Enable console plugin and install.

![Install the operator](docs/img/install_operator.png)

Within ~1 minute after the installation completes, you will be prompted to
refresh your OpenShift console in the top-right corner.

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
oc delete crd catfact.taco.moe

# Remove the OpenShift console plugin
oc delete consoleplugin cat-facts-console-plugin

# Remove the cat-facts-operator namespace
oc delete namespace cat-facts-operator
```

## Contributing (This section needs work)

### **Run `make all` on Linux when you're ready to deploy. Do not use your Mac!**

### How it works

This project aims to follow the Kubernetes [Operator Pattern].

It uses [Controllers] which provides a reconcile function responsible for
synchronizing resources untile the desired state is reached on the cluster.

### Test It Out

1. Install the CRDs into the cluster:

```sh
make install
```

2. Run your controller (this will run in the foreground, so switch to a new terminal if you want to leave it running):

```sh
make run
```

**NOTE:** You can also run this in one step by running: `make install run`

### Running on the cluster

1. Install Instances of Custom Resources:

```sh
kubectl apply -f config/samples/
```

2. Build and push your image to the location specified by `IMG`:

```sh
make docker-build docker-push IMG=<some-registry>/cat-facts-operator:tag
```

3. Deploy the controller to the cluster with the image specified by `IMG`:

```sh
make deploy IMG=<some-registry>/cat-facts-operator:tag
```

### Uninstall CRDs

To delete the CRDs from the cluster:

```sh
make uninstall
```

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

[Controllers]: https://kubernetes.io/docs/concepts/architecture/controller/
[Kubebuilder Documentation]: https://book.kubebuilder.io/introduction.html
[Operator Pattern]: https://kubernetes.io/docs/concepts/extend-kubernetes/operator/
