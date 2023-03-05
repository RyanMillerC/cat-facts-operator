#!/bin/bash

oc delete -n cat-facts-operator $(oc get -n cat-facts-operator catfacts -o name)
