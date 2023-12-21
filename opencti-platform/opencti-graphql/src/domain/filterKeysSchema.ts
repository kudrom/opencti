import { schemaAttributesDefinition } from '../schema/schema-attributes';
import { schemaTypesDefinition } from '../schema/schema-types';
import type { AttributeDefinition, NestedAttribute } from '../schema/attribute-definition';
import { typesAttributeWithNested } from '../schema/attribute-definition';

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

const modifiyAttributeMapForNestedAttribute = (
  attributesMapWithFilterDefinition: Map<string, FilterDefinition>, // map in construction
  nestedAttributeDefinition: NestedAttribute, // nested attribute to study
  types: string[], // entity types to apply
) => {
  const { mappings } = nestedAttributeDefinition;
  mappings.forEach((mappingAttributeDefinition) => {
    if (mappingAttributeDefinition.isFilterable) {
      if (mappingAttributeDefinition.associatedFilterKeys) { // if associatedFilterKeys is set: the keys to add are the ones in associatedFilterKeys
        mappingAttributeDefinition.associatedFilterKeys.forEach((mappingName) => {
          attributesMapWithFilterDefinition.set(
            mappingName,
            buildFilterDefinitionFromAttributeDefinition({ ...mappingAttributeDefinition, name: mappingName }, types),
          );
        });
      } else { // else: the key to add is composed with the attribute name and the mapping attribute name
        const composedMappingName = `${nestedAttributeDefinition.name}.${mappingAttributeDefinition.name}`;
        attributesMapWithFilterDefinition.set(
          composedMappingName,
          buildFilterDefinitionFromAttributeDefinition({ ...mappingAttributeDefinition, name: composedMappingName }, types),
        );
      }
    }
  });
};

const completeAttributeMapWithSubTypes = (
  attributesMapWithFilterDefinition: Map<string, FilterDefinition>, // attributes map to complete
  subTypes: string[], // subTypes whose attribute to study (eventually add them in the map or complete subEntityTypes)
) => {
  subTypes.forEach((subType) => {
    // 01. study the attributes of the subType (if needed, add them or update subEntityTypes)
    const subTypeAttributes = schemaAttributesDefinition.getAttributes(subType);
    subTypeAttributes.forEach((subAttributeDefinition, subAttributeName) => {
      if (subAttributeDefinition.isFilterable) {
        // case A: nested attribute
        if (typesAttributeWithNested.includes(subAttributeDefinition.type)) {
          modifiyAttributeMapForNestedAttribute(attributesMapWithFilterDefinition, subAttributeDefinition as NestedAttribute, [subType]);
        } else { // case B: not nested attribute
          const filterDefinition = attributesMapWithFilterDefinition.get(subAttributeName);
          // case B.1: the attribute is already in the map and the subType is not indicated
          if (filterDefinition && !filterDefinition.subEntityTypes.includes(subType)) {
            attributesMapWithFilterDefinition.set(
              subAttributeName,
              { ...filterDefinition, subEntityTypes: filterDefinition.subEntityTypes.concat([subType]) }, // add the subType in subEntityTypes of the filter definition
            );
          } else { // case B.2: the attribute is in the subType but not in the parent abstract type (= not in the map)
            attributesMapWithFilterDefinition.set( // add it in the map
              subAttributeName,
              buildFilterDefinitionFromAttributeDefinition(subAttributeDefinition, [subType]),
            );
          }
        }
      }
    });
    // 02. do the same for the subTypes of the subType (recursivity)
    const subSubTypes = schemaTypesDefinition.hasChildren(subType) ? schemaTypesDefinition.get(subType) : [];
    if (subSubTypes.length > 0) {
      completeAttributeMapWithSubTypes(attributesMapWithFilterDefinition, subSubTypes);
    }
  });
};

export const generateFilterKeysSchema = (): Map<string, Map<string, FilterDefinition>> => {
  const filterKeysSchema = new Map();
  schemaAttributesDefinition.attributesCache.forEach((attributesMap, type) => {
    const attributesMapWithFilterDefinition: Map<string, FilterDefinition> = new Map(); // map that will contains the filterKeys schema
    const subTypes = schemaTypesDefinition.hasChildren(type) ? schemaTypesDefinition.get(type) : []; // fetch the subtypes
    // 01. for the attributes in the abstract type (= in all the subtypes)
    attributesMap.forEach((attributeDefinition, attributeName) => {
      if (attributeDefinition.isFilterable) { // if it is filterable
        if (typesAttributeWithNested.includes(attributeDefinition.type)) { // case 1.1: nested attribute
          modifiyAttributeMapForNestedAttribute(attributesMapWithFilterDefinition, attributeDefinition as NestedAttribute, [type, ...subTypes]);
        } else { // case 1.2: not nested attribute
          const filterKeyDefinition = buildFilterDefinitionFromAttributeDefinition(attributeDefinition, [type, ...subTypes]);
          attributesMapWithFilterDefinition.set(attributeName, filterKeyDefinition); // should be added in the filterKeys schema
        }
      }
    });
    // 02. for the attributes in the subtypes: add them if they are filterable and not already present
    completeAttributeMapWithSubTypes(attributesMapWithFilterDefinition, subTypes);
    filterKeysSchema.set(type, attributesMapWithFilterDefinition);
  });
  return filterKeysSchema;
};
