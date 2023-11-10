import React, { FunctionComponent, useState } from 'react';
import Popover from '@mui/material/Popover';
import MUIAutocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { OptionValue } from '@components/common/lists/FilterAutocomplete';
import Checkbox from '@mui/material/Checkbox';
import FilterDate from '@components/common/lists/FilterDate';
import { MenuItem, Select } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { dateFilters, Filter, getAvailableOperatorForFilter, integerFilters } from '../../utils/filters/filtersUtils';
import { useFormatter } from '../i18n';
import ItemIcon from '../ItemIcon';
import { getFilterHelpers } from '../../utils/filters/FiltersHelpers.util';
import { getOptions, getUseSearch } from '../../utils/filters/SearchEntities.util';

interface FilterChipMenuProps {
  handleClose: () => void;
  open: boolean;
  params: FilterChipsParameter;
  filters: Filter[];
}

export interface FilterChipsParameter {
  filterId?: string;
  anchorEl?: HTMLElement;
}

const OperatorKeyValues: {
  [key: string]: string
} = {
  eq: 'Equals',
  not_eq: 'Not equals',
  nil: 'Null',
  not_nil: 'Not null',
  gt: 'Greater than',
  gte: 'Greater than/ Equals',
  lt: 'Lower than',
  lte: 'Lower than/ Equals',
};

export const FilterChipPopover: FunctionComponent<FilterChipMenuProps> = ({ params, handleClose, open, filters }) => {
  const filter = filters.find((f) => f.id === params.filterId);
  const filterKey = filter?.key ?? '';
  const filterOperator = filter?.operator ?? '';
  const filterValues = filter?.values ?? [];
  const [inputValues, setInputValues] = useState<{
    key: string,
    values: string[],
    operator?: string
  }[]>([]);
  const [cacheEntities, setCacheEntities] = useState<
  Record<string, {
    label: string;
    value: string;
    type: string
  }[]>
  >({});
  const [entities, searchEntities] = getUseSearch();
  const { t } = useFormatter();
  const optionValues: OptionValue[] = getOptions(filterKey, entities);
  const handleChange = (checked: boolean, value: string) => {
    if (checked) {
      getFilterHelpers()?.handleAddRepresentationFilter(filter?.id ?? '', value);
    } else {
      getFilterHelpers()?.handleRemoveRepresentationFilter(filter?.id ?? '', value);
    }
  };

  const handleChangeOperator = (event: SelectChangeEvent) => {
    getFilterHelpers()?.handleChangeOperatorFilters(filter?.id ?? '', event.target.value);
  };
  const handleDateChange = (
    _: string,
    value: string,
  ) => {
    getFilterHelpers()?.handleAddSingleValueFilter(filter?.id ?? '', value);
  };

  const isSpecificFilter = (fKey: string) => {
    return dateFilters.includes(fKey) || integerFilters.includes(fKey);
  };
  const BasicNumberInput = () => <TextField
    variant="outlined"
    size="small"
    fullWidth={true}
    id={`${filterKey}-id`}
    label={t(`filter_${filterKey}`)}
    type="number"
    defaultValue={filterValues[0]}
    onKeyDown={(event) => {
      if (event.key === 'Enter') {
        getFilterHelpers()?.handleAddSingleValueFilter(filter?.id ?? '', event.target.value);
      }
    }}
    onBlur={(event) => {
      getFilterHelpers()?.handleAddSingleValueFilter(filter?.id ?? '', event.target.value);
    }
    }
  />;
  const BasicFilterDate = () => <FilterDate
    defaultHandleAddFilter={handleDateChange}
    filterKey={filterKey}
    operator={filterOperator}
    inputValues={inputValues}
    setInputValues={setInputValues}
  />;
  const SpecificFilter = () => {
    if (dateFilters.includes(filterKey)) {
      return <BasicFilterDate/>;
    }
    if (integerFilters.includes(filterKey)) {
      return <BasicNumberInput/>;
    }
    return null;
  };

  return <Popover
    open={open}
    anchorEl={params.anchorEl}
    onClose={handleClose}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'left',
    }}
  >
    <div
      style={{
        width: '250px',
        padding: '8px',
      }}
    >
      <Select
        labelId="change-operator-select-label"
        id="change-operator-select"
        value={filterOperator}
        label="Operator"
        sx={{ marginBottom: '12px' }}
        onChange={handleChangeOperator}
      >
        {
          getAvailableOperatorForFilter(filterKey).map((value) => <MenuItem
            value={value}>{OperatorKeyValues[value]}</MenuItem>)
        }
      </Select>
      {
        isSpecificFilter(filterKey)
          ? <SpecificFilter/>
          : <>
            {(!['not_nil', 'nil'].includes(filterOperator))
              && <MUIAutocomplete
                multiple
                disableCloseOnSelect
                key={filterKey}
                selectOnFocus={true}
                autoSelect={false}
                autoHighlight={true}
                getOptionLabel={(option) => option.label ?? ''}
                noOptionsText={t('No available options')}
                options={optionValues}
                onInputChange={(event) => searchEntities(
                  filterKey,
                  cacheEntities,
                  setCacheEntities,
                  event,
                )}
                renderInput={(paramsInput) => (
                  <TextField
                    {...paramsInput}
                    label={t(`filter_${filterKey}`)}
                    variant="outlined"
                    size="small"
                    fullWidth={true}
                    onFocus={(event) => searchEntities(
                      filterKey,
                      cacheEntities,
                      setCacheEntities,
                      event,
                    )}
                  />
                )}
                renderOption={(props, option) => {
                  const checked = filterValues.includes(option.value);
                  return <li {...props}
                             onClick={() => handleChange(!checked, option.value)}>
                    <Checkbox
                      checked={checked}
                    />
                    <ItemIcon type={option.type} color={option.color}/>
                    <span style={{ padding: '0 4px' }}>{option.label}</span>
                  </li>;
                }}
              />
            }
          </>
      }
    </div>
  </Popover>;
};
