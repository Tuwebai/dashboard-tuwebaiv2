-- =====================================================
-- AGREGAR COLUMNAS DE APROBACIÓN A LA TABLA PROJECTS
-- =====================================================

-- 1. Agregar columna approval_status
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS approval_status character varying DEFAULT 'pending'::character varying 
CHECK (approval_status = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying]));

-- 2. Agregar columna approved_by
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.users(id);

-- 3. Agregar columna approved_at
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;

-- 4. Actualizar proyectos existentes para que tengan estado 'approved' por defecto
UPDATE public.projects 
SET approval_status = 'approved' 
WHERE approval_status IS NULL;

-- 5. Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_projects_approval_status ON public.projects(approval_status);

-- 6. Agregar comentarios para documentación
COMMENT ON COLUMN public.projects.approval_status IS 'Estado de aprobación del proyecto: pending, approved, rejected';
COMMENT ON COLUMN public.projects.approved_by IS 'ID del administrador que aprobó/rechazó el proyecto';
COMMENT ON COLUMN public.projects.approved_at IS 'Fecha y hora de la aprobación/rechazo';

-- 7. Verificar que las columnas se agregaron correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND table_schema = 'public'
AND column_name IN ('approval_status', 'approved_by', 'approved_at')
ORDER BY column_name;
