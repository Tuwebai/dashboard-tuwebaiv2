import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Mail, CheckCircle, AlertCircle, Clock, Users } from 'lucide-react';
import { useCalendarIntegration } from '@/hooks/useCalendarIntegration';
import { useEmailIntegration } from '@/hooks/useEmailIntegration';
import { GoogleConfigDebug } from '@/components/debug/GoogleConfigDebug';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const IntegrationsPanel: React.FC = () => {
  const { 
    isAuthenticated: isCalendarAuth, 
    isLoading: isCalendarLoading, 
    events, 
    authenticate: authCalendar,
    listEvents 
  } = useCalendarIntegration();
  
  const { 
    isAuthenticated: isEmailAuth, 
    isLoading: isEmailLoading, 
    authenticate: authEmail 
  } = useEmailIntegration();

  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  useEffect(() => {
    if (isCalendarAuth) {
      loadRecentEvents();
    }
  }, [isCalendarAuth]);

  const loadRecentEvents = async () => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const events = await listEvents(now, nextWeek);
    setRecentEvents(events.slice(0, 5));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
          <Calendar className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Integraciones Profesionales</h2>
          <p className="text-muted-foreground">Calendario y Email integrados con Websy AI</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calendario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Google Calendar
              {isCalendarAuth ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Conectado
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Desconectado
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isCalendarAuth ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Conecta tu cuenta de Google Calendar para programar reuniones automáticamente.
                </p>
                <Button 
                  onClick={authCalendar} 
                  disabled={isCalendarLoading}
                  className="w-full"
                >
                  {isCalendarLoading ? 'Conectando...' : 'Conectar Calendario'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Próximos eventos</span>
                  <Badge variant="outline">{recentEvents.length}</Badge>
                </div>
                
                {recentEvents.length > 0 ? (
                  <div className="space-y-2">
                    {recentEvents.map((event, index) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{event.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3" />
                              {format(event.start, 'PPP p', { locale: es })}
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <Users className="h-3 w-3" />
                                {event.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay eventos próximos
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Gmail
              {isEmailAuth ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Conectado
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Desconectado
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isEmailAuth ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Conecta tu cuenta de Gmail para enviar reportes automáticamente.
                </p>
                <Button 
                  onClick={authEmail} 
                  disabled={isEmailLoading}
                  className="w-full"
                >
                  {isEmailLoading ? 'Conectando...' : 'Conectar Gmail'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Funcionalidades disponibles</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Envío de reportes automáticos</li>
                    <li>• Programación de emails</li>
                    <li>• Templates personalizados</li>
                    <li>• Múltiples destinatarios</li>
                  </ul>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Usa comandos como "envía reporte" en el chat de Websy AI
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Debug de configuración */}
      <Card>
        <CardHeader>
          <CardTitle>Debug de Configuración</CardTitle>
        </CardHeader>
        <CardContent>
          <GoogleConfigDebug />
        </CardContent>
      </Card>

      {/* Comandos disponibles */}
      <Card>
        <CardHeader>
          <CardTitle>Comandos de Voz y Texto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Calendario</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• "Programa una reunión para mañana"</p>
                <p>• "Agenda una cita el viernes"</p>
                <p>• "Crea evento para las 2pm"</p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Email</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• "Envía un reporte"</p>
                <p>• "Manda email a cliente"</p>
                <p>• "Programa envío de reporte"</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
