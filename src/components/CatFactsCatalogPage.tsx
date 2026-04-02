import * as React from 'react';
import {
  DocumentTitle,
  NamespaceBar,
  ResourceLink,
  Timestamp,
  useActiveNamespace,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Content,
  Divider,
  Flex,
  FlexItem,
  Gallery,
  GalleryItem,
  PageSection,
  SearchInput,
  Spinner,
  Title,
} from '@patternfly/react-core';
import { CatFact, CatFactGVK } from '../models/CatFact';
import CatIcon from './CatIcon';

const ALL_NAMESPACES_KEY = '#ALL_NS#'; // used by useActiveNamespace return value
const ICON_OPTIONS = ['Crying', 'Evil', 'Grinning', 'Hearts', 'Joy', 'Kissing', 'Pouting', 'Smiling', 'Weary'];

export default function CatFactsCatalogPage() {
  const [activeNamespace] = useActiveNamespace();
  const [nameFilter, setNameFilter] = React.useState('');
  const [iconFilters, setIconFilters] = React.useState<Set<string>>(new Set());

  const [catFacts, loaded, loadError] = useK8sWatchResource<CatFact[]>({
    groupVersionKind: CatFactGVK,
    isList: true,
    namespace: activeNamespace === ALL_NAMESPACES_KEY ? undefined : activeNamespace,
  });

  const toggleIconFilter = (icon: string, checked: boolean) => {
    setIconFilters((prev) => {
      const next = new Set(prev);
      if (checked) next.add(icon);
      else next.delete(icon);
      return next;
    });
  };

  const filteredFacts = React.useMemo(() => {
    if (!catFacts) return [];
    return catFacts.filter((cf) => {
      if (nameFilter && !(cf.metadata?.name ?? '').toLowerCase().includes(nameFilter.toLowerCase()))
        return false;
      if (iconFilters.size > 0 && !iconFilters.has(cf.spec.iconName ?? '')) return false;
      return true;
    });
  }, [catFacts, nameFilter, iconFilters]);

  return (
    <>
      <DocumentTitle>Cat Facts Catalog</DocumentTitle>
      <NamespaceBar />
      <PageSection>
        <Content>
          <Content component="h1">Cat Facts Catalog</Content>
          <Content component="p">A catalog for all you cool cats and kittens. Browse all CAT FACTS from the CAT FACTS Operator. Use the filters to find facts by name or icon type.</Content>
        </Content>
      </PageSection>
      <PageSection>
        <SearchInput
          placeholder="Filter by name..."
          value={nameFilter}
          onChange={(_e, val) => setNameFilter(val)}
          onClear={() => setNameFilter('')}
          style={{ marginBottom: 'var(--pf-v6-global--spacer--md)' }}
        />
        <Flex alignItems={{ default: 'alignItemsFlexStart' }}>
          {/* Sidebar */}
          <FlexItem style={{ minWidth: '220px', width: '220px' }}>
            <Title headingLevel="h3" size="md">
              Icon Type
            </Title>
            <Divider style={{ margin: 'var(--pf-v6-global--spacer--sm) 0' }} />
            {ICON_OPTIONS.map((icon) => (
              <div key={icon} style={{ padding: 'var(--pf-v6-global--spacer--xs) 0' }}>
                <Checkbox
                  id={`icon-filter-${icon}`}
                  label={icon}
                  isChecked={iconFilters.has(icon)}
                  onChange={(_e, checked) => toggleIconFilter(icon, checked)}
                />
              </div>
            ))}
          </FlexItem>

          {/* Main content */}
          <FlexItem style={{ flex: 1, minWidth: 0 }}>
            {!loaded && <Spinner />}
            {loadError && <p>Error loading Cat Facts: {String(loadError)}</p>}
            {loaded && !loadError && (
              <>
                <p style={{ marginBottom: 'var(--pf-v6-global--spacer--md)', color: 'var(--pf-v6-global--Color--200)' }}>
                  {filteredFacts.length} item{filteredFacts.length !== 1 ? 's' : ''}
                </p>
                <Gallery hasGutter minWidths={{ default: '260px' }}>
                  {filteredFacts.map((cf) => (
                    <GalleryItem key={`${cf.metadata?.namespace}/${cf.metadata?.name}`}>
                      <Card isFullHeight>
                        <CardHeader>
                          <CatIcon iconName={cf.spec.iconName} size={40} />
                        </CardHeader>
                        <CardTitle>
                          <ResourceLink
                            groupVersionKind={CatFactGVK}
                            name={cf.metadata?.name}
                            namespace={cf.metadata?.namespace}
                          />
                        </CardTitle>
                        <CardBody>
                          <p style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            color: 'var(--pf-v6-global--Color--200)',
                            fontSize: 'var(--pf-v6-global--FontSize--sm)',
                          }}>
                            {cf.spec.fact ?? 'No fact yet.'}
                          </p>
                        </CardBody>
                        <CardFooter>
                          <small style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                            <Timestamp timestamp={cf.metadata?.creationTimestamp} />
                          </small>
                        </CardFooter>
                      </Card>
                    </GalleryItem>
                  ))}
                </Gallery>
              </>
            )}
          </FlexItem>
        </Flex>
      </PageSection>
    </>
  );
}
