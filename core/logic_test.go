package core

import (
	"testing"

	tacomoev1alpha1 "github.com/ryanmillerc/cat-facts-operator/api/v1alpha1"
)

func TestGenerateFact(t *testing.T) {
	instance := &tacomoev1alpha1.CatFact{}
	GenerateFact(instance)
	if instance.Spec.Fact != "Cats are cool!" {
		t.Fatalf(`instance.Spec.Fact is %s, want match for "Cats are cool!`, instance.Spec.Fact)
	}
}
