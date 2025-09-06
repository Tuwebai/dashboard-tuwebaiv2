import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Send, CheckCircle, Clock, FileText } from 'lucide-react';
import { useEmailIntegration } from '@/hooks/useEmailIntegration';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EmailReporterProps {
  reportData?: any;
  onEmailSent?: (recipients: string[]) => void;
  onClose?: () => void;
}

export const EmailReporter: React.FC<EmailReporterProps> = ({
  reportData = {},
  onEmailSent,
  onClose
}) => {
  const { isAuthenticated, isLoading, authenticate, sendReport, sendScheduledReport } = useEmailIntegration();
  const [formData, setFormData] = useState({
    recipients: '',
    subject: `Reporte de Websy AI - ${new Date().toLocaleDateString()}`,
    customMessage: '',
    scheduleType: 'now' as 'now' | 'scheduled',
    scheduledDate: '',
    scheduledTime: ''
  });
  const [isSending, setIsSending] = useState(false);
  const [sentEmails, setSentEmails] = useState<string[]>([]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSendEmail = async () => {
    if (!formData.recipients.trim()) {
      return;
    }

    setIsSending(true);
    try {
      const recipients = formData.recipients.split(',').map(email => email.trim()).filter(Boolean);
      
      let success = false;
      
      if (formData.scheduleType === 'now') {
        success = await sendReport(reportData, recipients);
      } else {
        const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
        success = await sendScheduledReport(reportData, recipients, scheduledDateTime);
      }

      if (success) {
        setSentEmails(recipients);
        onEmailSent?.(recipients);
      }
    } catch (error) {
      console.error('Error enviando email:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleReset = () => {
    setFormData({
      recipients: '',
      subject: `Reporte de Websy AI - ${new Date().toLocaleDateString()}`,
      customMessage: '',
      scheduleType: 'now',
      scheduledDate: '',
      scheduledTime: ''
    });
    setSentEmails([]);
  };

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Conectar Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Conecta tu cuenta de Gmail para enviar reportes automáticamente.
          </p>
          <Button 
            onClick={authenticate} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Conectando...' : 'Conectar con Gmail'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (sentEmails.length > 0) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Email Enviado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm">Reporte enviado exitosamente a:</p>
            <div className="flex flex-wrap gap-1">
              {sentEmails.map((email, index) => (
                <Badge key={index} variant="secondary">
                  {email}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleReset} variant="outline" className="flex-1">
              Enviar Otro
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
          <Mail className="h-5 w-5" />
          Enviar Reporte
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="recipients">Destinatarios *</Label>
          <Input
            id="recipients"
            value={formData.recipients}
            onChange={(e) => handleInputChange('recipients', e.target.value)}
            placeholder="email1@ejemplo.com, email2@ejemplo.com"
          />
          <p className="text-xs text-muted-foreground">
            Separa múltiples emails con comas
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">Asunto</Label>
          <Input
            id="subject"
            value={formData.subject}
            onChange={(e) => handleInputChange('subject', e.target.value)}
            placeholder="Asunto del email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customMessage">Mensaje Personalizado</Label>
          <Textarea
            id="customMessage"
            value={formData.customMessage}
            onChange={(e) => handleInputChange('customMessage', e.target.value)}
            placeholder="Mensaje adicional para incluir en el reporte..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Tipo de Envío</Label>
          <Select value={formData.scheduleType} onValueChange={(value: 'now' | 'scheduled') => handleInputChange('scheduleType', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="now">
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Enviar Ahora
                </div>
              </SelectItem>
              <SelectItem value="scheduled">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Programar Envío
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.scheduleType === 'scheduled' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Fecha</Label>
              <Input
                id="scheduledDate"
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduledTime">Hora</Label>
              <Input
                id="scheduledTime"
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <FileText className="h-4 w-4" />
            Vista Previa del Reporte
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Métricas del sistema</p>
            <p>• Análisis de tickets</p>
            <p>• Estadísticas de usuarios</p>
            <p>• Gráficos y visualizaciones</p>
            {formData.customMessage && (
              <p>• Mensaje personalizado incluido</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleSendEmail} 
            disabled={isSending || !formData.recipients.trim()}
            className="flex-1"
          >
            {isSending ? 'Enviando...' : 'Enviar Reporte'}
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
