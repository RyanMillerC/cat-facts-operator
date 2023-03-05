import * as React from 'react';
import Helmet from 'react-helmet';
import {
  Button,
  Page,
  PageSection,
  //Text,
  //TextContent,
  Title,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
} from '@patternfly/react-core';
import { CatalogTile } from '@patternfly/react-catalog-view-extension';
import { CatFact, catFactKind, CatFactModel } from './data/model';
//import { CatFact, catFactKind } from './data/model';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import './example.css';
import { k8sCreate } from '@openshift-console/dynamic-plugin-sdk';
import CubesIcon from '@patternfly/react-icons/dist/esm/icons/cubes-icon';

// export type CatFact = {
//   id: string;
//   fact: string;
// };

export default function ExamplePage() {
  // https://www.patternfly.org/v4/extensions/catalog-view/catalog-tile

  async function createCatFact() {
    const data: CatFact = {
      // I have no idea why it can't pull apiVersion and Kind from the model I'm
      // passing but I'm too frustrated to argue with a machine tonight. Here
      // you go OpenShift, have some extra strings. You've broken me. - RM
      apiVersion: 'taco.moe/v1alpha1',
      kind: 'CatFact',
      metadata: {
        generateName: 'cat-fact-',
      },
      spec: {}, // Cat Facts operator will generate a fact if we don't provide one
    };

    const options = {
      model: CatFactModel,
      data: data,
      ns: 'cat-facts-operator',
    };

    //console.log(CatFactModel);
    await k8sCreate(options);
  }

  return (
    <>
      <Helmet>
        <title data-test="example-page-title">Hello, Plugin!</title>
      </Helmet>
      <Page>
        <PageSection variant="light">
          <Title headingLevel="h1">Cat Facts!</Title>
        </PageSection>
        <PageSection variant="light">
          <Button onClick={createCatFact}>Create CatFact</Button>
        </PageSection>
        <CatFactCatalog />
      </Page>
    </>
  );
}

function CatFactCatalog() {
  const [catFacts, loaded, loadError] = useK8sWatchResource<CatFact[]>({
    groupVersionKind: catFactKind,
    isList: true,
    namespace: 'cat-facts-operator',
    namespaced: true,
  });

  console.log({ catFacts });
  console.log({ loaded });
  console.log({ loadError });

  if (loaded === false) {
    return (
      <>
        <PageSection variant="light">Loading...</PageSection>
      </>
    );
  }

  if (loadError) {
    return (
      <>
        <PageSection variant="light">ERROR: {loadError}</PageSection>
      </>
    );
  }

  if (loaded === true && catFacts.length === 0) {
    return (
      <>
        <PageSection variant="light">
          <EmptyState>
            <EmptyStateIcon icon={CubesIcon} />
            <Title headingLevel="h4" size="lg">
              No CatFacts found
            </Title>
            <EmptyStateBody>
              No CatFacts exist in the <code>cat-facts-operator</code>{' '}
              namespace. Click <i>Create CatFact</i> above to get started.
            </EmptyStateBody>
          </EmptyState>
        </PageSection>
      </>
    );
  }

  // This renders a blank page after loading with no errors
  return (
    <>
      <PageSection className="cat-facts-console-plugin__cards" variant="light">
        {catFacts.map((item, index) => {
          return (
            <CatalogTile
              className="cat-facts-console-plugin__card"
              key={index}
              id={item.metadata.name}
              // iconImg={pfLogo2}
              iconAlt="PatternFly logo"
              badges={['Badge']}
              title="Cat Fact"
              vendor="powered by Cat Facts Operator"
              description={item.spec.fact}
            />
          );
        })}
      </PageSection>
    </>
  );
}
