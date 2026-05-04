import * as React from 'react';
import CatFactsPage from './CatFactsPage';

type PageComponentProps = { obj?: { metadata?: { name?: string } } };

const CatFactsNamespaceTab: React.FC<PageComponentProps> = ({ obj }) => (
  <CatFactsPage namespace={obj?.metadata?.name} showTitle={false} />
);

export default CatFactsNamespaceTab;
