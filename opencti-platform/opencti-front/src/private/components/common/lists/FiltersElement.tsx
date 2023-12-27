import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import React, { FunctionComponent } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { useFormatter } from '../../../../components/i18n';
import { dateFilters, directFilters, FilterDefinition, FiltersVariant } from '../../../../utils/filters/filtersUtils';
import FilterDate from './FilterDate';
import FilterAutocomplete from './FilterAutocomplete';
import type { Theme } from '../../../../components/Theme';
import { HandleAddFilter } from '../../../../utils/hooks/useLocalStorage';

const useStyles = makeStyles<Theme>((theme) => ({
  helpertext: {
    display: 'inline-block',
    color: theme.palette.text?.secondary,
    marginTop: 20,
  },
}));

export type FilterElementsInputValue = {
  key: string;
  values: string[];
  operator?: string;
};

export interface FiltersElementProps {
  variant?: string;
  keyword: string;
  availableFilterKeys: string[];
  searchContext: {
    entityTypes: string[];
    elementId?: string[];
  };
  handleChangeKeyword: (event: React.ChangeEvent) => void;
  noDirectFilters?: boolean;
  setInputValues: (
    value: {
      key: string;
      values: string[];
      operator?: string;
    }[],
  ) => void;
  inputValues: {
    key: string;
    values: string[];
    operator?: string;
  }[];
  defaultHandleAddFilter: HandleAddFilter;
  availableEntityTypes?: string[];
  availableRelationshipTypes?: string[];
  availableRelationFilterTypes?: Record<string, string[]>;
  allEntityTypes?: boolean;
  filterKeysMap?: Map<string, FilterDefinition>;
}

const FiltersElement: FunctionComponent<FiltersElementProps> = ({
  variant,
  keyword,
  availableFilterKeys,
  searchContext,
  handleChangeKeyword,
  noDirectFilters,
  setInputValues,
  inputValues,
  defaultHandleAddFilter,
  availableEntityTypes,
  availableRelationshipTypes,
  availableRelationFilterTypes,
  allEntityTypes,
  filterKeysMap,
}) => {
  const { t } = useFormatter();
  const classes = useStyles();
  const displayedFilters = availableFilterKeys
    .filter((n) => noDirectFilters || !directFilters.includes(n))
    .flat();
  return (
    <>
      <Grid container={true} spacing={2}>
        {variant === FiltersVariant.dialog && (
          <Grid item={true} xs={12}>
            <TextField
              label={t('Global keyword')}
              variant="outlined"
              size="small"
              fullWidth={true}
              value={keyword}
              onChange={handleChangeKeyword}
            />
          </Grid>
        )}
        {displayedFilters.map((filterKey, index) => {
          const isDateFilter = filterKeysMap?.get(filterKey)?.type === 'date' || dateFilters.includes(filterKey); // TODO remove hardcode
          if (isDateFilter) {
            return (
              <Grid
                key={`${filterKey}_${index}`}
                item={true}
                xs={6}
              >
                <FilterDate
                  defaultHandleAddFilter={defaultHandleAddFilter}
                  filterKey={filterKey}
                  inputValues={inputValues}
                  setInputValues={setInputValues}
                />
              </Grid>);
          }
          return (
            <Grid key={filterKey} item={true} xs={6}>
              <FilterAutocomplete
                filterKey={filterKey}
                searchContext={searchContext}
                defaultHandleAddFilter={defaultHandleAddFilter}
                inputValues={inputValues}
                setInputValues={setInputValues}
                availableEntityTypes={availableEntityTypes}
                availableRelationshipTypes={availableRelationshipTypes}
                availableRelationFilterTypes={availableRelationFilterTypes}
                allEntityTypes={allEntityTypes}
                openOnFocus={true}
              />
            </Grid>
          );
        })}
      </Grid>
      <div className={classes.helpertext}>
        {t('Use')} <code>alt</code> + <code>click</code> {t('to exclude items')}
        .
      </div>
    </>
  );
};

export default FiltersElement;
