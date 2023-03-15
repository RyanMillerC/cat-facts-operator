import * as React from 'react';
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Flex,
  FlexItem,
  PageSection,
  Title,
} from '@patternfly/react-core';
import { CatFact, catFactKind } from '../data/model';
import { CatFactModal } from './CatFactModal';
import { CatalogTile } from '@patternfly/react-catalog-view-extension';
import { getCatIconSVG, CatIcon } from './CatIcon';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import '../styles/main.css';

export const CatFactCatalog: React.FC = () => {
  const [catFacts, loaded, loadError] = useK8sWatchResource<CatFact[]>({
    groupVersionKind: catFactKind,
    isList: true,
    namespace: 'cat-facts-operator',
    namespaced: true,
  });

  const [modalVisible, setModalVisible] = React.useState(false);
  const [modalData, setModalData] = React.useState<CatFact>();

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
    const Icon = () => {
      return <CatIcon iconName="Crying" />;
    };

    return (
      <>
        <PageSection variant="light">
          <EmptyState>
            <EmptyStateIcon icon={Icon} />
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

  return (
    <>
      <PageSection className="cat-facts-console-plugin__cards" variant="light">
        <Flex>
          {catFacts.map((item, index) => {
            return (
              <FlexItem key={index}>
                <CatalogTile
                  className="cat-facts-console-plugin__card"
                  key={index}
                  id={item.metadata.name}
                  iconImg={getCatIconSVG(item.spec.iconName)}
                  iconAlt="PatternFly logo"
                  title="Cat Fact"
                  vendor="powered by Cat Facts Operator"
                  description={item.spec.fact}
                  onClick={() => {
                    setModalData(item);
                    setModalVisible(true);
                  }}
                />
              </FlexItem>
            );
          })}
        </Flex>
      </PageSection>
      <CatFactModal
        data={modalData}
        isOpen={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
};
