// Configuración para EmailJS
export const EMAIL_CONFIG = {
  // ✅ Configuración actualizada con tus datos de EmailJS
  SERVICE_ID: 'service_flqnerp',
  
  // EmailJS Template IDs (solo 2 templates disponibles en plan gratuito)
  TEMPLATES: {
    // Template principal para todos los tipos de emails
    MAIN_TEMPLATE: 'template_support_ticket',
    // Template secundario (si lo necesitas)
    SECONDARY_TEMPLATE: 'template_ticket_confirmation'
  },
  
  // ✅ Configuración actualizada con tus datos de EmailJS
  USER_ID: 'bPdFsDkAPp5dXKALy',
  
  // Emails de destino
  EMAILS: {
    // Email que RECIBE los tickets de soporte (tu email de soporte)
    SUPPORT: 'tuwebai@gmail.com',
    // Email que ENVÍA los emails (tu email configurado en EmailJS)
    FROM_EMAIL: 'tuwebai@gmail.com', // ← Este es el email que ENVÍA
    SYSTEM: 'noreply@tuweb-ai.com'
  }
};

// Tipos de email para diferenciar en el mismo template
export const EMAIL_TYPES = {
  SUPPORT_TICKET: 'support_ticket',
  TICKET_CONFIRMATION: 'ticket_confirmation',
  TICKET_RESPONSE: 'ticket_response',
  DAILY_SUMMARY: 'daily_summary'
};

// Nota: Con el plan gratuito de EmailJS solo puedes tener 2 templates
// Template 1: Para admin (nuevo ticket + resumen diario)
// Template 2: Para cliente (confirmación + respuesta)

// Función para inicializar EmailJS
export const initializeEmailJS = () => {
  // Verificar si EmailJS está disponible
  if (typeof window !== 'undefined' && window.emailjs) {
    window.emailjs.init(EMAIL_CONFIG.USER_ID);
    return true;
  }
  return false;
};

// Función para enviar email usando EmailJS
export const sendEmailWithEmailJS = async (templateId: string, templateParams: any) => {
  try {
    if (typeof window !== 'undefined' && window.emailjs) {
      const response = await window.emailjs.send(
        EMAIL_CONFIG.SERVICE_ID,
        templateId,
        templateParams
      );
      return { success: true, message: 'Email enviado correctamente', response };
    } else {
      throw new Error('EmailJS no está disponible');
    }
  } catch (error) {
    console.error('Error enviando email con EmailJS:', error);
    return { success: false, message: 'Error enviando email', error };
  }
};

// Declaración de tipos para EmailJS
declare global {
  interface Window {
    emailjs: {
      init: (userId: string) => void;
      send: (serviceId: string, templateId: string, templateParams: any) => Promise<any>;
    };
  }
} 
