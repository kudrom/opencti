import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { EntitiesStixDomainObjectsLinesPaginationQuery } from '@components/data/entities/__generated__/EntitiesStixDomainObjectsLinesPaginationQuery.graphql';
import { EntitiesStixDomainObjectsLines_data$key } from '@components/data/entities/__generated__/EntitiesStixDomainObjectsLines_data.graphql';
import { entitiesStixDomainObjectsLinesFragment, entitiesStixDomainObjectsLinesQuery } from '@components/data/entities/EntitiesStixDomainObjectsLines';
import usePreloadedPaginationFragment from '../../utils/hooks/usePreloadedPaginationFragment';
import DataTableLine from './DataTableLine';
import IconButton from '@mui/material/IconButton';
import { MoreVert } from '@mui/icons-material';
import Skeleton from '@mui/material/Skeleton';
import Draggable from 'react-draggable';

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
          <Skeleton variant="rectangular" width="100%" height={50} />
        </div>
      )}
    </div>
  );
};

const MemoizedTableLines = React.memo(
  TableLines,
  (prev, next) => prev.rows.length === next.rows.length,
);

const TableHeaders = ({ columnSizeVars }) => {
  const { sortBy, orderAsc, setSorting, columns, setColumns } = useContext(DataTableContext);
  return (
    <div
      style={{
        ...columnSizeVars,
        display: 'flex',
        marginRight: 17,
      }}
    >
      {columns.map((column) => (
        <div
          key={column.id}
          onClick={() => {
          }} // TODO
          style={{
            position: 'relative',
            display: 'flex',
            border: '1px solid red',
            width: `calc(var(--header-${column?.id}-size) * 1px)`,
            fontWeight: 'bold',
            justifyContent: 'center',
            alignItems: 'center',
            height: '50px',
          }}
        >
          <div style={{ paddingLeft: 6 }}>
            {column.header}
            {sortBy === column.id && (orderAsc ? ' 🔼' : ' 🔽')}
          </div>
          <div style={{ flexGrow: 1 }} />
          <IconButton
            onClick={() => {
              if (column.enableSorting) {
                setSorting(column.id);
              }
            }}
          >
            <MoreVert />
          </IconButton>
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
              {...{
                // onMouseDown: (e) => column.getResizeHandler(column.id, e),
                style: {
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  height: '100%',
                  width: '5px',
                  background: 'blue',
                  cursor: 'col-resize',
                  userSelect: 'none',
                  touchAction: 'none',
                  // transform:
                  //   column.getIsResizing()
                  //     ? `translateX(${(column.deltaOffset ?? 0)}px)`
                  //     : '',
                },
              }}
            />
          </Draggable>
        </div>
      ))}
    </div>
  );
};

const MemoizedTableHeaders = React.memo(
  TableHeaders,
  (prev, next) => prev.table.getState().columnSizingInfo === next.table.getState().columnSizingInfo
);

const TableBody = ({ setMemoizedHeaders, isResizing, columns }) => {
  const { queryRef, resolvePath } = useContext(DataTableContext);
  const [numberOfElement, setNumberOfElement] = useState(0);

  // QUERY PART
  const { data: queryData, hasMore, loadMore, isLoading } = usePreloadedPaginationFragment<EntitiesStixDomainObjectsLinesPaginationQuery,
    EntitiesStixDomainObjectsLines_data$key>({
    linesQuery: entitiesStixDomainObjectsLinesQuery,
    linesFragment: entitiesStixDomainObjectsLinesFragment,
    queryRef,
    nodePath: ['stixDomainObjects', 'pageInfo', 'globalCount'],
    setNumberOfElements: setNumberOfElement,
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
          height: '90%',
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
  filterComponent,
  sortBy,
  orderAsc,
  handleSort,
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
        setSorting: handleSort,
      }}
    >
      {searchComponent}
      {filterComponent}
      <React.Suspense
        fallback={(
          <>
            {memoizedHeaders.current}
            <Skeleton variant="rectangular" width="100%" height={50} />
          </>
        )}
      >
        <TableBody
          setMemoizedHeaders={setMemoizedHeaders}
          columns={columns}
        />
      </React.Suspense>
    </DataTableContext.Provider>
  );
};

export default DataTable;
