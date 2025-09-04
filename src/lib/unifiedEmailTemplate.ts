// Template unificado para EmailJS que funciona para todos los tipos de emails
export const UNIFIED_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, {{header_gradient_start}} 0%, {{header_gradient_end}} 100%); padding: 40px 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 300; }
        .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px; }
        .content { padding: 40px 30px; }
        .card { background: #f8f9fa; border-radius: 12px; padding: 25px; margin: 20px 0; border-left: 4px solid {{accent_color}}; }
        .field { margin-bottom: 20px; }
        .field-label { font-weight: 600; color: #374151; margin-bottom: 5px; font-size: 14px; }
        .field-value { color: #6b7280; line-height: 1.6; }
        .priority-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; background: {{priority_color}}; color: white; }
        .ticket-id { background: #1f2937; color: white; padding: 8px 16px; border-radius: 6px; font-family: monospace; font-size: 14px; }
        .message-box { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-top: 10px; }
        .admin-signature { background: #f3f4f6; border-radius: 8px; padding: 15px; margin-top: 15px; }
        .admin-avatar { width: 40px; height: 40px; border-radius: 50%; background: {{accent_color}}; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-right: 10px; }
        .footer { background: #1f2937; color: white; padding: 30px; text-align: center; }
        .footer p { margin: 5px 0; font-size: 14px; }
        .logo { font-size: 24px; font-weight: bold; color: {{accent_color}}; }
        .action-btn { display: inline-block; background: {{accent_color}}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: 500; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin: 30px 0; }
        .stat-card { background: #f8f9fa; border-radius: 12px; padding: 20px; text-align: center; border-left: 4px solid {{accent_color}}; }
        .stat-number { font-size: 32px; font-weight: bold; color: {{accent_color}}; margin-bottom: 5px; }
        .stat-label { color: #6b7280; font-size: 14px; font-weight: 500; }
        .next-steps { background: #dbeafe; border: 1px solid #93c5fd; border-radius: 12px; padding: 25px; margin: 20px 0; }
        .step { display: flex; align-items: center; margin-bottom: 15px; }
        .step-number { background: {{accent_color}}; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 15px; }
        .contact-info { background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{header_title}}</h1>
            <p>{{header_subtitle}}</p>
        </div>
        
        <div class="content">
            {{email_content}}
        </div>
        
        <div class="footer">
            <div class="logo">TuWebAI</div>
            <p>{{footer_text}}</p>
            <p style="font-size: 12px; opacity: 0.8;">{{footer_note}}</p>
        </div>
    </div>
</body>
</html>
`;

// Variables para diferentes tipos de emails
export const EMAIL_VARIABLES = {
  // Email para admin - Nuevo ticket
  support_ticket: {
    header_gradient_start: '#667eea',
    header_gradient_end: '#764ba2',
    accent_color: '#667eea',
    header_title: '🎫 Nuevo Ticket de Soporte',
    header_subtitle: 'Se ha creado un nuevo ticket que requiere tu atención',
    email_content: `
      <div class="card">
        <div class="field">
          <div class="field-label">📧 Cliente</div>
          <div class="field-value">{{client_email}}</div>
        </div>
        
        <div class="field">
          <div class="field-label">📝 Asunto</div>
          <div class="field-value">{{ticket_subject}}</div>
        </div>
        
        <div class="field">
          <div class="field-label">💬 Mensaje</div>
          <div class="message-box">{{ticket_message}}</div>
        </div>
        
        <div class="field">
          <div class="field-label">⚡ Prioridad</div>
          <div class="field-value">
            <span class="priority-badge">{{ticket_priority}}</span>
          </div>
        </div>
        
        <div class="field">
          <div class="field-label">📅 Fecha de Creación</div>
          <div class="field-value">{{ticket_date}}</div>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="https://tuweb-ai.com/admin/support" class="action-btn">Ver en Panel de Admin</a>
      </div>
    `,
    footer_text: 'Sistema de Soporte Técnico',
    footer_note: 'Este es un email automático del sistema de soporte'
  },

  // Email para cliente - Confirmación
  ticket_confirmation: {
    header_gradient_start: '#10b981',
    header_gradient_end: '#059669',
    accent_color: '#10b981',
    header_title: '✅ Ticket Recibido',
    header_subtitle: 'Hemos recibido tu consulta y la estamos procesando',
    email_content: `
      <div class="card" style="background: #ecfdf5; border-color: #a7f3d0;">
        <h3 style="margin: 0 0 15px 0; color: #065f46;">¡Gracias por contactarnos!</h3>
        <p style="margin: 0; color: #047857; line-height: 1.6;">
          Hemos recibido tu ticket de soporte y nuestro equipo lo está revisando. 
          Te responderemos lo antes posible con una solución personalizada.
        </p>
      </div>
      
      <div class="card">
        <h3 style="margin: 0 0 20px 0; color: #1f2937;">Detalles del Ticket</h3>
        
        <div class="field">
          <div class="field-label">🆔 ID del Ticket</div>
          <div class="field-value">
            <span class="ticket-id">{{ticket_id}}</span>
          </div>
        </div>
        
        <div class="field">
          <div class="field-label">📝 Asunto</div>
          <div class="field-value">{{ticket_subject}}</div>
        </div>
        
        <div class="field">
          <div class="field-label">⚡ Prioridad</div>
          <div class="field-value">
            <span class="priority-badge">{{ticket_priority}}</span>
          </div>
        </div>
        
        <div class="field">
          <div class="field-label">📅 Fecha de Creación</div>
          <div class="field-value">{{ticket_date}}</div>
        </div>
      </div>
      
      <div class="next-steps">
        <h3 style="margin: 0 0 20px 0; color: #1e40af;">¿Qué sigue?</h3>
        
        <div class="step">
          <div class="step-number">1</div>
          <div>
            <strong>Revisión del Equipo</strong><br>
            <span style="color: #6b7280; font-size: 14px;">Nuestro equipo técnico revisará tu consulta</span>
          </div>
        </div>
        
        <div class="step">
          <div class="step-number">2</div>
          <div>
            <strong>Respuesta Personalizada</strong><br>
            <span style="color: #6b7280; font-size: 14px;">Te enviaremos una respuesta detallada por email</span>
          </div>
        </div>
        
        <div class="step">
          <div class="step-number">3</div>
          <div>
            <strong>Seguimiento</strong><br>
            <span style="color: #6b7280; font-size: 14px;">Puedes hacer seguimiento desde tu panel de cliente</span>
          </div>
        </div>
      </div>
      
      <div class="contact-info">
        <h4 style="margin: 0 0 15px 0; color: #374151;">¿Necesitas ayuda urgente?</h4>
        <p style="margin: 5px 0; color: #6b7280;">
          📧 <strong>Email:</strong> {{support_email}}<br>
          📞 <strong>Teléfono:</strong> +5493571416044<br>
          🕒 <strong>Horarios:</strong> Lunes a Viernes 9:00 - 18:00
        </p>
      </div>
    `,
    footer_text: 'Plataforma de Desarrollo Web Profesional',
    footer_note: 'Este es un email automático del sistema de soporte'
  },

  // Email para cliente - Respuesta del admin
  ticket_response: {
    header_gradient_start: '#3b82f6',
    header_gradient_end: '#1d4ed8',
    accent_color: '#3b82f6',
    header_title: '💬 Respuesta a tu Ticket',
    header_subtitle: 'Hemos respondido a tu consulta de soporte',
    email_content: `
      <div class="card" style="background: #eff6ff; border-color: #bfdbfe;">
        <h3 style="margin: 0 0 15px 0; color: #1e40af;">¡Tu ticket ha sido respondido!</h3>
        <p style="margin: 0; color: #1e40af; line-height: 1.6;">
          Nuestro equipo de soporte ha revisado tu consulta y te ha enviado una respuesta detallada.
        </p>
      </div>
      
      <div class="card">
        <h3 style="margin: 0 0 20px 0; color: #1f2937;">Información del Ticket</h3>
        
        <div class="field">
          <div class="field-label">🆔 ID del Ticket</div>
          <div class="field-value">
            <span class="ticket-id">{{ticket_id}}</span>
          </div>
        </div>
        
        <div class="field">
          <div class="field-label">📝 Asunto</div>
          <div class="field-value">{{ticket_subject}}</div>
        </div>
        
        <div class="field">
          <div class="field-label">📅 Fecha de Respuesta</div>
          <div class="field-value">{{response_date}}</div>
        </div>
      </div>
      
      <div class="message-box">
        <h4 style="margin: 0 0 15px 0; color: #1f2937;">Respuesta del Equipo de Soporte</h4>
        <div style="line-height: 1.6; color: #374151;">{{admin_response}}</div>
        
        <div class="admin-signature">
          <div style="display: flex; align-items: center;">
            <div class="admin-avatar">{{admin_name_initial}}</div>
            <div>
              <strong style="color: #1f2937;">{{admin_name}}</strong><br>
              <span style="color: #6b7280; font-size: 14px;">Equipo de Soporte TuWebAI</span>
            </div>
          </div>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="https://tuweb-ai.com/support" class="action-btn">Ver en Mi Panel</a>
      </div>
      
      <div class="contact-info">
        <h4 style="margin: 0 0 15px 0; color: #374151;">¿Necesitas más ayuda?</h4>
        <p style="margin: 5px 0; color: #6b7280;">
          📧 <strong>Email:</strong> {{support_email}}<br>
          📞 <strong>Teléfono:</strong> +5493571416044
        </p>
      </div>
    `,
    footer_text: 'Plataforma de Desarrollo Web Profesional',
    footer_note: 'Este es un email automático del sistema de soporte'
  }
}; 
