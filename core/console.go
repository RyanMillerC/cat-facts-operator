/*

Code to deploy the OpenShift Dynamic Console plugin

*/

// TODO: Fix namespace so it's always the same as the controller.

package core

import (
	"context"

	"golang.org/x/mod/semver"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
	"k8s.io/client-go/kubernetes"
	ctrl "sigs.k8s.io/controller-runtime"

	consolev1alpha1 "github.com/openshift/api/console/v1alpha1"
	consolev1 "github.com/openshift/client-go/console/clientset/versioned/typed/console/v1alpha1"

	// configv1 "github.com/openshift/api/config/v1"
	configv1client "github.com/openshift/client-go/config/clientset/versioned/typed/config/v1"
)

var consoleLog = ctrl.Log.WithName("console")

// +kubebuilder:rbac:namespace=cat-facts-operator,groups=apps,resources=deployments,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:namespace=cat-facts-operator,groups=core,resources=services,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=console.openshift.io,resources=consoleplugins,verbs=get;list;watch;create;update;patch;delete

// Deploy OpenShift dynamic console plugin. The plugin requires 3 resources: a
// Deployment, a Service, and a ConsolePlugin. If any of the listed resources
// exist with the name 'cat-facts-console-plugin', they will be untouched. If
// any of the listed resources don't exist, they will be created.
func DeployConsolePlugin() error {
	// TODO: Only run this if running on OpenShift 4.10 or higher

	// We can't use the controller client because it hasn't been registered with
	// the manager yet. There's no good way register it without entering the
	// reconsile loop. So it's easiest to make up our own client for this package.
	config := ctrl.GetConfigOrDie()
	cli := kubernetes.NewForConfigOrDie(config)
	// Client for interacting with OpenShift console objects
	console := consolev1.NewForConfigOrDie(config)
	configClient := configv1client.NewForConfigOrDie(config)

	// Validate OpenShift version is 4.12 or higher. If the version requirement
	// is not met, do not install the console plugin.
	ocpVersion, err := getOpenShiftVersion(configClient)
	if err != nil {
		consoleLog.Error(err, "unable to validate OpenShift version")
	}
	shouldInstallPlugin := isOpenShiftVersionOk(ocpVersion)
	if !shouldInstallPlugin {
		// This isn't an error but this will stop the flow since the OpenShift
		// version does not support dynamic console plugins.
		consoleLog.Info(
			"Minimum OpenShift version to install console plugin not met",
			"OpenShift Version",
			ocpVersion,
		)
		consoleLog.Info("Skipping console plugin")
		return nil
	}

	// Create Deployment, if needed
	deploymentExists, err := doesDeploymentExist(cli)
	if err != nil {
		return err
	}
	if deploymentExists {
		consoleLog.Info("cat-facts-console-plugin deployment exists")
	} else {
		consoleLog.Info("cat-facts-console-plugin deployment does not exist... Creating it now")
		err = createDeployment(cli)
		if err != nil {
			return err
		}
	}

	// Create Service, if needed
	serviceExists, err := doesServiceExist(cli)
	if err != nil {
		return err
	}
	if serviceExists {
		consoleLog.Info("cat-facts-console-plugin service exists")
	} else {
		consoleLog.Info("cat-facts-console-plugin service does not exist... Creating it now")
		err = createService(cli)
		if err != nil {
			return err
		}
	}

	// Create ConsolePlugin, if needed
	consolePluginExists, err := doesConsolePluginExist(console)
	if err != nil {
		return err
	}
	if consolePluginExists {
		consoleLog.Info("cat-facts-console-plugin ConsolePlugin exists")
	} else {
		consoleLog.Info("cat-facts-console-plugin ConsolePlugin does not exist... Creating it now")
		err = createConsolePlugin(console)
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
	// From what I can tell, Desired version is the current OpenShift cluster
	// version.
	return clusterVersion.Status.Desired.Version, nil
}

// Returns true if the passed semantic version is equal to or greater than the
// minimum required version.
func isOpenShiftVersionOk(ocpVersion string) bool {
	// TODO: Move this to a const somewhere
	minVersion := "4.12"
	// semver.Compare will return:
	// * 0 if the versions match
	// * 1 if ocpVerion is greater than minVersion
	// * -1 if ocpVerion is less than minVersion
	return semver.Compare(ocpVersion, minVersion) >= 0
}

func createConsolePlugin(console *consolev1.ConsoleV1alpha1Client) error {
	consolePlugin := consolev1alpha1.ConsolePlugin{
		TypeMeta: metav1.TypeMeta{
			Kind:       "ConsolePlugin",
			APIVersion: "console.openshift.io/v1alpha1",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:      "cat-facts-console-plugin",
			Namespace: "cat-facts-operator",
			Labels: map[string]string{
				"app": "cat-facts-console-plugin",
			},
		},
		Spec: consolev1alpha1.ConsolePluginSpec{
			DisplayName: "OpenShift console plugin for all you cool cats and kittens",
			Service: consolev1alpha1.ConsolePluginService{
				Name:      "cat-facts-console-plugin",
				Namespace: "cat-facts-operator",
				Port:      9443,
				BasePath:  "/",
			},
		},
	}

	_, err := console.ConsolePlugins().Create(context.TODO(), &consolePlugin, metav1.CreateOptions{})
	if err != nil {
		return err
	}

	return nil // No errors; yay!
}

func createService(cli *kubernetes.Clientset) error {
	service := corev1.Service{
		TypeMeta: metav1.TypeMeta{
			Kind:       "Service",
			APIVersion: "v1",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:      "cat-facts-console-plugin",
			Namespace: "cat-facts-operator",
			Labels: map[string]string{
				"app": "cat-facts-console-plugin",
			},
			Annotations: map[string]string{
				"service.beta.openshift.io/serving-cert-secret-name": "cat-facts-console-plugin-cert",
			},
		},
		Spec: corev1.ServiceSpec{
			Ports: []corev1.ServicePort{
				{
					Name:     "9443-tcp",
					Protocol: "TCP",
					Port:     9443,
					TargetPort: intstr.IntOrString{
						//Type:   0,
						IntVal: 9443,
					},
				},
			},
			Selector: map[string]string{
				"app": "cat-facts-console-plugin",
			},
			Type:            "ClusterIP",
			SessionAffinity: "None",
		},
		Status: corev1.ServiceStatus{},
	}

	_, err := cli.CoreV1().Services("cat-facts-operator").Create(context.TODO(), &service, metav1.CreateOptions{})
	if err != nil {
		return err
	}

	return nil // No errors; yay!
}

func createDeployment(cli *kubernetes.Clientset) error {
	deployment := appsv1.Deployment{
		TypeMeta: metav1.TypeMeta{
			Kind:       "Deployment",
			APIVersion: "apps/v1",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:      "cat-facts-console-plugin",
			Namespace: "cat-facts-operator",
			Labels: map[string]string{
				"app": "cat-facts-console-plugin",
			},
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: int32Ptr(1),
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{
					"app": "cat-facts-console-plugin",
				},
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{
						"app": "cat-facts-console-plugin",
					},
				},
				Spec: corev1.PodSpec{
					Volumes: []corev1.Volume{
						{
							Name: "cat-facts-console-plugin-cert",
							VolumeSource: corev1.VolumeSource{
								Secret: &corev1.SecretVolumeSource{
									SecretName:  "cat-facts-console-plugin-cert",
									DefaultMode: int32Ptr(420),
								},
							},
						},
					},
					Containers: []corev1.Container{
						{
							Name: "cat-facts-console-plugin",
							// TODO: Replace hardcoded v0.0.8!
							Image: "quay.io/rymiller/cat-facts-operator-console-plugin:v0.0.9",
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
									Name:      "cat-facts-console-plugin-cert",
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

	_, err := cli.AppsV1().Deployments("cat-facts-operator").Create(context.TODO(), &deployment, metav1.CreateOptions{})
	if err != nil {
		return err
	}

	return nil // No errors; yay!
}

// Returns true if cat-facts-console-plugin Deployment exists in the
// cat-facts-operator namespace.
func doesDeploymentExist(cli *kubernetes.Clientset) (bool, error) {
	deploymentList, err := cli.AppsV1().Deployments("cat-facts-operator").List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return false, err
	}
	for _, deployment := range deploymentList.Items {
		if deployment.Name == "cat-facts-console-plugin" {
			return true, nil
		}
	}
	return false, nil
}

// Returns true if cat-facts-console-plugin Service exists in the
// cat-facts-operator namespace.
func doesServiceExist(cli *kubernetes.Clientset) (bool, error) {
	serviceList, err := cli.CoreV1().Services("cat-facts-operator").List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return false, err
	}
	for _, service := range serviceList.Items {
		if service.Name == "cat-facts-console-plugin" {
			return true, nil
		}
	}
	return false, nil
}

// Returns true if cat-facts-console-plugin ConsolePlugin exists. (ConsolePlugin
// is a cluster-scoped resource.)
func doesConsolePluginExist(console *consolev1.ConsoleV1alpha1Client) (bool, error) {
	consolePluginList, err := console.ConsolePlugins().List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return false, err
	}
	for _, consolePlugin := range consolePluginList.Items {
		if consolePlugin.Name == "cat-facts-console-plugin" {
			return true, nil
		}
	}
	return false, nil
}
