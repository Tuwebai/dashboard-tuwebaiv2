-- Script para obtener la estructura COMPLETA de la base de datos
-- Ejecutar en el SQL Editor de Supabase
-- Este script muestra TODAS las tablas con TODAS sus columnas

SELECT 
    t.table_name as "NOMBRE_TABLA",
    c.column_name as "NOMBRE_COLUMNA", 
    c.data_type as "TIPO_DATO",
    c.character_maximum_length as "LONGITUD",
    c.is_nullable as "PERMITE_NULL",
    c.column_default as "VALOR_DEFAULT",
    c.ordinal_position as "POSICION"
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' 
    AND c.table_schema = 'public'
ORDER BY t.table_name, c.ordinal_position;
