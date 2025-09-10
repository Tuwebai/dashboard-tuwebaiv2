import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  BellOff, 
  Settings, 
  Check, 
  X, 
  Trash2,
  Github,
  Linkedin,
  Star,
  GitFork,
  Users,
  Activity,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useActivityNotifications } from '@/hooks/useActivityNotifications';

export const ActivityNotifications: React.FC = () => {
  const {
    notifications,
    unreadNotifications,
    preferences,
    markAsRead,
    deleteNotifications,
    updatePreferences,
    getStats,
    markAllAsRead,
    clearAll,
    getNotificationsByType
  } = useActivityNotifications();

  const [showSettings, setShowSettings] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | 'github' | 'linkedin'>('all');

  const stats = getStats();

  const getEventIcon = (event: string, type: 'github' | 'linkedin') => {
    switch (event) {
      case 'new_star':
        return <Star className="w-4 h-4 text-yellow-500" />;
      case 'new_fork':
        return <GitFork className="w-4 h-4 text-blue-500" />;
      case 'new_follower':
        return <Users className="w-4 h-4 text-green-500" />;
      case 'new_connection':
        return <Users className="w-4 h-4 text-blue-600" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getEventMessage = (notification: any) => {
    switch (notification.event) {
      case 'new_star':
        return `⭐ Tu repositorio "${notification.data.repository}" recibió ${notification.data.stars} estrellas`;
      case 'new_fork':
        return `🍴 Tu repositorio "${notification.data.repository}" fue forkeado por ${notification.data.forker}`;
      case 'new_follower':
        return `👥 Tienes un nuevo seguidor en GitHub`;
      case 'new_connection':
        return `🤝 Nueva conexión: ${notification.data.name} - ${notification.data.position}`;
      default:
        return `Nueva actividad en ${notification.type}`;
    }
  };

  const filteredNotifications = selectedType === 'all' 
    ? notifications 
    : getNotificationsByType(selectedType);

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead([notificationId]);
  };

  const handleDeleteNotification = (notificationId: string) => {
    deleteNotifications([notificationId]);
  };

  const handleTogglePreference = (path: string, value: boolean) => {
    const [section, key] = path.split('.');
    updatePreferences({
      [section]: {
        ...preferences[section as keyof typeof preferences],
        [key]: value
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Notificaciones de Actividad</span>
            {unreadNotifications.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadNotifications.length}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Configuración
            </Button>
            {unreadNotifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
              >
                <Check className="w-4 h-4 mr-2" />
                Marcar todas como leídas
              </Button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="flex space-x-1 bg-muted/50 p-1 rounded-lg">
          {[
            { id: 'all', label: 'Todas', count: notifications.length },
            { id: 'github', label: 'GitHub', count: getNotificationsByType('github').length },
            { id: 'linkedin', label: 'LinkedIn', count: getNotificationsByType('linkedin').length }
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedType(filter.id as any)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedType === filter.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{filter.label}</span>
              <Badge variant="secondary" className="text-xs">
                {filter.count}
              </Badge>
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {/* Configuración */}
        {showSettings && (
          <div className="mb-6 p-4 bg-muted/50 rounded-lg space-y-4">
            <h4 className="font-medium">Preferencias de Notificación</h4>
            
            {/* Configuración general */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Notificaciones habilitadas</div>
                  <div className="text-sm text-muted-foreground">Activar/desactivar todas las notificaciones</div>
                </div>
                <Switch
                  checked={preferences.general.enabled}
                  onCheckedChange={(value) => handleTogglePreference('general.enabled', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Sonido</div>
                  <div className="text-sm text-muted-foreground">Reproducir sonido al recibir notificaciones</div>
                </div>
                <Switch
                  checked={preferences.general.sound}
                  onCheckedChange={(value) => handleTogglePreference('general.sound', value)}
                  disabled={!preferences.general.enabled}
                />
              </div>
            </div>

            <Separator />

            {/* Configuración de GitHub */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Github className="w-4 h-4" />
                <span className="font-medium">GitHub</span>
              </div>
              
              {Object.entries(preferences.github).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</div>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) => handleTogglePreference(`github.${key}`, checked)}
                    disabled={!preferences.general.enabled}
                  />
                </div>
              ))}
            </div>

            <Separator />

            {/* Configuración de LinkedIn */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Linkedin className="w-4 h-4" />
                <span className="font-medium">LinkedIn</span>
              </div>
              
              {Object.entries(preferences.linkedin).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</div>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) => handleTogglePreference(`linkedin.${key}`, checked)}
                    disabled={!preferences.general.enabled}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de notificaciones */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BellOff className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay notificaciones</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start space-x-3 p-3 rounded-lg border ${
                  notification.read 
                    ? 'bg-muted/30 border-muted' 
                    : 'bg-primary/5 border-primary/20'
                }`}
              >
                <div className="flex-shrink-0 mt-1">
                  {notification.type === 'github' ? (
                    <Github className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Linkedin className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    {getEventIcon(notification.event, notification.type)}
                    <span className="text-sm font-medium">
                      {notification.type === 'github' ? 'GitHub' : 'LinkedIn'}
                    </span>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-primary rounded-full" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getEventMessage(notification)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center space-x-1">
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteNotification(notification.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Estadísticas */}
        {notifications.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Total: {stats.total} notificaciones</span>
              <span>No leídas: {stats.unread}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpiar todas
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
