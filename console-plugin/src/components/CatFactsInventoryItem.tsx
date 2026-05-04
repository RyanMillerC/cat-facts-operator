import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  InventoryItem,
  InventoryItemLoading,
  InventoryItemTitle,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { CatFact, CatFactGVK } from '../models/CatFact';
import CatIcon from './CatIcon';

const CAT_FACTS_LINK = '/k8s/all-namespaces/ryanmillerc.github.io~v1alpha1~CatFact';

const CatFactsInventoryItem: React.FC = () => {
  const [catFacts, loaded, loadError] = useK8sWatchResource<CatFact[]>({
    groupVersionKind: CatFactGVK,
    isList: true,
  });

  let title: React.ReactNode;
  if (!loaded && !loadError) {
    title = (
      <>
        <InventoryItemLoading />
        <Link to={CAT_FACTS_LINK}>Cat Facts <CatIcon size={16} /></Link>
      </>
    );
  } else {
    title = (
      <Link to={CAT_FACTS_LINK}>
        {loaded ? `${catFacts?.length ?? 0} ` : ''}Cat Facts <CatIcon size={16} />
      </Link>
    );
  }

  return (
    <InventoryItem>
      <InventoryItemTitle>{title}</InventoryItemTitle>
    </InventoryItem>
  );
};

export default CatFactsInventoryItem;
