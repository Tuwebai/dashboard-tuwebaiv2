-- Script simple para probar conectividad básica
-- Ejecutar en la consola SQL de Supabase

-- 1. Probar usuarios (sabemos que funciona)
SELECT COUNT(*) as total_users FROM users;

-- 2. Probar proyectos (solo count)
SELECT COUNT(*) as total_projects FROM projects;

-- 3. Probar tickets (solo count)
SELECT COUNT(*) as total_tickets FROM tickets;

-- 4. Probar ai_settings (sabemos que funciona)
SELECT COUNT(*) as total_ai_settings FROM ai_settings;
