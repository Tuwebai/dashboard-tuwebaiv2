-- =====================================================
-- SISTEMA DE APROBACIÓN DE PROYECTOS
-- =====================================================

-- Agregar columna de estado de aprobación a la tabla projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS approval_status character varying DEFAULT 'pending'::character varying 
CHECK (approval_status = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying]));

-- Actualizar proyectos existentes para que tengan estado 'approved' por defecto
UPDATE public.projects 
SET approval_status = 'approved' 
WHERE approval_status IS NULL;

-- Agregar columna para el admin que aprobó/rechazó
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.users(id);

-- Agregar columna para la fecha de aprobación
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;

-- Agregar columna para comentarios de aprobación/rechazo
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS approval_notes text;

-- Agregar columna para fecha límite de aprobación (opcional)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS approval_deadline timestamp with time zone;

-- =====================================================
-- TABLA DE SOLICITUDES DE APROBACIÓN
-- =====================================================

-- Crear tabla para rastrear solicitudes de aprobación
CREATE TABLE IF NOT EXISTS public.project_approval_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES public.users(id),
  status character varying DEFAULT 'pending'::character varying 
    CHECK (status = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'cancelled'::character varying])),
  request_notes text,
  admin_response text,
  reviewed_by uuid REFERENCES public.users(id),
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_approval_requests_pkey PRIMARY KEY (id)
);

-- =====================================================
-- POLÍTICAS RLS PARA APROBACIÓN
-- =====================================================

-- Habilitar RLS en la tabla de solicitudes
ALTER TABLE public.project_approval_requests ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios vean sus propias solicitudes
CREATE POLICY "Users can view their own approval requests" ON public.project_approval_requests
  FOR SELECT USING (auth.uid() = requested_by);

-- Política para que los admins vean todas las solicitudes
CREATE POLICY "Admins can view all approval requests" ON public.project_approval_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política para que los usuarios creen solicitudes
CREATE POLICY "Users can create approval requests" ON public.project_approval_requests
  FOR INSERT WITH CHECK (auth.uid() = requested_by);

-- Política para que los admins actualicen solicitudes
CREATE POLICY "Admins can update approval requests" ON public.project_approval_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- FUNCIONES PARA APROBACIÓN
-- =====================================================

-- Función para crear un proyecto con solicitud de aprobación automática
CREATE OR REPLACE FUNCTION public.create_project_with_approval(
  p_name character varying,
  p_description text DEFAULT NULL,
  p_technologies text[] DEFAULT NULL,
  p_environment_variables jsonb DEFAULT NULL,
  p_github_repository_url text DEFAULT NULL,
  p_customicon character varying DEFAULT 'FolderOpen'::character varying,
  p_type character varying DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_id uuid;
  user_role text;
BEGIN
  -- Verificar el rol del usuario
  SELECT role INTO user_role
  FROM public.users
  WHERE id = auth.uid();
  
  -- Crear el proyecto
  INSERT INTO public.projects (
    name,
    description,
    technologies,
    environment_variables,
    github_repository_url,
    customicon,
    type,
    created_by,
    approval_status
  ) VALUES (
    p_name,
    p_description,
    p_technologies,
    p_environment_variables,
    p_github_repository_url,
    p_customicon,
    p_type,
    auth.uid(),
    CASE 
      WHEN user_role = 'admin' THEN 'approved'
      ELSE 'pending'
    END
  ) RETURNING id INTO project_id;
  
  -- Si es un cliente, crear solicitud de aprobación automáticamente
  IF user_role != 'admin' THEN
    INSERT INTO public.project_approval_requests (
      project_id,
      requested_by,
      request_notes,
      status
    ) VALUES (
      project_id,
      auth.uid(),
      'Solicitud automática de aprobación para el proyecto: ' || p_name,
      'pending'
    );
  END IF;
  
  RETURN project_id;
END;
$$;

-- Función para crear una solicitud de aprobación
CREATE OR REPLACE FUNCTION public.create_project_approval_request(
  p_project_id uuid,
  p_request_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id uuid;
  project_owner uuid;
BEGIN
  -- Verificar que el proyecto existe y pertenece al usuario
  SELECT created_by INTO project_owner
  FROM public.projects
  WHERE id = p_project_id AND created_by = auth.uid();
  
  IF project_owner IS NULL THEN
    RAISE EXCEPTION 'Proyecto no encontrado o no tienes permisos';
  END IF;
  
  -- Crear la solicitud
  INSERT INTO public.project_approval_requests (
    project_id,
    requested_by,
    request_notes
  ) VALUES (
    p_project_id,
    auth.uid(),
    p_request_notes
  ) RETURNING id INTO request_id;
  
  -- Actualizar el estado del proyecto
  UPDATE public.projects
  SET approval_status = 'pending'
  WHERE id = p_project_id;
  
  RETURN request_id;
END;
$$;

-- Función para aprobar un proyecto
CREATE OR REPLACE FUNCTION public.approve_project(
  p_project_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin boolean;
  project_owner uuid;
  project_name text;
  admin_name text;
BEGIN
  -- Verificar que el usuario es admin
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Solo los administradores pueden aprobar proyectos';
  END IF;
  
  -- Obtener información del proyecto y propietario
  SELECT p.created_by, p.name, u.full_name
  INTO project_owner, project_name, admin_name
  FROM public.projects p
  LEFT JOIN public.users u ON u.id = auth.uid()
  WHERE p.id = p_project_id;
  
  -- Actualizar el proyecto
  UPDATE public.projects
  SET 
    approval_status = 'approved',
    approved_by = auth.uid(),
    approved_at = now(),
    approval_notes = p_admin_notes
  WHERE id = p_project_id;
  
  -- Actualizar la solicitud
  UPDATE public.project_approval_requests
  SET 
    status = 'approved',
    admin_response = p_admin_notes,
    reviewed_by = auth.uid(),
    reviewed_at = now()
  WHERE project_id = p_project_id AND status = 'pending';
  
  -- Crear notificación para el propietario del proyecto
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    category,
    metadata
  ) VALUES (
    project_owner,
    '¡Proyecto aprobado!',
    'Tu proyecto "' || project_name || '" ha sido aprobado por ' || COALESCE(admin_name, 'un administrador') || '. Ya puedes comenzar a trabajar en él.',
    'success',
    'project',
    jsonb_build_object(
      'project_id', p_project_id,
      'project_name', project_name,
      'admin_notes', p_admin_notes,
      'action_type', 'project_approved'
    )
  );
  
  RETURN true;
END;
$$;

-- Función para rechazar un proyecto
CREATE OR REPLACE FUNCTION public.reject_project(
  p_project_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin boolean;
  project_owner uuid;
  project_name text;
  admin_name text;
BEGIN
  -- Verificar que el usuario es admin
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Solo los administradores pueden rechazar proyectos';
  END IF;
  
  -- Obtener información del proyecto y propietario
  SELECT p.created_by, p.name, u.full_name
  INTO project_owner, project_name, admin_name
  FROM public.projects p
  LEFT JOIN public.users u ON u.id = auth.uid()
  WHERE p.id = p_project_id;
  
  -- Actualizar el proyecto
  UPDATE public.projects
  SET 
    approval_status = 'rejected',
    approved_by = auth.uid(),
    approved_at = now(),
    approval_notes = p_admin_notes
  WHERE id = p_project_id;
  
  -- Actualizar la solicitud
  UPDATE public.project_approval_requests
  SET 
    status = 'rejected',
    admin_response = p_admin_notes,
    reviewed_by = auth.uid(),
    reviewed_at = now()
  WHERE project_id = p_project_id AND status = 'pending';
  
  -- Crear notificación para el propietario del proyecto
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    category,
    metadata
  ) VALUES (
    project_owner,
    'Proyecto rechazado',
    'Tu proyecto "' || project_name || '" ha sido rechazado por ' || COALESCE(admin_name, 'un administrador') || '. ' || COALESCE(p_admin_notes, 'Contacta a los administradores para más información.'),
    'warning',
    'project',
    jsonb_build_object(
      'project_id', p_project_id,
      'project_name', project_name,
      'admin_notes', p_admin_notes,
      'action_type', 'project_rejected'
    )
  );
  
  RETURN true;
END;
$$;

-- =====================================================
-- TRIGGERS PARA NOTIFICACIONES
-- =====================================================

-- Función para crear notificación cuando se solicita aprobación
CREATE OR REPLACE FUNCTION public.notify_project_approval_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Crear notificación para todos los admins
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    category,
    metadata
  )
  SELECT 
    u.id,
    'Nueva solicitud de aprobación de proyecto',
    'El usuario ' || COALESCE(u2.full_name, u2.email) || ' ha solicitado aprobación para el proyecto: ' || p.name,
    'info',
    'project',
    jsonb_build_object(
      'project_id', NEW.project_id,
      'request_id', NEW.id,
      'requested_by', NEW.requested_by,
      'action_type', 'project_approval'
    )
  FROM public.users u
  CROSS JOIN public.projects p
  CROSS JOIN public.users u2
  WHERE u.role = 'admin'
    AND p.id = NEW.project_id
    AND u2.id = NEW.requested_by;
  
  RETURN NEW;
END;
$$;

-- Trigger para notificar cuando se crea una solicitud
DROP TRIGGER IF EXISTS trigger_notify_project_approval_request ON public.project_approval_requests;
CREATE TRIGGER trigger_notify_project_approval_request
  AFTER INSERT ON public.project_approval_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_project_approval_request();

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista para proyectos pendientes de aprobación
CREATE OR REPLACE VIEW public.pending_approval_projects AS
SELECT 
  p.*,
  u.full_name as creator_name,
  u.email as creator_email,
  par.request_notes,
  par.created_at as request_created_at
FROM public.projects p
JOIN public.users u ON p.created_by = u.id
LEFT JOIN public.project_approval_requests par ON p.id = par.project_id AND par.status = 'pending'
WHERE p.approval_status = 'pending';

-- Vista para solicitudes de aprobación con detalles
CREATE OR REPLACE VIEW public.approval_requests_with_details AS
SELECT 
  par.*,
  p.name as project_name,
  p.description as project_description,
  u1.full_name as requester_name,
  u1.email as requester_email,
  u2.full_name as reviewer_name
FROM public.project_approval_requests par
JOIN public.projects p ON par.project_id = p.id
JOIN public.users u1 ON par.requested_by = u1.id
LEFT JOIN public.users u2 ON par.reviewed_by = u2.id;

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_projects_approval_status ON public.projects(approval_status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON public.project_approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_project_id ON public.project_approval_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_requested_by ON public.project_approval_requests(requested_by);

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON COLUMN public.projects.approval_status IS 'Estado de aprobación del proyecto: pending, approved, rejected';
COMMENT ON COLUMN public.projects.approved_by IS 'ID del administrador que aprobó/rechazó el proyecto';
COMMENT ON COLUMN public.projects.approved_at IS 'Fecha y hora de la aprobación/rechazo';
COMMENT ON COLUMN public.projects.approval_notes IS 'Comentarios del administrador sobre la aprobación/rechazo';
COMMENT ON COLUMN public.projects.approval_deadline IS 'Fecha límite para la aprobación (opcional)';

COMMENT ON TABLE public.project_approval_requests IS 'Registro de solicitudes de aprobación de proyectos';
COMMENT ON FUNCTION public.create_project_with_approval IS 'Crea un proyecto con solicitud de aprobación automática';
COMMENT ON FUNCTION public.create_project_approval_request IS 'Crea una solicitud de aprobación para un proyecto';
COMMENT ON FUNCTION public.approve_project IS 'Aprueba un proyecto y notifica al cliente (solo admins)';
COMMENT ON FUNCTION public.reject_project IS 'Rechaza un proyecto y notifica al cliente (solo admins)';
