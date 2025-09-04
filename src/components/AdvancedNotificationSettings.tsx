import React, { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { 
  Bell, 
  BellOff, 
  Mail, 
  Smartphone, 
  MessageSquare, 
  Globe, 
  Clock, 
  Settings,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  Zap,
  Shield,
  Users,
  BarChart3
} from 'lucide-react';
import { notificationChannelService } from '@/lib/notificationChannelService';
import { scheduledNotificationService } from '@/lib/scheduledNotificationService';
import { notificationAnalyticsService } from '@/lib/notificationAnalyticsService';

// =====================================================
// INTERFACES
// =====================================================

interface NotificationPreferences {
  userId: string;
  channels: {
    email: {
      enabled: boolean;
      settings: {
        frequency: 'immediate' | 'daily' | 'weekly';
        quietHours: {
          enabled: boolean;
          start: string;
          end: string;
          days: number[];
        };
        categories: {
          system: boolean;
          project: boolean;
          ticket: boolean;
          payment: boolean;
          security: boolean;
          user: boolean;
        };
      };
    };
    push: {
      enabled: boolean;
      settings: {
        frequency: 'immediate' | 'batched';
        quietHours: {
          enabled: boolean;
          start: string;
          end: string;
          days: number[];
        };
        categories: {
          system: boolean;
          project: boolean;
          ticket: boolean;
          payment: boolean;
          security: boolean;
          user: boolean;
        };
      };
    };
    sms: {
      enabled: boolean;
      settings: {
        frequency: 'immediate' | 'daily';
        quietHours: {
          enabled: boolean;
          start: string;
          end: string;
          days: number[];
        };
        categories: {
          system: boolean;
          project: boolean;
          ticket: boolean;
          payment: boolean;
          security: boolean;
          user: boolean;
        };
      };
    };
    inApp: {
      enabled: boolean;
      settings: {
        showBanner: boolean;
        showBadge: boolean;
        autoHide: boolean;
        autoHideDelay: number;
        categories: {
          system: boolean;
          project: boolean;
          ticket: boolean;
          payment: boolean;
          security: boolean;
          user: boolean;
        };
      };
    };
  };
  globalSettings: {
    timezone: string;
    language: string;
    maxNotificationsPerDay: number;
    smartScheduling: boolean;
    digestMode: boolean;
    digestFrequency: 'daily' | 'weekly';
  };
}

interface ChannelStatus {
  channel: string;
  connected: boolean;
  lastTest?: string;
  error?: string;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function AdvancedNotificationSettings() {
  const { user } = useApp();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [channelStatuses, setChannelStatuses] = useState<ChannelStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  // =====================================================
  // EFECTOS
  // =====================================================

  useEffect(() => {
    if (user) {
      loadUserPreferences();
      checkChannelStatuses();
    }
  }, [user]);

  // =====================================================
  // MÉTODOS PRINCIPALES
  // =====================================================

  const loadUserPreferences = async () => {
    try {
      setLoading(true);
      
      // Cargar preferencias del usuario
      const { data, error } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setPreferences(data.preferences);
      } else {
        // Crear preferencias por defecto
        const defaultPreferences = createDefaultPreferences(user!.id);
        setPreferences(defaultPreferences);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las preferencias de notificación",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkChannelStatuses = async () => {
    try {
      const channels = ['email', 'push', 'sms', 'in_app'];
      const statuses: ChannelStatus[] = [];

      for (const channel of channels) {
        try {
          const isConnected = await notificationChannelService.testChannel(channel);
          statuses.push({
            channel,
            connected: isConnected,
            lastTest: new Date().toISOString()
          });
        } catch (error) {
          statuses.push({
            channel,
            connected: false,
            lastTest: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      setChannelStatuses(statuses);
    } catch (error) {
      console.error('Error checking channel statuses:', error);
    }
  };

  const savePreferences = async () => {
    if (!preferences || !user) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('user_notification_settings')
        .upsert({
          user_id: user.id,
          preferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Preferencias de notificación guardadas correctamente",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar las preferencias",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const testChannel = async (channel: string) => {
    try {
      setTesting(channel);

      const testResult = await notificationChannelService.testChannel(channel);
      
      if (testResult) {
        toast({
          title: "Canal funcionando",
          description: `El canal ${channel} está funcionando correctamente`,
        });
      } else {
        toast({
          title: "Canal con problemas",
          description: `El canal ${channel} no está funcionando correctamente`,
          variant: "destructive"
        });
      }

      // Actualizar estado del canal
      setChannelStatuses(prev => 
        prev.map(status => 
          status.channel === channel 
            ? { ...status, connected: testResult, lastTest: new Date().toISOString() }
            : status
        )
      );
    } catch (error) {
      console.error(`Error testing channel ${channel}:`, error);
      toast({
        title: "Error en prueba",
        description: `Error al probar el canal ${channel}`,
        variant: "destructive"
      });
    } finally {
      setTesting(null);
    }
  };

  // =====================================================
  // MÉTODOS DE UTILIDAD
  // =====================================================

  const createDefaultPreferences = (userId: string): NotificationPreferences => ({
    userId,
    channels: {
      email: {
        enabled: true,
        settings: {
          frequency: 'immediate',
          quietHours: {
            enabled: true,
            start: '22:00',
            end: '08:00',
            days: [0, 1, 2, 3, 4, 5, 6] // Todos los días
          },
          categories: {
            system: true,
            project: true,
            ticket: true,
            payment: true,
            security: true,
            user: true
          }
        }
      },
      push: {
        enabled: true,
        settings: {
          frequency: 'immediate',
          quietHours: {
            enabled: true,
            start: '22:00',
            end: '08:00',
            days: [0, 1, 2, 3, 4, 5, 6]
          },
          categories: {
            system: true,
            project: true,
            ticket: true,
            payment: true,
            security: true,
            user: true
          }
        }
      },
      sms: {
        enabled: false,
        settings: {
          frequency: 'immediate',
          quietHours: {
            enabled: true,
            start: '22:00',
            end: '08:00',
            days: [0, 1, 2, 3, 4, 5, 6]
          },
          categories: {
            system: false,
            project: false,
            ticket: false,
            payment: true,
            security: true,
            user: false
          }
        }
      },
      inApp: {
        enabled: true,
        settings: {
          showBanner: true,
          showBadge: true,
          autoHide: true,
          autoHideDelay: 5000,
          categories: {
            system: true,
            project: true,
            ticket: true,
            payment: true,
            security: true,
            user: true
          }
        }
      }
    },
    globalSettings: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: 'es',
      maxNotificationsPerDay: 50,
      smartScheduling: true,
      digestMode: false,
      digestFrequency: 'daily'
    }
  });

  const updateChannelPreference = (channel: keyof NotificationPreferences['channels'], updates: Partial<NotificationPreferences['channels'][keyof NotificationPreferences['channels']]>) => {
    if (!preferences) return;

    setPreferences(prev => ({
      ...prev!,
      channels: {
        ...prev!.channels,
        [channel]: {
          ...prev!.channels[channel],
          ...updates
        }
      }
    }));
  };

  const updateGlobalSettings = (updates: Partial<NotificationPreferences['globalSettings']>) => {
    if (!preferences) return;

    setPreferences(prev => ({
      ...prev!,
      globalSettings: {
        ...prev!.globalSettings,
        ...updates
      }
    }));
  };

  // =====================================================
  // RENDERIZADO
  // =====================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Cargando preferencias...</span>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="flex items-center justify-center p-8">
        <AlertCircle className="h-6 w-6 text-red-500" />
        <span className="ml-2">Error al cargar las preferencias</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuración de Notificaciones</h1>
          <p className="text-muted-foreground mt-2">
            Personaliza cómo y cuándo recibir notificaciones
          </p>
        </div>
        <Button onClick={savePreferences} disabled={saving}>
          {saving ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Guardar Cambios
        </Button>
      </div>

      {/* Estado de Canales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Estado de Canales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {channelStatuses.map((status) => (
              <div key={status.channel} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {getChannelIcon(status.channel)}
                  <span className="capitalize">{status.channel}</span>
                </div>
                <div className="flex items-center gap-2">
                  {status.connected ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testChannel(status.channel)}
                    disabled={testing === status.channel}
                  >
                    {testing === status.channel ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      'Probar'
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuración Principal */}
      <Tabs defaultValue="channels" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="channels">Canales</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="schedule">Horarios</TabsTrigger>
          <TabsTrigger value="advanced">Avanzado</TabsTrigger>
        </TabsList>

        {/* Tab de Canales */}
        <TabsContent value="channels" className="space-y-6">
          {Object.entries(preferences.channels).map(([channelKey, channelConfig]) => (
            <Card key={channelKey}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getChannelIcon(channelKey)}
                    <span className="capitalize">{channelKey}</span>
                  </div>
                  <Switch
                    checked={channelConfig.enabled}
                    onCheckedChange={(enabled) => 
                      updateChannelPreference(channelKey as keyof NotificationPreferences['channels'], { enabled })
                    }
                  />
                </CardTitle>
              </CardHeader>
              {channelConfig.enabled && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Frecuencia</Label>
                      <Select
                        value={channelConfig.settings.frequency}
                        onValueChange={(frequency) => 
                          updateChannelPreference(channelKey as keyof NotificationPreferences['channels'], {
                            settings: { ...channelConfig.settings, frequency: frequency as any }
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Inmediato</SelectItem>
                          <SelectItem value="daily">Diario</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="batched">Agrupado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {channelKey === 'inApp' && (
                      <div>
                        <Label>Ocultar automáticamente (ms)</Label>
                        <Input
                          type="number"
                          value={channelConfig.settings.autoHideDelay}
                          onChange={(e) => 
                            updateChannelPreference(channelKey as keyof NotificationPreferences['channels'], {
                              settings: { ...channelConfig.settings, autoHideDelay: parseInt(e.target.value) }
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </TabsContent>

        {/* Tab de Categorías */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias por Categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(preferences.channels.email.settings.categories).map(([category, enabled]) => (
                  <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(category)}
                      <span className="capitalize">{category}</span>
                    </div>
                    <div className="flex gap-4">
                      {Object.entries(preferences.channels).map(([channelKey, channelConfig]) => (
                        <div key={channelKey} className="flex items-center gap-1">
                          {getChannelIcon(channelKey, 'h-4 w-4')}
                          <Switch
                            checked={channelConfig.settings.categories[category as keyof typeof channelConfig.settings.categories]}
                            onCheckedChange={(checked) => 
                              updateChannelPreference(channelKey as keyof NotificationPreferences['channels'], {
                                settings: {
                                  ...channelConfig.settings,
                                  categories: {
                                    ...channelConfig.settings.categories,
                                    [category]: checked
                                  }
                                }
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Horarios */}
        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horarios Silenciosos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(preferences.channels).map(([channelKey, channelConfig]) => (
                <div key={channelKey} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getChannelIcon(channelKey)}
                      <span className="capitalize">{channelKey}</span>
                    </div>
                    <Switch
                      checked={channelConfig.settings.quietHours.enabled}
                      onCheckedChange={(enabled) => 
                        updateChannelPreference(channelKey as keyof NotificationPreferences['channels'], {
                          settings: {
                            ...channelConfig.settings,
                            quietHours: { ...channelConfig.settings.quietHours, enabled }
                          }
                        })
                      }
                    />
                  </div>
                  
                  {channelConfig.settings.quietHours.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Desde</Label>
                        <Input
                          type="time"
                          value={channelConfig.settings.quietHours.start}
                          onChange={(e) => 
                            updateChannelPreference(channelKey as keyof NotificationPreferences['channels'], {
                              settings: {
                                ...channelConfig.settings,
                                quietHours: { ...channelConfig.settings.quietHours, start: e.target.value }
                              }
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Hasta</Label>
                        <Input
                          type="time"
                          value={channelConfig.settings.quietHours.end}
                          onChange={(e) => 
                            updateChannelPreference(channelKey as keyof NotificationPreferences['channels'], {
                              settings: {
                                ...channelConfig.settings,
                                quietHours: { ...channelConfig.settings.quietHours, end: e.target.value }
                              }
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Avanzado */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración Avanzada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Zona Horaria</Label>
                  <Select
                    value={preferences.globalSettings.timezone}
                    onValueChange={(timezone) => updateGlobalSettings({ timezone })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Argentina/Buenos_Aires">Buenos Aires</SelectItem>
                      <SelectItem value="America/New_York">Nueva York</SelectItem>
                      <SelectItem value="Europe/London">Londres</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Idioma</Label>
                  <Select
                    value={preferences.globalSettings.language}
                    onValueChange={(language) => updateGlobalSettings({ language })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Máximo de notificaciones por día</Label>
                  <Input
                    type="number"
                    value={preferences.globalSettings.maxNotificationsPerDay}
                    onChange={(e) => updateGlobalSettings({ maxNotificationsPerDay: parseInt(e.target.value) })}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={preferences.globalSettings.smartScheduling}
                    onCheckedChange={(smartScheduling) => updateGlobalSettings({ smartScheduling })}
                  />
                  <Label>Programación inteligente</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={preferences.globalSettings.digestMode}
                    onCheckedChange={(digestMode) => updateGlobalSettings({ digestMode })}
                  />
                  <Label>Modo resumen</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// =====================================================
// FUNCIONES DE UTILIDAD
// =====================================================

const getChannelIcon = (channel: string, className = "h-5 w-5") => {
  switch (channel) {
    case 'email':
      return <Mail className={className} />;
    case 'push':
      return <Smartphone className={className} />;
    case 'sms':
      return <MessageSquare className={className} />;
    case 'inApp':
      return <Globe className={className} />;
    default:
      return <Bell className={className} />;
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'system':
      return <Settings className="h-4 w-4" />;
    case 'project':
      return <Users className="h-4 w-4" />;
    case 'ticket':
      return <MessageSquare className="h-4 w-4" />;
    case 'payment':
      return <Zap className="h-4 w-4" />;
    case 'security':
      return <Shield className="h-4 w-4" />;
    case 'user':
      return <Users className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

