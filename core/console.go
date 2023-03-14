package core

import (
	"context"

	"sigs.k8s.io/controller-runtime/pkg/client"

	appsv1 "k8s.io/api/apps/v1"
)

func DeployConsolePlugin(cli client.Client) (*appsv1.DeploymentList, error) {
	deploymentList := &appsv1.DeploymentList{}
	listOps := client.ListOptions{Namespace: "cat-facts-operator"}
	err := cli.List(context.TODO(), deploymentList, &listOps)
	if err != nil {
		return deploymentList, err
	}
	return deploymentList, nil
}
