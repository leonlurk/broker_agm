-- SQL Script para verificar que Supabase esté preparado para Copy Trading y PAMM
-- Ejecutar en el SQL Editor de Supabase

-- =====================================================
-- 1. VERIFICAR TABLA PROFILES Y COLUMNAS NECESARIAS
-- =====================================================

-- Verificar que la tabla profiles existe
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'profiles';

-- Verificar columnas existentes en profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Verificar si existen las columnas específicas para Master Trader y PAMM Manager
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'is_master_trader'
        ) THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as is_master_trader_column,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'master_config'
        ) THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as master_config_column,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'is_pamm_manager'
        ) THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as is_pamm_manager_column,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'pamm_config'
        ) THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as pamm_config_column;

-- =====================================================
-- 2. CREAR COLUMNAS FALTANTES SI NO EXISTEN
-- =====================================================

-- Agregar columna is_master_trader si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'is_master_trader'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN is_master_trader BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE 'Columna is_master_trader agregada a profiles';
    ELSE
        RAISE NOTICE 'Columna is_master_trader ya existe en profiles';
    END IF;
END $$;

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
        
        RAISE NOTICE 'Columna master_config agregada a profiles';
    ELSE
        RAISE NOTICE 'Columna master_config ya existe en profiles';
    END IF;
END $$;

-- Agregar columna is_pamm_manager si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'is_pamm_manager'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN is_pamm_manager BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE 'Columna is_pamm_manager agregada a profiles';
    ELSE
        RAISE NOTICE 'Columna is_pamm_manager ya existe en profiles';
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
        
        RAISE NOTICE 'Columna pamm_config agregada a profiles';
    ELSE
        RAISE NOTICE 'Columna pamm_config ya existe en profiles';
    END IF;
END $$;

-- =====================================================
-- 3. VERIFICAR TABLA COPY_RELATIONSHIPS
-- =====================================================

-- Verificar que la tabla copy_relationships existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'copy_relationships'
        ) THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as copy_relationships_table;

-- Si la tabla copy_relationships no existe, crearla
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'copy_relationships'
    ) THEN
        CREATE TABLE public.copy_relationships (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            master_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            follower_account VARCHAR(50) NOT NULL,
            master_account VARCHAR(50) NOT NULL,
            risk_ratio DECIMAL(5,4) DEFAULT 1.0000,
            status VARCHAR(20) DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            -- Constraints
            CONSTRAINT copy_relationships_risk_ratio_check CHECK (risk_ratio > 0 AND risk_ratio <= 10),
            CONSTRAINT copy_relationships_status_check CHECK (status IN ('active', 'paused', 'stopped')),
            CONSTRAINT copy_relationships_unique_follower_master UNIQUE (follower_id, master_id, follower_account)
        );
        
        -- Crear índices
        CREATE INDEX idx_copy_relationships_follower_id ON public.copy_relationships(follower_id);
        CREATE INDEX idx_copy_relationships_master_id ON public.copy_relationships(master_id);
        CREATE INDEX idx_copy_relationships_status ON public.copy_relationships(status);
        CREATE INDEX idx_copy_relationships_created_at ON public.copy_relationships(created_at);
        
        RAISE NOTICE 'Tabla copy_relationships creada con éxito';
    ELSE
        RAISE NOTICE 'Tabla copy_relationships ya existe';
    END IF;
END $$;

-- =====================================================
-- 4. CONFIGURAR ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en profiles si no está habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en copy_relationships si no está habilitado
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'copy_relationships'
    ) THEN
        ALTER TABLE public.copy_relationships ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS habilitado en copy_relationships';
    END IF;
END $$;

-- Crear políticas RLS para profiles (permitir lectura de master traders públicos)
DO $$ 
BEGIN
    -- Política para que los usuarios puedan ver profiles de master traders
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Allow read master traders'
    ) THEN
        CREATE POLICY "Allow read master traders" ON public.profiles
            FOR SELECT USING (
                is_master_trader = true OR 
                is_pamm_manager = true OR 
                auth.uid() = id
            );
        RAISE NOTICE 'Política "Allow read master traders" creada para profiles';
    END IF;
    
    -- Política para que los usuarios puedan actualizar su propio perfil
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Allow users to update own profile'
    ) THEN
        CREATE POLICY "Allow users to update own profile" ON public.profiles
            FOR UPDATE USING (auth.uid() = id);
        RAISE NOTICE 'Política "Allow users to update own profile" creada para profiles';
    END IF;
END $$;

-- Crear políticas RLS para copy_relationships
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'copy_relationships'
    ) THEN
        -- Política para que los usuarios puedan ver sus propias relaciones
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'copy_relationships' 
            AND policyname = 'Allow users to view own relationships'
        ) THEN
            CREATE POLICY "Allow users to view own relationships" ON public.copy_relationships
                FOR SELECT USING (
                    auth.uid() = follower_id OR 
                    auth.uid() = master_id
                );
            RAISE NOTICE 'Política "Allow users to view own relationships" creada para copy_relationships';
        END IF;
        
        -- Política para que los usuarios puedan crear relaciones como followers
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'copy_relationships' 
            AND policyname = 'Allow users to create relationships as follower'
        ) THEN
            CREATE POLICY "Allow users to create relationships as follower" ON public.copy_relationships
                FOR INSERT WITH CHECK (auth.uid() = follower_id);
            RAISE NOTICE 'Política "Allow users to create relationships as follower" creada para copy_relationships';
        END IF;
        
        -- Política para que los usuarios puedan actualizar sus propias relaciones
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'copy_relationships' 
            AND policyname = 'Allow users to update own relationships'
        ) THEN
            CREATE POLICY "Allow users to update own relationships" ON public.copy_relationships
                FOR UPDATE USING (
                    auth.uid() = follower_id OR 
                    auth.uid() = master_id
                );
            RAISE NOTICE 'Política "Allow users to update own relationships" creada para copy_relationships';
        END IF;
    END IF;
END $$;

-- =====================================================
-- 5. VERIFICAR CONFIGURACIÓN FINAL
-- =====================================================

-- Resumen final de la configuración
SELECT 
    'PROFILES TABLE' as component,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles'
        ) THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status

UNION ALL

SELECT 
    'is_master_trader COLUMN' as component,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'is_master_trader'
        ) THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status

UNION ALL

SELECT 
    'master_config COLUMN' as component,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'master_config'
        ) THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status

UNION ALL

SELECT 
    'is_pamm_manager COLUMN' as component,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'is_pamm_manager'
        ) THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status

UNION ALL

SELECT 
    'pamm_config COLUMN' as component,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'pamm_config'
        ) THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status

UNION ALL

SELECT 
    'copy_relationships TABLE' as component,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'copy_relationships'
        ) THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status

UNION ALL

SELECT 
    'RLS POLICIES' as component,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename IN ('profiles', 'copy_relationships')
        ) >= 4 THEN '✅ CONFIGURED' 
        ELSE '⚠️ INCOMPLETE' 
    END as status

ORDER BY component;

-- Mostrar políticas RLS existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'copy_relationships')
ORDER BY tablename, policyname;

-- =====================================================
-- 6. DATOS DE PRUEBA (OPCIONAL)
-- =====================================================

-- Comentar las siguientes líneas si no quieres datos de prueba

/*
-- Crear un usuario master trader de ejemplo (solo si no existe)
INSERT INTO public.profiles (
    id, 
    is_master_trader, 
    master_config,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    true,
    '{
        "strategy_name": "Scalping EUR/USD Pro",
        "description": "Estrategia de scalping profesional en EUR/USD con más de 5 años de experiencia",
        "commission_rate": 25,
        "max_risk": 10,
        "max_drawdown": 15,
        "markets": ["Forex"],
        "trading_hours": "08:00-18:00 GMT",
        "min_capital": 1000,
        "max_followers": 100,
        "master_mt5_account": "12345678",
        "experience_level": "Avanzado",
        "created_at": "2024-01-15T10:00:00Z"
    }'::jsonb,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE is_master_trader = true LIMIT 1
);

-- Crear un PAMM manager de ejemplo (solo si no existe)
INSERT INTO public.profiles (
    id, 
    is_pamm_manager, 
    pamm_config,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    true,
    '{
        "fund_name": "Alpha Growth Fund",
        "description": "Fondo de crecimiento diversificado con enfoque en mercados emergentes",
        "strategy_type": "Moderado",
        "management_fee": 2.0,
        "performance_fee": 20.0,
        "lockup_period": 30,
        "min_investment": 500,
        "max_risk": 15,
        "markets": ["Forex", "Acciones"],
        "trading_hours": "24/7",
        "pamm_mt5_account": "87654321",
        "min_capital": 10000,
        "max_capital": 100000,
        "created_at": "2024-01-20T14:30:00Z"
    }'::jsonb,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE is_pamm_manager = true LIMIT 1
);
*/

-- =====================================================
-- SCRIPT COMPLETADO
-- =====================================================

SELECT '🎉 Script de verificación completado. Revisa los resultados arriba.' as message;
