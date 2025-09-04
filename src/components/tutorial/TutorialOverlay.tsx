import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from '@/components/OptimizedMotion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTutorial } from '@/contexts/TutorialContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  SkipForward, 
  Play, 
  Pause,
  Volume2,
  VolumeX,
  HelpCircle,
  Lightbulb,
  Target,
  Clock,
  CheckCircle,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =====================================================
// COMPONENTE DE PROGRESO CIRCULAR
// =====================================================

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ 
  progress, 
  size = 60, 
  strokeWidth = 4,
  className 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn("circular-progress", className)}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00CCFF" />
            <stop offset="100%" stopColor="#9933FF" />
          </linearGradient>
        </defs>
        {/* Círculo de fondo */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="circular-progress-bg"
        />
        {/* Círculo de progreso */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="circular-progress-fill"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
            '--progress': progress
          } as React.CSSProperties}
        />
      </svg>
      {/* Texto del progreso */}
      <div className="circular-progress-text">
        <span className="text-sm font-bold">{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

// =====================================================
// COMPONENTE DE TIEMPO RESTANTE
// =====================================================

interface TimeRemainingProps {
  minutes: number;
  className?: string;
}

const TimeRemaining: React.FC<TimeRemainingProps> = ({ minutes, className }) => {
  return (
    <motion.div 
      className={cn(
        "flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20",
        className
      )}
      initial="hidden"
      animate="visible"
      transition={{ 
        duration: 0.6,
        delay: 0.8,
        ease: "easeOut"
      }}
    >
      <Clock className="w-3 h-3 text-white/80" />
      <span className="text-xs font-medium text-white/90">
        {minutes} min
      </span>
    </motion.div>
  );
};

// =====================================================
// HOOK PARA RESPONSIVIDAD
// =====================================================

const useResponsiveTutorial = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isLargeDesktop, setIsLargeDesktop] = useState(false);
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Breakpoints avanzados
      setIsMobile(width < 640); // sm
      setIsTablet(width >= 640 && width < 1024); // md-lg
      setIsDesktop(width >= 1024 && width < 1536); // xl
      setIsLargeDesktop(width >= 1536); // 2xl
      
      // Orientación
      setOrientation(width > height ? 'landscape' : 'portrait');
      
      setScreenSize({ width, height });
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    window.addEventListener('orientationchange', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
      window.removeEventListener('orientationchange', checkScreenSize);
    };
  }, []);
  
  return { 
    isMobile, 
    isTablet, 
    isDesktop, 
    isLargeDesktop, 
    screenSize, 
    orientation 
  };
};

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function TutorialOverlay() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    isMobile, 
    isTablet, 
    isDesktop, 
    isLargeDesktop, 
    screenSize, 
    orientation 
  } = useResponsiveTutorial();
  const {
    isActive,
    currentFlow,
    currentStep,
    stepIndex,
    progress,
    nextStep,
    prevStep,
    skipStep,
    exitTutorial,
    enableSounds,
    setEnableSounds
  } = useTutorial();

  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [overlayPosition, setOverlayPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // =====================================================
  // EFECTOS
  // =====================================================

  // Encontrar y posicionar el elemento objetivo
  useEffect(() => {
    if (!isActive || !currentStep) {
      setTargetElement(null);
      return;
    }

    const findTargetElement = () => {
      const element = document.querySelector(currentStep.target) as HTMLElement;
      if (element) {
        setTargetElement(element);
        updateOverlayPosition(element);
      } else {
        // Si no se encuentra el elemento, usar posición central
        setOverlayPosition({
          x: window.innerWidth / 2 - 200,
          y: window.innerHeight / 2 - 150,
          width: 400,
          height: 300
        });
      }
    };

    // Buscar el elemento con un pequeño delay para asegurar que esté renderizado
    const timeoutId = setTimeout(findTargetElement, 100);

    // Navegación automática si está configurada
    if (currentStep.autoNavigate && currentStep.action === 'navigate' && currentStep.navigateTo) {
      const autoNavigateTimeout = setTimeout(() => {
        try {
          navigate(currentStep.navigateTo);
        } catch (error) {
          console.error('❌ Error en navegación automática:', error);
        }
      }, 100); // Delay mínimo para que se muestre el modal

      return () => {
        clearTimeout(timeoutId);
        clearTimeout(autoNavigateTimeout);
      };
    }

    // Actualizar posición en scroll y resize
    const updatePosition = () => {
      if (targetElement) {
        updateOverlayPosition(targetElement);
      }
    };

    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isActive, currentStep, targetElement, navigate]);

  // =====================================================
  // FUNCIONES AUXILIARES
  // =====================================================

  const updateOverlayPosition = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const padding = isMobile ? 10 : 20;
    
    let x = rect.left - padding;
    let y = rect.top - padding;
    let width = rect.width + (padding * 2);
    let height = rect.height + (padding * 2);

    // Ajustar posición según la posición del tooltip y dispositivo
    switch (currentStep?.position) {
      case 'top':
        y = rect.top - (isMobile ? 200 : 250) - padding;
        break;
      case 'bottom':
        y = rect.bottom + padding;
        break;
      case 'left':
        x = rect.left - (isMobile ? 280 : 350) - padding;
        break;
      case 'right':
        x = rect.right + padding;
        break;
      case 'center':
        x = screenSize.width / 2 - (isMobile ? 160 : 200);
        y = screenSize.height / 2 - (isMobile ? 120 : 150);
        width = isMobile ? 320 : 400;
        height = isMobile ? 240 : 300;
        break;
    }

    // Asegurar que el overlay no se salga de la pantalla
    const maxWidth = isMobile ? 340 : 420;
    const maxHeight = isMobile ? 260 : 320;
    x = Math.max(10, Math.min(x, screenSize.width - maxWidth));
    y = Math.max(10, Math.min(y, screenSize.height - maxHeight));

    setOverlayPosition({ x, y, width, height });
  };

  const handleAction = async () => {
    if (!currentStep) return;

    switch (currentStep.action) {
      case 'click':
        if (targetElement) {
          targetElement.click();
        }
        break;
      case 'hover':
        // Simular hover
        if (targetElement) {
          targetElement.dispatchEvent(new MouseEvent('mouseenter'));
        }
        break;
      case 'scroll':
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        break;
      case 'navigate':
        // Manejar navegación directamente
        if (currentStep.navigateTo) {
          try {
            navigate(currentStep.navigateTo);
          } catch (error) {
            console.error('Error during navigation:', error);
          }
        }
        break;
      case 'wait':
        // Para acciones de espera, avanzar al siguiente paso
        nextStep();
        break;
    }
  };

  const getProgressPercentage = () => {
    if (!currentFlow || !progress) return 0;
    return ((stepIndex + 1) / currentFlow.steps.length) * 100;
  };

  const getEstimatedTimeRemaining = () => {
    if (!currentFlow || !progress) return 0;
    const remainingSteps = currentFlow.steps.length - stepIndex - 1;
    return Math.max(0, remainingSteps * 2); // 2 minutos por paso estimado
  };

  // =====================================================
  // RENDERIZADO
  // =====================================================

  if (!isActive || !currentFlow || !currentStep) {
    return null;
  }



  // Función para calcular posición responsive del tooltip
  const getTooltipPosition = () => {
    // Tamaños adaptativos simplificados
    const getTooltipSize = () => {
      if (isMobile) {
        return {
          width: Math.min(320, screenSize.width - 20),
          height: Math.min(400, screenSize.height - 20)
        };
      }
      if (isTablet) {
        return {
          width: Math.min(400, screenSize.width - 40),
          height: Math.min(500, screenSize.height - 40)
        };
      }
      // Desktop y Large desktop
      return {
        width: Math.min(480, screenSize.width - 60),
        height: Math.min(600, screenSize.height - 60)
      };
    };

    const { width: tooltipWidth, height: tooltipHeight } = getTooltipSize();
    
    // Estrategia de posicionamiento inteligente
    if (isMobile || isTablet) {
      // En dispositivos móviles y tablets, siempre centrado
      return {
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${tooltipWidth}px`,
        maxWidth: `${Math.min(tooltipWidth, screenSize.width - 40)}px`,
        maxHeight: `${Math.min(tooltipHeight, screenSize.height - 40)}px`
      };
    }

    // En la página de perfil, posicionar a un costado
    if (location.pathname === '/perfil' || location.pathname.includes('perfil')) {
      return {
        right: '20px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: `${Math.min(400, screenSize.width * 0.35)}px`,
        maxHeight: `${Math.min(tooltipHeight, screenSize.height - 40)}px`
      };
    }
    
    // En desktop, posicionamiento inteligente
    if (currentStep.position === 'center' || !targetElement) {
      return {
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${tooltipWidth}px`,
        maxHeight: `${tooltipHeight}px`
      };
    }
    
    // Calcular posición relativa al elemento objetivo
    const rect = targetElement.getBoundingClientRect();
    const padding = 30;
    const viewportPadding = 20;
    
    // Determinar posición inicial basada en la configuración del paso
    let left = rect.right + padding;
    let top = rect.top;
    
    // Ajustar según la posición configurada
    switch (currentStep.position) {
      case 'top':
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        top = rect.top - tooltipHeight - padding;
        break;
      case 'bottom':
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        top = rect.bottom + padding;
        break;
      case 'left':
        left = rect.left - tooltipWidth - padding;
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        break;
      case 'right':
        left = rect.right + padding;
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        break;
    }
    
    // Ajustes inteligentes para evitar que se salga del viewport
    // Ajustar horizontalmente
    if (left < viewportPadding) {
      left = viewportPadding;
    } else if (left + tooltipWidth > screenSize.width - viewportPadding) {
      left = screenSize.width - tooltipWidth - viewportPadding;
    }
    
    // Ajustar verticalmente
    if (top < viewportPadding) {
      top = viewportPadding;
    } else if (top + tooltipHeight > screenSize.height - viewportPadding) {
      top = screenSize.height - tooltipHeight - viewportPadding;
    }
    
    // Si aún no cabe, usar posición central como fallback
    if (left < viewportPadding || top < viewportPadding || 
        left + tooltipWidth > screenSize.width - viewportPadding || 
        top + tooltipHeight > screenSize.height - viewportPadding) {
      return {
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${tooltipWidth}px`,
        maxHeight: `${tooltipHeight}px`
      };
    }
    
    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${tooltipWidth}px`,
      maxHeight: `${tooltipHeight}px`
    };
  };

  return (
    <AnimatePresence>
      <motion.div
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="fixed inset-0 z-[9999]"
      >
        {/* Overlay de fondo - Bloquea interacciones */}
        <div
          className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto"
          onClick={(e) => {
            // Prevenir interacción con el fondo
            e.preventDefault();
            e.stopPropagation();
          }}
        />



        {/* Tooltip del tutorial con Glassmorphism */}
        <motion.div
          ref={overlayRef}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ 
            duration: 0.4,
            ease: "easeOut"
          }}
          className={cn(
            "absolute pointer-events-auto",
            // Glassmorphism Effect
            "glassmorphism",
            "rounded-3xl",
            // Responsive classes simplificadas
            isMobile ? "text-sm" : "text-base",
            // Mejoras para touch
            "touch-manipulation",
            "select-none",
            // Animaciones profesionales
            "spring-animation",
            // Overflow handling
            "overflow-hidden"
          )}
          style={{
            ...getTooltipPosition(),
            zIndex: 10001
          }}
        >
          {/* Header del tutorial */}
          <div className="relative">




            {/* Contenido del header */}
            <CardHeader className={cn(
              "pb-4 pt-6",
              isMobile ? "px-5" : "px-7"
            )}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <motion.div 
                    className={cn(
                      "flex items-center justify-center btn-gradient-primary rounded-2xl text-white flex-shrink-0",
                      "animate-pulse-glow",
                      isMobile ? "w-10 h-10 text-lg" : "w-12 h-12 text-xl"
                    )}
                    initial="hidden"
                    animate="visible"
                    transition={{ 
                      duration: 0.6,
                      delay: 0.2,
                      ease: "easeOut"
                    }}
                  >
                    {currentFlow.icon}
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <motion.div
                                          initial="hidden"
                    animate="visible"
                      transition={{ delay: 0.3, duration: 0.5 }}
                    >
                      <CardTitle className={cn(
                        "text-white leading-tight font-bold",
                        "tracking-tight",
                        isMobile ? "text-lg" : isTablet ? "text-xl" : "text-2xl"
                      )}>
                        {currentStep.title}
                      </CardTitle>
                      <div className={cn(
                        "flex items-center gap-3 mt-2",
                        isMobile ? "flex-col items-start" : "flex-row"
                      )}>
                        <motion.div
                          initial="hidden"
                          animate="visible"
                          transition={{ 
                            duration: 0.6,
                            delay: 0.4,
                            ease: "easeOut"
                          }}
                        >
                          <Badge className="text-xs w-fit bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white border border-white/30 backdrop-blur-sm px-3 py-1">
                            <span className="font-bold">Paso {stepIndex + 1}</span>
                            <span className="text-white/70 ml-1">de {currentFlow.steps.length}</span>
                          </Badge>
                        </motion.div>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Controles del header */}
                <motion.div 
                  className="flex items-center gap-2 flex-shrink-0"
                                      initial="hidden"
                    animate="visible"
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEnableSounds(!enableSounds)}
                    className={cn(
                      "p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl",
                      "spring-animation spring-hover",
                      isMobile ? "h-10 w-10" : "h-11 w-11"
                    )}
                    title={enableSounds ? "Silenciar sonidos" : "Activar sonidos"}
                  >
                    {enableSounds ? (
                      <Volume2 className={cn(
                        isMobile ? "w-5 h-5" : "w-5 h-5"
                      )} />
                    ) : (
                      <VolumeX className={cn(
                        isMobile ? "w-5 h-5" : "w-5 h-5"
                      )} />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={exitTutorial}
                    className={cn(
                      "p-2 text-white/80 hover:text-white hover:bg-red-500/20 rounded-xl",
                      "spring-animation spring-hover",
                      isMobile ? "h-10 w-10" : "h-11 w-11"
                    )}
                    title="Cerrar tutorial"
                  >
                    <X className={cn(
                                              isMobile ? "w-5 h-5" : "w-5 h-5"
                    )} />
                  </Button>
                </motion.div>
              </div>
            </CardHeader>

            {/* Contenido principal */}
            <CardContent className={cn(
              "space-y-4",
              isMobile ? "px-5" : "px-7"
            )}>
              {/* Descripción */}
              <motion.div
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <p className={cn(
                  "text-white/90 leading-relaxed font-medium",
                  "tracking-wide content-long",
                  isMobile ? "text-sm" : "text-base"
                )}>
                  {currentStep.description}
                </p>
              </motion.div>

              {/* Tips */}
              {currentStep.tips && currentStep.tips.length > 0 && (
                <motion.div 
                                     className={cn(
                     "bg-white/20 border border-white/30 rounded-2xl backdrop-blur-sm",
                     isMobile ? "p-3" : "p-4"
                   )}
                                     initial="hidden"
                   animate="visible"
                  transition={{ delay: 0.6, duration: 0.6 }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-yellow-500/20 rounded-xl">
                      <Lightbulb className={cn(
                        "text-yellow-400",
                        isMobile ? "w-4 h-4" : "w-5 h-5"
                      )} />
                    </div>
                    <span className={cn(
                      "font-semibold text-white",
                      isMobile ? "text-sm" : "text-base"
                    )}>Consejos útiles</span>
                  </div>
                  <ul className="space-y-2">
                    {currentStep.tips.map((tip, index) => (
                      <motion.li 
                        key={index} 
                        className={cn(
                          "text-white/80 flex items-start gap-3",
                          isMobile ? "text-sm" : "text-base"
                        )}
                                            initial="hidden"
                    animate="visible"
                        transition={{ delay: 0.7 + (index * 0.1), duration: 0.4 }}
                      >
                        <span className="text-yellow-400 mt-1 flex-shrink-0 font-bold">•</span>
                        <span className="leading-relaxed">{tip}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}

              



              {/* Controles de navegación */}
              <motion.div 
                className={cn(
                  "flex items-stretch justify-between gap-4 pt-4 border-t border-white/20",
                  isMobile ? "flex-col" : "flex-row items-center"
                )}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.9, duration: 0.6 }}
              >
                <div className={cn(
                  "flex items-center gap-3",
                  isMobile ? "order-2" : "order-1"
                )}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevStep}
                    disabled={stepIndex === 0}
                    className={cn(
                      "text-sm border-2 border-white/30 hover:border-white/50 bg-white/10 hover:bg-white/20 text-white",
                      "spring-animation spring-hover",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      isMobile ? "h-12 flex-1" : "h-12 flex-none"
                    )}
                  >
                    <ChevronLeft className={cn(
                      "mr-2",
                                              isMobile ? "w-5 h-5" : "w-5 h-5"
                    )} />
                    <span className={isMobile ? "inline" : "inline"}>Anterior</span>
                  </Button>
                  
                  {currentStep.skipable && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={skipStep}
                      className={cn(
                        "text-white/70 hover:text-white hover:bg-white/10 text-sm spring-animation spring-hover",
                        isMobile ? "h-10" : isTablet ? "h-11" : "h-12"
                      )}
                    >
                      <SkipForward className={cn(
                        "mr-2",
                        isMobile ? "w-5 h-5" : "w-5 h-5"
                      )} />
                      <span className={isMobile ? "inline" : "inline"}>Omitir</span>
                    </Button>
                  )}
                </div>

                <div className={cn(
                  "flex items-center gap-3",
                  isMobile ? "order-1" : "order-2"
                )}>
                  {stepIndex === currentFlow.steps.length - 1 ? (
                    <Button
                      onClick={nextStep}
                      className={cn(
                        "btn-gradient-accent text-white text-sm spring-animation spring-hover ripple-effect",
                        isMobile ? "h-12 flex-1" : "h-12 flex-none"
                      )}
                    >
                      <Star className={cn(
                        "mr-2",
                        isMobile ? "w-5 h-5" : "w-5 h-5"
                      )} />
                      <span className={isMobile ? "inline" : "inline"}>Completar</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={async () => {
                        // Manejar navegación si es necesario
                        if (currentStep?.action === 'navigate' && currentStep.navigateTo) {
                          try {
                            // Navegar inmediatamente
                            navigate(currentStep.navigateTo);
                            // Avanzar al siguiente paso inmediatamente
                            nextStep();
                            return;
                          } catch (error) {
                            console.error('Error during navigation:', error);
                            // Si hay error, avanzar de todas formas
                            nextStep();
                          }
                        } else {
                          // Si no es navegación, avanzar normalmente
                          nextStep();
                        }
                      }}
                      className={cn(
                        "btn-gradient-primary text-white text-sm spring-animation spring-hover ripple-effect",
                        isMobile ? "h-12 flex-1" : "h-12 flex-none"
                      )}
                    >
                      <span className={isMobile ? "inline" : "inline"}>Siguiente</span>
                      <ChevronRight className={cn(
                        "ml-2",
                        isMobile ? "w-5 h-5" : "w-5 h-5"
                      )} />
                    </Button>
                  )}
                </div>
              </motion.div>
            </CardContent>
          </div>


        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
