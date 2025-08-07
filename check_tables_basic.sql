-- =====================================================
-- CONSULTAS BÁSICAS PARA ENTENDER LA ESTRUCTURA
-- =====================================================

-- 1. VER CONTENIDO DE USERS
SELECT * FROM users LIMIT 5;

-- 2. VER CONTENIDO DE PROFILES
SELECT * FROM profiles LIMIT 5;

-- 3. CONTAR REGISTROS
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_profiles FROM profiles;

-- 4. VER BROKER_ACCOUNTS
SELECT * FROM broker_accounts LIMIT 5;

-- 5. VER TRADING_ACCOUNTS
SELECT * FROM trading_accounts LIMIT 5;

-- 6. BUSCAR 'mrlurk' EN USERS
SELECT * FROM users WHERE username = 'mrlurk';

-- 7. BUSCAR 'mrlurk' EN PROFILES  
SELECT * FROM profiles WHERE username = 'mrlurk';

-- 8. VER SI HAY RELACIÓN ENTRE TABLAS (simple)
-- Ver si broker_accounts tiene user_id
SELECT DISTINCT user_id FROM broker_accounts LIMIT 5;

-- 9. Ver si trading_accounts tiene user_id
SELECT DISTINCT user_id FROM trading_accounts LIMIT 5;

-- 10. Ver estructura de una fila de users
SELECT * FROM users WHERE id IS NOT NULL LIMIT 1;

-- 11. Ver estructura de una fila de profiles
SELECT * FROM profiles WHERE id IS NOT NULL LIMIT 1;