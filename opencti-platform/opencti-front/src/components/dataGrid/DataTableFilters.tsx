import Filters from '@components/common/lists/Filters';
import React from 'react';
import GenerateDefaultDirectFilters from '../GenerateDefaultDirectFilters';
import FilterIconButton from '../FilterIconButton';
import { useFormatter } from '../i18n';

export const DataTableDisplayFilters = ({ helpers, filters, availableFilterKeys, availableRelationFilterTypes }) => {
  return (
    <div style={{ minHeight: 50 }}>
      <GenerateDefaultDirectFilters
        filters={filters}
        availableFilterKeys={availableFilterKeys}
        helpers={helpers}
      />
      <FilterIconButton
        helpers={helpers}
        availableFilterKeys={availableFilterKeys}
        filters={filters}
        handleRemoveFilter={helpers.handleRemoveFilter}
        handleSwitchGlobalMode={helpers.handleSwitchGlobalMode}
        handleSwitchLocalMode={helpers.handleSwitchLocalMode}
        availableRelationFilterTypes={availableRelationFilterTypes}
        redirection
      />
    </div>
  );
};

const DataTableFilters = ({
  availableFilterKeys,
  helpers,
  searchContextFinal,
  availableEntityTypes,
  availableRelationshipTypes,
  availableRelationFilterTypes,
  numberOfElements,
}) => {
  const { t } = useFormatter();
  return (
    <>
      {availableFilterKeys && availableFilterKeys.length > 0 && (
        <div style={{ display: 'inline-flex', justifyContent: 'space-between', flex: 1 }}>
          <div style={{ display: 'inline-grid', gridAutoFlow: 'column', marginLeft: 10, gap: 10 }}>
            <Filters
              helpers={helpers}
              searchContext={searchContextFinal}
              availableFilterKeys={availableFilterKeys}
              handleAddFilter={helpers.handleAddFilter}
              handleSwitchFilter={helpers.handleSwitchFilter}
              handleRemoveFilter={helpers.handleRemoveFilter}
              handleSwitchGlobalMode={helpers.handleSwitchGlobalMode}
              handleSwitchLocalMode={helpers.handleSwitchLocalMode}
              availableEntityTypes={availableEntityTypes}
              availableRelationshipTypes={availableRelationshipTypes}
              availableRelationFilterTypes={availableRelationFilterTypes}
            />
          </div>
          {numberOfElements && (
            <div
              style={
                false
                  ? { float: 'left', padding: '7px 20px 0 0' }
                  : { float: 'left', padding: '7px 5px 0 0' }
              }
            >
              <strong>{`${numberOfElements.number}${numberOfElements.symbol}`}</strong>{' '}
              {t('entitie(s)')}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default DataTableFilters;