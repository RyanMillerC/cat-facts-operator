package config

const (
	// Version of the operator. This should be a valid semantic version (semver).
	// TODO: Should allow this to be set from Makefile as an environment variable
	Version string = "0.0.9"

	// Minimum version of OpenShift that supports dynamic console plugins.
	// Console plugin should not be attempted on versions less than this.
	MinConsolePluginOCPVer string = "4.10"
)
