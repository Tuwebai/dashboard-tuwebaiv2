-- =====================================================
-- SISTEMA DE APROBACIÓN DE PROYECTOS - VERSIÓN SIMPLE
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
-- VISTAS ÚTILES
-- =====================================================

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

COMMENT ON TABLE public.project_approval_requests IS 'Registro de solicitudes de aprobación de proyectos';
