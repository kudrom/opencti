import React from 'react';
import {
  EntitiesStixDomainObjectsLinesPaginationQuery,
  EntitiesStixDomainObjectsLinesPaginationQuery$variables,
} from '@components/data/entities/__generated__/EntitiesStixDomainObjectsLinesPaginationQuery.graphql';
import { EntitiesStixDomainObjectLineDummy } from '@components/data/entities/EntitiesStixDomainObjectLine';
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
import { DataGrid } from '@mui/x-data-grid';
import { loadQuery, useFragment, usePreloadedQuery } from 'react-relay';
import { environment } from '../../../relay/environment';

const LOCAL_STORAGE_KEY = 'entities';

const queryRef = loadQuery(environment, entitiesStixDomainObjectsLinesQuery, { count: 200 });

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
  // const queryRef = useQueryLoading<EntitiesStixDomainObjectsLinesPaginationQuery>(
  //   entitiesStixDomainObjectsLinesQuery,
  //   paginationOptions,
  // );
  const toolBarFilters = injectEntityTypeFilterInFilterGroup(filters, 'Stix-Domain-Object');
  const renderLines = () => {
    const isRuntimeSort = isRuntimeFieldEnable() ?? false;
    const dataColumns = {
      entity_type: {
        name: 'Type',
        width: '12%',
        isSortable: true,
      },
      name: {
        name: 'Name',
        width: '25%',
        isSortable: true,
      },
      createdBy: {
        name: 'Author',
        width: '12%',
        isSortable: isRuntimeSort,
      },
      creator: {
        name: 'Creators',
        width: '12%',
        isSortable: isRuntimeSort,
      },
      objectLabel: {
        name: 'Labels',
        width: '15%',
        isSortable: false,
      },
      created_at: {
        name: 'Creation date',
        width: '15%',
        isSortable: true,
      },
      objectMarking: {
        name: 'Marking',
        isSortable: isRuntimeSort,
        width: '8%',
      },
    };

    const f = usePreloadedQuery(entitiesStixDomainObjectsLinesQuery, queryRef);
    const data = useFragment(entitiesStixDomainObjectsLinesFragment, f);
    // const columns = Object.entries(dataColumns).map(([key, v]) => ({ ...v, key }));
    const columns = [{ field: 'id', headerName: 'ID', flex: 0.9 }, { field: 'entity_type', headerName: 'Entity Type', flex: 1 }];
    const rows = data.stixDomainObjects.edges.map(({ node }) => node);
    console.log(rows);
    return (
      <>
        <div>Coucou</div>
        <DataGrid  columns={columns} rows={rows} autoPageSize/>
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
