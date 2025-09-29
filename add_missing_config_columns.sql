-- =====================================================
-- AGREGAR COLUMNAS FALTANTES A PROFILES
-- =====================================================
-- Solo agrega master_config y pamm_config que faltan
-- =====================================================

-- Agregar columna master_config si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'master_config'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN master_config JSONB DEFAULT NULL;

        RAISE NOTICE '✅ Columna master_config agregada a profiles';
    ELSE
        RAISE NOTICE '⚠️  Columna master_config ya existe en profiles';
    END IF;
END $$;

-- Agregar columna pamm_config si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'pamm_config'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN pamm_config JSONB DEFAULT NULL;

        RAISE NOTICE '✅ Columna pamm_config agregada a profiles';
    ELSE
        RAISE NOTICE '⚠️  Columna pamm_config ya existe en profiles';
    END IF;
END $$;

-- Verificar que se agregaron correctamente
SELECT
    'master_config' as columna,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'profiles'
            AND column_name = 'master_config'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status,
    (SELECT data_type FROM information_schema.columns
     WHERE table_schema = 'public'
     AND table_name = 'profiles'
     AND column_name = 'master_config') as tipo

UNION ALL

SELECT
    'pamm_config',
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'profiles'
            AND column_name = 'pamm_config'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END,
    (SELECT data_type FROM information_schema.columns
     WHERE table_schema = 'public'
     AND table_name = 'profiles'
     AND column_name = 'pamm_config');

-- =====================================================
-- SCRIPT COMPLETADO
-- =====================================================
SELECT '🎉 Columnas agregadas exitosamente. Ahora el sistema está 100% listo.' as mensaje;