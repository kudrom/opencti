import { Option } from '@components/common/form/ReferenceField';
import { INPUT_AUTHORIZED_MEMBERS } from './authorizedMembers';

export type DefaultValues = Option | Option[] | string | (string | null)[] | boolean | null;

const isBoolean = (defaultValues: DefaultValues) => {
  return typeof defaultValues === 'boolean';
};

const isSingleOption = (defaultValues: DefaultValues) => {
  return (
    typeof defaultValues === 'object'
    && 'value' in (defaultValues as unknown as Option)
  );
};

const isMultipleOption = (defaultValues: DefaultValues) => {
  return Array.isArray(defaultValues) && defaultValues.some(isSingleOption);
};

/**
 * Transforms a default value in a format used in a form into
 * the format to stringify for backend.
 *
 * @param defaultValues The value in form format.
 * @param attributeName Optional name of the attribute of the default value.
 * @returns Default values as an array of string.
 */
export const defaultValuesToStringArray = (
  defaultValues: DefaultValues,
  attributeName?: string,
): string[] | null => {
  let default_values: string[] | null = null;
  if (!defaultValues) return default_values;

  if (Array.isArray(defaultValues)) {
    if (attributeName === INPUT_AUTHORIZED_MEMBERS) {
      default_values = (defaultValues as Option[])
        .filter((v) => v.accessRight !== 'none')
        .map((v) => JSON.stringify({
          id: v.value,
          access_right: v.accessRight,
        }));
    } else if (isMultipleOption(defaultValues)) {
      // Handle multiple options
      default_values = defaultValues.map((v) => (v as Option).value);
    }
    // Handle single option
  } else if (isSingleOption(defaultValues)) {
    default_values = [(defaultValues as Option).value];
    // Handle single value
  } else if (isBoolean(defaultValues)) {
    default_values = [defaultValues.toString()];
  } else {
    // Default case -> string
    default_values = [defaultValues as string];
  }
  return default_values;
};

/**
 * Transforms a default value in backend into
 * the format used in the form.
 *
 * @param defaultValues The value in backend format.
 * @param attributeType Type in the schema attribute.
 * @param attributeMultiple True if the value is multiple.
 * @param attributeName Name in the schema attribute.
 * @returns Default values usable by the form.
 */
export const defaultValuesStringArrayToForm = (
  defaultValues: readonly string[],
  attributeType: string,
  attributeMultiple: boolean,
  attributeName: string,
): DefaultValues => {
  let default_values: DefaultValues = null;
  if (!defaultValues) return default_values;

  if (attributeName === 'createdBy') {
    default_values = defaultValues.map((v) => ({ value: v, label: v }))[0] ?? '';
  } else if (attributeMultiple) {
    default_values = defaultValues.map((v) => ({ value: v, label: v })) ?? '';
  } else if (attributeType === 'boolean') {
    default_values = Boolean(defaultValues[0]);
  } else {
    default_values = defaultValues[0] ?? '';
  }
  return default_values;
};
