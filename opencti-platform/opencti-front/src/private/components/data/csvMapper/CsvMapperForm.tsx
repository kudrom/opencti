import React, { FunctionComponent, useEffect, useState } from 'react';
import { Field, FieldArray, Form, Formik } from 'formik';
import Button from '@mui/material/Button';
import makeStyles from '@mui/styles/makeStyles';
import * as Yup from 'yup';
import { IconButton, Radio, Typography } from '@mui/material';
import { Add } from '@mui/icons-material';
import { InformationOutline } from 'mdi-material-ui';
import Tooltip from '@mui/material/Tooltip';
import { FormikHelpers } from 'formik/dist/types';
import { SelectChangeEvent } from '@mui/material/Select';
import CsvMapperRepresentationForm, { RepresentationFormEntityOption } from '@components/data/csvMapper/representations/CsvMapperRepresentationForm';
import { CsvMapperFormData } from '@components/data/csvMapper/CsvMapper';
import classNames from 'classnames';
import type { Theme } from '../../../../components/Theme';
import { useFormatter } from '../../../../components/i18n';
import TextField from '../../../../components/TextField';
import SwitchField from '../../../../components/SwitchField';
import useAuth from '../../../../utils/hooks/useAuth';
import { representationInitialization } from './representations/RepresentationUtils';
import CsvMapperTestDialog from './CsvMapperTestDialog';

const useStyles = makeStyles<Theme>((theme) => ({
  buttons: {
    marginTop: 20,
    textAlign: 'right',
  },
  button: {
    marginLeft: theme.spacing(2),
  },
  center: {
    display: 'flex',
    alignItems: 'center',
  },
  marginTop: {
    marginTop: 20,
  },
  formContainer: {
    margin: '20px 0',
  },
  representationContainer: {
    marginTop: 20,
    display: 'flex',
  },
}));

const csvMapperValidation = (t: (s: string) => string) => Yup.object().shape({
  name: Yup.string().required(t('This field is required')),
  has_header: Yup.boolean().required(t('This field is required')),
  separator: Yup.string().required(t('This field is required')),
  skipLineChar: Yup.string().max(1),
});

interface CsvMapperFormProps {
  csvMapper: CsvMapperFormData;
  onSubmit: (
    values: CsvMapperFormData,
    formikHelpers: FormikHelpers<CsvMapperFormData>,
  ) => void;
}

const CsvMapperForm: FunctionComponent<CsvMapperFormProps> = ({ csvMapper, onSubmit }) => {
  const { t } = useFormatter();
  const classes = useStyles();

  // -- INIT --

  // accordion state
  const [open, setOpen] = useState(false);

  // extracting available entities and relationships types from schema
  const { schema } = useAuth();
  const [availableEntityTypes, setAvailableEntityTypes] = useState<
  RepresentationFormEntityOption[]
  >([]);
  const [availableRelationshipTypes, setAvailableRelationshipTypes] = useState<
  RepresentationFormEntityOption[]
  >([]);

  // load the available types once in state
  useEffect(() => {
    const { sdos, scos, smos, scrs } = schema;
    const entityTypes = sdos
      .map((sdo) => ({
        ...sdo,
        value: sdo.id,
        type: 'entity_Stix-Domain-Objects',
      }))
      .concat(
        scos.map((sco) => ({
          ...sco,
          value: sco.id,
          type: 'entity_Stix-Cyber-Observables',
        })),
      )
      .concat(
        smos.map((smo) => ({
          ...smo,
          value: smo.id,
          type: 'entity_Stix-Meta-Objects',
        })),
      );
    const relationshipTypes = scrs
      .map((scr) => ({
        ...scr,
        value: scr.id,
        type: 'entity_Stix-Core-Relationship',
      })).concat({
        id: 'stix-sighting-relationship',
        label: 'stix-sighting-relationship',
        value: 'stix-sighting-relationship',
        type: 'entity_stix-sighting-relationship',
      });

    setAvailableEntityTypes(entityTypes);
    setAvailableRelationshipTypes(relationshipTypes);
  }, [schema]);

  // -- EVENTS --

  const onAddEntityRepresentation = (
    setFieldValue: FormikHelpers<CsvMapperFormData>['setFieldValue'],
    values: CsvMapperFormData,
  ) => {
    setFieldValue('entity_representations', [
      ...values.entity_representations,
      representationInitialization('entity'),
    ]);
  };
  const onAddRelationshipRepresentation = (
    setFieldValue: FormikHelpers<CsvMapperFormData>['setFieldValue'],
    values: CsvMapperFormData,
  ) => {
    // always added at the end
    setFieldValue('relationship_representations', [
      ...values.relationship_representations,
      representationInitialization('relationship'),
    ]);
  };

  // -- ERRORS --
  // on edit mode, csvMapper.errors might be set; on create mode backend validation is not done yet so error is null
  const [hasError, setHasError] = useState<boolean>(!!csvMapper.errors?.length || csvMapper.representations.length === 0);
  let errors: Map<string, string> = new Map();
  const handleRepresentationErrors = (key: string, value: boolean) => {
    errors = { ...errors, [key]: value };
    setHasError(Object.values(errors).filter((v) => v).length > 0);
  };

  return (
    <>
      <Formik<CsvMapperFormData>
        enableReinitialize
        initialValues={csvMapper}
        validationSchema={csvMapperValidation(t)}
        onSubmit={onSubmit}
      >
        {({ submitForm, isSubmitting, setFieldValue, values }) => {
          return (
            <Form className={classes.formContainer}>
              <Field
                component={TextField}
                variant="standard"
                name="name"
                label={t('Name')}
                fullWidth
              />
              <div className={classNames(classes.center, classes.marginTop)}>
                <Field
                  component={SwitchField}
                  type="checkbox"
                  name="has_header"
                  label={t('My CSV file contains headers')}
                />
                <Tooltip
                  title={t(
                    'If this option is selected, we will skip the first line of your csv file',
                  )}
                >
                  <InformationOutline
                    fontSize="small"
                    color="primary"
                    style={{ cursor: 'default' }}
                  />
                </Tooltip>
              </div>
              <div className={classes.marginTop}>
                <Typography>{t('CSV separator')}</Typography>
                <div className={classes.center}>
                  <Field
                    checked={values.separator !== ';'} // if unset, this is the default option
                    component={Radio}
                    type="radio"
                    name="separator"
                    label="Comma"
                    value=","
                    onChange={(event: SelectChangeEvent) => setFieldValue('separator', event.target.value)
                    }
                  />
                  <Typography>{t('Comma')}</Typography>
                </div>
                <div className={classes.center}>
                  <Field
                    checked={values.separator === ';'}
                    component={Radio}
                    type="radio"
                    name="separator"
                    label="Semicolon"
                    value=";"
                    onChange={(event: SelectChangeEvent) => setFieldValue('separator', event.target.value)
                    }
                  />
                  <Typography>{t('Semicolon')}</Typography>
                </div>
              </div>
              <div
                className={classes.marginTop}
                style={{ display: 'flex', alignItems: 'end', gap: '8px' }}
              >
                <Field
                  component={TextField}
                  name="skip_line_char"
                  label={t('Char to escape line')}
                />
                <Tooltip
                  title={t(
                    'Every line that begins with this character will be skipped during parsing (for example: #).',
                  )}
                >
                  <InformationOutline
                    fontSize="small"
                    color="primary"
                    style={{ cursor: 'default' }}
                  />
                </Tooltip>
              </div>

              <div className={classNames(classes.center, classes.marginTop)}>
                <Typography variant="h3" sx={{ m: 0 }}>
                  {t('Representations for entity')}
                </Typography>
                <IconButton
                  color="secondary"
                  aria-label="Add"
                  onClick={() => onAddEntityRepresentation(setFieldValue, values)
                  }
                  size="large"
                >
                  <Add fontSize="small"/>
                </IconButton>
              </div>
              <FieldArray
                name="entity_representations"
                render={(arrayHelpers) => (
                  <>
                    {values.entity_representations.map((_, idx) => (
                      <div
                        key={`entity-${idx}`}
                        className={classes.representationContainer}
                      >
                        <Field
                          component={CsvMapperRepresentationForm}
                          name={`entity_representations[${idx}]`}
                          index={idx}
                          availableTypes={availableEntityTypes}
                          handleRepresentationErrors={handleRepresentationErrors}
                          prefixLabel="entity_"
                          onDelete={() => arrayHelpers.remove(idx)}
                        />
                      </div>
                    ))}
                  </>
                )}
              />

              <div className={classNames(classes.center, classes.marginTop)}>
                <Typography variant="h3" sx={{ m: 0 }}>
                  {t('Representations for relationship')}
                </Typography>
                <IconButton
                  color="secondary"
                  aria-label="Add"
                  onClick={() => onAddRelationshipRepresentation(setFieldValue, values)
                  }
                  size="large"
                >
                  <Add fontSize="small"/>
                </IconButton>
              </div>
              <FieldArray
                name="relationship_representations"
                render={(arrayHelpers) => (
                  <>
                    {values.relationship_representations.map((_, idx) => (
                      <div
                        key={`relationship-${idx}`}
                        className={classes.representationContainer}
                      >
                        <Field
                          component={CsvMapperRepresentationForm}
                          name={`relationship_representations[${idx}]`}
                          index={idx}
                          availableTypes={availableRelationshipTypes}
                          handleRepresentationErrors={handleRepresentationErrors}
                          prefixLabel="relationship_"
                          onDelete={() => arrayHelpers.remove(idx)}
                        />
                      </div>
                    ))}
                  </>
                )}
              />

              <div className={classes.buttons}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setOpen(true)}
                  classes={{ root: classes.button }}
                  disabled={hasError}
                >
                  {t('Test')}
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={submitForm}
                  disabled={isSubmitting}
                  classes={{ root: classes.button }}
                >
                  {csvMapper.id ? t('Update') : t('Create')}
                </Button>
              </div>
              <CsvMapperTestDialog
                open={open}
                onClose={() => setOpen(false)}
                configuration={JSON.stringify(values)}
              />
            </Form>
          );
        }}
      </Formik>
    </>
  );
};

export default CsvMapperForm;
