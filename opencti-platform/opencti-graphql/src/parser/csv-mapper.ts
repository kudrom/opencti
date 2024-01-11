/* eslint-disable no-param-reassign */
import moment from 'moment';
import type { AttributeDefinition, AttrType } from '../schema/attribute-definition';
import { entityType, relationshipType, standardId } from '../schema/attribute-definition';
import { generateStandardId } from '../schema/identifier';
import { schemaAttributesDefinition } from '../schema/schema-attributes';
import { isEmptyField, isNotEmptyField } from '../database/utils';
import { schemaRelationsRefDefinition } from '../schema/schema-relationsRef';
import { handleInnerType } from '../domain/stixDomainObject';
import { columnNameToIdx } from './csv-helper';
import { isStixRelationshipExceptRef } from '../schema/stixRelationship';
import type { AttributeColumn, BasicStoreEntityCsvMapper, CsvMapperRepresentation, CsvMapperRepresentationAttribute } from '../modules/internal/csvMapper/csvMapper-types';
import { CsvMapperRepresentationType, Operator } from '../modules/internal/csvMapper/csvMapper-types';
import { isValidTargetType } from '../modules/internal/csvMapper/csvMapper-utils';
import { fillDefaultValues, getEntitySettingFromCache } from '../modules/entitySetting/entitySetting-utils';
import type { AuthContext, AuthUser } from '../types/user';
import { UnsupportedError } from '../config/errors';
import { internalFindByIdsMapped } from '../database/middleware-loader';

export type InputType = string | string[] | boolean | number | Record<string, any>;

// -- HANDLE VALUE --

const formatValue = (value: string, type: AttrType, column: AttributeColumn | undefined) => {
  const pattern_date = column?.configuration?.pattern_date;
  const timezone = column?.configuration?.timezone;
  if (type === 'string') {
    return value.trim();
  }
  if (type === 'numeric') {
    const formattedValue = Number(value);
    return Number.isNaN(formattedValue) ? null : formattedValue;
  }
  if (type === 'date') {
    try {
      moment.suppressDeprecationWarnings = true;
      if (isNotEmptyField(pattern_date)) {
        if (isNotEmptyField(timezone)) {
          return moment(value, pattern_date as string, timezone as string).toISOString();
        }
        return moment(value, pattern_date as string).toISOString();
      }
      return moment(value).toISOString();
    } catch (error: any) {
      return null;
    }
  }
  if (type === 'boolean') {
    const stringBoolean = value.toLowerCase().trim();
    // TODO Matching value must be configurable in parser option
    return stringBoolean === 'true' || stringBoolean === 'yes' || stringBoolean === '1';
  }
  return value;
};

const computeValue = (value: string, column: AttributeColumn, attributeDef: AttributeDefinition) => {
  if (isEmptyField(value)) {
    return null;
  }
  // Handle multiple
  if (attributeDef.multiple) {
    if (column.configuration?.separator) {
      return value.split(column.configuration.separator).map((v) => formatValue(v, attributeDef.type, column));
    }
    return [formatValue(value, attributeDef.type, column)];
  }
  // Handle single
  return formatValue(value, attributeDef.type, column);
};

const computeDefaultValue = (
  defaultValue: string[],
  attribute: CsvMapperRepresentationAttribute,
  definition: AttributeDefinition,
) => {
  // Handle multiple
  if (definition.multiple) {
    return defaultValue.map((v) => formatValue(v, definition.type, attribute.column));
  }
  // Handle single
  return formatValue(defaultValue[0], definition.type, attribute.column);
};

const extractValueFromCsv = (record: string[], columnName: string) => {
  const idx = columnNameToIdx(columnName); // Handle letter to idx here & remove headers
  if (isEmptyField(idx)) {
    throw UnsupportedError('Unknown column name', { name: columnName });
  } else {
    return record[idx as number];
  }
};

// -- VALIDATION --

const isValidTarget = (record: string[], representation: CsvMapperRepresentation) => {
  // Target type
  isValidTargetType(representation);

  // Column based
  const columnBased = representation.target.column_based;
  if (columnBased) {
    const recordValue = extractValueFromCsv(record, columnBased.column_reference);
    if (columnBased.operator === Operator.eq) {
      return recordValue === columnBased.value;
    } if (columnBased.operator === Operator.neq) {
      return recordValue !== columnBased.value;
    }
    return false;
  }
  return true;
};

const isValidInput = (input: Record<string, InputType>) => {
  // Verify from and to are filled for relationship
  if (isStixRelationshipExceptRef(input[entityType.name] as string)) {
    if (isEmptyField(input.from) || isEmptyField(input.to)) {
      return false;
    }
  }

  // Verify mandatory attributes are filled
  // TODO: Removed it when it will be handle in schema-validator
  const mandatoryAttributes = Array.from(schemaAttributesDefinition.getAttributes(input[entityType.name] as string).values())
    .filter((attr) => attr.mandatoryType === 'external')
    .map((attr) => attr.name);
  const mandatoryRefs = schemaRelationsRefDefinition.getRelationsRef(input[entityType.name] as string)
    .filter((ref) => ref.mandatoryType === 'external')
    .map((ref) => ref.name);

  return [...mandatoryAttributes, ...mandatoryRefs].every((key) => isNotEmptyField(input[key]));
};

// -- COMPUTE --

const handleType = (representation: CsvMapperRepresentation, input: Record<string, InputType>) => {
  const { entity_type } = representation.target;
  input[entityType.name] = entity_type;
  if (representation.type === CsvMapperRepresentationType.relationship) {
    input[relationshipType.name] = entity_type;
  }
};
const handleId = (representation: CsvMapperRepresentation, input: Record<string, InputType>) => {
  input[standardId.name] = generateStandardId(representation.target.entity_type, input);
};

const handleDirectAttribute = (
  attribute: CsvMapperRepresentationAttribute,
  input: Record<string, InputType>,
  record: string[],
  definition: AttributeDefinition
) => {
  if (attribute.default_values !== null && attribute.default_values !== undefined) {
    const computedDefault = computeDefaultValue(attribute.default_values, attribute, definition);
    if (computedDefault !== null && computedDefault !== undefined) {
      input[attribute.key] = computedDefault;
    }
  }
  if (attribute.column && isNotEmptyField(attribute.column?.column_name)) {
    const recordValue = extractValueFromCsv(record, attribute.column.column_name);
    const computedValue = computeValue(recordValue, attribute.column, definition);
    if (computedValue !== null && computedValue !== undefined) {
      input[attribute.key] = computedValue;
    }
  }
};

const handleBasedOnAttribute = async (
  context: AuthContext,
  user: AuthUser,
  attribute: CsvMapperRepresentationAttribute,
  input: Record<string, InputType>,
  definition: AttributeDefinition,
  otherEntities: Map<string, Record<string, InputType>>
) => {
  if (attribute.default_values && attribute.default_values.length > 0) {
    const entities = await internalFindByIdsMapped(context, user, attribute.default_values);
    if (definition.multiple) {
      input[attribute.key] = attribute.default_values.flatMap((id) => {
        const entity = entities[id];
        if (!entity) return [];
        return {
          standard_id: entity.standard_id
        };
      });
    } else {
      const entity = entities[attribute.default_values[0]];
      if (entity) {
        input[attribute.key] = {
          standard_id: entity.standard_id
        };
      }
    }
  }
  if (attribute.based_on) {
    if (isEmptyField(attribute.based_on)) {
      throw UnsupportedError('Unknown value(s)', { key: attribute.key });
    }
    const entities = (attribute.based_on.representations ?? [])
      .map((id) => otherEntities.get(id))
      .filter((e) => e !== undefined) as Record<string, InputType>[];
    if (entities.length > 0) {
      const entity_type = input[entityType.name] as string;
      // Is relation from or to (stix-core || stix-sighting)
      if (isStixRelationshipExceptRef(entity_type) && (['from', 'to'].includes(attribute.key))) {
        if (attribute.key === 'from') {
          const entity = entities[0];
          if (isNotEmptyField(entity)) {
            input.from = entity;
            input.fromType = entity[entityType.name];
          }
        } else if (attribute.key === 'to') {
          const entity = entities[0];
          if (isNotEmptyField(entity)) {
            input.to = entity;
            input.toType = entity[entityType.name];
          }
        }
        // Is relation ref
      } else {
        const refs = definition.multiple ? entities : entities[0];
        if (isNotEmptyField(refs)) {
          input[attribute.key] = refs;
        }
      }
    }
  }
};

const handleAttributes = async (
  context: AuthContext,
  user: AuthUser,
  record: string[],
  representation: CsvMapperRepresentation,
  input: Record<string, InputType>,
  otherEntities: Map<string, Record<string, InputType>>
) => {
  const { entity_type } = representation.target;
  const attributes = representation.attributes ?? [];
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < attributes.length; i++) {
    const attribute = attributes[i];
    const attributeDef = schemaAttributesDefinition.getAttribute(entity_type, attribute.key);
    const refDef = schemaRelationsRefDefinition.getRelationRef(entity_type, attribute.key);
    if (attributeDef) {
      // Handle column attribute
      handleDirectAttribute(attribute, input, record, attributeDef);
    } else if (refDef) {
      // Handle based_on attribute
      await handleBasedOnAttribute(context, user, attribute, input, refDef, otherEntities);
    } else {
      throw UnsupportedError('Unknown attribute schema for attribute:', { key: attribute.key });
    }
  }
};

const mapRecord = async (
  context: AuthContext,
  user: AuthUser,
  record: string[],
  representation: CsvMapperRepresentation,
  map: Map<string, Record<string, InputType>>
) => {
  if (!isValidTarget(record, representation)) {
    return null;
  }
  const { entity_type } = representation.target;

  let input: Record<string, InputType> = {};
  handleType(representation, input);
  input = handleInnerType(input, entity_type);

  await handleAttributes(context, user, record, representation, input, map);

  const entitySetting = await getEntitySettingFromCache(context, entity_type);
  const filledInput = fillDefaultValues(user, input, entitySetting);

  if (!isValidInput(filledInput)) {
    return null;
  }
  handleId(representation, filledInput);

  return filledInput;
};

export const mappingProcess = async (
  context: AuthContext,
  user: AuthUser,
  mapper: BasicStoreEntityCsvMapper,
  record: string[]
): Promise<Record<string, InputType>[]> => {
  const { representations } = mapper;
  const representationEntities = representations
    .filter((r) => r.type === CsvMapperRepresentationType.entity)
    .sort((r1, r2) => r1.attributes.filter((attr) => attr.based_on).length - r2.attributes.filter((attr) => attr.based_on).length);
  const representationRelationships = representations.filter((r) => r.type === CsvMapperRepresentationType.relationship);
  const results = new Map<string, Record<string, InputType>>();

  // 1. entities sort by no based on at first
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < representationEntities.length; i++) {
    const representation = representationEntities[i];
    const input = await mapRecord(context, user, record, representation, results);
    if (input) {
      results.set(representation.id, input);
    }
  }

  // 2. relationships
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < representationRelationships.length; i++) {
    const representation = representationRelationships[i];
    const input = await mapRecord(context, user, record, representation, results);
    if (input) {
      results.set(representation.id, input);
    }
  }

  return Array.from(results.values());
};
