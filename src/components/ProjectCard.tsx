import React, { memo } from 'react';
import { motion } from '@/components/OptimizedMotion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Clock, 
  Play,
  ExternalLink,
  Star,
  MoreVertical,
  X,
  Menu,
  CheckCircle2,
  Circle,
  AlertCircle
} from 'lucide-react';

// Interfaces para el nuevo componente
interface ProjectResults {
  satisfaction: number;
  originality: number;
  extras: string[];
}

interface ProjectCardProject {
  id: string;
  name: string;
  category: string;
  description: string;
  status: "in-progress" | "completed";
  progress: number;
  screenshotUrl?: string;
  results?: ProjectResults;
  phases?: Array<{
    name: string;
    status: 'Pendiente' | 'En curso' | 'Revisión' | 'Completado';
    description?: string;
  }>;
}

interface ProjectCardProps {
  project: ProjectCardProject;
  user?: any;
  projectCreators?: Record<string, { full_name: string; email: string }>;
  onViewProject?: (project: ProjectCardProject) => void;
  onNavigateToCollaboration?: (projectId: string) => void;
  onNavigateToEdit?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
  onDuplicateProject?: (project: ProjectCardProject) => void;
  onArchiveProject?: (projectId: string) => void;
  onToggleFavorite?: (projectId: string) => void;
  showAdminActions?: boolean;
  index?: number;
  isDragDisabled?: boolean;
  dragMode?: boolean;
}

// Función para obtener el icono de estado de fase
const getPhaseIcon = (status: string) => {
  switch (status) {
    case 'Completado':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'En curso':
      return <Play className="h-4 w-4 text-blue-500" />;
    case 'Revisión':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    case 'Pendiente':
    default:
      return <Circle className="h-4 w-4 text-gray-400" />;
  }
};

// Función para obtener el color de estado de fase
const getPhaseColor = (status: string) => {
  switch (status) {
    case 'Completado':
      return 'text-green-600 dark:text-green-400';
    case 'En curso':
      return 'text-blue-600 dark:text-blue-400';
    case 'Revisión':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'Pendiente':
    default:
      return 'text-gray-500 dark:text-gray-400';
  }
};

const ProjectCard = memo(({
  project,
  user,
  onViewProject,
  onNavigateToCollaboration,
  onNavigateToEdit,
  onDeleteProject,
  onDuplicateProject,
  onArchiveProject,
  onToggleFavorite,
  showAdminActions = false,
  index = 0,
  isDragDisabled = false,
  dragMode = false
}: ProjectCardProps) => {
  
  const handleViewProject = () => {
    if (onViewProject) {
      onViewProject(project);
    }
  };

  const handleLiveProject = () => {
    // Aquí podrías abrir el proyecto en una nueva pestaña
    // window.open(project.liveUrl, '_blank');
    console.log('Ver proyecto en vivo:', project.name);
  };

  return (
    <motion.div
      key={project.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ 
        y: -8,
        scale: 1.02
      }}
      whileTap={{ scale: 0.98 }}
      className="w-full max-w-md sm:max-w-lg lg:max-w-md xl:max-w-lg"
    >
      <div 
        className="bg-card dark:bg-slate-800/50 rounded-xl shadow-lg border border-border/50 dark:border-slate-700/50 hover:shadow-2xl hover:border-border dark:hover:border-slate-600 hover:shadow-primary/10 dark:hover:shadow-blue-500/10 transition-all duration-500 ease-out overflow-hidden relative w-full group cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
        onClick={handleViewProject}
      >
        {/* Header con diseño específico */}
        <div 
          className="flex items-start justify-between border-b border-slate-700/50 dark:border-slate-600/50 p-6"
          style={{
            fontFamily: 'Inter, sans-serif',
            lineHeight: 'inherit',
            color: 'hsl(var(--foreground))',
            boxSizing: 'border-box',
            borderWidth: '0',
            borderStyle: 'solid',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            borderBottomWidth: '1px',
            padding: '1.5rem'
          }}
        >
            <div className="flex-1 min-w-0">
            <h3 
              className="text-2xl font-bold text-foreground dark:text-white truncate leading-tight tracking-tight mb-2"
              style={{
                color: 'hsl(var(--foreground))',
                fontFamily: 'Inter, sans-serif'
              }}
                  >
                    {project.name}
                  </h3>
            <Badge 
              variant="outline" 
              className="bg-muted/60 dark:bg-muted/40 text-muted-foreground dark:text-muted-foreground border-border dark:border-border text-base px-4 py-2 font-semibold"
              style={{
                backgroundColor: 'hsl(var(--muted) / 0.6)',
                color: 'hsl(var(--muted-foreground))',
                borderColor: 'hsl(var(--border))'
              }}
            >
              {project.category}
                  </Badge>
              </div>
          
            </div>
            
        <div className="p-6 sm:p-8 flex-1 flex flex-col space-y-4">
          {/* Imagen de fondo - Para proyectos en desarrollo */}
          {project.status === 'in-progress' && (
            <div className="mb-4 rounded-lg overflow-hidden border border-border/50 dark:border-slate-600/50 relative">
              <div className="w-full h-48 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-800 dark:via-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center relative overflow-hidden">
                {/* Imagen SVG de fondo */}
                <img 
                  src="/assets/images/development-bg.svg" 
                  alt="En Desarrollo"
                  className="w-full h-full object-cover opacity-80"
                  onError={(e) => {
                    // Fallback si la imagen no carga
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {/* Overlay con texto animado */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-2xl font-bold text-white drop-shadow-lg">
                      En Desarrollo
                    </h3>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0s', animationDuration: '1.5s' }} />
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0.2s', animationDuration: '1.5s' }} />
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0.4s', animationDuration: '1.5s' }} />
            </div>
          </div>
        </div>
              </div>
            </div>
          )}

          {/* Screenshot del proyecto - Solo para completados */}
          {project.status === 'completed' && project.screenshotUrl && (
            <div className="mb-4 rounded-lg overflow-hidden border border-border/50 dark:border-slate-600/50">
              <img 
                src={project.screenshotUrl} 
                alt={`Screenshot de ${project.name}`}
                className="w-full h-48 object-cover"
              />
              </div>
            )}

          {/* Descripción */}
          <div className="mb-4">
            <h4 className="text-lg font-bold text-foreground dark:text-white mb-2">Descripción</h4>
            <p className="text-muted-foreground dark:text-slate-300 text-sm leading-relaxed">
              {project.description}
            </p>
                    </div>
                    
          {/* Características - Para completados o fases para en progreso */}
          <div className="mb-4">
            <h4 className="text-lg font-bold text-foreground dark:text-white mb-2">
              {project.status === 'completed' ? 'Características' : 'Fases del Proyecto'}
            </h4>
            {project.status === 'completed' ? (
              <ul className="space-y-2">
                {project.results?.extras.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground dark:text-slate-300">
                    <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-3">
                {project.phases && project.phases.length > 0 ? (
                  project.phases.map((phase, index) => (
                    <motion.div 
                      key={index} 
                      className="flex items-center gap-4 p-3 bg-muted/40 dark:bg-slate-700/40 rounded-xl border border-border/50 dark:border-slate-600/50 hover:bg-muted/60 dark:hover:bg-slate-700/60 transition-all duration-300"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex-shrink-0">
                        {getPhaseIcon(phase.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-semibold ${getPhaseColor(phase.status)} mb-1`}>
                          {phase.name}
                          </div>
                        {phase.description && (
                          <div className="text-xs text-muted-foreground dark:text-slate-400 leading-relaxed">
                            {phase.description}
                      </div>
                    )}
                  </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs font-medium px-3 py-1 ${
                          phase.status === 'Completado' 
                            ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-green-300 dark:border-green-600'
                            : phase.status === 'En curso'
                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-600'
                            : phase.status === 'Revisión'
                            ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-600'
                            : 'bg-gray-100 dark:bg-gray-700/40 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {phase.status}
                      </Badge>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground dark:text-slate-400 text-center py-4">
                    No hay fases definidas para este proyecto
                    </div>
                  )}
                </div>
              )}
          </div>

          {/* Resultados - Métricas más compactas */}
          <div className="mb-4">
            <h4 className="text-lg font-bold text-foreground dark:text-white mb-3">Resultados</h4>
            <div className="grid grid-cols-2 gap-3">
              {project.status === 'completed' ? (
                <>
                  <motion.div 
                    className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700/60 dark:to-slate-800/60 rounded-lg p-3 text-center border border-slate-200 dark:border-slate-600/50 hover:shadow-lg transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
                      {project.results?.satisfaction}%
              </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">Satisfacción</div>
                  </motion.div>
                  <motion.div 
                    className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700/60 dark:to-slate-800/60 rounded-lg p-3 text-center border border-slate-200 dark:border-slate-600/50 hover:shadow-lg transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
                      {project.results?.originality}%
                </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">Originalidad</div>
                  </motion.div>
                  <motion.div 
                    className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 rounded-lg p-3 text-center col-span-2 border border-blue-200 dark:border-blue-700/50 hover:shadow-lg transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-1">
                      {project.results?.extras[0] || '+200'}
              </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Variedad</div>
                  </motion.div>
                </>
              ) : (
                <>
                  <motion.div 
                    className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700/60 dark:to-slate-800/60 rounded-lg p-3 text-center border border-slate-200 dark:border-slate-600/50 hover:shadow-lg transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
                      {project.progress}%
                </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">Completado</div>
                  </motion.div>
                  <motion.div 
                    className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700/60 dark:to-slate-800/60 rounded-lg p-3 text-center border border-slate-200 dark:border-slate-600/50 hover:shadow-lg transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
                      {project.phases?.filter(p => p.status === 'Completado').length || 0}
              </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">Fases</div>
                  </motion.div>
                  <motion.div 
                    className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 rounded-lg p-3 text-center col-span-2 border border-blue-200 dark:border-blue-700/50 hover:shadow-lg transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-1">
                      {project.phases?.filter(p => p.status === 'En curso').length || 0}
            </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Activas</div>
                  </motion.div>
                </>
                )}
              </div>
            </div>

          {/* CTA Button mejorado */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
                  <Button
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/25 active:scale-95"
                    onClick={(e) => {
                      e.stopPropagation();
                if (project.status === 'completed') {
                  handleLiveProject();
                } else if (onNavigateToCollaboration) {
                      onNavigateToCollaboration(project.id);
                }
              }}
            >
              {project.status === 'completed' ? (
                <>
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Ver Proyecto en Vivo
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Continuar Proyecto
              </>
            )}
              </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
});

ProjectCard.displayName = 'ProjectCard';

export default ProjectCard;
