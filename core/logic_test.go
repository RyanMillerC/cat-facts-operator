package core

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

// func TestGenerateFact(t *testing.T) {
// 	instance := &tacomoev1alpha1.CatFact{}
// 	GenerateFact(instance)
// 	if instance.Spec.Fact != "Cats are cool!" {
// 		t.Fatalf(`instance.Spec.Fact is "%s", want match for "Cats are cool!"`, instance.Spec.Fact)
// 	}
// }

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