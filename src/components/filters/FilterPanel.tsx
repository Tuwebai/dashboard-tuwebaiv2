import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/Form';
import { usePersistentFilters, FilterConfig } from '@/hooks/usePersistentFilters';
import { Search, Filter, RotateCcw, Save, X } from 'lucide-react';

export interface FilterPanelProps {
  storageKey: string;
  filters: FilterConfig[];
  userId?: string;
  role?: string;
  onFiltersChange?: (filters: Record<string, any>) => void;
  onApply?: (filters: Record<string, any>) => void;
  onReset?: () => void;
  className?: string;
  showSaveButton?: boolean;
  showResetButton?: boolean;
  showClearButton?: boolean;
  autoApply?: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  storageKey,
  filters,
  userId,
  role,
  onFiltersChange,
  onApply,
  onReset,
  className,
  showSaveButton = true,
  showResetButton = true,
  showClearButton = true,
  autoApply = true
}) => {
  const {
    filterState,
    setFilter,
    setFilters,
    resetFilters,
    clearFilters,
    saveFilters,
    hasUnsavedChanges,
    isLoading
  } = usePersistentFilters({
    storageKey,
    filters,
    userId,
    role,
    autoSave: true
  });

  const handleFilterChange = (key: string, value: any) => {
    setFilter(key, value);
    onFiltersChange?.(filterState);
    
    if (autoApply) {
      onApply?.(filterState);
    }
  };

  const handleApply = () => {
    onApply?.(filterState);
  };

  const handleReset = () => {
    resetFilters();
    onReset?.();
    onFiltersChange?.(filterState);
    
    if (autoApply) {
      onApply?.(filterState);
    }
  };

  const handleClear = () => {
    clearFilters();
    onFiltersChange?.(filterState);
    
    if (autoApply) {
      onApply?.(filterState);
    }
  };

  const renderFilterInput = (filter: FilterConfig) => {
    const value = filterState[filter.key] || filter.defaultValue;

    switch (filter.type) {
      case 'text':
        return (
          <FormField
            key={filter.key}
            label={filter.key.charAt(0).toUpperCase() + filter.key.slice(1)}
            value={value || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            placeholder={`Filtrar por ${filter.key}...`}
            leftIcon={<Search className="h-4 w-4" />}
          />
        );

      case 'select':
        return (
          <div key={filter.key} className="space-y-2">
            <label className="text-sm font-medium">
              {filter.key.charAt(0).toUpperCase() + filter.key.slice(1)}
            </label>
            <select
              value={value || ''}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos</option>
              {filter.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'multiselect':
        return (
          <div key={filter.key} className="space-y-2">
            <label className="text-sm font-medium">
              {filter.key.charAt(0).toUpperCase() + filter.key.slice(1)}
            </label>
            <div className="space-y-2">
              {filter.options?.map(option => (
                <label key={option.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={Array.isArray(value) ? value.includes(option.value) : false}
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      const newValues = e.target.checked
                        ? [...currentValues, option.value]
                        : currentValues.filter((v: any) => v !== option.value);
                      handleFilterChange(filter.key, newValues);
                    }}
                    className="rounded border-input"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'date':
        return (
          <FormField
            key={filter.key}
            label={filter.key.charAt(0).toUpperCase() + filter.key.slice(1)}
            type="date"
            value={value || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
          />
        );

      case 'number':
        return (
          <FormField
            key={filter.key}
            label={filter.key.charAt(0).toUpperCase() + filter.key.slice(1)}
            type="number"
            value={value || ''}
            onChange={(e) => handleFilterChange(filter.key, Number(e.target.value))}
            placeholder={`Filtrar por ${filter.key}...`}
          />
        );

      case 'boolean':
        return (
          <div key={filter.key} className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={value || false}
                onChange={(e) => handleFilterChange(filter.key, e.target.checked)}
                className="rounded border-input"
              />
              <span className="text-sm font-medium">
                {filter.key.charAt(0).toUpperCase() + filter.key.slice(1)}
              </span>
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">Cargando filtros...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          {hasUnsavedChanges && (
            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
              Cambios sin guardar
            </span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filter Inputs */}
        <div className="space-y-4">
          {filters.map(renderFilterInput)}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
          {!autoApply && (
            <Button
              onClick={handleApply}
              size="sm"
              leftIcon={<Search className="h-4 w-4" />}
            >
              Aplicar
            </Button>
          )}
          
          {showResetButton && (
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw className="h-4 w-4" />}
            >
              Restablecer
            </Button>
          )}
          
          {showClearButton && (
            <Button
              onClick={handleClear}
              variant="outline"
              size="sm"
              leftIcon={<X className="h-4 w-4" />}
            >
              Limpiar
            </Button>
          )}
          
          {showSaveButton && hasUnsavedChanges && (
            <Button
              onClick={saveFilters}
              variant="secondary"
              size="sm"
              leftIcon={<Save className="h-4 w-4" />}
            >
              Guardar
            </Button>
          )}
        </div>

        {/* Active Filters Summary */}
        {Object.keys(filterState).length > 0 && (
          <div className="pt-4 border-t border-border">
            <div className="text-sm text-muted-foreground mb-2">Filtros activos:</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(filterState).map(([key, value]) => {
                if (value === undefined || value === '' || value === null) return null;
                
                const filter = filters.find(f => f.key === key);
                const displayValue = Array.isArray(value) 
                  ? value.join(', ') 
                  : filter?.options?.find(opt => opt.value === value)?.label || value;
                
                return (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md"
                  >
                    {key}: {displayValue}
                    <button
                      onClick={() => handleFilterChange(key, filter?.defaultValue)}
                      className="hover:text-primary/70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { FilterPanel };
