import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FixedSizeList as List, VariableSizeList, ListChildComponentProps } from 'react-window';
import { cn } from '@/lib/utils';

// =====================================================
// COMPONENTE DE LISTA VIRTUALIZADA
// =====================================================

interface VirtualizedListProps<T> {
  items: T[];
  height: number;
  itemHeight?: number | ((index: number) => number);
  width?: number | string;
  className?: string;
  renderItem: (props: { index: number; style: React.CSSProperties; item: T }) => React.ReactNode;
  onScroll?: (scrollOffset: number) => void;
  overscanCount?: number;
  direction?: 'vertical' | 'horizontal';
  itemKey?: (index: number, item: T) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  loadingComponent?: React.ReactNode;
}

export function VirtualizedList<T>({
  items,
  height,
  itemHeight = 50,
  width = '100%',
  className,
  renderItem,
  onScroll,
  overscanCount = 5,
  direction = 'vertical',
  itemKey,
  loading = false,
  emptyMessage = 'No hay elementos para mostrar',
  loadingComponent
}: VirtualizedListProps<T>) {
  const listRef = useRef<List | VariableSizeList>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  // Memoizar el componente de item para evitar re-renders innecesarios
  const ItemComponent = useCallback(({ index, style }: ListChildComponentProps) => {
    const item = items[index];
    
    if (!item) {
      return (
        <div style={style} className="flex items-center justify-center p-4">
          <div className="animate-pulse bg-gray-200 rounded h-4 w-full" />
        </div>
      );
    }

    return (
      <div style={style}>
        {renderItem({ index, style, item })}
      </div>
    );
  }, [items, renderItem]);

  // Memoizar la función de altura del item
  const getItemSize = useCallback((index: number) => {
    if (typeof itemHeight === 'function') {
      return itemHeight(index);
    }
    return itemHeight;
  }, [itemHeight]);

  // Memoizar la función de key del item
  const getItemKey = useCallback((index: number) => {
    if (itemKey) {
      return itemKey(index, items[index]);
    }
    return index;
  }, [itemKey, items]);

  // Manejar scroll con debounce
  const handleScroll = useCallback(({ scrollOffset }: { scrollOffset: number }) => {
    setIsScrolling(true);
    
    if (onScroll) {
      onScroll(scrollOffset);
    }

    // Reset scrolling state after a delay
    setTimeout(() => setIsScrolling(false), 150);
  }, [onScroll]);

  // Scroll to item
  const scrollToItem = useCallback((index: number) => {
    if (listRef.current) {
      listRef.current.scrollToItem(index, 'start');
    }
  }, []);

  // Scroll to offset
  const scrollToOffset = useCallback((offset: number) => {
    if (listRef.current) {
      listRef.current.scrollTo(offset);
    }
  }, []);

  // Exponer métodos útiles
  useEffect(() => {
    if (listRef.current) {
      (listRef.current as any).scrollToItem = scrollToItem;
      (listRef.current as any).scrollToOffset = scrollToOffset;
    }
  }, [scrollToItem, scrollToOffset]);

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height, width }}>
        {loadingComponent || (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Cargando...</p>
          </div>
        )}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height, width }}>
        <div className="text-center">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  const ListComponent = typeof itemHeight === 'function' ? VariableSizeList : List;

  return (
    <div className={cn('virtualized-list', className)}>
      <ListComponent
        ref={listRef}
        height={height}
        width={width}
        itemCount={items.length}
        itemSize={getItemSize}
        itemKey={getItemKey}
        onScroll={handleScroll}
        overscanCount={overscanCount}
        direction={direction}
        className={cn(
          'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100',
          isScrolling && 'scrollbar-thumb-gray-400'
        )}
      >
        {ItemComponent}
      </ListComponent>
    </div>
  );
}

// =====================================================
// HOOK PARA VIRTUALIZACIÓN
// =====================================================

export const useVirtualization = <T>(
  items: T[],
  options: {
    itemHeight?: number | ((index: number) => number);
    containerHeight?: number;
    overscanCount?: number;
  } = {}
) => {
  const {
    itemHeight = 50,
    containerHeight = 400,
    overscanCount = 5
  } = options;

  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });
  const [scrollOffset, setScrollOffset] = useState(0);

  const handleScroll = useCallback((offset: number) => {
    setScrollOffset(offset);
    
    const start = Math.floor(offset / (typeof itemHeight === 'function' ? itemHeight(0) : itemHeight));
    const visibleCount = Math.ceil(containerHeight / (typeof itemHeight === 'function' ? itemHeight(0) : itemHeight));
    const end = Math.min(start + visibleCount + overscanCount, items.length - 1);

    setVisibleRange({ start: Math.max(0, start - overscanCount), end });
  }, [itemHeight, containerHeight, overscanCount, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1);
  }, [items, visibleRange]);

  const totalHeight = useMemo(() => {
    if (typeof itemHeight === 'function') {
      return items.reduce((total, _, index) => total + itemHeight(index), 0);
    }
    return items.length * itemHeight;
  }, [items.length, itemHeight]);

  return {
    visibleItems,
    visibleRange,
    scrollOffset,
    totalHeight,
    handleScroll,
    itemHeight: typeof itemHeight === 'function' ? itemHeight : () => itemHeight
  };
};

// =====================================================
// COMPONENTE DE LISTA VIRTUALIZADA PARA PROYECTOS
// =====================================================

interface ProjectItem {
  id: string;
  title: string;
  description: string;
  status: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

interface VirtualizedProjectListProps {
  projects: ProjectItem[];
  height?: number;
  onProjectClick?: (project: ProjectItem) => void;
  onProjectEdit?: (project: ProjectItem) => void;
  onProjectDelete?: (project: ProjectItem) => void;
  loading?: boolean;
}

export function VirtualizedProjectList({
  projects,
  height = 600,
  onProjectClick,
  onProjectEdit,
  onProjectDelete,
  loading = false
}: VirtualizedProjectListProps) {
  const renderProjectItem = useCallback(({ index, style, item }: { index: number; style: React.CSSProperties; item: ProjectItem }) => {
    return (
      <div style={style} className="px-4 py-2">
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
            <span className={cn(
              'px-2 py-1 rounded-full text-xs font-medium',
              item.status === 'completed' && 'bg-green-100 text-green-800',
              item.status === 'in-progress' && 'bg-blue-100 text-blue-800',
              item.status === 'pending' && 'bg-yellow-100 text-yellow-800',
              item.status === 'cancelled' && 'bg-red-100 text-red-800'
            )}>
              {item.status}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Progreso</span>
                <span>{item.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onProjectEdit?.(item);
                }}
                className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onProjectDelete?.(item);
                }}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="mt-3 text-xs text-gray-500">
            Creado: {new Date(item.createdAt).toLocaleDateString()}
            {item.updatedAt !== item.createdAt && (
              <span className="ml-2">
                Actualizado: {new Date(item.updatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }, [onProjectClick, onProjectEdit, onProjectDelete]);

  return (
    <VirtualizedList
      items={projects}
      height={height}
      itemHeight={120} // Altura fija para cada proyecto
      renderItem={renderProjectItem}
      loading={loading}
      emptyMessage="No hay proyectos para mostrar"
      className="border border-gray-200 rounded-lg"
    />
  );
}

// =====================================================
// COMPONENTE DE LISTA VIRTUALIZADA PARA TUTORIALES
// =====================================================

interface TutorialItem {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  completed: boolean;
  progress: number;
}

interface VirtualizedTutorialListProps {
  tutorials: TutorialItem[];
  height?: number;
  onTutorialClick?: (tutorial: TutorialItem) => void;
  onTutorialStart?: (tutorial: TutorialItem) => void;
  loading?: boolean;
}

export function VirtualizedTutorialList({
  tutorials,
  height = 500,
  onTutorialClick,
  onTutorialStart,
  loading = false
}: VirtualizedTutorialListProps) {
  const renderTutorialItem = useCallback(({ index, style, item }: { index: number; style: React.CSSProperties; item: TutorialItem }) => {
    return (
      <div style={style} className="px-4 py-2">
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{item.description}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  {item.category}
                </span>
                <span>⏱️ {item.duration} min</span>
                {item.completed && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    ✅ Completado
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {!item.completed && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Progreso</span>
                <span>{item.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onTutorialClick?.(item)}
              className="flex-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              Ver detalles
            </button>
            {!item.completed && (
              <button
                onClick={() => onTutorialStart?.(item)}
                className="flex-1 px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
              >
                {item.progress > 0 ? 'Continuar' : 'Comenzar'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }, [onTutorialClick, onTutorialStart]);

  return (
    <VirtualizedList
      items={tutorials}
      height={height}
      itemHeight={140} // Altura fija para cada tutorial
      renderItem={renderTutorialItem}
      loading={loading}
      emptyMessage="No hay tutoriales disponibles"
      className="border border-gray-200 rounded-lg"
    />
  );
}
