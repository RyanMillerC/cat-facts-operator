package config

const (
	// Minimum version of OpenShift that supports dynamic console plugins.
	// Console plugin should not be attempted on versions less than this.
	MinConsolePluginOCPVer string = "4.10"

	// Container image path for the console plugin. DO NOT INCLUDE A TAG!
	// config.Version will be used as the tag.
	ConsolePluginImage string = "quay.io/rymiller/cat-facts-operator-console-plugin"

	// Name of operator. Console plugin resources will be prefixed with this.
	OperatorName string = "cat-facts-operator"

	// Version of the operator. This should be a valid semantic version (semver).
	// TODO: Should allow this to be set from Makefile as an environment variable
	Version string = "v0.0.9"
)
