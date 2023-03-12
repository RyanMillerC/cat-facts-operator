#!/bin/bash
#

set -e

IMG=quay.io/rymiller/cat-facts-console-plugin

# TODO: Update this to a real version! Using latest for testing
VERSION=latest

PLATFORM=linux/amd64

CONTAINER_BUILD_TOOL=podman

BUILD_DIR=./docker-dist

[[ -d $BUILD_DIR ]] && rm -rf $BUILD_DIR
mkdir $BUILD_DIR

cp -r Dockerfile dist hack/nginx.conf $BUILD_DIR

cd $BUILD_DIR

${CONTAINER_BUILD_TOOL} build --platform ${PLATFORM} --tag ${IMG}:${VERSION} .
#${CONTAINER_BUILD_TOOL} build --tag ${IMG}:${VERSION} .
