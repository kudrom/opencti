import React, { FunctionComponent } from 'react';
import { useFormikContext } from 'formik';
import { Attribute, AttributeWithMetadata } from '@components/data/csvMapper/representations/attributes/Attribute';
import { CsvMapper } from '@components/data/csvMapper/CsvMapper';
import CsvMapperRepresentationAttributeOption from '@components/data/csvMapper/representations/attributes/CsvMapperRepresentationAttributeOption';
import DialogContentText from '@mui/material/DialogContentText';
import { useFormatter } from '../../../../../../components/i18n';

interface CsvMapperRepresentationAttributeOptionsProps {
  attribute: AttributeWithMetadata;
  indexRepresentation: number;
}

const CsvMapperRepresentationAttributeOptions: FunctionComponent<
CsvMapperRepresentationAttributeOptionsProps
> = ({ attribute, indexRepresentation }) => {
  const { t } = useFormatter();

  const formikContext = useFormikContext<CsvMapper>();
  const selectedAttributes = formikContext.values.representations[indexRepresentation].attributes;
  const indexAttribute = selectedAttributes.findIndex(
    (a) => a.key === attribute.key,
  );

  const onChange = async (name: string, value: string) => {
    const parsedValue = name === 'default_value' && attribute.type === 'numeric' && value
      ? Number(value)
      : value || null;

    if (indexAttribute === -1) {
      // this attribute was not set yet, initialize
      const newSelectedAttribute: Attribute = {
        key: attribute.key,
        column: {
          column_name: null,
          configuration: {
            [name]: parsedValue,
          },
        },
        based_on: null,
      };
      await formikContext.setFieldValue(
        `representations[${indexRepresentation}].attributes`,
        [...selectedAttributes, newSelectedAttribute],
      );
    } else {
      await formikContext.setFieldValue(
        `representations[${indexRepresentation}].attributes[${indexAttribute}].column.configuration.${name}`,
        parsedValue,
      );
    }
  };

  const attributeDefaultValues = attribute.defaultValues?.join(',');

  return (
    <>
      {attribute.type === 'date' && (
        <CsvMapperRepresentationAttributeOption
          attribute={attribute}
          placeholder={t('Date pattern')}
          tooltip={t(
            'By default we accept iso date (YYYY-MM-DD), but you can specify your own date format in ISO notation (for instance DD.MM.YYYY)',
          )}
          onChange={(v) => onChange('pattern_date', v)}
          value={selectedAttributes[indexAttribute]?.column?.configuration?.pattern_date || ''}
        />
      )}
      {attribute.multiple && (
        <CsvMapperRepresentationAttributeOption
          attribute={attribute}
          placeholder={t('List separator')}
          tooltip={t(
            'If this field contains multiple values, you can specify the separator used between each values (for instance | or +)',
          )}
          onChange={(v) => onChange('separator', v)}
          value={selectedAttributes[indexAttribute]?.column?.configuration?.separator || ''}
        />
      )}
      {attribute.editDefault && (
      <>
        <DialogContentText sx={{ width: 500 }}>
          {attributeDefaultValues ? (
            <>
              {t('', {
                id: 'The default value set in Settings > Customization is ...',
                values: { value: attributeDefaultValues },
              })}
            </>
          ) : (
            t('A default value is not set in Settings > Customization. If you want to specify a value, you can fill the field below.')
          )}
        </DialogContentText>
        <CsvMapperRepresentationAttributeOption
          attribute={attribute}
          placeholder={'example'}
          // info={attributeDefaultValues ? undefined : t('csv_no_default_settings')}
          onChange={(v) => onChange('default_value', v)}
          value={selectedAttributes[indexAttribute]?.column?.configuration?.default_value || ''}
        />
      </>
      )}
    </>
  );
};

export default CsvMapperRepresentationAttributeOptions;
