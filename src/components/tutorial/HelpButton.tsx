import React, { useState, useEffect } from 'react';
import { motion } from '@/components/OptimizedMotion';
import { useTutorial } from '@/contexts/TutorialContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  BookOpen, 
  PlayCircle, 
  MessageCircle,
  Bell,
  BellOff,
  Settings,
  Star,
  Target,
  Zap,
  X
} from 'lucide-react';
import HelpCenter from './HelpCenter';
import { cn } from '@/lib/utils';

// =====================================================
// HOOK PARA RESPONSIVIDAD
// =====================================================

const useResponsiveHelpButton = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  return { isMobile, isTablet };
};

// =====================================================
// INTERFACES
// =====================================================

interface HelpButtonProps {
  variant?: 'default' | 'floating' | 'minimal';
  showBadge?: boolean;
  className?: string;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function HelpButton({ 
  variant = 'default', 
  showBadge = true,
  className 
}: HelpButtonProps) {
  const { isMobile, isTablet } = useResponsiveHelpButton();
  const {
    availableFlows,
    completedFlows,
    isActive,
    startTutorial,
    autoStart,
    showHints,
    enableSounds,
    setAutoStart,
    setShowHints,
    setEnableSounds
  } = useTutorial();

  const [isHelpCenterOpen, setIsHelpCenterOpen] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  // =====================================================
  // FUNCIONES AUXILIARES
  // =====================================================

  const getAvailableTutorialsCount = () => {
    return availableFlows.filter(flow => !completedFlows.includes(flow.id)).length;
  };

  const getQuickActions = () => [
    {
      id: 'welcome-tour',
      label: 'Tour de Bienvenida',
      icon: Target,
      description: 'Conoce las funcionalidades principales',
      action: () => {
        startTutorial('welcome-tour');
        setShowQuickMenu(false); // Cerrar el menú flotante
      },
      available: !completedFlows.includes('welcome-tour')
    },
    {
      id: 'project-management',
      label: 'Gestión de Proyectos',
      icon: BookOpen,
      description: 'Aprende a gestionar proyectos',
      action: () => {
        startTutorial('project-management');
        setShowQuickMenu(false); // Cerrar el menú flotante
      },
      available: !completedFlows.includes('project-management')
    },
    {
      id: 'help-center',
      label: 'Centro de Ayuda',
      icon: HelpCircle,
      description: 'Busca respuestas y documentación',
      action: () => setIsHelpCenterOpen(true),
      available: true
    },
    {
      id: 'contact-support',
      label: 'Contactar Soporte',
      icon: MessageCircle,
      description: 'Habla con nuestro equipo',
      action: () => {
        // Implementar chat de soporte
        console.log('Abrir chat de soporte');
      },
      available: true
    }
  ];

  // =====================================================
  // RENDERIZADO POR VARIANTE
  // =====================================================

  if (variant === 'minimal') {
    return (
      <div className={cn("relative", className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsHelpCenterOpen(true)}
          className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700"
        >
          <HelpCircle className="w-4 h-4" />
        </Button>
        {showBadge && getAvailableTutorialsCount() > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {getAvailableTutorialsCount()}
          </Badge>
        )}
        <HelpCenter 
          isOpen={isHelpCenterOpen} 
          onClose={() => setIsHelpCenterOpen(false)} 
        />
      </div>
    );
  }

  if (variant === 'floating') {
    return (
      <div className={cn(
        "fixed z-50",
        isMobile ? "bottom-4 right-4" : "bottom-6 right-6",
        className
      )}>
        <motion.div
          initial="hidden"
          animate="visible"
          whileHover={{ scale: isMobile ? 1 : 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="relative">
            <Button
              onClick={() => setShowQuickMenu(!showQuickMenu)}
              className={cn(
                "rounded-full bg-gradient-to-br from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white shadow-2xl",
                "ring-2 ring-blue-200 ring-opacity-50 hover:ring-opacity-75",
                "transition-all duration-200 hover:scale-105",
                isMobile ? "h-12 w-12" : "h-14 w-14"
              )}
            >
              <HelpCircle className={cn(
                isMobile ? "w-5 h-5" : "w-6 h-6"
              )} />
            </Button>
            
            {showBadge && getAvailableTutorialsCount() > 0 && (
              <Badge 
                variant="destructive" 
                className={cn(
                  "absolute p-0 flex items-center justify-center text-xs font-bold",
                  isMobile ? "-top-1 -right-1 h-5 w-5" : "-top-2 -right-2 h-6 w-6"
                )}
              >
                {getAvailableTutorialsCount()}
              </Badge>
            )}

            {/* Quick Menu */}
            {showQuickMenu && (
              <motion.div
                initial="hidden"
                animate="visible"
                exit="hidden"
                className={cn(
                  "absolute bg-white rounded-2xl shadow-2xl border-2 border-slate-300",
                  "ring-2 ring-blue-100 ring-opacity-50",
                  "backdrop-blur-sm bg-white/95",
                  isMobile ? "bottom-14 right-0 w-[90vw] max-w-[320px] p-3" : "bottom-16 right-0 w-80 p-4"
                )}
              >
                <div className={cn(
                  isMobile ? "space-y-2" : "space-y-3"
                )}>
                  {/* Header con botón de cerrar en móviles */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white",
                        isMobile ? "w-7 h-7" : "w-8 h-8"
                      )}>
                        <HelpCircle className={cn(
                          isMobile ? "w-3 h-3" : "w-4 h-4"
                        )} />
                      </div>
                      <div>
                        <h3 className={cn(
                          "font-semibold text-slate-800",
                          isMobile ? "text-sm" : "text-base"
                        )}>Centro de Ayuda</h3>
                        <p className={cn(
                          "text-slate-500",
                          isMobile ? "text-xs" : "text-xs"
                        )}>Acceso rápido a la ayuda</p>
                      </div>
                    </div>
                    
                    {/* Botón de cerrar en móviles */}
                    {isMobile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowQuickMenu(false)}
                        className="h-7 w-7 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>

                  {getQuickActions().map((action) => (
                    <Button
                      key={action.id}
                      variant="ghost"
                      onClick={() => {
                        action.action();
                        setShowQuickMenu(false);
                      }}
                      disabled={!action.available}
                      className={cn(
                        "w-full justify-start hover:bg-slate-50",
                        isMobile ? "h-auto p-2" : "h-auto p-3"
                      )}
                    >
                      <div className={cn(
                        "flex items-center",
                        isMobile ? "gap-2" : "gap-3"
                      )}>
                        <div className={cn(
                          "flex items-center justify-center rounded-lg",
                          isMobile ? "w-7 h-7" : "w-8 h-8",
                          action.available 
                            ? "bg-blue-100 text-blue-600" 
                            : "bg-slate-100 text-slate-400"
                        )}>
                          <action.icon className={cn(
                            isMobile ? "w-3 h-3" : "w-4 h-4"
                          )} />
                        </div>
                        <div className="text-left min-w-0 flex-1">
                          <div className={cn(
                            "font-medium text-slate-800 truncate",
                            isMobile ? "text-sm" : "text-base"
                          )}>
                            {action.label}
                          </div>
                          <div className={cn(
                            "text-slate-500",
                            isMobile ? "text-xs" : "text-xs"
                          )}>
                            {action.description}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}

                  <div className="pt-3 border-t border-slate-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsHelpCenterOpen(true);
                        setShowQuickMenu(false);
                      }}
                      className={cn(
                        "w-full",
                        isMobile ? "h-9 text-sm" : "h-10"
                      )}
                    >
                      <BookOpen className={cn(
                        "mr-2",
                        isMobile ? "w-3 h-3" : "w-4 h-4"
                      )} />
                      Ver Todo
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        <HelpCenter 
          isOpen={isHelpCenterOpen} 
          onClose={() => setIsHelpCenterOpen(false)} 
        />
      </div>
    );
  }

  // Variant default
  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        onClick={() => setIsHelpCenterOpen(true)}
        className={cn(
          "relative bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400",
          isMobile ? "h-9 px-3 text-sm" : "h-10 px-4"
        )}
      >
        <HelpCircle className={cn(
          "mr-2",
          isMobile ? "w-3 h-3" : "w-4 h-4"
        )} />
        <span className={isMobile ? "hidden sm:inline" : "inline"}>Ayuda</span>
        {showBadge && getAvailableTutorialsCount() > 0 && (
          <Badge 
            variant="destructive" 
            className={cn(
              "absolute p-0 flex items-center justify-center text-xs",
              isMobile ? "-top-1 -right-1 h-4 w-4" : "-top-2 -right-2 h-5 w-5"
            )}
          >
            {getAvailableTutorialsCount()}
          </Badge>
        )}
      </Button>

      <HelpCenter 
        isOpen={isHelpCenterOpen} 
        onClose={() => setIsHelpCenterOpen(false)} 
      />
    </div>
  );
}

// =====================================================
// COMPONENTE DE CONFIGURACIÓN DE AYUDA
// =====================================================

export function HelpSettings() {
  const {
    autoStart,
    showHints,
    enableSounds,
    setAutoStart,
    setShowHints,
    setEnableSounds
  } = useTutorial();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-slate-800">Auto-iniciar tutoriales</h4>
          <p className="text-sm text-slate-500">
            Iniciar automáticamente tutoriales para nuevos usuarios
          </p>
        </div>
        <Button
          variant={autoStart ? "default" : "outline"}
          size="sm"
          onClick={() => setAutoStart(!autoStart)}
        >
          {autoStart ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-slate-800">Mostrar hints</h4>
          <p className="text-sm text-slate-500">
            Mostrar consejos y sugerencias contextuales
          </p>
        </div>
        <Button
          variant={showHints ? "default" : "outline"}
          size="sm"
          onClick={() => setShowHints(!showHints)}
        >
          {showHints ? <Zap className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-slate-800">Sonidos de notificación</h4>
          <p className="text-sm text-slate-500">
            Reproducir sonidos para notificaciones del tutorial
          </p>
        </div>
        <Button
          variant={enableSounds ? "default" : "outline"}
          size="sm"
          onClick={() => setEnableSounds(!enableSounds)}
        >
          {enableSounds ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
