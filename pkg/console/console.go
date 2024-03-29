/*
Code to deploy the OpenShift Dynamic Console plugin.
*/

// TODO: Fix namespace so it's always the same as the controller.

package console

import (
	"context"
	"errors"
	"fmt"
	"os"
	"strings"

	configv1 "github.com/openshift/api/config/v1"
	consolev1alpha1 "github.com/openshift/api/console/v1alpha1"
	"golang.org/x/mod/semver"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	kerrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/util/intstr"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/ryanmillerc/cat-facts-operator/pkg/config"
)

var consoleLog = ctrl.Log.WithName("console")

// +kubebuilder:rbac:namespace=cat-facts-operator,groups=apps,resources=deployments,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:namespace=cat-facts-operator,groups=core,resources=services,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=console.openshift.io,resources=consoleplugins,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=config.openshift.io,resources=clusterversions,verbs=get

// Deploy OpenShift console dynamic plugin.
//
// Console plugins require 3 resources: a Deployment, a Service, and a
// ConsolePlugin. If any of the listed resources exist from a previous
// installation, they will be untouched.
//
// If the cluster does not meet the minimum version set by
// config.MinConsolePluginOCPVer, console plugin resources will not be deployed.
//
// If the cluster is not an OpenShift cluster, this function will error.
func DeployConsolePlugin() error {
	// We can't use the controller client because it hasn't been registered with
	// the manager yet. There's no good way register it without entering the
	// reconsile loop. So it's easiest to make our own client and pass it around
	// to functions in this package.
	scheme := runtime.NewScheme()
	appsv1.AddToScheme(scheme)          // Deployment
	corev1.AddToScheme(scheme)          // Service
	consolev1alpha1.AddToScheme(scheme) // ConsolePlugin
	configv1.AddToScheme(scheme)        // ClusterVersion
	kubeconfig := ctrl.GetConfigOrDie()
	kclient, err := client.New(kubeconfig, client.Options{Scheme: scheme})
	if err != nil {
		return err
	}

	// Validate OpenShift version meets minimum requirements. If the version
	// requirement is not met, do not install the console plugin.
	ocpVersion, err := getOpenShiftVersion(kclient)
	if err != nil {
		return errors.New("unable to validate OpenShift version")
	}
	shouldInstallPlugin := isOpenShiftVersionOk(ocpVersion)
	if shouldInstallPlugin {
		consoleLog.Info(
			"OpenShift version supports console dynamic plugins",
			"openShiftVersion",
			ocpVersion,
			"minimumRequiredVersion",
			config.MinConsolePluginOCPVer,
		)
	} else {
		consoleLog.Info(
			"OpenShift version does not support console dynamic plugins",
			"openShiftVersion",
			ocpVersion,
			"minimumRequiredVersion",
			config.MinConsolePluginOCPVer,
		)
		return nil // Do not continue since OCP version doesn't support plugins
	}

	// All resources (Deployment, Service, and ConsolePlugin) share the same
	// name and namespace
	name := fmt.Sprintf("%s-console-plugin", config.OperatorName)
	namespace, err := getControllerNamespace()
	if err != nil {
		return err
	}

	deployment := getDeployment(name, namespace)
	createOrUpdateDeployment(kclient, &deployment)
	if err != nil {
		return err
	}

	service := getService(name, namespace)
	createOrUpdateService(kclient, &service)
	if err != nil {
		return err
	}

	consolePlugin := getConsolePlugin(name, namespace)
	createOrUpdateConsolePlugin(kclient, &consolePlugin)
	if err != nil {
		return err
	}

	return nil
}

// Return semantic version of the running OpenShift cluster
func getOpenShiftVersion(kclient client.Client) (string, error) {
	var clusterVersion configv1.ClusterVersion
	err := kclient.Get(context.TODO(), client.ObjectKey{Name: "version"}, &clusterVersion, &client.GetOptions{})
	if err != nil {
		return "", err
	}
	// Desired version appears to be the current OpenShift cluster version
	return clusterVersion.Status.Desired.Version, nil
}

// Returns true if the passed semantic version is equal to or greater than the
// minimconfig.OperatorName),um required version.
func isOpenShiftVersionOk(ocpVersion string) bool {
	// semver.Compare will return:
	// 0 if the versions match
	// 1 if ocpVerion is greater than minVersion
	// -1 if ocpVerion is less than minVersion
	return semver.Compare(ocpVersion, config.MinConsolePluginOCPVer) >= 0
}

// Return the namespace of the running controller
//
// There's not an easy way to do this so here's a link to the pattern being
// used: https://github.com/kubernetes/kubernetes/pull/63707
//
// This will error when running the controller outside of Kubernetes. To prevent
// errors, when running outside of Kubernetes, set CONTROLLER_NAMESPACE
// environment variable to whatever namespace you would deploy the controller
// into if deploying on a cluster.
func getControllerNamespace() (string, error) {
	// This way assumes you've set the POD_NAMESPACE environment variable using the downward API.
	// This check has to be done first for backwards compatibility with the way InClusterConfig was originally set up
	if ns, ok := os.LookupEnv("CONTROLLER_NAMESPACE"); ok {
		return ns, nil
	}

	// Fall back to the namespace associated with the service account token, if available
	if data, err := os.ReadFile("/var/run/secrets/kubernetes.io/serviceaccount/namespace"); err == nil {
		if ns := strings.TrimSpace(string(data)); len(ns) > 0 {
			return ns, nil
		}
	}

	return "", errors.New("could not determine controller namespace. Set CONTROLLER_NAMESPACE environment variable if running controller outside of cluster")
}

// Create or update the Deployment for a console dynamic plugin
func createOrUpdateDeployment(kclient client.Client, deployment *appsv1.Deployment) error {
	var found appsv1.Deployment
	key := client.ObjectKeyFromObject(deployment)
	err := kclient.Get(context.TODO(), key, &found, &client.GetOptions{})
	create := false
	if err != nil {
		if kerrors.IsNotFound(err) {
			create = true
		} else {
			return err
		}
	}

	if create {
		consoleLog.Info("Creating Deployment for console dynamic plugin")
		err := kclient.Create(context.TODO(), deployment, &client.CreateOptions{})
		if err != nil {
			return err
		}
	} else {
		consoleLog.Info("Updating Deployment for console dynamic plugin")
		deployment.DeepCopyInto(&found)
		err := kclient.Update(context.TODO(), &found, &client.UpdateOptions{})
		if err != nil {
			return err
		}
	}

	return nil
}

func getDeployment(name string, namespace string) appsv1.Deployment {
	deployment := appsv1.Deployment{
		TypeMeta: metav1.TypeMeta{
			Kind:       "Deployment",
			APIVersion: "apps/v1",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: namespace,
			Labels: map[string]string{
				"app": name,
			},
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: int32Ptr(1),
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{
					"app": name,
				},
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{
						"app": name,
					},
				},
				Spec: corev1.PodSpec{
					Volumes: []corev1.Volume{
						{
							Name: fmt.Sprintf("%s-cert", name),
							VolumeSource: corev1.VolumeSource{
								Secret: &corev1.SecretVolumeSource{
									SecretName:  fmt.Sprintf("%s-cert", name),
									DefaultMode: int32Ptr(420),
								},
							},
						},
					},
					Containers: []corev1.Container{
						{
							Name:  name,
							Image: fmt.Sprintf("%s:%s", config.ConsolePluginImage, config.Version),
							Ports: []corev1.ContainerPort{
								{
									ContainerPort: 9443,
									Protocol:      "TCP",
								},
							},
							// TODO: Get this working
							// Resources: corev1.ResourceRequirements{
							// 	Requests: map[corev1.ResourceName]resource.Quantity{
							// 		"": {
							// 			Format: "",
							// 		},
							// 	},
							// },
							VolumeMounts: []corev1.VolumeMount{
								{
									Name:      fmt.Sprintf("%s-cert", name),
									ReadOnly:  true,
									MountPath: "/var/cert",
								},
							},
							ImagePullPolicy: "Always",
							SecurityContext: &corev1.SecurityContext{
								Capabilities: &corev1.Capabilities{
									Drop: []corev1.Capability{"ALL"},
								},
								AllowPrivilegeEscalation: boolPtr(false),
							},
						},
					},
					RestartPolicy: "Always",
					DNSPolicy:     "ClusterFirst",
					SecurityContext: &corev1.PodSecurityContext{
						RunAsNonRoot: boolPtr(true),
						SeccompProfile: &corev1.SeccompProfile{
							Type: "RuntimeDefault",
						},
					},
				},
			},
			Strategy: appsv1.DeploymentStrategy{},
		},
		Status: appsv1.DeploymentStatus{},
	}
	return deployment
}

// Create or update the Service for a console dynamic plugin
func createOrUpdateService(kclient client.Client, service *corev1.Service) error {
	var found corev1.Service
	key := client.ObjectKeyFromObject(service)
	err := kclient.Get(context.TODO(), key, &found, &client.GetOptions{})
	create := false
	if err != nil {
		if kerrors.IsNotFound(err) {
			create = true
		} else {
			return err
		}
	}

	if create {
		consoleLog.Info("Creating Service for console dynamic plugin")
		err := kclient.Create(context.TODO(), service, &client.CreateOptions{})
		if err != nil {
			return err
		}
	} else {
		consoleLog.Info("Updating Service for console dynamic plugin")
		service.DeepCopyInto(&found)
		err := kclient.Update(context.TODO(), &found, &client.UpdateOptions{})
		if err != nil {
			return err
		}
	}

	return nil
}

func getService(name string, namespace string) corev1.Service {
	service := corev1.Service{
		TypeMeta: metav1.TypeMeta{
			Kind:       "Service",
			APIVersion: "v1",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: namespace,
			Labels: map[string]string{
				"app": name,
			},
			Annotations: map[string]string{
				"service.beta.openshift.io/serving-cert-secret-name": fmt.Sprintf("%s-cert", name),
			},
		},
		Spec: corev1.ServiceSpec{
			Ports: []corev1.ServicePort{
				{
					Name:     "9443-tcp",
					Protocol: "TCP",
					Port:     9443,
					TargetPort: intstr.IntOrString{
						IntVal: 9443,
					},
				},
			},
			Selector: map[string]string{
				"app": name,
			},
			Type:            "ClusterIP",
			SessionAffinity: "None",
		},
		Status: corev1.ServiceStatus{},
	}
	return service
}

// Create or update the ConsolePlugin for a console dynamic plugin
func createOrUpdateConsolePlugin(kclient client.Client, consolePlugin *consolev1alpha1.ConsolePlugin) error {
	var found consolev1alpha1.ConsolePlugin
	key := client.ObjectKeyFromObject(consolePlugin)
	err := kclient.Get(context.TODO(), key, &found, &client.GetOptions{})
	create := false
	if err != nil {
		if kerrors.IsNotFound(err) {
			create = true
		} else {
			return err
		}
	}

	if create {
		consoleLog.Info("Creating ConsolePlugin for console dynamic plugin")
		err := kclient.Create(context.TODO(), consolePlugin, &client.CreateOptions{})
		if err != nil {
			return err
		}
	} else {
		consoleLog.Info("Updating ConsolePlugin for console dynamic plugin")
		consolePlugin.DeepCopyInto(&found)
		err := kclient.Update(context.TODO(), &found, &client.UpdateOptions{})
		if err != nil {
			return err
		}
	}

	return nil
}

func getConsolePlugin(name string, namespace string) consolev1alpha1.ConsolePlugin {
	consolePlugin := consolev1alpha1.ConsolePlugin{
		TypeMeta: metav1.TypeMeta{
			Kind:       "ConsolePlugin",
			APIVersion: "console.openshift.io/v1alpha1",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name: name,
			Labels: map[string]string{
				"app": name,
			},
		},
		Spec: consolev1alpha1.ConsolePluginSpec{
			DisplayName: "OpenShift console plugin for all you cool cats and kittens",
			Service: consolev1alpha1.ConsolePluginService{
				Name:      name,
				Namespace: namespace,
				Port:      9443,
				BasePath:  "/",
			},
		},
	}
	return consolePlugin
}
