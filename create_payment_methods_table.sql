-- ============================================
-- Crear tabla para métodos de pago de usuarios
-- ============================================

-- Crear la tabla payment_methods si no existe
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('crypto', 'bank')),
    alias VARCHAR(255) NOT NULL,
    
    -- Campos para crypto
    network VARCHAR(100), -- 'tron_trc20', 'ethereum_erc20', 'bitcoin'
    address TEXT,
    
    -- Campos para banco
    cbu VARCHAR(30),
    holder_name VARCHAR(255),
    holder_id VARCHAR(20),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    -- Constraints
    CONSTRAINT valid_crypto_method CHECK (
        (type = 'crypto' AND network IS NOT NULL AND address IS NOT NULL) OR type != 'crypto'
    ),
    CONSTRAINT valid_bank_method CHECK (
        (type = 'bank' AND cbu IS NOT NULL AND holder_name IS NOT NULL AND holder_id IS NOT NULL) OR type != 'bank'
    )
);

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_type ON payment_methods(type);
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(is_active);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_methods_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propios métodos de pago
CREATE POLICY "Users can view own payment methods" ON payment_methods
    FOR SELECT USING (auth.uid() = user_id);

-- Política: Los usuarios pueden insertar sus propios métodos de pago
CREATE POLICY "Users can insert own payment methods" ON payment_methods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden actualizar sus propios métodos de pago
CREATE POLICY "Users can update own payment methods" ON payment_methods
    FOR UPDATE USING (auth.uid() = user_id);

-- Política: Los usuarios pueden eliminar sus propios métodos de pago
CREATE POLICY "Users can delete own payment methods" ON payment_methods
    FOR DELETE USING (auth.uid() = user_id);

-- Agregar comentarios para documentación
COMMENT ON TABLE payment_methods IS 'Métodos de pago configurados por los usuarios';
COMMENT ON COLUMN payment_methods.type IS 'Tipo de método: crypto o bank';
COMMENT ON COLUMN payment_methods.alias IS 'Nombre personalizado dado por el usuario';
COMMENT ON COLUMN payment_methods.network IS 'Red de crypto: tron_trc20, ethereum_erc20, bitcoin';
COMMENT ON COLUMN payment_methods.address IS 'Dirección de billetera crypto';
COMMENT ON COLUMN payment_methods.cbu IS 'CBU/CVU para transferencias bancarias';
COMMENT ON COLUMN payment_methods.holder_name IS 'Nombre del titular de la cuenta bancaria';
COMMENT ON COLUMN payment_methods.holder_id IS 'CUIT/CUIL del titular';

-- Verificar que la tabla se creó correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'payment_methods'
ORDER BY 
    ordinal_position;