// TODO: Namespace is hardcoded throughout this file. This should be determined
// based on the namespace the controller is running in.

package core

import (
	"context"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	ctrl "sigs.k8s.io/controller-runtime"
)

// TODO: Implement this
// If running on OpenShift 4.10 or higher
// If Deployment is not present, deploy it
// If Service is not present, deploy it
// If ConsolePlugin is not present, deploy it
func DeployConsolePlugin() error {
	config := ctrl.GetConfigOrDie()
	cli := kubernetes.NewForConfigOrDie(config)

	deploymentExists, err := doesDeploymentExist(cli)
	if err != nil {
		return err
	}
	if !deploymentExists {
		err = deployDeployment(cli)
		if err != nil {
			return err
		}
	}
	return nil
}

func deployDeployment(cli *kubernetes.Clientset) error {
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
							Name:  "cat-facts-console-plugin",
							Image: "quay.io/rymiller/cat-facts-console-plugin:latest",
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

func int32Ptr(i int32) *int32 { return &i }

func boolPtr(b bool) *bool { return &b }