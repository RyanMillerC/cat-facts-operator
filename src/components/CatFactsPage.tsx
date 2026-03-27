import { DocumentTitle, ListPageHeader } from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from 'react-i18next';
import { Content, PageSection } from '@patternfly/react-core';
import './cat-facts.css';

export default function CatFactsPage() {
  const { t } = useTranslation('plugin__cat-facts');

  return (
    <>
      <DocumentTitle>{t('Cat Facts')}</DocumentTitle>
      <ListPageHeader title={t('Cat Facts')} />
      <PageSection>
        <Content component="p">{t('Cat facts will appear here.')}</Content>
      </PageSection>
    </>
  );
}
