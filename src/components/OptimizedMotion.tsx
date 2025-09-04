import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useOptimizedAnimations, useFadeInOut, useScaleAnimation, useSlideAnimation } from '@/hooks/useOptimizedAnimations';

// =====================================================
// COMPONENTES DE ANIMACIÓN OPTIMIZADOS SIN FRAMER MOTION
// =====================================================

interface OptimizedMotionProps {
  children: React.ReactNode;
  initial?: 'hidden' | 'visible';
  animate?: 'hidden' | 'visible';
  exit?: 'hidden' | 'visible';
  transition?: {
    duration?: number;
    delay?: number;
    ease?: string;
  };
  whileHover?: {
    scale?: number;
    y?: number;
    rotate?: number;
  };
  whileTap?: {
    scale?: number;
  };
  className?: string;
  style?: React.CSSProperties;
  onAnimationComplete?: () => void;
}

// Componente principal de animación optimizada
export const OptimizedMotion = React.memo(React.forwardRef<HTMLDivElement, OptimizedMotionProps>(({
  children,
  initial = 'hidden',
  animate = 'visible',
  exit = 'hidden',
  transition = {},
  whileHover,
  whileTap,
  className = '',
  style = {},
  onAnimationComplete,
  ...props
}, ref) => {
  const [isVisible, setIsVisible] = useState(true); // SIEMPRE visible por defecto
  const [isHovered, setIsHovered] = useState(false);
  const [isTapped, setIsTapped] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const {
    duration = 300,
    delay = 0,
    ease = 'cubic-bezier(0.4, 0, 0.2, 1)'
  } = transition;

  // Manejar animación de entrada - SIEMPRE mostrar el componente
  useEffect(() => {
    // Por defecto, siempre mostrar el componente
    setIsVisible(true);
    setShouldRender(true);
    
    // Solo ocultar si explícitamente se solicita
    if (animate === 'hidden') {
      setIsVisible(false);
      // Ocultar después de la animación
      timeoutRef.current = setTimeout(() => {
        setShouldRender(false);
        onAnimationComplete?.();
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [animate, duration, onAnimationComplete]);

  // Manejar hover
  const handleMouseEnter = useCallback(() => {
    if (whileHover) {
      setIsHovered(true);
    }
  }, [whileHover]);

  const handleMouseLeave = useCallback(() => {
    if (whileHover) {
      setIsHovered(false);
    }
  }, [whileHover]);

  // Manejar tap
  const handleMouseDown = useCallback(() => {
    if (whileTap) {
      setIsTapped(true);
    }
  }, [whileTap]);

  const handleMouseUp = useCallback(() => {
    if (whileTap) {
      setTimeout(() => setIsTapped(false), 150);
    }
  }, [whileTap]);

  // Calcular estilos de transformación
  const getTransformStyles = useCallback(() => {
    let transform = '';
    let scale = 1;
    let translateY = 0;
    let translateX = 0;
    let rotate = 0;

    // Aplicar transformaciones de hover
    if (isHovered && whileHover) {
      if (whileHover.scale) scale *= whileHover.scale;
      if (whileHover.y) translateY += whileHover.y;
      if (whileHover.rotate) rotate += whileHover.rotate;
    }

    // Aplicar transformaciones de tap
    if (isTapped && whileTap) {
      if (whileTap.scale) scale *= whileTap.scale;
    }

    // Aplicar transformaciones de visibilidad
    if (!isVisible) {
      scale *= 0.95;
      translateY += 20;
    }

    // Construir string de transformación
    if (scale !== 1) transform += `scale(${scale}) `;
    if (translateY !== 0) transform += `translateY(${translateY}px) `;
    if (translateX !== 0) transform += `translateX(${translateX}px) `;
    if (rotate !== 0) transform += `rotate(${rotate}deg) `;

    return transform.trim();
  }, [isVisible, isHovered, isTapped, whileHover, whileTap]);

  // SIEMPRE renderizar el componente, solo ocultar con CSS
  const animationStyles: React.CSSProperties = {
    transition: `all ${duration}ms ${ease}`,
    transitionDelay: `${delay}ms`,
    opacity: isVisible ? 1 : 0,
    transform: getTransformStyles(),
    ...style,
  };

  return (
    <div
      ref={ref}
      className={className}
      style={animationStyles}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      {...props}
    >
      {children}
    </div>
  );
}));

OptimizedMotion.displayName = 'OptimizedMotion';

// Componente para animaciones de entrada/salida
interface AnimatePresenceProps {
  children: React.ReactNode;
  mode?: 'wait' | 'sync';
}

export const AnimatePresence = React.memo<AnimatePresenceProps>(({ children, mode = 'sync' }) => {
  return <>{children}</>;
});

AnimatePresence.displayName = 'AnimatePresence';

// Componente para animaciones de lista
interface OptimizedReorderProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const OptimizedReorder = React.memo(React.forwardRef<HTMLDivElement, OptimizedReorderProps>(({ children, className, style }, ref) => {
  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}));

OptimizedReorder.displayName = 'OptimizedReorder';

// Componente para elementos reordenables
interface OptimizedReorderItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
  style?: React.CSSProperties;
  whileDrag?: {
    scale?: number;
    rotate?: number;
  };
}

export const OptimizedReorderItem = React.memo(React.forwardRef<HTMLDivElement, OptimizedReorderItemProps>(({ 
  children, 
  value, 
  className, 
  style,
  whileDrag 
}, ref) => {
  const [isDragging, setIsDragging] = useState(false);

  const dragStyles: React.CSSProperties = {
    transition: 'all 0.2s ease',
    transform: isDragging 
      ? `scale(${whileDrag?.scale || 1.05}) rotate(${whileDrag?.rotate || 2}deg)` 
      : 'scale(1) rotate(0deg)',
    ...style,
  };

  return (
    <div
      ref={ref}
      className={className}
      style={dragStyles}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
    >
      {children}
    </div>
  );
}));

OptimizedReorderItem.displayName = 'OptimizedReorderItem';

// Hook para animaciones de lista
export const useOptimizedListAnimation = (items: any[], delay = 100) => {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];
    
    items.forEach((_, index) => {
      const timeout = setTimeout(() => {
        setVisibleItems(prev => new Set([...prev, index]));
      }, index * delay);
      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [items, delay]);

  const getItemStyles = useCallback((index: number) => {
    const isVisible = visibleItems.has(index);
    return {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
      transition: `all 0.3s ease ${index * 50}ms`,
    };
  }, [visibleItems]);

  return { getItemStyles };
};

// Componente para animaciones de página
interface PageTransitionProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
  className?: string;
}

export const PageTransition = React.memo(React.forwardRef<HTMLDivElement, PageTransitionProps>(({ 
  children, 
  direction = 'up', 
  duration = 300,
  className = '' 
}, ref) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const getTransform = () => {
    if (!isVisible) {
      switch (direction) {
        case 'left': return 'translateX(-100%)';
        case 'right': return 'translateX(100%)';
        case 'up': return 'translateY(-100%)';
        case 'down': return 'translateY(100%)';
        default: return 'translateY(-100%)';
      }
    }
    return 'translate(0)';
  };

  const styles: React.CSSProperties = {
    transition: `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    opacity: isVisible ? 1 : 0,
    transform: getTransform(),
  };

  return (
    <div ref={ref} className={className} style={styles}>
      {children}
    </div>
  );
}));

PageTransition.displayName = 'PageTransition';

// Componente para animaciones de modal
interface ModalAnimationProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose?: () => void;
  className?: string;
}

export const ModalAnimation = React.memo(React.forwardRef<HTMLDivElement, ModalAnimationProps>(({ 
  children, 
  isOpen, 
  onClose,
  className = '' 
}, ref) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Pequeño delay para permitir el renderizado
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      // Ocultar después de la animación
      setTimeout(() => setShouldRender(false), 300);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  const styles: React.CSSProperties = {
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'scale(1)' : 'scale(0.95)',
  };

  return (
    <div ref={ref} className={className} style={styles}>
      {children}
    </div>
  );
}));

ModalAnimation.displayName = 'ModalAnimation';

// Exportar todos los componentes como un objeto para facilitar la migración
export const motion = {
  div: OptimizedMotion,
  span: OptimizedMotion,
  p: OptimizedMotion,
  h1: OptimizedMotion,
  h2: OptimizedMotion,
  h3: OptimizedMotion,
  h4: OptimizedMotion,
  h5: OptimizedMotion,
  h6: OptimizedMotion,
  section: OptimizedMotion,
  article: OptimizedMotion,
  header: OptimizedMotion,
  footer: OptimizedMotion,
  nav: OptimizedMotion,
  main: OptimizedMotion,
  aside: OptimizedMotion,
  button: OptimizedMotion,
  a: OptimizedMotion,
  img: OptimizedMotion,
  ul: OptimizedMotion,
  ol: OptimizedMotion,
  li: OptimizedMotion,
  form: OptimizedMotion,
  input: OptimizedMotion,
  textarea: OptimizedMotion,
  select: OptimizedMotion,
  table: OptimizedMotion,
  tr: OptimizedMotion,
  td: OptimizedMotion,
  th: OptimizedMotion,
};

export default OptimizedMotion;
