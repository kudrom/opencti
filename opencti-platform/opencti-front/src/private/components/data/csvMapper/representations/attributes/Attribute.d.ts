import { CsvMapperEditionContainerFragment_csvMapper$data } from '@components/data/csvMapper/__generated__/CsvMapperEditionContainerFragment_csvMapper.graphql';

export type CsvMapperRepresentationAttribute = CsvMapperEditionContainerFragment_csvMapper$data['representations'][number]['attributes'][number];

export interface CsvMapperRepresentationAttributeFormData {
  key: string
  column_name?: string
  separator?: string
  pattern_date?: string
  default_values?: string
  based_on?: (string | null)[]
}
