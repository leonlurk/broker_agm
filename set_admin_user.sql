-- Script para configurar usuario como admin
-- Usuario: l7895424@outlook.es

-- Opción 1: Si la tabla tiene columna 'role' en public.users
DO $$
BEGIN
    -- Agregar columna role si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'role'
    ) THEN
        ALTER TABLE public.users ADD COLUMN role TEXT DEFAULT 'user';
        RAISE NOTICE 'Column role added to users table';
    END IF;
END $$;

-- Actualizar usuario a admin
UPDATE public.users
SET role = 'admin'
WHERE email = 'l7895424@outlook.es';

-- Verificar que se actualizó
SELECT id, email, username, role, user_type
FROM public.users
WHERE email = 'l7895424@outlook.es';

-- Si usas una tabla profiles separada, descomentar esto:
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'l7895424@outlook.es';
