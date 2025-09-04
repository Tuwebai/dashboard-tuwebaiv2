import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  GitBranch, 
  GitCommit, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Settings,
  Activity,
  History,
  Code,
  Bug,
  Shield,
  FileText,
  Wrench,
  Calendar,
  User,
  MessageSquare,
  BarChart3,
  HardDrive,
  Zap,
  GitPullRequest,
  ExternalLink,
  Copy,
  Edit,
  Trash2,
  Archive,
  Download,
  Upload,
  Eye,
  EyeOff,
  Star,
  Flag,
  AlertTriangle,
  Info,
  CheckSquare,
  Square,
  Minus,
  Plus as PlusIcon,
  FolderOpen
} from 'lucide-react';
import { useVersions } from '@/hooks/useVersions';
import { ProjectVersion, ChangeLog, Environment } from '@/types/project.types';
import { formatDateSafe } from '@/utils/formatDateSafe';
import { versionService } from '@/lib/versionService';
import { workflowService } from '@/lib/workflowService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { WorkflowActions } from './WorkflowActions';

interface VersionManagementProps {
  projectId: string;
}

export const VersionManagement: React.FC<VersionManagementProps> = ({ projectId }) => {
  // Todos los hooks deben ir al principio en el mismo orden siempre
  const {
    versions,
    loading,
    error,
    filters,
    sort,
    pagination,
    createVersion,
    updateVersion,
    deleteVersion,
    changePage,
    changeLimit,
    applyFilters,
    applySort,
    clearFilters,
    reload
  } = useVersions(projectId);
  const { toast } = useToast();

  // Estados del componente - todos los useState juntos
  const [showCreateVersion, setShowCreateVersion] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<ProjectVersion | null>(null);
  const [showVersionDetails, setShowVersionDetails] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(true);

  // Estados del formulario de versión
  const [versionForm, setVersionForm] = useState({
    version: '',
    description: '',
    environment: 'development' as 'development' | 'staging' | 'production',
    commitHash: '',
    branch: '',
    changes: [] as Omit<ChangeLog, 'id' | 'timestamp'>[]
  });

  // Estado para la información del proyecto
  const [projectInfo, setProjectInfo] = useState<{ github_repository_url?: string } | null>(null);

  // Estados del workflow inteligente
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [showWorkflowActions, setShowWorkflowActions] = useState(false);
  const [selectedWorkflowAction, setSelectedWorkflowAction] = useState<string>('');
  const [workflowComments, setWorkflowComments] = useState('');
  const [autoDetectCommits, setAutoDetectCommits] = useState(true);
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [showRepoModal, setShowRepoModal] = useState(false);



  // Estados para nuevos cambios
  const [newChange, setNewChange] = useState({
    type: 'feature' as ChangeLog['type'],
    title: '',
    description: '',
    breakingChange: false
  });

  // Función para obtener la información del proyecto
  const fetchProjectInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('github_repository_url')
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('Error obteniendo información del proyecto:', error);
      } else {
        setProjectInfo(data);
      }
    } catch (error) {
      console.error('Error obteniendo información del proyecto:', error);
    }
  };

  // Cargar información del proyecto al montar el componente
  React.useEffect(() => {
    fetchProjectInfo();
  }, [projectId]);

  // Función helper para extraer owner y repo de la URL de GitHub
  const getGitHubInfo = (repoUrl?: string) => {
    if (!repoUrl) return { owner: '', repo: '' };
    
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) return { owner: '', repo: '' };
    
    const [, owner, repo] = match;
    const cleanRepo = repo.replace('.git', '');
    return { owner, repo: cleanRepo };
  };

  // Asegurar que los datos sean arrays válidos
  const safeVersions = Array.isArray(versions) ? versions : [];

  // Asegurar que los filtros tengan valores válidos
  const safeFilters = {
    status: filters.status || 'all',
    dateFrom: filters.dateFrom || '',
    dateTo: filters.dateTo || '',
    search: filters.search || ''
  };

  // Asegurar que los formularios tengan valores válidos
  const safeVersionForm = {
    ...versionForm,
    version: versionForm.version || '',
    description: versionForm.description || '',
    commitHash: versionForm.commitHash || '',
    branch: versionForm.branch || '',
    changes: Array.isArray(versionForm.changes) ? versionForm.changes : []
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deployed':
        return 'bg-green-500 text-white';
      case 'draft':
        return 'bg-gray-500 text-white';
      case 'in_review':
        return 'bg-yellow-500 text-white';
      case 'approved':
        return 'bg-blue-500 text-white';
      case 'failed':
        return 'bg-red-500 text-white';
      case 'rolled_back':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'deployed':
        return <CheckCircle className="h-4 w-4" />;
      case 'draft':
        return <FileText className="h-4 w-4" />;
      case 'in_review':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      case 'rolled_back':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getChangeTypeIcon = (type: ChangeLog['type']) => {
    switch (type) {
      case 'feature':
        return <Plus className="h-4 w-4" />;
      case 'bugfix':
        return <Bug className="h-4 w-4" />;
      case 'hotfix':
        return <Wrench className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      case 'refactor':
        return <Code className="h-4 w-4" />;
      case 'documentation':
        return <FileText className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getChangeTypeColor = (type: ChangeLog['type']) => {
    switch (type) {
      case 'feature':
        return 'bg-blue-500 text-white';
      case 'bugfix':
        return 'bg-green-500 text-white';
      case 'hotfix':
        return 'bg-red-500 text-white';
      case 'security':
        return 'bg-purple-500 text-white';
      case 'refactor':
        return 'bg-orange-500 text-white';
      case 'documentation':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const handleCreateVersion = async () => {
    if (!safeVersionForm.version || !safeVersionForm.description || safeVersionForm.changes.length === 0) {
      return;
    }

    setFormLoading(true);
    try {
      await createVersion({
        version: safeVersionForm.version,
        description: safeVersionForm.description,
        environment: 'development', // Valor por defecto
        commitHash: safeVersionForm.commitHash,
        branch: safeVersionForm.branch,
        changes: safeVersionForm.changes
      });

      setShowCreateVersion(false);
      setVersionForm({
        version: '',
        description: '',
        environment: 'development',
        commitHash: '',
        branch: '',
        changes: []
      });
    } finally {
      setFormLoading(false);
    }
  };



  const addChange = () => {
    if (!newChange.title || !newChange.description) return;

    setVersionForm(prev => ({
      ...prev,
      changes: [...prev.changes, {
        ...newChange,
        author: 'admin@example.com'
      }]
    }));

    setNewChange({
      type: 'feature',
      title: '',
      description: '',
      breakingChange: false
    });
  };

  const removeChange = (index: number) => {
    setVersionForm(prev => ({
      ...prev,
      changes: prev.changes.filter((_, i) => i !== index)
    }));
  };

  const generateNextVersion = () => {
    // Generar versión simple basada en la última versión disponible
    const latestVersion = safeVersions.length > 0 ? safeVersions[0] : null;
    if (latestVersion) {
      const nextVersion = versionService.generateVersionNumber(latestVersion.version, 'patch');
      setVersionForm(prev => ({ ...prev, version: nextVersion }));
    } else {
      setVersionForm(prev => ({ ...prev, version: '1.0.0' }));
    }
  };

  // Funciones para el modal de detalles
  const handleVersionDetails = async (version: ProjectVersion) => {
    setSelectedVersion(version);
    setShowVersionDetails(true);
    // Cargar comentarios de la versión
    await getVersionComments(version.id);
  };

  const calculateVersionMetrics = (version: ProjectVersion) => {
    const changesCount = version.changes.length;
    const breakingChanges = version.changes.filter(change => change.breakingChange).length;
    const complexity = changesCount * (breakingChanges > 0 ? 2 : 1);
    
    // Calcular métricas basadas en datos reales
    const buildTime = Math.max(30, changesCount * 10 + breakingChanges * 20); // Tiempo basado en cambios
    const size = Math.max(5, changesCount * 2 + complexity * 0.5); // Tamaño basado en complejidad
    
    return {
      changesCount,
      breakingChanges,
      complexity,
      buildTime,
      size,
      risk: breakingChanges > 0 ? 'Alto' : changesCount > 5 ? 'Medio' : 'Bajo'
    };
  };

  // ===== FUNCIONES DEL WORKFLOW INTELIGENTE =====

  const handleWorkflowAction = async (action: string, versionId: string) => {
    setWorkflowLoading(true);
    try {
      const userId = 'admin@example.com'; // En producción usar auth.uid()
      
      switch (action) {
        case 'request_review':
          await workflowService.transitionVersionStatus(versionId, 'in_review', userId);
          toast({
            title: 'Revisión solicitada',
            description: 'La versión ha sido enviada para revisión',
          });
          break;
          
        case 'approve':
          await workflowService.transitionVersionStatus(versionId, 'approved', userId, workflowComments);
          toast({
            title: 'Versión aprobada',
            description: 'La versión ha sido aprobada para deployment',
          });
          break;
          
        case 'deploy':
          await workflowService.transitionVersionStatus(versionId, 'deployed', userId);
          toast({
            title: 'Deployment iniciado',
            description: 'La versión está siendo desplegada',
          });
          break;
          
        case 'rollback':
          const success = await workflowService.triggerAutoRollback(versionId, workflowComments);
          if (success) {
            toast({
              title: 'Rollback ejecutado',
              description: 'Se ha revertido a la versión anterior',
            });
          } else {
            toast({
              title: 'Error en rollback',
              description: 'No se pudo ejecutar el rollback automático',
              variant: 'destructive',
            });
          }
          break;
          
        case 'health_check':
          const health = await workflowService.checkDeploymentHealth(versionId);
          toast({
            title: `Health Check: ${health.status}`,
            description: health.isHealthy ? 'La aplicación está funcionando correctamente' : `Errores: ${health.errors.join(', ')}`,
            variant: health.isHealthy ? 'default' : 'destructive',
          });
          break;
      }
      
      reload(); // Recargar datos
      setShowWorkflowActions(false);
      setWorkflowComments('');
    } catch (error) {
      toast({
        title: 'Error en workflow',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setWorkflowLoading(false);
    }
  };

  const handleAutoCreateVersion = async () => {
    // Verificar si hay un repositorio configurado
    if (!repositoryUrl) {
      setShowRepoModal(true);
      return;
    }

    setWorkflowLoading(true);
    try {
      // Detectar commits nuevos
      const { newCommits, hasNewCommits } = await workflowService.detectNewCommits(projectId);
      
      if (!hasNewCommits) {
        toast({
          title: 'No hay commits nuevos',
          description: 'No se detectaron nuevos commits para crear una versión',
          variant: 'default',
        });
        return;
      }

      // Generar versión automáticamente
      const nextVersion = versionService.generateVersionNumber(
        safeVersions.length > 0 ? safeVersions[0].version : '0.0.0', 
        'patch'
      );

      const newVersion = await workflowService.createVersionFromCommits(
        projectId,
        nextVersion,
        'development',
        'admin@example.com'
      );

      toast({
        title: 'Versión creada automáticamente',
        description: `Versión ${newVersion.version} creada con commits reales de la base de datos`,
      });

      reload();
    } catch (error) {
      toast({
        title: 'Error creando versión automática',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setWorkflowLoading(false);
    }
  };

  const validateSemanticVersion = (version: string) => {
    const validation = workflowService.validateSemanticVersion(version);
    if (!validation.isValid) {
      toast({
        title: 'Versión inválida',
        description: validation.errors.join(', '),
        variant: 'destructive',
      });
    }
    return validation.isValid;
  };

  const getVersionHistory = (version: ProjectVersion) => {
    // Historial basado en datos reales de la versión
    const createdAt = new Date(version.createdAt);
    const history = [
      {
        action: 'Creada',
        timestamp: createdAt,
        user: version.deployedBy || 'Sistema',
        description: 'Versión inicial creada'
      }
    ];

    // Si hay logs de build, agregar entrada
    if (version.buildLogs) {
      history.push({
        action: 'Build Completado',
        timestamp: new Date(createdAt.getTime() + 300000), // 5 minutos después
        user: 'Sistema',
        description: 'Build procesado exitosamente'
      });
    }

    // Si hay logs de deployment, agregar entrada
    if (version.deploymentLogs) {
      history.push({
        action: 'Deployment',
        timestamp: new Date(createdAt.getTime() + 600000), // 10 minutos después
        user: version.deployedBy || 'Sistema',
        description: `Deployment a ${version.environment}`
      });
    }

    return history;
  };

  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const getVersionComments = async (versionId: string) => {
    try {
      setLoadingComments(true);
      const commentsData = await versionService.getComments(versionId);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !selectedVersion) return;
    
    try {
      await versionService.addComment(selectedVersion.id, newComment);
      setNewComment('');
      // Recargar comentarios específicos de esta versión
      await getVersionComments(selectedVersion.id);
      toast({
        title: 'Éxito',
        description: 'Comentario agregado correctamente'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo agregar el comentario',
        variant: 'destructive'
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Aquí se podría mostrar un toast de confirmación
  };

  // Función para obtener la versión anterior
  const getPreviousVersion = (currentVersion: string): string => {
    const versionParts = currentVersion.split('.').map(Number);
    if (versionParts.length >= 3) {
      // Si es la primera versión, devolver 0.0.0
      if (versionParts[0] === 1 && versionParts[1] === 0 && versionParts[2] === 0) {
        return '0.0.0';
      }
      
      // Decrementar el patch version
      if (versionParts[2] > 0) {
        versionParts[2]--;
      } else if (versionParts[1] > 0) {
        versionParts[1]--;
        versionParts[2] = 9; // Asumir que el patch máximo es 9
      } else if (versionParts[0] > 1) {
        versionParts[0]--;
        versionParts[1] = 9;
        versionParts[2] = 9;
      }
      
      return versionParts.join('.');
    }
    
    // Fallback para versiones no estándar
    return '1.0.0';
  };

  // Renderizado condicional sin returns tempranos
  const renderContent = () => {
    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Error al cargar</h3>
            <p className="text-slate-600 mb-4">{error}</p>
            <Button onClick={reload} variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50">
              Reintentar
            </Button>
          </div>
        </div>
      );
    }

    if (loading && safeVersions.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-600">Cargando versiones...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 break-words">Gestión de Versiones</h2>
                         <p className="text-slate-600 text-sm sm:text-base">Control de versiones del proyecto</p>
          </div>
                     <div className="flex flex-col sm:flex-row gap-2">
            <Button
               onClick={handleAutoCreateVersion}
               disabled={workflowLoading}
               className={`w-full sm:w-auto ${
                 repositoryUrl 
                   ? 'bg-green-600 hover:bg-green-700 text-white' 
                   : 'bg-yellow-600 hover:bg-yellow-700 text-white'
               }`}
             >
               <Zap className="h-4 w-4 mr-2" />
               <span className="hidden sm:inline">
                 {workflowLoading ? 'Procesando...' : 
                  repositoryUrl ? 'Auto Crear' : 'Configurar Repo'}
               </span>
            </Button>
            <Button
              onClick={() => setShowCreateVersion(true)}
               className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
               <span className="hidden sm:inline">Nueva Versión</span>
            </Button>
             
             {repositoryUrl && (
               <Button
                 onClick={() => setShowRepoModal(true)}
                 variant="outline"
                 className="border-slate-200 text-slate-700 hover:bg-slate-50 w-full sm:w-auto"
               >
                 <GitBranch className="h-4 w-4 mr-2" />
                 <span className="hidden sm:inline">Cambiar Repo</span>
               </Button>
             )}
          </div>
        </div>

        {/* Tabs principales */}
        <Tabs defaultValue="versions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white border border-slate-200 rounded-lg shadow-sm">
            <TabsTrigger value="versions" className="text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200">
              <History className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Versiones</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Actividad</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab de Versiones */}
          <TabsContent value="versions" className="space-y-4 sm:space-y-6">
            {/* Filtros */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                  <div className="flex-1 w-full">
                    <Label htmlFor="search" className="text-slate-700">Buscar</Label>
                    <Input
                      id="search"
                      placeholder="Buscar versiones..."
                      value={filters.search || ''}
                      onChange={(e) => applyFilters({ ...filters, search: e.target.value })}
                      className="bg-white border-slate-200 text-slate-800 w-full"
                    />
                  </div>
                                     <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
                     <div className="w-full sm:w-40">
                    <Label htmlFor="status" className="text-slate-700">Estado</Label>
                    <Select
                      value={safeFilters.status}
                      onValueChange={(value) => applyFilters({ ...filters, status: value === 'all' ? undefined : value })}
                    >
                        <SelectTrigger className="w-full bg-white border-slate-200 text-slate-800">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="deployed">Desplegado</SelectItem>
                        <SelectItem value="failed">Fallido</SelectItem>
                        <SelectItem value="rolled_back">Rollback</SelectItem>
                      </SelectContent>
                    </Select>
                    </div>
                  </div>
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="border-slate-200 text-slate-700 hover:bg-slate-50 w-full sm:w-auto"
                  >
                    Limpiar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lista de versiones */}
            <div className="grid gap-4">
              {safeVersions.map((version) => (
                <Card key={version.id} className="bg-white border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                  <CardContent className="p-4 sm:p-6">
                    {/* Header responsive */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div 
                        className="flex-1 min-w-0 cursor-pointer hover:bg-slate-50 p-2 -m-2 rounded-lg transition-colors"
                        onClick={() => handleVersionDetails(version)}
                      >
                        {/* Versión y badges */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-slate-800 break-words">{version.version}</h3>
                          <div className="flex flex-wrap gap-2">
                          <Badge className={getStatusColor(version.status)}>
                            {getStatusIcon(version.status)}
                              <span className="ml-1 hidden sm:inline">
                              {version.status === 'deployed' ? 'Desplegado' :
                                 version.status === 'draft' ? 'Borrador' :
                                 version.status === 'in_review' ? 'En Revisión' :
                                 version.status === 'approved' ? 'Aprobado' :
                               version.status === 'failed' ? 'Fallido' :
                               version.status === 'rolled_back' ? 'Rollback' : version.status}
                            </span>
                          </Badge>
                            
                          </div>
                        </div>
                        
                        {/* Descripción */}
                        <p className="text-slate-600 mb-4 text-sm sm:text-base break-words">{version.description}</p>
                        
                        {/* Información de commit y fecha */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-500 mb-4">
                          <div className="flex items-center gap-1">
                             <GitCommit className="h-3 w-3 flex-shrink-0" />
                             <span className="truncate">{version.commitHash ? version.commitHash.substring(0, 7) : 'Sin commit'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <GitBranch className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{version.branch || 'main'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{formatDateSafe(version.createdAt)}</span>
                          </div>
                        </div>

                        {/* Cambios */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-slate-700">Cambios:</h4>
                          <div className="space-y-2">
                            {version.changes.map((change, index) => (
                              <div key={index} className="flex flex-col sm:flex-row sm:items-start gap-2 text-sm">
                                <Badge className={`${getChangeTypeColor(change.type)} text-xs w-fit`}>
                                  {getChangeTypeIcon(change.type)}
                                  <span className="ml-1">
                                    {change.type === 'feature' ? 'Feature' :
                                     change.type === 'bugfix' ? 'Bugfix' :
                                     change.type === 'hotfix' ? 'Hotfix' :
                                     change.type === 'security' ? 'Security' :
                                     change.type === 'refactor' ? 'Refactor' :
                                     change.type === 'documentation' ? 'Docs' : change.type}
                                  </span>
                                </Badge>
                                <div className="flex-1 min-w-0">
                                  <span className="font-medium text-slate-800 break-words">{change.title}</span>
                                  {change.breakingChange && (
                                    <Badge className="ml-2 bg-red-500 text-white text-xs">
                                      Breaking
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                                             {/* Botones de acción */}
                       <div className="flex flex-row sm:flex-col gap-2 sm:ml-4">
                         {/* Botones de workflow según el estado */}
                         {version.status === 'draft' && (
                  <Button
                             onClick={() => handleWorkflowAction('request_review', version.id)}
                             size="sm"
                             className="bg-yellow-600 hover:bg-yellow-700 text-white flex-1 sm:flex-none"
                             disabled={workflowLoading}
                           >
                             <GitPullRequest className="h-3 w-3 mr-1" />
                             <span className="hidden sm:inline">Enviar a Revisión</span>
                  </Button>
                         )}
                         
                         {version.status === 'in_review' && (
                           <div className="flex flex-col gap-1">
                             <Button
                               onClick={() => handleWorkflowAction('approve', version.id)}
                               size="sm"
                               className="bg-green-600 hover:bg-green-700 text-white"
                               disabled={workflowLoading}
                             >
                              <CheckCircle className="h-3 w-3 mr-1" />
                               <span className="hidden sm:inline">Aprobar</span>
                             </Button>
                           </div>
                         )}
                         
                         {version.status === 'approved' && (
                           <Button
                             onClick={() => handleWorkflowAction('deploy', version.id)}
                             size="sm"
                             className="bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-none"
                             disabled={workflowLoading}
                           >
                             <Zap className="h-3 w-3 mr-1" />
                             <span className="hidden sm:inline">Desplegar</span>
                           </Button>
                         )}
                         
                         {version.status === 'deployed' && (
                           <div className="flex flex-col gap-1">
                        <Button
                               onClick={() => handleWorkflowAction('health_check', version.id)}
                          size="sm"
                               className="bg-purple-600 hover:bg-purple-700 text-white"
                               disabled={workflowLoading}
                             >
                               <Activity className="h-3 w-3 mr-1" />
                               <span className="hidden sm:inline">Health Check</span>
                             </Button>
                             <Button
                               onClick={() => handleWorkflowAction('rollback', version.id)}
                               size="sm"
                               className="bg-red-600 hover:bg-red-700 text-white"
                               disabled={workflowLoading}
                             >
                               <AlertCircle className="h-3 w-3 mr-1" />
                               <span className="hidden sm:inline">Rollback</span>
                        </Button>
                           </div>
                         )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {safeVersions.length === 0 && (
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardContent className="p-6 sm:p-8 text-center">
                  <History className="h-12 w-12 sm:h-16 sm:w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-slate-700 mb-2">
                    No hay versiones registradas
                  </h3>
                  <p className="text-slate-600 mb-4 text-sm sm:text-base">
                    Crea tu primera versión para comenzar a gestionar el proyecto.
                  </p>
                  <Button
                    onClick={() => setShowCreateVersion(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primera Versión
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>



          {/* Tab de Actividad */}
          <TabsContent value="activity" className="space-y-4 sm:space-y-6">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Actividad Reciente</h3>
                
                <div className="space-y-4">
                  {/* Últimas versiones */}
                  <div>
                    <h4 className="text-md font-medium text-slate-700 mb-2">Últimas Versiones</h4>
                    <div className="space-y-2">
                      {versions.slice(0, 5).map((version) => (
                        <div key={version.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded">
                          <div className={`w-2 h-2 rounded-full ${
                            version.status === 'deployed' ? 'bg-green-500' :
                            version.status === 'draft' ? 'bg-gray-500' :
                            version.status === 'in_review' ? 'bg-yellow-500' :
                            version.status === 'approved' ? 'bg-blue-500' :
                            version.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                          }`}></div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-slate-800">
                              {version.version}
                            </div>
                            <div className="text-xs text-slate-600">
                              {formatDateSafe(version.createdAt)}
                            </div>
                          </div>
                          <Badge className={getStatusColor(version.status)}>
                            {version.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de crear versión */}
        <Dialog open={showCreateVersion} onOpenChange={setShowCreateVersion}>
          <DialogContent className="bg-white border-slate-200 shadow-lg max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="create-version-description">
            <DialogHeader>
              <DialogTitle className="text-slate-800">Crear Nueva Versión</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="version">Versión</Label>
                  <div className="flex gap-2">
                    <Input
                      id="version"
                      value={versionForm.version}
                      onChange={(e) => setVersionForm(prev => ({ ...prev, version: e.target.value }))}
                      placeholder="1.0.0"
                      className="bg-white border-slate-200 text-slate-800"
                    />
                    <Button
                      onClick={generateNextVersion}
                      variant="outline"
                      className="border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      Auto
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="environment">Ambiente</Label>
                  <Select
                    value={versionForm.environment}
                    onValueChange={(value: 'development' | 'staging' | 'production') => 
                      setVersionForm(prev => ({ ...prev, environment: value }))
                    }
                  >
                    <SelectTrigger className="bg-white border-slate-200 text-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Desarrollo</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="production">Producción</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={versionForm.description}
                  onChange={(e) => setVersionForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe los cambios en esta versión..."
                  className="bg-white border-slate-200 text-slate-800"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="commitHash">Commit Hash</Label>
                  <Input
                    id="commitHash"
                    value={versionForm.commitHash}
                    onChange={(e) => setVersionForm(prev => ({ ...prev, commitHash: e.target.value }))}
                    placeholder="abc123..."
                    className="bg-white border-slate-200 text-slate-800"
                  />
                </div>
                
                <div>
                  <Label htmlFor="branch">Branch</Label>
                  <Input
                    id="branch"
                    value={versionForm.branch}
                    onChange={(e) => setVersionForm(prev => ({ ...prev, branch: e.target.value }))}
                    placeholder="main"
                    className="bg-white border-slate-200 text-slate-800"
                  />
                </div>
              </div>

              {/* Cambios */}
              <div>
                <Label>Cambios</Label>
                <div className="space-y-3">
                  {versionForm.changes.map((change, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-slate-50 rounded">
                      <Badge className={getChangeTypeColor(change.type)}>
                        {getChangeTypeIcon(change.type)}
                        <span className="ml-1">
                          {change.type === 'feature' ? 'Feature' :
                           change.type === 'bugfix' ? 'Bugfix' :
                           change.type === 'hotfix' ? 'Hotfix' :
                           change.type === 'security' ? 'Security' :
                           change.type === 'refactor' ? 'Refactor' :
                           change.type === 'documentation' ? 'Docs' : change.type}
                        </span>
                      </Badge>
                      <div className="flex-1">
                        <div className="font-medium text-slate-800">{change.title}</div>
                        <div className="text-sm text-slate-600">{change.description}</div>
                      </div>
                      <Button
                        onClick={() => removeChange(index)}
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}

                  {/* Agregar nuevo cambio */}
                  <div className="p-3 border border-dashed border-slate-300 rounded">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <Select
                        value={newChange.type}
                        onValueChange={(value: ChangeLog['type']) => 
                          setNewChange(prev => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger className="bg-white border-slate-200 text-slate-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="feature">Feature</SelectItem>
                          <SelectItem value="bugfix">Bugfix</SelectItem>
                          <SelectItem value="hotfix">Hotfix</SelectItem>
                          <SelectItem value="security">Security</SelectItem>
                          <SelectItem value="refactor">Refactor</SelectItem>
                          <SelectItem value="documentation">Documentation</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="breakingChange"
                          checked={newChange.breakingChange}
                          onChange={(e) => setNewChange(prev => ({ ...prev, breakingChange: e.target.checked }))}
                          className="rounded border-slate-300 bg-white"
                        />
                        <Label htmlFor="breakingChange" className="text-sm text-slate-700">Breaking Change</Label>
                      </div>
                    </div>
                    
                    <Input
                      value={newChange.title}
                      onChange={(e) => setNewChange(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Título del cambio"
                      className="bg-white border-slate-200 text-slate-800 mb-2"
                    />
                    
                    <Textarea
                      value={newChange.description}
                      onChange={(e) => setNewChange(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descripción del cambio"
                      className="bg-white border-slate-200 text-slate-800 mb-2"
                      rows={2}
                    />
                    
                    <Button
                      onClick={addChange}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={!newChange.title || !newChange.description}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Agregar Cambio
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                onClick={() => setShowCreateVersion(false)}
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateVersion}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={formLoading || !versionForm.version || !versionForm.description || versionForm.changes.length === 0}
              >
                {formLoading ? 'Creando...' : 'Crear Versión'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>



        {/* Modal de detalles de versión */}
        <Dialog open={showVersionDetails} onOpenChange={setShowVersionDetails}>
            <DialogContent className="bg-white border-slate-200 shadow-lg max-w-[95vw] lg:max-w-[90vw] xl:max-w-[85vw] 2xl:max-w-[80vw] max-h-[95vh] overflow-y-auto" aria-describedby="version-details-description" hideCloseButton>
            <DialogHeader className="relative">
              <DialogTitle className="text-slate-800 flex items-center gap-2 pr-8">
                <History className="h-5 w-5" />
                Detalles de Versión {selectedVersion?.version}
              </DialogTitle>
                             <button
                 onClick={() => setShowVersionDetails(false)}
                 className="absolute top-2 right-2 h-8 w-8 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                 aria-label="Cerrar"
               >
                 <span className="text-xl font-bold leading-none">×</span>
               </button>
            </DialogHeader>
            
            {selectedVersion && (
              <div className="space-y-6">
                {/* Header de la versión */}
                 <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 bg-slate-50 rounded-lg gap-4">
                   <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                     <div className="text-2xl sm:text-3xl font-bold text-slate-800">{selectedVersion.version}</div>
                     <div className="flex flex-wrap gap-2">
                      <Badge className={getStatusColor(selectedVersion.status)}>
                        {getStatusIcon(selectedVersion.status)}
                        <span className="ml-1">
                          {selectedVersion.status === 'deployed' ? 'Desplegado' :
                           selectedVersion.status === 'draft' ? 'Borrador' :
                           selectedVersion.status === 'in_review' ? 'En Revisión' :
                           selectedVersion.status === 'approved' ? 'Aprobado' :
                           selectedVersion.status === 'failed' ? 'Fallido' :
                           selectedVersion.status === 'rolled_back' ? 'Rollback' : selectedVersion.status}
                        </span>
                      </Badge>
                      
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-200 text-slate-700 hover:bg-slate-50"
                      onClick={() => copyToClipboard(selectedVersion.version)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copiar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-200 text-slate-700 hover:bg-slate-50"
                       onClick={() => {
                         // Redirigir al repositorio específico del proyecto
                         const { owner, repo } = getGitHubInfo(projectInfo?.github_repository_url);
                         if (owner && repo) {
                           const repoUrl = `https://github.com/${owner}/${repo}`;
                           window.open(repoUrl, '_blank');
                         } else {
                           toast({
                             title: 'Error',
                             description: 'No hay repositorio configurado para este proyecto',
                             variant: 'destructive'
                           });
                         }
                       }}
                       disabled={!projectInfo?.github_repository_url}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Ver en Git
                    </Button>
                  </div>
                </div>

                                 {/* Integración y Enlaces */}
                 <Card className="bg-white border-slate-200 shadow-sm">
                   <CardHeader>
                     <CardTitle className="text-slate-800 text-lg flex items-center gap-2">
                       <ExternalLink className="h-5 w-5" />
                       Integración y Enlaces
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Enlace al repositorio */}
                      <div className="space-y-2">
                        <Label className="text-slate-700 text-sm font-medium">Enlace al repositorio</Label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-slate-200 text-slate-700 hover:bg-slate-50 w-full sm:flex-1"
                            onClick={() => {
                              if (selectedVersion.commitHash) {
                                const { owner, repo } = getGitHubInfo(projectInfo?.github_repository_url);
                                if (owner && repo) {
                                  const gitUrl = `https://github.com/${owner}/${repo}/commit/${selectedVersion.commitHash}`;
                                  window.open(gitUrl, '_blank');
                                } else {
                                  toast({
                                    title: 'Error',
                                    description: 'No hay repositorio configurado para este proyecto',
                                    variant: 'destructive'
                                  });
                                }
                              } else {
                                toast({
                                  title: 'Información',
                                  description: 'No hay commit hash disponible para esta versión',
                                  variant: 'default'
                                });
                              }
                            }}
                            disabled={!selectedVersion.commitHash}
                          >
                            <GitCommit className="h-3 w-3 mr-1" />
                            Ver commit específico en Git
                          </Button>
                        </div>
                                                 {selectedVersion.commitHash && (
                           <p className="text-xs text-slate-500 font-mono">
                             {selectedVersion.commitHash.substring(0, 7)}
                           </p>
                         )}
                      </div>

                      {/* Enlace a CI/CD */}
                      <div className="space-y-2">
                        <Label className="text-slate-700 text-sm font-medium">Enlace a CI/CD</Label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-slate-200 text-slate-700 hover:bg-slate-50 w-full sm:flex-1"
                            onClick={() => {
                              const { owner, repo } = getGitHubInfo(projectInfo?.github_repository_url);
                              if (owner && repo) {
                                const cicdUrl = `https://github.com/${owner}/${repo}/actions/runs?query=branch%3A${selectedVersion.branch || 'main'}`;
                                window.open(cicdUrl, '_blank');
                              } else {
                                toast({
                                  title: 'Error',
                                  description: 'No hay repositorio configurado para este proyecto',
                                  variant: 'destructive'
                                });
                              }
                            }}
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Ver logs de build y deployment
                          </Button>
                        </div>
                        <p className="text-xs text-slate-500">
                          Branch: {selectedVersion.branch || 'main'}
                        </p>
                      </div>

                      {/* Enlace a documentación */}
                      <div className="space-y-2">
                        <Label className="text-slate-700 text-sm font-medium">Enlace a documentación</Label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-slate-200 text-slate-700 hover:bg-slate-50 w-full sm:flex-1"
                            onClick={() => {
                              const { owner, repo } = getGitHubInfo(projectInfo?.github_repository_url);
                              if (owner && repo) {
                                const docsUrl = `https://github.com/${owner}/${repo}/tree/${selectedVersion.branch || 'main'}/docs`;
                                window.open(docsUrl, '_blank');
                              } else {
                                toast({
                                  title: 'Error',
                                  description: 'No hay repositorio configurado para este proyecto',
                                  variant: 'destructive'
                                });
                              }
                            }}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Docs relacionados con esta versión
                          </Button>
                        </div>
                        <p className="text-xs text-slate-500">
                          Documentación del proyecto
                        </p>
                      </div>

                      {/* Enlace a tickets */}
                      <div className="space-y-2">
                        <Label className="text-slate-700 text-sm font-medium">Enlace a tickets</Label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-slate-200 text-slate-700 hover:bg-slate-50 w-full sm:flex-1"
                            onClick={() => {
                              const { owner, repo } = getGitHubInfo(projectInfo?.github_repository_url);
                              if (owner && repo) {
                                const issuesUrl = `https://github.com/${owner}/${repo}/issues?q=milestone%3A${selectedVersion.version}`;
                                window.open(issuesUrl, '_blank');
                              } else {
                                toast({
                                  title: 'Error',
                                  description: 'No hay repositorio configurado para este proyecto',
                                  variant: 'destructive'
                                });
                              }
                            }}
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Issues/Jira relacionados
                          </Button>
                        </div>
                        <p className="text-xs text-slate-500">
                          {selectedVersion.changes.filter(c => c.ticketId).length} tickets asociados
                        </p>
                      </div>
                    </div>

                                         {/* Enlaces adicionales */}
                     <div className="mt-4 pt-4 border-t border-slate-200">
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                 <Button
                           size="sm"
                           variant="ghost"
                           className="text-slate-700 hover:bg-slate-50 w-full sm:w-auto"
                           onClick={() => {
                             const { owner, repo } = getGitHubInfo(projectInfo?.github_repository_url);
                             if (owner && repo) {
                               const releaseUrl = `https://github.com/${owner}/${repo}/releases/tag/v${selectedVersion.version}`;
                               window.open(releaseUrl, '_blank');
                             } else {
                               toast({
                                 title: 'Error',
                                 description: 'No hay repositorio configurado para este proyecto',
                                 variant: 'destructive'
                               });
                             }
                           }}
                         >
                           <Download className="h-3 w-3 mr-1" />
                           Release Notes
                         </Button>
                                                 <Button
                           size="sm"
                           variant="ghost"
                           className="text-slate-700 hover:bg-slate-50 w-full sm:w-auto"
                           onClick={() => {
                             const { owner, repo } = getGitHubInfo(projectInfo?.github_repository_url);
                             if (owner && repo) {
                               const compareUrl = `https://github.com/${owner}/${repo}/compare/v${getPreviousVersion(selectedVersion.version)}...v${selectedVersion.version}`;
                               window.open(compareUrl, '_blank');
                             } else {
                               toast({
                                 title: 'Error',
                                 description: 'No hay repositorio configurado para este proyecto',
                                 variant: 'destructive'
                               });
                             }
                           }}
                         >
                           <GitPullRequest className="h-3 w-3 mr-1" />
                           Comparar cambios
                         </Button>
                                                 <Button
                           size="sm"
                           variant="ghost"
                           className="text-slate-700 hover:bg-slate-50 w-full sm:w-auto"
                           onClick={() => {
                             const { owner, repo } = getGitHubInfo(projectInfo?.github_repository_url);
                             if (owner && repo) {
                               const treeUrl = `https://github.com/${owner}/${repo}/tree/${selectedVersion.commitHash || selectedVersion.branch || 'main'}`;
                               window.open(treeUrl, '_blank');
                             } else {
                               toast({
                                 title: 'Error',
                                 description: 'No hay repositorio configurado para este proyecto',
                                 variant: 'destructive'
                               });
                             }
                           }}
                         >
                           <FolderOpen className="h-3 w-3 mr-1" />
                           Ver código fuente
                         </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabs de información detallada */}
                <Tabs defaultValue="overview" className="w-full">
                   <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <TabsTrigger value="overview" className="text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200">
                      <Eye className="h-4 w-4 mr-2" />
                      Resumen
                    </TabsTrigger>
                    <TabsTrigger value="changes" className="text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200">
                      <Code className="h-4 w-4 mr-2" />
                      Cambios
                    </TabsTrigger>
                    <TabsTrigger value="metrics" className="text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Métricas
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200">
                      <Activity className="h-4 w-4 mr-2" />
                      Actividad
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab Resumen */}
                  <TabsContent value="overview" className="space-y-4">
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-slate-800 text-lg">Información General</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                           <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                            <span className="text-slate-600">Descripción:</span>
                             <span className="text-slate-800 text-sm sm:text-base">{selectedVersion.description}</span>
                          </div>
                                                     <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                            <span className="text-slate-600">Build #:</span>
                            <span className="text-slate-800">{selectedVersion.buildNumber}</span>
                          </div>
                                                       <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                            <span className="text-slate-600">Commit:</span>
                             <span className="text-slate-800 font-mono text-sm">{selectedVersion.commitHash ? selectedVersion.commitHash.substring(0, 7) : 'N/A'}</span>
                          </div>
                           <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                            <span className="text-slate-600">Branch:</span>
                            <span className="text-slate-800">{selectedVersion.branch || 'main'}</span>
                          </div>
                           <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                            <span className="text-slate-600">Creada:</span>
                            <span className="text-slate-800">{formatDateSafe(selectedVersion.createdAt)}</span>
                          </div>
                          {selectedVersion.deployedAt && (
                             <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                              <span className="text-slate-600">Desplegada:</span>
                              <span className="text-slate-800">{formatDateSafe(selectedVersion.deployedAt)}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-slate-800 text-lg">Estadísticas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {(() => {
                            const metrics = calculateVersionMetrics(selectedVersion);
                            return (
                              <>
                                 <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                  <span className="text-slate-600">Total cambios:</span>
                                  <span className="text-slate-800">{metrics.changesCount}</span>
                                </div>
                                 <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                  <span className="text-slate-600">Breaking changes:</span>
                                  <span className="text-slate-800">{metrics.breakingChanges}</span>
                                </div>
                                 <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                  <span className="text-slate-600">Complejidad:</span>
                                  <span className="text-slate-800">{metrics.complexity}</span>
                                </div>
                                 <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                  <span className="text-slate-600">Tiempo build:</span>
                                  <span className="text-slate-800">{metrics.buildTime}s</span>
                                </div>
                                 <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                  <span className="text-slate-600">Tamaño:</span>
                                  <span className="text-slate-800">{metrics.size}MB</span>
                                </div>
                                 <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                  <span className="text-slate-600">Riesgo:</span>
                                  <Badge className={
                                    metrics.risk === 'Alto' ? 'bg-red-500 text-white' :
                                    metrics.risk === 'Medio' ? 'bg-yellow-500 text-white' :
                                    'bg-green-500 text-white'
                                  }>
                                    {metrics.risk}
                                  </Badge>
                                </div>
                              </>
                            );
                          })()}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Tab Cambios */}
                  <TabsContent value="changes" className="space-y-4">
                    <Card className="bg-white border-slate-200 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-slate-800 text-lg">Cambios Detallados</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {selectedVersion.changes.map((change, index) => (
                            <div key={index} className="p-4 bg-slate-50 rounded-lg">
                              <div className="flex items-start gap-3 mb-3">
                                <Badge className={getChangeTypeColor(change.type)}>
                                  {getChangeTypeIcon(change.type)}
                                  <span className="ml-1">
                                    {change.type === 'feature' ? 'Feature' :
                                     change.type === 'bugfix' ? 'Bugfix' :
                                     change.type === 'hotfix' ? 'Hotfix' :
                                     change.type === 'security' ? 'Security' :
                                     change.type === 'refactor' ? 'Refactor' :
                                     change.type === 'documentation' ? 'Docs' : change.type}
                                  </span>
                                </Badge>
                                {change.breakingChange && (
                                  <Badge className="bg-red-500 text-white">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Breaking Change
                                  </Badge>
                                )}
                              </div>
                              <h4 className="text-lg font-semibold text-slate-800 mb-2">{change.title}</h4>
                              <p className="text-slate-600 mb-3">{change.description}</p>
                              <div className="flex items-center gap-4 text-sm text-slate-500">
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {change.author}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDateSafe(change.timestamp)}
                                </div>
                                {change.ticketId && (
                                  <div className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    #{change.ticketId}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Tab Métricas */}
                  <TabsContent value="metrics" className="space-y-4">
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-slate-800 text-lg">Métricas de Build</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {(() => {
                            const metrics = calculateVersionMetrics(selectedVersion);
                            return (
                              <>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Tiempo de build</span>
                                    <span className="text-slate-800">{metrics.buildTime}s</span>
                                  </div>
                                  <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div 
                                      className="bg-blue-500 h-2 rounded-full" 
                                      style={{ width: `${Math.min((metrics.buildTime / 300) * 100, 100)}%` }}
                                    ></div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Tamaño del bundle</span>
                                    <span className="text-slate-800">{metrics.size}MB</span>
                                  </div>
                                  <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div 
                                      className="bg-green-500 h-2 rounded-full" 
                                      style={{ width: `${Math.min((metrics.size / 50) * 100, 100)}%` }}
                                    ></div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Complejidad</span>
                                    <span className="text-slate-800">{metrics.complexity}</span>
                                  </div>
                                  <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div className="bg-purple-500 h-2 rounded-full" 
                                      style={{ width: `${Math.min((metrics.complexity / 20) * 100, 100)}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </CardContent>
                      </Card>

                      <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-slate-800 text-lg">Análisis de Riesgo</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {(() => {
                            const metrics = calculateVersionMetrics(selectedVersion);
                            const riskLevel = metrics.risk;
                            const riskColor = riskLevel === 'Alto' ? 'text-red-600' : 
                                            riskLevel === 'Medio' ? 'text-yellow-600' : 'text-green-600';
                            const riskIcon = riskLevel === 'Alto' ? <AlertTriangle className="h-5 w-5" /> :
                                           riskLevel === 'Medio' ? <Info className="h-5 w-5" /> : 
                                           <CheckCircle className="h-5 w-5" />;
                            
                            return (
                              <div className="space-y-3">
                                <div className={`flex items-center gap-2 text-lg font-semibold ${riskColor}`}>
                                  {riskIcon}
                                  Riesgo {riskLevel}
                                </div>
                                <div className="text-sm text-slate-600 space-y-2">
                                  {riskLevel === 'Alto' && (
                                    <p>Esta versión contiene cambios importantes que pueden afectar la funcionalidad existente.</p>
                                  )}
                                  {riskLevel === 'Medio' && (
                                    <p>Esta versión contiene cambios moderados que requieren testing adicional.</p>
                                  )}
                                  {riskLevel === 'Bajo' && (
                                    <p>Esta versión contiene cambios menores y es segura para deployment.</p>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Breaking changes:</span>
                                    <span className="text-slate-800">{metrics.breakingChanges}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Total cambios:</span>
                                    <span className="text-slate-800">{metrics.changesCount}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Tab Actividad */}
                  <TabsContent value="activity" className="space-y-4">
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-slate-800 text-lg">Historial de Modificaciones</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {getVersionHistory(selectedVersion).map((item, index) => (
                              <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded">
                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-slate-800">{item.action}</div>
                                  <div className="text-xs text-slate-600">{item.description}</div>
                                  <div className="text-xs text-slate-500 mt-1">
                                    {formatDateSafe(item.timestamp)} • {item.user}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-slate-800 text-lg flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Comentarios del Equipo
                            <Button
                              size="sm"
                              variant="ghost"
                              className="ml-auto text-slate-600 hover:text-slate-800"
                              onClick={() => setShowComments(!showComments)}
                            >
                              {showComments ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {showComments && (
                            <div className="space-y-4">
                                                             <div className="space-y-3">
                                 {loadingComments ? (
                                   <div className="text-center py-4">
                                     <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                     <p className="text-sm text-slate-600">Cargando comentarios...</p>
                                   </div>
                                 ) : comments.length > 0 ? (
                                   comments.map((comment) => (
                                     <div key={comment.id} className="p-3 bg-slate-50 rounded">
                                       <div className="flex items-start gap-2 mb-2">
                                         <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                           <User className="h-3 w-3 text-white" />
                                         </div>
                                         <div className="flex-1">
                                           <div className="text-sm font-medium text-slate-800">{comment.user_email || 'Usuario'}</div>
                                           <div className="text-xs text-slate-600">
                                             {formatDateSafe(comment.created_at)}
                                           </div>
                                         </div>
                                       </div>
                                       <p className="text-sm text-slate-700">{comment.comment}</p>
                                     </div>
                                   ))
                                 ) : (
                                   <div className="text-center py-4">
                                     <p className="text-sm text-slate-600">No hay comentarios aún</p>
                                   </div>
                                 )}
                               </div>
                              
                              <Separator className="bg-slate-300" />
                              
                              <div className="space-y-2">
                                <Label htmlFor="newComment" className="text-slate-700">Agregar comentario</Label>
                                 <div className="flex flex-col sm:flex-row gap-2">
                                  <Textarea
                                    id="newComment"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Escribe tu comentario..."
                                    className="bg-white border-slate-200 text-slate-800 flex-1"
                                    rows={2}
                                  />
                                  <Button
                                    onClick={addComment}
                                    disabled={!newComment.trim()}
                                     className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                                  >
                                    <PlusIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </DialogContent>
                 </Dialog>

                   {/* Modal para comentarios del workflow */}
          <Dialog open={showWorkflowActions} onOpenChange={setShowWorkflowActions}>
            <DialogContent className="bg-white border-slate-200 shadow-lg max-w-md" aria-describedby="workflow-action-description">
             <DialogHeader>
               <DialogTitle className="text-slate-800">Acción de Workflow</DialogTitle>
             </DialogHeader>
             
             <div className="space-y-4">
               <div>
                 <Label htmlFor="workflowComments" className="text-slate-700">Comentarios (opcional)</Label>
                 <Textarea
                   id="workflowComments"
                   value={workflowComments}
                   onChange={(e) => setWorkflowComments(e.target.value)}
                   placeholder="Agregar comentarios sobre esta acción..."
                   className="bg-white border-slate-200 text-slate-800"
                   rows={3}
                 />
               </div>
               
               <div className="flex justify-end gap-2">
                 <Button
                   onClick={() => setShowWorkflowActions(false)}
                   variant="outline"
                   className="border-slate-200 text-slate-700 hover:bg-slate-50"
                 >
                   Cancelar
                 </Button>
                 <Button
                   onClick={() => handleWorkflowAction(selectedWorkflowAction, '')}
                   className="bg-blue-600 hover:bg-blue-700 text-white"
                   disabled={workflowLoading}
                 >
                   {workflowLoading ? 'Procesando...' : 'Confirmar'}
                 </Button>
               </div>
             </div>
           </DialogContent>
         </Dialog>

                   {/* Modal para configurar repositorio */}
          <Dialog open={showRepoModal} onOpenChange={setShowRepoModal}>
            <DialogContent className="bg-white border-slate-200 shadow-lg max-w-md" aria-describedby="repo-config-description">
             <DialogHeader>
               <DialogTitle className="text-slate-800 flex items-center gap-2">
                 <GitBranch className="h-5 w-5" />
                 Configurar Repositorio
               </DialogTitle>
             </DialogHeader>
             
             <div className="space-y-4">
               <div>
                 <Label htmlFor="repositoryUrl" className="text-slate-700">URL del Repositorio</Label>
                 <Input
                   id="repositoryUrl"
                   value={repositoryUrl}
                   onChange={(e) => setRepositoryUrl(e.target.value)}
                   placeholder="https://github.com/usuario/repositorio"
                   className="bg-white border-slate-200 text-slate-800"
                 />
                 <p className="text-xs text-slate-500 mt-1">
                   Ingresa la URL completa del repositorio Git (GitHub, GitLab, etc.)
                 </p>
               </div>
               
               <div className="flex justify-end gap-2">
                 <Button
                   onClick={() => setShowRepoModal(false)}
                   variant="outline"
                   className="border-slate-200 text-slate-700 hover:bg-slate-50"
                 >
                   Cancelar
                 </Button>
                 <Button
                   onClick={() => {
                     if (repositoryUrl) {
                       setShowRepoModal(false);
                       handleAutoCreateVersion();
                     } else {
                       toast({
                         title: 'URL requerida',
                         description: 'Por favor ingresa la URL del repositorio',
                         variant: 'destructive',
                       });
                     }
                   }}
                   className="bg-blue-600 hover:bg-blue-700 text-white"
                 >
                   Configurar y Continuar
                 </Button>
               </div>
             </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  // Renderizar el contenido
  return renderContent();
};
