import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from '@/components/OptimizedMotion';
import { useTutorial } from '@/contexts/TutorialContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  X, 
  Lightbulb, 
  BookOpen, 
  Video, 
  MessageCircle,
  ChevronRight,
  Star,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Bookmark,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =====================================================
// INTERFACES
// =====================================================

interface ContextualHelpProps {
  context: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'always';
  className?: string;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function ContextualHelp({ 
  context, 
  position = 'top', 
  trigger = 'hover',
  className 
}: ContextualHelpProps) {
  const { getContextualHelp, helpArticles } = useTutorial();
  const [isVisible, setIsVisible] = useState(false);
  const [helpContent, setHelpContent] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // =====================================================
  // EFECTOS
  // =====================================================

  useEffect(() => {
    const contextualHelp = getContextualHelp(context);
    setHelpContent(contextualHelp);
  }, [context, getContextualHelp]);

  useEffect(() => {
    if (trigger === 'always') {
      setIsVisible(true);
    }
  }, [trigger]);

  // =====================================================
  // FUNCIONES AUXILIARES
  // =====================================================

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover' && !isExpanded) {
      setIsVisible(false);
    }
  };

  const handleClick = () => {
    if (trigger === 'click') {
      setIsVisible(!isVisible);
    }
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-slate-200';
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-slate-200';
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-slate-200';
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-slate-200';
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-slate-200';
    }
  };

  // =====================================================
  // RENDERIZADO
  // =====================================================

  if (helpContent.length === 0) {
    return null;
  }

  return (
    <div 
      ref={triggerRef}
      className={cn("relative inline-block", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Trigger */}
      <div className="flex items-center justify-center w-6 h-6 bg-blue-100 hover:bg-blue-200 rounded-full cursor-pointer transition-colors">
        <HelpCircle className="w-4 h-4 text-blue-600" />
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.3 }}
            className={cn(
              "absolute z-50 w-80",
              getPositionClasses()
            )}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => {
              setIsExpanded(false);
              if (trigger === 'hover') {
                setIsVisible(false);
              }
            }}
          >
            {/* Arrow */}
            <div className={cn("absolute w-0 h-0 border-4", getArrowClasses())} />
            
            {/* Content */}
            <Card className="shadow-xl border-slate-200 bg-white">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium text-slate-800">
                        Ayuda Contextual
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsVisible(false)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Help Content */}
                  <div className="space-y-2">
                    {helpContent.slice(0, isExpanded ? helpContent.length : 2).map((article, index) => (
                      <div
                        key={article.id}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 mt-1">
                            {article.category === 'troubleshooting' ? (
                              <MessageCircle className="w-4 h-4 text-orange-500" />
                            ) : (
                              <BookOpen className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-slate-800 truncate">
                              {article.title}
                            </h4>
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                              {article.content.replace(/[#*`]/g, '').substring(0, 100)}...
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge 
                                variant="outline" 
                                className="text-xs px-2 py-0.5"
                              >
                                {article.category === 'onboarding' ? 'Inicio' :
                                 article.category === 'project-management' ? 'Proyectos' :
                                 article.category === 'troubleshooting' ? 'Solución' : 'Avanzado'}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <ThumbsUp className="w-3 h-3" />
                                {article.helpful}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Expand/Collapse */}
                  {helpContent.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExpand}
                      className="w-full text-xs text-slate-600 hover:text-slate-800"
                    >
                      {isExpanded ? (
                        <>
                          Mostrar menos
                          <ChevronRight className="w-3 h-3 ml-1 rotate-90" />
                        </>
                      ) : (
                        <>
                          Ver {helpContent.length - 2} más
                          <ChevronRight className="w-3 h-3 ml-1" />
                        </>
                      )}
                    </Button>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                    >
                      <BookOpen className="w-3 h-3 mr-1" />
                      Ver Todo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Contactar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =====================================================
// COMPONENTE DE AYUDA FLOTANTE
// =====================================================

export function FloatingHelpButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Mostrar después de 30 segundos si no ha interactuado
    const timer = setTimeout(() => {
      if (!hasInteracted) {
        setIsVisible(true);
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, [hasInteracted]);

  const handleInteraction = () => {
    setHasInteracted(true);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="fixed bottom-6 right-6 z-50"
    >
      <Card className="shadow-2xl border-border bg-card max-w-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl text-white">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-card-foreground mb-1">
                ¿Necesitas ayuda?
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Estamos aquí para ayudarte. Accede a tutoriales, documentación y soporte.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={handleInteraction}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Ayuda
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleInteraction}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// =====================================================
// COMPONENTE DE HINTS CONTEXTUALES
// =====================================================

export function ContextualHint({ 
  message, 
  position = 'top',
  delay = 3000,
  className 
}: {
  message: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          className={cn("absolute z-40", getPositionClasses(), className)}
        >
          <div className="bg-slate-800 text-white text-sm px-3 py-2 rounded-lg shadow-lg max-w-xs">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              <span>{message}</span>
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-800" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
