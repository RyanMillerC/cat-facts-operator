import * as React from 'react';
import {
  DocumentTitle,
  ListPageBody,
  ListPageHeader,
  ResourceLink,
  RowProps,
  TableColumn,
  TableData,
  Timestamp,
  VirtualizedTable,
  k8sCreate,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { Button } from '@patternfly/react-core';
import { CatFact, CatFactGVK, CatFactModel } from '../models/CatFact';

const columns: TableColumn<CatFact>[] = [
  { id: 'name', title: 'Name' },
  { id: 'namespace', title: 'Namespace' },
  { id: 'fact', title: 'Fact' },
  { id: 'age', title: 'Age' },
];

const CatFactRow: React.FC<RowProps<CatFact>> = ({ obj, activeColumnIDs }) => (
  <>
    <TableData id="name" activeColumnIDs={activeColumnIDs}>
      <ResourceLink
        groupVersionKind={CatFactGVK}
        name={obj.metadata?.name}
        namespace={obj.metadata?.namespace}
      />
    </TableData>
    <TableData id="namespace" activeColumnIDs={activeColumnIDs}>
      {obj.metadata?.namespace}
    </TableData>
    <TableData id="fact" activeColumnIDs={activeColumnIDs}>
      {obj.spec.fact}
    </TableData>
    <TableData id="age" activeColumnIDs={activeColumnIDs}>
      <Timestamp timestamp={obj.metadata?.creationTimestamp} />
    </TableData>
  </>
);

export default function CatFactsPage() {
  const [catFacts, loaded, loadError] = useK8sWatchResource<CatFact[]>({
    groupVersionKind: CatFactGVK,
    isList: true,
  });

  const createCatFact = () =>
    k8sCreate({
      model: CatFactModel,
      data: {
        apiVersion: 'taco.moe/v1alpha1',
        kind: 'CatFact',
        metadata: { generateName: 'cat-fact-', namespace: 'cat-facts-operator' },
        spec: {},
      },
    });

  return (
    <>
      <DocumentTitle>Cat Facts</DocumentTitle>
      <ListPageHeader title="Cat Facts">
        <Button variant="primary" onClick={createCatFact}>Create CatFact</Button>
      </ListPageHeader>
      <ListPageBody>
        <VirtualizedTable
          data={catFacts ?? []}
          unfilteredData={catFacts ?? []}
          loaded={loaded}
          loadError={loadError}
          columns={columns}
          Row={CatFactRow}
          aria-label="Cat Facts"
        />
      </ListPageBody>
    </>
  );
}
