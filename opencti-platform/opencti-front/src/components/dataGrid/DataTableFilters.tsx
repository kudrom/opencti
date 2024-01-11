import Filters from '@components/common/lists/Filters';
import React from 'react';
import GenerateDefaultDirectFilters from '../GenerateDefaultDirectFilters';
import FilterIconButton from '../FilterIconButton';

const DataTableFilters = ({
  filters,
  availableFilterKeys,
  helpers,
  searchContextFinal,
  availableEntityTypes,
  availableRelationshipTypes,
  availableRelationFilterTypes,
}) => {
  return (
    <>
      {availableFilterKeys && availableFilterKeys.length > 0 && (
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
      )}
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
    </>
  );
};

export default DataTableFilters;