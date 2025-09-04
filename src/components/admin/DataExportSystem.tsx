import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  Calendar, 
  Filter, 
  RefreshCw, 
  Settings,
  Mail,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Eye,
  Zap,
  BarChart3,
  Users,
  DollarSign,
  Target,
  Database
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface ExportJob {
  id: string;
  name: string;
  description: string;
  dataType: 'projects' | 'users' | 'payments' | 'tickets' | 'custom';
  format: 'pdf' | 'excel' | 'csv' | 'json';
  filters: ExportFilters;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  error?: string;
  fileSize?: number;
  recordCount?: number;
}

interface ExportFilters {
  dateRange: string;
  status?: string[];
  roles?: string[];
  paymentStatus?: string[];
  priority?: string[];
  customFields?: Record<string, any>;
  includeArchived: boolean;
  includeDeleted: boolean;
}

interface ScheduledExport {
  id: string;
  name: string;
  description: string;
  dataType: 'projects' | 'users' | 'payments' | 'tickets' | 'custom';
  format: 'pdf' | 'excel' | 'csv' | 'json';
  schedule: ExportSchedule;
  recipients: string[];
  isActive: boolean;
  lastExecuted?: Date;
  nextExecution?: Date;
}

interface ExportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  time: string;
  dayOfWeek?: number; // 0-6 (Sunday-Saturday)
  dayOfMonth?: number; // 1-31
  timezone: string;
}

export default function DataExportSystem() {
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [scheduledExports, setScheduledExports] = useState<ScheduledExport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingExport, setEditingExport] = useState<ExportJob | null>(null);
  const [newExport, setNewExport] = useState<Partial<ExportJob>>({
    name: '',
    description: '',
    dataType: 'projects',
    format: 'excel',
    filters: { 
      dateRange: '30d', 
      includeArchived: false, 
      includeDeleted: false 
    }
  });

  useEffect(() => {
    loadExportData();
  }, []);

  const loadExportData = async () => {
    try {
      setLoading(true);
      
      // Cargar trabajos de exportación
      const { data: jobsData, error: jobsError } = await supabase
        .from('export_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (jobsError) throw jobsError;
      setExportJobs(jobsData || []);

      // Cargar exportaciones programadas
      const { data: scheduledData, error: scheduledError } = await supabase
        .from('scheduled_exports')
        .select('*')
        .order('created_at', { ascending: false });

      if (scheduledError) throw scheduledError;
      setScheduledExports(scheduledData || []);

    } catch (error) {
      console.error('Error loading export data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de exportación",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createExportJob = async () => {
    try {
      if (!newExport.name || !newExport.description) {
        toast({
          title: "Error",
          description: "Todos los campos son obligatorios",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase
        .from('export_jobs')
        .insert([{
          ...newExport,
          status: 'pending',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setExportJobs(prev => [data, ...prev]);
      setShowCreateModal(false);
      setNewExport({ 
        name: '', 
        description: '', 
        dataType: 'projects', 
        format: 'excel',
        filters: { dateRange: '30d', includeArchived: false, includeDeleted: false }
      });
      
      toast({
        title: "Éxito",
        description: "Trabajo de exportación creado correctamente"
      });

      // Iniciar exportación automáticamente
      startExport(data);

    } catch (error) {
      console.error('Error creating export job:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el trabajo de exportación",
        variant: "destructive"
      });
    }
  };

  const startExport = async (exportJob: ExportJob) => {
    try {
      // Actualizar estado a procesando
      setExportJobs(prev => prev.map(job => 
        job.id === exportJob.id ? { ...job, status: 'processing' } : job
      ));

      // Simular proceso de exportación (en producción sería un proceso en background)
      setTimeout(async () => {
        try {
          const exportData = await generateExportData(exportJob);
          const { downloadUrl, fileSize, recordCount } = await processExport(exportData, exportJob.format);

          // Actualizar trabajo como completado
          const { error: updateError } = await supabase
            .from('export_jobs')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              download_url: downloadUrl,
              file_size: fileSize,
              record_count: recordCount
            })
            .eq('id', exportJob.id);

          if (updateError) throw updateError;

          // Actualizar estado local
          setExportJobs(prev => prev.map(job => 
            job.id === exportJob.id 
              ? { 
                  ...job, 
                  status: 'completed', 
                  completedAt: new Date(), 
                  downloadUrl, 
                  fileSize, 
                  recordCount 
                }
              : job
          ));

          toast({
            title: "Exportación Completada",
            description: `Tu archivo está listo para descargar (${(fileSize / 1024 / 1024).toFixed(2)} MB)`
          });

        } catch (error) {
          // Marcar como fallido
          await supabase
            .from('export_jobs')
            .update({
              status: 'failed',
              completed_at: new Date().toISOString(),
              error: error.message
            })
            .eq('id', exportJob.id);

          setExportJobs(prev => prev.map(job => 
            job.id === exportJob.id 
              ? { ...job, status: 'failed', completedAt: new Date(), error: error.message }
              : job
          ));

          throw error;
        }
      }, 3000);

    } catch (error) {
      console.error('Error starting export:', error);
      toast({
        title: "Error",
        description: "No se pudo iniciar la exportación",
        variant: "destructive"
      });
    }
  };

  const generateExportData = async (exportJob: ExportJob) => {
    // Generar datos para exportación basado en el tipo y filtros
    let query = supabase.from(exportJob.dataType).select('*');
    
    // Aplicar filtros de fecha
    if (exportJob.filters.dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (exportJob.filters.dateRange) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }
      
      query = query.gte('created_at', startDate.toISOString());
    }

    // Aplicar filtros de estado
    if (exportJob.filters.status && exportJob.filters.status.length > 0) {
      query = query.in('status', exportJob.filters.status);
    }

    // Aplicar filtros de roles (para usuarios)
    if (exportJob.dataType === 'users' && exportJob.filters.roles && exportJob.filters.roles.length > 0) {
      query = query.in('role', exportJob.filters.roles);
    }

    // Aplicar filtros de estado de pago (para pagos)
    if (exportJob.dataType === 'payments' && exportJob.filters.paymentStatus && exportJob.filters.paymentStatus.length > 0) {
      query = query.in('status', exportJob.filters.paymentStatus);
    }

    // Aplicar filtros de prioridad (para tickets)
    if (exportJob.dataType === 'tickets' && exportJob.filters.priority && exportJob.filters.priority.length > 0) {
      query = query.in('priority', exportJob.filters.priority);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  };

  const processExport = async (data: any[], format: string) => {
    // Simular procesamiento de exportación (en producción usaría librerías como jsPDF, xlsx)
    const recordCount = data.length;
    const fileSize = recordCount * 1024; // Simular tamaño de archivo
    
    // Simular URL de descarga
    const filename = `export_${Date.now()}.${format}`;
    const downloadUrl = `/api/exports/download/${filename}`;

    return { downloadUrl, fileSize, recordCount };
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      processing: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status === 'pending' ? 'Pendiente' : 
         status === 'processing' ? 'Procesando' : 
         status === 'completed' ? 'Completado' : 'Fallido'}
      </Badge>
    );
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'csv':
        return <FileCode className="h-4 w-4" />;
      case 'json':
        return <FileCode className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getDataTypeIcon = (dataType: string) => {
    switch (dataType) {
      case 'projects':
        return <Target className="h-4 w-4" />;
      case 'users':
        return <Users className="h-4 w-4" />;
      case 'payments':
        return <DollarSign className="h-4 w-4" />;
      case 'tickets':
        return <FileText className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando sistema de exportación...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sistema de Exportación Avanzada</h2>
          <p className="text-muted-foreground">
            Exporta datos en múltiples formatos con filtros avanzados y programación automática
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowScheduleModal(true)}>
            <Calendar className="h-4 w-4 mr-2" />
            Programar
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Exportación
          </Button>
        </div>
      </div>

      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="jobs">Trabajos</TabsTrigger>
          <TabsTrigger value="scheduled">Programados</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Trabajos de Exportación */}
        <TabsContent value="jobs" className="space-y-4">
          <div className="space-y-3">
            {exportJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(job.status)}
                      <div className="flex items-center gap-2">
                        {getDataTypeIcon(job.dataType)}
                        {getFormatIcon(job.format)}
                      </div>
                      <div>
                        <p className="font-medium">{job.name}</p>
                        <p className="text-sm text-muted-foreground">{job.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Creado: {new Date(job.createdAt).toLocaleString()}
                          {job.completedAt && ` • Completado: ${new Date(job.completedAt).toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {job.status === 'completed' && job.downloadUrl && (
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </Button>
                      )}
                      {job.status === 'failed' && (
                        <p className="text-sm text-red-600">{job.error}</p>
                      )}
                      {job.status === 'completed' && job.fileSize && (
                        <Badge variant="outline">
                          {(job.fileSize / 1024 / 1024).toFixed(2)} MB
                        </Badge>
                      )}
                      {job.status === 'completed' && job.recordCount && (
                        <Badge variant="outline">
                          {job.recordCount} registros
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {exportJobs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay trabajos de exportación</p>
                <p className="text-sm">Crea tu primera exportación para comenzar</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Exportaciones Programadas */}
        <TabsContent value="scheduled" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scheduledExports.map((scheduled) => (
              <Card key={scheduled.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{scheduled.name}</CardTitle>
                    <Badge variant={scheduled.isActive ? "default" : "secondary"}>
                      {scheduled.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{scheduled.description}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    {getDataTypeIcon(scheduled.dataType)}
                    {getFormatIcon(scheduled.format)}
                    <Badge variant="outline">{scheduled.schedule.frequency}</Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>Próxima ejecución: {scheduled.nextExecution ? new Date(scheduled.nextExecution).toLocaleString() : 'No programado'}</p>
                    <p>Destinatarios: {scheduled.recipients.join(', ')}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {scheduledExports.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay exportaciones programadas</p>
                <p className="text-sm">Crea exportaciones automáticas para recibir reportes por email</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Templates de Exportación */}
        <TabsContent value="templates" className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay templates de exportación</p>
            <p className="text-sm">Guarda configuraciones frecuentes como templates para reutilizar</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal para crear exportación */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nueva Exportación</DialogTitle>
            <DialogDescription>
              Define los parámetros para exportar datos del sistema
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre de la Exportación</Label>
                <Input
                  id="name"
                  value={newExport.name}
                  onChange={(e) => setNewExport(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Exportación de Proyectos Q1"
                />
              </div>
              <div>
                <Label htmlFor="dataType">Tipo de Datos</Label>
                <Select 
                  value={newExport.dataType} 
                  onValueChange={(value) => setNewExport(prev => ({ ...prev, dataType: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="projects">Proyectos</SelectItem>
                    <SelectItem value="users">Usuarios</SelectItem>
                    <SelectItem value="payments">Pagos</SelectItem>
                    <SelectItem value="tickets">Tickets</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={newExport.description}
                onChange={(e) => setNewExport(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción detallada de la exportación..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="format">Formato de Salida</Label>
                <Select 
                  value={newExport.format} 
                  onValueChange={(value) => setNewExport(prev => ({ ...prev, format: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dateRange">Rango de Fechas</Label>
                <Select 
                  value={newExport.filters?.dateRange} 
                  onValueChange={(value) => setNewExport(prev => ({ 
                    ...prev, 
                    filters: { ...prev.filters, dateRange: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Últimos 7 días</SelectItem>
                    <SelectItem value="30d">Últimos 30 días</SelectItem>
                    <SelectItem value="90d">Últimos 90 días</SelectItem>
                    <SelectItem value="1y">Último año</SelectItem>
                    <SelectItem value="all">Todo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeArchived"
                checked={newExport.filters?.includeArchived}
                onCheckedChange={(checked) => setNewExport(prev => ({ 
                  ...prev, 
                  filters: { ...prev.filters, includeArchived: checked as boolean }
                }))}
              />
              <Label htmlFor="includeArchived">Incluir registros archivados</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeDeleted"
                checked={newExport.filters?.includeDeleted}
                onCheckedChange={(checked) => setNewExport(prev => ({ 
                  ...prev, 
                  filters: { ...prev.filters, includeDeleted: checked as boolean }
                }))}
              />
              <Label htmlFor="includeDeleted">Incluir registros eliminados</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancelar
              </Button>
              <Button onClick={createExportJob}>
                Crear Exportación
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
