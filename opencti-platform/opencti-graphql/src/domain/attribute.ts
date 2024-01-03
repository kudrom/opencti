import * as R from 'ramda';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import { elAttributeValues } from '../database/engine';
import { schemaAttributesDefinition } from '../schema/schema-attributes';
import { buildPagination, isNotEmptyField } from '../database/utils';
import type { AuthContext, AuthUser } from '../types/user';
import type { QueryRuntimeAttributesArgs } from '../generated/graphql';
import { defaultScale, getAttributesConfiguration, getEntitySettingFromCache } from '../modules/entitySetting/entitySetting-utils';
import { schemaRelationsRefDefinition } from '../schema/schema-relationsRef';
import type { BasicStoreEntityEntitySetting } from '../modules/entitySetting/entitySetting-types';
import { internalFindByIds } from '../database/middleware-loader';
import { extractRepresentative } from '../database/entity-representative';
import { telemetry } from '../config/tracing';
import { INTERNAL_ATTRIBUTES, INTERNAL_REFS } from './attribute-utils';
import { isStixCoreRelationship } from '../schema/stixCoreRelationship';
import type { AttributeDefinition, RefAttribute } from '../schema/attribute-definition';

interface ScaleAttribute {
  name: string
  scale: string
}

export interface DefaultValue {
  id: string
  name: string
}

interface AttributeConfigMeta {
  name: string
  type: string
  mandatory: boolean
  mandatoryType: string
  multiple: boolean
  editDefault: boolean
  label?: string
  defaultValues?: DefaultValue[]
  scale?: string
}

// -- ATTRIBUTE CONFIGURATION --

const getAttributesConfig = async (
  context: AuthContext,
  user: AuthUser,
  entityType: string,
  entitySetting: BasicStoreEntityEntitySetting | undefined,
  forCsvMapper = false
): Promise<AttributeConfigMeta[]> => {
  if (!entityType) {
    return [];
  }

  const attributeFiltering = forCsvMapper
    // For CsvMapper retrieve all attributes definition which are not internals.
    ? (attr: AttributeDefinition) => (!INTERNAL_ATTRIBUTES.includes(attr.name))
    // Otherwise retrieve attributes definition which are configurable.
    : (attr: AttributeDefinition) => (
      attr.editDefault
      || attr.mandatoryType === 'external'
      || attr.mandatoryType === 'customizable'
    );

  const refFiltering = forCsvMapper
    // For CsvMapper retrieve all refs definition which are not internals.
    ? (ref: RefAttribute) => (!INTERNAL_REFS.includes(ref.name))
    // Otherwise retrieve refs definition which are configurable.
    : (ref: RefAttribute) => (
      ref.mandatoryType === 'external'
      || ref.mandatoryType === 'customizable'
    );

  const attributesDefinition = schemaAttributesDefinition.getAttributes(entityType);
  const refsDefinition = schemaRelationsRefDefinition.getRelationsRef(entityType);

  const attributesConfig: AttributeConfigMeta[] = [
    // Configs for attributes definition
    ...Array.from(attributesDefinition.values())
      .filter(attributeFiltering)
      .map((attr) => ({
        name: attr.name,
        label: attr.label,
        type: attr.type,
        mandatoryType: attr.mandatoryType,
        editDefault: attr.editDefault,
        multiple: attr.multiple,
        mandatory: attr.mandatoryType === 'external',
        scale: attr.scalable ? defaultScale : undefined
      })),
    // Configs for refs definition
    ...Array.from(refsDefinition.values())
      .filter(refFiltering)
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

  if (forCsvMapper && isStixCoreRelationship(entityType)) {
    attributesConfig.push({
      name: 'from',
      label: 'from',
      type: 'ref',
      mandatoryType: 'external',
      multiple: false,
      mandatory: true,
      editDefault: false
    });
    attributesConfig.push({
      name: 'to',
      label: 'to',
      type: 'ref',
      mandatoryType: 'external',
      multiple: false,
      mandatory: true,
      editDefault: false
    });
  }

  // Override with stored attributes configuration in entitySettings
  if (entitySetting) {
    getAttributesConfiguration(entitySetting)?.forEach((userDefinedAttr) => {
      const customizableAttr = attributesConfig.find((a) => a.name === userDefinedAttr.name);
      if (customizableAttr) {
        if (customizableAttr.mandatoryType === 'customizable' && isNotEmptyField(userDefinedAttr.mandatory)) {
          customizableAttr.mandatory = userDefinedAttr.mandatory;
        }
        if (isNotEmptyField(userDefinedAttr.default_values)) {
          customizableAttr.defaultValues = userDefinedAttr.default_values?.map((v) => ({ id: v } as DefaultValue));
        }
        if (customizableAttr.scale && isNotEmptyField(userDefinedAttr.scale)) {
          // override default scale
          customizableAttr.scale = JSON.stringify(userDefinedAttr.scale);
        }
      }
    });
  }

  // Resolve default values ref
  const resolveRef = (attributes: AttributeConfigMeta[]) => {
    return Promise.all(attributes.map((attr) => {
      if (attr.name !== 'objectMarking' && refsDefinition.map((ref) => ref.name).includes(attr.name)) {
        return internalFindByIds(context, user, attr.defaultValues?.map((v) => v.id) ?? [])
          .then((data) => ({
            ...attr,
            defaultValues: data.map((v) => ({
              id: v.internal_id,
              name: extractRepresentative(v).main ?? v.internal_id,
            }))
          }));
      }
      return {
        ...attr,
        defaultValues: attr.defaultValues?.map((v) => ({
          id: v.id,
          name: v.id
        }))
      };
    }));
  };
  return resolveRef(attributesConfig);
};

// Returns a filtered list of AttributeConfigMeta objects built from schema attributes definition and
// stored entity settings attributes configuration (only attributes that can be customized in entity settings)
export const queryAttributesDefinition = async (context: AuthContext, user: AuthUser, entitySetting: BasicStoreEntityEntitySetting): Promise<AttributeConfigMeta[]> => {
  const queryAttributesDefinitionFn = async () => {
    return getAttributesConfig(context, user, entitySetting.target_type, entitySetting);
  };

  return telemetry(context, user, 'ATTRIBUTES', {
    [SemanticAttributes.DB_NAME]: 'attributes_domain',
    [SemanticAttributes.DB_OPERATION]: 'attributes_definition',
  }, queryAttributesDefinitionFn);
};

export const getScaleAttributesForSetting = async (context: AuthContext, user: AuthUser, entitySetting: BasicStoreEntityEntitySetting): Promise<ScaleAttribute[]> => {
  const attributes = await queryAttributesDefinition(context, user, entitySetting);
  return attributes.filter((a) => a.scale).map((a) => ({ name: a.name, scale: a.scale ?? '' }));
};

export const getMandatoryAttributesForSetting = async (context: AuthContext, user: AuthUser, entitySetting: BasicStoreEntityEntitySetting): Promise<string[]> => {
  const attributes = await queryAttributesDefinition(context, user, entitySetting);
  return attributes.filter((a) => a.mandatory).map((a) => a.name);
};

export const getDefaultValuesAttributesForSetting = async (context: AuthContext, user: AuthUser, entitySetting: BasicStoreEntityEntitySetting) => {
  const attributes = await queryAttributesDefinition(context, user, entitySetting);
  return attributes.filter((a) => a.defaultValues).map((a) => ({ ...a, defaultValues: a.defaultValues ?? [] }));
};

// -- ATTRIBUTES --

export const getRuntimeAttributeValues = (context: AuthContext, user: AuthUser, opts: QueryRuntimeAttributesArgs = {} as QueryRuntimeAttributesArgs) => {
  const { attributeName } = opts;
  return elAttributeValues(context, user, attributeName, opts);
};

export const getSchemaAttributeNames = (elementTypes: string[]) => {
  const attributes = R.uniq(elementTypes.map((type) => schemaAttributesDefinition.getAttributeNames(type)).flat());
  const sortByLabel = R.sortBy(R.toLower);
  const finalResult = R.pipe(
    sortByLabel,
    R.map((n) => ({ node: { id: n, key: elementTypes[0], value: n } }))
  )(attributes);
  return buildPagination(0, null, finalResult, finalResult.length);
};

export const getSchemaAttributes = async (context: AuthContext, user: AuthUser, entityType: string) => {
  const entitySetting = await getEntitySettingFromCache(context, entityType);
  return getAttributesConfig(context, user, entityType, entitySetting, true);
};
