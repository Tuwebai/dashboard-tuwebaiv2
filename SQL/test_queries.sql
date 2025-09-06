-- Script para probar las consultas exactas que usa Websy AI
-- Ejecutar en la consola SQL de Supabase

-- 1. Probar consulta de tickets con columnas correctas
SELECT 
    id, 
    asunto, 
    status, 
    prioridad, 
    created_at, 
    user_id 
FROM tickets 
LIMIT 5;

-- 2. Probar consulta de proyectos con columnas correctas
SELECT 
    id, 
    name, 
    status, 
    progress, 
    created_at, 
    created_by 
FROM projects 
LIMIT 5;

-- 3. Probar consulta de usuarios
SELECT 
    id, 
    full_name, 
    email, 
    role, 
    created_at 
FROM users 
LIMIT 5;

-- 4. Probar consulta de ai_settings
SELECT 
    id, 
    user_id, 
    settings, 
    created_at 
FROM ai_settings 
WHERE user_id = '25bda3f3-3d93-4c9f-a09e-0bd0265dd176'
LIMIT 5;
