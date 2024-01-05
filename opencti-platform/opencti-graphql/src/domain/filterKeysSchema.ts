import { schemaAttributesDefinition } from '../schema/schema-attributes';
import { schemaTypesDefinition } from '../schema/schema-types';
import type { AttributeDefinition, ComplexAttribute, IdAttribute, NestedObjectAttribute, RefAttribute, StringAttribute } from '../schema/attribute-definition';
import { schemaRelationsRefDefinition } from '../schema/schema-relationsRef';

type FilterDefinition = {
  filterKey: string
  type: string
  label: string
  multiple: boolean,
  subEntityTypes: string[] // entity types that have the given type as parent and have this filter key in their schema
  format?: string // if type = string or type = object
  entityTypesOfId?: string[] // if format = id
};

// build the FilterDefinition object that is saved in the filterKeysShema
// by removing some useless attributes of AttributeDefinition
// and adding the subEntityTypes (usage in the subtypes)
const buildFilterDefinitionFromAttributeDefinition = (attributeDefinition: AttributeDefinition, subEntityTypes: string[]) => {
  const hasFormat = attributeDefinition.type === 'string' || attributeDefinition.type === 'object';
  const isIdType = hasFormat && attributeDefinition.format === 'id';
  return {
    filterKey: attributeDefinition.name,
    type: attributeDefinition.type as string,
    label: attributeDefinition.label,
    multiple: attributeDefinition.multiple,
    subEntityTypes,
    format: hasFormat ? (attributeDefinition as StringAttribute | ComplexAttribute).format as string : undefined,
    entityTypesOfId: isIdType ? (attributeDefinition as IdAttribute).entityTypes : undefined,
  };
};

// build the FilterDefinition object that is saved in the filterKeysShema
// by removing some useless attributes of RelationRefDefinition
// and adding the subEntityTypes (usage in the subtypes)
const buildFilterDefinitionFromRelationRefDefinition = (refDefinition: RefAttribute, subEntityTypes: string[]) => {
  return {
    filterKey: refDefinition.name,
    type: 'string',
    label: refDefinition.label,
    multiple: refDefinition.multiple,
    subEntityTypes,
    format: 'id',
    entityTypesOfId: refDefinition.toTypes,
  };
};

const completeFilterDefinitionMapWithNestedAttribute = (
  attributesMapWithFilterDefinition: Map<string, FilterDefinition>, // map in construction
  attributeDefinition: NestedObjectAttribute, // nested attribute to study
  types: string[], // entity types to apply
) => {
  const { mappings } = attributeDefinition;
  mappings.forEach((mappingAttributeDefinition) => {
    if (mappingAttributeDefinition.isFilterable) {
      if (mappingAttributeDefinition.type === 'object' && mappingAttributeDefinition.format === 'nested') { // case 1: nested attribute
        throw Error('A nested attribute can\'t contain a nested attribute'); // not supported for the moment
      } else if (mappingAttributeDefinition.associatedFilterKeys) { // case 2: not nested attribute and associatedFilterKeys is set
        // the keys to add are the ones in associatedFilterKeys
        mappingAttributeDefinition.associatedFilterKeys.forEach(({ key, label }) => {
          attributesMapWithFilterDefinition.set(
            key,
            buildFilterDefinitionFromAttributeDefinition({ ...mappingAttributeDefinition, name: key, label }, types),
          );
        });
      } else { // case 3: not nested attribute and the key to add is composed with the attribute name and the mapping attribute name
        const composedMappingName = `${attributeDefinition.name}.${mappingAttributeDefinition.name}`;
        attributesMapWithFilterDefinition.set(
          composedMappingName,
          buildFilterDefinitionFromAttributeDefinition({ ...mappingAttributeDefinition, name: composedMappingName }, types),
        );
      }
    }
  });
};

const completeFilterDefinitionMapWithElement = (
  filterKeyDefinitionMap: Map<string, FilterDefinition>,
  type: string,
  elementName: string,
  elementDefinition: AttributeDefinition,
  elementDefinitionType: string, // 'attribute' or 'relationRef'
) => {
  const filterDefinition = filterKeyDefinitionMap.get(elementName);
  if (!filterDefinition) { // case 1.2.2: the attribute is in the type but not in the map
    const newFilterDefinition = elementDefinitionType === 'attribute'
      ? buildFilterDefinitionFromAttributeDefinition(elementDefinition as AttributeDefinition, [type])
      : buildFilterDefinitionFromRelationRefDefinition(elementDefinition as RefAttribute, [type]);
    filterKeyDefinitionMap.set( // add it in the map
      elementName,
      newFilterDefinition,
    );
  } else if (filterDefinition && !filterDefinition.subEntityTypes.includes(type)) { // 1.2.1 the filter definition is in the map but the type is not in the subEntityTypes
    filterKeyDefinitionMap.set(
      elementName,
      { ...filterDefinition, subEntityTypes: filterDefinition.subEntityTypes.concat([type]) }, // add type in subEntityTypes of the filter definition
    );
  }
};

const completeFilterDefinitionMapForType = (
  filterKeyDefinitionMap: Map<string, FilterDefinition>, // filter definition map to complete
  type: string, // type whose attributes and relations refs to study (eventually add them in the map or complete subEntityTypes)
) => {
  // 01. add the attributes
  const attributesMap = schemaAttributesDefinition.getAttributes(type);
  attributesMap.forEach((attributeDefinition, attributeName) => {
    if (attributeDefinition.isFilterable) { // if it is filterable
      if (attributeDefinition.type === 'object' && attributeDefinition.format === 'nested') { // case 1.1: nested attribute
        completeFilterDefinitionMapWithNestedAttribute(filterKeyDefinitionMap, attributeDefinition, [type]);
      } else { // case 1.2: not nested attribute
        completeFilterDefinitionMapWithElement(filterKeyDefinitionMap, type, attributeName, attributeDefinition, 'attribute');
      }
    }
  });
  // 02. add the relation refs
  const relationRefs = schemaRelationsRefDefinition.getRelationsRef(type);
  relationRefs.forEach((ref) => {
    if (ref.isFilterable) {
      completeFilterDefinitionMapWithElement(filterKeyDefinitionMap, type, ref.name, ref, 'relationRef');
    }
  });
};

export const generateFilterKeysSchema = () => {
  const filterKeysSchema: Map<string, Map<string, FilterDefinition>> = new Map();
  schemaAttributesDefinition.getRegisteredTypes().forEach((type) => {
    const filterDefinitionsMap: Map<string, FilterDefinition> = new Map(); // map that will contains the filterKeys schema for the entity type
    // 01. add attributes and relations refs of type
    completeFilterDefinitionMapForType(filterDefinitionsMap, type);
    // 02. handle the attributes and relations refs of the subtypes
    const subTypes = schemaTypesDefinition.hasChildren(type) ? schemaTypesDefinition.get(type) : []; // fetch the subtypes
    if (subTypes.length > 0) {
      subTypes.forEach((subType) => completeFilterDefinitionMapForType(filterDefinitionsMap, subType));
    }
    // set the filter definition in the filter schema
    filterKeysSchema.set(type, filterDefinitionsMap);
  });
  // transform the maps in { key, values }[]
  const flattenFilterKeysSchema: { entity_type: string, filters_schema: { filterDefinition: FilterDefinition, filterKey: string }[] }[] = [];
  filterKeysSchema.forEach((filtersMap, entity_type) => {
    const filters_schema: { filterDefinition: FilterDefinition, filterKey: string }[] = [];
    filtersMap.forEach((filterDefinition, filterKey) => {
      filters_schema.push({ filterDefinition, filterKey });
    });
    flattenFilterKeysSchema.push({
      filters_schema,
      entity_type
    });
  });
  return flattenFilterKeysSchema;
};
