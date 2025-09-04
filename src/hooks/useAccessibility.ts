import { useEffect, useCallback, useRef } from 'react';

export interface AccessibilityOptions {
  enableKeyboardNavigation?: boolean;
  enableScreenReader?: boolean;
  enableFocusManagement?: boolean;
  skipToContentId?: string;
}

export const useAccessibility = (options: AccessibilityOptions = {}) => {
  const {
    enableKeyboardNavigation = true,
    enableScreenReader = true,
    enableFocusManagement = true,
    skipToContentId = 'main-content'
  } = options;

  const focusableElementsRef = useRef<HTMLElement[]>([]);

  // Función para obtener todos los elementos enfocables
  const getFocusableElements = useCallback(() => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ];

    const elements = document.querySelectorAll(focusableSelectors.join(', '));
    return Array.from(elements) as HTMLElement[];
  }, []);

  // Función para manejar navegación por teclado
  const handleKeyboardNavigation = useCallback((event: KeyboardEvent) => {
    if (!enableKeyboardNavigation) return;

    const focusableElements = getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

    switch (event.key) {
      case 'Tab':
        // Permitir navegación estándar con Tab
        break;
      
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % focusableElements.length;
        focusableElements[nextIndex]?.focus();
        break;
      
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        const prevIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
        focusableElements[prevIndex]?.focus();
        break;
      
      case 'Home':
        event.preventDefault();
        focusableElements[0]?.focus();
        break;
      
      case 'End':
        event.preventDefault();
        focusableElements[focusableElements.length - 1]?.focus();
        break;
      
      case 'Enter':
      case ' ':
        // Permitir activación estándar
        break;
    }
  }, [enableKeyboardNavigation, getFocusableElements]);

  // Función para manejar gestión de foco
  const handleFocusManagement = useCallback(() => {
    if (!enableFocusManagement) return;

    // Guardar elementos enfocables
    focusableElementsRef.current = getFocusableElements();

    // Asegurar que al menos un elemento sea enfocable
    if (focusableElementsRef.current.length === 0) {
      console.warn('No se encontraron elementos enfocables en la página');
    }
  }, [enableFocusManagement, getFocusableElements]);

  // Función para saltar al contenido principal
  const skipToContent = useCallback(() => {
    const mainContent = document.getElementById(skipToContentId);
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  }, [skipToContentId]);

  // Función para anunciar cambios a lectores de pantalla
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!enableScreenReader) return;

    // Crear elemento de anuncio para lectores de pantalla
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only'; // Clase CSS para ocultar visualmente
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remover después de un tiempo
    setTimeout(() => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement);
      }
    }, 1000);
  }, [enableScreenReader]);

  // Función para validar accesibilidad de formularios
  const validateFormAccessibility = useCallback((formElement: HTMLFormElement) => {
    const inputs = formElement.querySelectorAll('input, select, textarea');
    const issues: string[] = [];

    inputs.forEach((input, index) => {
      const element = input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      
      // Verificar si tiene label o aria-label
      if (!element.hasAttribute('aria-label') && !element.hasAttribute('aria-labelledby')) {
        const label = formElement.querySelector(`label[for="${element.id}"]`);
        if (!label) {
          issues.push(`Input ${index + 1} no tiene label ni aria-label`);
        }
      }

      // Verificar si tiene descripción para errores
      if (element.hasAttribute('aria-invalid') && element.getAttribute('aria-invalid') === 'true') {
        if (!element.hasAttribute('aria-describedby')) {
          issues.push(`Input ${index + 1} con error no tiene descripción`);
        }
      }
    });

    return issues;
  }, []);

  // Efecto para configurar navegación por teclado
  useEffect(() => {
    if (enableKeyboardNavigation) {
      document.addEventListener('keydown', handleKeyboardNavigation);
      
      return () => {
        document.removeEventListener('keydown', handleKeyboardNavigation);
      };
    }
  }, [enableKeyboardNavigation, handleKeyboardNavigation]);

  // Efecto para configurar gestión de foco
  useEffect(() => {
    if (enableFocusManagement) {
      handleFocusManagement();
      
      // Observar cambios en el DOM para actualizar elementos enfocables
      const observer = new MutationObserver(handleFocusManagement);
      observer.observe(document.body, { childList: true, subtree: true });
      
      return () => {
        observer.disconnect();
      };
    }
  }, [enableFocusManagement, handleFocusManagement]);

  // Efecto para configurar skip to content
  useEffect(() => {
    if (enableKeyboardNavigation) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Tab' && event.shiftKey) {
          // Cuando se presiona Shift+Tab desde el primer elemento, mostrar skip link
          const skipLink = document.getElementById('skip-to-content');
          if (skipLink) {
            skipLink.style.display = 'block';
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [enableKeyboardNavigation]);

  return {
    skipToContent,
    announceToScreenReader,
    validateFormAccessibility,
    getFocusableElements,
    focusableElements: focusableElementsRef.current
  };
};

// Hook específico para formularios
export const useFormAccessibility = () => {
  const validateForm = useCallback((formElement: HTMLFormElement) => {
    const issues: string[] = [];
    
    // Validar que todos los campos requeridos tengan labels
    const requiredFields = formElement.querySelectorAll('[required]');
    requiredFields.forEach((field, index) => {
      const element = field as HTMLElement;
      if (!element.hasAttribute('aria-label') && !element.hasAttribute('aria-labelledby')) {
        const label = formElement.querySelector(`label[for="${element.id}"]`);
        if (!label) {
          issues.push(`Campo requerido ${index + 1} no tiene label`);
        }
      }
    });

    // Validar que los campos con errores tengan descripciones
    const invalidFields = formElement.querySelectorAll('[aria-invalid="true"]');
    invalidFields.forEach((field, index) => {
      if (!field.hasAttribute('aria-describedby')) {
        issues.push(`Campo con error ${index + 1} no tiene descripción`);
      }
    });

    return issues;
  }, []);

  const announceFormError = useCallback((fieldName: string, errorMessage: string) => {
    // Anunciar error a lectores de pantalla
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'assertive');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Error en ${fieldName}: ${errorMessage}`;

    document.body.appendChild(announcement);
    
    setTimeout(() => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement);
      }
    }, 3000);
  }, []);

  return {
    validateForm,
    announceFormError
  };
};
