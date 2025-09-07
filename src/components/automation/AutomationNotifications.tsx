import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap, 
  Users, 
  Calendar,
  Target,
  TrendingUp,
  Settings,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'automation' | 'deadline' | 'escalation' | 'assignment' | 'report';
  is_read: boolean;
  created_at: string;
  data?: any;
}

interface AutomationAlert {
  id: string;
  type: 'deadline_overdue' | 'task_assigned' | 'escalation_triggered' | 'report_generated';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  data?: any;
}

export const AutomationNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [alerts, setAlerts] = useState<AutomationAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    loadAlerts();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('type', 'automation')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      // Simular alertas del sistema de automatización
      const mockAlerts: AutomationAlert[] = [
        {
          id: '1',
          type: 'deadline_overdue',
          title: 'Tarea Vencida Detectada',
          message: 'La tarea "Implementar API de usuarios" lleva 3 días vencida',
          severity: 'high',
          created_at: new Date().toISOString(),
          data: { task_id: 'task_123', days_overdue: 3 }
        },
        {
          id: '2',
          type: 'task_assigned',
          title: 'Tarea Asignada Automáticamente',
          message: 'Se asignó "Diseño de interfaz" a Juan Pérez basado en sus habilidades',
          severity: 'low',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          data: { task_id: 'task_456', assigned_to: 'user_789' }
        },
        {
          id: '3',
          type: 'escalation_triggered',
          title: 'Escalación Automática',
          message: 'El proyecto "E-commerce" requiere atención inmediata',
          severity: 'critical',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          data: { project_id: 'proj_123', reason: 'deadline_critical' }
        },
        {
          id: '4',
          type: 'report_generated',
          title: 'Reporte Semanal Generado',
          message: 'El reporte de productividad de la semana ha sido generado automáticamente',
          severity: 'low',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          data: { report_id: 'weekly_2024_01', period: '2024-01-01 to 2024-01-07' }
        }
      ];

      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Error cargando alertas:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);

      toast({
        title: "Notificaciones Marcadas",
        description: "Todas las notificaciones han sido marcadas como leídas",
      });
    } catch (error) {
      console.error('Error marcando todas las notificaciones:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deadline_overdue': return <Clock className="h-4 w-4" />;
      case 'task_assigned': return <Target className="h-4 w-4" />;
      case 'escalation_triggered': return <AlertTriangle className="h-4 w-4" />;
      case 'report_generated': return <TrendingUp className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'automation': return <Zap className="h-4 w-4" />;
      case 'deadline': return <Clock className="h-4 w-4" />;
      case 'escalation': return <AlertTriangle className="h-4 w-4" />;
      case 'assignment': return <Users className="h-4 w-4" />;
      case 'report': return <TrendingUp className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Notificaciones de Automatización</h3>
          <p className="text-muted-foreground">
            Alertas y notificaciones del sistema de automatización
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Badge variant="destructive" className="px-3 py-1">
              {unreadCount} sin leer
            </Badge>
          )}
          <Button onClick={loadNotifications} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              Marcar Todas
            </Button>
          )}
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Notificaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
            <p className="text-xs text-muted-foreground">
              Notificaciones del sistema
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sin Leer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">
              Requieren atención
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Alertas Críticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {alerts.filter(a => a.severity === 'critical').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Requieren acción inmediata
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter(n => 
                new Date(n.created_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Notificaciones de hoy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Notificaciones */}
      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="alerts">Alertas del Sistema</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones de Automatización</CardTitle>
              <CardDescription>
                Historial de notificaciones generadas por el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay notificaciones</h3>
                  <p className="text-muted-foreground">
                    Las notificaciones de automatización aparecerán aquí
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 border rounded-lg transition-all duration-200 hover:shadow-md ${
                        !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            !notification.is_read ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className={`font-medium ${!notification.is_read ? 'text-blue-900' : 'text-gray-900'}`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center space-x-2">
                              {!notification.is_read && (
                                <Badge variant="secondary" className="text-xs">
                                  Nuevo
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {new Date(notification.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          {!notification.is_read && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Marcar como leída
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas del Sistema</CardTitle>
              <CardDescription>
                Alertas críticas y eventos del sistema de automatización
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <Alert key={alert.id} className={getSeverityColor(alert.severity)}>
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(alert.type)}
                      <AlertTitle className="text-sm font-medium">
                        {alert.title}
                      </AlertTitle>
                      <Badge variant="outline" className="ml-auto">
                        {alert.severity}
                      </Badge>
                    </div>
                    <AlertDescription className="mt-2">
                      {alert.message}
                    </AlertDescription>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {new Date(alert.created_at).toLocaleString()}
                    </div>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Notificaciones</CardTitle>
              <CardDescription>
                Configura las preferencias de notificaciones de automatización
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Notificaciones de Deadlines</h4>
                    <p className="text-sm text-muted-foreground">
                      Recibir alertas cuando las tareas estén próximas a vencer
                    </p>
                  </div>
                  <Badge variant="secondary">Activo</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Asignaciones Automáticas</h4>
                    <p className="text-sm text-muted-foreground">
                      Notificar cuando se asignen tareas automáticamente
                    </p>
                  </div>
                  <Badge variant="secondary">Activo</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Escalaciones</h4>
                    <p className="text-sm text-muted-foreground">
                      Alertas cuando se escalen problemas críticos
                    </p>
                  </div>
                  <Badge variant="secondary">Activo</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Reportes Generados</h4>
                    <p className="text-sm text-muted-foreground">
                      Notificar cuando se generen reportes automáticamente
                    </p>
                  </div>
                  <Badge variant="secondary">Activo</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
