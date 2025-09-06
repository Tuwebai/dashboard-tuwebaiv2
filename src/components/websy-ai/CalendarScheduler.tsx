import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, CheckCircle } from 'lucide-react';
import { useCalendarIntegration } from '@/hooks/useCalendarIntegration';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CalendarSchedulerProps {
  onEventCreated?: (event: any) => void;
  onClose?: () => void;
}

export const CalendarScheduler: React.FC<CalendarSchedulerProps> = ({
  onEventCreated,
  onClose
}) => {
  const { isAuthenticated, isLoading, authenticate, createEvent } = useCalendarIntegration();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    attendees: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createdEvent, setCreatedEvent] = useState<any>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateEvent = async () => {
    if (!formData.title || !formData.date || !formData.startTime || !formData.endTime) {
      return;
    }

    setIsCreating(true);
    try {
      const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

      const event = await createEvent({
        title: formData.title,
        description: formData.description,
        start: startDateTime,
        end: endDateTime,
        location: formData.location,
        attendees: formData.attendees ? formData.attendees.split(',').map(email => email.trim()) : []
      });

      if (event) {
        setCreatedEvent(event);
        onEventCreated?.(event);
      }
    } catch (error) {
      console.error('Error creando evento:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleReset = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      startTime: '',
      endTime: '',
      location: '',
      attendees: ''
    });
    setCreatedEvent(null);
  };

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Conectar Calendario
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Conecta tu cuenta de Google Calendar para programar reuniones automáticamente.
          </p>
          <Button 
            onClick={authenticate} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Conectando...' : 'Conectar con Google Calendar'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (createdEvent) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Evento Creado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">{createdEvent.title}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {format(createdEvent.start, 'PPP p', { locale: es })} - {format(createdEvent.end, 'p', { locale: es })}
            </div>
            {createdEvent.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {createdEvent.location}
              </div>
            )}
            {createdEvent.attendees && createdEvent.attendees.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {createdEvent.attendees.join(', ')}
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleReset} variant="outline" className="flex-1">
              Crear Otro
            </Button>
            {onClose && (
              <Button onClick={onClose} className="flex-1">
                Cerrar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Programar Reunión
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Ej: Reunión de seguimiento"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Detalles de la reunión..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Fecha *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startTime">Hora inicio *</Label>
            <Input
              id="startTime"
              type="time"
              value={formData.startTime}
              onChange={(e) => handleInputChange('startTime', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="endTime">Hora fin *</Label>
            <Input
              id="endTime"
              type="time"
              value={formData.endTime}
              onChange={(e) => handleInputChange('endTime', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Ubicación</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Oficina, Zoom, etc."
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="attendees">Participantes</Label>
          <Input
            id="attendees"
            value={formData.attendees}
            onChange={(e) => handleInputChange('attendees', e.target.value)}
            placeholder="email1@ejemplo.com, email2@ejemplo.com"
          />
          <p className="text-xs text-muted-foreground">
            Separa múltiples emails con comas
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleCreateEvent} 
            disabled={isCreating || !formData.title || !formData.date || !formData.startTime || !formData.endTime}
            className="flex-1"
          >
            {isCreating ? 'Creando...' : 'Crear Evento'}
          </Button>
          {onClose && (
            <Button onClick={onClose} variant="outline">
              Cancelar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
