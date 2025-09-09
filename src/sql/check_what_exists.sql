-- ============================================
-- REVISAR QUÉ EXISTE REALMENTE EN LA BASE DE DATOS
-- Sin asumir nada
-- ============================================

-- 1. LISTAR TODAS LAS TABLAS QUE EXISTEN
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. BUSCAR TABLAS QUE PODRÍAN SER DE CUENTAS
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
    table_name LIKE '%account%' OR 
    table_name LIKE '%trading%' OR 
    table_name LIKE '%mt5%' OR
    table_name LIKE '%broker%'
)
ORDER BY table_name;

-- 3. VER ESTRUCTURA DE LA TABLA profiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 4. VER ESTRUCTURA DE internal_transfers
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'internal_transfers'
ORDER BY ordinal_position;

-- 5. VER ESTRUCTURA DE deposits
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'deposits'
ORDER BY ordinal_position
LIMIT 15;

-- 6. VER ESTRUCTURA DE withdrawals
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'withdrawals'
ORDER BY ordinal_position
LIMIT 15;

-- 7. BUSCAR FUNCIONES RELACIONADAS CON TRANSFERENCIAS
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (
    routine_name LIKE '%transfer%' OR
    routine_name LIKE '%deposit%' OR
    routine_name LIKE '%withdraw%'
)
ORDER BY routine_name;

-- 8. VER SI EXISTE broker_accounts
SELECT COUNT(*) as existe_broker_accounts
FROM information_schema.tables 
WHERE table_name = 'broker_accounts';

-- 9. VER SI EXISTE accounts
SELECT COUNT(*) as existe_accounts
FROM information_schema.tables 
WHERE table_name = 'accounts';

-- 10. VER TODAS LAS COLUMNAS QUE CONTIENEN 'balance' EN CUALQUIER TABLA
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE column_name LIKE '%balance%'
AND table_schema = 'public'
ORDER BY table_name;