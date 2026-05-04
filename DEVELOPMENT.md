# Development Guide

## Prerequisites

- Go 1.21+
- Node.js + Yarn 4
- `oc` CLI logged into an OpenShift 4.19+ cluster
- `podman` (or `docker` — pass `DOCKER=docker` to make targets)
- `operator-sdk`
- `opm` (for catalog builds)

## Local Development

You need three terminals running simultaneously:

| Terminal | Directory | Command | What it does |
|---|---|---|---|
| 1 | `console-plugin/` | `yarn start` | Plugin webpack dev server on port 9001 |
| 2 | `console-plugin/` | `yarn start-console` | OpenShift console container on port 9000 |
| 3 | repo root | `make run` | Go controller running against your cluster |

Then open http://localhost:9000.

> **First time setup:** run `yarn install` in `console-plugin/` before starting.

> **Note:** Changes to `console-extensions.json` require restarting terminal 1. Component file changes hot-reload automatically.

The Go controller installs the CRD on startup. To install it manually without running the controller:

```bash
make install
```

## Project Structure

```
pkg/                  # Go controller source
config/manifests/     # OLM CSV source of truth
bundle/               # Generated OLM bundle (output of make bundle — do not edit)
catalog/              # OLM catalog for cluster testing
console-plugin/       # React + PatternFly 6 OpenShift console plugin
hack/                 # Helper scripts and example CatFact manifests
```

## Making Changes

### Go controller

Edit files under `pkg/` and `internal/`. After changing API types, regenerate manifests:

```bash
make manifests
```

Run tests:

```bash
make test
```

### Console plugin

The plugin is a React app under `console-plugin/src/components/`.

Lint (auto-fix):
```bash
cd console-plugin && yarn lint
```

Run Cypress e2e tests:
```bash
cd console-plugin && yarn test-cypress          # interactive
cd console-plugin && yarn test-cypress-headless # CI mode
```

#### Adding a new page

1. Create `console-plugin/src/components/MyPage.tsx`
2. Add to `exposedModules` in `console-plugin/package.json`:
   ```json
   "MyPage": "./components/MyPage"
   ```
3. Add a route in `console-plugin/console-extensions.json`:
   ```json
   {
     "type": "console.page/route",
     "properties": {
       "path": "/my-page",
       "component": { "$codeRef": "MyPage" }
     }
   }
   ```

#### Styling rules

- Use PatternFly CSS variables — no hex colors (breaks dark mode)
- No naked element selectors (`div`, `table`, etc.) — prevents overriding console styles
- Prefix all custom CSS classes with `cat-facts__`

## Releasing

### 1. Bump the version

Update `VERSION` in `Makefile`, then propagate it:

```bash
make update-version
```

Also update `spec.replaces` in `config/manifests/bases/cat-facts-operator.clusterserviceversion.yaml` to point to the previous version's full CSV name (e.g. `cat-facts-operator.v1.0.0`).

### 2. Build and push everything

```bash
make all
```

Builds and pushes the operator, console plugin, and OLM bundle images.

### 3. Test on a cluster

```bash
make catalog-build catalog-push catalog-install
```

Builds a test catalog image, pushes it, and installs a `CatalogSource` on your cluster. Install the operator from OperatorHub and verify everything works end-to-end.

### 4. Tag and publish

```bash
make git-tag
```

Create a GitHub release for the tag, then submit the bundle to OperatorHub by copying `bundle/manifests/` and `bundle/metadata/` into a new `operators/cat-facts-operator/<version>/` directory in [community-operators-prod](https://github.com/redhat-openshift-ecosystem/community-operators-prod).

### Channel conventions

| Version type | Channels |
|---|---|
| Release candidate (e.g. `1.1.0-rc1`) | `test` only |
| Stable release (e.g. `1.1.0`) | `test,stable` |

Pass channels to make: `make all CHANNELS=test,stable DEFAULT_CHANNEL=stable`

## Useful Make Targets

| Target | Description |
|---|---|
| `make run` | Run controller locally against cluster |
| `make test` | Run Go unit tests |
| `make install` | Install CRDs on cluster |
| `make manifests` | Regenerate CRD manifests from Go types |
| `make bundle` | Regenerate `bundle/` from config sources |
| `make all` | Full build + push + bundle |
| `make catalog-build catalog-push catalog-install` | Deploy test catalog to cluster |
| `make git-tag` | Tag and push the current VERSION |

Default container runtime is `podman`. Override with `DOCKER=docker make ...`.

## References

- [Kubebuilder Documentation](https://book.kubebuilder.io/introduction.html)
- [Console Plugin SDK](https://github.com/openshift/console/tree/master/frontend/packages/console-dynamic-plugin-sdk)
- [PatternFly React](https://www.patternfly.org/get-started/develop)
