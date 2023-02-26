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
import './example.css';

export type CatFact = {
  id: string;
  fact: string;
};

export default function ExamplePage() {
  const catFactsList: CatFact[] = [
    {
      id: 'my-cat-fact',
      fact: 'Cats are cool!',
    },
    {
      id: 'second-cat-fact',
      fact: 'Cats are the coolest!!!',
    },
  ];

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
        <PageSection variant="light">
          {catFactsList.map((item, index) => {
            return (
              <CatalogTile
                key={index}
                id={item.id}
                // iconImg={pfLogo2}
                iconAlt="PatternFly logo"
                badges={['Badge']}
                title="Cat Fact"
                vendor="powered by Cat Facts Operator"
                description={item.fact}
              />
            );
          })}
        </PageSection>
      </Page>
    </>
  );
}
