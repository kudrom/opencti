import { head } from 'ramda';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import { ABSTRACT_STIX_CORE_RELATIONSHIP, ABSTRACT_STIX_CYBER_OBSERVABLE, ABSTRACT_STIX_DOMAIN_OBJECT, INPUT_AUTHORIZED_MEMBERS, INPUT_MARKINGS } from '../../schema/general';
import { STIX_SIGHTING_RELATIONSHIP } from '../../schema/stixSightingRelationship';
import { ENTITY_TYPE_CONTAINER_NOTE, ENTITY_TYPE_CONTAINER_OPINION, isStixDomainObject } from '../../schema/stixDomainObject';
import { UnsupportedError } from '../../config/errors';
import type { AttributeConfiguration, BasicStoreEntityEntitySetting } from './entitySetting-types';
import { ENTITY_TYPE_ENTITY_SETTING } from './entitySetting-types';
import { getEntitiesListFromCache } from '../../database/cache';
import { MEMBER_ACCESS_CREATOR, SYSTEM_USER } from '../../utils/access';
import type { AuthContext, AuthUser } from '../../types/user';
import { isStixCoreRelationship } from '../../schema/stixCoreRelationship';
import { isStixCyberObservable } from '../../schema/stixCyberObservable';
import { ENTITY_TYPE_CONTAINER_CASE } from '../case/case-types';
import { ENTITY_TYPE_CONTAINER_TASK } from '../task/task-types';
import { isNumericAttribute, schemaAttributesDefinition } from '../../schema/schema-attributes';
import { isEmptyField, isNotEmptyField } from '../../database/utils';
import type { AttributeDefinition, MandatoryType, RefAttribute } from '../../schema/attribute-definition';
import { telemetry } from '../../config/tracing';
import { schemaRelationsRefDefinition } from '../../schema/schema-relationsRef';
import { internalFindByIdsMapped } from '../../database/middleware-loader';
import { extractRepresentative } from '../../database/entity-representative';

export type typeAvailableSetting = boolean | string;

export interface EntitySettingSchemaAttribute {
  name: string
  type: string
  mandatory: boolean
  mandatoryType: MandatoryType
  multiple: boolean
  editDefault: boolean
  label?: string
  defaultValues?: { id: string, name:string }[]
  scale?: string
}

export const defaultEntitySetting: Record<string, typeAvailableSetting> = {
  platform_entity_files_ref: false,
  platform_hidden_type: false,
  enforce_reference: false,
  attributes_configuration: JSON.stringify([]),
  workflow_configuration: true,
};

export const defaultScale = JSON.stringify({
  local_config: {
    better_side: 'min',
    min: {
      value: 0,
      color: '#f44336',
      label: '6 - Truth Cannot be judged',
    },
    max: {
      value: 100,
      color: '#6e44ad',
      label: 'Out of Range',
    },
    ticks: [
      { value: 1, color: '#f57423', label: '5 - Improbable' },
      { value: 20, color: '#ff9800', label: '4 - Doubtful' },
      { value: 40, color: '#f8e71c', label: '3 - Possibly True' },
      { value: 60, color: '#92f81c', label: '2 - Probably True' },
      { value: 80, color: '#4caf50', label: '1 - Confirmed by other sources' },
    ],
  }
});

// Available settings works by override.
export const availableSettings: Record<string, Array<string>> = {
  [ABSTRACT_STIX_DOMAIN_OBJECT]: ['attributes_configuration', 'platform_entity_files_ref', 'platform_hidden_type', 'enforce_reference', 'workflow_configuration'],
  [ABSTRACT_STIX_CORE_RELATIONSHIP]: ['attributes_configuration', 'enforce_reference', 'workflow_configuration'],
  [STIX_SIGHTING_RELATIONSHIP]: ['attributes_configuration', 'enforce_reference', 'platform_hidden_type', 'workflow_configuration'],
  [ABSTRACT_STIX_CYBER_OBSERVABLE]: ['platform_hidden_type'],
  // enforce_reference not available on specific entities
  [ENTITY_TYPE_CONTAINER_NOTE]: ['attributes_configuration', 'platform_entity_files_ref', 'platform_hidden_type', 'workflow_configuration'],
  [ENTITY_TYPE_CONTAINER_OPINION]: ['attributes_configuration', 'platform_entity_files_ref', 'platform_hidden_type', 'workflow_configuration'],
  [ENTITY_TYPE_CONTAINER_CASE]: ['attributes_configuration', 'platform_entity_files_ref', 'platform_hidden_type', 'workflow_configuration'],
  [ENTITY_TYPE_CONTAINER_TASK]: ['attributes_configuration', 'platform_entity_files_ref', 'platform_hidden_type', 'workflow_configuration'],
};

export const getAvailableSettings = (targetType: string) => {
  let settings;
  if (isStixDomainObject(targetType)) {
    settings = availableSettings[targetType] ?? availableSettings[ABSTRACT_STIX_DOMAIN_OBJECT];
  } else if (isStixCyberObservable(targetType)) {
    settings = availableSettings[targetType] ?? availableSettings[ABSTRACT_STIX_CYBER_OBSERVABLE];
  } else {
    settings = availableSettings[targetType];
  }

  if (!settings) {
    throw UnsupportedError('This entity type is not support for entity settings', { target_type: targetType });
  }

  return settings;
};

// -- HELPERS --

export const getEntitySettingFromCache = async (context: AuthContext, type: string) => {
  const entitySettings = await getEntitiesListFromCache<BasicStoreEntityEntitySetting>(context, SYSTEM_USER, ENTITY_TYPE_ENTITY_SETTING);
  let entitySetting = entitySettings.find((es) => es.target_type === type);

  if (!entitySetting) {
    // Inheritance
    if (isStixCoreRelationship(type)) {
      entitySetting = entitySettings.find((es) => es.target_type === ABSTRACT_STIX_CORE_RELATIONSHIP);
    } else if (isStixCyberObservable(type)) {
      entitySetting = entitySettings.find((es) => es.target_type === ABSTRACT_STIX_CYBER_OBSERVABLE);
    }
  }

  return entitySetting;
};

export const getAttributesConfiguration = (entitySetting: BasicStoreEntityEntitySetting) => {
  if (entitySetting?.attributes_configuration) {
    return JSON.parse(entitySetting.attributes_configuration as string) as AttributeConfiguration[];
  }
  return null;
};

export const getDefaultValues = (attributeConfiguration: AttributeConfiguration, multiple: boolean): string[] | string | undefined => {
  if (attributeConfiguration.default_values) {
    if (multiple) {
      return attributeConfiguration.default_values;
    }
    return head(attributeConfiguration.default_values);
  }
  return undefined;
};

export const fillDefaultValues = (user: any, input: any, entitySetting: any) => {
  const attributesConfiguration = getAttributesConfiguration(entitySetting);
  if (!attributesConfiguration) {
    return input;
  }
  const filledValues = new Map();
  attributesConfiguration.filter((attr) => attr.default_values)
    .filter((attr) => INPUT_MARKINGS !== attr.name)
    .forEach((attr) => {
      if (input[attr.name] === undefined || input[attr.name] === null) { // empty is a valid value
        const defaultValue = getDefaultValues(attr, schemaAttributesDefinition.isMultipleAttribute(entitySetting.target_type, attr.name));
        const isNumeric = isNumericAttribute(attr.name);
        const parsedValue = isNumeric ? Number(defaultValue) : defaultValue;

        if (attr.name === INPUT_AUTHORIZED_MEMBERS && parsedValue) {
          const defaultAuthorizedMembers = (parsedValue as string[]).map((v) => JSON.parse(v));
          // Replace dynamic creator rule with the id of the user making the query.
          const creatorRule = defaultAuthorizedMembers.find((v) => v.id === MEMBER_ACCESS_CREATOR);
          if (creatorRule) {
            creatorRule.id = user.id;
          }
          filledValues.set(attr.name, defaultAuthorizedMembers);
        } else {
          filledValues.set(attr.name, parsedValue);
        }
      }
    });

  // Marking management
  if (input[INPUT_MARKINGS] === undefined || input[INPUT_MARKINGS] === null) { // empty is a valid value
    const defaultMarkings = user?.default_marking ?? [];
    const globalDefaultMarking = (defaultMarkings.find((entry: any) => entry.entity_type === 'GLOBAL')?.values ?? []).map((m: any) => m.id);
    if (!isEmptyField(globalDefaultMarking)) {
      filledValues.set(INPUT_MARKINGS, globalDefaultMarking);
    }
  }
  return { ...input, ...Object.fromEntries(filledValues) };
};

// Fetch the schemas attributes for an entity setting and extend them with
// what is saved in this entity setting.
export const getEntitySettingSchemaAttributes = async (
  context: AuthContext,
  user: AuthUser,
  entitySetting: BasicStoreEntityEntitySetting
): Promise<EntitySettingSchemaAttribute[]> => {
  return telemetry(context, user, 'ATTRIBUTES', {
    [SemanticAttributes.DB_NAME]: 'attributes_domain',
    [SemanticAttributes.DB_OPERATION]: 'attributes_definition',
  }, async () => {
    if (!entitySetting) {
      return [];
    }
    const { target_type } = entitySetting;
    const attributesDefinition = schemaAttributesDefinition.getAttributes(target_type);
    const refsDefinition = schemaRelationsRefDefinition.getRelationsRef(target_type);
    const refsNames = schemaRelationsRefDefinition.getInputNames(target_type);

    const schemaAttributes: EntitySettingSchemaAttribute[] = [
      // Configs for attributes definition
      ...Array.from(attributesDefinition.values())
        .filter((attr: AttributeDefinition) => (
          attr.editDefault
          || attr.mandatoryType === 'external'
          || attr.mandatoryType === 'customizable'
        ))
        .map((attr) => ({
          name: attr.name,
          label: attr.label,
          type: attr.type,
          mandatoryType: attr.mandatoryType,
          editDefault: attr.editDefault,
          multiple: attr.multiple,
          mandatory: attr.mandatoryType === 'external',
          scale: (attr.type === 'numeric' && attr.scalable) ? defaultScale : undefined
        })),
      // Configs for refs definition
      ...Array.from(refsDefinition.values())
        .filter((ref: RefAttribute) => (
          ref.mandatoryType === 'external'
          || ref.mandatoryType === 'customizable'
        ))
        .map((ref) => ({
          name: ref.name,
          label: ref.label,
          editDefault: ref.editDefault,
          type: 'ref',
          mandatoryType: ref.mandatoryType,
          multiple: ref.multiple,
          mandatory: ref.mandatoryType === 'external',
        })),
    ];

    // Used to resolve later default values ref with ids.
    const attributesDefaultValuesToResolve: Record<number, string[]> = {};

    // Extend schema attributes with entity settings data.
    getAttributesConfiguration(entitySetting)?.forEach((userDefinedAttr) => {
      const schemaIndex = schemaAttributes.findIndex((a) => a.name === userDefinedAttr.name);
      if (schemaIndex > -1) {
        const schemaAttribute = schemaAttributes[schemaIndex];
        if (schemaAttribute) {
          if (schemaAttribute.mandatoryType === 'customizable' && isNotEmptyField(userDefinedAttr.mandatory)) {
            schemaAttribute.mandatory = userDefinedAttr.mandatory;
          }
          if (isNotEmptyField(userDefinedAttr.default_values)) {
            schemaAttribute.defaultValues = userDefinedAttr.default_values?.map((v) => ({ id: v, name: v }));
            // If the default value is a ref with an id, save it to resolve it below.
            if (schemaAttribute.name !== 'objectMarking' && refsNames.includes(schemaAttribute.name)) {
              attributesDefaultValuesToResolve[schemaIndex] = userDefinedAttr.default_values ?? [];
            }
          }
          if (schemaAttribute.scale && isNotEmptyField(userDefinedAttr.scale)) {
            // override default scale
            schemaAttribute.scale = JSON.stringify(userDefinedAttr.scale);
          }
        }
      }
    });

    // Resolve default values ref ids
    const idsToResolve = Object.values(attributesDefaultValuesToResolve).flat();
    const entities = await internalFindByIdsMapped(context, user, idsToResolve);
    Object.keys(attributesDefaultValuesToResolve).forEach((index) => {
      const defaultValues = schemaAttributes[Number(index)]?.defaultValues;
      if (defaultValues) {
        schemaAttributes[Number(index)].defaultValues = defaultValues.map((val) => {
          const entity = entities[val.id];
          return {
            id: val.id,
            name: entity ? (extractRepresentative(entity).main ?? val.id) : val.id
          };
        });
      }
    });

    return schemaAttributes;
  });
};

export const getMandatoryAttributesForSetting = async (context: AuthContext, user: AuthUser, entitySetting: BasicStoreEntityEntitySetting) => {
  const attributes = await getEntitySettingSchemaAttributes(context, user, entitySetting);
  return attributes.filter((a) => a.mandatory).map((a) => a.name);
};
