import { CsvMapperRepresentationFormData } from '@components/data/csvMapper/representations/Representation';

export interface CsvMapperFormData {
  id: string
  separator: string
  has_header: boolean
  name?: string
  skip_line_char?: string
  entity_representations: CsvMapperRepresentationFormData[]
  relationship_representations: CsvMapperRepresentationFormData[]
}
