import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  GitBranch, 
  Zap,
  RefreshCw,
  RotateCcw,
  Activity,
  Eye,
  Clock,
  MessageSquare
} from 'lucide-react';
import { workflowService } from '@/lib/workflowService';
import { useToast } from '@/hooks/use-toast';
import { ProjectVersion } from '@/types/project.types';

interface WorkflowActionsProps {
  version: ProjectVersion;
  onActionComplete: () => void;
}

export const WorkflowActions: React.FC<WorkflowActionsProps> = ({ version, onActionComplete }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [comments, setComments] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-500 text-white';
      case 'in_review':
        return 'bg-yellow-500 text-white';
      case 'approved':
        return 'bg-blue-500 text-white';
      case 'deployed':
        return 'bg-green-500 text-white';
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
      case 'draft':
        return <Clock className="h-4 w-4" />;
      case 'in_review':
        return <MessageSquare className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'deployed':
        return <Play className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      case 'rolled_back':
        return <RotateCcw className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const handleAction = async (action: string) => {
    setSelectedAction(action);
    setShowDialog(true);
  };

  const executeAction = async () => {
    setLoading(true);
    try {
      const userId = 'admin@example.com'; // En producción usar auth.uid()
      
      switch (selectedAction) {
        case 'request_review':
          await workflowService.transitionVersionStatus(version.id, 'in_review', userId);
          toast({
            title: 'Revisión solicitada',
            description: 'La versión ha sido enviada para revisión',
          });
          break;
          
        case 'approve':
          await workflowService.transitionVersionStatus(version.id, 'approved', userId, comments);
          toast({
            title: 'Versión aprobada',
            description: 'La versión ha sido aprobada para deployment',
          });
          break;
          
        case 'deploy':
          await workflowService.transitionVersionStatus(version.id, 'deployed', userId);
          toast({
            title: 'Deployment iniciado',
            description: 'La versión está siendo desplegada',
          });
          break;
          
        case 'rollback':
          const success = await workflowService.triggerAutoRollback(version.id, comments);
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
          const health = await workflowService.checkDeploymentHealth(version.id);
          toast({
            title: `Health Check: ${health.status}`,
            description: health.isHealthy ? 'La aplicación está funcionando correctamente' : `Errores: ${health.errors.join(', ')}`,
            variant: health.isHealthy ? 'default' : 'destructive',
          });
          break;
      }
      
      onActionComplete();
      setShowDialog(false);
      setComments('');
    } catch (error) {
      toast({
        title: 'Error en workflow',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getAvailableActions = () => {
    const actions = [];
    
    switch (version.status) {
      case 'draft':
        actions.push(
          { key: 'request_review', label: 'Solicitar Revisión', icon: <MessageSquare className="h-4 w-4" />, variant: 'outline' as const }
        );
        break;
        
      case 'in_review':
        actions.push(
          { key: 'approve', label: 'Aprobar', icon: <CheckCircle className="h-4 w-4" />, variant: 'default' as const },
          { key: 'request_review', label: 'Rechazar', icon: <XCircle className="h-4 w-4" />, variant: 'destructive' as const }
        );
        break;
        
      case 'approved':
        actions.push(
          { key: 'deploy', label: 'Desplegar', icon: <Play className="h-4 w-4" />, variant: 'default' as const },
          { key: 'health_check', label: 'Health Check', icon: <Activity className="h-4 w-4" />, variant: 'outline' as const }
        );
        break;
        
      case 'deployed':
        actions.push(
          { key: 'health_check', label: 'Health Check', icon: <Activity className="h-4 w-4" />, variant: 'outline' as const },
          { key: 'rollback', label: 'Rollback', icon: <RotateCcw className="h-4 w-4" />, variant: 'destructive' as const }
        );
        break;
        
      case 'failed':
        actions.push(
          { key: 'rollback', label: 'Rollback', icon: <RotateCcw className="h-4 w-4" />, variant: 'destructive' as const },
          { key: 'health_check', label: 'Health Check', icon: <Activity className="h-4 w-4" />, variant: 'outline' as const }
        );
        break;
    }
    
    return actions;
  };

  const getActionDescription = (action: string) => {
    switch (action) {
      case 'request_review':
        return 'Enviar la versión para revisión por parte del equipo';
      case 'approve':
        return 'Aprobar la versión para deployment';
      case 'deploy':
        return 'Iniciar el proceso de deployment';
      case 'rollback':
        return 'Revertir a la versión anterior automáticamente';
      case 'health_check':
        return 'Verificar el estado de salud de la aplicación';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Estado actual */}
      <div className="flex items-center gap-2">
        <Badge className={getStatusColor(version.status)}>
          {getStatusIcon(version.status)}
          <span className="ml-1 capitalize">{version.status.replace('_', ' ')}</span>
        </Badge>
        
        {version.semanticVersion && (
          <Badge variant="outline" className="text-xs">
            <GitBranch className="h-3 w-3 mr-1" />
            {version.semanticVersion}
          </Badge>
        )}
        
        {version.autoGenerated && (
          <Badge variant="outline" className="text-xs">
            <Zap className="h-3 w-3 mr-1" />
            Auto-generado
          </Badge>
        )}
      </div>

      {/* Acciones disponibles */}
      <div className="flex flex-wrap gap-2">
        {getAvailableActions().map((action) => (
          <Button
            key={action.key}
            variant={action.variant}
            size="sm"
            onClick={() => handleAction(action.key)}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
      </div>

      {/* Información adicional */}
      {version.reviewedBy && (
        <div className="text-sm text-slate-600">
          <span>Revisado por: {version.reviewedBy}</span>
          {version.reviewedAt && (
            <span className="ml-2">el {new Date(version.reviewedAt).toLocaleDateString()}</span>
          )}
        </div>
      )}

      {version.deployedBy && (
        <div className="text-sm text-slate-600">
          <span>Desplegado por: {version.deployedBy}</span>
          {version.deployedAt && (
            <span className="ml-2">el {new Date(version.deployedAt).toLocaleDateString()}</span>
          )}
        </div>
      )}

      {/* Dialog para acciones */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md bg-white border-slate-200" aria-describedby="workflow-action-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              {getAvailableActions().find(a => a.key === selectedAction)?.icon}
              {getAvailableActions().find(a => a.key === selectedAction)?.label}
            </DialogTitle>
            <p id="workflow-action-description" className="text-slate-600 text-sm">
              {getAvailableActions().find(a => a.key === selectedAction)?.description || 'Acción del workflow'}
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {getActionDescription(selectedAction)}
            </p>
            
            {(selectedAction === 'approve' || selectedAction === 'rollback') && (
              <div className="space-y-2">
                <Label htmlFor="comments" className="text-slate-700">Comentarios</Label>
                <Textarea
                  id="comments"
                  placeholder="Agregar comentarios sobre la acción..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                />
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={loading}
                className="border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </Button>
              <Button
                onClick={executeAction}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
