/* eslint-disable @typescript-eslint/no-unused-vars */
import { Close } from '@mui/icons-material';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import makeStyles from '@mui/styles/makeStyles';
import { Field, Form, Formik } from 'formik';
import { FormikConfig, FormikHelpers } from 'formik/dist/types';
import React, { FunctionComponent, useState } from 'react';
import { graphql, useMutation } from 'react-relay';
import * as Yup from 'yup';
import { Box } from '@mui/material';
import AutocompleteField from '../../../../components/AutocompleteField';
import FilterIconButton from '../../../../components/FilterIconButton';
import { useFormatter } from '../../../../components/i18n';
import MarkdownField from '../../../../components/MarkdownField';
import SwitchField from '../../../../components/SwitchField';
import TextField from '../../../../components/TextField';
import type { Theme } from '../../../../components/Theme';
import { handleErrorInForm } from '../../../../relay/environment';
import { fieldSpacingContainerStyle } from '../../../../utils/field';
import {
  constructHandleAddFilter,
  constructHandleRemoveFilter,
  Filter,
  FilterGroup,
  filtersAfterSwitchLocalMode,
  emptyFilterGroup,
  serializeFilterGroupForBackend,
} from '../../../../utils/filters/filtersUtils';
import { insertNode } from '../../../../utils/store';
import NotifierField from '../../common/form/NotifierField';
import { Option } from '../../common/form/ReferenceField';
import FilterAutocomplete, { FilterAutocompleteInputValue } from '../../common/lists/FilterAutocomplete';
import Filters from '../../common/lists/Filters';
import { TriggerEventType, TriggerLiveCreationKnowledgeMutation, TriggerLiveCreationKnowledgeMutation$data } from './__generated__/TriggerLiveCreationKnowledgeMutation.graphql';
import { TriggersLinesPaginationQuery$variables } from './__generated__/TriggersLinesPaginationQuery.graphql';
import useFiltersState from '../../../../utils/filters/useFiltersState';

const useStyles = makeStyles<Theme>((theme) => ({
  drawerPaper: {
    minHeight: '100vh',
    width: '50%',
    position: 'fixed',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    padding: 0,
  },
  dialogActions: {
    padding: '0 17px 20px 0',
  },
  buttons: {
    marginTop: 20,
    textAlign: 'right',
  },
  button: {
    marginLeft: theme.spacing(2),
  },
  header: {
    backgroundColor: theme.palette.background.nav,
    padding: '20px 20px 20px 60px',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    left: 5,
    color: 'inherit',
  },
  container: {
    padding: '10px 20px 20px 20px',
  },
}));

// region live
export const triggerLiveKnowledgeCreationMutation = graphql`
  mutation TriggerLiveCreationKnowledgeMutation($input: TriggerLiveAddInput!) {
    triggerKnowledgeLiveAdd(input: $input) {
      id
      name
      event_types
      ...TriggerLine_node
    }
  }
`;

const liveTriggerValidation = (t: (message: string) => string) => Yup.object().shape({
  name: Yup.string().required(t('This field is required')),
  description: Yup.string().nullable(),
  event_types: Yup.array()
    .min(1, t('Minimum one event type'))
    .required(t('This field is required')),
  notifiers: Yup.array().nullable(),
});

export const instanceTriggerDescription = 'An instance trigger on an entity X notifies the following events: update/deletion of X, creation/deletion of a relationship from/to X, creation/deletion of an entity that has X in its refs (for instance contains X, is shared with X, is created by X...), adding/removing X in the ref of an entity.';

interface TriggerLiveAddInput {
  name: string;
  description: string;
  event_types: { value: TriggerEventType; label: string }[];
  notifiers: { value: string; label: string }[];
  recipients: string[];
}

interface TriggerLiveCreationProps {
  contextual?: boolean;
  open?: boolean;
  handleClose?: () => void;
  inputValue?: string;
  recipientId?: string;
  paginationOptions?: TriggersLinesPaginationQuery$variables;
  creationCallback?: (data: TriggerLiveCreationKnowledgeMutation$data) => void;
}

const TriggerLiveCreation: FunctionComponent<TriggerLiveCreationProps> = ({
  contextual,
  inputValue,
  paginationOptions,
  open,
  handleClose,
  creationCallback,
  recipientId,
}) => {
  const { t_i18n } = useFormatter();
  const classes = useStyles();
  const [filters, helpers] = useFiltersState();
  const [instanceTriggerFilters, setInstanceTriggerFilters] = useState<FilterGroup | undefined>(emptyFilterGroup);
  const [instance_trigger, setInstanceTrigger] = useState<boolean>(false);
  const [instanceFilters, setInstanceFilters] = useState<
  FilterAutocompleteInputValue[]
  >([]);
  const eventTypesOptions: { value: TriggerEventType; label: string }[] = [
    { value: 'create', label: t_i18n('Creation') },
    { value: 'update', label: t_i18n('Modification') },
    { value: 'delete', label: t_i18n('Deletion') },
  ];
  const instanceEventTypesOptions: {
    value: TriggerEventType;
    label: string;
  }[] = [
    { value: 'update', label: t_i18n('Modification') },
    { value: 'delete', label: t_i18n('Deletion') },
  ];
  const onReset = () => {
    handleClose?.();
    setInstanceTriggerFilters(emptyFilterGroup);
    setInstanceTrigger(false);
    setInstanceFilters([]);
    helpers.handleClearAllFilters();
  };
  const onChangeInstanceTrigger = (
    setFieldValue: (
      key: string,
      value: { value: string; label: string }[],
    ) => void,
  ) => {
    const newInstanceTriggerValue = !instance_trigger;
    setFieldValue(
      'event_types',
      newInstanceTriggerValue ? instanceEventTypesOptions : eventTypesOptions,
    );
    helpers.handleClearAllFilters();
    setInstanceTriggerFilters(emptyFilterGroup);
    setInstanceTrigger(newInstanceTriggerValue);
  };
  const handleAddFilter = (k: string, id: string, op = 'eq') => {
    setInstanceTriggerFilters(constructHandleAddFilter(instanceTriggerFilters, k, id, op));
  };
  const handleRemoveFilter = (k: string, op = 'eq') => {
    setInstanceTriggerFilters(constructHandleRemoveFilter(instanceTriggerFilters, k, op));
  };

  const [commitLive] = useMutation<TriggerLiveCreationKnowledgeMutation>(
    triggerLiveKnowledgeCreationMutation,
  );
  const liveInitialValues: TriggerLiveAddInput = {
    name: inputValue || '',
    description: '',
    event_types: instance_trigger
      ? instanceEventTypesOptions
      : eventTypesOptions,
    notifiers: [],
    recipients: recipientId ? [recipientId] : [],
  };
  const onLiveSubmit: FormikConfig<TriggerLiveAddInput>['onSubmit'] = (
    values: TriggerLiveAddInput,
    { setSubmitting, setErrors, resetForm }: FormikHelpers<TriggerLiveAddInput>,
  ) => {
    const jsonFilters = instance_trigger ? serializeFilterGroupForBackend(instanceTriggerFilters) : serializeFilterGroupForBackend(filters);
    const finalValues = {
      name: values.name,
      event_types: values.event_types.map((n) => n.value),
      notifiers: values.notifiers.map((n) => n.value),
      description: values.description,
      filters: jsonFilters,
      recipients: values.recipients,
      instance_trigger,
    };
    commitLive({
      variables: {
        input: finalValues,
      },
      updater: (store) => {
        if (paginationOptions) {
          insertNode(
            store,
            'Pagination_triggersKnowledge',
            paginationOptions,
            'triggerKnowledgeLiveAdd',
          );
        }
      },
      onError: (error: Error) => {
        handleErrorInForm(error, setErrors);
        setSubmitting(false);
      },
      onCompleted: (response) => {
        setSubmitting(false);
        resetForm();
        if (creationCallback) {
          creationCallback(response);
        }
      },
    });
  };
  const renderKnowledgeTrigger = (
    values: TriggerLiveAddInput,
    setFieldValue: (key: string, value: (Option | string)[]) => void,
  ) => {
    return (
      <>
        <Field
          component={SwitchField}
          type="checkbox"
          name="instance_trigger"
          label={t_i18n('Instance trigger')}
          tooltip={instanceTriggerDescription}
          containerstyle={{ marginTop: 20 }}
          onChange={() => onChangeInstanceTrigger(setFieldValue)}
        />
        <Field
          component={AutocompleteField}
          name="event_types"
          style={fieldSpacingContainerStyle}
          multiple={true}
          textfieldprops={{
            variant: 'standard',
            label: t_i18n('Triggering on'),
          }}
          options={
            instance_trigger ? instanceEventTypesOptions : eventTypesOptions
          }
          renderOption={(
            props: React.HTMLAttributes<HTMLLIElement>,
            option: { value: TriggerEventType; label: string },
          ) => (
            <MenuItem value={option.value} {...props}>
              <Checkbox
                checked={values.event_types
                  .map((n) => n.value)
                  .includes(option.value)}
              />
              <ListItemText primary={option.label} />
            </MenuItem>
          )}
        />
        <NotifierField name="notifiers" onChange={setFieldValue} />
        {instance_trigger ? (
          <div style={fieldSpacingContainerStyle}>
            <FilterAutocomplete
              filterKey={'connectedToId'}
              searchContext={{ entityTypes: ['Stix-Core-Object'] }}
              defaultHandleAddFilter={handleAddFilter}
              inputValues={instanceFilters}
              setInputValues={setInstanceFilters}
              openOnFocus={true}
            />
          </div>
        ) : (<Box sx={{ paddingTop: 4,
          display: 'flex',
          gap: 1 }}
             >
          <Filters
            availableFilterKeys={[
              'entity_type',
              'workflow_id',
              'objectAssignee',
              'objects',
              'objectMarking',
              'objectLabel',
              'creator_id',
              'createdBy',
              'priority',
              'severity',
              'x_opencti_score',
              'x_opencti_detection',
              'revoked',
              'confidence',
              'indicator_types',
              'pattern_type',
              'fromId',
              'toId',
              'fromTypes',
              'toTypes',
            ]}
            helpers={helpers}
          />
        </Box>
        )}
      </>
    );
  };

  const liveFields = (
    setFieldValue: (
      field: string,
      value: unknown,
      shouldValidate?: boolean | undefined,
    ) => void,
    values: TriggerLiveAddInput,
  ) => (
    <React.Fragment>
      <Field
        component={TextField}
        variant="standard"
        name="name"
        label={t_i18n('Name')}
        fullWidth={true}
      />
      <Field
        component={MarkdownField}
        name="description"
        label={t_i18n('Description')}
        fullWidth={true}
        multiline={true}
        rows="4"
        style={{ marginTop: 20 }}
      />
      {renderKnowledgeTrigger(values, setFieldValue)}
      {instance_trigger
        ? <FilterIconButton
            filters={instanceTriggerFilters}
            handleRemoveFilter={handleRemoveFilter}
            styleNumber={2}
            redirection
          />
        : <FilterIconButton
            filters={filters}
            helpers={helpers}
            redirection
          />
      }

    </React.Fragment>
  );

  const renderClassic = () => (
    <Drawer
      disableRestoreFocus={true}
      open={open}
      anchor="right"
      elevation={1}
      sx={{ zIndex: 1202 }}
      classes={{ paper: classes.drawerPaper }}
      onClose={onReset}
    >
      <div className={classes.header}>
        <IconButton
          aria-label="Close"
          className={classes.closeButton}
          onClick={onReset}
          size="large"
          color="primary"
        >
          <Close fontSize="small" color="primary" />
        </IconButton>
        <Typography variant="h6">{t_i18n('Create a live trigger')}</Typography>
      </div>
      <div className={classes.container}>
        <Formik<TriggerLiveAddInput>
          initialValues={liveInitialValues}
          validationSchema={liveTriggerValidation(t_i18n)}
          onSubmit={onLiveSubmit}
          onReset={onReset}
        >
          {({
            submitForm,
            handleReset,
            isSubmitting,
            setFieldValue,
            values,
          }) => (
            <Form style={{ margin: '20px 0 20px 0' }}>
              {liveFields(setFieldValue, values)}
              <div className={classes.buttons}>
                <Button
                  variant="contained"
                  onClick={handleReset}
                  disabled={isSubmitting}
                  classes={{ root: classes.button }}
                >
                  {t_i18n('Cancel')}
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={submitForm}
                  disabled={isSubmitting}
                  classes={{ root: classes.button }}
                >
                  {t_i18n('Create')}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </Drawer>
  );

  const renderContextual = () => (
    <Dialog
      disableRestoreFocus={true}
      open={open ?? false}
      onClose={onReset}
      PaperProps={{ elevation: 1 }}
    >
      <Formik
        initialValues={liveInitialValues}
        validationSchema={liveTriggerValidation(t_i18n)}
        onSubmit={onLiveSubmit}
        onReset={onReset}
      >
        {({ submitForm, handleReset, isSubmitting, setFieldValue, values }) => (
          <>
            <DialogTitle>{t_i18n('Create a live trigger')}</DialogTitle>
            <DialogContent>{liveFields(setFieldValue, values)}</DialogContent>
            <DialogActions classes={{ root: classes.dialogActions }}>
              <Button onClick={handleReset} disabled={isSubmitting}>
                {t_i18n('Cancel')}
              </Button>
              <Button
                color="secondary"
                onClick={submitForm}
                disabled={isSubmitting}
              >
                {t_i18n('Create')}
              </Button>
            </DialogActions>
          </>
        )}
      </Formik>
    </Dialog>
  );

  return contextual ? renderContextual() : renderClassic();
};
// endregion

export default TriggerLiveCreation;
