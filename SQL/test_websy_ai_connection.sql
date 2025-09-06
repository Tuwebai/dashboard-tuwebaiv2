-- Script simple para probar la conectividad de Websy AI
-- Ejecutar en la consola SQL de Supabase

-- 1. Probar consulta básica de usuarios
SELECT 
    id, 
    full_name, 
    email, 
    role, 
    created_at 
FROM users 
LIMIT 5;

-- 2. Probar consulta básica de proyectos (si existe)
SELECT 
    id, 
    name, 
    created_at 
FROM projects 
LIMIT 5;

-- 3. Probar consulta básica de tickets (si existe)
SELECT 
    id, 
    title, 
    created_at 
FROM tickets 
LIMIT 5;

-- 4. Verificar si ai_settings existe
SELECT 
    id, 
    user_id, 
    settings, 
    created_at 
FROM ai_settings 
LIMIT 5;
