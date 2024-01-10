import type { AuthContext, AuthUser } from '../../../types/user';
import type { BasicStoreEntityCsvMapper, CsvMapperRepresentation } from './csvMapper-types';
import { getSchemaAttributes } from '../../../domain/attribute';
import { isEmptyField, isNotEmptyField } from '../../../database/utils';
import { isStixRelationshipExceptRef } from '../../../schema/stixRelationship';
import { isStixObject } from '../../../schema/stixCoreObject';
import { CsvMapperRepresentationType } from './csvMapper-types';
import { fillDefaultValues, getEntitySettingFromCache } from '../../entitySetting/entitySetting-utils';
import { FunctionalError } from '../../../config/errors';
import { schemaRelationsRefDefinition } from '../../../schema/schema-relationsRef';
import { INTERNAL_REFS } from '../../../domain/attribute-utils';
import { internalFindByIds } from '../../../database/middleware-loader';
import type { BasicStoreEntity } from '../../../types/store';

const representationLabel = (idx: number, representation: CsvMapperRepresentation) => {
  const number = `#${idx + 1}`;
  if (isEmptyField(representation.target.entity_type)) {
    return `${number} New ${representation.type} representation`;
  }
  return `${number} ${representation.target.entity_type}`;
};

export const parseCsvMapper = (entity: any): BasicStoreEntityCsvMapper => {
  return {
    ...entity,
    representations: typeof entity.representations === 'string' ? JSON.parse(entity.representations) : entity.representations,
  };
};

export const representationsDefaultValues = async (context: AuthContext, user: AuthUser, csvMapper: BasicStoreEntityCsvMapper) => {
  return Promise.all(csvMapper.representations.map(async (r) => {
    const refsDefinition = schemaRelationsRefDefinition
      .getRelationsRef(r.target.entity_type)
      .filter((ref) => !INTERNAL_REFS.includes(ref.inputName));

    return {
      ...r,
      attributes: await Promise.all(r.attributes.map(async (attr) => {
        if (!attr.default_values) {
          return attr;
        }
        let defaultValues = attr.default_values?.map((val) => {
          return {
            id: val,
            name: val
          };
        });
        if (attr.key !== 'objectMarking' && refsDefinition.map((ref) => ref.inputName).includes(attr.key)) {
          const entities = await internalFindByIds(context, user, attr.default_values);
          defaultValues = entities.map((entity) => ({
            id: entity.internal_id,
            name: (entity as BasicStoreEntity).name
          }));
        }
        return {
          ...attr,
          default_values: defaultValues
        };
      }))
    };
  }));
};

export const isValidTargetType = (representation: CsvMapperRepresentation) => {
  if (representation.type === CsvMapperRepresentationType.relationship) {
    if (!isStixRelationshipExceptRef(representation.target.entity_type)) {
      throw FunctionalError('Unknown relationship', { type: representation.target.entity_type });
    }
  } else if (representation.type === CsvMapperRepresentationType.entity) {
    if (!isStixObject(representation.target.entity_type)) {
      throw FunctionalError('Unknown entity', { type: representation.target.entity_type });
    }
  }
};

export const validate = async (context: AuthContext, user: AuthUser, mapper: BasicStoreEntityCsvMapper) => {
  // consider empty csv mapper as invalid to avoid being used in the importer
  if (mapper.representations.length === 0) {
    throw Error(`CSV Mapper '${mapper.name}' has no representation`);
  }

  await Promise.all(Array.from(mapper.representations.entries()).map(async ([idx, representation]) => {
    // Validate target type
    isValidTargetType(representation);

    // Validate required attributes
    const entitySetting = await getEntitySettingFromCache(context, representation.target.entity_type);
    const defaultValues = fillDefaultValues(context.user, {}, entitySetting);
    const schemaAttributes = await getSchemaAttributes(context, user, representation.target.entity_type);
    schemaAttributes.filter((schemaAttribute) => schemaAttribute.mandatory)
      .forEach((schemaAttribute) => {
        const attribute = representation.attributes.find((a) => schemaAttribute.name === a.key);
        const isColumnEmpty = isEmptyField(attribute?.column?.column_name) && isEmptyField(attribute?.based_on?.representations);
        const isDefaultValueEmpty = isEmptyField(defaultValues[schemaAttribute.name]);
        const isAttributeDefaultValueEmpty = isEmptyField(attribute?.default_values);
        if (isColumnEmpty && isDefaultValueEmpty && isAttributeDefaultValueEmpty) {
          throw FunctionalError('Missing values for required attribute', { representation: representationLabel(idx, representation), attribute: schemaAttribute.name });
        }
      });

    // Validate representation attribute configuration
    representation.attributes.forEach((attribute) => {
      // Validate based on configuration
      if (isNotEmptyField(attribute.based_on?.representations)) {
        const schemaAttribute = schemaAttributes.find((attr) => attr.name === attribute.key);
        // Multiple
        if (!schemaAttribute?.multiple && (attribute.based_on?.representations?.length ?? 0) > 1) {
          throw FunctionalError('Attribute can\'t be multiple', { representation: representationLabel(idx, representation), attribute: attribute.key });
        }
        // Auto reference
        if (attribute.based_on?.representations?.includes(representation.id)) {
          throw FunctionalError('Can\'t reference the representation itself', { representation: representationLabel(idx, representation), attribute: attribute.key });
        }
        // Possible cycle
        const representationRefs = mapper.representations.filter((r) => attribute.based_on?.representations?.includes(r.id));
        const attributeRepresentationRefs = representationRefs.map((rr) => rr.attributes
          .filter((rra) => isNotEmptyField(rra.based_on?.representations))
          .map((rra) => rra.based_on?.representations ?? [])
          .flat())
          .flat();
        if (attributeRepresentationRefs.includes(representation.id)) {
          throw FunctionalError('Reference cycle found', { representation: representationLabel(idx, representation) });
        }
      }
    });
  }));
};

export const errors = async (context: AuthContext, user: AuthUser, csvMapper: BasicStoreEntityCsvMapper) => {
  try {
    await validate(context, user, parseCsvMapper(csvMapper));
    return null;
  } catch (error) {
    if (error instanceof Error) {
      return error.message;
    }
    return 'Unknown error';
  }
};

export const sanitized = (mapper: BasicStoreEntityCsvMapper) => {
  return {
    ...mapper,
    representations: mapper.representations.map((r) => {
      return {
        ...r,
        attributes: r.attributes.filter((attr) => {
          return isNotEmptyField(attr.based_on?.representations) || isNotEmptyField(attr.column?.column_name);
        })
      };
    })
  };
};
