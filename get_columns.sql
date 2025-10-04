-- Get profiles table columns
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Get copy_relationships table columns
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'copy_relationships'
ORDER BY ordinal_position;

-- Get master_traders table columns (I see this exists too)
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'master_traders'
ORDER BY ordinal_position;
