import * as React from 'react';
import {
  DocumentTitle,
  ListPageBody,
  ListPageHeader,
  ResourceLink,
  Timestamp,
  k8sCreate,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  Alert,
  AlertActionCloseButton,
  Button,
  EmptyState,
  EmptyStateBody,
  Checkbox,
  Label,
  LabelGroup,
  MenuToggle,
  MenuToggleElement,
  Pagination,
  Popover,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  Spinner,
} from '@patternfly/react-core';
import { ThProps } from '@patternfly/react-table';
import {
  DataView,
  DataViewTable,
  DataViewTh,
  DataViewToolbar,
  DataViewTr,
  useDataViewFilters,
  useDataViewPagination,
} from '@patternfly/react-data-view';
import { CatFact, CatFactGVK, CatFactModel } from '../models/CatFact';
import CatIcon from './CatIcon';

type ColKey = 'name' | 'icon' | 'fact' | 'age';
type ColWidths = Record<ColKey, number>;
type CatFactFilters = { name: string; iconName: string };

const DEFAULT_COL_WIDTHS: ColWidths = { name: 200, icon: 80, fact: 500, age: 150 };
const DEFAULT_PER_PAGE = 20;
const COL_KEYS: ColKey[] = ['name', 'icon', 'fact', 'age'];
const COL_LABELS: Record<ColKey, string> = { name: 'Name', icon: 'Icon', fact: 'Fact', age: 'Age' };
const ICON_OPTIONS = ['Crying', 'Evil', 'Grinning', 'Hearts', 'Joy', 'Kissing', 'Pouting', 'Smiling', 'Weary'];

type CatFactsPageProps = { namespace?: string };

export default function CatFactsPage({ namespace }: CatFactsPageProps) {
  const [catFacts, loaded, loadError] = useK8sWatchResource<CatFact[]>({
    groupVersionKind: CatFactGVK,
    isList: true,
    namespace,
  });

  const [sortBy, setSortBy] = React.useState<ColKey | undefined>(undefined);
  const [direction, setDirection] = React.useState<'asc' | 'desc'>('asc');
  const [colWidths, setColWidths] = React.useState<ColWidths>(DEFAULT_COL_WIDTHS);
  const [colVisible, setColVisible] = React.useState<Record<ColKey, boolean>>(
    { name: true, icon: true, fact: true, age: true },
  );
  const [tableKey, setTableKey] = React.useState(0);
  const [activeFilterAttr, setActiveFilterAttr] = React.useState('Name');
  const [attrSelectOpen, setAttrSelectOpen] = React.useState(false);
  const [iconSelectOpen, setIconSelectOpen] = React.useState(false);

  const { filters, onSetFilters } = useDataViewFilters<CatFactFilters>({
    initialFilters: { name: '', iconName: '' },
  });
  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({ perPage: DEFAULT_PER_PAGE });

  const resetPage = () => onSetPage(undefined, 1);

  const visibleColKeys = COL_KEYS.filter((k) => colVisible[k]);
  const activeSortIndex = sortBy !== undefined ? visibleColKeys.indexOf(sortBy) : undefined;

  const getSortProps = (colId: ColKey): ThProps['sort'] => ({
    sortBy: { index: activeSortIndex, direction },
    onSort: (_event, _colIndex, newDirection) => {
      setSortBy(colId);
      setDirection(newDirection);
    },
    columnIndex: visibleColKeys.indexOf(colId),
  });

  const handleResize = (colId: ColKey) =>
    (_event: unknown, _id: string | number | undefined, width: number) => {
      setColWidths((prev) => ({ ...prev, [colId]: width }));
    };

  const allColDefs: Record<ColKey, DataViewTh> = {
    name: {
      cell: 'Name',
      props: { sort: getSortProps('name') },
      resizableProps: { isResizable: true, width: colWidths.name, minWidth: 100, onResize: handleResize('name') },
    },
    icon: {
      cell: 'Icon',
      resizableProps: { isResizable: true, width: colWidths.icon, minWidth: 60, onResize: handleResize('icon') },
    },
    fact: {
      cell: 'Fact',
      resizableProps: { isResizable: true, width: colWidths.fact, minWidth: 200, onResize: handleResize('fact') },
    },
    age: {
      cell: 'Age',
      props: { sort: getSortProps('age') },
      resizableProps: { isResizable: true, width: colWidths.age, minWidth: 100, onResize: handleResize('age') },
    },
  };

  const columns: DataViewTh[] = visibleColKeys.map((k) => allColDefs[k]);

  const sortedData = React.useMemo(() => {
    if (!catFacts) return [];
    const sorted = [...catFacts];
    if (sortBy === 'name') {
      sorted.sort((a, b) => (a.metadata?.name ?? '').localeCompare(b.metadata?.name ?? ''));
    } else if (sortBy === 'age') {
      sorted.sort(
        (a, b) =>
          new Date(a.metadata?.creationTimestamp ?? 0).getTime() -
          new Date(b.metadata?.creationTimestamp ?? 0).getTime(),
      );
    }
    return direction === 'desc' ? sorted.reverse() : sorted;
  }, [catFacts, sortBy, direction]);

  const filteredData = React.useMemo(
    () =>
      sortedData.filter((cf) => {
        if (filters.name && !(cf.metadata?.name ?? '').toLowerCase().includes(filters.name.toLowerCase()))
          return false;
        if (filters.iconName && cf.spec.iconName !== filters.iconName) return false;
        return true;
      }),
    [sortedData, filters.name, filters.iconName],
  );

  const paginatedData = React.useMemo(
    () => filteredData.slice((page - 1) * perPage, page * perPage),
    [filteredData, page, perPage],
  );

  const rows: DataViewTr[] = paginatedData.map((catFact) => {
    const allCells: Record<ColKey, React.ReactNode> = {
      name: (
        <ResourceLink
          groupVersionKind={CatFactGVK}
          name={catFact.metadata?.name}
          namespace={catFact.metadata?.namespace}
        />
      ),
      icon: <CatIcon iconName={catFact.spec.iconName} />,
      fact: catFact.spec.fact ?? '',
      age: <Timestamp timestamp={catFact.metadata?.creationTimestamp} />,
    };
    return visibleColKeys.map((k) => allCells[k]);
  });

  // Active filter chips
  const activeChips: Array<{ label: string; onRemove: () => void }> = [];
  if (filters.name) {
    activeChips.push({ label: `Name: ${filters.name}`, onRemove: () => { onSetFilters({ name: '' }); resetPage(); } });
  }
  if (filters.iconName) {
    activeChips.push({ label: `Icon: ${filters.iconName}`, onRemove: () => { onSetFilters({ iconName: '' }); resetPage(); } });
  }

  const filterChips = activeChips.length > 0 ? (
    <>
      <LabelGroup>
        {activeChips.map((chip) => (
          <Label key={chip.label} onClose={chip.onRemove}>{chip.label}</Label>
        ))}
      </LabelGroup>
      {activeChips.length > 1 && (
        <Button
          variant="link"
          onClick={() => { onSetFilters({ name: '', iconName: '' }); resetPage(); }}
        >
          Clear all filters
        </Button>
      )}
    </>
  ) : null;

  // Attribute selector + value input
  const filterComponent = (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Select
        isOpen={attrSelectOpen}
        onSelect={(_e, val) => { setActiveFilterAttr(val as string); setAttrSelectOpen(false); }}
        onOpenChange={setAttrSelectOpen}
        toggle={(ref: React.Ref<MenuToggleElement>) => (
          <MenuToggle ref={ref} onClick={() => setAttrSelectOpen(!attrSelectOpen)} isExpanded={attrSelectOpen}>
            {activeFilterAttr}
          </MenuToggle>
        )}
      >
        <SelectList>
          <SelectOption value="Name">Name</SelectOption>
          <SelectOption value="Icon">Icon</SelectOption>
        </SelectList>
      </Select>
      {activeFilterAttr === 'Name' && (
        <SearchInput
          value={filters.name}
          onChange={(_e, val) => { onSetFilters({ name: val }); resetPage(); }}
          onClear={() => { onSetFilters({ name: '' }); resetPage(); }}
          placeholder="Filter by name..."
        />
      )}
      {activeFilterAttr === 'Icon' && (
        <Select
          isOpen={iconSelectOpen}
          onSelect={(_e, val) => { onSetFilters({ iconName: val as string }); setIconSelectOpen(false); resetPage(); }}
          onOpenChange={setIconSelectOpen}
          toggle={(ref: React.Ref<MenuToggleElement>) => (
            <MenuToggle ref={ref} onClick={() => setIconSelectOpen(!iconSelectOpen)} isExpanded={iconSelectOpen}>
              {filters.iconName || 'Select icon...'}
            </MenuToggle>
          )}
        >
          <SelectList>
            {ICON_OPTIONS.map((icon) => (
              <SelectOption key={icon} value={icon}>{icon}</SelectOption>
            ))}
          </SelectList>
        </Select>
      )}
    </div>
  );

  // Manage columns popover
  const manageColsBody = (
    <div>
      {COL_KEYS.map((key) => (
        <div key={key}>
          <Checkbox
            id={`col-vis-${key}`}
            label={COL_LABELS[key]}
            isChecked={colVisible[key]}
            isDisabled={key === 'name'}
            onChange={(_e, checked) => setColVisible((prev) => ({ ...prev, [key]: checked }))}
          />
        </div>
      ))}
    </div>
  );

  const pagination = (
    <Pagination
      itemCount={filteredData.length}
      page={page}
      perPage={perPage}
      onSetPage={onSetPage}
      onPerPageSelect={onPerPageSelect}
    />
  );

  const [createError, setCreateError] = React.useState<string | null>(null);

  const createCatFact = () => {
    setCreateError(null);
    k8sCreate({
      model: CatFactModel,
      data: {
        apiVersion: 'ryanmillerc.github.io/v1alpha1',
        kind: 'CatFact',
        metadata: { generateName: 'cat-fact-', namespace: namespace ?? 'cat-facts-operator' },
        spec: {},
      },
    }).catch((err) => setCreateError(err?.message ?? 'Failed to create CatFact'));
  };

  return (
    <>
      <DocumentTitle>Cat Facts</DocumentTitle>
      <ListPageHeader title="Cat Facts">
        <Button variant="primary" onClick={createCatFact}>Create CatFact</Button>
      </ListPageHeader>
      {createError && (
        <Alert
          variant="danger"
          isInline
          title={createError}
          actionClose={<AlertActionCloseButton onClose={() => setCreateError(null)} />}
        />
      )}
      <ListPageBody>
        {!loaded && <Spinner />}
        {loadError && <Alert variant="danger" isInline title={String(loadError)} />}
        {loaded && !loadError && (
          <DataView>
            <DataViewToolbar
              pagination={pagination}
              filters={filterComponent}
              customLabelGroupContent={filterChips}
              actions={
                <>
                  <Popover headerContent="Manage columns" bodyContent={manageColsBody} position="bottom">
                    <Button variant="plain">Manage columns</Button>
                  </Popover>
                  <Button variant="plain" onClick={() => { setColWidths(DEFAULT_COL_WIDTHS); setTableKey((k) => k + 1); }}>
                    Reset column widths
                  </Button>
                </>
              }
            />
            {filteredData.length === 0 ? (
              <EmptyState>
                <EmptyStateBody>No Cat Facts found.</EmptyStateBody>
              </EmptyState>
            ) : (
              <DataViewTable
                key={tableKey}
                isResizable
                columns={columns}
                rows={rows}
                aria-label="Cat Facts"
              />
            )}
            <DataViewToolbar
              pagination={
                <Pagination
                  itemCount={filteredData.length}
                  page={page}
                  perPage={perPage}
                  onSetPage={onSetPage}
                  onPerPageSelect={onPerPageSelect}
                  variant="bottom"
                />
              }
            />
          </DataView>
        )}
      </ListPageBody>
    </>
  );
}
