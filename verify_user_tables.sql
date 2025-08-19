-- Verificar qué tablas de usuarios existen y su estructura

-- 1. ¿Existe la tabla 'users' en public?
SELECT 
    'Tabla users en public:' as info,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
    ) as existe;

-- 2. ¿Existe la tabla 'profiles' en public?
SELECT 
    'Tabla profiles en public:' as info,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profiles'
    ) as existe;

-- 3. Si existe 'users', mostrar su estructura
SELECT 
    'Estructura de users (si existe):' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- 4. Si existe 'profiles', mostrar su estructura
SELECT 
    'Estructura de profiles (si existe):' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 5. Ver la definición de handle_new_user
SELECT 
    'Función handle_new_user:' as info;
SELECT 
    pg_get_functiondef(oid) as definicion
FROM pg_proc
WHERE proname = 'handle_new_user';