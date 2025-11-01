-- ================================================
-- SOLUCIÓN RÁPIDA: Error kyc_status_check
-- ================================================
-- Si obtuviste el error:
-- "new row for relation profiles violates check constraint profiles_kyc_status_check"
--
-- Ejecuta ESTE archivo en lugar del archivo 02
-- ================================================

-- ⚠️ ANTES DE EJECUTAR:
-- 1. Reemplaza 'admin@tudominio.com' con tu email
-- 2. Reemplaza 'AdminPassword2025!' con tu password seguro
-- 3. Reemplaza 'admin' con tu username preferido
-- ================================================

DO $$
DECLARE
    v_user_id UUID;
    v_email TEXT := 'admin@tudominio.com';  -- ✅ CAMBIAR ESTE EMAIL
    v_password TEXT := 'AdminPassword2025!';  -- ✅ CAMBIAR ESTE PASSWORD
    v_username TEXT := 'admin';  -- ✅ CAMBIAR USERNAME
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Iniciando creación de usuario admin...';
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
            kyc_status = COALESCE(kyc_status, 'not_submitted'),  -- ✅ FIX
            updated_at = NOW()
        WHERE id = v_user_id;

        RAISE NOTICE '✅ Perfil actualizado a admin exitosamente';

    ELSE
        -- Usuario NO existe, crear nuevo
        RAISE NOTICE 'Usuario no existe, creando nuevo...';

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
            jsonb_build_object('name', 'Administrador'),
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        )
        RETURNING id INTO v_user_id;

        RAISE NOTICE '✅ Usuario creado en auth.users con ID: %', v_user_id;

        -- Crear perfil en public.profiles con kyc_status correcto
        INSERT INTO public.profiles (
            id,
            email,
            username,
            role,
            status,
            broker_balance,
            email_verified,
            kyc_status,  -- ✅ AGREGADO
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
            'not_submitted',  -- ✅ VALOR CORRECTO (no 'not_started')
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE
        SET
            role = 'admin',
            status = 'active',
            email_verified = true,
            kyc_status = 'not_submitted',  -- ✅ FIX
            updated_at = NOW();

        RAISE NOTICE '✅ Perfil creado en public.profiles con rol admin';
    END IF;

    -- Resultado final
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ USUARIO ADMINISTRADOR CREADO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Email: %', v_email;
    RAISE NOTICE 'UUID: %', v_user_id;
    RAISE NOTICE 'Rol: admin';
    RAISE NOTICE 'Estado: active';
    RAISE NOTICE 'KYC Status: not_submitted';
    RAISE NOTICE '========================================';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERROR: %', SQLERRM;
        RAISE;
END $$;

-- ================================================
-- EXPLICACIÓN DEL ERROR:
-- ================================================
-- El constraint "profiles_kyc_status_check" solo acepta estos valores:
-- - 'not_submitted'  (usuario no ha enviado KYC)
-- - 'pending'        (KYC enviado, esperando revisión)
-- - 'approved'       (KYC aprobado)
-- - 'rejected'       (KYC rechazado)
--
-- El valor por defecto de la tabla intentaba usar 'not_started'
-- pero este NO es un valor válido según el constraint.
--
-- Este script usa 'not_submitted' que es el valor correcto.
-- ================================================
