/*
Copyright 2023.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package controllers

import (
	"context"
	"reflect"

	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/log"

	tacomoev1alpha1 "github.com/ryanmillerc/cat-facts-operator/api/v1alpha1"
)

// CatFactReconciler reconciles a CatFact object
type CatFactReconciler struct {
	client.Client
	Scheme *runtime.Scheme
}

//+kubebuilder:rbac:groups=taco.moe,resources=catfacts,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups=taco.moe,resources=catfacts/status,verbs=get;update;patch
//+kubebuilder:rbac:groups=taco.moe,resources=catfacts/finalizers,verbs=update

// Reconcile is part of the main kubernetes reconciliation loop which aims to
// move the current state of the cluster closer to the desired state.
// TODO(user): Modify the Reconcile function to compare the state specified by
// the CatFact object against the actual cluster state, and then
// perform operations to make the cluster state reflect the state specified by
// the user.
//
// For more details, check Reconcile and its Result here:
// - https://pkg.go.dev/sigs.k8s.io/controller-runtime@v0.13.0/pkg/reconcile
func (r *CatFactReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	logger := log.FromContext(ctx)
	instance := &tacomoev1alpha1.CatFact{}
	err := r.Get(context.TODO(), req.NamespacedName, instance)
	if err != nil {
		if errors.IsNotFound(err) {
			// Request object could have been deleted after reconcile request
			return ctrl.Result{}, nil
		}
		return ctrl.Result{}, err
	}

	logger.Info("Processing", "Name", instance.Name)

	// Make a copy of the original instance we can compare to at the end.
	orgInstance := instance.DeepCopy()

	if len(instance.Spec.Fact) == 0 {
		generateFact(instance)
	}

	if !reflect.DeepEqual(instance, orgInstance) {
		logger.Info("Updating", "Name", instance.Name)
		r.Update(ctx, instance)
	}

	return ctrl.Result{}, nil
}

// SetupWithManager sets up the controller with the Manager.
func (r *CatFactReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&tacomoev1alpha1.CatFact{}).
		Complete(r)
}
