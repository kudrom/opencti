import { schemaAttributesDefinition } from '../schema/schema-attributes';
import { schemaTypesDefinition } from '../schema/schema-types';
import type { AttributeDefinition, NestedAttribute } from '../schema/attribute-definition';
import { typesAttributeWithNested } from '../schema/attribute-definition';
import { schemaRelationsRefDefinition } from '../schema/schema-relationsRef';
import type { RelationRefDefinition } from '../schema/relationRef-definition';

type FilterDefinition = {
  filterKey: string
  type: string
  label: string
  multiple: boolean,
  subEntityTypes: string[]
};

// build the FilterDefinition object that is saved in the filterKeysShema
// by removing some useless attributes of AttributeDefinition
// and adding the subEntityTypes (usage in the subtypes)
const buildFilterDefinitionFromAttributeDefinition = (attributeDefinition: AttributeDefinition, subEntityTypes: string[]) => {
  return {
    filterKey: attributeDefinition.name,
    type: attributeDefinition.type,
    label: attributeDefinition.label,
    multiple: attributeDefinition.multiple,
    subEntityTypes,
  };
};

// build the FilterDefinition object that is saved in the filterKeysShema
// by removing some useless attributes of RelationRefDefinition
// and adding the subEntityTypes (usage in the subtypes)
const buildFilterDefinitionFromRelationRefDefinition = (refDefinition: RelationRefDefinition, subEntityTypes: string[]) => {
  return {
    filterKey: refDefinition.inputName,
    type: 'id', // TODO add the entity type of the id
    label: refDefinition.label,
    multiple: refDefinition.multiple,
    subEntityTypes,
  };
};

const completeFilterDefinitionMapWithNestedAttribute = (
  attributesMapWithFilterDefinition: Map<string, FilterDefinition>, // map in construction
  nestedAttributeDefinition: NestedAttribute, // nested attribute to study
  types: string[], // entity types to apply
) => {
  const { mappings } = nestedAttributeDefinition;
  mappings.forEach((mappingAttributeDefinition) => {
    if (mappingAttributeDefinition.isFilterable) {
      if (typesAttributeWithNested.includes(mappingAttributeDefinition.type)) { // case 1: nested attribute
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
        const composedMappingName = `${nestedAttributeDefinition.name}.${mappingAttributeDefinition.name}`;
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
  elementDefinition: AttributeDefinition | RelationRefDefinition,
  elementDefinitionType: string, // 'attribute' or 'relationRef'
) => {
  const filterDefinition = filterKeyDefinitionMap.get(elementName);
  if (!filterDefinition) { // case 1.2.2: the attribute is in the type but not in the map
    const newFilterDefinition = elementDefinitionType === 'attribute'
      ? buildFilterDefinitionFromAttributeDefinition(elementDefinition as AttributeDefinition, [type])
      : buildFilterDefinitionFromRelationRefDefinition(elementDefinition as RelationRefDefinition, [type]);
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
      if (typesAttributeWithNested.includes(attributeDefinition.type)) { // case 1.1: nested attribute
        completeFilterDefinitionMapWithNestedAttribute(filterKeyDefinitionMap, attributeDefinition as NestedAttribute, [type]);
      } else { // case 1.2: not nested attribute
        completeFilterDefinitionMapWithElement(filterKeyDefinitionMap, type, attributeName, attributeDefinition, 'attribute');
      }
    }
  });
  // 02. add the relation refs
  const relationRefs = schemaRelationsRefDefinition.getRelationsRef(type);
  relationRefs.forEach((ref) => {
    if (ref.isFilterable) {
      completeFilterDefinitionMapWithElement(filterKeyDefinitionMap, type, ref.inputName, ref, 'relationRef');
    }
  });
};

export const generateFilterKeysSchema = (): Map<string, Map<string, FilterDefinition>> => {
  const filterKeysSchema = new Map();
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
  // console.log('filterKeysSchema', filterKeysSchema.get('Stix-Domain-Object'));
  return filterKeysSchema;
};
