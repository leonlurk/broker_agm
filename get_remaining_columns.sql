-- Get copy_relationships table columns
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'copy_relationships'
ORDER BY ordinal_position;
