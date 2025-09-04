import React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { TutorialFlow, TutorialStep, TutorialProgress } from '@/contexts/TutorialContext';

// =====================================================
// HOOK OPTIMIZADO PARA GESTIÓN DE ESTADO DE TUTORIALES
// =====================================================

interface TutorialState {
  isActive: boolean;
  currentFlow: TutorialFlow | null;
  currentStep: TutorialStep | null;
  stepIndex: number;
  completedFlows: string[];
  progress: TutorialProgress | null;
  isLoading: boolean;
  error: string | null;
}

type TutorialAction = 
  | { type: 'START_TUTORIAL'; payload: { flow: TutorialFlow; stepIndex?: number } }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'COMPLETE_TUTORIAL' }
  | { type: 'SKIP_TUTORIAL' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_PROGRESS'; payload: TutorialProgress }
  | { type: 'UPDATE_PROGRESS'; payload: Partial<TutorialProgress> };

const initialState: TutorialState = {
  isActive: false,
  currentFlow: null,
  currentStep: null,
  stepIndex: 0,
  completedFlows: [],
  progress: null,
  isLoading: false,
  error: null,
};

// Reducer optimizado para gestión de estado
const tutorialReducer = (state: TutorialState, action: TutorialAction): TutorialState => {
  switch (action.type) {
    case 'START_TUTORIAL':
      return {
        ...state,
        isActive: true,
        currentFlow: action.payload.flow,
        currentStep: action.payload.flow.steps[action.payload.stepIndex || 0],
        stepIndex: action.payload.stepIndex || 0,
        error: null,
      };

    case 'NEXT_STEP':
      if (!state.currentFlow) return state;
      const nextIndex = state.stepIndex + 1;
      const nextStep = state.currentFlow.steps[nextIndex];
      
      if (nextStep) {
        return {
          ...state,
          stepIndex: nextIndex,
          currentStep: nextStep,
        };
      }
      return state;

    case 'PREV_STEP':
      if (state.stepIndex > 0) {
        const prevIndex = state.stepIndex - 1;
        const prevStep = state.currentFlow?.steps[prevIndex];
        
        return {
          ...state,
          stepIndex: prevIndex,
          currentStep: prevStep || null,
        };
      }
      return state;

    case 'COMPLETE_TUTORIAL':
      if (!state.currentFlow) return state;
      
      return {
        ...state,
        isActive: false,
        completedFlows: [...state.completedFlows, state.currentFlow.id],
        currentFlow: null,
        currentStep: null,
        stepIndex: 0,
        progress: null,
      };

    case 'SKIP_TUTORIAL':
      return {
        ...state,
        isActive: false,
        currentFlow: null,
        currentStep: null,
        stepIndex: 0,
        progress: null,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'LOAD_PROGRESS':
      return {
        ...state,
        progress: action.payload,
      };

    case 'UPDATE_PROGRESS':
      return {
        ...state,
        progress: state.progress ? { ...state.progress, ...action.payload } : null,
      };

    default:
      return state;
  }
};

// Hook principal optimizado
export const useTutorialState = () => {
  const [state, dispatch] = useState(tutorialReducer);
  const eventListenersRef = useRef<(() => void)[]>([]);
  const progressSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Limpiar event listeners al desmontar
  useEffect(() => {
    return () => {
      eventListenersRef.current.forEach(cleanup => cleanup());
      if (progressSaveTimeoutRef.current) {
        clearTimeout(progressSaveTimeoutRef.current);
      }
    };
  }, []);

  // Cargar progreso persistente
  const loadPersistentProgress = useCallback(() => {
    try {
      const savedProgress = localStorage.getItem('tutorial-progress');
      const completedFlows = localStorage.getItem('tutorial-completed-flows');
      
      if (savedProgress) {
        const progress: TutorialProgress = JSON.parse(savedProgress);
        dispatch({ type: 'LOAD_PROGRESS', payload: progress });
      }
      
      if (completedFlows) {
        const flows: string[] = JSON.parse(completedFlows);
        dispatch({ type: 'LOAD_PROGRESS', payload: { completedFlows: flows } as any });
      }
    } catch (error) {
      console.error('Error loading tutorial progress:', error);
    }
  }, []);

  // Guardar progreso persistente
  const savePersistentProgress = useCallback((progress: TutorialProgress) => {
    try {
      localStorage.setItem('tutorial-progress', JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving tutorial progress:', error);
    }
  }, []);

  // Guardar flujos completados
  const saveCompletedFlows = useCallback((flows: string[]) => {
    try {
      localStorage.setItem('tutorial-completed-flows', JSON.stringify(flows));
    } catch (error) {
      console.error('Error saving completed flows:', error);
    }
  }, []);

  // Sincronización entre pestañas
  const setupTabSync = useCallback(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tutorial-progress' && e.newValue) {
        try {
          const progress: TutorialProgress = JSON.parse(e.newValue);
          dispatch({ type: 'LOAD_PROGRESS', payload: progress });
        } catch (error) {
          console.error('Error syncing tutorial progress:', error);
        }
      }
      
      if (e.key === 'tutorial-completed-flows' && e.newValue) {
        try {
          const flows: string[] = JSON.parse(e.newValue);
          dispatch({ type: 'LOAD_PROGRESS', payload: { completedFlows: flows } as any });
        } catch (error) {
          console.error('Error syncing completed flows:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    eventListenersRef.current.push(() => {
      window.removeEventListener('storage', handleStorageChange);
    });
  }, []);

  // Inicializar hook
  useEffect(() => {
    loadPersistentProgress();
    setupTabSync();
  }, [loadPersistentProgress, setupTabSync]);

  // Acciones optimizadas
  const startTutorial = useCallback((flow: TutorialFlow, stepIndex = 0) => {
    dispatch({ type: 'START_TUTORIAL', payload: { flow, stepIndex } });
    
    // Guardar progreso con debounce
    if (progressSaveTimeoutRef.current) {
      clearTimeout(progressSaveTimeoutRef.current);
    }
    
    progressSaveTimeoutRef.current = setTimeout(() => {
      const progress: TutorialProgress = {
        flowId: flow.id,
        currentStep: stepIndex,
        completedSteps: [],
        startedAt: new Date().toISOString(),
        skippedSteps: [],
        timeSpent: 0,
      };
      savePersistentProgress(progress);
    }, 500);
  }, [savePersistentProgress]);

  const nextStep = useCallback(() => {
    dispatch({ type: 'NEXT_STEP' });
  }, []);

  const prevStep = useCallback(() => {
    dispatch({ type: 'PREV_STEP' });
  }, []);

  const completeTutorial = useCallback(() => {
    if (state.currentFlow) {
      saveCompletedFlows([...state.completedFlows, state.currentFlow.id]);
    }
    dispatch({ type: 'COMPLETE_TUTORIAL' });
  }, [state.currentFlow, state.completedFlows, saveCompletedFlows]);

  const skipTutorial = useCallback(() => {
    dispatch({ type: 'SKIP_TUTORIAL' });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  return {
    ...state,
    startTutorial,
    nextStep,
    prevStep,
    completeTutorial,
    skipTutorial,
    setLoading,
    setError,
  };
};
