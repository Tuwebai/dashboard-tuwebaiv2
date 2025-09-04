import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FolderOpen, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Calendar,
  Code,
  Settings,
  Clock,
  X,
  User,
  Users
} from 'lucide-react';
import { Project } from '@/types/project.types';
import { formatDateSafe } from '@/utils/formatDateSafe';
import { userService } from '@/lib/supabaseService';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onView: (project: Project) => void;
  onCollaborate?: (project: Project) => void;
  onUpdateIcon?: (projectId: string, iconName: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onEdit,
  onDelete,
  onView,
  onCollaborate,
  onUpdateIcon
}) => {
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(project.customicon || 'FolderOpen');
  const [creatorInfo, setCreatorInfo] = useState<{ full_name: string; email: string } | null>(null);

  // Iconos disponibles para personalización
  const availableIcons = [
    { name: 'FolderOpen', icon: FolderOpen, label: 'Carpeta' },
    { name: 'Code', icon: Code, label: 'Código' },
    { name: 'Settings', icon: Settings, label: 'Configuración' },
    { name: 'Clock', icon: Clock, label: 'Reloj' },
    { name: 'ExternalLink', icon: ExternalLink, label: 'Enlace' },
    { name: 'Calendar', icon: Calendar, label: 'Calendario' },
    { name: 'Edit', icon: Edit, label: 'Editar' }
  ];

  const getIconComponent = (iconName: string) => {
    const iconData = availableIcons.find(icon => icon.name === iconName);
    return iconData ? iconData.icon : FolderOpen;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'development':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'production':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'development':
        return 'Desarrollo';
      case 'production':
        return 'Producción';
      case 'paused':
        return 'Pausado';
      case 'maintenance':
        return 'Mantenimiento';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'development':
        return <Code className="h-4 w-4" />;
      case 'production':
        return <Settings className="h-4 w-4" />;
      case 'paused':
        return <Clock className="h-4 w-4" />;
      case 'maintenance':
        return <Settings className="h-4 w-4" />;
      default:
        return <FolderOpen className="h-4 w-4" />;
    }
  };

  // Cargar información del creador del proyecto
  useEffect(() => {
    const loadCreatorInfo = async () => {
      // Validar que el proyecto tenga created_by
      if (!project.created_by || project.created_by.trim() === '') {
        setCreatorInfo({
          full_name: 'Sin información de creador',
          email: 'sin-creador@example.com'
        });
        return;
      }

      try {
        const creator = await userService.getUserById(project.created_by);
        
        if (creator && creator.id) {
          setCreatorInfo({
            full_name: creator.full_name || 'Usuario sin nombre',
            email: creator.email || 'sin-email@example.com'
          });
        } else {
          setCreatorInfo({
            full_name: 'Usuario no encontrado',
            email: 'no-encontrado@example.com'
          });
        }
      } catch (error) {
        // Error cargando creador
        setCreatorInfo({
          full_name: 'Error al cargar',
          email: 'error@example.com'
        });
      }
    };

    loadCreatorInfo();
  }, [project.created_by, project.id]);



  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card 
      className="bg-white border-slate-200 hover:border-slate-300 transition-colors cursor-pointer group shadow-sm hover:shadow-md flex flex-col h-full"
      onClick={(e) => {
        // Evitar que se active cuando se hace click en botones
        if (!(e.target as HTMLElement).closest('button')) {
          onView(project);
        }
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
                         <button
               onClick={(e) => {
                 e.stopPropagation();
                 setShowIconPicker(true);
               }}
               className="h-10 w-10 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg flex items-center justify-center hover:from-green-500 hover:to-blue-500 transition-all duration-200 cursor-pointer"
               title="Cambiar icono"
             >
               {React.createElement(getIconComponent(selectedIcon), { className: "h-5 w-5 text-white" })}
             </button>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                {project.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getStatusColor(project.status)}>
                  {getStatusIcon(project.status)}
                  <span className="ml-1">{getStatusLabel(project.status)}</span>
                </Badge>
                {!project.is_active && (
                  <Badge variant="destructive" className="text-xs">
                    Inactivo
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(project);
              }}
              className="text-slate-500 hover:text-blue-600 hover:bg-slate-100"
              title="Editar proyecto"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (onCollaborate) {
                  onCollaborate(project);
                }
              }}
              className="text-slate-500 hover:text-emerald-600 hover:bg-slate-100"
              title="Colaborar con el cliente"
            >
              <Users className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project);
              }}
              className="text-slate-500 hover:text-red-600 hover:bg-slate-100"
              title="Eliminar proyecto"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-1">
        {/* Descripción */}
        {project.description && (
          <p className="text-slate-600 text-sm leading-relaxed">
            {truncateText(project.description, 150)}
          </p>
        )}

        {/* Información del creador del proyecto */}
        {creatorInfo && (
          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200/50">
            <User className="h-4 w-4 text-slate-500" />
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-700">
                Creado por: {creatorInfo.full_name}
              </span>
              <span className="text-xs text-slate-500">
                {creatorInfo.email}
              </span>
            </div>
          </div>
        )}

        {/* Tecnologías */}
        {project.technologies && project.technologies.length > 0 && (
          <div className="space-y-2 group/tech">
            <h4 className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors cursor-pointer">
              Tecnologías
            </h4>
            <div className="flex flex-wrap gap-1 opacity-0 group-hover/tech:opacity-100 transition-opacity duration-200">
              {project.technologies.slice(0, 5).map((tech, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                >
                  {tech}
                </Badge>
              ))}
              {project.technologies.length > 5 && (
                <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-300 text-xs">
                  +{project.technologies.length - 5} más
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Variables de entorno */}
        {project.environment_variables && Object.keys(project.environment_variables).length > 0 && (
          <div className="space-y-2 group/env">
            <h4 className="text-sm font-medium text-slate-600 hover:text-purple-600 transition-colors cursor-pointer">
              Variables de Entorno
            </h4>
            <div className="flex flex-wrap gap-1 opacity-0 group-hover/env:opacity-100 transition-opacity duration-200">
              {Object.keys(project.environment_variables).slice(0, 3).map((key) => (
                <Badge
                  key={key}
                  variant="secondary"
                  className="bg-purple-50 text-purple-700 border-purple-200 text-xs"
                >
                  {key}
                </Badge>
              ))}
              {Object.keys(project.environment_variables).length > 3 && (
                <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-300 text-xs">
                  +{Object.keys(project.environment_variables).length - 3} más
                </Badge>
              )}
            </div>
          </div>
        )}

      </CardContent>

             {/* Botón GitHub SIEMPRE fijo arriba del footer */}
       {project.github_repository_url && (
         <div className="px-6 py-3 bg-slate-50/30">
           <div className="flex items-center gap-2">
             <ExternalLink className="h-4 w-4 text-slate-500" />
             <a
               href={project.github_repository_url}
               target="_blank"
               rel="noopener noreferrer"
               className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline transition-colors"
             >
               Ver en GitHub
             </a>
           </div>
         </div>
       )}

      {/* Footer fijo con separador - SIEMPRE abajo */}
      <div className="border-t border-slate-200 bg-slate-50/50 mt-auto">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Creado: {formatDateSafe(project.created_at)}</span>
            </div>
            {project.updated_at !== project.created_at && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Actualizado: {formatDateSafe(project.updated_at)}</span>
              </div>
            )}
          </div>
        </div>
      </div>



      {/* Modal de selección de iconos */}
      {showIconPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-md mx-4 shadow-xl pointer-events-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-800 font-semibold">Personalizar Icono</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowIconPicker(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-4 gap-3 mb-4">
              {availableIcons.map((iconData) => (
                <button
                  key={iconData.name}
                  onClick={() => {
                    setSelectedIcon(iconData.name);
                    // Aquí podrías llamar a una función para actualizar el proyecto
                    
                  }}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                    selectedIcon === iconData.name
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 bg-gradient-to-br from-green-600 to-blue-600 rounded flex items-center justify-center">
                      {React.createElement(iconData.icon, { className: "h-4 w-4 text-white" })}
                    </div>
                    <span className="text-xs text-slate-700">{iconData.label}</span>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowIconPicker(false)}
                className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (onUpdateIcon) {
                    onUpdateIcon(project.id, selectedIcon);
                  }
                  setShowIconPicker(false);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
