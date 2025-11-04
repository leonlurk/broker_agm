-- ===============================
-- VERIFICAR LOG DE CREACIÓN DE MASTER TRADER
-- ===============================

-- 1. Verificar logs de auditoría si existen
SELECT * FROM audit_logs
WHERE user_id = 'a153a6d6-e48d-4297-9a64-395c462e138f'
  AND action LIKE '%master%'
ORDER BY created_at DESC
LIMIT 10;

-- 2. Buscar en TODAS las tablas que contengan tu user_id
-- Esto te mostrará en qué tablas aparece tu usuario
SELECT
    table_name,
    column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'user_id';

-- 3. Verificar si hay alguna tabla de configuración
SELECT * FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name LIKE '%config%' OR table_name LIKE '%setting%')
ORDER BY table_name;

-- 4. Ver usuarios en auth.users (verificar que tu usuario existe)
SELECT
    id,
    email,
    created_at,
    updated_at
FROM auth.users
WHERE id = 'a153a6d6-e48d-4297-9a64-395c462e138f';
