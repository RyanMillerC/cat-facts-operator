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

	consolev1alpha1 "github.com/openshift/api/console/v1alpha1"
	configv1client "github.com/openshift/client-go/config/clientset/versioned/typed/config/v1"
	consolev1alpha1client "github.com/openshift/client-go/console/clientset/versioned/typed/console/v1alpha1"
	"golang.org/x/mod/semver"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
	"k8s.io/client-go/kubernetes"
	ctrl "sigs.k8s.io/controller-runtime"

	"github.com/ryanmillerc/cat-facts-operator/pkg/config"
)

var consoleLog = ctrl.Log.WithName("console")

// +kubebuilder:rbac:namespace=cat-facts-operator,groups=apps,resources=deployments,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:namespace=cat-facts-operator,groups=core,resources=services,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=console.openshift.io,resources=consoleplugins,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=config.openshift.io,resources=clusterversions,verbs=get

// Deploy OpenShift dynamic console plugin.
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
	// reconsile loop. So it's easiest to make up our own clients for this package.
	k8sConfig := ctrl.GetConfigOrDie()

	k8sClient := kubernetes.NewForConfigOrDie(k8sConfig)
	consoleClient := consolev1alpha1client.NewForConfigOrDie(k8sConfig) // Client for ConsolePlugin
	configClient := configv1client.NewForConfigOrDie(k8sConfig)         // Client for ClusterVersion

	// Validate OpenShift version meets minimum requirements. If the version
	// requirement is not met, do not install the console plugin.
	ocpVersion, err := getOpenShiftVersion(configClient)
	if err != nil {
		return errors.New("unable to validate OpenShift version")
	}
	shouldInstallPlugin := isOpenShiftVersionOk(ocpVersion)
	if !shouldInstallPlugin {
		// This isn't an error but this will stop the flow since the OpenShift
		// version does not support dynamic console plugins.
		consoleLog.Info(
			"Minimum required OpenShift version to install console plugin not met",
			"OpenShift version",
			ocpVersion,
			"Minimum required version",
			config.MinConsolePluginOCPVer,
		)
		consoleLog.Info("Skipping console plugin")
		return nil
	}

	namespace, err := getControllerNamespace()
	if err != nil {
		return err
	}

	// Create Deployment, if needed
	deploymentExists, err := doesDeploymentExist(k8sClient, namespace)
	if err != nil {
		return err
	}
	if deploymentExists {
		consoleLog.Info("Console plugin Deployment exists")
	} else {
		consoleLog.Info("Console plugin Deployment does not exist... Creating it now")
		err = createDeployment(k8sClient, namespace)
		if err != nil {
			return err
		}
	}

	// Create Service, if needed
	serviceExists, err := doesServiceExist(k8sClient, namespace)
	if err != nil {
		return err
	}
	if serviceExists {
		consoleLog.Info("Console plugin Service exists")
	} else {
		consoleLog.Info("Console plugin Service does not exist... Creating it now")
		err = createService(k8sClient, namespace)
		if err != nil {
			return err
		}
	}

	// Create ConsolePlugin, if needed
	consolePluginExists, err := doesConsolePluginExist(consoleClient, namespace)
	if err != nil {
		return err
	}
	if consolePluginExists {
		consoleLog.Info("Console plugin ConsolePlugin exists")
	} else {
		consoleLog.Info("Console plugin ConsolePlugin does not exist... Creating it now")
		err = createConsolePlugin(consoleClient, namespace)
		if err != nil {
			return err
		}
	}

	return nil
}

// Return semantic version of the running OpenShift cluster
func getOpenShiftVersion(cli *configv1client.ConfigV1Client) (string, error) {
	clusterVersion, err := cli.ClusterVersions().Get(context.TODO(), "version", metav1.GetOptions{})
	if err != nil {
		return "", err
	}
	// Desired version appears to be the current OpenShift cluster version
	return clusterVersion.Status.Desired.Version, nil
}

// Returns true if the passed semantic version is equal to or greater than the
// minimum required version.
func isOpenShiftVersionOk(ocpVersion string) bool {
	// semver.Compare will return:
	// * 0 if the versions match
	// * 1 if ocpVerion is greater than minVersion
	// * -1 if ocpVerion is less than minVersion
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

// Returns true if an existing console plugin Deployment exists.
func doesDeploymentExist(client *kubernetes.Clientset, namespace string) (bool, error) {
	deploymentList, err := client.AppsV1().Deployments("cat-facts-operator").List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return false, err
	}
	for _, deployment := range deploymentList.Items {
		if deployment.Name == fmt.Sprintf("%s-console-plugin", config.OperatorName) {
			return true, nil
		}
	}
	return false, nil
}

// Create Deployment for dynamic console plugin
func createDeployment(client *kubernetes.Clientset, namespace string) error {
	deployment := appsv1.Deployment{
		TypeMeta: metav1.TypeMeta{
			Kind:       "Deployment",
			APIVersion: "apps/v1",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:      fmt.Sprintf("%s-console-plugin", config.OperatorName),
			Namespace: namespace,
			Labels: map[string]string{
				"app": fmt.Sprintf("%s-console-plugin", config.OperatorName),
			},
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: int32Ptr(1),
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{
					"app": fmt.Sprintf("%s-console-plugin", config.OperatorName),
				},
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{
						"app": fmt.Sprintf("%s-console-plugin", config.OperatorName),
					},
				},
				Spec: corev1.PodSpec{
					Volumes: []corev1.Volume{
						{
							Name: fmt.Sprintf("%s-console-plugin-cert", config.OperatorName),
							VolumeSource: corev1.VolumeSource{
								Secret: &corev1.SecretVolumeSource{
									SecretName:  fmt.Sprintf("%s-console-plugin-cert", config.OperatorName),
									DefaultMode: int32Ptr(420),
								},
							},
						},
					},
					Containers: []corev1.Container{
						{
							Name:  fmt.Sprintf("%s-console-plugin", config.OperatorName),
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
									Name:      fmt.Sprintf("%s-console-plugin-cert", config.OperatorName),
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

	_, err := client.AppsV1().Deployments("cat-facts-operator").Create(context.TODO(), &deployment, metav1.CreateOptions{})
	if err != nil {
		return err
	}

	return nil
}

// Returns true if an existing console plugin Service exists.
func doesServiceExist(client *kubernetes.Clientset, namespace string) (bool, error) {
	serviceList, err := client.CoreV1().Services("cat-facts-operator").List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return false, err
	}
	for _, service := range serviceList.Items {
		if service.Name == fmt.Sprintf("%s-console-plugin", config.OperatorName) {
			return true, nil
		}
	}
	return false, nil
}

// Create Service for dynamic console plugin
func createService(client *kubernetes.Clientset, namespace string) error {
	service := corev1.Service{
		TypeMeta: metav1.TypeMeta{
			Kind:       "Service",
			APIVersion: "v1",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:      fmt.Sprintf("%s-console-plugin", config.OperatorName),
			Namespace: namespace,
			Labels: map[string]string{
				"app": fmt.Sprintf("%s-console-plugin", config.OperatorName),
			},
			Annotations: map[string]string{
				"service.beta.openshift.io/serving-cert-secret-name": fmt.Sprintf("%s-console-plugin-cert", config.OperatorName),
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
				"app": fmt.Sprintf("%s-console-plugin", config.OperatorName),
			},
			Type:            "ClusterIP",
			SessionAffinity: "None",
		},
		Status: corev1.ServiceStatus{},
	}

	_, err := client.CoreV1().Services("cat-facts-operator").Create(context.TODO(), &service, metav1.CreateOptions{})
	if err != nil {
		return err
	}

	return nil
}

// Returns true if an existing console plugin ConsolePlugin exists.
func doesConsolePluginExist(client *consolev1alpha1client.ConsoleV1alpha1Client, namespace string) (bool, error) {
	consolePluginList, err := client.ConsolePlugins().List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return false, err
	}
	for _, consolePlugin := range consolePluginList.Items {
		if consolePlugin.Name == fmt.Sprintf("%s-console-plugin", config.OperatorName) {
			return true, nil
		}
	}
	return false, nil
}

// Create ConsolePlugin for dynamic console plugin
func createConsolePlugin(console *consolev1alpha1client.ConsoleV1alpha1Client, namespace string) error {
	consolePlugin := consolev1alpha1.ConsolePlugin{
		TypeMeta: metav1.TypeMeta{
			Kind:       "ConsolePlugin",
			APIVersion: "console.openshift.io/v1alpha1",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name: fmt.Sprintf("%s-console-plugin", config.OperatorName),
			Labels: map[string]string{
				"app": fmt.Sprintf("%s-console-plugin", config.OperatorName),
			},
		},
		Spec: consolev1alpha1.ConsolePluginSpec{
			DisplayName: "OpenShift console plugin for all you cool cats and kittens",
			Service: consolev1alpha1.ConsolePluginService{
				Name:      fmt.Sprintf("%s-console-plugin", config.OperatorName),
				Namespace: namespace,
				Port:      9443,
				BasePath:  "/",
			},
		},
	}

	_, err := console.ConsolePlugins().Create(context.TODO(), &consolePlugin, metav1.CreateOptions{})
	if err != nil {
		return err
	}

	return nil
}
