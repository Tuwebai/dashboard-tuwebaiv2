import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  MessageSquare,
  RefreshCw,
  AlertCircle,
  User,
  Calendar,
  FileText
} from 'lucide-react';
import { projectService } from '@/lib/projectService';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from '@/components/OptimizedMotion';

interface ApprovalRequest {
  id: string;
  project_id: string;
  requested_by: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  request_notes?: string;
  admin_response?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  project_name: string;
  project_description?: string;
  requester_name: string;
  requester_email: string;
  reviewer_name?: string;
}

interface ProjectApprovalManagerProps {
  user: any;
  onRefresh: () => void;
}

export default function ProjectApprovalManager({ user, onRefresh }: ProjectApprovalManagerProps) {
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Cargar solicitudes de aprobación
  const loadApprovalRequests = async () => {
    try {
      setLoading(true);
      
      // Buscar proyectos con estado de aprobación pendiente directamente
      const { data: projects, error } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          description,
          approval_status,
          approved_by,
          approved_at,
          approval_notes,
          created_at,
          updated_at,
          created_by
        `)
        .or('approval_status.in.(pending,approved,rejected),approval_status.is.null')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Cargar información de usuarios para los proyectos
      const userIds = [...new Set(projects?.map(p => p.created_by).filter(Boolean) || [])];
      
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', userIds);

      const usersMap = new Map(usersData?.map(user => [user.id, user]) || []);

      // Transformar los datos al formato esperado
      const transformedRequests = projects?.map(project => {
        const user = usersMap.get(project.created_by);
        return {
          id: project.id,
          project_id: project.id,
          requested_by: project.created_by,
          status: project.approval_status || 'approved', // Si no tiene approval_status, asumir que está aprobado
          request_notes: null,
          admin_response: project.approval_notes,
          reviewed_by: project.approved_by,
          reviewed_at: project.approved_at,
          created_at: project.created_at,
          updated_at: project.updated_at,
          project_name: project.name,
          project_description: project.description,
          requester_name: user?.full_name || 'Usuario desconocido',
          requester_email: user?.email || 'email@desconocido.com',
          reviewer_name: null // Se puede cargar después si es necesario
        };
      }) || [];

      setApprovalRequests(transformedRequests);
    } catch (error) {
      console.error('Error loading approval requests:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las solicitudes de aprobación',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovalRequests();
  }, []);

  // Manejar aprobación/rechazo
  const handleAction = async () => {
    if (!selectedRequest || !actionType) return;

    try {
      setActionLoading(true);

      if (actionType === 'approve') {
        await projectService.approveProject(selectedRequest.project_id, adminNotes);
        toast({
          title: 'Proyecto aprobado',
          description: 'El proyecto ha sido aprobado exitosamente'
        });
      } else {
        await projectService.rejectProject(selectedRequest.project_id, adminNotes);
        toast({
          title: 'Proyecto rechazado',
          description: 'El proyecto ha sido rechazado'
        });
      }

      // Recargar datos
      await loadApprovalRequests();
      onRefresh();
      
      // Cerrar modales
      setShowActionModal(false);
      setShowDetailsModal(false);
      setSelectedRequest(null);
      setAdminNotes('');
      setActionType(null);

    } catch (error) {
      console.error('Error processing action:', error);
      toast({
        title: 'Error',
        description: 'No se pudo procesar la acción',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Abrir modal de detalles
  const openDetailsModal = (request: ApprovalRequest) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  // Abrir modal de acción
  const openActionModal = (request: ApprovalRequest, type: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(type);
    setAdminNotes('');
    setShowActionModal(true);
  };

  // Filtrar solicitudes por estado
  const pendingRequests = approvalRequests.filter(req => req.status === 'pending');
  const approvedRequests = approvalRequests.filter(req => req.status === 'approved');
  const rejectedRequests = approvalRequests.filter(req => req.status === 'rejected');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aprobado
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Rechazado
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-600">Cargando solicitudes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestión de Aprobaciones</h2>
          <p className="text-slate-600 mt-1">Revisa y aprueba solicitudes de proyectos</p>
        </div>
        <Button
          onClick={loadApprovalRequests}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Actualizar</span>
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-900">{pendingRequests.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Aprobados</p>
                <p className="text-2xl font-bold text-green-900">{approvedRequests.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-rose-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Rechazados</p>
                <p className="text-2xl font-bold text-red-900">{rejectedRequests.length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de solicitudes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Solicitudes de Aprobación</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {approvalRequests.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No hay solicitudes de aprobación</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {approvalRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-slate-800">{request.project_name}</h3>
                          {getStatusBadge(request.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>{request.requester_name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(request.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {request.project_description && (
                          <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                            {request.project_description}
                          </p>
                        )}

                        {request.request_notes && (
                          <div className="mt-2 p-2 bg-slate-50 rounded text-sm">
                            <strong>Notas del solicitante:</strong> {request.request_notes}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetailsModal(request)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>

                        {request.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => openActionModal(request, 'approve')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aprobar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openActionModal(request, 'reject')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rechazar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalles */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Solicitud</DialogTitle>
            <DialogDescription>
              Información completa de la solicitud de aprobación
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Proyecto</label>
                  <p className="text-slate-900">{selectedRequest.project_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Estado</label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Solicitante</label>
                <p className="text-slate-900">{selectedRequest.requester_name} ({selectedRequest.requester_email})</p>
              </div>

              {selectedRequest.project_description && (
                <div>
                  <label className="text-sm font-medium text-slate-700">Descripción del Proyecto</label>
                  <p className="text-slate-900 mt-1">{selectedRequest.project_description}</p>
                </div>
              )}

              {selectedRequest.request_notes && (
                <div>
                  <label className="text-sm font-medium text-slate-700">Notas del Solicitante</label>
                  <p className="text-slate-900 mt-1">{selectedRequest.request_notes}</p>
                </div>
              )}

              {selectedRequest.admin_response && (
                <div>
                  <label className="text-sm font-medium text-slate-700">Respuesta del Administrador</label>
                  <p className="text-slate-900 mt-1">{selectedRequest.admin_response}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Fecha de Solicitud</label>
                  <p className="text-slate-900">{new Date(selectedRequest.created_at).toLocaleString()}</p>
                </div>
                {selectedRequest.reviewed_at && (
                  <div>
                    <label className="text-sm font-medium text-slate-700">Fecha de Revisión</label>
                    <p className="text-slate-900">{new Date(selectedRequest.reviewed_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de acción */}
      <Dialog open={showActionModal} onOpenChange={setShowActionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Aprobar Proyecto' : 'Rechazar Proyecto'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' 
                ? 'Confirma la aprobación del proyecto. Puedes agregar comentarios opcionales.'
                : 'Confirma el rechazo del proyecto. Es recomendable agregar comentarios explicando el motivo.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Proyecto</label>
                <p className="text-slate-900 font-medium">{selectedRequest.project_name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Comentarios {actionType === 'approve' ? '(opcionales)' : '(recomendados)'}
                </label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={
                    actionType === 'approve' 
                      ? 'Comentarios sobre la aprobación...'
                      : 'Explica el motivo del rechazo...'
                  }
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowActionModal(false)}
                  disabled={actionLoading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAction}
                  disabled={actionLoading}
                  className={
                    actionType === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }
                >
                  {actionLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : actionType === 'approve' ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  {actionType === 'approve' ? 'Aprobar' : 'Rechazar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}