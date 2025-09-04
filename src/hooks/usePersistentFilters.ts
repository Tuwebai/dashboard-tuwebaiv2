import { useState, useEffect, useCallback } from 'react';

export interface FilterState {
  [key: string]: any;
}

export interface FilterConfig {
  key: string;
  type: 'text' | 'select' | 'date' | 'number' | 'boolean' | 'multiselect';
  defaultValue?: any;
  options?: { label: string; value: any }[];
  validate?: (value: any) => boolean;
  transform?: (value: any) => any;
}

export interface UsePersistentFiltersOptions {
  storageKey: string;
  filters: FilterConfig[];
  userId?: string;
  role?: string;
  autoSave?: boolean;
  debounceMs?: number;
}

export interface UsePersistentFiltersReturn {
  filterState: FilterState;
  setFilter: (key: string, value: any) => void;
  setFilters: (filters: FilterState) => void;
  resetFilters: () => void;
  clearFilters: () => void;
  saveFilters: () => void;
  loadFilters: () => void;
  hasUnsavedChanges: boolean;
  isLoading: boolean;
}

export const usePersistentFilters = ({
  storageKey,
  filters,
  userId,
  role,
  autoSave = true,
  debounceMs = 500
}: UsePersistentFiltersOptions): UsePersistentFiltersReturn => {
  const [filterState, setFilterState] = useState<FilterState>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Generate unique storage key
  const getStorageKey = useCallback(() => {
    const baseKey = `filters-${storageKey}`;
    if (userId) return `${baseKey}-user-${userId}`;
    if (role) return `${baseKey}-role-${role}`;
    return baseKey;
  }, [storageKey, userId, role]);

  // Initialize default values
  const getDefaultValues = useCallback(() => {
    const defaults: FilterState = {};
    filters.forEach(filter => {
      if (filter.defaultValue !== undefined) {
        defaults[filter.key] = filter.defaultValue;
      }
    });
    return defaults;
  }, [filters]);

  // Load filters from localStorage
  const loadFilters = useCallback(() => {
    try {
      setIsLoading(true);
      const saved = localStorage.getItem(getStorageKey());
      if (saved) {
        const parsedFilters = JSON.parse(saved);
        
        // Validate and transform loaded filters
        const validatedFilters: FilterState = {};
        filters.forEach(filter => {
          const savedValue = parsedFilters[filter.key];
          
          if (savedValue !== undefined) {
            // Validate the saved value
            if (!filter.validate || filter.validate(savedValue)) {
              // Transform the value if needed
              validatedFilters[filter.key] = filter.transform 
                ? filter.transform(savedValue) 
                : savedValue;
            } else {
              // Use default value if validation fails
              validatedFilters[filter.key] = filter.defaultValue;
            }
          } else {
            // Use default value if not saved
            validatedFilters[filter.key] = filter.defaultValue;
          }
        });
        
        setFilterState(validatedFilters);
        setHasUnsavedChanges(false);
      } else {
        // No saved filters, use defaults
        setFilterState(getDefaultValues());
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Error loading filters:', error);
      setFilterState(getDefaultValues());
      setHasUnsavedChanges(false);
    } finally {
      setIsLoading(false);
    }
  }, [getStorageKey, filters, getDefaultValues]);

  // Save filters to localStorage
  const saveFilters = useCallback(() => {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(filterState));
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving filters:', error);
    }
  }, [getStorageKey, filterState]);

  // Debounced save function
  const debouncedSave = useCallback(() => {
    const timeoutId = setTimeout(() => {
      if (autoSave && hasUnsavedChanges) {
        saveFilters();
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [autoSave, hasUnsavedChanges, saveFilters, debounceMs]);

  // Set individual filter
  const setFilter = useCallback((key: string, value: any) => {
    const filterConfig = filters.find(f => f.key === key);
    if (!filterConfig) {
      console.warn(`Filter config not found for key: ${key}`);
      return;
    }

    // Validate the value
    if (filterConfig.validate && !filterConfig.validate(value)) {
      console.warn(`Invalid value for filter ${key}:`, value);
      return;
    }

    // Transform the value if needed
    const transformedValue = filterConfig.transform 
      ? filterConfig.transform(value) 
      : value;

    setFilterState(prev => ({
      ...prev,
      [key]: transformedValue
    }));
    setHasUnsavedChanges(true);
  }, [filters]);

  // Set multiple filters
  const setFilters = useCallback((newFilters: FilterState) => {
    const validatedFilters: FilterState = {};
    
    Object.entries(newFilters).forEach(([key, value]) => {
      const filterConfig = filters.find(f => f.key === key);
      if (filterConfig) {
        // Validate the value
        if (!filterConfig.validate || filterConfig.validate(value)) {
          // Transform the value if needed
          validatedFilters[key] = filterConfig.transform 
            ? filterConfig.transform(value) 
            : value;
        } else {
          console.warn(`Invalid value for filter ${key}:`, value);
          validatedFilters[key] = filterConfig.defaultValue;
        }
      } else {
        console.warn(`Filter config not found for key: ${key}`);
      }
    });

    setFilterState(prev => ({
      ...prev,
      ...validatedFilters
    }));
    setHasUnsavedChanges(true);
  }, [filters]);

  // Reset filters to default values
  const resetFilters = useCallback(() => {
    setFilterState(getDefaultValues());
    setHasUnsavedChanges(true);
  }, [getDefaultValues]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilterState({});
    setHasUnsavedChanges(true);
  }, []);

  // Load filters on mount
  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  // Auto-save when filters change
  useEffect(() => {
    if (autoSave && hasUnsavedChanges) {
      const cleanup = debouncedSave();
      return cleanup;
    }
  }, [autoSave, hasUnsavedChanges, debouncedSave]);

  // Save filters before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasUnsavedChanges) {
        saveFilters();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, saveFilters]);

  return {
    filterState,
    setFilter,
    setFilters,
    resetFilters,
    clearFilters,
    saveFilters,
    loadFilters,
    hasUnsavedChanges,
    isLoading
  };
};
