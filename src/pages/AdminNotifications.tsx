import React, { useState, useEffect } from 'react';
import { motion } from '@/components/OptimizedMotion';
import { 
  Bell, 
  Calendar, 
  BarChart3, 
  Clock, 
  Send, 
  Users, 
  Mail, 
  Smartphone,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  Download,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { supabase } from '@/lib/supabase';
import { notificationWorker } from '@/lib/notificationWorker';

// =====================================================
// INTERFACES Y TIPOS
// =====================================================

interface NotificationStats {
  total: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
  bounce: number;
}

interface ScheduledNotification {
  id: string;
  user_id: string;
  template_id?: string;
  rule_id?: string;
  channels: string[];
  subject?: string;
  content: string;
  html_content?: string;
  variables: Record<string, any>;
  scheduled_for: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  attempts: number;
  max_attempts: number;
  last_attempt_at?: string;
  error_message?: string;
  sent_at?: string;
  created_at: string;
  updated_at: string;
  users?: { email: string; full_name: string };
  templates?: { name: string; display_name: string };
  rules?: { name: string; description: string };
}

interface NotificationAnalytics {
  date: string;
  channel: string;
  category: string;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  failed_count: number;
  bounce_count: number;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function AdminNotifications() {
  const [stats, setStats] = useState<NotificationStats>({
    total: 0, sent: 0, delivered: 0, opened: 0, clicked: 0, failed: 0, bounce: 0
  });
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);
  const [analytics, setAnalytics] = useState<NotificationAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Estados para el modal de programar notificación
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<ScheduledNotification | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    subject: '',
    content: '',
    channels: ['in-app'],
    scheduledFor: (() => {
      // Establecer fecha y hora actual de Argentina + 1 hora por defecto
      const now = new Date();
      now.setHours(now.getHours() + 1);
      now.setMinutes(0, 0, 0); // Redondear a la hora en punto
      // Formato YYYY-MM-DDTHH:MM para datetime-local
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    })(),
    users: 'all'
  });
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [workerStatus, setWorkerStatus] = useState(notificationWorker.getStatus());

  // =====================================================
  // EFECTOS Y CARGA DE DATOS
  // =====================================================

  useEffect(() => {
    loadData();
    
    // Iniciar el worker de notificaciones
    notificationWorker.start();
    
    // Actualizar estado del worker cada 5 segundos
    const workerInterval = setInterval(() => {
      setWorkerStatus(notificationWorker.getStatus());
    }, 5000);
    
    // Limpiar al desmontar
    return () => {
      notificationWorker.stop();
      clearInterval(workerInterval);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadScheduledNotifications(),
        loadAnalytics()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Cargar notificaciones básicas
      const { data: notifications, error: notificationsError } = await supabase
        .from('notifications')
        .select('*');

      if (notificationsError) {

        setStats({
          total: 0,
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          failed: 0,
          bounce: 0
        });
        return;
      }

      // Intentar cargar logs de entrega si existe la tabla
      let deliveryLogs: any[] = [];
      try {
        const { data: logs, error: logsError } = await supabase
          .from('notification_delivery_logs')
          .select('*');
        
        if (!logsError) {
          deliveryLogs = logs || [];
        }
      } catch (logsError) {

      }

      const stats: NotificationStats = {
        total: notifications?.length || 0,
        sent: deliveryLogs?.filter(log => log.status === 'sent').length || 0,
        delivered: deliveryLogs?.filter(log => log.status === 'delivered').length || 0,
        opened: deliveryLogs?.filter(log => log.status === 'opened').length || 0,
        clicked: deliveryLogs?.filter(log => log.status === 'clicked').length || 0,
        failed: deliveryLogs?.filter(log => log.status === 'failed').length || 0,
        bounce: deliveryLogs?.filter(log => log.status === 'bounced').length || 0,
      };

      setStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats({
        total: 0,
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        failed: 0,
        bounce: 0
      });
    }
  };

  const loadScheduledNotifications = async () => {
    try {
      // Primero cargar las notificaciones programadas
      const { data: notifications, error: notificationsError } = await supabase
        .from('scheduled_notifications')
        .select('*')
        .order('scheduled_for', { ascending: true });

      if (notificationsError) throw notificationsError;

      // Luego cargar los usuarios para hacer el join manual
      const userIds = notifications?.map(n => n.user_id).filter(Boolean) || [];
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .in('id', userIds);

      if (usersError) throw usersError;

      // Crear un mapa de usuarios
      const usersMap = new Map(users?.map(u => [u.id, u]) || []);

      // Combinar los datos
      const enrichedNotifications = notifications?.map(notification => ({
        ...notification,
        users: usersMap.get(notification.user_id) || { email: 'N/A', full_name: 'N/A' },
        templates: { name: 'Personalizada', display_name: 'Notificación Personalizada' },
        rules: { name: 'Manual', description: 'Notificación creada manualmente' }
      })) || [];

      setScheduledNotifications(enrichedNotifications);
    } catch (error) {
      console.error('Error loading scheduled notifications:', error);
      setScheduledNotifications([]);
    }
  };

  const loadAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_analytics')
        .select('*')
        .order('date', { ascending: false })
        .limit(30);

      if (error) {

        setAnalytics([]);
        return;
      }
      
      setAnalytics(data || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setAnalytics([]);
    }
  };

  // =====================================================
  // FUNCIONES DE ACCIÓN
  // =====================================================

  const cancelScheduledNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_notifications')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) {
        console.error('Error cancelling notification:', error);
        return;
      }
      
      // Recargar datos
      await loadScheduledNotifications();
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  };

  const deleteScheduledNotification = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta notificación? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('scheduled_notifications')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting notification:', error);
        alert('Error al eliminar la notificación');
        return;
      }
      
      alert('Notificación eliminada exitosamente');
      await loadScheduledNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('Error al eliminar la notificación');
    }
  };

  const editScheduledNotification = (notification: ScheduledNotification) => {
    setEditingNotification(notification);
    
    // Convertir la fecha de ISO a formato datetime-local
    const date = new Date(notification.scheduled_for);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;

    setScheduleForm({
      subject: notification.subject || '',
      content: notification.content,
      channels: notification.channels,
      scheduledFor: formattedDate,
      users: notification.variables?.is_broadcast ? 'all' : 'admin'
    });
    
    setIsEditModalOpen(true);
  };

  const handleUpdateNotification = async () => {
    if (!editingNotification || !scheduleForm.subject || !scheduleForm.content || !scheduleForm.scheduledFor) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    setScheduleLoading(true);
    try {
      const scheduledDate = new Date(scheduleForm.scheduledFor);
      if (isNaN(scheduledDate.getTime())) {
        alert('La fecha seleccionada no es válida');
        return;
      }

      const { error } = await supabase
        .from('scheduled_notifications')
        .update({
          subject: scheduleForm.subject,
          content: scheduleForm.content,
          channels: scheduleForm.channels,
          scheduled_for: scheduledDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', editingNotification.id);

      if (error) throw error;

      alert('Notificación actualizada exitosamente');
      setIsEditModalOpen(false);
      setEditingNotification(null);
      await loadScheduledNotifications();
    } catch (error) {
      console.error('Error updating notification:', error);
      alert('Error al actualizar la notificación');
    } finally {
      setScheduleLoading(false);
    }
  };

  const rescheduleNotification = async (id: string, newDate: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_notifications')
        .update({
          scheduled_for: newDate,
          status: 'pending',
          attempts: 0,
          error_message: null
        })
        .eq('id', id);

      if (error) {
        console.error('Error rescheduling notification:', error);
        return;
      }
      
      await loadScheduledNotifications();
    } catch (error) {
      console.error('Error rescheduling notification:', error);
    }
  };

  // =====================================================
  // FUNCIÓN PARA PROGRAMAR NOTIFICACIÓN
  // =====================================================

  const handleScheduleNotification = async () => {
    if (!scheduleForm.subject || !scheduleForm.content || !scheduleForm.scheduledFor) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    // Validar que la fecha sea válida
    const scheduledDate = new Date(scheduleForm.scheduledFor);
    if (isNaN(scheduledDate.getTime())) {
      alert('La fecha seleccionada no es válida');
      return;
    }

    setScheduleLoading(true);
    try {
      // Obtener usuarios según la selección
      let userIds: string[] = [];
      
      if (scheduleForm.users === 'all') {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id');
        
        if (usersError) throw usersError;
        userIds = users?.map(u => u.id) || [];
      } else if (scheduleForm.users === 'admin') {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'admin');
        
        if (usersError) throw usersError;
        userIds = users?.map(u => u.id) || [];
      }

      // Crear UNA SOLA notificación programada para TODOS los usuarios
      const notificationToCreate = {
        user_id: userIds[0] || '', // Usar el primer usuario como referencia (requerido por la BD)
        channels: scheduleForm.channels,
        subject: scheduleForm.subject,
        content: scheduleForm.content,
        scheduled_for: scheduledDate.toISOString(),
        status: 'pending',
        attempts: 0,
        max_attempts: 3,
        variables: {
          target_users: userIds, // Guardar IDs de usuarios objetivo
          is_broadcast: true,    // Marcar como broadcast
          original_user_count: userIds.length // Contador de usuarios objetivo
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('scheduled_notifications')
        .insert([notificationToCreate]);

      if (error) throw error;

      // Limpiar formulario y cerrar modal
      setScheduleForm({
        subject: '',
        content: '',
        channels: ['in-app'],
        scheduledFor: (() => {
          // Establecer fecha y hora actual de Argentina + 1 hora por defecto
          const now = new Date();
          now.setHours(now.getHours() + 1);
          now.setMinutes(0, 0, 0); // Redondear a la hora en punto
          // Formato YYYY-MM-DDTHH:MM para datetime-local
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        })(),
        users: 'all'
      });
      setIsScheduleModalOpen(false);

      // Recargar datos
      await loadScheduledNotifications();
      await loadStats();

      alert('Notificación programada exitosamente para todos los usuarios');
    } catch (error) {
      console.error('Error scheduling notification:', error);
      alert('Error al programar la notificación');
    } finally {
      setScheduleLoading(false);
    }
  };

  // =====================================================
  // COMPONENTES DE INTERFAZ
  // =====================================================

  const StatCard = ({ title, value, icon: Icon, color, change }: {
    title: string;
    value: number;
    icon: any;
    color: string;
    change?: number;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-3xl font-bold" style={{ color }}>{value.toLocaleString()}</p>
              {change !== undefined && (
                <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {change >= 0 ? '+' : ''}{change}% desde ayer
                </p>
              )}
            </div>
            <div className={`p-3 rounded-full`} style={{ backgroundColor: `${color}20` }}>
              <Icon className="w-6 h-6" style={{ color }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const ScheduledNotificationCard = ({ notification }: { notification: ScheduledNotification }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant={
                notification.status === 'pending' ? 'default' :
                notification.status === 'sent' ? 'secondary' :
                notification.status === 'failed' ? 'destructive' : 'outline'
              }>
                {notification.status === 'pending' ? 'Pendiente' :
                 notification.status === 'sent' ? 'Enviada' :
                 notification.status === 'failed' ? 'Fallida' : 'Cancelada'}
              </Badge>
              <Badge variant="outline">{notification.channels.join(', ')}</Badge>
              {notification.variables?.is_broadcast && (
                <Badge variant="secondary">Broadcast</Badge>
              )}
            </div>
                         <div className="flex space-x-2">
               <Button
                 size="sm"
                 variant="outline"
                 onClick={() => editScheduledNotification(notification)}
                 disabled={notification.status !== 'pending'}
               >
                 <Edit className="w-4 h-4" />
               </Button>
               <Button
                 size="sm"
                 variant="outline"
                 onClick={() => rescheduleNotification(notification.id, new Date().toISOString())}
                 disabled={notification.status !== 'pending'}
               >
                 <Clock className="w-4 h-4" />
               </Button>
               <Button
                 size="sm"
                 variant="outline"
                 onClick={() => cancelScheduledNotification(notification.id)}
                 disabled={notification.status !== 'pending'}
               >
                 <XCircle className="w-4 h-4" />
               </Button>
               <Button
                 size="sm"
                 variant="destructive"
                 onClick={() => deleteScheduledNotification(notification.id)}
               >
                 <Trash2 className="w-4 h-4" />
               </Button>
             </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold">{notification.subject || 'Sin asunto'}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2">{notification.content}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
                             <div>
                 <span className="text-muted-foreground">Destinatarios:</span>
                 <p className="font-medium">
                   {notification.variables?.is_broadcast 
                     ? `${notification.variables?.original_user_count || notification.variables?.target_users?.length || 0} usuarios`
                     : notification.users?.full_name || notification.users?.email || 'N/A'
                   }
                 </p>
               </div>
                             <div>
                 <span className="text-muted-foreground">Programado para:</span>
                 <p className="font-medium">
                   {(() => {
                     try {
                       const date = new Date(notification.scheduled_for);
                       if (isNaN(date.getTime())) {
                         return 'Fecha inválida';
                       }
                       return date.toLocaleString('es-AR', {
                         timeZone: 'America/Argentina/Buenos_Aires',
                         year: 'numeric',
                         month: '2-digit',
                         day: '2-digit',
                         hour: '2-digit',
                         minute: '2-digit'
                       });
                     } catch (error) {
                       return 'Fecha inválida';
                     }
                   })()}
                 </p>
               </div>
              <div>
                <span className="text-muted-foreground">Plantilla:</span>
                <p className="font-medium">{notification.templates?.display_name || 'Personalizada'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Intentos:</span>
                <p className="font-medium">{notification.attempts}/{notification.max_attempts}</p>
              </div>
            </div>
            {notification.error_message && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">
                  <strong>Error:</strong> {notification.error_message}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const AnalyticsChart = ({ data }: { data: NotificationAnalytics[] }) => {
    const channels = [...new Set(data.map(item => item.channel))];
    const categories = [...new Set(data.map(item => item.category))];

    return (
      <Card>
        <CardHeader>
          <CardTitle>Rendimiento por Canal</CardTitle>
          <CardDescription>Métricas de entrega y engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {channels.map(channel => {
              const channelData = data.filter(item => item.channel === channel);
              const totalSent = channelData.reduce((sum, item) => sum + item.sent_count, 0);
              const totalDelivered = channelData.reduce((sum, item) => sum + item.delivered_count, 0);
              const totalOpened = channelData.reduce((sum, item) => sum + item.opened_count, 0);
              const totalClicked = channelData.reduce((sum, item) => sum + item.clicked_count, 0);
              
              const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
              const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
              const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;

              return (
                <div key={channel} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{channel}</span>
                    <span className="text-sm text-muted-foreground">
                      {totalSent.toLocaleString()} enviadas
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Tasa de entrega</span>
                      <span className="font-medium">{deliveryRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${deliveryRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Tasa de apertura</span>
                      <span className="font-medium">{openRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${openRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Tasa de clics</span>
                      <span className="font-medium">{clickRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${clickRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  // =====================================================
  // RENDERIZADO PRINCIPAL
  // =====================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="w-8 h-8 text-blue-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Notificaciones</h1>
          <p className="text-gray-600">Gestión avanzada de notificaciones y analytics</p>
        </div>
                 <div className="flex space-x-2">
           <Button onClick={loadData} variant="outline">
             <RefreshCw className="w-4 h-4 mr-2" />
             Actualizar
           </Button>
           <Button 
             onClick={() => {
               notificationWorker.start();
               setWorkerStatus(notificationWorker.getStatus());
             }} 
             variant="outline"
             className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
             disabled={workerStatus.isRunning}
           >
             🚀 Iniciar Worker
           </Button>
           <Button 
             onClick={() => {
               notificationWorker.stop();
               setWorkerStatus(notificationWorker.getStatus());
             }} 
             variant="outline"
             className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
             disabled={!workerStatus.isRunning}
           >
             🛑 Detener Worker
           </Button>
           <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
             <div className={`w-2 h-2 rounded-full ${workerStatus.isRunning ? 'bg-green-500' : 'bg-red-500'}`} />
             <span className="text-sm text-gray-600">
               Worker: {workerStatus.isRunning ? 'Activo' : 'Inactivo'}
             </span>
           </div>
         </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Notificaciones"
          value={stats.total}
          icon={Bell}
          color="#3B82F6"
        />
        <StatCard
          title="Enviadas"
          value={stats.sent}
          icon={Send}
          color="#10B981"
        />
        <StatCard
          title="Entregadas"
          value={stats.delivered}
          icon={CheckCircle}
          color="#059669"
        />
        <StatCard
          title="Fallidas"
          value={stats.failed}
          icon={XCircle}
          color="#EF4444"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="scheduled">Programadas</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
        </TabsList>

        {/* Vista General */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
                <CardDescription>Últimas notificaciones del sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scheduledNotifications.slice(0, 5).map(notification => (
                    <div key={notification.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${
                        notification.status === 'pending' ? 'bg-yellow-500' :
                        notification.status === 'sent' ? 'bg-green-500' :
                        notification.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{notification.subject || 'Sin asunto'}</p>
                                                 <p className="text-xs text-gray-500">
                           {notification.variables?.is_broadcast 
                             ? `${notification.variables?.original_user_count || notification.variables?.target_users?.length || 0} usuarios`
                             : notification.users?.full_name || notification.users?.email
                           } • 
                           {(() => {
                             try {
                               const date = new Date(notification.scheduled_for);
                               if (isNaN(date.getTime())) {
                                 return 'Fecha inválida';
                               }
                               return date.toLocaleDateString('es-AR', {
                                 timeZone: 'America/Argentina/Buenos_Aires'
                               });
                             } catch (error) {
                               return 'Fecha inválida';
                             }
                           })()}
                         </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {notification.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rendimiento por Canal</CardTitle>
                <CardDescription>Métricas de entrega por tipo de notificación</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                                     {(() => {
                     // Calcular métricas reales basadas en los datos de analytics
                     const emailData = analytics.filter(item => item.channel === 'email');
                     const pushData = analytics.filter(item => item.channel === 'push');
                     const inAppData = analytics.filter(item => item.channel === 'in-app');
                     
                     const emailRate = emailData.length > 0 ? 
                       (emailData.reduce((sum, item) => sum + item.delivered_count, 0) / 
                        emailData.reduce((sum, item) => sum + item.sent_count, 1)) * 100 : 0;
                     
                     const pushRate = pushData.length > 0 ? 
                       (pushData.reduce((sum, item) => sum + item.delivered_count, 0) / 
                        pushData.reduce((sum, item) => sum + item.sent_count, 1)) * 100 : 0;
                     
                     const inAppRate = inAppData.length > 0 ? 
                       (inAppData.reduce((sum, item) => sum + item.delivered_count, 0) / 
                        inAppData.reduce((sum, item) => sum + item.sent_count, 1)) * 100 : 100;
                     
                     return (
                       <>
                         <div className="flex items-center justify-between">
                           <span className="text-sm">Email</span>
                           <span className="text-sm font-medium">{emailRate.toFixed(1)}%</span>
                         </div>
                         <div className="w-full bg-gray-200 rounded-full h-2">
                           <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${emailRate}%` }} />
                         </div>
                         
                         <div className="flex items-center justify-between">
                           <span className="text-sm">Push</span>
                           <span className="text-sm font-medium">{pushRate.toFixed(1)}%</span>
                         </div>
                         <div className="w-full bg-gray-200 rounded-full h-2">
                           <div className="bg-green-600 h-2 rounded-full" style={{ width: `${pushRate}%` }} />
                         </div>
                         
                         <div className="flex items-center justify-between">
                           <span className="text-sm">In-App</span>
                           <span className="text-sm font-medium">{inAppRate.toFixed(1)}%</span>
                         </div>
                         <div className="w-full bg-gray-200 rounded-full h-2">
                           <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${inAppRate}%` }} />
                         </div>
                       </>
                     );
                   })()}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notificaciones Programadas */}
        <TabsContent value="scheduled" className="space-y-6">
          <div className="flex items-center justify-between">
             <div>
               <h2 className="text-2xl font-bold">Notificaciones Programadas</h2>
               <p className="text-gray-600">Gestiona las notificaciones programadas para envío futuro</p>
             </div>
             <div className="flex space-x-2">
               <Button 
                 variant="outline" 
                 onClick={async () => {
                   // Procesar manualmente las notificaciones vencidas
                   const now = new Date().toISOString();
                   const { data: pendingNotifications } = await supabase
                     .from('scheduled_notifications')
                     .select('*')
                     .eq('status', 'pending')
                     .lte('scheduled_for', now);
                   
                   if (pendingNotifications && pendingNotifications.length > 0) {
                     alert(`Procesando ${pendingNotifications.length} notificaciones vencidas...`);
                     await loadScheduledNotifications();
                     await loadStats();
                   } else {
                     alert('No hay notificaciones vencidas para procesar');
                   }
                 }}
                 className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
               >
                 ⚡ Procesar Ahora
               </Button>
               <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
               <DialogTrigger asChild>
                 <Button onClick={() => setIsScheduleModalOpen(true)}>
                   <Plus className="w-4 h-4 mr-2" />
                   Programar Notificación
                 </Button>
               </DialogTrigger>
               <DialogContent className="max-w-2xl">
                 <DialogHeader>
                   <DialogTitle>Programar Nueva Notificación</DialogTitle>
                   <DialogDescription>
                     Crea una notificación programada para envío futuro
                   </DialogDescription>
                 </DialogHeader>
                 <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <Label htmlFor="subject">Asunto</Label>
                       <Input 
                         id="subject" 
                         placeholder="Asunto de la notificación"
                         value={scheduleForm.subject}
                         onChange={(e) => setScheduleForm(prev => ({ ...prev, subject: e.target.value }))}
                       />
                     </div>
                     <div>
                       <Label htmlFor="channels">Canales</Label>
                       <Select 
                         value={scheduleForm.channels[0]} 
                         onValueChange={(value) => setScheduleForm(prev => ({ ...prev, channels: [value] }))}
                       >
                         <SelectTrigger>
                           <SelectValue placeholder="Seleccionar canales" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="email">Email</SelectItem>
                           <SelectItem value="push">Push</SelectItem>
                           <SelectItem value="in-app">In-App</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                   </div>
                   <div>
                     <Label htmlFor="content">Contenido</Label>
                     <Textarea 
                       id="content" 
                       placeholder="Contenido de la notificación" 
                       rows={4}
                       value={scheduleForm.content}
                       onChange={(e) => setScheduleForm(prev => ({ ...prev, content: e.target.value }))}
                     />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <Label htmlFor="scheduledFor">Programar para (Hora Argentina)</Label>
                       <Input 
                         id="scheduledFor" 
                         type="datetime-local"
                         value={scheduleForm.scheduledFor}
                                                   onChange={(e) => {
                            // El valor ya está en formato YYYY-MM-DDTHH:MM
                            setScheduleForm(prev => ({ ...prev, scheduledFor: e.target.value }));
                          }}
                       />
                       <p className="text-xs text-gray-500 mt-1">
                         La hora se guarda en tu zona horaria local (Argentina)
                       </p>
                     </div>
                     <div>
                       <Label htmlFor="users">Usuarios</Label>
                       <Select 
                         value={scheduleForm.users} 
                         onValueChange={(value) => setScheduleForm(prev => ({ ...prev, users: value }))}
                       >
                         <SelectTrigger>
                           <SelectValue placeholder="Seleccionar usuarios" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="all">Todos los usuarios</SelectItem>
                           <SelectItem value="admin">Solo admins</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                   </div>
                   <div className="flex justify-end space-x-2">
                     <Button 
                       variant="outline" 
                       onClick={() => setIsScheduleModalOpen(false)}
                       disabled={scheduleLoading}
                     >
                       Cancelar
                     </Button>
                     <Button 
                       onClick={handleScheduleNotification}
                       disabled={scheduleLoading}
                     >
                       {scheduleLoading ? 'Programando...' : 'Programar'}
                     </Button>
                   </div>
                 </div>
               </DialogContent>
                           </Dialog>

              {/* Modal de Edición */}
              <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Editar Notificación Programada</DialogTitle>
                    <DialogDescription>
                      Modifica los detalles de la notificación programada
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-subject">Asunto</Label>
                        <Input 
                          id="edit-subject" 
                          placeholder="Asunto de la notificación"
                          value={scheduleForm.subject}
                          onChange={(e) => setScheduleForm(prev => ({ ...prev, subject: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-channels">Canales</Label>
                        <Select 
                          value={scheduleForm.channels[0]} 
                          onValueChange={(value) => setScheduleForm(prev => ({ ...prev, channels: [value] }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar canales" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="push">Push</SelectItem>
                            <SelectItem value="in-app">In-App</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="edit-content">Contenido</Label>
                      <Textarea 
                        id="edit-content" 
                        placeholder="Contenido de la notificación" 
                        rows={4}
                        value={scheduleForm.content}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, content: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-scheduledFor">Programar para (Hora Argentina)</Label>
                      <Input 
                        id="edit-scheduledFor" 
                        type="datetime-local"
                        value={scheduleForm.scheduledFor}
                        onChange={(e) => {
                          setScheduleForm(prev => ({ ...prev, scheduledFor: e.target.value }));
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        La hora se guarda en tu zona horaria local (Argentina)
                      </p>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsEditModalOpen(false);
                          setEditingNotification(null);
                        }}
                        disabled={scheduleLoading}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleUpdateNotification}
                        disabled={scheduleLoading}
                      >
                        {scheduleLoading ? 'Actualizando...' : 'Actualizar'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {scheduledNotifications.map(notification => (
              <ScheduledNotificationCard key={notification.id} notification={notification} />
            ))}
            {scheduledNotifications.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay notificaciones programadas</h3>
                  <p className="text-gray-600">Programa tu primera notificación para comenzar</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Analytics de Notificaciones</h2>
            <p className="text-gray-600">Métricas detalladas del rendimiento del sistema</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnalyticsChart data={analytics} />
            
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Actividad</CardTitle>
                <CardDescription>Últimos 30 días</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total enviadas</span>
                    <span className="font-medium">{analytics.reduce((sum, item) => sum + item.sent_count, 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total entregadas</span>
                    <span className="font-medium">{analytics.reduce((sum, item) => sum + item.delivered_count, 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total abiertas</span>
                    <span className="font-medium">{analytics.reduce((sum, item) => sum + item.opened_count, 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total clics</span>
                    <span className="font-medium">{analytics.reduce((sum, item) => sum + item.clicked_count, 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Tasa de entrega</span>
                    <span className="font-medium text-green-600">
                      {(() => {
                        const totalSent = analytics.reduce((sum, item) => sum + item.sent_count, 0);
                        const totalDelivered = analytics.reduce((sum, item) => sum + item.delivered_count, 0);
                        return totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : '0';
                      })()}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Plantillas */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Plantillas de Notificación</h2>
              <p className="text-gray-600">Gestiona las plantillas para notificaciones automáticas</p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Plantilla
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Bienvenida', category: 'Usuario', channels: ['email', 'push'] },
              { name: 'Proyecto Creado', category: 'Proyecto', channels: ['email', 'in-app'] },
              { name: 'Ticket Asignado', category: 'Ticket', channels: ['email', 'push', 'in-app'] },
              { name: 'Pago Recibido', category: 'Pago', channels: ['email', 'push'] },
              { name: 'Alerta del Sistema', category: 'Sistema', channels: ['email', 'push', 'in-app'] }
            ].map((template, index) => (
              <motion.div
                key={template.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="ghost">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription className="text-sm">{template.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {template.channels.map(channel => (
                          <Badge key={channel} variant="secondary" className="text-xs">
                            {channel}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-sm text-gray-600">
                        Plantilla predefinida para notificaciones automáticas
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
