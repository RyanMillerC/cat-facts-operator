# AI Agent Instructions for Cat Facts Operator

This document provides context and guidelines for AI coding assistants working on
this codebase.

## Project Overview

Cat Facts Operator is a Go-based Kubernetes operator built with Operator SDK. It
provides a `CatFact` CRD (group `ryanmillerc.github.io`) and bundles a React+PatternFly 6
OpenShift Dynamic Console Plugin. The operator namespace is `cat-facts-operator`.

**Key Technologies:**
- Go + Operator SDK (controller)
- React 17 + PatternFly 6 (console plugin — see `console-plugin/AGENTS.md`)
- OLM (Operator Lifecycle Manager) for packaging and distribution
- kustomize + operator-sdk for bundle generation

**Requirements:** OKD/OpenShift 4.19+ (Kubernetes 1.32.0+). PatternFly 6 was
introduced in the OpenShift web console in OCP 4.19.

## Repository Structure

```
pkg/config/config.go          # Central config: version, image names, OCP min version
config/manifests/bases/       # SOURCE OF TRUTH for OLM CSV metadata
bundle/                       # GENERATED — never edit directly (output of make bundle)
catalog/                      # OLM catalog for local cluster testing
console-plugin/               # React console plugin (see console-plugin/AGENTS.md)
hack/                         # Helper scripts and example CatFact manifests
```

## Versioning

Version is defined in **two places** that must stay in sync:
- `Makefile` → `VERSION ?= 1.0.0-rc1`
- `pkg/config/config.go` → `Version string = "v1.0.0-rc1"`

Running `make update-version VERSION=x.y.z` updates both `pkg/config/config.go`
and `console-plugin/package.json` automatically. Still need to update `Makefile`
manually. When bumping versions, update all three.

## Container Images

All images live under `quay.io/ryanmillerc/`:
- `quay.io/ryanmillerc/cat-facts-operator:v<VERSION>` — operator controller
- `quay.io/ryanmillerc/cat-facts-operator-console-plugin:v<VERSION>` — console plugin
- `quay.io/ryanmillerc/cat-facts-operator-bundle:v<VERSION>` — OLM bundle
- `quay.io/ryanmillerc/cat-facts-operator-catalog:latest` — OLM catalog (testing only)

Image names are set in `pkg/config/config.go` (console plugin) and derived from
`IMAGE_TAG_BASE` in the Makefile (everything else).

## Key Make Targets

| Target | Description |
|---|---|
| `make all` | Full build + push + bundle (run after bumping version) |
| `make bundle` | Regenerate `bundle/` from `config/manifests/bases/` |
| `make docker-build docker-push` | Build/push operator controller image |
| `make console-build console-push` | Build/push console plugin image |
| `make bundle-build bundle-push` | Build/push OLM bundle image |
| `make catalog-build catalog-push` | Build/push test catalog image |
| `make catalog-install` | Install test catalog on cluster via CatalogSource |
| `make update-version VERSION=x.y.z` | Bump version in go and package.json |

Default container runtime is `podman`. Override with `DOCKER=docker make ...`.

## API Group

The CatFact CRD uses group `ryanmillerc.github.io`. If the group ever needs to change,
the `PROJECT` file (no extension, in repo root) must be updated manually — it has no
file extension so it is not picked up by glob patterns like `*.yaml` and is easy to
miss. It is the file `operator-sdk generate kustomize manifests` reads to locate Go
types; a stale value there causes the warning
"Skipping definitions parsing for API {}: Go type not found".

## OLM Bundle / CSV

### Never edit `bundle/` directly

`bundle/` is **generated output** from `make bundle`. The source of truth is:
- `config/manifests/bases/cat-facts-operator.clusterserviceversion.yaml`
- `config/manifests/kustomization.yaml`

Always edit the base CSV, then run `make bundle` to regenerate.

### Emojis in the CSV description must be HTML-encoded

Raw Unicode emoji characters in `spec.description` cause
`operator-sdk generate kustomize manifests` (part of `make bundle`) to reformat
the field from a readable YAML block scalar (`|`) to an ugly single-line quoted
string with `\n` escape sequences.

Use HTML entities instead — OperatorHub's Markdown renderer displays them correctly,
and they're pure ASCII so the YAML serializer leaves the block scalar alone.

Common examples:
- 🙋‍♂️ → `&#x1F64B;&#x200D;&#x2642;&#xFE0F;`
- 🙀 → `&#x1F640;`
- 🐱 → `&#x1F431;`

### alm-examples live in config/samples/, not the base CSV

`alm-examples` is generated automatically from the sample CRs in `config/samples/`.
Do not add `alm-examples` to the base CSV — `operator-sdk generate bundle` reads the
sample files (included via `config/manifests/kustomization.yaml`) and builds the
annotation from them. To add or change examples, edit the YAML files in `config/samples/`.

### CSV metadata reference

| Field | Value |
|---|---|
| `displayName` | `A Cat Facts Operator` (leading "A " puts it 4th alphabetically in OperatorHub) |
| `maturity` | `stable` |
| `minKubeVersion` | `1.32.0` |
| `categories` | `Fun` |
| `spec.version` in base | `0.0.1` (placeholder; overridden by `make bundle VERSION=x.y.z`) |

### OLM channels

- `test` — all versions including release candidates
- `release` — stable releases only (planned; not yet set up)
- `defaultChannel` will be `release` once v1.0.0 ships

## Console Plugin

The console plugin runs nginx serving the React bundle over **HTTPS on port 9443**.
This is required by OpenShift's Dynamic Console Plugin framework.

TLS is handled by the OpenShift service-ca operator. The `Service` object must have
the annotation:
```yaml
service.beta.openshift.io/serving-cert-secret-name: <secret-name>
```
The operator then mounts that secret into the nginx pod at `/var/cert/`.

The nginx config (`console-plugin/nginx.conf`) must explicitly configure SSL:
```nginx
server {
  listen 9443 ssl;
  ssl_certificate     /var/cert/tls.crt;
  ssl_certificate_key /var/cert/tls.key;
  ...
}
```
Without this, nginx defaults to HTTP on port 8080 and the plugin fails to load
with "Failed to get a valid plugin manifest".

### Known issue: console plugin deployment is not self-healing

`DeployConsolePlugin()` is currently called only at operator startup, not in the
reconcile loop. If console plugin resources are deleted after the operator starts,
they will not be recreated until the operator pod is restarted. This should be
fixed by moving `DeployConsolePlugin()` into the reconcile loop.

## Testing on a Cluster

```bash
# Build and push everything, install test catalog
make all
make catalog-install

# Clean up
oc delete catfacts --all -A
oc delete crd catfacts.ryanmillerc.github.io
oc delete csv --all -n cat-facts-operator
oc delete consoleplugin cat-facts-operator-console-plugin
oc delete namespace cat-facts-operator
oc delete -n openshift-marketplace catalogsource cat-facts-catalog
```

The test catalog image always points to `:latest` tag regardless of VERSION.
The operator + console plugin images use `imagePullPolicy: Always` so the cluster
always pulls the latest push.
