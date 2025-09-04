import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  XCircle, 
  Trash2, 
  Settings, 
  RefreshCw,
  Filter,
  Search,
  Eye,
  EyeOff,
  Clock,
  Star,
  MessageSquare,
  FolderOpen,
  CreditCard,
  Shield,
  User,
  Database
} from 'lucide-react';
import { 
  notificationService, 
  Notification, 
  NotificationSettings,
  NotificationFilters 
} from '@/lib/notificationService';

export default function NotificationsManager() {
  const { user } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  // Cargar notificaciones
  const loadNotifications = async () => {
    try {
      setLoading(true);
      let notificationsData: Notification[] = [];

      if (user.role === 'admin') {
        notificationsData = await notificationService.getAllNotifications(filters);
      } else {
        notificationsData = await notificationService.getUserNotifications(filters);
      }

      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({ 
        title: 'Error', 
        description: 'No se pudieron cargar las notificaciones.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar configuración
  const loadSettings = async () => {
    try {
      const settingsData = await notificationService.getUserNotificationSettings();
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadNotifications();
    loadSettings();
  }, [filters, user.role]);

  // Filtrar notificaciones por tab activo
  const getFilteredNotifications = () => {
    let filtered = notifications;

    // Filtrar por tab activo
    switch (activeTab) {
      case 'unread':
        filtered = filtered.filter(n => !n.is_read);
        break;
      case 'urgent':
        filtered = filtered.filter(n => n.is_urgent);
        break;
      case 'system':
        filtered = filtered.filter(n => n.category === 'system');
        break;
      case 'projects':
        filtered = filtered.filter(n => n.category === 'project');
        break;
      case 'tickets':
        filtered = filtered.filter(n => n.category === 'ticket');
        break;
      case 'payments':
        filtered = filtered.filter(n => n.category === 'payment');
        break;
      case 'security':
        filtered = filtered.filter(n => n.category === 'security');
        break;
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  // Marcar como leída
  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      toast({ title: 'Éxito', description: 'Notificación marcada como leída.' });
    } catch (error) {
      console.error('Error marking as read:', error);
      toast({ 
        title: 'Error', 
        description: 'No se pudo marcar como leída.', 
        variant: 'destructive' 
      });
    }
  };

  // Marcar múltiples como leídas
  const markMultipleAsRead = async () => {
    if (selectedNotifications.length === 0) return;

    try {
      await notificationService.markMultipleAsRead(selectedNotifications);
      setNotifications(prev => 
        prev.map(n => 
          selectedNotifications.includes(n.id) ? { ...n, is_read: true } : n
        )
      );
      setSelectedNotifications([]);
      toast({ title: 'Éxito', description: 'Notificaciones marcadas como leídas.' });
    } catch (error) {
      console.error('Error marking multiple as read:', error);
      toast({ 
        title: 'Error', 
        description: 'No se pudieron marcar como leídas.', 
        variant: 'destructive' 
      });
    }
  };

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      toast({ title: 'Éxito', description: 'Todas las notificaciones marcadas como leídas.' });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({ 
        title: 'Error', 
        description: 'No se pudieron marcar todas como leídas.', 
        variant: 'destructive' 
      });
    }
  };

  // Eliminar notificación
  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast({ title: 'Éxito', description: 'Notificación eliminada.' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({ 
        title: 'Error', 
        description: 'No se pudo eliminar la notificación.', 
        variant: 'destructive' 
      });
    }
  };

  // Actualizar configuración
  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    if (!settings) return;

    try {
      const updatedSettings = await notificationService.updateNotificationSettings({
        [key]: value
      });
      setSettings(updatedSettings);
      toast({ title: 'Éxito', description: 'Configuración actualizada.' });
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({ 
        title: 'Error', 
        description: 'No se pudo actualizar la configuración.', 
        variant: 'destructive' 
      });
    }
  };

  // Obtener icono por tipo
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      case 'error':
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Info className="h-4 w-4 text-blue-400" />;
    }
  };

  // Obtener icono por categoría
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'project':
        return <FolderOpen className="h-4 w-4 text-blue-400" />;
      case 'ticket':
        return <MessageSquare className="h-4 w-4 text-yellow-400" />;
      case 'payment':
        return <CreditCard className="h-4 w-4 text-green-400" />;
      case 'security':
        return <Shield className="h-4 w-4 text-red-400" />;
      case 'user':
        return <User className="h-4 w-4 text-purple-400" />;
      default:
        return <Database className="h-4 w-4 text-gray-400" />;
    }
  };

  // Obtener color del badge por tipo
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'critical':
        return 'bg-red-600/10 text-red-500 border-red-600/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const filteredNotifications = getFilteredNotifications();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando notificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestión de Notificaciones</h2>
          <p className="text-slate-600">Administra las notificaciones del sistema</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={loadNotifications}
            variant="outline"
            size="sm"
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="outline"
            size="sm"
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </Button>
        </div>
      </div>

      {/* Configuración de notificaciones */}
      {showSettings && settings && (
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-800">Configuración de Notificaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">Tipos de Notificaciones</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="project-updates" className="text-slate-700">
                      Actualizaciones de Proyectos
                    </Label>
                    <Switch
                      id="project-updates"
                      checked={settings.project_updates}
                      onCheckedChange={(checked) => updateSetting('project_updates', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ticket-updates" className="text-slate-700">
                      Actualizaciones de Tickets
                    </Label>
                    <Switch
                      id="ticket-updates"
                      checked={settings.ticket_updates}
                      onCheckedChange={(checked) => updateSetting('ticket_updates', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="payment-updates" className="text-slate-700">
                      Actualizaciones de Pagos
                    </Label>
                    <Switch
                      id="payment-updates"
                      checked={settings.payment_updates}
                      onCheckedChange={(checked) => updateSetting('payment_updates', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="security-alerts" className="text-slate-700">
                      Alertas de Seguridad
                    </Label>
                    <Switch
                      id="security-alerts"
                      checked={settings.security_alerts}
                      onCheckedChange={(checked) => updateSetting('security_alerts', checked)}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">Configuración General</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-notifications" className="text-slate-700">
                      Notificaciones por Email
                    </Label>
                    <Switch
                      id="email-notifications"
                      checked={settings.email_notifications}
                      onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push-notifications" className="text-slate-700">
                      Notificaciones Push
                    </Label>
                    <Switch
                      id="push-notifications"
                      checked={settings.push_notifications}
                      onCheckedChange={(checked) => updateSetting('push_notifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="daily-summary" className="text-slate-700">
                      Resumen Diario
                    </Label>
                    <Switch
                      id="daily-summary"
                      checked={settings.daily_summary}
                      onCheckedChange={(checked) => updateSetting('daily_summary', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="weekly-report" className="text-slate-700">
                      Reporte Semanal
                    </Label>
                    <Switch
                      id="weekly-report"
                      checked={settings.weekly_report}
                      onCheckedChange={(checked) => updateSetting('weekly_report', checked)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros y búsqueda */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Buscar notificaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-slate-200 text-slate-800"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select
                value={filters.type || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, type: value === 'all' ? undefined : value }))}
              >
                <SelectTrigger className="w-32 bg-white border-slate-200 text-slate-800">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Éxito</SelectItem>
                  <SelectItem value="warning">Advertencia</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.is_read === undefined ? 'all' : filters.is_read ? 'read' : 'unread'}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  is_read: value === 'all' ? undefined : value === 'read' 
                }))}
              >
                <SelectTrigger className="w-32 bg-white border-slate-200 text-slate-800">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="unread">No leídas</SelectItem>
                  <SelectItem value="read">Leídas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de notificaciones */}
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-800">Notificaciones</CardTitle>
            <div className="flex items-center space-x-2">
              {selectedNotifications.length > 0 && (
                <Button
                  onClick={markMultipleAsRead}
                  variant="outline"
                  size="sm"
                  className="border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marcar como leídas ({selectedNotifications.length})
                </Button>
              )}
              <Button
                onClick={markAllAsRead}
                variant="outline"
                size="sm"
                className="border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Marcar todas
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-8 bg-slate-100">
              <TabsTrigger value="all" className="text-xs">Todas</TabsTrigger>
              <TabsTrigger value="unread" className="text-xs">No leídas</TabsTrigger>
              <TabsTrigger value="urgent" className="text-xs">Urgentes</TabsTrigger>
              <TabsTrigger value="system" className="text-xs">Sistema</TabsTrigger>
              <TabsTrigger value="projects" className="text-xs">Proyectos</TabsTrigger>
              <TabsTrigger value="tickets" className="text-xs">Tickets</TabsTrigger>
              <TabsTrigger value="payments" className="text-xs">Pagos</TabsTrigger>
              <TabsTrigger value="security" className="text-xs">Seguridad</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <div className="max-h-96 overflow-y-auto">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500">No hay notificaciones en esta categoría</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-lg border transition-colors ${
                          notification.is_read 
                            ? 'bg-slate-50 border-slate-200' 
                            : 'bg-white border-slate-300'
                        } ${
                          notification.is_urgent 
                            ? 'border-red-300 bg-red-50' 
                            : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="flex items-center space-x-2">
                              {getTypeIcon(notification.type)}
                              {getCategoryIcon(notification.category)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className={`font-medium ${
                                  notification.is_read ? 'text-slate-600' : 'text-slate-800'
                                }`}>
                                  {notification.title}
                                </h3>
                                <div className="flex items-center space-x-2">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${getTypeColor(notification.type)}`}
                                  >
                                    {notification.type}
                                  </Badge>
                                  {notification.is_urgent && (
                                    <Badge variant="destructive" className="text-xs">
                                      Urgente
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <p className={`text-sm ${
                                notification.is_read ? 'text-slate-500' : 'text-slate-600'
                              }`}>
                                {notification.message}
                              </p>
                              <div className="flex items-center space-x-2 mt-2 text-xs text-slate-400">
                                <Clock className="h-3 w-3" />
                                <span>{new Date(notification.created_at).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <input
                              type="checkbox"
                              checked={selectedNotifications.includes(notification.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedNotifications(prev => [...prev, notification.id]);
                                } else {
                                  setSelectedNotifications(prev => prev.filter(id => id !== notification.id));
                                }
                              }}
                              className="rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500"
                            />
                            {!notification.is_read && (
                              <Button
                                onClick={() => markAsRead(notification.id)}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              onClick={() => deleteNotification(notification.id)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
