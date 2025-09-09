-- =====================================================
-- SCRIPT PARA REVISAR ESTRUCTURA ACTUAL DE BASE DE DATOS
-- =====================================================
-- Ejecuta este script en Supabase SQL Editor para ver qué tablas tienes

-- 1. Ver todas las tablas existentes
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Ver si existe la tabla profiles (usuarios)
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Verificar si existe alguna tabla de referrals
SELECT 
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
    AND (
        table_name LIKE '%referral%' 
        OR table_name LIKE '%affiliate%'
        OR table_name LIKE '%referr%'
    );

-- 4. Verificar si existe alguna tabla de pagos de afiliados
SELECT 
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
    AND (
        table_name LIKE '%payment%' 
        OR table_name LIKE '%payout%'
        OR table_name LIKE '%commission%'
    );

-- 5. Ver si la tabla profiles tiene columna referred_by o similar
SELECT 
    column_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'profiles'
    AND (
        column_name LIKE '%refer%'
        OR column_name LIKE '%affiliate%'
    );

-- 6. Verificar si existe tabla de trading_accounts
SELECT 
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'trading_accounts'
ORDER BY ordinal_position;

-- 7. Ver todas las funciones/triggers relacionados con referrals
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND (
        routine_name LIKE '%referral%'
        OR routine_name LIKE '%affiliate%'
    );