-- Agregar constraint único para evitar duplicados en trades replicados

-- 1. Verificar si ya existe el constraint
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'trades' 
  AND constraint_type = 'UNIQUE';

-- 2. Agregar constraint único (ejecutar solo si no existe)
ALTER TABLE trades 
ADD CONSTRAINT trades_account_tradeid_unique 
UNIQUE (mt5_account, trade_id);

-- 3. Verificar que se creó correctamente
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'trades' 
  AND constraint_type = 'UNIQUE';
