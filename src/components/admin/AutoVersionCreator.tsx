import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  GitMerge, 
  Tag, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  Upload,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  BarChart3,
  Code,
  FileText,
  Database,
  Settings
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

// =====================================================
// COMPONENTE DE CREACIÓN AUTOMÁTICA DE VERSIONES
// =====================================================

export default function AutoVersionCreator() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});

  // Estados para formularios
  const [showVersionForm, setShowVersionForm] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [autoDeploy, setAutoDeploy] = useState(false);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadVersionData();
  }, []);

  // =====================================================
  // CARGA DE DATOS
  // =====================================================

  const loadVersionData = async () => {
    try {
      setLoading(true);
      
      // Cargar datos en paralelo
      const [versionsData, projectsData, deploymentsData, statsData] = await Promise.all([
        getVersions(),
        getProjects(),
        getDeployments(),
        getVersionStats()
      ]);

      setVersions(versionsData);
      setProjects(projectsData);
      setDeployments(deploymentsData);
      setStats(statsData);
      
    } catch (error) {
      console.error('Error loading version data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de versiones',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getVersions = async () => {
    try {
      const { data, error } = await supabase
        .from('project_versions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting versions:', error);
      return [];
    }
  };

  const getProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting projects:', error);
      return [];
    }
  };

  const getDeployments = async () => {
    try {
      const { data, error } = await supabase
        .from('deployments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting deployments:', error);
      return [];
    }
  };

  const getVersionStats = async () => {
    try {
      const [versionsCount, projectsCount, deploymentsCount, activeDeployments] = await Promise.all([
        getVersions().then(v => v.length),
        getProjects().then(p => p.length),
        getDeployments().then(d => d.length),
        getDeployments().then(d => d.filter(deploy => deploy.status === 'active').length)
      ]);

      return {
        totalVersions: versionsCount,
        totalProjects: projectsCount,
        totalDeployments: deploymentsCount,
        activeDeployments,
        lastUpdate: new Date().toLocaleString()
      };
    } catch (error) {
      console.error('Error getting version stats:', error);
      return {};
    }
  };

  // =====================================================
  // FUNCIONES DE GESTIÓN DE VERSIONES
  // =====================================================

  const createVersion = async (versionData: any) => {
    try {
      const { error } = await supabase
        .from('project_versions')
        .insert([{
          ...versionData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast({
        title: 'Versión creada',
        description: 'La nueva versión se creó correctamente'
      });

      loadVersionData();
      setShowVersionForm(false);
    } catch (error) {
      console.error('Error creating version:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la versión',
        variant: 'destructive'
      });
    }
  };

  const updateVersion = async (versionId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('project_versions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', versionId);

      if (error) throw error;

      toast({
        title: 'Versión actualizada',
        description: 'La versión se actualizó correctamente'
      });

      loadVersionData();
      setSelectedVersion(null);
    } catch (error) {
      console.error('Error updating version:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la versión',
        variant: 'destructive'
      });
    }
  };

  const deleteVersion = async (versionId: string) => {
    try {
      const { error } = await supabase
        .from('project_versions')
        .delete()
        .eq('id', versionId);

      if (error) throw error;

      toast({
        title: 'Versión eliminada',
        description: 'La versión se eliminó correctamente'
      });

      loadVersionData();
    } catch (error) {
      console.error('Error deleting version:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la versión',
        variant: 'destructive'
      });
    }
  };

  const deployVersion = async (versionId: string) => {
    try {
      const { error } = await supabase
        .from('deployments')
        .insert([{
          version_id: versionId,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast({
        title: 'Despliegue iniciado',
        description: 'El despliegue de la versión se inició correctamente'
      });

      loadVersionData();
    } catch (error) {
      console.error('Error deploying version:', error);
      toast({
        title: 'Error',
        description: 'No se pudo iniciar el despliegue',
        variant: 'destructive'
      });
    }
  };

  const rollbackVersion = async (versionId: string) => {
    try {
      // Lógica para hacer rollback a una versión anterior
      const { error } = await supabase
        .from('deployments')
        .insert([{
          version_id: versionId,
          status: 'rollback',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast({
        title: 'Rollback iniciado',
        description: 'El rollback a la versión anterior se inició correctamente'
      });

      loadVersionData();
    } catch (error) {
      console.error('Error rolling back version:', error);
      toast({
        title: 'Error',
        description: 'No se pudo iniciar el rollback',
        variant: 'destructive'
      });
    }
  };

  // =====================================================
  // RENDERIZADO
  // =====================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando gestor de versiones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Gestor de Versiones</h1>
          <p className="text-slate-600">
            Creación automática y gestión de versiones de proyectos
          </p>
        </div>
        <Button onClick={() => setShowVersionForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Versión
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-slate-500">Total Versiones</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalVersions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-slate-500">Proyectos</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalProjects || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <GitCommit className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-slate-500">Despliegues</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalDeployments || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-slate-500">Activos</p>
                <p className="text-2xl font-bold text-slate-800">{stats.activeDeployments || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-slate-100 border-slate-200">
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="versions">Versiones</TabsTrigger>
          <TabsTrigger value="deployments">Despliegues</TabsTrigger>
          <TabsTrigger value="projects">Proyectos</TabsTrigger>
        </TabsList>

        {/* Vista General */}
        <TabsContent value="overview" className="space-y-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-800">Estado del Sistema de Versiones</CardTitle>
              <CardDescription className="text-slate-600">
                Resumen general del gestor de versiones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <GitBranch className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-slate-800">Versiones Disponibles</p>
                      <p className="text-sm text-slate-600">
                        {stats.totalVersions || 0} versiones en el sistema
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-slate-300 text-slate-700">
                    {stats.totalVersions || 0} total
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <GitCommit className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-slate-800">Estado de Despliegues</p>
                      <p className="text-sm text-slate-600">
                        {stats.activeDeployments || 0} despliegues activos
                      </p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-600">
                    Operativo
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Versiones */}
        <TabsContent value="versions" className="space-y-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-800">Lista de Versiones</CardTitle>
              <CardDescription className="text-slate-600">
                Gestiona las versiones de los proyectos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {versions.map((version) => (
                  <div key={version.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-white">
                    <div className="flex items-center gap-3">
                      <Tag className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-slate-800">{version.version_number}</p>
                        <p className="text-sm text-slate-600">{version.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={version.status === 'stable' ? 'default' : 'secondary'}>
                        {version.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deployVersion(version.id)}
                      >
                        <GitCommit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedVersion(version)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteVersion(version.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Despliegues */}
        <TabsContent value="deployments" className="space-y-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-800">Historial de Despliegues</CardTitle>
              <CardDescription className="text-slate-600">
                Monitoreo de despliegues y rollbacks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deployments.map((deployment) => (
                  <div key={deployment.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-white">
                    <div className="flex items-center gap-3">
                      <GitCommit className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-slate-800">Versión {deployment.version_id}</p>
                        <p className="text-sm text-slate-600">
                          {new Date(deployment.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        deployment.status === 'active' ? 'default' :
                        deployment.status === 'pending' ? 'secondary' :
                        deployment.status === 'failed' ? 'destructive' : 'outline'
                      }>
                        {deployment.status}
                      </Badge>
                      {deployment.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => rollbackVersion(deployment.version_id)}
                        >
                          <GitMerge className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Proyectos */}
        <TabsContent value="projects" className="space-y-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-800">Proyectos Disponibles</CardTitle>
              <CardDescription className="text-slate-600">
                Lista de proyectos para crear versiones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-white">
                    <div className="flex items-center gap-3">
                      <Code className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-slate-800">{project.name}</p>
                        <p className="text-sm text-slate-600">{project.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                        {project.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedVersion({ project_id: project.id });
                          setShowVersionForm(true);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
