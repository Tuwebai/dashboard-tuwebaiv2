-- =====================================================
-- SISTEMA DE NOTIFICACIONES AVANZADO - TABLAS DE BASE DE DATOS
-- =====================================================

-- Tabla para plantillas de notificación
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  display_name character varying NOT NULL,
  description text,
  category character varying NOT NULL,
  channels text[] NOT NULL,
  subject text,
  content text NOT NULL,
  html_content text,
  variables jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notification_templates_pkey PRIMARY KEY (id)
);

-- Tabla para reglas de notificación
CREATE TABLE IF NOT EXISTS public.notification_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  description text,
  trigger_event character varying NOT NULL,
  conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notification_rules_pkey PRIMARY KEY (id)
);

-- Tabla para suscripciones a canales
CREATE TABLE IF NOT EXISTS public.user_channel_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES public.notification_channels(id) ON DELETE CASCADE,
  is_enabled boolean DEFAULT true,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_channel_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT user_channel_subscriptions_user_channel_unique UNIQUE (user_id, channel_id)
);

-- Tabla para notificaciones programadas
CREATE TABLE IF NOT EXISTS public.scheduled_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.notification_templates(id) ON DELETE SET NULL,
  rule_id uuid REFERENCES public.notification_rules(id) ON DELETE SET NULL,
  channels text[] NOT NULL,
  subject text,
  content text NOT NULL,
  html_content text,
  variables jsonb DEFAULT '{}'::jsonb,
  scheduled_for timestamp with time zone NOT NULL,
  status character varying DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  last_attempt_at timestamp with time zone,
  error_message text,
  sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT scheduled_notifications_pkey PRIMARY KEY (id)
);

-- Tabla para logs de entrega de notificaciones
CREATE TABLE IF NOT EXISTS public.notification_delivery_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  channel character varying NOT NULL,
  status character varying NOT NULL CHECK (status IN ('sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked')),
  provider_response jsonb,
  error_message text,
  delivered_at timestamp with time zone,
  opened_at timestamp with time zone,
  clicked_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notification_delivery_logs_pkey PRIMARY KEY (id)
);

-- Tabla para analytics de notificaciones
CREATE TABLE IF NOT EXISTS public.notification_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date date NOT NULL,
  channel character varying NOT NULL,
  category character varying NOT NULL,
  sent_count integer DEFAULT 0,
  delivered_count integer DEFAULT 0,
  opened_count integer DEFAULT 0,
  clicked_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  bounce_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notification_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT notification_analytics_date_channel_category_unique UNIQUE (date, channel, category)
);

-- =====================================================
-- ÍNDICES PARA RENDIMIENTO
-- =====================================================

-- Índices para notification_templates
CREATE INDEX IF NOT EXISTS idx_notification_templates_category ON public.notification_templates(category);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON public.notification_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_notification_templates_channels ON public.notification_templates USING GIN(channels);

-- Índices para notification_rules
CREATE INDEX IF NOT EXISTS idx_notification_rules_trigger_event ON public.notification_rules(trigger_event);
CREATE INDEX IF NOT EXISTS idx_notification_rules_active ON public.notification_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_notification_rules_priority ON public.notification_rules(priority);

-- Índices para user_channel_subscriptions
CREATE INDEX IF NOT EXISTS idx_user_channel_subscriptions_user_id ON public.user_channel_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_channel_subscriptions_channel_id ON public.user_channel_subscriptions(channel_id);
CREATE INDEX IF NOT EXISTS idx_user_channel_subscriptions_enabled ON public.user_channel_subscriptions(is_enabled);

-- Índices para scheduled_notifications
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user_id ON public.scheduled_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for ON public.scheduled_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status ON public.scheduled_notifications(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_template_id ON public.scheduled_notifications(template_id);

-- Índices para notification_delivery_logs
CREATE INDEX IF NOT EXISTS idx_notification_delivery_logs_notification_id ON public.notification_delivery_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_logs_channel ON public.notification_delivery_logs(channel);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_logs_status ON public.notification_delivery_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_logs_created_at ON public.notification_delivery_logs(created_at);

-- Índices para notification_analytics
CREATE INDEX IF NOT EXISTS idx_notification_analytics_date ON public.notification_analytics(date);
CREATE INDEX IF NOT EXISTS idx_notification_analytics_channel ON public.notification_analytics(channel);
CREATE INDEX IF NOT EXISTS idx_notification_analytics_category ON public.notification_analytics(category);

-- =====================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_channel_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_analytics ENABLE ROW LEVEL SECURITY;

-- Políticas para notification_templates (lectura para todos, escritura solo para admins)
CREATE POLICY "notification_templates_read_all" ON public.notification_templates
  FOR SELECT USING (true);

CREATE POLICY "notification_templates_write_admin" ON public.notification_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Políticas para notification_rules (lectura para todos, escritura solo para admins)
CREATE POLICY "notification_rules_read_all" ON public.notification_rules
  FOR SELECT USING (true);

CREATE POLICY "notification_rules_write_admin" ON public.notification_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Políticas para user_channel_subscriptions (cada usuario solo puede ver/editar sus propias suscripciones)
CREATE POLICY "user_channel_subscriptions_own" ON public.user_channel_subscriptions
  FOR ALL USING (user_id = auth.uid());

-- Políticas para scheduled_notifications (cada usuario solo puede ver sus propias notificaciones programadas)
CREATE POLICY "scheduled_notifications_own" ON public.scheduled_notifications
  FOR ALL USING (user_id = auth.uid());

-- Políticas para notification_delivery_logs (cada usuario solo puede ver logs de sus notificaciones)
CREATE POLICY "notification_delivery_logs_own" ON public.notification_delivery_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE notifications.id = notification_delivery_logs.notification_id 
      AND notifications.user_id = auth.uid()
    )
  );

-- Políticas para notification_analytics (lectura para todos, escritura solo para sistema)
CREATE POLICY "notification_analytics_read_all" ON public.notification_analytics
  FOR SELECT USING (true);

CREATE POLICY "notification_analytics_write_system" ON public.notification_analytics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar plantillas de notificación por defecto
INSERT INTO public.notification_templates (name, display_name, description, category, channels, subject, content, html_content, variables) VALUES
('welcome-user', 'Bienvenida de Usuario', 'Plantilla para dar la bienvenida a nuevos usuarios', 'user', ARRAY['email', 'push', 'in_app'], '¡Bienvenido a TuWebAI!', 'Hola {{user.name}}, bienvenido a TuWebAI. Tu cuenta ha sido creada exitosamente.', '<h1>¡Bienvenido a TuWebAI!</h1><p>Hola {{user.name}}, bienvenido a TuWebAI. Tu cuenta ha sido creada exitosamente.</p>', '{"user": {"name": "string", "email": "string"}}'),
('project-created', 'Proyecto Creado', 'Notificación cuando se crea un nuevo proyecto', 'project', ARRAY['email', 'push', 'in_app'], 'Nuevo proyecto: {{project.name}}', 'Se ha creado el proyecto "{{project.name}}" exitosamente.', '<h2>Nuevo proyecto creado</h2><p>Se ha creado el proyecto "<strong>{{project.name}}</strong>" exitosamente.</p>', '{"project": {"name": "string", "id": "string"}}'),
('ticket-assigned', 'Ticket Asignado', 'Notificación cuando se asigna un ticket', 'ticket', ARRAY['email', 'push', 'in_app'], 'Ticket asignado: {{ticket.title}}', 'Se te ha asignado el ticket "{{ticket.title}}" con prioridad {{ticket.priority}}.', '<h3>Ticket asignado</h3><p>Se te ha asignado el ticket "<strong>{{ticket.title}}</strong>" con prioridad <span class="priority-{{ticket.priority}}">{{ticket.priority}}</span>.</p>', '{"ticket": {"title": "string", "priority": "string", "id": "string"}}'),
('payment-received', 'Pago Recibido', 'Notificación de pago recibido', 'payment', ARRAY['email', 'push', 'in_app'], 'Pago recibido: ${{payment.amount}}', 'Hemos recibido tu pago de ${{payment.amount}} por el proyecto {{project.name}}.', '<h2>Pago recibido</h2><p>Hemos recibido tu pago de <strong>${{payment.amount}}</strong> por el proyecto <strong>{{project.name}}</strong>.</p>', '{"payment": {"amount": "number", "id": "string"}, "project": {"name": "string"}}'),
('system-alert', 'Alerta del Sistema', 'Alertas importantes del sistema', 'system', ARRAY['email', 'push', 'in_app'], 'Alerta del Sistema: {{alert.title}}', '{{alert.title}}: {{alert.message}}', '<div class="alert alert-{{alert.severity}}"><h3>{{alert.title}}</h3><p>{{alert.message}}</p></div>', '{"alert": {"title": "string", "message": "string", "severity": "string"}}')
ON CONFLICT (name) DO NOTHING;

-- Insertar reglas de notificación por defecto
INSERT INTO public.notification_rules (name, description, trigger_event, conditions, actions, priority) VALUES
('welcome-new-user', 'Enviar bienvenida a usuarios nuevos', 'user.created', '[{"field": "user.role", "operator": "equals", "value": "client"}]', '[{"type": "send_notification", "template": "welcome-user", "channels": ["email", "push", "in_app"], "recipients": "user"}]', 100),
('notify-project-creation', 'Notificar creación de proyecto', 'project.created', '[{"field": "project.status", "operator": "equals", "value": "active"}]', '[{"type": "send_notification", "template": "project-created", "channels": ["email", "push", "in_app"], "recipients": "user"}]', 90),
('escalate-urgent-tickets', 'Escalar tickets urgentes', 'ticket.created', '[{"field": "ticket.priority", "operator": "equals", "value": "urgent"}]', '[{"type": "send_notification", "template": "ticket-assigned", "channels": ["email", "push", "in_app"], "recipients": "admin", "delay": 0}]', 200),
('notify-payment-received', 'Notificar pago recibido', 'payment.completed', '[{"field": "payment.status", "operator": "equals", "value": "completed"}]', '[{"type": "send_notification", "template": "payment-received", "channels": ["email", "push", "in_app"], "recipients": "user"}]', 80)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- FUNCIONES DE BASE DE DATOS
-- =====================================================

-- Función para limpiar notificaciones antiguas
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  -- Eliminar notificaciones leídas más antiguas que 30 días
  DELETE FROM public.notifications 
  WHERE is_read = true 
  AND created_at < NOW() - INTERVAL '30 days';
  
  -- Eliminar notificaciones urgentes más antiguas que 90 días
  DELETE FROM public.notifications 
  WHERE priority = 'urgent' 
  AND created_at < NOW() - INTERVAL '90 days';
  
  -- Eliminar logs de entrega más antiguos que 60 días
  DELETE FROM public.notification_delivery_logs 
  WHERE created_at < NOW() - INTERVAL '60 days';
END;
$$ LANGUAGE plpgsql;

-- Función para procesar notificaciones programadas
CREATE OR REPLACE FUNCTION public.process_scheduled_notifications()
RETURNS void AS $$
BEGIN
  -- Actualizar notificaciones programadas que están listas para enviar
  UPDATE public.scheduled_notifications 
  SET status = 'ready'
  WHERE status = 'pending' 
  AND scheduled_for <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar analytics de notificaciones
CREATE OR REPLACE FUNCTION public.update_notification_analytics(
  p_date date,
  p_channel text,
  p_category text,
  p_sent_count integer DEFAULT 0,
  p_delivered_count integer DEFAULT 0,
  p_opened_count integer DEFAULT 0,
  p_clicked_count integer DEFAULT 0,
  p_failed_count integer DEFAULT 0,
  p_bounce_count integer DEFAULT 0
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.notification_analytics (
    date, channel, category, sent_count, delivered_count, 
    opened_count, clicked_count, failed_count, bounce_count
  ) VALUES (
    p_date, p_channel, p_category, p_sent_count, p_delivered_count,
    p_opened_count, p_clicked_count, p_failed_count, p_bounce_count
  )
  ON CONFLICT (date, channel, category) 
  DO UPDATE SET
    sent_count = notification_analytics.sent_count + p_sent_count,
    delivered_count = notification_analytics.delivered_count + p_delivered_count,
    opened_count = notification_analytics.opened_count + p_opened_count,
    clicked_count = notification_analytics.clicked_count + p_clicked_count,
    failed_count = notification_analytics.failed_count + p_failed_count,
    bounce_count = notification_analytics.bounce_count + p_bounce_count,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- =====================================================

-- Trigger para actualizar updated_at en notification_templates
CREATE OR REPLACE FUNCTION public.update_notification_templates_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notification_templates_updated_at
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notification_templates_updated_at();

-- Trigger para actualizar updated_at en notification_rules
CREATE OR REPLACE FUNCTION public.update_notification_rules_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notification_rules_updated_at
  BEFORE UPDATE ON public.notification_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notification_rules_updated_at();

-- Trigger para actualizar updated_at en user_channel_subscriptions
CREATE OR REPLACE FUNCTION public.update_user_channel_subscriptions_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_channel_subscriptions_updated_at
  BEFORE UPDATE ON public.user_channel_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_channel_subscriptions_updated_at();

-- Trigger para actualizar updated_at en scheduled_notifications
CREATE OR REPLACE FUNCTION public.update_scheduled_notifications_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_scheduled_notifications_updated_at
  BEFORE UPDATE ON public.scheduled_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_scheduled_notifications_updated_at();

-- Trigger para actualizar updated_at en notification_analytics
CREATE OR REPLACE FUNCTION public.update_notification_analytics_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notification_analytics_updated_at
  BEFORE UPDATE ON public.notification_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notification_analytics_updated_at();

-- =====================================================
-- COMENTARIOS EN TABLAS
-- =====================================================

COMMENT ON TABLE public.notification_templates IS 'Plantillas de notificación con variables dinámicas';
COMMENT ON TABLE public.notification_rules IS 'Reglas de automatización para notificaciones';
COMMENT ON TABLE public.user_channel_subscriptions IS 'Suscripciones de usuarios a canales de notificación';
COMMENT ON TABLE public.scheduled_notifications IS 'Notificaciones programadas para envío futuro';
COMMENT ON TABLE public.notification_delivery_logs IS 'Logs de entrega y tracking de notificaciones';
COMMENT ON TABLE public.notification_analytics IS 'Analytics y métricas de notificaciones por día/canal/categoría';
