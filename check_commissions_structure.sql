-- Ver estructura EXACTA de affiliate_commissions
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'affiliate_commissions'
ORDER BY ordinal_position;