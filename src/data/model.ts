import {
  K8sGroupVersionKind,
  K8sResourceCommon,
} from '@openshift-console/dynamic-plugin-sdk';
import { K8sModel } from '@openshift-console/dynamic-plugin-sdk/lib/api/common-types';

export const catFactKind: K8sGroupVersionKind = {
  version: 'v1alpha1',
  group: 'taco.moe',
  kind: 'CatFact',
};

export type CatFact = {
  spec: {
    fact?: string;
    iconName?: string;
  };
} & K8sResourceCommon;

export const CatFactModel: K8sModel = {
  apiVersion: catFactKind.version,
  apiGroup: catFactKind.group,
  label: catFactKind.kind,
  labelKey: catFactKind.kind,
  plural: 'catfacts',
  abbr: '',
  namespaced: true,
  crd: true,
  kind: catFactKind.kind,
  id: 'catfact',
  labelPlural: 'CatFacts',
  labelPluralKey: 'CatFact',
};
