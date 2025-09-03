-- =====================================================
-- SOLUCIÓN SEGURA PARA USUARIOS SIN PERFIL
-- =====================================================

-- 1. PRIMERO: Ver quiénes son los 4 usuarios sin perfil
SELECT 
    u.id,
    u.email,
    u.created_at,
    u.email_confirmed_at,
    CASE 
        WHEN u.email_confirmed_at IS NULL THEN 'Email NO verificado'
        ELSE 'Email verificado'
    END as estado_email,
    u.raw_user_meta_data->>'username' as username_metadata
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = u.id
)
ORDER BY u.created_at DESC;

-- 2. VERIFICAR: ¿Existe un trigger para crear perfiles automáticamente?
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
    AND event_object_table = 'users';

-- 3. CREAR PERFILES FALTANTES DE FORMA SEGURA
-- Este script crea perfiles solo para los usuarios que no tienen
INSERT INTO public.profiles (
    id,
    email,
    username,
    full_name,
    kyc_status,
    email_verified,
    created_at,
    updated_at
)
SELECT 
    u.id,
    u.email,
    -- Username: usa metadata o genera uno desde el email
    COALESCE(
        u.raw_user_meta_data->>'username',
        split_part(u.email, '@', 1) || '_' || substring(u.id::text, 1, 4)
    ) as username,
    -- Full name: usa metadata o el email
    COALESCE(
        u.raw_user_meta_data->>'full_name',
        u.email
    ) as full_name,
    -- KYC status: siempre 'not_started' para nuevos perfiles
    'not_started' as kyc_status,
    -- Email verified: basado en email_confirmed_at
    COALESCE(u.email_confirmed_at IS NOT NULL, FALSE) as email_verified,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;  -- Si ya existe, no hacer nada

-- 4. VERIFICAR QUE SE CREARON
SELECT 
    'Usuarios sin perfil DESPUÉS del fix' as descripcion,
    COUNT(*) as cantidad
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = u.id
);

-- 5. VER LOS PERFILES RECIÉN CREADOS
SELECT 
    p.id,
    p.email,
    p.username,
    p.kyc_status,
    p.email_verified,
    p.created_at
FROM public.profiles p
WHERE p.created_at >= NOW() - INTERVAL '5 minutes'
ORDER BY p.created_at DESC;

-- =====================================================
-- CREAR TRIGGER PARA FUTUROS USUARIOS (OPCIONAL)
-- =====================================================
-- Solo ejecuta esta sección si quieres que se creen
-- perfiles automáticamente para nuevos usuarios

-- 6. FUNCIÓN para crear perfil cuando se crea un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Crear perfil para el nuevo usuario
    INSERT INTO public.profiles (
        id,
        email,
        username,
        full_name,
        kyc_status,
        email_verified,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'username',
            split_part(NEW.email, '@', 1)
        ),
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.email
        ),
        'not_started',
        FALSE,  -- Por defecto no verificado hasta que confirmen email
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;  -- Si ya existe, no hacer nada
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- Si hay error, solo registrarlo pero no fallar el registro
        RAISE LOG 'Error creando perfil para usuario %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. TRIGGER para ejecutar la función
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- 8. Confirmar que todo está bien
SELECT 
    'Total usuarios' as tipo,
    COUNT(*) as cantidad
FROM auth.users
UNION ALL
SELECT 
    'Total perfiles' as tipo,
    COUNT(*) as cantidad
FROM public.profiles
UNION ALL
SELECT 
    'Usuarios sin perfil' as tipo,
    COUNT(*) as cantidad
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- =====================================================
-- NOTAS:
-- =====================================================
-- 1. Este script es SEGURO - solo crea perfiles que faltan
-- 2. Usa ON CONFLICT DO NOTHING para evitar errores
-- 3. El trigger es OPCIONAL - solo créalo si quieres
--    que futuros usuarios tengan perfil automáticamente
-- 4. El trigger no falla si hay error, solo lo registra
-- =====================================================