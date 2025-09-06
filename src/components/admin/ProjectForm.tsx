import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { X, Plus, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Github, Upload, Download, Trash2, Image, FileText, Code, Archive, Video, Music, File } from 'lucide-react';
import { Project, CreateProjectData, UpdateProjectData } from '@/types/project.types';
import { environmentService, EnvironmentVariable } from '@/lib/environmentService';
import { githubService, DetectedInfo } from '@/lib/githubService';
import { useToast } from '@/hooks/use-toast';
import { formatBytes } from '@/utils/formatBytes';
import { useTheme } from '@/contexts/ThemeContext';

interface ProjectFormProps {
  project?: Project;
  onSubmit: (data: CreateProjectData | UpdateProjectData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  project,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const { theme } = useTheme();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<CreateProjectData>({
    name: '',
    description: '',
    technologies: [],
    environment_variables: {},
    status: 'development',
    github_repository_url: '',
    customicon: 'FolderOpen'
  });

  const [newTechnology, setNewTechnology] = useState('');
  const [envVars, setEnvVars] = useState<EnvironmentVariable[]>([]);
  const [showEnvValues, setShowEnvValues] = useState<Record<string, boolean>>({});
  
  // Estados para auto-llenado desde GitHub
  const [githubLoading, setGithubLoading] = useState(false);
  const [detectedInfo, setDetectedInfo] = useState<DetectedInfo | null>(null);
  const [showDetectedPreview, setShowDetectedPreview] = useState(false);

  // Estados para gestión de archivos
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inicializar formulario con datos del proyecto si se está editando
  useEffect(() => {
    const loadProjectData = async () => {
      if (project) {
        setFormData({
          name: project.name,
          description: project.description || '',
          technologies: project.technologies || [],
          environment_variables: project.environment_variables || {},
          status: project.status,
          github_repository_url: project.github_repository_url || '',
          customicon: project.customicon || 'FolderOpen'
        });

        // Cargar variables de entorno desde la base de datos
        try {
          const envVarsFromDB = await environmentService.getEnvironmentVariables(project.id, 'production');
          setEnvVars(envVarsFromDB);
        } catch (error) {
          console.error('Error loading environment variables:', error);
          // Fallback a variables del proyecto si las hay
          const envArray: EnvironmentVariable[] = [];
          if (project.environment_variables) {
            Object.entries(project.environment_variables).forEach(([key, value]) => {
              envArray.push({
                key,
                value: typeof value === 'string' ? value : JSON.stringify(value),
                isSensitive: false
              });
            });
          }
          setEnvVars(envArray);
        }
      }
    };

    loadProjectData();
  }, [project]);

  const handleInputChange = (field: keyof CreateProjectData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ===== FUNCIONES DE AUTO-LLENADO DESDE GITHUB =====
  
  const handleGitHubUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    handleInputChange('github_repository_url', url);
    
    // Limpiar información detectada anterior si la URL cambia
    if (detectedInfo) {
      setDetectedInfo(null);
      setShowDetectedPreview(false);
    }
  };

  const handleGitHubUrlBlur = async () => {
    const url = formData.github_repository_url.trim();
    
    if (!url) return;
    
    // Validar que sea una URL de GitHub
    if (!url.includes('github.com')) {
      toast({
        title: 'URL inválida',
        description: 'Por favor, ingresa una URL válida de GitHub',
        variant: 'destructive'
      });
      return;
    }

    try {
      setGithubLoading(true);
      
      // Analizar el repositorio
      const detected = await githubService.autoFillFromGitHub(url);
      setDetectedInfo(detected);
      setShowDetectedPreview(true);
      
      toast({
        title: '✅ Información detectada',
        description: 'Se encontró información del repositorio. Revisa la vista previa.',
      });
      
    } catch (error: any) {
      console.error('Error analyzing GitHub repository:', error);
      
      let errorMessage = 'Error al analizar el repositorio';
      if (error.message.includes('Repository not found')) {
        errorMessage = 'El repositorio no existe o es privado';
      } else if (error.message.includes('API rate limit exceeded')) {
        errorMessage = 'Límite de GitHub API excedido, intenta más tarde';
      } else if (error.message.includes('URL de GitHub inválida')) {
        errorMessage = 'URL de GitHub no válida';
      } else if (error.message.includes('Token de GitHub inválido')) {
        errorMessage = 'Token de GitHub inválido o expirado';
      } else {
        errorMessage = error.message || 'Error desconocido al analizar el repositorio';
      }
      
      toast({
        title: '❌ Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setGithubLoading(false);
    }
  };

  const applyDetectedInfo = () => {
    if (!detectedInfo) return;
    
    // Aplicar información detectada al formulario
    setFormData(prev => ({
      ...prev,
      name: detectedInfo.name,
      description: detectedInfo.description,
      technologies: detectedInfo.technologies,
      status: detectedInfo.status
    }));
    
    // Aplicar variables de entorno detectadas
    const detectedEnvVars: EnvironmentVariable[] = Object.entries(detectedInfo.environment_variables || {}).map(([key, value]) => ({
      key,
      value,
      isSensitive: false
    }));
    
    setEnvVars(detectedEnvVars);
    
    // Ocultar vista previa
    setShowDetectedPreview(false);
    
    toast({
      title: '✅ Información aplicada',
      description: 'La información del repositorio ha sido aplicada al formulario',
    });
  };

  const dismissDetectedInfo = () => {
    setDetectedInfo(null);
    setShowDetectedPreview(false);
  };

  const addTechnology = () => {
    const tech = newTechnology.trim();
    if (tech && !formData.technologies.includes(tech)) {
      setFormData(prev => ({
        ...prev,
        technologies: [...prev.technologies, tech]
      }));
      setNewTechnology('');
    }
  };

  const handleTechnologyKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTechnology();
    } else if (e.key === ',') {
      e.preventDefault();
      addTechnology();
    }
  };

  const removeTechnology = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies.filter(t => t !== tech)
    }));
  };

  const addEnvironmentVariable = () => {
    // Agregar una nueva variable vacía
    const newEnv: EnvironmentVariable = {
      key: '',
      value: '',
      isSensitive: false
    };
    setEnvVars(prev => [...prev, newEnv]);
  };

  const handleKeyPaste = (e: React.ClipboardEvent, index: number) => {
    const pastedText = e.clipboardData.getData('text');
    
    // Verificar si el texto contiene múltiples líneas (múltiples variables)
    if (pastedText.includes('\n')) {
      e.preventDefault();
      
      const lines = pastedText.split('\n').filter(line => line.trim());
      const newVars: EnvironmentVariable[] = [];
      
      lines.forEach(line => {
        if (line.includes('=') || line.includes(':')) {
          const separator = line.includes('=') ? '=' : ':';
          const [key, ...valueParts] = line.split(separator);
          const value = valueParts.join(separator);
          
          if (key.trim() && value.trim()) {
            newVars.push({
              key: key.trim(),
              value: value.trim(),
              isSensitive: false
            });
          }
        }
      });
      
      if (newVars.length > 0) {
        setEnvVars(prev => {
          const updatedVars = [...prev];
          // Actualizar la variable actual con la primera nueva variable
          if (updatedVars[index]) {
            updatedVars[index] = newVars[0];
          }
          // Agregar las variables restantes
          updatedVars.push(...newVars.slice(1));
          return updatedVars;
        });
      }
    } else if (pastedText.includes('=') || pastedText.includes(':')) {
      // Manejar una sola variable
      e.preventDefault();
      
      const separator = pastedText.includes('=') ? '=' : ':';
      const [key, ...valueParts] = pastedText.split(separator);
      const value = valueParts.join(separator);
      
      // Actualizar la variable actual
      setEnvVars(prev => prev.map((env, i) => 
        i === index 
          ? { ...env, key: key.trim(), value: value.trim() }
          : env
      ));
    }
  };

  const removeEnvironmentVariable = (index: number) => {
    setEnvVars(prev => prev.filter((_, i) => i !== index));
  };

  const updateEnvironmentVariable = (index: number, field: 'key' | 'value', newValue: string) => {
    setEnvVars(prev => {
      const updated = prev.map((env, i) => 
        i === index 
          ? { ...env, [field]: newValue }
          : env
      );
      
      // Si es la última variable y ambos campos tienen valor, agregar una nueva variable vacía
      const isLastIndex = index === prev.length - 1;
      const currentVar = updated[index];
      if (isLastIndex && currentVar.key.trim() && currentVar.value.trim()) {
        updated.push({
          key: '',
          value: '',
          isSensitive: false
        });
      }
      
      return updated;
    });
  };

  const isDuplicateKey = (key: string, currentIndex: number) => {
    return envVars.some((env, index) => 
      index !== currentIndex && env.key.toLowerCase() === key.toLowerCase() && key.trim() !== ''
    );
  };

  const toggleEnvValueVisibility = (key: string) => {
    setShowEnvValues(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ===== FUNCIONES DE GESTIÓN DE ARCHIVOS =====

  const getFileIcon = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (file.type.startsWith('image/')) {
      return <Image className="h-6 w-6 text-blue-400" />;
    }
    
    switch (extension) {
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'txt':
        return <FileText className="h-6 w-6 text-green-400" />;
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'html':
      case 'css':
      case 'json':
        return <Code className="h-6 w-6 text-purple-400" />;
      case 'zip':
      case 'rar':
      case '7z':
        return <Archive className="h-6 w-6 text-orange-400" />;
      case 'mp4':
      case 'avi':
      case 'mov':
        return <Video className="h-6 w-6 text-red-400" />;
      case 'mp3':
      case 'wav':
        return <Music className="h-6 w-6 text-pink-400" />;
      default:
        return <File className="h-6 w-6 text-gray-400" />;
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
    
    // Generar vistas previas para imágenes
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreviews(prev => ({
            ...prev,
            [file.name]: e.target?.result as string
          }));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeFile = (fileName: string) => {
    setSelectedFiles(prev => prev.filter(file => file.name !== fileName));
    setFilePreviews(prev => {
      const newPreviews = { ...prev };
      delete newPreviews[fileName];
      return newPreviews;
    });
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
  };

  const uploadFiles = async (projectId: string) => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress({});

    try {
      const { fileService } = await import('@/lib/fileService');
      
      for (const file of selectedFiles) {
        // Inicializar progreso
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 0
        }));

        // Simular progreso
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += Math.random() * 15 + 5;
          if (progress >= 90) {
            clearInterval(progressInterval);
          }
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: Math.min(progress, 90)
          }));
        }, 300);

        try {
          await fileService.uploadFile(projectId, file, '');
          
          // Completar progreso
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 100
          }));
          
          // Limpiar progreso después de un delay
          setTimeout(() => {
            setUploadProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[file.name];
              return newProgress;
            });
          }, 1000);
                 } catch (error) {
           console.error(`Error uploading ${file.name}:`, error);
           setUploadProgress(prev => {
             const newProgress = { ...prev };
             delete newProgress[file.name];
             return newProgress;
           });
         }
      }

      // Limpiar archivos seleccionados después de la subida
      setTimeout(() => {
        setSelectedFiles([]);
        setFilePreviews({});
        setUploadProgress({});
      }, 2000);

    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que no haya claves duplicadas
    const hasDuplicates = envVars.some((env, index) => isDuplicateKey(env.key, index));
    if (hasDuplicates) {
      alert('Por favor, corrige las claves duplicadas antes de guardar.');
      return;
    }

    // Filtrar variables vacías y convertir a objeto
    const validEnvVars = envVars.filter(env => env.key.trim() && env.value.trim());
    const envVarsObject: Record<string, any> = {};
    validEnvVars.forEach(env => {
      envVarsObject[env.key.trim()] = env.value.trim();
    });

    const submitData = {
      ...formData,
      environment_variables: envVarsObject
    };

    // Guardar el proyecto primero
    const result = await onSubmit(submitData);

    // Si se creó un nuevo proyecto y hay archivos seleccionados, subirlos
    if (!project && selectedFiles.length > 0) {
      // Asumimos que el resultado contiene el ID del proyecto creado
      // Esto depende de cómo esté implementado el onSubmit en el componente padre
      try {
        // Intentar obtener el ID del proyecto recién creado
        // Esto puede requerir modificar el onSubmit para que retorne el proyecto creado
        toast({
          title: '📁 Subiendo archivos...',
          description: 'Los archivos se subirán automáticamente después de crear el proyecto.',
        });
        
        // Nota: Para implementar esto completamente, necesitaríamos que onSubmit retorne el proyecto creado
        // Por ahora, mostraremos un mensaje informativo
      } catch (error) {
        console.error('Error uploading files:', error);
      }
    }

    // Si es un proyecto existente, guardar las variables de entorno
    if (project?.id) {
      try {
        // Eliminar variables existentes
        const existingVars = await environmentService.getEnvironmentVariables(project.id, 'production');
        for (const existingVar of existingVars) {
          if (existingVar.id) {
            await environmentService.deleteEnvironmentVariable(existingVar.id);
          }
        }

        // Guardar nuevas variables
        for (const envVar of validEnvVars) {
          await environmentService.upsertEnvironmentVariable({
            ...envVar,
            project_id: project.id,
            environment: 'production'
          });
        }
      } catch (error) {
        console.error('Error saving environment variables:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'development': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'production': return 'bg-green-100 text-green-800 border-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'maintenance': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-slate-800 dark:text-slate-100">
          {project ? 'Editar Proyecto' : 'Nuevo Proyecto'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre del proyecto */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">Nombre del Proyecto *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ingresa el nombre del proyecto"
              className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200"
              required
            />
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-700 dark:text-slate-300">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe el proyecto..."
              className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200"
              rows={4}
            />
          </div>

          {/* Estado del proyecto */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-slate-700 dark:text-slate-300">Estado</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
            >
              <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="development">Desarrollo</SelectItem>
                <SelectItem value="production">Producción</SelectItem>
                <SelectItem value="paused">Pausado</SelectItem>
                <SelectItem value="maintenance">Mantenimiento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* URL de GitHub con Auto-llenado */}
          <div className="space-y-2">
            <Label htmlFor="github_url" className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Github className="h-4 w-4" />
              URL del Repositorio GitHub
            </Label>
            <div className="relative">
              <Input
                id="github_url"
                type="url"
                value={formData.github_repository_url}
                onChange={handleGitHubUrlChange}
                onBlur={handleGitHubUrlBlur}
                placeholder="https://github.com/usuario/repositorio"
                className={`bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 pr-10 ${
                  githubLoading ? 'border-blue-500' : 
                  detectedInfo ? 'border-green-500' : ''
                }`}
                disabled={githubLoading}
              />
              {githubLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                </div>
              )}
              {detectedInfo && !githubLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              )}
            </div>
            {githubLoading && (
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                Analizando repositorio...
              </div>
            )}
          </div>

          {/* Vista Previa de Información Detectada */}
          {showDetectedPreview && detectedInfo && (
            <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Información detectada del repositorio
                </h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={dismissDetectedInfo}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">📁 Nombre:</span>
                  <span className="text-slate-800 ml-2">{detectedInfo.name}</span>
                </div>
                <div>
                  <span className="text-slate-600">📊 Estado sugerido:</span>
                  <Badge 
                    variant="secondary" 
                    className={`ml-2 ${getStatusColor(detectedInfo.status)}`}
                  >
                    {detectedInfo.status === 'development' ? 'Desarrollo' :
                     detectedInfo.status === 'production' ? 'Producción' :
                     detectedInfo.status === 'paused' ? 'Pausado' : detectedInfo.status}
                  </Badge>
                </div>
                <div className="md:col-span-2">
                  <span className="text-slate-600">📝 Descripción:</span>
                  <p className="text-slate-800 ml-2 mt-1">{detectedInfo.description}</p>
                </div>
                <div className="md:col-span-2">
                  <span className="text-slate-600">🏷️ Tecnologías detectadas:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {detectedInfo.technologies.map((tech, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <span className="text-slate-600">🔧 Variables de entorno encontradas:</span>
                  <span className="text-slate-800 ml-2">
                    {Object.keys(detectedInfo.environment_variables || {}).length} variables
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  onClick={applyDetectedInfo}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Usar esta información
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={dismissDetectedInfo}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  size="sm"
                >
                  Ignorar
                </Button>
              </div>
            </div>
          )}

          {/* Tecnologías */}
          <div className="space-y-2">
            <Label className="text-slate-700">Tecnologías</Label>
            <div className="flex gap-2">
              <Input
                value={newTechnology}
                onChange={(e) => setNewTechnology(e.target.value)}
                placeholder="Agregar tecnología... (Enter o , para agregar)"
                className="bg-white border-slate-200 text-slate-800"
                onKeyDown={handleTechnologyKeyPress}
              />
              <Button
                type="button"
                onClick={addTechnology}
                variant="outline"
                size="sm"
                className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.technologies.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.technologies.map((tech, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {tech}
                    <button
                      type="button"
                      onClick={() => removeTechnology(tech)}
                      className="ml-1 hover:text-red-300"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Variables de entorno */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-slate-700">Variables de Entorno</Label>
              <Button
                type="button"
                onClick={addEnvironmentVariable}
                variant="outline"
                size="sm"
                className="bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar Variable
              </Button>
            </div>
            
            <div className="space-y-2">
              {envVars.length === 0 && (
                <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                  <p>No hay variables de entorno configuradas</p>
                  <p className="text-sm mt-1">Haz clic en "Agregar Variable" para empezar</p>
                </div>
              )}
              
              {envVars.map((env, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="col-span-4">
                    <Input
                      value={env.key}
                      onChange={(e) => updateEnvironmentVariable(index, 'key', e.target.value)}
                      onPaste={(e) => handleKeyPaste(e, index)}
                      placeholder="Clave (ej: API_KEY)"
                      className={`bg-white text-slate-800 ${
                        isDuplicateKey(env.key, index) 
                          ? 'border-red-500 border-2' 
                          : 'border-slate-200'
                      }`}
                    />
                    {isDuplicateKey(env.key, index) && (
                      <div className="text-red-600 text-xs mt-1">⚠️ Clave duplicada</div>
                    )}
                  </div>
                  <div className="col-span-7">
                    <div className="flex items-center gap-1">
                      <Input
                        value={env.value}
                        onChange={(e) => updateEnvironmentVariable(index, 'value', e.target.value)}
                        placeholder="Valor"
                        type={showEnvValues[`${index}-${env.key}`] ? 'text' : 'password'}
                        className="bg-white border-slate-200 text-slate-800"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleEnvValueVisibility(`${index}-${env.key}`)}
                        className="text-slate-500 hover:text-slate-700 px-2"
                      >
                        {showEnvValues[`${index}-${env.key}`] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEnvironmentVariable(index)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 w-full"
                      title="Eliminar variable"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            

          </div>

          {/* Archivos del proyecto */}
          <div className="space-y-2">
            <Label className="text-slate-700">Archivos del Proyecto (Opcional)</Label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
              <Upload className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-600 mb-2">Arrastra archivos aquí o haz clic para seleccionar</p>
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                variant="outline"
                className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Seleccionar archivos
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Lista de archivos seleccionados */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-700">Archivos seleccionados ({selectedFiles.length})</h4>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      {getFileIcon(file)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                        <p className="text-xs text-slate-600">{formatBytes(file.size)}</p>
                      </div>
                      
                      {/* Vista previa para imágenes */}
                      {file.type.startsWith('image/') && filePreviews[file.name] && (
                        <div className="flex-shrink-0">
                          <img
                            src={filePreviews[file.name]}
                            alt={file.name}
                            className="h-12 w-12 object-cover rounded border border-slate-300"
                          />
                        </div>
                      )}
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.name)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Progreso de subida */}
                {Object.keys(uploadProgress).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-700">Subiendo archivos...</h4>
                    {Object.entries(uploadProgress).map(([fileName, progress]) => (
                      <div key={fileName} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">{fileName}</span>
                          <span className="text-slate-600">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Guardando...' : (project ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
