import * as React from 'react';
import Helmet from 'react-helmet';
import { Button, Page, PageSection, Title } from '@patternfly/react-core';
import { k8sCreate } from '@openshift-console/dynamic-plugin-sdk';
import { CatFact, CatFactModel } from '../data/model';
import { CatFactCatalog } from './CatFactsCatalog';
import '../styles/main.css';

export const CatFactsPage: React.FC = () => {
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
    await k8sCreate(options);
  }

  return (
    <>
      <Helmet>
        <title>Cat Facts!</title>
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
};
export default CatFactsPage;
