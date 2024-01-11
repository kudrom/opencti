import React, { useContext } from 'react';
import { useFragment } from 'react-relay';
import { entitiesFragment } from '@components/data/entities/EntitiesStixDomainObjectLine';
import { useFormatter } from '../i18n';
import { DataTableContext } from './DataTable';

const DataTableCell = ({ cell, data }) => {
  const { fd } = useFormatter();

  const helpers = {
    fd,
  };

  return (
    <div
      key={`${cell.id}_${data.id}`}
      style={{
        display: 'flex',
        border: '1px solid lightgray',
        width: `calc(var(--col-${cell.id}-size) * 1px)`,
        height: '50px',
        alignItems: 'center',
      }}
    >
      <span style={{ paddingLeft: 6 }}>
        {cell.render?.(data, helpers) ?? (<div>TODO</div>)}
      </span>
    </div>
  );
};

const DataTableLine = ({ row }) => {
  const { columns } = useContext(DataTableContext);
  const data = useFragment(entitiesFragment, row);
  return (
    <div
      key={row.id}
      style={{ display: 'flex' }}
    >
      {columns.map((column) => (
        <DataTableCell key={column.id} cell={column} data={data} />
      ))}
    </div>
  );
};

export default DataTableLine;