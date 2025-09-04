import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  RefreshCw, 
  Settings, 
  BarChart3, 
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Clock,
  Mail,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'executive' | 'financial' | 'user' | 'project' | 'custom';
  filters: ReportFilters;
  schedule?: ReportSchedule;
  lastGenerated?: Date;
  isActive: boolean;
}

interface ReportFilters {
  dateRange: string;
  projectStatus?: string[];
  userRoles?: string[];
  paymentStatus?: string[];
  priority?: string[];
  customFields?: Record<string, any>;
}

interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  time: string;
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
  isActive: boolean;
}

interface ReportExecution {
  id: string;
  templateId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  error?: string;
}

export default function AdvancedReportsManager() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [executions, setExecutions] = useState<ReportExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState<Partial<ReportTemplate>>({
    name: '',
    description: '',
    type: 'executive',
    filters: { dateRange: '30d' },
    isActive: true
  });

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      // Cargar templates de reportes
      const { data: templatesData, error: templatesError } = await supabase
        .from('report_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (templatesError) throw templatesError;
      setTemplates(templatesData || []);

      // Cargar ejecuciones de reportes
      const { data: executionsData, error: executionsError } = await supabase
        .from('report_executions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);

      if (executionsError) throw executionsError;
      setExecutions(executionsData || []);

    } catch (error) {
      console.error('Error loading report data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de reportes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createReportTemplate = async () => {
    try {
      if (!newTemplate.name || !newTemplate.description) {
        toast({
          title: "Error",
          description: "Todos los campos son obligatorios",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase
        .from('report_templates')
        .insert([{
          ...newTemplate,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setTemplates(prev => [data, ...prev]);
      setShowCreateModal(false);
      setNewTemplate({ name: '', description: '', type: 'executive', filters: { dateRange: '30d' }, isActive: true });
      
      toast({
        title: "Éxito",
        description: "Template de reporte creado correctamente"
      });

    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el template",
        variant: "destructive"
      });
    }
  };

  const generateReport = async (template: ReportTemplate) => {
    try {
      // Crear ejecución de reporte
      const { data: execution, error: executionError } = await supabase
        .from('report_executions')
        .insert([{
          template_id: template.id,
          status: 'processing',
          started_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (executionError) throw executionError;

      setExecutions(prev => [execution, ...prev]);

      // Simular generación de reporte (en producción sería un proceso en background)
      setTimeout(async () => {
        try {
          const reportData = await generateReportData(template);
          const downloadUrl = await exportReport(reportData, template.type);

          // Actualizar ejecución como completada
          const { error: updateError } = await supabase
            .from('report_executions')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              download_url: downloadUrl
            })
            .eq('id', execution.id);

          if (updateError) throw updateError;

          // Actualizar estado local
          setExecutions(prev => prev.map(e => 
            e.id === execution.id 
              ? { ...e, status: 'completed', completed_at: new Date(), download_url: downloadUrl }
              : e
          ));

          toast({
            title: "Reporte Generado",
            description: "Tu reporte está listo para descargar"
          });

        } catch (error) {
          // Marcar como fallido
          await supabase
            .from('report_executions')
            .update({
              status: 'failed',
              completed_at: new Date().toISOString(),
              error: error.message
            })
            .eq('id', execution.id);

          setExecutions(prev => prev.map(e => 
            e.id === execution.id 
              ? { ...e, status: 'failed', completed_at: new Date(), error: error.message }
              : e
          ));

          throw error;
        }
      }, 2000);

    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el reporte",
        variant: "destructive"
      });
    }
  };

  const generateReportData = async (template: ReportTemplate) => {
    // Generar datos del reporte basado en el template
    const { data: projects } = await supabase.from('projects').select('*');
    const { data: users } = await supabase.from('users').select('*');
    const { data: payments } = await supabase.from('payments').select('*');
    const { data: tickets } = await supabase.from('tickets').select('*');

    return {
      projects: projects || [],
      users: users || [],
      payments: payments || [],
      tickets: tickets || [],
      generatedAt: new Date(),
      template: template
    };
  };

  const exportReport = async (data: any, type: string) => {
    // Simular exportación (en producción usaría librerías como jsPDF, xlsx)
    const filename = `report_${type}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Simular URL de descarga
    return `/api/reports/download/${filename}`;
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
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando reportes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestor de Reportes Avanzados</h2>
          <p className="text-muted-foreground">
            Crea, programa y gestiona reportes ejecutivos automatizados
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Template
        </Button>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="executions">Ejecuciones</TabsTrigger>
          <TabsTrigger value="scheduled">Programados</TabsTrigger>
        </TabsList>

        {/* Templates de Reportes */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge variant={template.isActive ? "default" : "secondary"}>
                      {template.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{template.type}</Badge>
                    <Badge variant="outline">{template.filters.dateRange}</Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => generateReport(template)}
                      disabled={!template.isActive}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Generar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setEditingTemplate(template)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Ejecuciones de Reportes */}
        <TabsContent value="executions" className="space-y-4">
          <div className="space-y-3">
            {executions.map((execution) => (
              <Card key={execution.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(execution.status)}
                      <div>
                        <p className="font-medium">
                          {templates.find(t => t.id === execution.template_id)?.name || 'Template no encontrado'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Iniciado: {new Date(execution.started_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {execution.status === 'completed' && execution.download_url && (
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </Button>
                      )}
                      {execution.status === 'failed' && (
                        <p className="text-sm text-red-600">{execution.error}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Reportes Programados */}
        <TabsContent value="scheduled" className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay reportes programados actualmente</p>
            <p className="text-sm">Crea templates con programación automática para verlos aquí</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal para crear/editar template */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Template de Reporte</DialogTitle>
            <DialogDescription>
              Define un nuevo template de reporte con filtros y programación
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre del Template</Label>
                <Input
                  id="name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Reporte Ejecutivo Mensual"
                />
              </div>
              <div>
                <Label htmlFor="type">Tipo de Reporte</Label>
                <Select 
                  value={newTemplate.type} 
                  onValueChange={(value) => setNewTemplate(prev => ({ ...prev, type: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="executive">Ejecutivo</SelectItem>
                    <SelectItem value="financial">Financiero</SelectItem>
                    <SelectItem value="user">Usuarios</SelectItem>
                    <SelectItem value="project">Proyectos</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción detallada del reporte..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="dateRange">Rango de Fechas</Label>
              <Select 
                value={newTemplate.filters?.dateRange} 
                onValueChange={(value) => setNewTemplate(prev => ({ 
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
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancelar
              </Button>
              <Button onClick={createReportTemplate}>
                Crear Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
