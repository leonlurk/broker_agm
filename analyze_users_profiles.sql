-- =====================================================
-- ANÁLISIS DE TABLAS USERS VS PROFILES
-- =====================================================

-- 1. ESTRUCTURA DE LA TABLA USERS
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 2. ESTRUCTURA DE LA TABLA PROFILES  
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. CONTAR REGISTROS EN CADA TABLA
SELECT 'users' as tabla, COUNT(*) as total FROM users
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles;

-- 4. VER PRIMEROS 3 REGISTROS DE USERS
SELECT * FROM users LIMIT 3;

-- 5. VER PRIMEROS 3 REGISTROS DE PROFILES
SELECT * FROM profiles LIMIT 3;

-- 6. VERIFICAR SI HAY RELACIÓN ENTRE USERS Y PROFILES
-- Ver si users tiene referencia a profiles
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name as local_column,
    ccu.table_name as foreign_table,
    ccu.column_name as foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'users' 
    AND tc.constraint_type = 'FOREIGN KEY';

-- 7. VER CONSTRAINTS UNIQUE EN USERS
SELECT 
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'users' 
    AND tc.constraint_type = 'UNIQUE';

-- 8. VER CONSTRAINTS UNIQUE EN PROFILES
SELECT 
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'profiles' 
    AND tc.constraint_type = 'UNIQUE';

-- 9. BUSCAR USERNAME 'mrlurk' EN AMBAS TABLAS
SELECT 'users' as tabla, COUNT(*) as existe 
FROM users 
WHERE username = 'mrlurk' OR email = 'leonagustp@gmail.com'
UNION ALL
SELECT 'profiles', COUNT(*) 
FROM profiles 
WHERE username = 'mrlurk' OR email = 'leonagustp@gmail.com';

-- 10. VER TRIGGERS QUE AFECTAN A ESTAS TABLAS
SELECT 
    event_object_table as tabla,
    trigger_name,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('users', 'profiles')
ORDER BY event_object_table, trigger_name;

-- 11. VER SI HAY VISTAS QUE UNAN ESTAS TABLAS
SELECT 
    table_name as view_name
FROM information_schema.views
WHERE view_definition LIKE '%users%' 
    AND view_definition LIKE '%profiles%';

-- 12. ESTRUCTURA DE BROKER_ACCOUNTS (tabla del backend)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'broker_accounts'
ORDER BY ordinal_position;

-- 13. VER SI BROKER_ACCOUNTS SE RELACIONA CON USERS O PROFILES
SELECT 
    tc.constraint_name,
    kcu.column_name as broker_column,
    ccu.table_name as references_table,
    ccu.column_name as references_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'broker_accounts' 
    AND tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name IN ('users', 'profiles');