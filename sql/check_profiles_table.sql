-- Verificar si existe la tabla profiles y ver su estructura
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;