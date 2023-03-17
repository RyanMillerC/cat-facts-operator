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

package core

import (
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"

	tacomoev1alpha1 "github.com/ryanmillerc/cat-facts-operator/api/v1alpha1"
)

func ProcessCatFact(instance *tacomoev1alpha1.CatFact) error {
	if len(instance.Spec.Fact) == 0 {
		err := GenerateFact(instance)
		if err != nil {
			return err
		}
	}

	if len(instance.Spec.IconName) == 0 {
		err := GenerateIconName(instance)
		if err != nil {
			return err
		}
	} else if !isValidIconName(instance.Spec.IconName) {
		return fmt.Errorf("not a valid iconName %s", instance.Spec.IconName)
	}

	return nil
}

type CatFactNinjaAPIResponse struct {
	Fact   string `json:"fact"`
	Length int    `json:"length"`
}

var GetFactFromURL = getFactFromURL // Set function as variable for easier testing
func getFactFromURL(requestURL string) (string, error) {
	res, err := http.Get(requestURL)
	if err != nil {
		return "", err
	}
	defer res.Body.Close() // Wait for API response

	body, err := io.ReadAll(res.Body) // response body is []byte
	if err != nil {
		return "", err
	}

	var apiResponse CatFactNinjaAPIResponse
	if err := json.Unmarshal(body, &apiResponse); err != nil {
		return "", err
	}
	return apiResponse.Fact, err
}

func GenerateFact(instance *tacomoev1alpha1.CatFact) error {
	requestURL := "https://catfact.ninja/fact"
	fact, err := GetFactFromURL(requestURL)
	if err != nil {
		// If there's an error getting a fact from catfacts.ninja, use this placeholder fact.
		// TODO: Should also log here
		fact = "Cats are cool!"
	}
	instance.Spec.Fact = fact
	return nil
}

// Return a random IconName
func GenerateIconName(instance *tacomoev1alpha1.CatFact) error {
	rint := randInt(1, len(getValidIconNames()))
	instance.Spec.IconName = getValidIconNames()[rint]
	return nil
}

func getValidIconNames() []string {
	return []string{
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
}

// Return a random int between two numbers
func randInt(min int, max int) int {
	return min + rand.Intn(max-min)
}

// Validate that a given IconName is valid
func isValidIconName(iconName string) bool {
	for _, name := range getValidIconNames() {
		if iconName == name {
			return true
		}
	}
	return false
}
