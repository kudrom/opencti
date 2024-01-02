import { FunctionComponent, useEffect } from 'react';
import { UseLocalStorageHelpers } from '../utils/hooks/useLocalStorage';
import { directFilters, FilterGroup, getDefaultFilterObject } from '../utils/filters/filtersUtils';
import useAuth from '../utils/hooks/useAuth';

interface GenerateDefaultDirectFiltersProps {
  filters?: FilterGroup;
  availableFilterKeys: string[];
  helpers: UseLocalStorageHelpers;
  entityTypes: string[];
}
const GenerateDefaultDirectFilters: FunctionComponent<GenerateDefaultDirectFiltersProps> = ({
  filters,
  availableFilterKeys,
  helpers,
  entityTypes,
}) => {
  const displayedFilters = {
    ...filters,
    filters:
      filters?.filters.filter(
        (f) => !availableFilterKeys || availableFilterKeys?.some((k) => f.key === k),
      ) || [],
  };
  const { filterKeysSchema } = useAuth().schema;
  const filterKeysMap = new Map();
  (entityTypes ?? []).forEach((entity_type) => {
    const currentMap = filterKeysSchema.get(entity_type);
    if (currentMap) currentMap.forEach((filterDef, filterKey) => filterKeysMap.set(filterKey, filterDef));
  });
  useEffect(() => {
    if (displayedFilters.filters.length === 0) {
      const dFilter = availableFilterKeys?.filter((n) => directFilters.includes(n)) ?? [];
      if (dFilter.length > 0) {
        helpers?.handleClearAllFilters(
          dFilter.map((key) => getDefaultFilterObject(key, filterKeysMap.get(key))),
        );
      }
    }
  }, []);
  return null;
};

export default GenerateDefaultDirectFilters;
