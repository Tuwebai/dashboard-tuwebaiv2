import React, { memo, useCallback, useMemo, useState } from 'react';
import { motion } from '@/components/OptimizedMotion';
import { Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import ProjectTimeline from './ProjectTimeline';
import ActivityIndicator, { StatusIndicator } from './ActivityIndicator';
import AccessibleTooltip from './AccessibleTooltip';
import { 
  MessageSquare, 
  Calendar, 
  Clock, 
  Users, 
  User,
  CheckCircle,
  Play,
  Pause,
  AlertCircle,
  Globe,
  ShoppingCart,
  Briefcase,
  Home,
  Smartphone,
  Laptop,
  Palette,
  Code,
  Database,
  Zap,
  Copy,
  Archive,
  Star,
  MoreVertical,
  GripVertical,
  XCircle,
  Trash2
} from 'lucide-react';
import { formatDateSafe } from '@/utils/formatDateSafe';
import { getTypeById, PROJECT_TYPES } from '@/utils/projectTypeDetector';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface ProjectPhase {
  key: string;
  estado: 'Pendiente' | 'En Progreso' | 'Terminado';
  descripcion?: string;
  fechaEntrega?: string;
  archivos?: Array<{ url: string; name: string }>;
  comentarios?: Array<{
    id: string;
    texto: string;
    autor: string;
    fecha: string;
    tipo: 'admin' | 'cliente';
  }>;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  status: string;
  created_at: string;
  updated_at: string;
  type?: string;
  ownerEmail?: string;
  createdAt?: string;
  fases?: ProjectPhase[];
  approval_status?: 'pending' | 'approved' | 'rejected';
  approval_notes?: string;
  approved_at?: string;
  isFavorite?: boolean;
}

interface ProjectCardProps {
  project: Project;
  user: any;
  projectCreators: Record<string, { full_name: string; email: string }>;
  onViewProject: (project: Project) => void;
  onNavigateToCollaboration?: (projectId: string) => void;
  onNavigateToEdit?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
  onDuplicateProject?: (project: Project) => void;
  onArchiveProject?: (projectId: string) => void;
  onToggleFavorite?: (projectId: string) => void;
  showAdminActions?: boolean;
  index?: number;
  isDragDisabled?: boolean;
  dragMode?: boolean;
}

// Función para calcular progreso del proyecto
const calculateProjectProgress = (project: Project) => {
  if (!project.fases || project.fases.length === 0) return 0;
  const completedPhases = project.fases.filter((f: ProjectPhase) => f.estado === 'Terminado').length;
  return Math.round((completedPhases / project.fases.length) * 100);
};

// Función para obtener el estado del proyecto
const getProjectStatus = (project: Project) => {
  if (!project.fases || project.fases.length === 0) return 'Sin iniciar';
  
  const completedPhases = project.fases.filter((f: ProjectPhase) => f.estado === 'Terminado').length;
  const totalPhases = project.fases.length;
  
  if (completedPhases === 0) return 'Sin iniciar';
  if (completedPhases === totalPhases) return 'Completado';
  if (completedPhases > totalPhases / 2) return 'En progreso avanzado';
  return 'En progreso';
};

// Función para obtener el color del estado
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Completado': return 'bg-green-500/10 text-green-600 border-green-500/20 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/40';
    case 'En progreso avanzado': return 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/40';
    case 'En progreso': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/40';
    case 'Sin iniciar': return 'bg-muted/50 text-muted-foreground border-border/50 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600/50';
    default: return 'bg-muted/50 text-muted-foreground border-border/50 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600/50';
  }
};

// Función para obtener el icono del estado
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Completado': return <CheckCircle className="h-4 w-4" />;
    case 'En progreso avanzado': return <Play className="h-4 w-4" />;
    case 'En progreso': return <Pause className="h-4 w-4" />;
    case 'Sin iniciar': return <Clock className="h-4 w-4" />;
    default: return <AlertCircle className="h-4 w-4" />;
  }
};

// Función para obtener el icono contextual del tipo de proyecto
const getProjectTypeIcon = (type: string) => {
  // Buscar el tipo en la lista de tipos predefinidos
  const projectType = PROJECT_TYPES.find(t => 
    t.name.toLowerCase() === type.toLowerCase() ||
    t.id === type.toLowerCase().replace(/\s+/g, '-')
  );
  
  if (projectType) {
    // Mapear iconos por ID del tipo
    switch (projectType.id) {
      case 'landing-page': return <Globe className="h-4 w-4" />;
      case 'ecommerce': return <ShoppingCart className="h-4 w-4" />;
      case 'corporate': return <Briefcase className="h-4 w-4" />;
      case 'portfolio': return <User className="h-4 w-4" />;
      case 'blog': return <MessageSquare className="h-4 w-4" />;
      case 'mobile-app': return <Smartphone className="h-4 w-4" />;
      case 'web-app': return <Laptop className="h-4 w-4" />;
      case 'ui-ux': return <Palette className="h-4 w-4" />;
      case 'development': return <Code className="h-4 w-4" />;
      case 'database': return <Database className="h-4 w-4" />;
      case 'api': return <Zap className="h-4 w-4" />;
      default: return <Home className="h-4 w-4" />;
    }
  }
  
  // Fallback para tipos no reconocidos
  switch (type?.toLowerCase()) {
    case 'landing page':
    case 'landing':
      return <Globe className="h-4 w-4" />;
    case 'ecommerce':
    case 'tienda online':
      return <ShoppingCart className="h-4 w-4" />;
    case 'corporativo':
    case 'empresa':
      return <Briefcase className="h-4 w-4" />;
    case 'portfolio':
    case 'portafolio':
      return <User className="h-4 w-4" />;
    case 'blog':
      return <MessageSquare className="h-4 w-4" />;
    case 'app móvil':
    case 'mobile':
      return <Smartphone className="h-4 w-4" />;
    case 'web app':
    case 'aplicación web':
      return <Laptop className="h-4 w-4" />;
    case 'diseño':
    case 'ui/ux':
      return <Palette className="h-4 w-4" />;
    case 'desarrollo':
    case 'programación':
      return <Code className="h-4 w-4" />;
    case 'base de datos':
    case 'database':
      return <Database className="h-4 w-4" />;
    case 'api':
    case 'backend':
      return <Zap className="h-4 w-4" />;
    default:
      return <Home className="h-4 w-4" />;
  }
};

// Función para obtener el color del tipo de proyecto
const getProjectTypeColor = (type: string) => {
  // Buscar el tipo en la lista de tipos predefinidos
  const projectType = PROJECT_TYPES.find(t => 
    t.name.toLowerCase() === type.toLowerCase() ||
    t.id === type.toLowerCase().replace(/\s+/g, '-')
  );
  
  if (projectType) {
    // Mapear colores por ID del tipo
    switch (projectType.id) {
      case 'landing-page': return 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/40';
      case 'ecommerce': return 'bg-green-500/10 text-green-600 border-green-500/20 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/40';
      case 'corporate': return 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/40';
      case 'portfolio': return 'bg-pink-500/10 text-pink-600 border-pink-500/20 dark:bg-pink-500/20 dark:text-pink-400 dark:border-pink-500/40';
      case 'blog': return 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/40';
      case 'mobile-app': return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/40';
      case 'web-app': return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:bg-cyan-500/20 dark:text-cyan-400 dark:border-cyan-500/40';
      case 'ui-ux': return 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/40';
      case 'development': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40';
      case 'database': return 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/40';
      case 'api': return 'bg-violet-500/10 text-violet-600 border-violet-500/20 dark:bg-violet-500/20 dark:text-violet-400 dark:border-violet-500/40';
      default: return 'bg-muted/50 text-muted-foreground border-border/50 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600/50';
    }
  }
  
  // Fallback para tipos no reconocidos
  switch (type?.toLowerCase()) {
    case 'landing page':
    case 'landing':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/40';
    case 'ecommerce':
    case 'tienda online':
      return 'bg-green-500/10 text-green-600 border-green-500/20 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/40';
    case 'corporativo':
    case 'empresa':
      return 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/40';
    case 'portfolio':
    case 'portafolio':
      return 'bg-pink-500/10 text-pink-600 border-pink-500/20 dark:bg-pink-500/20 dark:text-pink-400 dark:border-pink-500/40';
    case 'blog':
      return 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/40';
    case 'app móvil':
    case 'mobile':
      return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/40';
    case 'web app':
    case 'aplicación web':
      return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:bg-cyan-500/20 dark:text-cyan-400 dark:border-cyan-500/40';
    case 'diseño':
    case 'ui/ux':
      return 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/40';
    case 'desarrollo':
    case 'programación':
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40';
    case 'base de datos':
    case 'database':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/40';
    case 'api':
    case 'backend':
      return 'bg-violet-500/10 text-violet-600 border-violet-500/20 dark:bg-violet-500/20 dark:text-violet-400 dark:border-violet-500/40';
    default:
      return 'bg-muted/50 text-muted-foreground border-border/50 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600/50';
  }
};

// Función para verificar si un proyecto está próximo a su fecha límite
const isProjectUrgent = (project: Project) => {
  if (!project.fases || project.fases.length === 0) return false;
  
  const now = new Date();
  const urgentPhases = project.fases.filter((fase: ProjectPhase) => {
    if (!fase.fechaEntrega || fase.estado === 'Terminado') return false;
    
    const deadline = new Date(fase.fechaEntrega);
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysUntilDeadline <= 3 && daysUntilDeadline >= 0;
  });
  
  return urgentPhases.length > 0;
};

const ProjectCard = memo(({
  project,
  user,
  projectCreators,
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
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const progress = calculateProjectProgress(project);
  const status = getProjectStatus(project);
  const totalComments = project.fases?.reduce((total: number, fase: ProjectPhase) => 
    total + (fase.comentarios?.length || 0), 0) || 0;
  const isUrgent = isProjectUrgent(project);
  const projectType = project.type || 'Sin tipo';
  
  const approvalStatus = project.approval_status || 'approved'; // Por defecto aprobado para proyectos existentes
  const isPendingApproval = approvalStatus === 'pending';
  const isRejected = approvalStatus === 'rejected';

  const cardContent = (
    <motion.div
      key={project.id}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ 
        y: -12,
        scale: 1.03
      }}
      whileTap={{ scale: 0.97 }}
      className="w-full max-w-xs"
    >
      <div 
        className={`bg-card dark:bg-slate-800/50 rounded-2xl shadow-lg border border-border/50 dark:border-slate-700/50 hover:shadow-2xl hover:border-border dark:hover:border-slate-600 hover:shadow-primary/10 dark:hover:shadow-blue-500/10 transition-all duration-500 ease-out overflow-hidden relative w-full h-[420px] flex flex-col group ${
          isPendingApproval || isRejected ? 'cursor-default opacity-75' : 'cursor-pointer'
        } ${dragMode ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
        onClick={() => !isPendingApproval && !isRejected && !dragMode && onViewProject(project)}
      >
        {/* Header con gradiente sutil y profesional */}
        <div className={`relative h-16 bg-gradient-to-br transition-all duration-500 ease-out group-hover:shadow-lg ${
          approvalStatus === 'rejected' 
            ? 'from-red-50 to-red-100 group-hover:from-red-100 group-hover:to-red-200 dark:from-red-900/20 dark:to-red-800/30 dark:group-hover:from-red-800/30 dark:group-hover:to-red-700/40' 
            : approvalStatus === 'pending'
            ? 'from-amber-50 to-orange-100 group-hover:from-amber-100 group-hover:to-orange-200 dark:from-amber-900/20 dark:to-orange-800/30 dark:group-hover:from-amber-800/30 dark:group-hover:to-orange-700/40'
            : isUrgent 
            ? 'from-red-50 via-orange-50 to-yellow-100 group-hover:from-red-100 group-hover:via-orange-100 group-hover:to-yellow-200 dark:from-red-900/20 dark:via-orange-900/20 dark:to-yellow-800/30 dark:group-hover:from-red-800/30 dark:group-hover:via-orange-800/30 dark:group-hover:to-yellow-700/40' 
            : 'from-slate-50 via-blue-50 to-indigo-100 group-hover:from-slate-100 group-hover:via-blue-100 group-hover:to-indigo-200 dark:from-slate-800/20 dark:via-blue-900/20 dark:to-indigo-800/30 dark:group-hover:from-slate-700/30 dark:group-hover:via-blue-800/30 dark:group-hover:to-indigo-700/40'
        } border-b border-slate-200/50 dark:border-slate-700/50 group-hover:border-slate-300/70 dark:group-hover:border-slate-600/70`}>
          {/* Barra de estado sutil */}
          <div className={`absolute top-0 left-0 w-full h-1 ${
            approvalStatus === 'rejected' 
              ? 'bg-gradient-to-r from-red-500 to-red-600' 
              : approvalStatus === 'pending'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500'
              : isUrgent 
              ? 'bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500' 
              : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500'
          }`} />
          
          {/* Contenido del header */}
          <div className="p-4 h-full flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {dragMode && (
                  <div className="flex items-center justify-center w-5 h-5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing transition-colors duration-200">
                    <GripVertical className="h-3 w-3" />
                  </div>
                )}
                <AccessibleTooltip 
                  content={`Proyecto: ${project.name}. Estado: ${getProjectStatus(project)}. Progreso: ${progress}%`}
                  position="top"
                >
                  <h3 
                    className="text-lg font-bold text-accessible dark:text-white truncate leading-tight tracking-tight cursor-help"
                    tabIndex={0}
                    role="heading"
                    aria-level={3}
                  >
                    {project.name}
                  </h3>
                </AccessibleTooltip>
                {/* Indicador de estado granular */}
                <StatusIndicator 
                  status={
                    isPendingApproval ? 'pending' :
                    isRejected ? 'error' :
                    progress === 100 ? 'completed' :
                    progress > 0 ? 'active' : 'inactive'
                  }
                  size="sm"
                />
                {isUrgent && (
                  <Badge variant="destructive" className="text-xs px-2 py-0.5 animate-pulse shadow-sm">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Urgente
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm line-clamp-1 leading-tight font-medium">
                {project.description || 'Sin descripción'}
              </p>
            </div>
            
            {/* Quick Actions Menu */}
            <div 
              className="flex items-center gap-1 opacity-30 group-hover:opacity-100 transition-all duration-300 ml-2"
              role="toolbar"
              aria-label="Acciones del proyecto"
            >
              {onToggleFavorite && (
                <AccessibleTooltip 
                  content={project.isFavorite ? "Quitar de favoritos" : "Marcar como favorito"}
                  position="top"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(project.id);
                    }}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10 hover:shadow-md hover:scale-110 transition-all duration-300 ease-out rounded-full focus-visible"
                    aria-label={project.isFavorite ? "Quitar de favoritos" : "Marcar como favorito"}
                    aria-pressed={project.isFavorite}
                  >
                    <Star className={`h-4 w-4 ${project.isFavorite ? 'fill-current' : ''}`} />
                  </Button>
                </AccessibleTooltip>
              )}
              
              {/* Botón de eliminar - AL LADO DEL BOTÓN DE FAVORITOS */}
              {onDeleteProject && isRejected && user?.role !== 'admin' && (
                <AccessibleTooltip 
                  content="Eliminar proyecto rechazado"
                  position="top"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteDialog(true);
                    }}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 hover:shadow-md hover:scale-110 transition-all duration-300 ease-out rounded-full focus-visible"
                    aria-label="Eliminar proyecto rechazado"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AccessibleTooltip>
              )}
              
              {user?.role === 'admin' && (
                <>
                  {onDuplicateProject && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateProject(project);
                      }}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 hover:shadow-md hover:scale-110 transition-all duration-300 ease-out rounded-full"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                  {onArchiveProject && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchiveProject(project.id);
                      }}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10 hover:shadow-md hover:scale-110 transition-all duration-300 ease-out rounded-full"
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-4 flex-1 flex flex-col">
          {/* Información del creador del proyecto - Solo visible para admin */}
          {user?.role === 'admin' && project.created_by && projectCreators[project.created_by] && (
            <div className="flex items-center gap-2 p-2 bg-muted/50 dark:bg-slate-700/50 rounded-lg border border-border/50 dark:border-slate-600/50 mb-3">
              <User className="h-3 w-3 text-muted-foreground dark:text-slate-400" />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground dark:text-white">
                  Creado por: {projectCreators[project.created_by].full_name}
                </span>
                <span className="text-xs text-muted-foreground dark:text-slate-400">
                  {projectCreators[project.created_by].email}
                </span>
              </div>
            </div>
          )}

          {/* Estado, tipo y progreso en una sola línea */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {isPendingApproval ? (
                <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-600/40 text-xs px-3 py-1.5 font-medium shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 ease-out">
                  <Clock className="h-3 w-3 mr-1.5" />
                  Esperando Aprobación
                </Badge>
              ) : isRejected ? (
                <Badge variant="outline" className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-300 dark:border-red-600/40 text-xs px-3 py-1.5 font-medium shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 ease-out">
                  <XCircle className="h-3 w-3 mr-1.5" />
                  Rechazado
                </Badge>
              ) : (
                <Badge variant="outline" className={`${getStatusColor(status)} text-xs px-3 py-1.5 font-medium shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 ease-out`}>
                  {getStatusIcon(status)}
                  <span className="ml-1.5">{status}</span>
                </Badge>
              )}
              
              <Badge 
                variant="outline" 
                className={`${getProjectTypeColor(projectType)} text-xs px-3 py-1.5 font-medium shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 ease-out`}
                title={`Tipo de proyecto: ${projectType}`}
              >
                {getProjectTypeIcon(projectType)}
                <span className="ml-1.5">{projectType}</span>
              </Badge>
              

            </div>
            
            {!isPendingApproval && !isRejected && (
              <div className="flex items-center gap-1">
                <div className="text-sm font-bold text-foreground">{progress}%</div>
                <div className="w-2 h-2 rounded-full bg-muted-foreground/30"></div>
              </div>
            )}
          </div>
          
                        {/* Barra de progreso animada avanzada */}
              {!isPendingApproval && !isRejected && (
                <div className="mb-3">
                  <div className="relative">
                    {/* Fondo de la barra con efecto de brillo */}
                    <div 
                      className="w-full bg-muted/50 rounded-full h-3 overflow-hidden relative"
                      role="progressbar"
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Progreso del proyecto: ${progress}% completado`}
                      tabIndex={0}
                    >
                      {/* Efecto de brillo animado */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                      
                      {/* Barra de progreso principal */}
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden ${
                          progress === 100 
                            ? 'bg-gradient-to-r from-green-500 via-emerald-400 to-green-600' 
                            : progress >= 75 
                            ? 'bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-600'
                            : progress >= 50
                            ? 'bg-gradient-to-r from-yellow-500 via-orange-400 to-yellow-600'
                            : 'bg-gradient-to-r from-slate-400 via-slate-300 to-slate-500'
                        }`}
                        style={{ width: `${progress}%` }}
                        aria-hidden="true"
                      >
                        {/* Efecto de ondas en la barra */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                        
                        {/* Punto de progreso animado */}
                        {progress > 0 && (
                          <div className="absolute top-0 right-0 w-2 h-3 bg-card dark:bg-slate-700 rounded-full shadow-lg animate-pulse-glow"></div>
                        )}
                      </div>
                    </div>
                    
                    {/* Indicador de porcentaje flotante */}
                    <AccessibleTooltip 
                      content={`${progress}% completado`}
                      position="top"
                    >
                      <div className="absolute -top-8 right-0 bg-popover text-popover-foreground text-xs px-2 py-1 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {progress}%
                      </div>
                    </AccessibleTooltip>
                    
                    {/* Indicador de actividad */}
                    {progress > 0 && progress < 100 && (
                      <div className="absolute -right-1 top-1/2 transform -translate-y-1/2">
                        <AccessibleTooltip 
                          content="Proyecto en progreso activo"
                          position="left"
                        >
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping absolute"></div>
                          </div>
                        </AccessibleTooltip>
                      </div>
                    )}
                  </div>
                  
                  {/* Timeline de fases mini mejorada */}
                  {project.fases && project.fases.length > 0 && (
                    <div className="mt-2">
                      <ProjectTimeline 
                        fases={project.fases} 
                        compact={true}
                        className="justify-center"
                      />
                    </div>
                  )}
                </div>
              )}

          {/* Metadatos del proyecto compactos */}
          {!isPendingApproval && !isRejected ? (
            <div className="grid grid-cols-3 gap-2 text-xs mb-3 flex-1">
              <div className="text-center p-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/30 rounded-lg border border-blue-100 dark:border-blue-600/40">
                <div className="font-bold text-blue-800 dark:text-blue-300 text-sm">{(project as any).funcionalidades?.length || 0}</div>
                <div className="text-blue-600 dark:text-blue-400 font-medium text-xs">Funciones</div>
              </div>
              <div className="text-center p-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/30 rounded-lg border border-green-100 dark:border-green-600/40">
                <div className="font-bold text-green-800 dark:text-green-300 text-sm">
                  {project.fases?.filter((f: ProjectPhase) => f.estado === 'Terminado').length || 0}/{project.fases?.length || 0}
                </div>
                <div className="text-green-600 dark:text-green-400 font-medium text-xs">Fases</div>
              </div>
              <div className="text-center p-2 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/30 rounded-lg border border-purple-100 dark:border-purple-600/40">
                <div className="font-bold text-purple-800 dark:text-purple-300 text-sm flex items-center justify-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {totalComments}
                </div>
                <div className="text-purple-600 dark:text-purple-400 font-medium text-xs">Comentarios</div>
              </div>
            </div>
          ) : (
            <div className="mb-3 flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground dark:text-slate-400">
                {isPendingApproval ? (
                  <div className="space-y-2">
                    <Clock className="h-8 w-8 mx-auto text-amber-500 dark:text-amber-400" />
                    <p className="text-sm font-medium">Esperando aprobación</p>
                    <p className="text-xs">Los administradores revisarán tu proyecto</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <XCircle className="h-8 w-8 mx-auto text-red-500 dark:text-red-400" />
                    <p className="text-sm font-medium">Proyecto rechazado</p>
                    <p className="text-xs">Contacta a los administradores</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fechas mejor organizadas */}
          <div className="flex items-center justify-between text-xs mb-3 p-2 bg-muted/50 dark:bg-slate-700/50 rounded-lg border border-border dark:border-slate-600/50">
            <div className="flex items-center gap-1.5 text-muted-foreground dark:text-slate-400">
              <Calendar className="h-3 w-3 text-muted-foreground dark:text-slate-400" />
              <span className="truncate font-medium">{formatDateSafe(project.created_at || project.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground dark:text-slate-400">
              <Clock className="h-3 w-3 text-muted-foreground dark:text-slate-400" />
              <span className="truncate font-medium">{formatDateSafe(project.updated_at)}</span>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-2 mt-auto">
            {!isPendingApproval && !isRejected && (
              <>
                {user?.role !== 'admin' && onNavigateToCollaboration && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-border dark:border-slate-600 text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-700 hover:border-border dark:hover:border-slate-500 hover:shadow-md hover:scale-105 text-xs font-medium transition-all duration-300 ease-out"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToCollaboration(project.id);
                    }}
                  >
                    <Users className="h-3 w-3 mr-1" />
                    Colaborar
                  </Button>
                )}
                
                {showAdminActions && user?.role === 'admin' && (
                  <>
                    {onNavigateToEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border dark:border-slate-600 text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-700 hover:border-border dark:hover:border-slate-500 hover:shadow-md hover:scale-105 text-xs font-medium transition-all duration-300 ease-out"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToEdit(project.id);
                        }}
                      >
                        Editar
                      </Button>
                    )}
                  </>
                )}
                

              </>
            )}
            
            {/* Botón para proyectos rechazados */}
            {isRejected && user?.role !== 'admin' && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-amber-200 dark:border-amber-600/40 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/20 hover:border-amber-300 dark:hover:border-amber-500/60 hover:shadow-md hover:scale-105 text-xs font-medium transition-all duration-300 ease-out"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    // Importar el servicio dinámicamente para evitar dependencias circulares
                    const { projectService } = await import('@/lib/projectService');
                    await projectService.createApprovalRequest(project.id, 'Solicitud de nueva revisión del proyecto rechazado');
                    
                    // Mostrar mensaje de éxito
                    const { toast } = await import('@/hooks/use-toast');
                    toast({
                      title: 'Solicitud enviada',
                      description: 'Tu solicitud de revisión ha sido enviada a los administradores'
                    });
                  } catch (error) {
                    console.error('Error creating approval request:', error);
                    const { toast } = await import('@/hooks/use-toast');
                    toast({
                      title: 'Error',
                      description: 'No se pudo enviar la solicitud de revisión',
                      variant: 'destructive'
                    });
                  }
                }}
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Solicitar revisión
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Si está en modo drag, envolver con Draggable
  if (dragMode) {
    return (
      <Draggable 
        draggableId={project.id} 
        index={index} 
        isDragDisabled={isDragDisabled}
      >
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`${snapshot.isDragging ? 'rotate-2 scale-105 shadow-2xl' : ''} transition-all duration-200`}
          >
            {cardContent}
          </div>
        )}
      </Draggable>
    );
  }

  return (
    <>
      {cardContent}
      
      {/* Diálogo de confirmación para eliminar proyecto */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Eliminar proyecto
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {user?.role === 'admin' ? (
                <>
                  ¿Estás seguro de que quieres eliminar el proyecto <strong>"{project.name}"</strong>?
                  <br />
                  <span className="text-red-600 font-medium">Esta acción no se puede deshacer.</span>
                </>
              ) : (
                <>
                  ¿Estás seguro de que quieres eliminar tu proyecto rechazado <strong>"{project.name}"</strong>?
                  <br />
                  <span className="text-red-600 font-medium">Esta acción no se puede deshacer.</span>
                  <br />
                  <span className="text-amber-600 font-medium">Solo puedes eliminar proyectos que han sido rechazados.</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="border-border text-muted-foreground hover:bg-muted"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  await onDeleteProject?.(project.id);
                  setShowDeleteDialog(false);
                  toast({
                    title: '✅ Proyecto eliminado',
                    description: 'El proyecto ha sido eliminado exitosamente',
                    duration: 3000
                  });
                } catch (error) {
                  toast({
                    title: '❌ Error al eliminar',
                    description: 'No se pudo eliminar el proyecto. Inténtalo de nuevo.',
                    variant: 'destructive',
                    duration: 5000
                  });
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

ProjectCard.displayName = 'ProjectCard';

export default ProjectCard;
