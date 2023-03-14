package controllers

import (
	"context"
	"time"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	tacomoev1alpha1 "github.com/ryanmillerc/cat-facts-operator/api/v1alpha1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
)

var _ = Describe("CatFact controller", func() {

	// Define utility constants for object names and testing timeouts/durations and intervals.
	const (
		CatFactName      = "my-cat-fact"
		CatFactNamespace = "default"

		timeout  = time.Second * 10
		duration = time.Second * 10
		interval = time.Millisecond * 250
	)

	Context("When creating a CatFact", func() {
		It("Should generate a fact if a fact isn't provided", func() {
			By("Magic")
			ctx := context.Background()
			catFact := &tacomoev1alpha1.CatFact{
				TypeMeta: metav1.TypeMeta{
					APIVersion: "taco.moe/v1alpha1",
					Kind:       "CatFact",
				},
				ObjectMeta: metav1.ObjectMeta{
					Name:      CatFactName,
					Namespace: CatFactNamespace,
				},
				Spec: tacomoev1alpha1.CatFactSpec{
					Fact:     "",
					IconName: "Joy",
				},
			}
			Expect(k8sClient.Create(ctx, catFact)).Should(Succeed())

			catFactLookupKey := types.NamespacedName{Name: CatFactName, Namespace: CatFactNamespace}
			createdCatFact := &tacomoev1alpha1.CatFact{}

			// TODO: Fix this. The eventually block isn't working right. It's
			// returning either too fast or returning cached data. Sleeping for
			// a few seconds makes the test complete successfully.
			time.Sleep(time.Second * 2)

			// We'll need to retry getting this newly created CronJob, given that creation may not immediately happen.
			Eventually(func() bool {
				err := k8sClient.Get(ctx, catFactLookupKey, createdCatFact)
				return err == nil
			}, timeout, interval).Should(BeTrue())

			// Let's make sure a fact was set on the object
			Expect(createdCatFact.Spec.Fact).ShouldNot(Equal(""))

			// Delete the CatFact so it doesn't conflict with other tests
			k8sClient.Delete(ctx, createdCatFact)
		})

		It("Should generate an iconName if an iconName isn't provided", func() {
			By("Magic")
			ctx := context.Background()
			catFact := &tacomoev1alpha1.CatFact{
				TypeMeta: metav1.TypeMeta{
					APIVersion: "taco.moe/v1alpha1",
					Kind:       "CatFact",
				},
				ObjectMeta: metav1.ObjectMeta{
					Name:      CatFactName,
					Namespace: CatFactNamespace,
				},
				Spec: tacomoev1alpha1.CatFactSpec{
					Fact:     "Cats are cool!",
					IconName: "",
				},
			}
			Expect(k8sClient.Create(ctx, catFact)).Should(Succeed())

			catFactLookupKey := types.NamespacedName{Name: CatFactName, Namespace: CatFactNamespace}
			createdCatFact := &tacomoev1alpha1.CatFact{}

			// TODO: Fix this. The eventually block isn't working right. It's
			// returning either too fast or returning cached data. Sleeping for
			// a few seconds makes the test complete successfully.
			time.Sleep(time.Second * 2)

			// We'll need to retry getting this newly created CatFact, given
			// that creation may not immediately happen.
			Eventually(func() bool {
				err := k8sClient.Get(ctx, catFactLookupKey, createdCatFact)
				return err == nil
			}, timeout, interval).Should(BeTrue())

			Expect(createdCatFact.Name).Should(Equal("my-cat-fact"))

			// Let's make sure a fact was set on the object
			Expect(createdCatFact.Spec.IconName).ShouldNot(Equal(""))

			// Delete the CatFact so it doesn't conflict with other tests
			k8sClient.Delete(ctx, createdCatFact)
		})
	})
})
