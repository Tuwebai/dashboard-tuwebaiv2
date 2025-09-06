import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MessageSquare, Users, Calendar, ArrowRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatDateSafe } from '@/utils/formatDateSafe';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  progress: number;
  updated_at: string;
  collaborators?: any[];
  phases?: any[];
}

interface ProjectCollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
}

const ProjectCollaborationModal: React.FC<ProjectCollaborationModalProps> = ({
  isOpen,
  onClose,
  projects
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Mostrar todos los proyectos si no hay proyectos con colaboración específica
  const collaborativeProjects = projects.length > 0 ? projects : [];
  
  // Si no hay proyectos con colaboración específica, mostrar todos los proyectos
  const projectsToShow = collaborativeProjects.length > 0 ? collaborativeProjects : projects;

  const filteredProjects = projectsToShow.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300';
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300';
      case 'pending': return 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress': return 'En Progreso';
      case 'completed': return 'Completado';
      case 'pending': return 'Pendiente';
      default: return 'Sin iniciar';
    }
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
  };

  const handleOpenCollaboration = () => {
    if (selectedProject) {
      // Navegar al proyecto específico y abrir la sección de colaboración del cliente
      navigate(`/proyectos/${selectedProject.id}/colaboracion-cliente`);
      onClose();
    }
  };

  const getCollaborationCount = (project: Project) => {
    let count = 0;
    if (project.collaborators) count += project.collaborators.length;
    if (project.phases) {
      count += project.phases.reduce((acc, phase) => {
        return acc + (phase.comments ? phase.comments.length : 0);
      }, 0);
    }
    return count;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 shadow-2xl">
        <DialogHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <MessageSquare className="h-6 w-6 text-green-500" />
            Comunicación Activa - Seleccionar Proyecto
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-300">
            Elige un proyecto para acceder a su centro de colaboración y comunicación
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Barra de búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar proyectos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Lista de proyectos */}
          <div className="max-h-96 overflow-y-auto space-y-4">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">
                  {projects.length === 0 
                    ? "No hay proyectos disponibles" 
                    : searchTerm 
                      ? `No se encontraron proyectos que coincidan con "${searchTerm}"`
                      : "No hay proyectos con comunicación activa"
                  }
                </p>
                {projects.length > 0 && !searchTerm && (
                  <p className="text-sm text-gray-400">
                    Total de proyectos: {projects.length}
                  </p>
                )}
              </div>
            ) : (
              filteredProjects.map((project) => (
                <Card
                  key={project.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 ${
                    selectedProject?.id === project.id 
                      ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-500/10' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                  onClick={() => handleProjectSelect(project)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                            {project.name}
                          </h3>
                          <Badge className={getStatusColor(project.status)}>
                            {getStatusText(project.status)}
                          </Badge>
                        </div>
                        
                        {project.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                            {project.description}
                          </p>
                        )}

                        <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{getCollaborationCount(project)} interacciones</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Actualizado: {formatDateSafe(project.updated_at)}</span>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progreso</span>
                            <span>{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="h-2" />
                        </div>
                      </div>

                      <div className="ml-4">
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleOpenCollaboration}
              disabled={!selectedProject}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Abrir Colaboración
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectCollaborationModal;
