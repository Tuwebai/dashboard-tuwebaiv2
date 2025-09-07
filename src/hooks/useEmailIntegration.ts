import { useState, useCallback, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { validateGoogleConfig, generateAuthUrl, GOOGLE_CONFIG } from '@/lib/googleConfig';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables?: string[];
}

interface EmailReport {
  to: string | string[];
  subject: string;
  body: string;
  attachments?: {
    filename: string;
    content: string;
    type: string;
  }[];
}

interface EmailIntegration {
  isAuthenticated: boolean;
  isLoading: boolean;
  templates: EmailTemplate[];
  authenticate: () => Promise<void>;
  sendEmail: (report: EmailReport) => Promise<boolean>;
  sendReport: (reportData: any, recipients: string[]) => Promise<boolean>;
  createTemplate: (template: Omit<EmailTemplate, 'id'>) => Promise<EmailTemplate | null>;
  getTemplates: () => Promise<EmailTemplate[]>;
  sendScheduledReport: (reportData: any, recipients: string[], schedule: Date) => Promise<boolean>;
  setIsAuthenticated?: (value: boolean) => void;
}

export const useEmailIntegration = (): EmailIntegration => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);

  // Listener para capturar el token de Google OAuth
  useEffect(() => {
    const handleAuthCallback = () => {
      const hash = window.location.hash;
      if (hash.includes('access_token=')) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        if (accessToken) {
          localStorage.setItem('gmail_token', accessToken);
          setIsAuthenticated(true);
          toast({
            title: "Email conectado",
            description: "Se ha conectado exitosamente con Gmail."
          });
          // Limpiar la URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    };

    // Verificar si ya hay un token al cargar
    const existingToken = localStorage.getItem('gmail_token');
    if (existingToken) {
      setIsAuthenticated(true);
    }

    // Escuchar cambios en el hash
    window.addEventListener('hashchange', handleAuthCallback);
    handleAuthCallback(); // Verificar inmediatamente

    return () => {
      window.removeEventListener('hashchange', handleAuthCallback);
    };
  }, []);

  // Autenticación con Gmail
  const authenticate = useCallback(async () => {
    setIsLoading(true);
    try {
      // Verificar si ya está autenticado
      const token = localStorage.getItem('gmail_token');
      if (token) {
        setIsAuthenticated(true);
        return;
      }

      // Verificar configuración
      if (!validateGoogleConfig()) {
        throw new Error('Google Client ID no configurado. Verifica tu archivo .env');
      }

      // Crear popup de autenticación con URL correcta
      const authUrl = generateAuthUrl(GOOGLE_CONFIG.scopes.gmail);
      
      const popup = window.open(authUrl, 'gmail-auth', 'width=500,height=600,scrollbars=yes,resizable=yes');
      
      if (!popup) {
        throw new Error('No se pudo abrir la ventana de autenticación. Verifica que los popups estén permitidos.');
      }

    } catch (error) {
      toast({
        title: "Error de autenticación",
        description: "No se pudo conectar con Gmail.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Enviar email
  const sendEmail = useCallback(async (report: EmailReport): Promise<boolean> => {
    if (!isAuthenticated) {
      await authenticate();
      if (!isAuthenticated) return false;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('gmail_token');
      if (!token || token.startsWith('admin_token_')) {
        // Si es un token simulado, simular envío exitoso
        toast({
          title: "Email simulado",
          description: `Reporte simulado enviado a ${Array.isArray(report.to) ? report.to.join(', ') : report.to}`
        });
        return true;
      }

      const recipients = Array.isArray(report.to) ? report.to.join(', ') : report.to;
      
      const emailBody = `
        To: ${recipients}
        Subject: ${report.subject}
        Content-Type: text/html; charset=utf-8

        ${report.body}
      `;

      const encodedEmail = btoa(emailBody).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          raw: encodedEmail
        })
      });

      if (!response.ok) {
        throw new Error(`Error enviando email: ${response.statusText}`);
      }

      toast({
        title: "Email enviado",
        description: `Reporte enviado a ${recipients}`
      });

      return true;
    } catch (error) {
      toast({
        title: "Error enviando email",
        description: "No se pudo enviar el email.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, authenticate]);

  // Enviar reporte
  const sendReport = useCallback(async (reportData: any, recipients: string[]): Promise<boolean> => {
    const report = {
      to: recipients,
      subject: `Reporte de Websy AI - ${new Date().toLocaleDateString()}`,
      body: generateReportHTML(reportData)
    };

    return await sendEmail(report);
  }, [sendEmail]);

  // Crear template
  const createTemplate = useCallback(async (template: Omit<EmailTemplate, 'id'>): Promise<EmailTemplate | null> => {
    const newTemplate: EmailTemplate = {
      ...template,
      id: Date.now().toString()
    };

    setTemplates(prev => [...prev, newTemplate]);
    
    toast({
      title: "Template creado",
      description: `Template "${template.name}" creado exitosamente.`
    });

    return newTemplate;
  }, []);

  // Obtener templates
  const getTemplates = useCallback(async (): Promise<EmailTemplate[]> => {
    // En una implementación real, esto vendría de una API
    return templates;
  }, [templates]);

  // Enviar reporte programado
  const sendScheduledReport = useCallback(async (reportData: any, recipients: string[], schedule: Date): Promise<boolean> => {
    const now = new Date();
    const delay = schedule.getTime() - now.getTime();

    if (delay <= 0) {
      return await sendReport(reportData, recipients);
    }

    // Programar envío
    setTimeout(async () => {
      await sendReport(reportData, recipients);
    }, delay);

    toast({
      title: "Reporte programado",
      description: `Reporte programado para ${schedule.toLocaleString()}`
    });

    return true;
  }, [sendReport]);

  return {
    isAuthenticated,
    isLoading,
    templates,
    authenticate,
    sendEmail,
    sendReport,
    createTemplate,
    getTemplates,
    sendScheduledReport,
    setIsAuthenticated
  };
};

// Función helper para generar HTML del reporte
function generateReportHTML(reportData: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reporte de Websy AI</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }
        .content { margin: 20px 0; }
        .metric { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #667eea; }
        .footer { margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 5px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🤖 Reporte de Websy AI</h1>
        <p>Generado el ${new Date().toLocaleString()}</p>
      </div>
      
      <div class="content">
        <h2>📊 Métricas del Sistema</h2>
        ${Object.entries(reportData).map(([key, value]) => `
          <div class="metric">
            <strong>${key}:</strong> ${value}
          </div>
        `).join('')}
      </div>
      
      <div class="footer">
        <p>Este reporte fue generado automáticamente por Websy AI</p>
        <p>Para más información, visita tu panel de administración</p>
      </div>
    </body>
    </html>
  `;
}
