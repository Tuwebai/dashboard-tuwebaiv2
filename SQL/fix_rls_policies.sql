-- Script para corregir políticas RLS de user_invitations
-- Este script permite que los administradores puedan crear invitaciones

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Admins can view all invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Admins can insert invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Admins can delete invitations" ON public.user_invitations;

-- Crear nuevas políticas para administradores
-- Política para ver invitaciones: solo administradores
CREATE POLICY "Admins can view all invitations" ON public.user_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política para insertar invitaciones: solo administradores
CREATE POLICY "Admins can insert invitations" ON public.user_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política para actualizar invitaciones: solo administradores
CREATE POLICY "Admins can update invitations" ON public.user_invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política para eliminar invitaciones: solo administradores
CREATE POLICY "Admins can delete invitations" ON public.user_invitations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Verificar que las políticas se crearon correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_invitations'
ORDER BY policyname;
