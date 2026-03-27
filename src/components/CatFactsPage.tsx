import {
  DocumentTitle,
  ListPageBody,
  ListPageHeader,
  ResourceLink,
  Timestamp,
  k8sCreate,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { Button, Spinner } from '@patternfly/react-core';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import { CatFact, CatFactGVK, CatFactModel } from '../models/CatFact';
import CatIcon from './CatIcon';

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
        {!loaded && <Spinner />}
        {loadError && <p>Error loading CatFacts: {String(loadError)}</p>}
        {loaded && !loadError && (
          <Table aria-label="Cat Facts" variant="compact">
            <Thead>
              <Tr>
                <Th width={20}>Name</Th>
                <Th modifier="fitContent">Icon</Th>
                <Th>Fact</Th>
                <Th modifier="fitContent">Age</Th>
              </Tr>
            </Thead>
            <Tbody>
              {catFacts?.map((catFact) => (
                <Tr key={catFact.metadata?.uid}>
                  <Td>
                    <ResourceLink
                      groupVersionKind={CatFactGVK}
                      name={catFact.metadata?.name}
                      namespace={catFact.metadata?.namespace}
                    />
                  </Td>
                  <Td modifier="fitContent">
                    <CatIcon iconName={catFact.spec.iconName} />
                  </Td>
                  <Td>{catFact.spec.fact}</Td>
                  <Td modifier="fitContent">
                    <Timestamp timestamp={catFact.metadata?.creationTimestamp} />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </ListPageBody>
    </>
  );
}
