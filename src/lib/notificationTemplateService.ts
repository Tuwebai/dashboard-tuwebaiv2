import { supabase } from './supabase';

// =====================================================
// INTERFACES Y TIPOS
// =====================================================

export interface NotificationTemplate {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  category: string;
  channels: string[];
  subject?: string;
  content: string;
  htmlContent?: string;
  variables: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  description: string;
  required: boolean;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
}

export interface RenderedTemplate {
  subject?: string;
  content: string;
  htmlContent?: string;
  variables: Record<string, any>;
  metadata: {
    templateId: string;
    templateName: string;
    renderedAt: string;
    channel: string;
  };
}

export interface TemplateCategory {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  color?: string;
  templates: NotificationTemplate[];
}

// =====================================================
// SERVICIO DE PLANTILLAS DE NOTIFICACIÓN
// =====================================================

export class NotificationTemplateService {
  private defaultTemplates: NotificationTemplate[] = [
    {
      id: 'welcome-user',
      name: 'welcome-user',
      displayName: 'Bienvenida de Usuario',
      description: 'Plantilla para dar la bienvenida a nuevos usuarios',
      category: 'user',
      channels: ['email', 'in_app'],
      subject: '¡Bienvenido a TuWebAI, {{user.fullName}}!',
      content: 'Hola {{user.fullName}}, nos alegra que te hayas unido a TuWebAI. Tu cuenta ha sido creada exitosamente y ya puedes comenzar a usar todas nuestras funcionalidades.',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">¡Bienvenido a TuWebAI!</h1>
          <p>Hola <strong>{{user.fullName}}</strong>,</p>
          <p>Nos alegra que te hayas unido a TuWebAI. Tu cuenta ha sido creada exitosamente y ya puedes comenzar a usar todas nuestras funcionalidades.</p>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Próximos pasos:</h3>
            <ul>
              <li>Completa tu perfil</li>
              <li>Explora el dashboard</li>
              <li>Crea tu primer proyecto</li>
            </ul>
          </div>
          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          <p>Saludos,<br>El equipo de TuWebAI</p>
        </div>
      `,
      variables: {
        user: {
          fullName: { type: 'string', required: true, description: 'Nombre completo del usuario' },
          email: { type: 'string', required: true, description: 'Email del usuario' }
        }
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'project-update',
      name: 'project-update',
      displayName: 'Actualización de Proyecto',
      description: 'Plantilla para notificar actualizaciones de proyectos',
      category: 'project',
      channels: ['email', 'push', 'in_app'],
      subject: 'Proyecto {{project.name}} - {{update.type}}',
      content: 'El proyecto "{{project.name}}" ha sido {{update.action}}. {{update.description}}',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Actualización de Proyecto</h2>
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #059669;">
            <h3>{{project.name}}</h3>
            <p><strong>Acción:</strong> {{update.action}}</p>
            <p><strong>Descripción:</strong> {{update.description}}</p>
            <p><strong>Fecha:</strong> {{update.date}}</p>
          </div>
          <p>Para más detalles, visita tu dashboard.</p>
        </div>
      `,
      variables: {
        project: {
          name: { type: 'string', required: true, description: 'Nombre del proyecto' },
          id: { type: 'string', required: true, description: 'ID del proyecto' }
        },
        update: {
          type: { type: 'string', required: true, description: 'Tipo de actualización' },
          action: { type: 'string', required: true, description: 'Acción realizada' },
          description: { type: 'string', required: true, description: 'Descripción de la actualización' },
          date: { type: 'date', required: true, description: 'Fecha de la actualización' }
        }
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'ticket-assigned',
      name: 'ticket-assigned',
      displayName: 'Ticket Asignado',
      description: 'Plantilla para notificar asignación de tickets',
      category: 'ticket',
      channels: ['email', 'push', 'in_app'],
      subject: 'Ticket #{{ticket.id}} asignado: {{ticket.title}}',
      content: 'Se te ha asignado el ticket "{{ticket.title}}" con prioridad {{ticket.priority}}. {{ticket.description}}',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Ticket Asignado</h2>
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626;">
            <h3>#{{ticket.id}} - {{ticket.title}}</h3>
            <p><strong>Prioridad:</strong> <span style="color: {{ticket.priorityColor}};">{{ticket.priority}}</span></p>
            <p><strong>Descripción:</strong> {{ticket.description}}</p>
            <p><strong>Asignado por:</strong> {{ticket.assignedBy}}</p>
            <p><strong>Fecha límite:</strong> {{ticket.dueDate}}</p>
          </div>
          <p>Accede al ticket para comenzar a trabajar en él.</p>
        </div>
      `,
      variables: {
        ticket: {
          id: { type: 'string', required: true, description: 'ID del ticket' },
          title: { type: 'string', required: true, description: 'Título del ticket' },
          priority: { type: 'string', required: true, description: 'Prioridad del ticket' },
          priorityColor: { type: 'string', required: false, description: 'Color de la prioridad' },
          description: { type: 'string', required: true, description: 'Descripción del ticket' },
          assignedBy: { type: 'string', required: true, description: 'Usuario que asignó el ticket' },
          dueDate: { type: 'date', required: false, description: 'Fecha límite del ticket' }
        }
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'payment-success',
      name: 'payment-success',
      displayName: 'Pago Exitoso',
      description: 'Plantilla para confirmar pagos exitosos',
      category: 'payment',
      channels: ['email', 'push', 'in_app'],
      subject: 'Pago confirmado - ${{payment.amount}}',
      content: 'Tu pago de ${{payment.amount}} ha sido procesado exitosamente. Recibo: #{{payment.receiptId}}',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Pago Confirmado</h2>
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #059669;">
            <h3>Transacción Exitosa</h3>
            <p><strong>Monto:</strong> ${{payment.amount}}</p>
            <p><strong>Recibo:</strong> #{{payment.receiptId}}</p>
            <p><strong>Método:</strong> {{payment.method}}</p>
            <p><strong>Fecha:</strong> {{payment.date}}</p>
          </div>
          <p>Gracias por tu pago. Tu cuenta ha sido actualizada.</p>
        </div>
      `,
      variables: {
        payment: {
          amount: { type: 'number', required: true, description: 'Monto del pago' },
          receiptId: { type: 'string', required: true, description: 'ID del recibo' },
          method: { type: 'string', required: true, description: 'Método de pago' },
          date: { type: 'date', required: true, description: 'Fecha del pago' }
        }
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'security-alert',
      name: 'security-alert',
      displayName: 'Alerta de Seguridad',
      description: 'Plantilla para alertas de seguridad',
      category: 'security',
      channels: ['email', 'push', 'sms'],
      subject: '🚨 Alerta de Seguridad - {{alert.type}}',
      content: 'Se ha detectado una actividad de seguridad: {{alert.description}}. IP: {{alert.ipAddress}}, Fecha: {{alert.date}}',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">🚨 Alerta de Seguridad</h2>
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626;">
            <h3>{{alert.type}}</h3>
            <p><strong>Descripción:</strong> {{alert.description}}</p>
            <p><strong>IP:</strong> {{alert.ipAddress}}</p>
            <p><strong>Fecha:</strong> {{alert.date}}</p>
            <p><strong>Ubicación:</strong> {{alert.location}}</p>
          </div>
          <p>Si no reconoces esta actividad, cambia tu contraseña inmediatamente.</p>
        </div>
      `,
      variables: {
        alert: {
          type: { type: 'string', required: true, description: 'Tipo de alerta' },
          description: { type: 'string', required: true, description: 'Descripción de la alerta' },
          ipAddress: { type: 'string', required: true, description: 'Dirección IP' },
          date: { type: 'date', required: true, description: 'Fecha de la alerta' },
          location: { type: 'string', required: false, description: 'Ubicación geográfica' }
        }
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  constructor() {
    this.initializeDefaultTemplates();
  }

  // =====================================================
  // INICIALIZACIÓN DE PLANTILLAS POR DEFECTO
  // =====================================================

  private async initializeDefaultTemplates(): Promise<void> {
    try {
      // Verificar si ya existen plantillas
      const { data: existingTemplates, error } = await supabase
        .from('notification_templates')
        .select('id')
        .limit(1);

      if (error) {
        console.error('Error checking existing templates:', error);
        return;
      }

      // Si no hay plantillas, crear las por defecto
      if (!existingTemplates || existingTemplates.length === 0) {
        await this.createDefaultTemplates();
      }
    } catch (error) {
      console.error('Error initializing default templates:', error);
    }
  }

  private async createDefaultTemplates(): Promise<void> {
    try {
      for (const template of this.defaultTemplates) {
        await this.createTemplate(template);
      }

    } catch (error) {
      console.error('Error creating default templates:', error);
    }
  }

  // =====================================================
  // CRUD DE PLANTILLAS
  // =====================================================

  async createTemplate(template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationTemplate> {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .insert([{
          name: template.name,
          display_name: template.displayName,
          description: template.description,
          category: template.category,
          channels: template.channels,
          subject: template.subject,
          content: template.content,
          html_content: template.htmlContent,
          variables: template.variables,
          is_active: template.isActive
        }])
        .select()
        .single();

      if (error) throw error;

      return this.mapDatabaseTemplate(data);
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  async getTemplateById(id: string): Promise<NotificationTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.mapDatabaseTemplate(data);
    } catch (error) {
      console.error('Error getting template by ID:', error);
      throw error;
    }
  }

  async getTemplateByName(name: string): Promise<NotificationTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('name', name)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.mapDatabaseTemplate(data);
    } catch (error) {
      console.error('Error getting template by name:', error);
      throw error;
    }
  }

  async getTemplatesByCategory(category: string): Promise<NotificationTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('display_name');

      if (error) throw error;

      return (data || []).map(template => this.mapDatabaseTemplate(template));
    } catch (error) {
      console.error('Error getting templates by category:', error);
      throw error;
    }
  }

  async getAllTemplates(): Promise<NotificationTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .order('category')
        .order('display_name');

      if (error) throw error;

      return (data || []).map(template => this.mapDatabaseTemplate(template));
    } catch (error) {
      console.error('Error getting all templates:', error);
      throw error;
    }
  }

  async updateTemplate(id: string, updates: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    try {
      const updateData: any = {};
      
      if (updates.displayName !== undefined) updateData.display_name = updates.displayName;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.channels !== undefined) updateData.channels = updates.channels;
      if (updates.subject !== undefined) updateData.subject = updates.subject;
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.htmlContent !== undefined) updateData.html_content = updates.htmlContent;
      if (updates.variables !== undefined) updateData.variables = updates.variables;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('notification_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return this.mapDatabaseTemplate(data);
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notification_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  // =====================================================
  // RENDERIZADO DE PLANTILLAS
  // =====================================================

  async renderTemplate(
    templateName: string,
    variables: Record<string, any>,
    channel: string = 'in_app'
  ): Promise<RenderedTemplate> {
    const template = await this.getTemplateByName(templateName);
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    if (!template.channels.includes(channel)) {
      throw new Error(`Template '${templateName}' does not support channel '${channel}'`);
    }

    return this.renderTemplateContent(template, variables, channel);
  }

  private renderTemplateContent(
    template: NotificationTemplate,
    variables: Record<string, any>,
    channel: string
  ): RenderedTemplate {
    // Validar variables requeridas
    this.validateTemplateVariables(template, variables);

    // Renderizar contenido
    const renderedContent = this.interpolateVariables(template.content, variables);
    const renderedHtmlContent = template.htmlContent 
      ? this.interpolateVariables(template.htmlContent, variables)
      : undefined;
    const renderedSubject = template.subject 
      ? this.interpolateVariables(template.subject, variables)
      : undefined;

    return {
      subject: renderedSubject,
      content: renderedContent,
      htmlContent: renderedHtmlContent,
      variables,
      metadata: {
        templateId: template.id,
        templateName: template.name,
        renderedAt: new Date().toISOString(),
        channel
      }
    };
  }

  private validateTemplateVariables(template: NotificationTemplate, variables: Record<string, any>): void {
    const missingVariables: string[] = [];
    
    for (const [varPath, varConfig] of Object.entries(template.variables)) {
      if (varConfig.required) {
        const value = this.getNestedValue(variables, varPath);
        if (value === undefined || value === null || value === '') {
          missingVariables.push(varPath);
        }
      }
    }

    if (missingVariables.length > 0) {
      throw new Error(`Missing required variables: ${missingVariables.join(', ')}`);
    }
  }

  private interpolateVariables(content: string, variables: Record<string, any>): string {
    return content.replace(/\{\{([^}]+)\}\}/g, (match, varPath) => {
      const value = this.getNestedValue(variables, varPath.trim());
      return value !== undefined && value !== null ? String(value) : match;
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  // =====================================================
  // UTILIDADES
  // =====================================================

  private mapDatabaseTemplate(data: any): NotificationTemplate {
    return {
      id: data.id,
      name: data.name,
      displayName: data.display_name,
      description: data.description,
      category: data.category,
      channels: data.channels || [],
      subject: data.subject,
      content: data.content,
      htmlContent: data.html_content,
      variables: data.variables || {},
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  async getTemplateCategories(): Promise<TemplateCategory[]> {
    try {
      const templates = await this.getAllTemplates();
      const categories = new Map<string, TemplateCategory>();

      for (const template of templates) {
        if (!categories.has(template.category)) {
          categories.set(template.category, {
            id: template.category,
            name: template.category,
            displayName: this.formatCategoryName(template.category),
            description: this.getCategoryDescription(template.category),
            icon: this.getCategoryIcon(template.category),
            color: this.getCategoryColor(template.category),
            templates: []
          });
        }

        categories.get(template.category)!.templates.push(template);
      }

      return Array.from(categories.values());
    } catch (error) {
      console.error('Error getting template categories:', error);
      return [];
    }
  }

  private formatCategoryName(category: string): string {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private getCategoryDescription(category: string): string {
    const descriptions: Record<string, string> = {
      user: 'Notificaciones relacionadas con la cuenta del usuario',
      project: 'Notificaciones sobre proyectos y actualizaciones',
      ticket: 'Notificaciones de tickets de soporte',
      payment: 'Notificaciones de pagos y facturación',
      security: 'Alertas de seguridad y autenticación',
      system: 'Notificaciones del sistema'
    };
    return descriptions[category] || 'Notificaciones generales';
  }

  private getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      user: '👤',
      project: '📁',
      ticket: '🎫',
      payment: '💳',
      security: '🔒',
      system: '⚙️'
    };
    return icons[category] || '📢';
  }

  private getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      user: '#3b82f6',
      project: '#10b981',
      ticket: '#f59e0b',
      payment: '#8b5cf6',
      security: '#ef4444',
      system: '#6b7280'
    };
    return colors[category] || '#6b7280';
  }
}

// Instancia global del servicio
export const notificationTemplateService = new NotificationTemplateService();
export default notificationTemplateService;
