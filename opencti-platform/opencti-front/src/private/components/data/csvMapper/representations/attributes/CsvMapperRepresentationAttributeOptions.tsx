import React, { FunctionComponent } from 'react';
import { useFormikContext } from 'formik';
import { AttributeWithMetadata } from '@components/data/csvMapper/representations/attributes/Attribute';
import { CsvMapper } from '@components/data/csvMapper/CsvMapper';
import CsvMapperRepresentationAttributeOption from '@components/data/csvMapper/representations/attributes/CsvMapperRepresentationAttributeOption';
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
    await formikContext.setFieldValue(
      `representations[${indexRepresentation}].attributes[${indexAttribute}].column.configuration`,
      { [name]: attribute.type === 'numeric' && value ? Number(value) : value },
    );
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
        <CsvMapperRepresentationAttributeOption
          attribute={attribute}
          placeholder={attributeDefaultValues ?? ''}
          tooltip={t('csv_defaultvalues_def')}
          info={attributeDefaultValues ? undefined : t('csv_no_default_settings')}
          onChange={(v) => onChange('default_value', v)}
          value={selectedAttributes[indexAttribute]?.column?.configuration?.default_value || ''}
        />
      )}
    </>
  );
};

export default CsvMapperRepresentationAttributeOptions;
