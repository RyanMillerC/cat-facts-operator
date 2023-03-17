package core

import (
	"net/http"
	"net/http/httptest"
	"testing"

	tacomoev1alpha1 "github.com/ryanmillerc/cat-facts-operator/api/v1alpha1"
)

func TestGenerateFact(t *testing.T) {
	// Monkey patch GetFactFromURL
	GetFactFromURL = func(string) (string, error) {
		return "Cats are cool!", nil
	}
	instance := &tacomoev1alpha1.CatFact{}
	GenerateFact(instance)
	if instance.Spec.Fact != "Cats are cool!" {
		t.Fatalf(`instance.Spec.Fact is "%s", want match for "Cats are cool!"`, instance.Spec.Fact)
	}
}

func TestGetFactFromURL(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/fact" {
			t.Errorf("Expected to request '/fact', got: %s", r.URL.Path)
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"fact":"Cats are cool!","length":14}`))
	}))
	defer server.Close()

	value, _ := getFactFromURL(server.URL + "/fact")
	if value != "Cats are cool!" {
		t.Errorf("Expected 'Cats are cool!', got %s", value)
	}
}

func TestGenerateIconName(t *testing.T) {
	validIconNames := []string{
		"Grinning",
		"Smiling",
		"Joy",
		"Hearts",
		"Evil",
		"Kissing",
		"Weary",
		"Crying",
		"Pouting",
	}
	instance := &tacomoev1alpha1.CatFact{}
	GenerateIconName(instance)
	testPassed := false
	for _, name := range validIconNames {
		if name == instance.Spec.IconName {
			testPassed = true
		}
	}
	if !testPassed {
		t.Errorf("Expected %s to be a valid IconName", instance.Spec.IconName)
	}
}

func TestIsValidIconName(t *testing.T) {
	if isValidIconName("Invalid") {
		t.Errorf("Expected isValidIconName to return false for 'Invalid'")
	}
	if !isValidIconName("Joy") {
		t.Errorf("Expected isValidIconName to return true for 'Joy'")
	}
}
