import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { 
  Plus, 
  Eye, 
  EyeOff, 
  Download, 
  Edit, 
  Trash2, 
  ExternalLink,
  Settings,
  Key,
  Lock,
  FolderOpen,
  Globe,
  Search
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { environmentService, EnvironmentVariable as EnvVar } from '@/lib/environmentService';
import { motion, AnimatePresence } from '@/components/OptimizedMotion';

interface EnvironmentVariable {
  key: string;
  value: string;
  isSensitive: boolean;
  environment?: string;
  id?: string;
}

interface ProjectWithVariables {
  id: string;
  name: string;
  description: string;
  customicon?: string;
  variables: EnvironmentVariable[];
}

const EnvironmentVariables: React.FC = () => {
  const { user, projects } = useApp();
  
  // Verificación de seguridad
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 text-slate-800 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }
  
  const [projectsWithVariables, setProjectsWithVariables] = useState<ProjectWithVariables[]>([]);
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [editingVar, setEditingVar] = useState<string | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('production');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar variables de entorno para todos los proyectos
  useEffect(() => {
    const loadAllProjectVariables = async () => {
      if (!projects || !Array.isArray(projects) || projects.length === 0) return;
      
      setIsLoading(true);
      try {
        const projectsWithVars: ProjectWithVariables[] = [];
        
        for (const project of projects) {
          try {
            if (!project.id) continue;
            const variables = await environmentService.getEnvironmentVariables(project.id, selectedEnvironment);
            projectsWithVars.push({
              ...project,
              id: project.id || '',
              variables: variables || []
            });
          } catch (error) {
            console.error(`Error loading variables for project ${project.id}:`, error);
            projectsWithVars.push({
              ...project,
              id: project.id || '',
              variables: []
            });
          }
        }
        
        setProjectsWithVariables(projectsWithVars);
      } catch (error) {
        console.error('Error loading project variables:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllProjectVariables();
  }, [projects, selectedEnvironment]);

  const toggleValueVisibility = (projectId: string, key: string) => {
    setShowValues(prev => ({ ...prev, [`${projectId}-${key}`]: !prev[`${projectId}-${key}`] }));
  };

  const addVariable = (projectId: string) => {
    if (!projectId) return;
    setProjectsWithVariables(prev => prev.map(project => {
      if (project.id === projectId) {
        const newVar: EnvironmentVariable = {
          key: '',
          value: '',
          isSensitive: false,
          environment: selectedEnvironment
        };
        return {
          ...project,
          variables: [...project.variables, newVar]
        };
      }
      return project;
    }));
    setEditingVar(`${projectId}-new-${Date.now()}`);
  };

  const updateVariable = (projectId: string, index: number, field: 'key' | 'value' | 'isSensitive', value: string | boolean) => {
    if (!projectId) return;
    setProjectsWithVariables(prev => prev.map(project => {
      if (project.id === projectId) {
        const updatedVariables = project.variables.map((v, i) => 
          i === index ? { ...v, [field]: value } : v
        );
        return { ...project, variables: updatedVariables };
      }
      return project;
    }));
  };

  const deleteVariable = async (projectId: string, index: number) => {
    if (!projectId) return;
    const project = projectsWithVariables.find(p => p.id === projectId);
    if (!project) return;

    const variable = project.variables[index];
    
    try {
      if (variable.id) {
        await environmentService.deleteEnvironmentVariable(variable.id);
      }
      
      setProjectsWithVariables(prev => prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            variables: p.variables.filter((_, i) => i !== index)
          };
        }
        return p;
      }));

      toast({
        title: "Variable eliminada",
        description: "La variable de entorno ha sido eliminada correctamente.",
      });
    } catch (error) {
      console.error('Error deleting variable:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la variable de entorno.",
        variant: "destructive",
      });
    }
  };

  const saveVariable = async (projectId: string, index: number) => {
    if (!projectId) return;
    const project = projectsWithVariables.find(p => p.id === projectId);
    if (!project) return;

    const variable = project.variables[index];
    if (!variable.key.trim()) {
      toast({
        title: "Error",
        description: "La clave de la variable es requerida.",
        variant: "destructive",
      });
      return;
    }

    // Verificar duplicados en el mismo proyecto
    const isDuplicate = project.variables.some((v, i) => 
      i !== index && v.key.toLowerCase() === variable.key.toLowerCase()
    );

    if (isDuplicate) {
      toast({
        title: "Error",
        description: "Ya existe una variable con esa clave en este proyecto.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Agregar el usuario actual como creador si no existe
      const variableToSave = {
        ...variable,
        project_id: projectId,
        environment: selectedEnvironment,
        created_by: user?.id || null
      };

      const savedVariable = await environmentService.upsertEnvironmentVariable(variableToSave);

      setProjectsWithVariables(prev => prev.map(p => {
        if (p.id === projectId) {
          const updatedVariables = p.variables.map((v, i) => 
            i === index ? { ...savedVariable } : v
          );
          return { ...p, variables: updatedVariables };
        }
        return p;
      }));

      setEditingVar(null);
      toast({
        title: "Variable guardada",
        description: "La variable de entorno ha sido guardada correctamente.",
      });
    } catch (error) {
      console.error('Error saving variable:', error);
      const errorMessage = error instanceof Error ? error.message : "No se pudo guardar la variable de entorno.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const exportProjectVariables = (project: ProjectWithVariables) => {
    const envContent = project.variables
      .filter(v => v.environment === selectedEnvironment)
      .map(v => `${v.key}=${v.value}`)
      .join('\n');
    
    const blob = new Blob([envContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}.env.${selectedEnvironment}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Variables exportadas",
      description: `Las variables de ${project.name} han sido exportadas.`,
    });
  };

  const toggleProjectExpansion = (projectId: string) => {
    if (!projectId) return;
    setExpandedProjects(prev => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId);
      } else {
        return [...prev, projectId];
      }
    });
  };

  const getProjectIcon = (project: ProjectWithVariables) => {
    if (project.customicon) {
      return project.customicon;
    }
    return 'FolderOpen';
  };

  // Filtrar proyectos por término de búsqueda
  const filteredProjects = projectsWithVariables.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Verificación adicional de seguridad
  if (!projects || !Array.isArray(projects)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 text-slate-800 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <div className="max-w-7xl mx-auto space-y-6 p-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Variables de Entorno</h1>
            <p className="text-slate-600 text-lg">Gestiona las variables de entorno de todos tus proyectos</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Barra de búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Buscar proyectos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64 bg-white border-slate-200 text-slate-800 placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            {/* Selector de entorno */}
            <Select value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
              <SelectTrigger className="w-40 bg-white border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="production">Producción</SelectItem>
                <SelectItem value="development">Desarrollo</SelectItem>
                <SelectItem value="staging">Staging</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Projects Grid */}
        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-slate-600 mt-4 text-lg">Cargando variables de entorno...</p>
          </motion.div>
        ) : filteredProjects.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <Globe className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No hay proyectos</h3>
              <p className="text-slate-500">Crea un proyecto para comenzar a gestionar variables de entorno</p>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence>
              {filteredProjects.filter(project => project.id).map((project, index) => (
                <motion.div
                  key={project.id || `project-${Math.random()}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="group"
                >
                  <Card className="bg-white border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <FolderOpen className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-xl text-slate-800">{project.name}</CardTitle>
                            <p className="text-slate-600 text-sm">{project.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 text-xs px-3 py-1">
                            {project.variables.length} variables
                          </Badge>
                          <Button
                            onClick={() => project.id && toggleProjectExpansion(project.id)}
                            variant="ghost"
                            size="sm"
                            className="text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                          >
                            {project.id && expandedProjects.includes(project.id) ? 'Ocultar' : 'Ver'}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <AnimatePresence>
                      {expandedProjects.includes(project.id) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <CardContent className="space-y-4 p-6">
                            {/* Variables List */}
                            <div className="space-y-3">
                              {project.variables.length === 0 ? (
                                <div className="text-center py-6">
                                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                                    <Key className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                                    <p className="text-slate-500 text-sm">No hay variables de entorno</p>
                                  </div>
                                </div>
                              ) : (
                                project.variables.map((variable, index) => (
                                  <motion.div
                                    key={`${project.id || 'unknown'}-${index}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors duration-200"
                                  >
                                    {/* Key */}
                                    <div className="flex-1">
                                      {editingVar === `${project.id || ''}-${index}` ? (
                                        <Input
                                          value={variable.key}
                                          onChange={(e) => project.id && updateVariable(project.id, index, 'key', e.target.value)}
                                          className="bg-white border-slate-300 text-slate-800 text-sm focus:border-blue-500 focus:ring-blue-500"
                                          placeholder="KEY"
                                        />
                                      ) : (
                                        <div className="flex items-center gap-2">
                                          <Key className="h-4 w-4 text-slate-500" />
                                          <span className="font-mono text-sm text-slate-700">{variable.key}</span>
                                          {variable.isSensitive && (
                                            <Lock className="h-4 w-4 text-amber-500" />
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    {/* Value */}
                                    <div className="flex-1">
                                      {editingVar === `${project.id || ''}-${index}` ? (
                                        <div className="flex gap-2">
                                          <Input
                                            value={variable.value}
                                            onChange={(e) => project.id && updateVariable(project.id, index, 'value', e.target.value)}
                                            type={variable.isSensitive && !showValues[`${project.id || ''}-${variable.key}`] ? 'password' : 'text'}
                                            className="bg-white border-slate-300 text-slate-800 text-sm focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="VALUE"
                                          />
                                          <Button
                                            onClick={() => project.id && updateVariable(project.id, index, 'isSensitive', !variable.isSensitive)}
                                            variant="ghost"
                                            size="sm"
                                            className="text-slate-600 hover:text-slate-800 hover:bg-slate-200 p-2"
                                          >
                                            {variable.isSensitive ? <Lock className="h-4 w-4" /> : <Key className="h-4 w-4" />}
                                          </Button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono text-sm text-slate-600">
                                            {variable.isSensitive && !showValues[`${project.id || ''}-${variable.key}`] 
                                              ? '•'.repeat(8) 
                                              : variable.value
                                            }
                                          </span>
                                          {variable.isSensitive && (
                                            <Button
                                              onClick={() => project.id && toggleValueVisibility(project.id, variable.key)}
                                              variant="ghost"
                                              size="sm"
                                              className="text-slate-600 hover:text-slate-800 hover:bg-slate-200 p-2"
                                            >
                                              {showValues[`${project.id || ''}-${variable.key}`] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1">
                                      {editingVar === `${project.id || ''}-${index}` ? (
                                        <>
                                          <Button
                                            onClick={() => project.id && saveVariable(project.id, index)}
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1"
                                          >
                                            ✓
                                          </Button>
                                          <Button
                                            onClick={() => setEditingVar(null)}
                                            variant="outline"
                                            size="sm"
                                            className="bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 text-xs px-3 py-1"
                                          >
                                            ✕
                                          </Button>
                                        </>
                                      ) : (
                                        <>
                                          <Button
                                            onClick={() => project.id && setEditingVar(`${project.id}-${index}`)}
                                            variant="ghost"
                                            size="sm"
                                            className="text-slate-600 hover:text-slate-800 hover:bg-slate-200 p-2"
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            onClick={() => project.id && deleteVariable(project.id, index)}
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </motion.div>
                                ))
                              )}
                            </div>

                            {/* Add New Variable */}
                            <AnimatePresence>
                              {editingVar?.startsWith(`${project.id || ''}-new-`) && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200"
                                >
                                  <div className="flex-1">
                                    <Input
                                      value={project.variables[project.variables.length - 1]?.key || ''}
                                      onChange={(e) => project.id && updateVariable(project.id, project.variables.length - 1, 'key', e.target.value)}
                                      className="bg-white border-blue-300 text-slate-800 text-sm focus:border-blue-500 focus:ring-blue-500"
                                      placeholder="KEY"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex gap-2">
                                      <Input
                                        value={project.variables[project.variables.length - 1]?.value || ''}
                                        onChange={(e) => project.id && updateVariable(project.id, project.variables.length - 1, 'value', e.target.value)}
                                        type={project.variables[project.variables.length - 1]?.isSensitive ? 'password' : 'text'}
                                        className="bg-white border-blue-300 text-slate-800 text-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="VALUE"
                                      />
                                      <Button
                                        onClick={() => project.id && updateVariable(project.id, project.variables.length - 1, 'isSensitive', !project.variables[project.variables.length - 1]?.isSensitive)}
                                        variant="ghost"
                                        size="sm"
                                        className="text-slate-600 hover:text-slate-800 hover:bg-slate-200 p-2"
                                      >
                                        {project.variables[project.variables.length - 1]?.isSensitive ? <Lock className="h-4 w-4" /> : <Key className="h-4 w-4" />}
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      onClick={() => project.id && saveVariable(project.id, project.variables.length - 1)}
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1"
                                    >
                                      ✓
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        setEditingVar(null);
                                        setProjectsWithVariables(prev => prev.map(p => {
                                          if (p.id === project.id) {
                                            return { ...p, variables: p.variables.slice(0, -1) };
                                          }
                                          return p;
                                        }));
                                      }}
                                      variant="outline"
                                      size="sm"
                                      className="bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 text-xs px-3 py-1"
                                    >
                                      ✕
                                    </Button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Project Actions */}
                            <div className="flex items-center gap-2 pt-4 border-t border-slate-200">
                              <Button
                                onClick={() => project.id && addVariable(project.id)}
                                size="sm"
                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Agregar Variable
                              </Button>
                              <Button
                                onClick={() => exportProjectVariables(project)}
                                variant="outline"
                                size="sm"
                                className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-sm hover:shadow-md transition-all duration-300"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Exportar
                              </Button>
                            </div>
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <Card className="bg-white border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Total Proyectos</p>
                  <p className="text-3xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors duration-300">{filteredProjects.length}</p>
                </div>
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <FolderOpen className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Total Variables</p>
                  <p className="text-3xl font-bold text-slate-800 group-hover:text-green-600 transition-colors duration-300">{filteredProjects.reduce((sum, p) => sum + p.variables.length, 0)}</p>
                </div>
                <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Key className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Sensibles</p>
                  <p className="text-3xl font-bold text-slate-800 group-hover:text-amber-600 transition-colors duration-300">{filteredProjects.reduce((sum, p) => sum + p.variables.filter(v => v.isSensitive).length, 0)}</p>
                </div>
                <div className="h-12 w-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Lock className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Entorno</p>
                  <p className="text-3xl font-bold text-slate-800 group-hover:text-purple-600 transition-colors duration-300 capitalize">{selectedEnvironment}</p>
                </div>
                <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Settings className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default EnvironmentVariables;
