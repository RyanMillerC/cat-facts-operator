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
import { Button, Pagination, Spinner } from '@patternfly/react-core';
import { ThProps } from '@patternfly/react-table';
import {
  DataView,
  DataViewTable,
  DataViewTextFilter,
  DataViewTh,
  DataViewToolbar,
  DataViewTr,
  useDataViewFilters,
  useDataViewPagination,
} from '@patternfly/react-data-view';
import { CatFact, CatFactGVK, CatFactModel } from '../models/CatFact';
import CatIcon from './CatIcon';

type ColWidths = { name: number; icon: number; fact: number; age: number };
type CatFactFilters = { name: string };

const DEFAULT_COL_WIDTHS: ColWidths = { name: 200, icon: 80, fact: 500, age: 150 };
const DEFAULT_PER_PAGE = 20;

// Map from sort column id to its index in the columns array
const SORT_COLUMN_INDEX: Record<string, number> = { name: 0, age: 3 };

type CatFactsPageProps = {
  namespace?: string;
};

export default function CatFactsPage({ namespace }: CatFactsPageProps) {
  const [catFacts, loaded, loadError] = useK8sWatchResource<CatFact[]>({
    groupVersionKind: CatFactGVK,
    isList: true,
    namespace,
  });

  const [sortBy, setSortBy] = React.useState<string | undefined>(undefined);
  const [direction, setDirection] = React.useState<'asc' | 'desc'>('asc');
  const [colWidths, setColWidths] = React.useState<ColWidths>(DEFAULT_COL_WIDTHS);

  const { filters, onSetFilters } = useDataViewFilters<CatFactFilters>({ initialFilters: { name: '' } });
  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({ perPage: DEFAULT_PER_PAGE });

  const activeSortIndex = sortBy !== undefined ? SORT_COLUMN_INDEX[sortBy] : undefined;

  const getSortProps = (colId: string, colIndex: number): ThProps['sort'] => ({
    sortBy: { index: activeSortIndex, direction },
    onSort: (_event, _colIndex, newDirection) => {
      setSortBy(colId);
      setDirection(newDirection);
    },
    columnIndex: colIndex,
  });

  const handleResize = (colId: keyof ColWidths) =>
    (_event: unknown, _id: string | number | undefined, width: number) => {
      setColWidths((prev) => ({ ...prev, [colId]: width }));
    };

  const columns: DataViewTh[] = [
    {
      cell: 'Name',
      props: { sort: getSortProps('name', 0) },
      resizableProps: { isResizable: true, width: colWidths.name, minWidth: 100, onResize: handleResize('name') },
    },
    {
      cell: 'Icon',
      resizableProps: { isResizable: true, width: colWidths.icon, minWidth: 60, onResize: handleResize('icon') },
    },
    {
      cell: 'Fact',
      resizableProps: { isResizable: true, width: colWidths.fact, minWidth: 200, onResize: handleResize('fact') },
    },
    {
      cell: 'Age',
      props: { sort: getSortProps('age', 3) },
      resizableProps: { isResizable: true, width: colWidths.age, minWidth: 100, onResize: handleResize('age') },
    },
  ];

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

  const filteredData = React.useMemo(() => {
    if (!filters.name) return sortedData;
    const lower = filters.name.toLowerCase();
    return sortedData.filter((cf) => (cf.metadata?.name ?? '').toLowerCase().includes(lower));
  }, [sortedData, filters.name]);

  const paginatedData = React.useMemo(
    () => filteredData.slice((page - 1) * perPage, page * perPage),
    [filteredData, page, perPage],
  );

  const rows: DataViewTr[] = paginatedData.map((catFact) => [
    <ResourceLink
      groupVersionKind={CatFactGVK}
      name={catFact.metadata?.name}
      namespace={catFact.metadata?.namespace}
    />,
    <CatIcon iconName={catFact.spec.iconName} />,
    catFact.spec.fact ?? '',
    <Timestamp timestamp={catFact.metadata?.creationTimestamp} />,
  ]);

  const createCatFact = () =>
    k8sCreate({
      model: CatFactModel,
      data: {
        apiVersion: 'taco.moe/v1alpha1',
        kind: 'CatFact',
        metadata: { generateName: 'cat-fact-', namespace: namespace ?? 'cat-facts-operator' },
        spec: {},
      },
    });

  return (
    <>
      <DocumentTitle>Cat Facts</DocumentTitle>
      <ListPageHeader title="Cat Facts">
        <Button variant="primary" onClick={createCatFact}>Create CatFact</Button>
      </ListPageHeader>
      <ListPageBody>
        {!loaded && <Spinner />}
        {loadError && <p>Error loading CatFacts: {String(loadError)}</p>}
        {loaded && !loadError && (
          <DataView>
            <DataViewToolbar
              pagination={
                <Pagination
                  itemCount={filteredData.length}
                  page={page}
                  perPage={perPage}
                  onSetPage={onSetPage}
                  onPerPageSelect={onPerPageSelect}
                />
              }
              filters={
                <DataViewTextFilter
                  filterId="name"
                  title="Name"
                  value={filters.name}
                  onChange={(_event, value) => {
                    onSetFilters({ name: value });
                    onSetPage(undefined, 1);
                  }}
                />
              }
            />
            <DataViewTable
              isResizable
              columns={columns}
              rows={rows}
              aria-label="Cat Facts"
            />
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
