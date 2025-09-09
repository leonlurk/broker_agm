-- ============================================
-- CONSULTAS PARA VER ESTRUCTURA DE WALLET
-- Muestra todas las tablas y columnas usadas
-- para depósitos, retiros y transferencias
-- ============================================

-- 1. VER ESTRUCTURA DE LA TABLA DEPOSITS
-- ============================================
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'deposits'
ORDER BY ordinal_position;

-- 2. VER ESTRUCTURA DE LA TABLA WITHDRAWALS
-- ============================================
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'withdrawals'
ORDER BY ordinal_position;

-- 3. VER ESTRUCTURA DE LA TABLA INTERNAL_TRANSFERS
-- ============================================
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'internal_transfers'
ORDER BY ordinal_position;

-- 4. VER COLUMNAS DE BALANCE EN PROFILES
-- ============================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name LIKE '%balance%'
ORDER BY ordinal_position;

-- 5. VER TODAS LAS FUNCIONES RPC RELACIONADAS
-- ============================================
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'create_deposit_request',
    'create_withdrawal_request', 
    'create_transfer_request',
    'get_user_transactions'
);

-- 6. VER INDICES DE LAS TABLAS
-- ============================================
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('deposits', 'withdrawals', 'internal_transfers')
ORDER BY tablename, indexname;

-- 7. VER POLÍTICAS RLS
-- ============================================
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
WHERE tablename IN ('deposits', 'withdrawals', 'internal_transfers');

-- 8. RESUMEN RÁPIDO DE REGISTROS
-- ============================================
SELECT 
    'deposits' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendientes,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completados,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as fallidos
FROM deposits
UNION ALL
SELECT 
    'withdrawals',
    COUNT(*),
    COUNT(CASE WHEN status = 'pending' THEN 1 END),
    COUNT(CASE WHEN status = 'completed' THEN 1 END),
    COUNT(CASE WHEN status = 'failed' THEN 1 END)
FROM withdrawals
UNION ALL
SELECT 
    'internal_transfers',
    COUNT(*),
    COUNT(CASE WHEN status = 'pending' THEN 1 END),
    COUNT(CASE WHEN status = 'completed' THEN 1 END),
    COUNT(CASE WHEN status = 'failed' THEN 1 END)
FROM internal_transfers;

-- 9. VER ÚLTIMAS 5 TRANSACCIONES DE CADA TIPO
-- ============================================
-- Últimos depósitos
SELECT 
    'DEPÓSITO' as tipo,
    id,
    user_id,
    amount,
    status,
    created_at
FROM deposits
ORDER BY created_at DESC
LIMIT 5;

-- Últimos retiros
SELECT 
    'RETIRO' as tipo,
    id,
    user_id,
    amount,
    status,
    requested_at as created_at
FROM withdrawals
ORDER BY requested_at DESC
LIMIT 5;

-- Últimas transferencias
SELECT 
    'TRANSFERENCIA' as tipo,
    id,
    user_id,
    amount,
    status,
    created_at
FROM internal_transfers
ORDER BY created_at DESC
LIMIT 5;

-- 10. VER ESTRUCTURA COMPLETA EN UN SOLO QUERY
-- ============================================
WITH table_structure AS (
    SELECT 
        'deposits' as table_name,
        column_name,
        data_type,
        is_nullable,
        ordinal_position
    FROM information_schema.columns
    WHERE table_name = 'deposits'
    
    UNION ALL
    
    SELECT 
        'withdrawals',
        column_name,
        data_type,
        is_nullable,
        ordinal_position
    FROM information_schema.columns
    WHERE table_name = 'withdrawals'
    
    UNION ALL
    
    SELECT 
        'internal_transfers',
        column_name,
        data_type,
        is_nullable,
        ordinal_position
    FROM information_schema.columns
    WHERE table_name = 'internal_transfers'
)
SELECT 
    table_name as "Tabla",
    column_name as "Columna",
    data_type as "Tipo",
    is_nullable as "Nullable"
FROM table_structure
ORDER BY table_name, ordinal_position;