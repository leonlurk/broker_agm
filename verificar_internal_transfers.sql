-- Verificar estructura exacta de la tabla internal_transfers
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'internal_transfers'
ORDER BY ordinal_position;

-- Ver también si hay alguna transferencia existente para entender el flujo
SELECT 
    id,
    status,
    from_account_id,
    to_account_id,
    amount,
    approved_at,
    approved_by,
    rejection_reason,
    admin_notes,
    created_at
FROM internal_transfers
LIMIT 5;