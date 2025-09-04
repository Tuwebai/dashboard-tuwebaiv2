import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useApp } from '@/contexts/AppContext';
import { pushNotificationService, NotificationChannel, UserNotificationSettings } from '@/lib/pushNotificationService';
import { toast } from '@/hooks/use-toast';
import { Bell, BellOff, Clock, Volume2, VolumeX, Smartphone, Mail, MessageSquare } from 'lucide-react';

interface NotificationSettingsProps {
  className?: string;
}

export default function NotificationSettings({ className = '' }: NotificationSettingsProps) {
  const { user } = useApp();
  const [settings, setSettings] = useState<UserNotificationSettings | null>(null);
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (user) {
      loadSettings();
      loadChannels();
      checkPermissionStatus();
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      const userSettings = await pushNotificationService.getUserNotificationSettings(user.id);
      setSettings(userSettings || getDefaultSettings());
    } catch (error) {
      console.error('Error loading notification settings:', error);
      setSettings(getDefaultSettings());
    } finally {
      setLoading(false);
    }
  };

  const loadChannels = async () => {
    try {
      const notificationChannels = await pushNotificationService.getNotificationChannels();
      setChannels(notificationChannels);
    } catch (error) {
      console.error('Error loading notification channels:', error);
    }
  };

  const checkPermissionStatus = () => {
    setPermissionStatus(Notification.permission);
  };

  const getDefaultSettings = (): UserNotificationSettings => ({
    userId: user?.id || '',
    channels: {},
    globalEnabled: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    frequency: 'immediate'
  });

  const handlePermissionRequest = async () => {
    try {
      const permission = await pushNotificationService.requestPermission();
      setPermissionStatus(permission);
      
      if (permission === 'granted') {
        toast({
          title: "Permisos otorgados",
          description: "Las notificaciones push están ahora habilitadas."
        });
        
        // Suscribirse a push notifications
        if (user) {
          await pushNotificationService.subscribeToPush(user.id);
        }
      } else {
        toast({
          title: "Permisos denegados",
          description: "No se pueden enviar notificaciones push sin permisos.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast({
        title: "Error",
        description: "No se pudieron solicitar los permisos de notificación.",
        variant: "destructive"
      });
    }
  };

  const handleSettingChange = async (key: string, value: any) => {
    if (!settings || !user) return;

    const newSettings = {
      ...settings,
      [key]: value
    };

    setSettings(newSettings);
    setSaving(true);

    try {
      await pushNotificationService.updateUserNotificationSettings(user.id, newSettings);
      toast({
        title: "Configuración actualizada",
        description: "Los cambios se han guardado correctamente."
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChannelToggle = async (channelId: string, enabled: boolean) => {
    if (!settings || !user) return;

    const newChannels = {
      ...settings.channels,
      [channelId]: enabled
    };

    await handleSettingChange('channels', newChannels);
  };

  const handleQuietHoursChange = async (key: string, value: any) => {
    if (!settings || !user) return;

    const newQuietHours = {
      ...settings.quietHours,
      [key]: value
    };

    await handleSettingChange('quietHours', newQuietHours);
  };

  const testNotification = async () => {
    if (!pushNotificationService.isNotificationEnabled()) {
      toast({
        title: "Notificaciones no habilitadas",
        description: "Primero debes otorgar permisos para las notificaciones.",
        variant: "destructive"
      });
      return;
    }

    try {
      await pushNotificationService.sendLocalNotification({
        title: "TuWebAI - Notificación de prueba",
        body: "¡Las notificaciones están funcionando correctamente!",
        icon: "/favicon.ico",
        data: { url: "/" }
      });

      toast({
        title: "Notificación enviada",
        description: "Se ha enviado una notificación de prueba."
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar la notificación de prueba.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Estado de permisos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Estado de Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Permisos del navegador</p>
              <p className="text-sm text-muted-foreground">
                {permissionStatus === 'granted' 
                  ? 'Las notificaciones están habilitadas'
                  : permissionStatus === 'denied'
                  ? 'Las notificaciones están bloqueadas'
                  : 'Los permisos no han sido solicitados'
                }
              </p>
            </div>
            <Badge variant={permissionStatus === 'granted' ? 'default' : 'secondary'}>
              {permissionStatus === 'granted' ? 'Habilitado' : 'Deshabilitado'}
            </Badge>
          </div>

          {permissionStatus !== 'granted' && (
            <Button onClick={handlePermissionRequest} className="w-full">
              <Bell className="h-4 w-4 mr-2" />
              Habilitar Notificaciones
            </Button>
          )}

          {permissionStatus === 'granted' && (
            <Button onClick={testNotification} variant="outline" className="w-full">
              <Bell className="h-4 w-4 mr-2" />
              Enviar Notificación de Prueba
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Configuración global */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración Global
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="global-enabled">Notificaciones globales</Label>
              <p className="text-sm text-muted-foreground">
                Habilitar o deshabilitar todas las notificaciones
              </p>
            </div>
            <Switch
              id="global-enabled"
              checked={settings.globalEnabled}
              onCheckedChange={(checked) => handleSettingChange('globalEnabled', checked)}
              disabled={saving}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="frequency">Frecuencia de notificaciones</Label>
            <Select
              value={settings.frequency}
              onValueChange={(value) => handleSettingChange('frequency', value)}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Inmediata</SelectItem>
                <SelectItem value="digest">Resumen diario</SelectItem>
                <SelectItem value="disabled">Deshabilitada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Horas silenciosas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horas Silenciosas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="quiet-hours-enabled">Habilitar horas silenciosas</Label>
              <p className="text-sm text-muted-foreground">
                No recibir notificaciones durante las horas especificadas
              </p>
            </div>
            <Switch
              id="quiet-hours-enabled"
              checked={settings.quietHours.enabled}
              onCheckedChange={(checked) => handleQuietHoursChange('enabled', checked)}
              disabled={saving}
            />
          </div>

          {settings.quietHours.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quiet-start">Hora de inicio</Label>
                <Input
                  id="quiet-start"
                  type="time"
                  value={settings.quietHours.start}
                  onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiet-end">Hora de fin</Label>
                <Input
                  id="quiet-end"
                  type="time"
                  value={settings.quietHours.end}
                  onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Canales de notificación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Canales de Notificación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {channels.map((channel) => (
            <div key={channel.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {channel.types.includes('push') && <Smartphone className="h-4 w-4" />}
                  {channel.types.includes('email') && <Mail className="h-4 w-4" />}
                  {channel.types.includes('sms') && <MessageSquare className="h-4 w-4" />}
                </div>
                <div>
                  <p className="font-medium">{channel.name}</p>
                  <p className="text-sm text-muted-foreground">{channel.description}</p>
                </div>
              </div>
              <Switch
                checked={settings.channels[channel.id] || false}
                onCheckedChange={(checked) => handleChannelToggle(channel.id, checked)}
                disabled={saving}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
