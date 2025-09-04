import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from '@/components/OptimizedMotion';

interface VirtualScrollListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
}

export default function VirtualScrollList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = '',
  onScroll,
  loading = false,
  loadingComponent,
  emptyComponent
}: VirtualScrollListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Calcular elementos visibles
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Elementos visibles
  const visibleItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index
    }));
  }, [items, visibleRange]);

  // Altura total del contenido
  const totalHeight = items.length * itemHeight;

  // Offset para elementos visibles
  const offsetY = visibleRange.startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const newScrollTop = target.scrollTop;
    
    setScrollTop(newScrollTop);
    setIsScrolling(true);
    
    // Limpiar timeout anterior
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Marcar como no scrolleando después de un delay
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
    
    onScroll?.(newScrollTop);
  }, [onScroll]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ height: containerHeight }}
      >
        {loadingComponent || (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-slate-600">Cargando...</span>
          </div>
        )}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ height: containerHeight }}
      >
        {emptyComponent || (
          <div className="text-center text-slate-500">
            <p>No hay elementos para mostrar</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* Contenedor con altura total para scrollbar */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Lista de elementos visibles */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          <AnimatePresence>
            {visibleItems.map(({ item, index }) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                style={{ height: itemHeight }}
                className={`${isScrolling ? 'pointer-events-none' : ''}`}
              >
                {renderItem(item, index)}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Hook para virtual scrolling con datos dinámicos
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  options: {
    overscan?: number;
    onLoadMore?: () => void;
    hasMore?: boolean;
    loading?: boolean;
  } = {}
) {
  const { overscan = 5, onLoadMore, hasMore = false, loading = false } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const [isNearBottom, setIsNearBottom] = useState(false);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const handleScroll = useCallback((newScrollTop: number) => {
    setScrollTop(newScrollTop);
    
    // Verificar si está cerca del final
    const scrollPercentage = (newScrollTop + containerHeight) / (items.length * itemHeight);
    const nearBottom = scrollPercentage > 0.8;
    
    if (nearBottom && !isNearBottom && hasMore && !loading) {
      setIsNearBottom(true);
      onLoadMore?.();
    } else if (!nearBottom) {
      setIsNearBottom(false);
    }
  }, [containerHeight, items.length, itemHeight, isNearBottom, hasMore, loading, onLoadMore]);

  return {
    visibleRange,
    handleScroll,
    isNearBottom
  };
}

// Componente de placeholder para elementos que se están cargando
export function VirtualScrollPlaceholder({ height }: { height: number }) {
  return (
    <div 
      style={{ height }}
      className="flex items-center justify-center bg-slate-100 rounded-lg animate-pulse"
    >
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-slate-300 rounded-full"></div>
        <div className="space-y-2">
          <div className="w-32 h-4 bg-slate-300 rounded"></div>
          <div className="w-24 h-3 bg-slate-300 rounded"></div>
        </div>
      </div>
    </div>
  );
}
