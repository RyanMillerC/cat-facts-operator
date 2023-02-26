import * as React from 'react';
import Helmet from 'react-helmet';
import {
  Page,
  PageSection,
  //Text,
  //TextContent,
  Title,
} from '@patternfly/react-core';
import { CatalogTile } from '@patternfly/react-catalog-view-extension';
import { CatFact, catFactKind } from './data/model';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import './example.css';

// export type CatFact = {
//   id: string;
//   fact: string;
// };

export default function ExamplePage() {
  // https://www.patternfly.org/v4/extensions/catalog-view/catalog-tile
  return (
    <>
      <Helmet>
        <title data-test="example-page-title">Hello, Plugin!</title>
      </Helmet>
      <Page>
        <PageSection variant="light">
          <Title headingLevel="h1">Cat Facts!</Title>
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
          No CatFacts found in cat-facts-operator namespace!
        </PageSection>
      </>
    );
  }

  // This logs fine
  console.log(catFacts[0].metadata.name);
  console.log(catFacts[0].spec.fact);

  // This renders a blank page after loading with no errors
  return (
    <>
      <PageSection variant="light">
        {catFacts.map((item, index) => {
          return (
            <CatalogTile
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
