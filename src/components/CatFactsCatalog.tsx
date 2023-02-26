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
        <PageSection variant="light">
          <CatalogTile
            id="my-cat-fact"
            // iconImg={pfLogo2}
            iconAlt="PatternFly logo"
            badges={['Badge']}
            title="Cat Fact"
            vendor="powered by Cat Facts Operator"
            description="Cats are cool!"
          />
        </PageSection>
      </Page>
    </>
  );
}
