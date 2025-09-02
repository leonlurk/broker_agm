-- =====================================================
-- SCRIPT PARA VERIFICAR LA ESTRUCTURA ACTUAL DE TU BASE DE DATOS
-- Ejecuta este SQL en Supabase para ver qué tablas y columnas tienes
-- =====================================================

-- 1. LISTAR TODAS LAS TABLAS EN TU ESQUEMA PUBLIC
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. VER ESTRUCTURA DE LA TABLA profiles (si existe)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. VER ESTRUCTURA DE LA TABLA users (si existe)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'users'
ORDER BY ordinal_position;

-- 4. VER ESTRUCTURA DE LA TABLA broker_accounts (si existe)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'broker_accounts'
ORDER BY ordinal_position;

-- 5. VER ESTRUCTURA DE LA TABLA trading_accounts (si existe)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'trading_accounts'
ORDER BY ordinal_position;

-- 6. VERIFICAR SI EXISTE LA COLUMNA broker_balance EN ALGUNA TABLA
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND column_name = 'broker_balance';

-- 7. VERIFICAR SI EXISTE LA TABLA internal_transfers
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'internal_transfers'
) as internal_transfers_exists;

-- 8. LISTAR TODAS LAS FUNCIONES RPC EXISTENTES
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 9. VER ESPECÍFICAMENTE SI EXISTE create_transfer_request
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.routines
    WHERE routine_schema = 'public' 
    AND routine_name = 'create_transfer_request'
) as transfer_function_exists;

-- 10. RESUMEN COMPLETO DE TODAS LAS TABLAS Y SUS COLUMNAS
SELECT 
    t.table_name,
    STRING_AGG(
        c.column_name || ' (' || c.data_type || ')', 
        ', ' 
        ORDER BY c.ordinal_position
    ) as columns
FROM information_schema.tables t
JOIN information_schema.columns c 
    ON t.table_name = c.table_name 
    AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name
ORDER BY t.table_name;