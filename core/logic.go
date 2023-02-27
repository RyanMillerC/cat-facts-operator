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
	"net/http"

	tacomoev1alpha1 "github.com/ryanmillerc/cat-facts-operator/api/v1alpha1"
)

type CatFactNinjaAPIResponse struct {
	Fact   string `json:"fact"`
	Length int    `json:"length"`
}

func GenerateFact(instance *tacomoev1alpha1.CatFact) error {
	requestURL := "https://catfact.ninja/fact"
	res, err := http.Get(requestURL)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body) // response body is []byte
	if err != nil {
		return err
	}
	fmt.Println(string(body)) // convert to string before print

	var apiResponse CatFactNinjaAPIResponse
	if err := json.Unmarshal(body, &apiResponse); err != nil {
		return err
	}

	instance.Spec.Fact = apiResponse.Fact
	return nil
}
