// Templates de Email Premium para TuWebAI
export const EMAIL_TEMPLATES = {
  // Template para Admin - Nuevo Ticket de Soporte
  SUPPORT_TICKET_ADMIN: (data: {
    ticket_subject: string;
    ticket_message: string;
    client_email: string;
    ticket_priority: string;
    ticket_date: string;
    priority_color: string;
  }) => `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nuevo Ticket de Soporte - TuWebAI</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 300; }
            .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px; }
            .content { padding: 40px 30px; }
            .ticket-card { background: #f8f9fa; border-radius: 12px; padding: 25px; margin: 20px 0; border-left: 4px solid ${data.priority_color}; }
            .priority-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; background: ${data.priority_color}; color: white; }
            .field { margin-bottom: 20px; }
            .field-label { font-weight: 600; color: #374151; margin-bottom: 5px; font-size: 14px; }
            .field-value { color: #6b7280; line-height: 1.6; }
            .message-box { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-top: 10px; }
            .footer { background: #1f2937; color: white; padding: 30px; text-align: center; }
            .footer p { margin: 5px 0; font-size: 14px; }
            .logo { font-size: 24px; font-weight: bold; color: #667eea; }
            .action-btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: 500; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎫 Nuevo Ticket de Soporte</h1>
                <p>Se ha creado un nuevo ticket que requiere tu atención</p>
            </div>
            
            <div class="content">
                <div class="ticket-card">
                    <div class="field">
                        <div class="field-label">📧 Cliente</div>
                        <div class="field-value">${data.client_email}</div>
                    </div>
                    
                    <div class="field">
                        <div class="field-label">📝 Asunto</div>
                        <div class="field-value">${data.ticket_subject}</div>
                    </div>
                    
                    <div class="field">
                        <div class="field-label">💬 Mensaje</div>
                        <div class="message-box">
                            ${data.ticket_message.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                    
                    <div class="field">
                        <div class="field-label">⚡ Prioridad</div>
                        <div class="field-value">
                            <span class="priority-badge">${data.ticket_priority}</span>
                        </div>
                    </div>
                    
                    <div class="field">
                        <div class="field-label">📅 Fecha de Creación</div>
                        <div class="field-value">${data.ticket_date}</div>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://tuweb-ai.com/admin/support" class="action-btn">Ver en Panel de Admin</a>
                </div>
            </div>
            
            <div class="footer">
                <div class="logo">TuWebAI</div>
                <p>Sistema de Soporte Técnico</p>
                <p>admin@tuweb-ai.com | +5493571416044</p>
                <p style="font-size: 12px; opacity: 0.8;">Este es un email automático del sistema de soporte</p>
            </div>
        </div>
    </body>
    </html>
  `,

  // Template para Cliente - Confirmación de Ticket
  TICKET_CONFIRMATION_CLIENT: (data: {
    ticket_id: string;
    ticket_subject: string;
    ticket_message: string;
    ticket_priority: string;
    ticket_date: string;
    support_email: string;
  }) => `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ticket Recibido - TuWebAI</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 300; }
            .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px; }
            .content { padding: 40px 30px; }
            .success-card { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 25px; margin: 20px 0; }
            .ticket-details { background: #f8f9fa; border-radius: 12px; padding: 25px; margin: 20px 0; }
            .field { margin-bottom: 20px; }
            .field-label { font-weight: 600; color: #374151; margin-bottom: 5px; font-size: 14px; }
            .field-value { color: #6b7280; line-height: 1.6; }
            .ticket-id { background: #1f2937; color: white; padding: 8px 16px; border-radius: 6px; font-family: monospace; font-size: 14px; }
            .priority-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; background: #f59e0b; color: white; }
            .next-steps { background: #dbeafe; border: 1px solid #93c5fd; border-radius: 12px; padding: 25px; margin: 20px 0; }
            .step { display: flex; align-items: center; margin-bottom: 15px; }
            .step-number { background: #3b82f6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 15px; }
            .footer { background: #1f2937; color: white; padding: 30px; text-align: center; }
            .footer p { margin: 5px 0; font-size: 14px; }
            .logo { font-size: 24px; font-weight: bold; color: #10b981; }
            .contact-info { background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Ticket Recibido</h1>
                <p>Hemos recibido tu consulta y la estamos procesando</p>
            </div>
            
            <div class="content">
                <div class="success-card">
                    <h3 style="margin: 0 0 15px 0; color: #065f46;">¡Gracias por contactarnos!</h3>
                    <p style="margin: 0; color: #047857; line-height: 1.6;">
                        Hemos recibido tu ticket de soporte y nuestro equipo lo está revisando. 
                        Te responderemos lo antes posible con una solución personalizada.
                    </p>
                </div>
                
                <div class="ticket-details">
                    <h3 style="margin: 0 0 20px 0; color: #1f2937;">Detalles del Ticket</h3>
                    
                    <div class="field">
                        <div class="field-label">🆔 ID del Ticket</div>
                        <div class="field-value">
                            <span class="ticket-id">${data.ticket_id}</span>
                        </div>
                    </div>
                    
                    <div class="field">
                        <div class="field-label">📝 Asunto</div>
                        <div class="field-value">${data.ticket_subject}</div>
                    </div>
                    
                    <div class="field">
                        <div class="field-label">⚡ Prioridad</div>
                        <div class="field-value">
                            <span class="priority-badge">${data.ticket_priority}</span>
                        </div>
                    </div>
                    
                    <div class="field">
                        <div class="field-label">📅 Fecha de Creación</div>
                        <div class="field-value">${data.ticket_date}</div>
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
                        📧 <strong>Email:</strong> ${data.support_email}<br>
                        📞 <strong>Teléfono:</strong> +5493571416044<br>
                        🕒 <strong>Horarios:</strong> Lunes a Viernes 9:00 - 18:00
                    </p>
                </div>
            </div>
            
            <div class="footer">
                <div class="logo">TuWebAI</div>
                <p>Plataforma de Desarrollo Web Profesional</p>
                <p style="font-size: 12px; opacity: 0.8;">Este es un email automático del sistema de soporte</p>
            </div>
        </div>
    </body>
    </html>
  `,

  // Template para Cliente - Respuesta del Admin
  TICKET_RESPONSE_CLIENT: (data: {
    ticket_id: string;
    ticket_subject: string;
    admin_response: string;
    admin_name: string;
    response_date: string;
    support_email: string;
  }) => `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Respuesta a tu Ticket - TuWebAI</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 300; }
            .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px; }
            .content { padding: 40px 30px; }
            .response-card { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 25px; margin: 20px 0; }
            .ticket-info { background: #f8f9fa; border-radius: 12px; padding: 25px; margin: 20px 0; }
            .field { margin-bottom: 20px; }
            .field-label { font-weight: 600; color: #374151; margin-bottom: 5px; font-size: 14px; }
            .field-value { color: #6b7280; line-height: 1.6; }
            .ticket-id { background: #1f2937; color: white; padding: 8px 16px; border-radius: 6px; font-family: monospace; font-size: 14px; }
            .admin-response { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-top: 15px; }
            .admin-signature { background: #f3f4f6; border-radius: 8px; padding: 15px; margin-top: 15px; }
            .admin-avatar { width: 40px; height: 40px; border-radius: 50%; background: #3b82f6; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-right: 10px; }
            .footer { background: #1f2937; color: white; padding: 30px; text-align: center; }
            .footer p { margin: 5px 0; font-size: 14px; }
            .logo { font-size: 24px; font-weight: bold; color: #3b82f6; }
            .action-btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: 500; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💬 Respuesta a tu Ticket</h1>
                <p>Hemos respondido a tu consulta de soporte</p>
            </div>
            
            <div class="content">
                <div class="response-card">
                    <h3 style="margin: 0 0 15px 0; color: #1e40af;">¡Tu ticket ha sido respondido!</h3>
                    <p style="margin: 0; color: #1e40af; line-height: 1.6;">
                        Nuestro equipo de soporte ha revisado tu consulta y te ha enviado una respuesta detallada.
                    </p>
                </div>
                
                <div class="ticket-info">
                    <h3 style="margin: 0 0 20px 0; color: #1f2937;">Información del Ticket</h3>
                    
                    <div class="field">
                        <div class="field-label">🆔 ID del Ticket</div>
                        <div class="field-value">
                            <span class="ticket-id">${data.ticket_id}</span>
                        </div>
                    </div>
                    
                    <div class="field">
                        <div class="field-label">📝 Asunto</div>
                        <div class="field-value">${data.ticket_subject}</div>
                    </div>
                    
                    <div class="field">
                        <div class="field-label">📅 Fecha de Respuesta</div>
                        <div class="field-value">${data.response_date}</div>
                    </div>
                </div>
                
                <div class="admin-response">
                    <h4 style="margin: 0 0 15px 0; color: #1f2937;">Respuesta del Equipo de Soporte</h4>
                    <div style="line-height: 1.6; color: #374151;">
                        ${data.admin_response.replace(/\n/g, '<br>')}
                    </div>
                    
                    <div class="admin-signature">
                        <div style="display: flex; align-items: center;">
                            <div class="admin-avatar">${data.admin_name.charAt(0).toUpperCase()}</div>
                            <div>
                                <strong style="color: #1f2937;">${data.admin_name}</strong><br>
                                <span style="color: #6b7280; font-size: 14px;">Equipo de Soporte TuWebAI</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://tuweb-ai.com/support" class="action-btn">Ver en Mi Panel</a>
                </div>
                
                <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                    <h4 style="margin: 0 0 15px 0; color: #374151;">¿Necesitas más ayuda?</h4>
                    <p style="margin: 5px 0; color: #6b7280;">
                        📧 <strong>Email:</strong> ${data.support_email}<br>
                        📞 <strong>Teléfono:</strong> +5493571416044
                    </p>
                </div>
            </div>
            
            <div class="footer">
                <div class="logo">TuWebAI</div>
                <p>Plataforma de Desarrollo Web Profesional</p>
                <p style="font-size: 12px; opacity: 0.8;">Este es un email automático del sistema de soporte</p>
            </div>
        </div>
    </body>
    </html>
  `,

  // Template para Admin - Resumen Diario de Tickets
  DAILY_SUMMARY_ADMIN: (data: {
    total_tickets: number;
    new_tickets: number;
    resolved_tickets: number;
    pending_tickets: number;
    date: string;
    tickets_list: Array<{
      id: string;
      subject: string;
      client_email: string;
      priority: string;
      status: string;
    }>;
  }) => `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resumen Diario - TuWebAI</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
            .container { max-width: 700px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 300; }
            .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px; }
            .content { padding: 40px 30px; }
            .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin: 30px 0; }
            .stat-card { background: #f8f9fa; border-radius: 12px; padding: 20px; text-align: center; border-left: 4px solid #8b5cf6; }
            .stat-number { font-size: 32px; font-weight: bold; color: #8b5cf6; margin-bottom: 5px; }
            .stat-label { color: #6b7280; font-size: 14px; font-weight: 500; }
            .tickets-section { margin: 30px 0; }
            .ticket-item { background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 10px; border-left: 3px solid #e5e7eb; }
            .ticket-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
            .ticket-subject { font-weight: 600; color: #1f2937; }
            .ticket-meta { font-size: 12px; color: #6b7280; }
            .priority-badge { padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
            .priority-high { background: #fee2e2; color: #dc2626; }
            .priority-medium { background: #fef3c7; color: #d97706; }
            .priority-low { background: #dcfce7; color: #16a34a; }
            .footer { background: #1f2937; color: white; padding: 30px; text-align: center; }
            .footer p { margin: 5px 0; font-size: 14px; }
            .logo { font-size: 24px; font-weight: bold; color: #8b5cf6; }
            .action-btn { display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: 500; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📊 Resumen Diario de Soporte</h1>
                <p>Resumen de actividad del ${data.date}</p>
            </div>
            
            <div class="content">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">${data.total_tickets}</div>
                        <div class="stat-label">Total Tickets</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${data.new_tickets}</div>
                        <div class="stat-label">Nuevos</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${data.resolved_tickets}</div>
                        <div class="stat-label">Resueltos</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${data.pending_tickets}</div>
                        <div class="stat-label">Pendientes</div>
                    </div>
                </div>
                
                <div class="tickets-section">
                    <h3 style="margin: 0 0 20px 0; color: #1f2937;">Tickets del Día</h3>
                    ${data.tickets_list.map(ticket => `
                        <div class="ticket-item">
                            <div class="ticket-header">
                                <div class="ticket-subject">${ticket.subject}</div>
                                <span class="priority-badge priority-${ticket.priority}">${ticket.priority}</span>
                            </div>
                            <div class="ticket-meta">
                                ID: ${ticket.id} | Cliente: ${ticket.client_email} | Estado: ${ticket.status}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://tuweb-ai.com/admin/support" class="action-btn">Ver Panel Completo</a>
                </div>
            </div>
            
            <div class="footer">
                <div class="logo">TuWebAI</div>
                <p>Sistema de Soporte Técnico</p>
                <p style="font-size: 12px; opacity: 0.8;">Resumen automático generado el ${data.date}</p>
            </div>
        </div>
    </body>
    </html>
  `
}; 

export const userInvitationTemplate = {
  subject: 'Invitación para unirte a TuWebAI',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invitación TuWebAI</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .highlight { background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>¡Has sido invitado!</h1>
          <p>Te invitamos a unirte al equipo de TuWebAI</p>
        </div>
        
        <div class="content">
          <h2>Hola,</h2>
          
          <p>Has recibido una invitación para unirte a <strong>TuWebAI</strong> como <strong>{{role}}</strong>.</p>
          
          <div class="highlight">
            <p><strong>Detalles de la invitación:</strong></p>
            <ul>
              <li><strong>Rol:</strong> {{role}}</li>
              <li><strong>Invitado por:</strong> {{invitedBy}}</li>
              <li><strong>Expira en:</strong> {{expiresIn}}</li>
            </ul>
          </div>
          
          {{#if message}}
          <p><strong>Mensaje personal:</strong></p>
          <blockquote style="border-left: 3px solid #667eea; padding-left: 15px; margin: 20px 0; font-style: italic;">
            "{{message}}"
          </blockquote>
          {{/if}}
          
          <p>Para aceptar esta invitación, haz clic en el botón de abajo:</p>
          
          <div style="text-align: center;">
            <a href="{{invitationUrl}}" class="button">Aceptar Invitación</a>
          </div>
          
          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            <strong>Importante:</strong> Esta invitación expira en {{expiresIn}}. Si no puedes acceder al enlace, copia y pega la siguiente URL en tu navegador:
          </p>
          
          <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px; font-size: 12px;">
            {{invitationUrl}}
          </p>
          
          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          
          <p>Saludos,<br>El equipo de TuWebAI</p>
        </div>
        
        <div class="footer">
          <p>© 2024 TuWebAI. Todos los derechos reservados.</p>
          <p>Este email fue enviado a {{email}}</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
    ¡Has sido invitado a unirte a TuWebAI!
    
    Hola,
    
    Has recibido una invitación para unirte a TuWebAI como {{role}}.
    
    Detalles de la invitación:
    - Rol: {{role}}
    - Invitado por: {{invitedBy}}
    - Expira en: {{expiresIn}}
    
    {{#if message}}
    Mensaje personal: "{{message}}"
    {{/if}}
    
    Para aceptar esta invitación, visita: {{invitationUrl}}
    
    Esta invitación expira en {{expiresIn}}.
    
    Saludos,
    El equipo de TuWebAI
    
    © 2024 TuWebAI. Todos los derechos reservados.
  `
}; 
