import { CsvMapperEditionContainerFragment_csvMapper$data } from '@components/data/csvMapper/__generated__/CsvMapperEditionContainerFragment_csvMapper.graphql';
import { CsvMapperFormData } from '@components/data/csvMapper/CsvMapper';
import { csvMapperRepresentationToFormData, formDataToCsvMapperRepresentation } from '@components/data/csvMapper/representations/RepresentationUtils';
import { isNotEmptyField } from '../../../../utils/utils';

/**
 * Transform raw csv mapper data into formik format.
 * @param csvMapper The raw data from backend.
 *
 * @returns Data in formik format.
 */
export const csvMapperToFormData = (
  csvMapper: CsvMapperEditionContainerFragment_csvMapper$data,
): CsvMapperFormData => {
  return {
    id: csvMapper.id,
    name: csvMapper.name,
    has_header: csvMapper.has_header,
    separator: csvMapper.separator,
    skip_line_char: csvMapper.skipLineChar ?? undefined,
    entity_representations: csvMapper.representations.flatMap((rep) => {
      if (rep.type !== 'entity') return [];
      return csvMapperRepresentationToFormData(rep);
    }),
    relationship_representations: csvMapper.representations.flatMap((rep) => {
      if (rep.type !== 'relationship') return [];
      return csvMapperRepresentationToFormData(rep);
    }),
  };
};

/**
 * Transform mapper in formik format to backend format.
 * @param data The formik data.
 *
 * @returns Data in backend format.
 */
export const formDataToCsvMapper = (
  data: CsvMapperFormData,
): Omit<CsvMapperEditionContainerFragment_csvMapper$data, ' $fragmentType' | 'errors'> => {
  return {
    id: data.id,
    name: data.name ?? '',
    has_header: data.has_header,
    separator: data.separator,
    skipLineChar: data.skip_line_char ?? null,
    representations: [
      ...data.entity_representations.map(formDataToCsvMapperRepresentation),
      ...data.relationship_representations.map(formDataToCsvMapperRepresentation),
    ].filter((r) => isNotEmptyField(r.target.entity_type)),
  };
};
