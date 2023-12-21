import React, { FunctionComponent } from 'react';
import { graphql, useMutation } from 'react-relay';
import * as R from 'ramda';
import { FormikConfig } from 'formik/dist/types';
import { CsvMapperEditionContainerFragment_csvMapper$data } from '@components/data/csvMapper/__generated__/CsvMapperEditionContainerFragment_csvMapper.graphql';
import CsvMapperForm from '@components/data/csvMapper/CsvMapperForm';
import { CsvMapperFormData } from '@components/data/csvMapper/CsvMapper';
import { csvMapperToFormData, formDataToCsvMapper } from '@components/data/csvMapper/CsvMapperUtils';
import formikFieldToEditInput from '../../../../utils/FormikUtils';

const csvMapperEditionPatch = graphql`
  mutation CsvMapperEditionPatchMutation($id: ID!, $input: [EditInput!]!) {
    csvMapperFieldPatch(id: $id, input: $input) {
      ...CsvMapperEditionContainerFragment_csvMapper
    }
  }
`;

interface CsvMapperEditionProps {
  csvMapper: CsvMapperEditionContainerFragment_csvMapper$data;
  onClose?: () => void;
}

const CsvMapperEdition: FunctionComponent<CsvMapperEditionProps> = ({
  csvMapper,
  onClose,
}) => {
  const [commitUpdateMutation] = useMutation(csvMapperEditionPatch);
  const initialValues = csvMapperToFormData(csvMapper);

  const onSubmit: FormikConfig<CsvMapperFormData>['onSubmit'] = (
    values,
    { setSubmitting },
  ) => {
    const formattedValues = formDataToCsvMapper(values);
    const input = formikFieldToEditInput(
      {
        ...R.omit(['id', 'errors'], formattedValues),
        representations: JSON.stringify(formattedValues.representations),
      },
      {
        name: csvMapper.name,
        representations: JSON.stringify(csvMapper.representations),
      },
    );
    if (input.length > 0) {
      commitUpdateMutation({
        variables: { id: csvMapper.id, input },
        onCompleted: () => {
          setSubmitting(false);
          if (onClose) {
            onClose();
          }
        },
      });
    } else {
      setSubmitting(false);
      if (onClose) {
        onClose();
      }
    }
  };

  return <CsvMapperForm csvMapper={initialValues} onSubmit={onSubmit} />;
};

export default CsvMapperEdition;
