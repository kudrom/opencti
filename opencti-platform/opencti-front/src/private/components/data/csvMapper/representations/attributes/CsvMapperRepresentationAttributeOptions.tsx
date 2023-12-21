import React, { FunctionComponent } from 'react';
import CsvMapperRepresentationAttributeOption from '@components/data/csvMapper/representations/attributes/CsvMapperRepresentationAttributeOption';
import DialogContentText from '@mui/material/DialogContentText';
import {
  CsvMapperRepresentationAttributesFormQuery$data,
} from '@components/data/csvMapper/representations/attributes/__generated__/CsvMapperRepresentationAttributesFormQuery.graphql';
import { Field } from 'formik';
import { useFormatter } from '../../../../../../components/i18n';

interface CsvMapperRepresentationAttributeOptionsProps {
  schema: CsvMapperRepresentationAttributesFormQuery$data['schemaAttributes'][number];
  attributeName: string;
}

const CsvMapperRepresentationAttributeOptions: FunctionComponent<
CsvMapperRepresentationAttributeOptionsProps
> = ({ schema, attributeName }) => {
  const { t } = useFormatter();
  const attributeDefaultValues = schema.defaultValues?.join(',');

  return (
    <>
      {schema.type === 'date' && (
        <Field
          component={CsvMapperRepresentationAttributeOption}
          name={`${attributeName}.pattern_date`}
          placeholder={t('Date pattern')}
          tooltip={t(
            'By default we accept iso date (YYYY-MM-DD), but you can specify your own date format in ISO notation (for instance DD.MM.YYYY)',
          )}
        />
      )}
      {schema.multiple && (
        <Field
          component={CsvMapperRepresentationAttributeOption}
          name={`${attributeName}.separator`}
          placeholder={t('List separator')}
          tooltip={t(
            'If this field contains multiple values, you can specify the separator used between each values (for instance | or +)',
          )}
        />
      )}
      {schema.editDefault && (
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
        <Field
          component={CsvMapperRepresentationAttributeOption}
          name={`${attributeName}.default_values`}
          placeholder={'Default value(s)'}
        />
      </>
      )}
    </>
  );
};

export default CsvMapperRepresentationAttributeOptions;
