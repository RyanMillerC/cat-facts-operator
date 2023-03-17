/*
Utilities for console. These functions make it easy to pass pointers inline
struct fields on k8s types.
*/

package console

// Return a new int32 pointer with the passed value
func int32Ptr(i int32) *int32 { return &i }

// Return a new bool pointer with the passed value
func boolPtr(b bool) *bool { return &b }
