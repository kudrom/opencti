import MuiTextField, { BaseTextFieldProps } from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { InformationOutline } from 'mdi-material-ui';
import React from 'react';
import { AttributeWithMetadata } from '@components/data/csvMapper/representations/attributes/Attribute';
import Alert from '@mui/material/Alert';

interface CsvMapperRepresentationAttributeOptionProps {
  attribute: AttributeWithMetadata;
  placeholder: string
  onChange: (val: string) => void
  value: string
  info?: string
  tooltip?: string
}

const CsvMapperRepresentationAttributeOption = ({
  attribute,
  placeholder,
  tooltip,
  onChange,
  value,
  info,
}: CsvMapperRepresentationAttributeOptionProps) => {
  const type: BaseTextFieldProps['type'] = attribute.type === 'numeric' ? 'number' : 'text';

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', width: '50%', gap: '8px', marginTop: '10px' }}>
        <MuiTextField
          style={{ flex: 1 }}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
        {tooltip && (
        <Tooltip title={tooltip}>
          <InformationOutline
            fontSize="small"
            color="primary"
            style={{ cursor: 'default' }}
          />
        </Tooltip>
        )}
      </div>
      {info && <Alert style={{ marginTop: 8 }} severity="info">{info}</Alert>}
    </>
  );
};

export default CsvMapperRepresentationAttributeOption;
