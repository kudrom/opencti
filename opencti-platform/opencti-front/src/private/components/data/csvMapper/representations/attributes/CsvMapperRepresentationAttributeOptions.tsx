import React, { FunctionComponent, useEffect } from 'react';
import CsvMapperRepresentationAttributeOption from '@components/data/csvMapper/representations/attributes/CsvMapperRepresentationAttributeOption';
import DialogContentText from '@mui/material/DialogContentText';
import {
  CsvMapperRepresentationAttributesFormQuery$data,
} from '@components/data/csvMapper/representations/attributes/__generated__/CsvMapperRepresentationAttributesFormQuery.graphql';
import { Field, FormikProps } from 'formik';
import DefaultValueField from '@components/common/form/DefaultValueField';
import { CsvMapperFormData } from '@components/data/csvMapper/CsvMapper';
import { CsvMapperRepresentationAttributeFormData } from '@components/data/csvMapper/representations/attributes/Attribute';
import { useFormatter } from '../../../../../../components/i18n';
import { defaultValuesStringArrayToForm } from '../../../../../../utils/defaultValues';

interface CsvMapperRepresentationAttributeOptionsProps {
  schemaAttribute: CsvMapperRepresentationAttributesFormQuery$data['schemaAttributes'][number];
  attributeName: string;
  form: FormikProps<CsvMapperFormData>
}

const CsvMapperRepresentationAttributeOptions: FunctionComponent<
CsvMapperRepresentationAttributeOptionsProps
> = ({ schemaAttribute, attributeName, form }) => {
  const { t } = useFormatter();
  const { setFieldValue, getFieldProps } = form;

  const settingsDefaultValues = schemaAttribute.defaultValues?.join(',');

  useEffect(() => {
    const rawDefaultValue = getFieldProps<CsvMapperRepresentationAttributeFormData['raw_default_values']>(
      `${attributeName}.raw_default_values`,
    );
    const defaultValue = getFieldProps<CsvMapperRepresentationAttributeFormData['default_values']>(
      `${attributeName}.default_values`,
    );
    if (rawDefaultValue.value && defaultValue.value === undefined) {
      console.log('mapper default', defaultValuesStringArrayToForm(
        rawDefaultValue.value,
        schemaAttribute.type,
        !!schemaAttribute.multiple,
        schemaAttribute.name,
      ));
      setFieldValue(`${attributeName}.default_values`, defaultValuesStringArrayToForm(
        rawDefaultValue.value,
        schemaAttribute.type,
        !!schemaAttribute.multiple,
        schemaAttribute.name,
      ));
    }
  }, [form]);

  return (
    <>
      {schemaAttribute.type === 'date' && (
        <Field
          component={CsvMapperRepresentationAttributeOption}
          name={`${attributeName}.pattern_date`}
          placeholder={t('Date pattern')}
          tooltip={t(
            'By default we accept iso date (YYYY-MM-DD), but you can specify your own date format in ISO notation (for instance DD.MM.YYYY)',
          )}
        />
      )}
      {schemaAttribute.multiple && (
        <Field
          component={CsvMapperRepresentationAttributeOption}
          name={`${attributeName}.separator`}
          placeholder={t('List separator')}
          tooltip={t(
            'If this field contains multiple values, you can specify the separator used between each values (for instance | or +)',
          )}
        />
      )}
      {schemaAttribute.editDefault && (
      <>
        <DialogContentText sx={{ width: 500 }}>
          {settingsDefaultValues ? (
            <>
              {t('', {
                id: 'The default value set in Settings > Customization is ...',
                values: { value: settingsDefaultValues },
              })}
            </>
          ) : (
            t('A default value is not set in Settings > Customization. If you want to specify a value, you can fill the field below.')
          )}
        </DialogContentText>
        <DefaultValueField
          attribute={schemaAttribute}
          setFieldValue={setFieldValue}
          name={`${attributeName}.default_values`}
        />
      </>
      )}
    </>
  );
};

export default CsvMapperRepresentationAttributeOptions;
