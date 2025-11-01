-- ================================================
-- CREAR ADMINISTRADOR: admin@agm.com
-- ================================================
-- Este script crea el usuario administrador principal
-- con email admin@agm.com
-- ================================================

-- 🔐 CREDENCIALES:
-- Email:    admin@agm.com
-- Password: Admin@AGM2025!
-- Username: admin_agm
-- ================================================

DO $$
DECLARE
    v_user_id UUID;
    v_email TEXT := 'admin@agm.com';  -- Email principal AGM
    v_password TEXT := 'Admin@AGM2025!';  -- Password seguro
    v_username TEXT := 'admin_agm';  -- Username único
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Creando admin@agm.com...';
    RAISE NOTICE '========================================';

    -- Verificar si el usuario ya existe en auth.users
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_email;

    IF v_user_id IS NOT NULL THEN
        -- Usuario YA existe, solo actualizar a admin
        RAISE NOTICE 'Usuario ya existe con ID: %', v_user_id;
        RAISE NOTICE 'Actualizando rol a admin...';

        UPDATE profiles
        SET
            role = 'admin',
            status = 'active',
            email_verified = true,
            kyc_status = COALESCE(kyc_status, 'not_submitted'),
            updated_at = NOW()
        WHERE id = v_user_id;

        RAISE NOTICE '✅ Perfil actualizado a admin exitosamente';

    ELSE
        -- Usuario NO existe, crear nuevo
        RAISE NOTICE 'Creando nuevo usuario admin@agm.com...';

        -- Crear usuario en auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            jsonb_build_object('name', 'Administrador AGM'),
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        )
        RETURNING id INTO v_user_id;

        RAISE NOTICE '✅ Usuario creado en auth.users con ID: %', v_user_id;

        -- Crear perfil en public.profiles
        INSERT INTO public.profiles (
            id,
            email,
            username,
            role,
            status,
            broker_balance,
            email_verified,
            kyc_status,
            created_at,
            updated_at
        )
        VALUES (
            v_user_id,
            v_email,
            v_username,
            'admin',
            'active',
            0.00,
            true,
            'not_submitted',
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE
        SET
            role = 'admin',
            status = 'active',
            email_verified = true,
            kyc_status = 'not_submitted',
            updated_at = NOW();

        RAISE NOTICE '✅ Perfil creado en public.profiles con rol admin';
    END IF;

    -- Resultado final
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ ADMINISTRADOR AGM CREADO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Email:    %', v_email;
    RAISE NOTICE 'Password: Admin@AGM2025!';
    RAISE NOTICE 'Username: %', v_username;
    RAISE NOTICE 'UUID:     %', v_user_id;
    RAISE NOTICE 'Rol:      admin';
    RAISE NOTICE '========================================';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERROR: %', SQLERRM;
        RAISE;
END $$;

-- ================================================
-- VERIFICAR CREACIÓN
-- ================================================
SELECT
    a.id,
    a.email,
    p.username,
    p.role,
    p.status,
    a.email_confirmed_at as "Email Confirmado",
    p.created_at as "Fecha Creación"
FROM auth.users a
LEFT JOIN profiles p ON p.id = a.id
WHERE a.email = 'admin@agm.com';
