import React, { useState } from 'react';
import { motion } from '@/components/OptimizedMotion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Calendar,
  User
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { formatDateSafe } from '@/utils/formatDateSafe';

interface Project {
  id: string;
  name: string;
  description?: string;
  approval_status?: 'pending' | 'approved' | 'rejected';
  approval_notes?: string;
  approved_at?: string;
  created_at: string;
}

interface ProjectApprovalRequestProps {
  project: Project;
  user: any;
  onRequestSubmitted?: () => void;
}

export default function ProjectApprovalRequest({ 
  project, 
  user, 
  onRequestSubmitted 
}: ProjectApprovalRequestProps) {
  const [requestNotes, setRequestNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const { toast } = useToast();

  // Solo mostrar para clientes (no admins)
  if (user?.role === 'admin') {
    return null;
  }

  // Obtener color del estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    }
  };

  // Obtener icono del estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Obtener texto del estado
  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprobado';
      case 'rejected': return 'Rechazado';
      default: return 'Pendiente de aprobación';
    }
  };

  // Enviar solicitud de aprobación
  const submitApprovalRequest = async () => {
    if (!requestNotes.trim()) {
      toast({
        title: "Notas requeridas",
        description: "Por favor, agrega una descripción de tu proyecto",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.rpc('create_project_approval_request', {
        p_project_id: project.id,
        p_request_notes: requestNotes.trim()
      });

      if (error) throw error;

      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud de aprobación ha sido enviada a los administradores",
      });

      setRequestNotes('');
      setShowRequestForm(false);
      onRequestSubmitted?.();
    } catch (error) {
      console.error('Error enviando solicitud:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud de aprobación",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Estado de Aprobación
            </CardTitle>
            <CardDescription>
              Tu proyecto necesita aprobación antes de ser visible
            </CardDescription>
          </div>
          <Badge className={`${getStatusColor(project.approval_status || 'pending')} border`}>
            {getStatusIcon(project.approval_status || 'pending')}
            <span className="ml-1">{getStatusText(project.approval_status || 'pending')}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Estado actual */}
        {project.approval_status === 'pending' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <Clock className="h-4 w-4" />
              <span>Tu proyecto está siendo revisado por los administradores</span>
            </div>
            
            <div className="text-sm text-slate-600">
              <p>• Los administradores revisarán tu proyecto</p>
              <p>• Recibirás una notificación cuando se tome una decisión</p>
              <p>• El proceso puede tomar entre 24-48 horas</p>
            </div>
          </div>
        )}

        {project.approval_status === 'approved' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span>¡Tu proyecto ha sido aprobado!</span>
            </div>
            
            {project.approved_at && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="h-4 w-4" />
                <span>Aprobado el: {formatDateSafe(project.approved_at)}</span>
              </div>
            )}

            {project.approval_notes && (
              <div className="flex items-start gap-2 text-sm text-slate-600">
                <MessageSquare className="h-4 w-4 mt-0.5" />
                <span>{project.approval_notes}</span>
              </div>
            )}
          </div>
        )}

        {project.approval_status === 'rejected' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-red-700">
              <XCircle className="h-4 w-4" />
              <span>Tu proyecto fue rechazado</span>
            </div>
            
            {project.approved_at && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="h-4 w-4" />
                <span>Rechazado el: {formatDateSafe(project.approved_at)}</span>
              </div>
            )}

            {project.approval_notes && (
              <div className="flex items-start gap-2 text-sm text-slate-600">
                <MessageSquare className="h-4 w-4 mt-0.5" />
                <span className="text-red-600">{project.approval_notes}</span>
              </div>
            )}

            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRequestForm(true)}
                className="text-xs"
              >
                <Send className="h-3 w-3 mr-1" />
                Solicitar nueva revisión
              </Button>
            </div>
          </div>
        )}

        {/* Formulario de solicitud */}
        {(!project.approval_status || project.approval_status === 'rejected') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ 
              opacity: showRequestForm ? 1 : 0, 
              height: showRequestForm ? 'auto' : 0 
            }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-3 border-t border-amber-200">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Describe tu proyecto:
                </label>
                <Textarea
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  placeholder="Explica qué tipo de proyecto quieres crear, sus características principales, público objetivo, etc..."
                  className="mt-1"
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRequestForm(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={submitApprovalRequest}
                  disabled={loading || !requestNotes.trim()}
                  className="flex-1"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? 'Enviando...' : 'Enviar solicitud'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Botón para solicitar aprobación inicial */}
        {!project.approval_status && !showRequestForm && (
          <div className="pt-2">
            <Button
              onClick={() => setShowRequestForm(true)}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              Solicitar aprobación del proyecto
            </Button>
          </div>
        )}

        {/* Información adicional */}
        <div className="text-xs text-slate-500 pt-2 border-t border-amber-200">
          <p>• Los proyectos requieren aprobación para evitar spam</p>
          <p>• Proporciona información detallada para una revisión más rápida</p>
          <p>• Los administradores revisarán tu solicitud en 24-48 horas</p>
        </div>
      </CardContent>
    </Card>
  );
}
