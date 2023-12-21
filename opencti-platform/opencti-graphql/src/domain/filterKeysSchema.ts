import { schemaAttributesDefinition } from '../schema/schema-attributes';
import type { AttributeDefinition } from '../schema/attribute-definition';
import { schemaTypesDefinition } from '../schema/schema-types';

type AttributeDefinitionWithTypeUsage = { subEntityTypes: string[] } & AttributeDefinition;

const completeAttributeMapWithSubTypes = (map: Map<string, AttributeDefinitionWithTypeUsage>, subTypes: string[]) => {
  let attributesMapWithTypeUsage = map;
  subTypes.forEach((subType) => {
    const subTypeAttributes = schemaAttributesDefinition.getAttributes(subType);
    subTypeAttributes.forEach((subAttributeDefinition, subAttributeName) => {
      const attributeDefinition = attributesMapWithTypeUsage.get(subAttributeName);
      if (attributeDefinition && !attributeDefinition.subEntityTypes.includes(subType)) { // the attribute is already in the map and the subTypes is not indicated
        attributesMapWithTypeUsage.set(
          subAttributeName,
          { ...attributeDefinition, subEntityTypes: attributeDefinition.subEntityTypes.concat([subType]) },
        );
      } else { // the attribute is in the sub type but not in the parent abstract type
        attributesMapWithTypeUsage.set(subAttributeName, { ...subAttributeDefinition, subEntityTypes: [subType] });
      }
    });
    const subSubTypes = schemaTypesDefinition.hasChildren(subType) ? schemaTypesDefinition.get(subType) : [];
    if (subSubTypes.length > 0) {
      attributesMapWithTypeUsage = completeAttributeMapWithSubTypes(attributesMapWithTypeUsage, subSubTypes);
    }
  });
  return attributesMapWithTypeUsage;
};

export const generateFilterKeysSchema = (): Map<string, Map<string, AttributeDefinitionWithTypeUsage>> => {
  const filterKeysSchema = new Map();
  schemaAttributesDefinition.attributesCache.forEach((attributesMap, type) => {
    let attributesMapWithTypeUsage: Map<string, AttributeDefinitionWithTypeUsage> = new Map();
    const subTypes = schemaTypesDefinition.hasChildren(type) ? schemaTypesDefinition.get(type) : []; // fetch the subtypes
    // 01. attributes in the abstract type = in all the subtypes
    attributesMap.forEach((attributeDefinition, attributeName) => {
      const attributeDefinitionWithSubTypesUsage = { ...attributeDefinition, subEntityTypes: subTypes };
      attributesMapWithTypeUsage.set(attributeName, attributeDefinitionWithSubTypesUsage);
    });
    // 02. attributes in some subtypes
    attributesMapWithTypeUsage = completeAttributeMapWithSubTypes(attributesMapWithTypeUsage, subTypes);
    filterKeysSchema.set(type, attributesMapWithTypeUsage);
  });
  // console.log('test', filterKeysSchema.get('Stix-Domain-Object'));
  return filterKeysSchema;
};
