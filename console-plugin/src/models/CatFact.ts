import { K8sGroupVersionKind, K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import { K8sModel } from '@openshift-console/dynamic-plugin-sdk/lib/api/common-types';

export const CatFactGVK: K8sGroupVersionKind = {
  group: 'ryanmillerc.github.io',
  version: 'v1alpha1',
  kind: 'CatFact',
};

export const CatFactModel: K8sModel = {
  apiGroup: 'ryanmillerc.github.io',
  apiVersion: 'v1alpha1',
  kind: 'CatFact',
  label: 'CatFact',
  labelKey: 'CatFact',
  labelPlural: 'CatFacts',
  labelPluralKey: 'CatFacts',
  plural: 'catfacts',
  id: 'catfact',
  abbr: 'CF',
  namespaced: true,
  crd: true,
};

export type CatFact = {
  spec: {
    fact?: string;
    iconName?: string;
  };
} & K8sResourceCommon;
