-- Script simplificado - Solo ejecuta uno a la vez para ver las columnas

-- Opción 1: Ver solo los NOMBRES de columnas de deposits
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'deposits' 
AND table_schema = 'public';

-- Opción 2: Ver solo los NOMBRES de columnas de withdrawals  
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'withdrawals' 
AND table_schema = 'public';

-- Opción 3: Ver solo los NOMBRES de columnas de transactions
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
AND table_schema = 'public';