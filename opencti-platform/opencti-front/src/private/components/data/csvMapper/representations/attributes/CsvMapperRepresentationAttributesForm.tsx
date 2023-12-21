import React, { FunctionComponent } from 'react';
import { graphql, usePreloadedQuery } from 'react-relay';
import { PreloadedQuery } from 'react-relay/relay-hooks/EntryPointTypes';
import CsvMapperRepresentationAttributeForm from '@components/data/csvMapper/representations/attributes/CsvMapperRepresentationAttributeForm';
import { getAttributeLabel } from '@components/data/csvMapper/representations/attributes/AttributeUtils';
import { CsvMapperRepresentationAttributesFormQuery } from '@components/data/csvMapper/representations/attributes/__generated__/CsvMapperRepresentationAttributesFormQuery.graphql';
import { Field } from 'formik';
import CsvMapperRepresentationAttributeRefForm from '@components/data/csvMapper/representations/attributes/CsvMapperRepresentationAttributeRefForm';
import { CsvMapperRepresentationFormData } from '@components/data/csvMapper/representations/Representation';
import { useFormatter } from '../../../../../../components/i18n';

export const schemaAttributesQuery = graphql`
  query CsvMapperRepresentationAttributesFormQuery($entityType: String!) {
    schemaAttributes(entityType: $entityType) {
      name
      mandatory
      multiple
      label
      type
      editDefault
      defaultValues {
        id
      }
    }
  }
`;

interface CsvMapperRepresentationAttributesFormProps {
  queryRef: PreloadedQuery<CsvMapperRepresentationAttributesFormQuery>;
  handleErrors: (key: string, value: string | null) => void;
  representation: CsvMapperRepresentationFormData
  representationName: string
}

const CsvMapperRepresentationAttributesForm: FunctionComponent<
CsvMapperRepresentationAttributesFormProps
> = ({ queryRef, handleErrors, representation, representationName }) => {
  const { t } = useFormatter();

  // some fields are not present in the csv mapper but in the schema
  // we enhance these attributes with the schema data, to use in our form
  const { schemaAttributes } = usePreloadedQuery<CsvMapperRepresentationAttributesFormQuery>(
    schemaAttributesQuery,
    queryRef,
  );

  if (representation.target_type === null) {
    // if the entity type gets unset, we display nothing
    // when user will select a new entity type, attributes will be fetched
    return null;
  }

  return (
    <>
      {[...schemaAttributes]
        .sort((a1, a2) => Number(a2.mandatory) - Number(a1.mandatory))
        .map((schemaAttribute) => {
          if (schemaAttribute.type === 'ref') {
            return (
              <Field
                component={CsvMapperRepresentationAttributeRefForm}
                key={schemaAttribute.name}
                name={`${representationName}.attributes[${schemaAttribute.name}]`}
                schemaAttribute={schemaAttribute}
                label={t(getAttributeLabel(schemaAttribute)).toLowerCase()}
                handleErrors={handleErrors}
                representation={representation}
              />
            );
          }
          return (
            <Field
              component={CsvMapperRepresentationAttributeForm}
              key={schemaAttribute.name}
              name={`${representationName}.attributes[${schemaAttribute.name}]`}
              schemaAttribute={schemaAttribute}
              label={t(getAttributeLabel(schemaAttribute)).toLowerCase()}
              handleErrors={handleErrors}
            />
          );
        })}
    </>
  );
};

export default CsvMapperRepresentationAttributesForm;
