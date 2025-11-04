-- ===============================
-- VERIFICAR SI PERFIL FUE ACTUALIZADO COMO MASTER TRADER
-- ===============================

-- 1. Ver tu perfil completo
SELECT
    id,
    email,
    is_master_trader,
    master_config,
    created_at,
    updated_at
FROM profiles
WHERE id = 'a153a6d6-e48d-4297-9a64-395c462e138f';

-- 2. Ver TODOS los perfiles que son master traders
SELECT
    id,
    email,
    is_master_trader,
    master_config->>'strategy_name' as strategy_name,
    master_config->>'master_mt5_account' as mt5_account,
    created_at
FROM profiles
WHERE is_master_trader = true
ORDER BY updated_at DESC;

-- 3. Verificar si master_config tiene datos
SELECT
    id,
    email,
    jsonb_pretty(master_config) as master_config_formatted
FROM profiles
WHERE id = 'a153a6d6-e48d-4297-9a64-395c462e138f';
