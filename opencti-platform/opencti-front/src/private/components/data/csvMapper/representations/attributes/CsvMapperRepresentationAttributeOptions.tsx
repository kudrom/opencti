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
import { useComputeDefaultValues } from '../../../../../../utils/hooks/useDefaultValues';

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
  const computeDefaultValues = useComputeDefaultValues();

  const settingsDefaultValues = schemaAttribute.defaultValues?.map((v) => v.name).join(',') ?? t('none');

  // Retrieve the entity type of the current representation for open vocab fields.
  const representationName = attributeName.split('.')[0];
  const entityType: string = getFieldProps(representationName).value.target_type;

  const defaultValue = getFieldProps<CsvMapperRepresentationAttributeFormData['default_values']>(
    `${attributeName}.default_values`,
  );

  useEffect(() => {
    if (defaultValue.value === null) {
      const rawDefaultValue = getFieldProps<CsvMapperRepresentationAttributeFormData['raw_default_values']>(
        `${attributeName}.raw_default_values`,
      );
      setFieldValue(`${attributeName}.default_values`, computeDefaultValues(
        entityType,
        schemaAttribute.name,
        !!schemaAttribute.multiple,
        schemaAttribute.type,
        rawDefaultValue.value ?? [],
      ));
    }
  }, []);

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
        {defaultValue.value !== null && (
          <DefaultValueField
            attribute={schemaAttribute}
            setFieldValue={setFieldValue}
            name={`${attributeName}.default_values`}
            entityType={entityType}
          />
        )}
          {settingsDefaultValues
            ? (
              <>
                <DialogContentText sx={{ width: 450, mt: '8px' }}>
                  {t('', {
                    id: 'Settings default values',
                    values: { value: settingsDefaultValues },
                  })}
                </DialogContentText>
                <DialogContentText>
                  {t('Settings default values usage...')}
                </DialogContentText>
              </>
            )
            : (
              <DialogContentText sx={{ width: 450, mt: '8px' }}>
                {t('No default value set in Settings...')}
              </DialogContentText>
            )
          }
      </>
      )}
    </>
  );
};

export default CsvMapperRepresentationAttributeOptions;
