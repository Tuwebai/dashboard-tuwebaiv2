import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Workflow, 
  Plus, 
  Settings, 
  Users, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2,
  Save,
  X,
  ArrowRight,
  Zap,
  Shield,
  Target,
  Activity,
  Copy,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { 
  ticketWorkflowService, 
  TicketWorkflow, 
  WorkflowStage, 
  AutoAssignmentRule,
  EscalationRule,
  SLARule
} from '@/lib/ticketWorkflow';

export default function TicketWorkflowManager() {
  const [workflows, setWorkflows] = useState<TicketWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('workflows');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);
  const [editingWorkflow, setEditingWorkflow] = useState<TicketWorkflow | null>(null);

  // Estados para formularios
  const [workflowData, setWorkflowData] = useState({
    name: '',
    description: '',
    isDefault: false,
    isActive: true
  });

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      const workflowsData = await ticketWorkflowService.getWorkflows();
      setWorkflows(workflowsData);
    } catch (error) {
      console.error('Error loading workflows:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los workflows',
        variant: 'destructive'
      });
    }
    setLoading(false);
  };

  const handleCreateWorkflow = async () => {
    if (!workflowData.name || !workflowData.description) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos requeridos',
        variant: 'destructive'
      });
      return;
    }

    try {
      await ticketWorkflowService.createWorkflow({
        name: workflowData.name,
        description: workflowData.description,
        isDefault: workflowData.isDefault,
        isActive: workflowData.isActive,
        stages: [],
        autoAssignment: [],
        escalationRules: [],
        slaRules: []
      });

      toast({
        title: 'Workflow creado',
        description: 'Se ha creado el nuevo workflow'
      });

      setWorkflowData({ name: '', description: '', isDefault: false, isActive: true });
      setShowCreateModal(false);
      loadWorkflows();
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el workflow',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateWorkflow = async () => {
    if (!editingWorkflow) return;

    try {
      await ticketWorkflowService.updateWorkflow(editingWorkflow.id, {
        name: workflowData.name,
        description: workflowData.description,
        isDefault: workflowData.isDefault,
        isActive: workflowData.isActive
      });

      toast({
        title: 'Workflow actualizado',
        description: 'Se han guardado los cambios'
      });

      setEditingWorkflow(null);
      setShowEditModal(false);
      loadWorkflows();
    } catch (error) {
      console.error('Error updating workflow:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el workflow',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteWorkflow = (workflowId: string) => {
    setWorkflowToDelete(workflowId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteWorkflow = async () => {
    if (!workflowToDelete) return;

    try {
      await ticketWorkflowService.deleteWorkflow(workflowToDelete);
      toast({
        title: 'Workflow eliminado',
        description: 'Se ha eliminado el workflow'
      });
      loadWorkflows();
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el workflow',
        variant: 'destructive'
      });
    } finally {
      setShowDeleteConfirm(false);
      setWorkflowToDelete(null);
    }
  };

  const cancelDeleteWorkflow = () => {
    setShowDeleteConfirm(false);
    setWorkflowToDelete(null);
  };

  const handleEditWorkflow = (workflow: TicketWorkflow) => {
    setEditingWorkflow(workflow);
    setWorkflowData({
      name: workflow.name,
      description: workflow.description,
      isDefault: workflow.isDefault,
      isActive: workflow.isActive
    });
    setShowEditModal(true);
  };

  const duplicateWorkflow = async (workflow: TicketWorkflow) => {
    try {
      const duplicatedWorkflow = {
        ...workflow,
        name: `${workflow.name} (Copia)`,
        isDefault: false,
        isActive: false
      };
      delete (duplicatedWorkflow as any).id;
      delete (duplicatedWorkflow as any).createdAt;
      delete (duplicatedWorkflow as any).updatedAt;

      await ticketWorkflowService.createWorkflow(duplicatedWorkflow);
      
      toast({
        title: 'Workflow duplicado',
        description: 'Se ha creado una copia del workflow'
      });
      loadWorkflows();
    } catch (error) {
      console.error('Error duplicating workflow:', error);
      toast({
        title: 'Error',
        description: 'No se pudo duplicar el workflow',
        variant: 'destructive'
      });
    }
  };

  const getStageColor = (color: string) => {
    return `bg-${color}-100 text-${color}-800 border-${color}-200`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Workflows de Tickets</h1>
          <p className="text-muted-foreground">
            Administra flujos de trabajo personalizables para tickets
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Workflow
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Workflows Totales</p>
                <p className="text-2xl font-bold">{workflows.length}</p>
              </div>
              <Workflow className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Workflows Activos</p>
                <p className="text-2xl font-bold">{workflows.filter(w => w.isActive).length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Workflow por Defecto</p>
                <p className="text-2xl font-bold">{workflows.filter(w => w.isDefault).length}</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Etapas Totales</p>
                <p className="text-2xl font-bold">
                  {workflows.reduce((total, w) => total + w.stages.length, 0)}
                </p>
              </div>
              <Activity className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="stages">Etapas</TabsTrigger>
          <TabsTrigger value="rules">Reglas</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {workflows.map(workflow => (
              <Card key={workflow.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Workflow className="h-5 w-5" />
                      {workflow.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {workflow.isDefault && (
                        <Badge variant="outline">Por defecto</Badge>
                      )}
                      <Badge variant={workflow.isActive ? "default" : "secondary"}>
                        {workflow.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{workflow.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Etapas */}
                    <div>
                      <h4 className="font-medium mb-2">Etapas ({workflow.stages.length})</h4>
                      <div className="flex flex-wrap gap-2">
                        {workflow.stages.slice(0, 3).map(stage => (
                          <Badge key={stage.id} variant="outline" className="text-xs">
                            {stage.name}
                          </Badge>
                        ))}
                        {workflow.stages.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{workflow.stages.length - 3} más
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Reglas */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Asignación:</span>
                        <span className="ml-1">{workflow.autoAssignment.length}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Escalación:</span>
                        <span className="ml-1">{workflow.escalationRules.length}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">SLA:</span>
                        <span className="ml-1">{workflow.slaRules.length}</span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditWorkflow(workflow)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicateWorkflow(workflow)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteWorkflow(workflow.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="stages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Etapas de Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {workflows.map(workflow => (
                  <div key={workflow.id} className="border rounded-lg p-4">
                    <h3 className="font-medium mb-4">{workflow.name}</h3>
                    <div className="flex items-center space-x-4 overflow-x-auto">
                      {workflow.stages.map((stage, index) => (
                        <div key={stage.id} className="flex items-center">
                          <div className={`px-3 py-2 rounded-lg border ${getStageColor(stage.color)}`}>
                            <span className="text-sm font-medium">{stage.name}</span>
                          </div>
                          {index < workflow.stages.length - 1 && (
                            <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Reglas de Asignación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Asignación Automática
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workflows.map(workflow => (
                    <div key={workflow.id} className="border rounded p-3">
                      <h4 className="font-medium text-sm mb-2">{workflow.name}</h4>
                      <div className="space-y-2">
                        {workflow.autoAssignment.map(rule => (
                          <div key={rule.id} className="text-xs">
                            <span className="font-medium">{rule.name}</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              {rule.assignmentType}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reglas de Escalación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Escalación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workflows.map(workflow => (
                    <div key={workflow.id} className="border rounded p-3">
                      <h4 className="font-medium text-sm mb-2">{workflow.name}</h4>
                      <div className="space-y-2">
                        {workflow.escalationRules.map(rule => (
                          <div key={rule.id} className="text-xs">
                            <span className="font-medium">{rule.name}</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              {rule.trigger}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reglas SLA */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  SLA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workflows.map(workflow => (
                    <div key={workflow.id} className="border rounded p-3">
                      <h4 className="font-medium text-sm mb-2">{workflow.name}</h4>
                      <div className="space-y-2">
                        {workflow.slaRules.map(rule => (
                          <div key={rule.id} className="text-xs">
                            <span className="font-medium">{rule.name}</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              {rule.priority}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Workflow Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="workflow-name">Nombre del Workflow</Label>
              <Input
                id="workflow-name"
                value={workflowData.name}
                onChange={(e) => setWorkflowData({ ...workflowData, name: e.target.value })}
                placeholder="Ej: Soporte Técnico"
              />
            </div>
            
            <div>
              <Label htmlFor="workflow-description">Descripción</Label>
              <Textarea
                id="workflow-description"
                value={workflowData.description}
                onChange={(e) => setWorkflowData({ ...workflowData, description: e.target.value })}
                placeholder="Descripción del workflow..."
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="workflow-default"
                checked={workflowData.isDefault}
                onCheckedChange={(checked) => setWorkflowData({ ...workflowData, isDefault: checked })}
              />
              <Label htmlFor="workflow-default">Workflow por defecto</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="workflow-active"
                checked={workflowData.isActive}
                onCheckedChange={(checked) => setWorkflowData({ ...workflowData, isActive: checked })}
              />
              <Label htmlFor="workflow-active">Workflow activo</Label>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateWorkflow}>
                <Save className="h-4 w-4 mr-2" />
                Crear Workflow
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Workflow Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-workflow-name">Nombre del Workflow</Label>
              <Input
                id="edit-workflow-name"
                value={workflowData.name}
                onChange={(e) => setWorkflowData({ ...workflowData, name: e.target.value })}
                placeholder="Ej: Soporte Técnico"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-workflow-description">Descripción</Label>
              <Textarea
                id="edit-workflow-description"
                value={workflowData.description}
                onChange={(e) => setWorkflowData({ ...workflowData, description: e.target.value })}
                placeholder="Descripción del workflow..."
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-workflow-default"
                checked={workflowData.isDefault}
                onCheckedChange={(checked) => setWorkflowData({ ...workflowData, isDefault: checked })}
              />
              <Label htmlFor="edit-workflow-default">Workflow por defecto</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-workflow-active"
                checked={workflowData.isActive}
                onCheckedChange={(checked) => setWorkflowData({ ...workflowData, isActive: checked })}
              />
              <Label htmlFor="edit-workflow-active">Workflow activo</Label>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateWorkflow}>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación para eliminar workflow */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={cancelDeleteWorkflow}
        onConfirm={confirmDeleteWorkflow}
        title="Confirmar eliminación"
        description="¿Estás seguro de que quieres eliminar este workflow? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        loading={false}
      />
    </div>
  );
} 
