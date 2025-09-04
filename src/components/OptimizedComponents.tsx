import React, { memo, useMemo, useCallback, forwardRef } from 'react';
import { cn } from '@/lib/utils';

// =====================================================
// COMPONENTES OPTIMIZADOS CON REACT.MEMO
// =====================================================

// Componente de botón optimizado
interface OptimizedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const OptimizedButton = memo<OptimizedButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}) => {
  const buttonClasses = useMemo(() => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    
    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
      outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
    };
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm rounded-md',
      md: 'px-4 py-2 text-base rounded-md',
      lg: 'px-6 py-3 text-lg rounded-lg'
    };
    
    return cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className
    );
  }, [variant, size, className]);

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {icon && !loading && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
});

OptimizedButton.displayName = 'OptimizedButton';

// Componente de card optimizado
interface OptimizedCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg';
}

export const OptimizedCard = memo<OptimizedCardProps>(({
  children,
  className,
  hover = false,
  padding = 'md',
  shadow = 'md'
}) => {
  const cardClasses = useMemo(() => {
    const baseClasses = 'bg-white rounded-lg border border-gray-200';
    
    const paddingClasses = {
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6'
    };
    
    const shadowClasses = {
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg'
    };
    
    const hoverClasses = hover ? 'hover:shadow-lg transition-shadow duration-200' : '';
    
    return cn(
      baseClasses,
      paddingClasses[padding],
      shadowClasses[shadow],
      hoverClasses,
      className
    );
  }, [className, hover, padding, shadow]);

  return (
    <div className={cardClasses}>
      {children}
    </div>
  );
});

OptimizedCard.displayName = 'OptimizedCard';

// Componente de input optimizado
interface OptimizedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const OptimizedInput = memo<OptimizedInputProps>(({
  label,
  error,
  helperText,
  icon,
  iconPosition = 'left',
  className,
  ...props
}) => {
  const inputClasses = useMemo(() => {
    const baseClasses = 'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors';
    
    const stateClasses = error 
      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500';
    
    const iconClasses = icon 
      ? (iconPosition === 'left' ? 'pl-10' : 'pr-10')
      : '';
    
    return cn(baseClasses, stateClasses, iconClasses, className);
  }, [error, icon, iconPosition, className]);

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">{icon}</span>
          </div>
        )}
        
        <input
          className={inputClasses}
          {...props}
        />
        
        {icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-400">{icon}</span>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

OptimizedInput.displayName = 'OptimizedInput';

// Componente de lista optimizado
interface OptimizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
  loadingComponent?: React.ReactNode;
}

export const OptimizedList = memo<OptimizedListProps<any>>(({
  items,
  renderItem,
  keyExtractor,
  className,
  emptyMessage = 'No hay elementos para mostrar',
  loading = false,
  loadingComponent
}) => {
  const memoizedItems = useMemo(() => {
    return items.map((item, index) => ({
      item,
      index,
      key: keyExtractor(item, index)
    }));
  }, [items, keyExtractor]);

  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        {loadingComponent || (
          <div className="animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-full" />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={cn('text-center py-8 text-gray-500', className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {memoizedItems.map(({ item, index, key }) => (
        <div key={key}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
});

OptimizedList.displayName = 'OptimizedList';

// Componente de modal optimizado
interface OptimizedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const OptimizedModal = memo<OptimizedModalProps>(({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className
}) => {
  const modalClasses = useMemo(() => {
    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl'
    };
    
    return cn(
      'bg-white rounded-lg shadow-xl',
      sizeClasses[size],
      className
    );
  }, [size, className]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handleEscapeKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscapeKey]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleBackdropClick}
      />
      
      <div className={modalClasses}>
        {title && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
        )}
        
        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
});

OptimizedModal.displayName = 'OptimizedModal';

// Componente de tabla optimizado
interface OptimizedTableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T | string;
    title: string;
    render?: (value: any, item: T, index: number) => React.ReactNode;
    sortable?: boolean;
    width?: string;
  }>;
  className?: string;
  loading?: boolean;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
}

export const OptimizedTable = memo<OptimizedTableProps<any>>(({
  data,
  columns,
  className,
  loading = false,
  onSort,
  sortKey,
  sortDirection
}) => {
  const handleSort = useCallback((key: string) => {
    if (onSort) {
      const direction = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
      onSort(key, direction);
    }
  }, [onSort, sortKey, sortDirection]);

  const renderCell = useCallback((column: any, item: any, index: number) => {
    const value = typeof column.key === 'string' ? item[column.key] : column.key;
    
    if (column.render) {
      return column.render(value, item, index);
    }
    
    return value;
  }, []);

  if (loading) {
    return (
      <div className={cn('overflow-hidden', className)}>
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded mb-2" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-100 rounded mb-1" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={cn(
                  'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                  column.sortable && 'cursor-pointer hover:bg-gray-100',
                  column.width && `w-${column.width}`
                )}
                onClick={() => column.sortable && handleSort(String(column.key))}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.title}</span>
                  {column.sortable && (
                    <span className="text-gray-400">
                      {sortKey === column.key ? (
                        sortDirection === 'asc' ? '↑' : '↓'
                      ) : (
                        '↕'
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50">
              {columns.map((column) => (
                <td
                  key={String(column.key)}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {renderCell(column, item, index)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

OptimizedTable.displayName = 'OptimizedTable';

// =====================================================
// HOOKS DE OPTIMIZACIÓN
// =====================================================

// Hook para memoizar valores costosos
export const useExpensiveValue = <T>(factory: () => T, deps: React.DependencyList): T => {
  return useMemo(factory, deps);
};

// Hook para memoizar callbacks
export const useStableCallback = <T extends (...args: any[]) => any>(callback: T): T => {
  return useCallback(callback, []);
};

// Hook para memoizar objetos
export const useStableObject = <T extends Record<string, any>>(obj: T): T => {
  return useMemo(() => obj, Object.values(obj));
};

// Hook para memoizar arrays
export const useStableArray = <T>(arr: T[]): T[] => {
  return useMemo(() => arr, arr);
};

// =====================================================
// HOC PARA OPTIMIZACIÓN AUTOMÁTICA
// =====================================================

export const withOptimization = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    areEqual?: (prevProps: P, nextProps: P) => boolean;
    displayName?: string;
  } = {}
) => {
  const OptimizedComponent = memo(Component, options.areEqual);
  
  if (options.displayName) {
    OptimizedComponent.displayName = options.displayName;
  }
  
  return OptimizedComponent;
};

// =====================================================
// UTILIDADES DE OPTIMIZACIÓN
// =====================================================

// Función para comparar props profundamente
export const deepEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  
  if (a == null || b == null) return false;
  
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object') return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  
  return true;
};

// Función para crear comparador personalizado
export const createCustomComparator = <P extends object>(
  compareKeys: (keyof P)[]
) => {
  return (prevProps: P, nextProps: P): boolean => {
    return compareKeys.every(key => deepEqual(prevProps[key], nextProps[key]));
  };
};
