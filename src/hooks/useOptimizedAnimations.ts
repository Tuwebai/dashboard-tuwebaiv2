import React from 'react';
import { useState, useEffect, useCallback } from 'react';

// =====================================================
// HOOK PARA ANIMACIONES OPTIMIZADAS SIN FRAMER MOTION
// =====================================================

interface AnimationConfig {
  duration?: number;
  easing?: string;
  delay?: number;
}

interface UseOptimizedAnimationsReturn {
  isVisible: boolean;
  isAnimating: boolean;
  animateIn: () => void;
  animateOut: () => void;
  toggleAnimation: () => void;
  getAnimationStyles: (config?: AnimationConfig) => React.CSSProperties;
}

export const useOptimizedAnimations = (
  initialVisible = false,
  defaultConfig: AnimationConfig = {}
): UseOptimizedAnimationsReturn => {
  const [isVisible, setIsVisible] = useState(initialVisible);
  const [isAnimating, setIsAnimating] = useState(false);

  const {
    duration = 300,
    easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
    delay = 0
  } = defaultConfig;

  const animateIn = useCallback(() => {
    if (isVisible) return;
    
    setIsAnimating(true);
    setIsVisible(true);
    
    // Limpiar animación después de completarse
    setTimeout(() => {
      setIsAnimating(false);
    }, duration + delay);
  }, [isVisible, duration, delay]);

  const animateOut = useCallback(() => {
    if (!isVisible) return;
    
    setIsAnimating(true);
    
    // Esperar a que termine la animación antes de ocultar
    setTimeout(() => {
      setIsVisible(false);
      setIsAnimating(false);
    }, duration);
  }, [isVisible, duration]);

  const toggleAnimation = useCallback(() => {
    if (isVisible) {
      animateOut();
    } else {
      animateIn();
    }
  }, [isVisible, animateIn, animateOut]);

  const getAnimationStyles = useCallback((config: AnimationConfig = {}): React.CSSProperties => {
    const {
      duration: customDuration = duration,
      easing: customEasing = easing,
      delay: customDelay = delay
    } = config;

    return {
      transition: `all ${customDuration}ms ${customEasing}`,
      transitionDelay: `${customDelay}ms`,
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.95)',
    };
  }, [isVisible, duration, easing, delay]);

  return {
    isVisible,
    isAnimating,
    animateIn,
    animateOut,
    toggleAnimation,
    getAnimationStyles,
  };
};

// Hook específico para animaciones de entrada/salida
export const useFadeInOut = (duration = 300) => {
  return useOptimizedAnimations(false, { duration });
};

// Hook específico para animaciones de escala
export const useScaleAnimation = (duration = 200) => {
  const animation = useOptimizedAnimations(false, { duration });
  
  const getScaleStyles = useCallback((config: AnimationConfig = {}): React.CSSProperties => {
    const baseStyles = animation.getAnimationStyles(config);
    return {
      ...baseStyles,
      transform: animation.isVisible ? 'scale(1)' : 'scale(0.8)',
    };
  }, [animation]);

  return {
    ...animation,
    getScaleStyles,
  };
};

// Hook específico para animaciones de deslizamiento
export const useSlideAnimation = (direction: 'up' | 'down' | 'left' | 'right' = 'up', duration = 300) => {
  const animation = useOptimizedAnimations(false, { duration });
  
  const getSlideStyles = useCallback((config: AnimationConfig = {}): React.CSSProperties => {
    const baseStyles = animation.getAnimationStyles(config);
    
    const transforms = {
      up: animation.isVisible ? 'translateY(0)' : 'translateY(20px)',
      down: animation.isVisible ? 'translateY(0)' : 'translateY(-20px)',
      left: animation.isVisible ? 'translateX(0)' : 'translateX(20px)',
      right: animation.isVisible ? 'translateX(0)' : 'translateX(-20px)',
    };

    return {
      ...baseStyles,
      transform: transforms[direction],
    };
  }, [animation, direction]);

  return {
    ...animation,
    getSlideStyles,
  };
};
