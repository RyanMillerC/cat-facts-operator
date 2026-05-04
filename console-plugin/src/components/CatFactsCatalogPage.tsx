import * as React from 'react';
import {
  DocumentTitle,
  NamespaceBar,
  ResourceLink,
  k8sCreate,
  k8sDelete,
  useActiveNamespace,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  Alert,
  AlertActionCloseButton,
  Card,
  CardBody,
  CardHeader,
  Content,
  Flex,
  FlexItem,
  Gallery,
  GalleryItem,
  Label,
  MenuToggle,
  MenuToggleElement,
  Nav,
  NavItem,
  NavList,
  PageSection,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  Button,
  Spinner,
} from '@patternfly/react-core';
import { CatFact, CatFactGVK, CatFactModel } from '../models/CatFact';
import CatIcon from './CatIcon';
import './cat-facts.css';

const ALL_NAMESPACES_KEY = '#ALL_NS#';
const ICON_OPTIONS = ['Crying', 'Evil', 'Grinning', 'Hearts', 'Joy', 'Kissing', 'Pouting', 'Smiling', 'Weary'];

type SortOrder = 'relevance' | 'asc' | 'desc';
const SORT_LABELS: Record<SortOrder, string> = { relevance: 'Relevance', asc: 'A-Z', desc: 'Z-A' };

type CatFactsCatalogPageProps = { namespace?: string };

export default function CatFactsCatalogPage({ namespace }: CatFactsCatalogPageProps) {
  const [activeNamespace] = useActiveNamespace();
  const [nameFilter, setNameFilter] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('relevance');
  const [sortSelectOpen, setSortSelectOpen] = React.useState(false);

  const ns = namespace ?? (activeNamespace === ALL_NAMESPACES_KEY ? undefined : activeNamespace);

  const [catFacts, loaded, loadError] = useK8sWatchResource<CatFact[]>({
    groupVersionKind: CatFactGVK,
    isList: true,
    namespace: ns,
  });

  const seenUids = React.useRef<Set<string>>(new Set());
  const [newUids, setNewUids] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (!loaded || !catFacts) return;
    const incoming = new Set(catFacts.map((cf) => cf.metadata?.uid ?? ''));
    const added = [...incoming].filter((uid) => uid && !seenUids.current.has(uid));
    const isFirstLoad = seenUids.current.size === 0;
    incoming.forEach((uid) => seenUids.current.add(uid));
    if (!isFirstLoad && added.length > 0) {
      setNewUids((prev) => new Set([...prev, ...added]));
      setTimeout(() => {
        setNewUids((prev) => {
          const next = new Set(prev);
          added.forEach((uid) => next.delete(uid));
          return next;
        });
      }, 1500);
    }
  }, [catFacts, loaded]);

  const [createError, setCreateError] = React.useState<string | null>(null);

  const createCatFact = () => {
    setCreateError(null);
    k8sCreate({
      model: CatFactModel,
      data: {
        apiVersion: 'ryanmillerc.github.io/v1alpha1',
        kind: 'CatFact',
        metadata: { generateName: 'cat-fact-', namespace: ns ?? 'cat-facts-operator' },
        spec: {},
      },
    }).catch(() => setCreateError('Default project "cat-facts-operator" not found. Select a project to create Cat Facts.'));
  };

  const deleteAllCatFacts = () => {
    if (!catFacts?.length) return;
    catFacts.forEach((cf) => k8sDelete({ model: CatFactModel, resource: cf }));
  };

  const filteredFacts = React.useMemo(() => {
    if (!catFacts) return [];
    return catFacts.filter((cf) => {
      if (selectedCategory !== 'all' && cf.spec.iconName !== selectedCategory) return false;
      if (nameFilter && !(cf.metadata?.name ?? '').toLowerCase().includes(nameFilter.toLowerCase()))
        return false;
      return true;
    });
  }, [catFacts, selectedCategory, nameFilter]);

  const sortedFacts = React.useMemo(() => {
    if (sortOrder === 'asc')
      return [...filteredFacts].sort((a, b) => (a.metadata?.name ?? '').localeCompare(b.metadata?.name ?? ''));
    if (sortOrder === 'desc')
      return [...filteredFacts].sort((a, b) => (b.metadata?.name ?? '').localeCompare(a.metadata?.name ?? ''));
    return [...filteredFacts].sort(
      (a, b) =>
        new Date(b.metadata?.creationTimestamp ?? 0).getTime() -
        new Date(a.metadata?.creationTimestamp ?? 0).getTime(),
    );
  }, [filteredFacts, sortOrder]);

  const categoryLabel = selectedCategory === 'all' ? 'All items' : selectedCategory;

  return (
    <>
      <DocumentTitle>Cat Facts Catalog</DocumentTitle>
      <NamespaceBar />
      <PageSection>
        <Content>
          <Content component="h1">Cat Facts Catalog</Content>
          <Content component="p">
            A catalog for all you cool cats and kittens. Browse all CAT FACTS from the CAT FACTS
            Operator. Use the filters to find facts by name or icon type.
          </Content>
        </Content>
      </PageSection>
      <PageSection>
        <div style={{
          border: '1px solid var(--pf-v6-global--BorderColor--200)',
          borderRadius: 'var(--pf-v6-global--BorderRadius--sm)',
          overflow: 'hidden',
        }}>
          <Flex alignItems={{ default: 'alignItemsFlexStart' }}>
            {/* Sidebar */}
            <FlexItem style={{ width: 'fit-content', minWidth: '10rem', borderRight: '1px solid var(--pf-v6-global--BorderColor--200)' }}>
              <Nav aria-label="Cat Facts categories">
                <NavList>
                  <NavItem isActive={selectedCategory === 'all'} onClick={() => setSelectedCategory('all')}>
                    All items
                  </NavItem>
                  {ICON_OPTIONS.map((icon) => (
                    <NavItem key={icon} isActive={selectedCategory === icon} onClick={() => setSelectedCategory(icon)}>
                      {icon}
                    </NavItem>
                  ))}
                </NavList>
              </Nav>
            </FlexItem>

            {/* Main content */}
            <FlexItem style={{ flex: 1, minWidth: 0, padding: 'var(--pf-v6-global--spacer--lg)' }}>
              <Content component="h4">{categoryLabel}</Content>
              <Flex
                alignItems={{ default: 'alignItemsCenter' }}
                justifyContent={{ default: 'justifyContentSpaceBetween' }}
                style={{ margin: 'var(--pf-v6-global--spacer--md) 0' }}
              >
                <FlexItem>
                  <Flex alignItems={{ default: 'alignItemsCenter' }} flexWrap={{ default: 'nowrap' }}>
                  <FlexItem>
                  <SearchInput
                    placeholder="Filter by keyword..."
                    value={nameFilter}
                    onChange={(_e, val) => setNameFilter(val)}
                    onClear={() => setNameFilter('')}
                  />
                </FlexItem>
                <FlexItem>
                  <Select
                    isOpen={sortSelectOpen}
                    onSelect={(_e, val) => { setSortOrder(val as SortOrder); setSortSelectOpen(false); }}
                    onOpenChange={setSortSelectOpen}
                    toggle={(ref: React.Ref<MenuToggleElement>) => (
                      <MenuToggle ref={ref} onClick={() => setSortSelectOpen(!sortSelectOpen)} isExpanded={sortSelectOpen}>
                        {SORT_LABELS[sortOrder]}
                      </MenuToggle>
                    )}
                  >
                    <SelectList>
                      <SelectOption value="relevance">Relevance</SelectOption>
                      <SelectOption value="asc">A-Z</SelectOption>
                      <SelectOption value="desc">Z-A</SelectOption>
                    </SelectList>
                  </Select>
                </FlexItem>
                  </Flex>
                </FlexItem>
                <FlexItem>
                  <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }} flexWrap={{ default: 'nowrap' }}>
                    <FlexItem>
                      <span style={{ color: 'var(--pf-v6-global--Color--200)', fontSize: 'var(--pf-v6-global--FontSize--sm)', fontWeight: 'bold' }}>
                        {sortedFacts.length} item{sortedFacts.length !== 1 ? 's' : ''}
                      </span>
                    </FlexItem>
                    <FlexItem>
                      <Button variant="primary" onClick={createCatFact}>Create CatFact</Button>
                    </FlexItem>
                    <FlexItem>
                      <Button variant="danger" onClick={deleteAllCatFacts} isDisabled={!catFacts?.length}>Delete All</Button>
                    </FlexItem>
                  </Flex>
                </FlexItem>
              </Flex>
              {createError && (
                <div style={{ marginTop: 'var(--pf-t--global--spacer--md)' }}>
                  <Alert
                    variant="danger"
                    isInline
                    title={createError}
                    actionClose={<AlertActionCloseButton onClose={() => setCreateError(null)} />}
                  />
                </div>
              )}
              {!loaded && <Spinner />}
              {loadError && <Alert variant="danger" isInline title={String(loadError)} />}
              {loaded && !loadError && (
                <>
                <div style={{ height: 'var(--pf-t--global--spacer--gutter--default)' }} />
                <Gallery hasGutter minWidths={{ default: '260px' }}>
                  {sortedFacts.map((cf) => (
                    <GalleryItem key={`${cf.metadata?.namespace}/${cf.metadata?.name}`}>
                      <Card isFullHeight className={newUids.has(cf.metadata?.uid ?? '') ? 'cat-facts__new-card' : undefined}>
                        <CardHeader>
                          <Flex
                            justifyContent={{ default: 'justifyContentSpaceBetween' }}
                            alignItems={{ default: 'alignItemsFlexStart' }}
                          >
                            <FlexItem>
                              <CatIcon iconName={cf.spec.iconName} size={48} />
                            </FlexItem>
                            {cf.spec.iconName && (
                              <FlexItem style={{ marginTop: '8px' }}>
                                <Label color="grey" isCompact><span style={{ fontWeight: 500 }}>{cf.spec.iconName}</span></Label>
                              </FlexItem>
                            )}
                          </Flex>
                        </CardHeader>
                        <CardBody>
                          <div style={{ marginBottom: 'var(--pf-v6-global--spacer--xs)' }}>
                            <ResourceLink
                              groupVersionKind={CatFactGVK}
                              name={cf.metadata?.name}
                              namespace={cf.metadata?.namespace}
                            />
                          </div>
                          <p style={{
                            color: 'var(--pf-v6-global--Color--200)',
                            fontSize: 'var(--pf-v6-global--FontSize--sm)',
                            fontWeight: 500,
                            marginBottom: 'var(--pf-v6-global--spacer--sm)',
                          }}>
                            {cf.metadata?.namespace}
                          </p>
                          <p style={{
                            display: '-webkit-box',
                            marginTop: 'var(--pf-t--global--spacer--sm)',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            fontSize: 'var(--pf-v6-global--FontSize--sm)',
                          }}>
                            {cf.spec.fact ?? 'No fact yet.'}
                          </p>
                        </CardBody>
                      </Card>
                    </GalleryItem>
                  ))}
                </Gallery>
                </>
              )}
            </FlexItem>
          </Flex>
        </div>
      </PageSection>
    </>
  );
}
