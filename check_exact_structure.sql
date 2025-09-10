-- Ver estructura EXACTA de affiliate_tiers
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'affiliate_tiers'
ORDER BY ordinal_position;

-- Ver si la tabla tiene datos
SELECT COUNT(*) as total_registros FROM affiliate_tiers;

-- Ver un ejemplo si existe
SELECT * FROM affiliate_tiers LIMIT 1;