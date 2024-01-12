import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { EntitiesStixDomainObjectsLinesPaginationQuery } from '@components/data/entities/__generated__/EntitiesStixDomainObjectsLinesPaginationQuery.graphql';
import { EntitiesStixDomainObjectsLines_data$key } from '@components/data/entities/__generated__/EntitiesStixDomainObjectsLines_data.graphql';
import { entitiesStixDomainObjectsLinesFragment, entitiesStixDomainObjectsLinesQuery } from '@components/data/entities/EntitiesStixDomainObjectsLines';
import usePreloadedPaginationFragment from '../../utils/hooks/usePreloadedPaginationFragment';
import DataTableLine from './DataTableLine';
import IconButton from '@mui/material/IconButton';
import { ArrowDropDown, ArrowDropUp, MoreVert } from '@mui/icons-material';
import Skeleton from '@mui/material/Skeleton';
import Draggable from 'react-draggable';
import DataTableFilters, { DataTableDisplayFilters } from './DataTableFilters';
import SearchInput from '../SearchInput';
import MenuItem from '@mui/material/MenuItem';
import Security from '../../utils/Security';
import { KNOWLEDGE_KNUPDATE_KNDELETE } from '../../utils/hooks/useGranted';
import Menu from '@mui/material/Menu';
import { useFormatter } from '../i18n';
import { getDefaultFilterObject } from '../../utils/filters/filtersUtils';

export const DataTableContext = React.createContext({});

const TableLines = ({ rows, isLoading }) => {
  return (
    <div>
      {rows.map((row) => {
        return (
          <DataTableLine key={row.id} row={row} />
        );
      })}
      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 50 }}>
          <Skeleton variant="circle" width="10%" height={50} />
        </div>
      )}
    </div>
  );
};

const MemoizedTableLines = React.memo(
  TableLines,
  (prev, next) => prev.rows.length === next.rows.length,
);

const TableHeader = ({ column }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { t } = useFormatter();
  const { sortBy, orderAsc, setSorting, columns, setColumns, addFiltering } = useContext(DataTableContext);

  const handleClose = () => setAnchorEl(null);

  return (
    <div
      key={column.id}
      onClick={() => {
      }} // TODO
      style={{
        position: 'relative',
        display: 'flex',
        border: '1px solid rgb(0, 177, 255)',
        background: '#071a2e',
        width: `calc(var(--header-${column?.id}-size) * 1px)`,
        fontWeight: 'bold',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50px',
      }}
    >
      <div style={{ paddingLeft: 6, display: 'flex', alignItems: 'center' }}>
        {column.header}
        {sortBy === column.id && (orderAsc ? <ArrowDropUp /> : <ArrowDropDown />)}
      </div>
      <div style={{ flexGrow: 1 }} />
      <IconButton
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        <MoreVert />
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem onClick={() => setSorting(column.id, true)}>{t('Sort Asc')}</MenuItem>
        <MenuItem onClick={() => setSorting(column.id, false)}>{t('Sort Desc')}</MenuItem>
        <MenuItem
          onClick={() => {
            addFiltering(column.id);
            handleClose();
          }}
        >
          {t('Add filtering')}
        </MenuItem>
      </Menu>
      <Draggable
        // key={new Date()}
        position={{ x: 3, y: 0 }}
        axis="x"
        onStop={(e, { lastX }) => {
          const newColumns = [...columns];
          newColumns.find(({ id }) => id === column.id).size = column.size + lastX;
          setColumns(newColumns);
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            height: '100%',
            width: '5px',
            background: 'rgb(0, 177, 255)',
            cursor: 'col-resize',
            userSelect: 'none',
            touchAction: 'none',
          }}
        />
      </Draggable>
    </div>
  );
}

const TableHeaders = ({ columnSizeVars }) => {
  const { columns } = useContext(DataTableContext);
  return (
    <div
      style={{
        ...columnSizeVars,
        display: 'flex',
        marginRight: 17,
      }}
    >
      {columns.map((column) => (<TableHeader key={column.id} column={column} />))}
    </div>
  );
};

const MemoizedTableHeaders = React.memo(
  TableHeaders,
  (prev, next) => prev.table.getState().columnSizingInfo === next.table.getState().columnSizingInfo
);

const TableBody = ({ setMemoizedHeaders, isResizing, columns, setNumberOfElements }) => {
  const { queryRef, resolvePath } = useContext(DataTableContext);

  // QUERY PART
  const { data: queryData, hasMore, loadMore, isLoading } = usePreloadedPaginationFragment<EntitiesStixDomainObjectsLinesPaginationQuery,
    EntitiesStixDomainObjectsLines_data$key>({
    linesQuery: entitiesStixDomainObjectsLinesQuery,
    linesFragment: entitiesStixDomainObjectsLinesFragment,
    queryRef,
    nodePath: ['stixDomainObjects', 'pageInfo', 'globalCount'],
    setNumberOfElements,
  });

  const fetchMore = (number = 10) => {
    if (!hasMore()) {
      return;
    }
    loadMore(number);
  };

  const resolvedData = useMemo(() => {
    return resolvePath(queryData);
  }, [queryData, resolvePath]);

  // TABLE HANDLING
  const [computeState, setComputeState] = useState<HTMLDivElement>(null);
  const bottomReached = useCallback(() => {
    const { scrollHeight, scrollTop: newScrollTop, clientHeight } = computeState;
    if (scrollHeight - newScrollTop - clientHeight < 300 && !isLoading) {
      fetchMore();
    }
  }, [fetchMore, isLoading]);

  // This is intended to improve performance by memoizing the column sizes
  const columnSizeVars = React.useMemo(() => {
    const colSizes: { [key: string]: number } = {};
    for (let i = 0; i < columns.length; i += 1) {
      const column = columns[i]!;
      let size = column.size ?? 200;
      if (column.flexSize && computeState) {
        size = column.flexSize * (computeState.clientWidth / 100);
        column.size = size;
        delete column.flexSize;
      }
      colSizes[`--header-${column.id}-size`] = size;
      colSizes[`--col-${column.id}-size`] = size;
    }
    return colSizes;
  }, [computeState, columns]);

  useEffect(() => {
    setMemoizedHeaders(<MemoizedTableHeaders columnSizeVars={columnSizeVars} />);
  }, [columnSizeVars]);

  return (
    <div style={{ overflow: 'hidden', height: '85%' }}>
      <TableHeaders columnSizeVars={columnSizeVars} />
      <div
        ref={(node) => setComputeState(node)}
        onScroll={bottomReached}
        style={{
          ...columnSizeVars,
          minWidth: '100%',
          height: '85%',
          overflow: 'auto',
        }}
      >
        {isResizing ? (
          <MemoizedTableLines rows={resolvedData} />
        ) : (
          <TableLines
            rows={resolvedData}
          />
        )}
      </div>
    </div>
  );
};

const DataTable = ({
  queryRef,
  dataColumns,
  resolvePath,
  searchComponent,
  sortBy,
  orderAsc,
  helpers,
  filters,
  availableFilterKeys,
  searchContextFinal,
  availableEntityTypes,
  availableRelationshipTypes,
  availableRelationFilterTypes,
  numberOfElements,
  searchTerm,
}) => {
  const memoizedHeaders = useRef(null);
  const setMemoizedHeaders = useCallback((headers) => memoizedHeaders.current = headers, []);

  const [columns, setColumns] = useState(Object.entries(dataColumns).map(([id, column]) => ({
    ...column,
    id,
  })));

  return (
    <DataTableContext.Provider
      value={{
        queryRef,
        sortBy,
        orderAsc,
        columns,
        setColumns,
        resolvePath,
        setSorting: helpers.handleSort,
        addFiltering: (key) => helpers.handleAddFilterWithEmptyValue(getDefaultFilterObject(key)),
      }}
    >
      <div style={{ display: 'flex' }}>
        <SearchInput
          variant={'small'}
          onSubmit={helpers.handleSearch}
          keyword={searchTerm}
        />
        <DataTableFilters
          availableFilterKeys={availableFilterKeys}
          helpers={helpers}
          searchContextFinal={searchContextFinal}
          availableEntityTypes={availableEntityTypes}
          availableRelationshipTypes={availableRelationshipTypes}
          availableRelationFilterTypes={availableRelationFilterTypes}
          numberOfElements={numberOfElements}
        />
      </div>
      <DataTableDisplayFilters
        helpers={helpers}
        filters={filters}
        availableFilterKeys={availableFilterKeys}
        availableRelationFilterTypes={availableRelationFilterTypes}
      />
      <React.Suspense
        fallback={(
          <>
            {memoizedHeaders.current}
            <Skeleton variant="rectangular" width="10%" height={50} />
          </>
        )}
      >
        <TableBody
          setMemoizedHeaders={setMemoizedHeaders}
          columns={columns}
          setNumberOfElements={helpers.handleSetNumberOfElements}
        />
      </React.Suspense>
    </DataTableContext.Provider>
  );
};

export default DataTable;
