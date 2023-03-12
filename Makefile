IMG ?= quay.io/rymiller/cat-facts-console-plugin

# TODO: Update this to a real version! Using latest for testing
VERSION ?= latest

PLATFORM ?= linux/amd64

CONTAINER_BUILD_TOOL ?= podman

.PHONY: docker-build
docker-build:
	./hack/docker-build.sh

.PHONY: docker-push
docker-push:
	${CONTAINER_BUILD_TOOL} push ${IMG}:${VERSION}
