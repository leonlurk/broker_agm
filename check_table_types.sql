-- Script para verificar los tipos de datos en las tablas
-- Ejecuta esto primero para entender la estructura

-- Verificar tipo de user_id en broker_accounts
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'broker_accounts'
AND column_name = 'user_id';

-- Verificar si broker_accounts existe y su estructura
SELECT 
    column_name,
    data_type,
    udt_name,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'broker_accounts'
ORDER BY ordinal_position;

-- Verificar las tablas relacionadas
SELECT 
    table_name,
    column_name,
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name LIKE '%user_id%'
AND table_name IN (
    'users',
    'profiles', 
    'broker_accounts',
    'transactions',
    'withdrawals',
    'deposits',
    'payment_methods',
    'user_referrals',
    'affiliate_payments'
)
ORDER BY table_name, column_name;

-- Verificar el usuario específico
SELECT 
    id,
    email,
    pg_typeof(id) as id_type
FROM auth.users 
WHERE email = 'leonagustp@gmail.com';

-- Verificar si el usuario tiene datos en broker_accounts
SELECT 
    id,
    user_id,
    pg_typeof(user_id) as user_id_type
FROM public.broker_accounts 
WHERE user_id::text = (SELECT id::text FROM auth.users WHERE email = 'leonagustp@gmail.com')
   OR user_id = (SELECT id FROM auth.users WHERE email = 'leonagustp@gmail.com');