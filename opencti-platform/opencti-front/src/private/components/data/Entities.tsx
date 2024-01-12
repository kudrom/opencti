import React, { useMemo, useState } from 'react';
import {
  EntitiesStixDomainObjectsLinesPaginationQuery,
  EntitiesStixDomainObjectsLinesPaginationQuery$variables,
} from '@components/data/entities/__generated__/EntitiesStixDomainObjectsLinesPaginationQuery.graphql';
import { entitiesFragment, EntitiesStixDomainObjectLineDummy } from '@components/data/entities/EntitiesStixDomainObjectLine';
import { EntitiesStixDomainObjectLine_node$data } from '@components/data/entities/__generated__/EntitiesStixDomainObjectLine_node.graphql';
import ListLines from '../../../components/list_lines/ListLines';
import ToolBar from './ToolBar';
import EntitiesStixDomainObjectsLines, { entitiesStixDomainObjectsLinesFragment, entitiesStixDomainObjectsLinesQuery } from './entities/EntitiesStixDomainObjectsLines';
import useAuth from '../../../utils/hooks/useAuth';
import ExportContextProvider from '../../../utils/ExportContextProvider';
import { usePaginationLocalStorage } from '../../../utils/hooks/useLocalStorage';
import useEntityToggle from '../../../utils/hooks/useEntityToggle';
import useQueryLoading from '../../../utils/hooks/useQueryLoading';
import { emptyFilterGroup, injectEntityTypeFilterInFilterGroup } from '../../../utils/filters/filtersUtils';
import { loadQuery, useFragment, useMutation, usePreloadedQuery } from 'react-relay';
import { environment } from '../../../relay/environment';
import {
  ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel, IdentifiedColumnDef,
  useReactTable,
} from '@tanstack/react-table';
import DataTable from '../../../components/dataGrid/DataTable';
import DataTableFilters from '../../../components/dataGrid/DataTableFilters';
import SearchInput from '../../../components/SearchInput';
import { AccessorColumnDef, AccessorKeyColumnDef, AccessorKeyColumnDefBase } from '@tanstack/table-core/src/types';
import Button from '@mui/material/Button';
import ItemMarkings from '../../../components/ItemMarkings';
import StixCoreObjectLabels from '@components/common/stix_core_objects/StixCoreObjectLabels';
import { graphql } from 'react-relay';
import { TextField } from '@mui/material';

const LOCAL_STORAGE_KEY = 'entities';

const fieldPatch = graphql`
  mutation EntitiesEditMutation($id: ID!, $input: [EditInput]!)  {
    stixDomainObjectEdit(id: $id) {
      fieldPatch(input: $input) {
        ...EntitiesStixDomainObjectLine_node
      }
    }
  }
`;

const Entities = () => {
  const {
    platformModuleHelpers: { isRuntimeFieldEnable },
  } = useAuth();
  const {
    viewStorage,
    paginationOptions,
    helpers: storageHelpers,
  } = usePaginationLocalStorage<EntitiesStixDomainObjectsLinesPaginationQuery$variables>(
    LOCAL_STORAGE_KEY,
    {
      filters: emptyFilterGroup,
      sortBy: 'created_at',
      orderAsc: false,
      openExports: false,
    },
  );
  const {
    numberOfElements,
    filters,
    searchTerm,
    sortBy,
    orderAsc,
    openExports,
  } = viewStorage;
  const {
    selectedElements,
    deSelectedElements,
    selectAll,
    handleClearSelectedElements,
    handleToggleSelectAll,
    onToggleEntity,
    numberOfSelectedElements,
  } = useEntityToggle<EntitiesStixDomainObjectLine_node$data>(LOCAL_STORAGE_KEY);

  const toolBarFilters = injectEntityTypeFilterInFilterGroup(filters, 'Stix-Domain-Object');

  const [commit] = useMutation(fieldPatch);

  const renderLines = () => {
    const isRuntimeSort = isRuntimeFieldEnable() ?? false;

    const dataColumns = {
      entity_type: {
        header: 'Type',
        flexSize: '12',
        enableSorting: false,
        render: (data) => (
          <Button variant="contained" size="small" onClick={() => storageHelpers.handleAddFilter('entity_type', data.entity_type)}>
            {data.entity_type}
          </Button>
        ),
      },
      name: {
        header: 'Name',
        flexSize: '25',
        enableSorting: true,
        render: (data) => (
          <TextField
            fullWidth
            defaultValue={data.name}
            onBlur={(e) => {
              if (e.currentTarget.value !== data.name){
                commit({ variables: { id: data.id, input: [{ key: 'name', value: [e.currentTarget.value] }] } });
              }
            }}
          />
        ),
      },
      createdBy: {
        header: 'Author',
        flexSize: '12',
        enableSorting: isRuntimeSort,
      },
      creator: {
        header: 'Creators',
        flexSize: '12',
        enableSorting: isRuntimeSort,
      },
      objectLabel: {
        header: 'Labels',
        flexSize: '15',
        enableSorting: false,
        render: ({ objectLabel }) => (
          <StixCoreObjectLabels
            variant="inList"
            labels={objectLabel}
            onClick={storageHelpers.handleAddFilter}
          />
        ),
      },
      created_at: {
        header: 'Creation date',
        flexSize: '15',
        enableSorting: false,
        render: ({ created_at }, { fd }) => fd(created_at),
      },
      objectMarking: {
        header: 'Marking',
        flexSize: '8',
        enableSorting: isRuntimeSort,
        render: ({ objectMarking }) => (
          <ItemMarkings
            variant="inList"
            markingDefinitionsEdges={objectMarking.edges ?? []}
            limit={1}
            handleAddFilter={storageHelpers.handleAddFilter}
          />
        ),
      },
    };

    const queryRef = useQueryLoading<EntitiesStixDomainObjectsLinesPaginationQuery>(
      entitiesStixDomainObjectsLinesQuery,
      { ...paginationOptions, count: 1000 },
    );

    return (
      <>
        {queryRef && (
          <DataTable
            queryRef={queryRef}
            resolvePath={(data) => data.stixDomainObjects.edges.map(({ node }) => node)}
            dataColumns={dataColumns}
            sortBy={sortBy}
            orderAsc={orderAsc}
            helpers={storageHelpers}
            filters={filters}
            availableFilterKeys={[
              'entity_type',
              'objectLabel',
              'objectMarking',
              'createdBy',
              'source_reliability',
              'confidence',
              'creator_id',
              'created',
              'created_at',
            ]}
            availableEntityTypes={['Stix-Domain-Object']}
            numberOfElements={numberOfElements}
            searchTerm={searchTerm}
          />
        )}
      </>
      // <>
      //   <ListLines
      //     helpers={storageHelpers}
      //     sortBy={sortBy}
      //     orderAsc={orderAsc}
      //     dataColumns={dataColumns}
      //     handleSort={storageHelpers.handleSort}
      //     handleSearch={storageHelpers.handleSearch}
      //     handleAddFilter={storageHelpers.handleAddFilter}
      //     handleRemoveFilter={storageHelpers.handleRemoveFilter}
      //     handleSwitchGlobalMode={storageHelpers.handleSwitchGlobalMode}
      //     handleSwitchLocalMode={storageHelpers.handleSwitchLocalMode}
      //     handleToggleExports={storageHelpers.handleToggleExports}
      //     openExports={openExports}
      //     handleToggleSelectAll={handleToggleSelectAll}
      //     availableEntityTypes={['Stix-Domain-Object']}
      //     exportEntityType="Stix-Domain-Object"
      //     selectAll={selectAll}
      //     disableCards={true}
      //     keyword={searchTerm}
      //     filters={filters}
      //     noPadding={true}
      //     paginationOptions={paginationOptions}
      //     numberOfElements={numberOfElements}
      //     iconExtension={true}
      //     availableFilterKeys={[
      //       'entity_type',
      //       'objectLabel',
      //       'objectMarking',
      //       'createdBy',
      //       'source_reliability',
      //       'confidence',
      //       'creator_id',
      //       'created',
      //       'created_at',
      //     ]}
      //   >
      //     {queryRef && (
      //       <React.Suspense
      //         fallback={
      //           <>
      //             {Array(20)
      //               .fill(0)
      //               .map((_, idx) => (
      //                 <EntitiesStixDomainObjectLineDummy
      //                   key={idx}
      //                   dataColumns={dataColumns}
      //                 />
      //               ))}
      //           </>
      //         }
      //       >
      //         <EntitiesStixDomainObjectsLines
      //           queryRef={queryRef}
      //           paginationOptions={paginationOptions}
      //           dataColumns={dataColumns}
      //           onLabelClick={storageHelpers.handleAddFilter}
      //           selectedElements={selectedElements}
      //           deSelectedElements={deSelectedElements}
      //           onToggleEntity={onToggleEntity}
      //           selectAll={selectAll}
      //           setNumberOfElements={storageHelpers.handleSetNumberOfElements}
      //         />
      //         <ToolBar
      //           selectedElements={selectedElements}
      //           deSelectedElements={deSelectedElements}
      //           numberOfSelectedElements={numberOfSelectedElements}
      //           selectAll={selectAll}
      //           search={searchTerm}
      //           filters={toolBarFilters}
      //           handleClearSelectedElements={handleClearSelectedElements}
      //         />
      //       </React.Suspense>
      //     )}
      //   </ListLines>
      // </>
    );
  };
  return <ExportContextProvider>{renderLines()}</ExportContextProvider>;
};

export default Entities;
