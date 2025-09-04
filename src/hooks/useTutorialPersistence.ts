import { useEffect, useCallback, useRef } from 'react';
import { TutorialProgress } from '@/contexts/TutorialContext';

// =====================================================
// HOOK PARA PERSISTENCIA Y SINCRONIZACIÓN
// =====================================================

interface UseTutorialPersistenceOptions {
  flowId: string;
  currentStep: number;
  completedSteps: string[];
  skippedSteps: string[];
  timeSpent: number;
}

export const useTutorialPersistence = (options: UseTutorialPersistenceOptions) => {
  const {
    flowId,
    currentStep,
    completedSteps,
    skippedSteps,
    timeSpent,
  } = options;

  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>(Date.now());
  const lastSaveRef = useRef<string>('');

  // Debounced save function
  const saveProgress = useCallback((progress: TutorialProgress) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        const progressString = JSON.stringify(progress);
        
        // Solo guardar si ha cambiado
        if (progressString !== lastSaveRef.current) {
          localStorage.setItem('tutorial-progress', progressString);
          lastSaveRef.current = progressString;
          
          // Notificar a otras pestañas
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'tutorial-progress',
            newValue: progressString,
            oldValue: lastSaveRef.current,
            storageArea: localStorage,
          }));
        }
      } catch (error) {
        console.error('Error saving tutorial progress:', error);
      }
    }, 300); // Debounce de 300ms
  }, []);

  // Cargar progreso persistente
  const loadProgress = useCallback((): TutorialProgress | null => {
    try {
      const saved = localStorage.getItem('tutorial-progress');
      if (saved) {
        const progress: TutorialProgress = JSON.parse(saved);
        return progress;
      }
    } catch (error) {
      console.error('Error loading tutorial progress:', error);
    }
    return null;
  }, []);

  // Cargar flujos completados
  const loadCompletedFlows = useCallback((): string[] => {
    try {
      const saved = localStorage.getItem('tutorial-completed-flows');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading completed flows:', error);
    }
    return [];
  }, []);

  // Guardar flujos completados
  const saveCompletedFlows = useCallback((flows: string[]) => {
    try {
      localStorage.setItem('tutorial-completed-flows', JSON.stringify(flows));
      
      // Notificar a otras pestañas
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'tutorial-completed-flows',
        newValue: JSON.stringify(flows),
        storageArea: localStorage,
      }));
    } catch (error) {
      console.error('Error saving completed flows:', error);
    }
  }, []);

  // Limpiar progreso
  const clearProgress = useCallback(() => {
    try {
      localStorage.removeItem('tutorial-progress');
      lastSaveRef.current = '';
    } catch (error) {
      console.error('Error clearing tutorial progress:', error);
    }
  }, []);

  // Actualizar tiempo transcurrido
  const updateTimeSpent = useCallback(() => {
    const now = Date.now();
    const elapsed = Math.round((now - startTimeRef.current) / 1000);
    return elapsed;
  }, []);

  // Guardar progreso automáticamente cuando cambian las props
  useEffect(() => {
    const progress: TutorialProgress = {
      flowId,
      currentStep,
      completedSteps,
      startedAt: new Date().toISOString(),
      skippedSteps,
      timeSpent: timeSpent + updateTimeSpent(),
    };

    saveProgress(progress);
  }, [flowId, currentStep, completedSteps, skippedSteps, timeSpent, saveProgress, updateTimeSpent]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Sincronización entre pestañas
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tutorial-progress' && e.newValue) {
        try {
          const progress: TutorialProgress = JSON.parse(e.newValue);
          // Solo actualizar si es del mismo flujo
          if (progress.flowId === flowId) {
            lastSaveRef.current = e.newValue;
          }
        } catch (error) {
          console.error('Error syncing tutorial progress:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [flowId]);

  return {
    loadProgress,
    saveProgress,
    loadCompletedFlows,
    saveCompletedFlows,
    clearProgress,
    updateTimeSpent,
  };
};
