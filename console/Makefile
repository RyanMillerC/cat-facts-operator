IMG ?= quay.io/rymiller/cat-facts-console-plugin

VERSION ?= latest

PLATFORM ?= linux/amd64

CONTAINER_BUILD_TOOL ?= podman

.PHONY: all
all: build docker-build docker-push

.PHONY: build
build:
	yarn build

.PHONY: docker-build
docker-build: build
	if [[ -d ./container ]]; then rm -rf ./container; fi
	mkdir ./container
	cp -r Dockerfile dist hack/nginx.conf ./container
	cd ./container; ${CONTAINER_BUILD_TOOL} build --platform ${BUILD_OS}/${BUILD_ARCH} --tag ${IMG}:${VERSION} .

.PHONY: docker-push
docker-push:
	${CONTAINER_BUILD_TOOL} push ${IMG}:${VERSION}
