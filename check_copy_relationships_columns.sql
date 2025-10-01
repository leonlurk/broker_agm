-- Ver todas las columnas de copy_relationships con detalles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'copy_relationships'
ORDER BY ordinal_position;

-- Ver datos de ejemplo para entender la estructura
SELECT * FROM copy_relationships LIMIT 3;

-- Ver si hay registros con master_mt5_account_id nulo
SELECT 
    COUNT(*) as total_records,
    COUNT(master_mt5_account_id) as records_with_master_account,
    COUNT(*) - COUNT(master_mt5_account_id) as null_master_accounts
FROM copy_relationships;
