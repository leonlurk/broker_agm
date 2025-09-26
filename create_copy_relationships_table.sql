-- Crear tabla copy_relationships para Copy Trading
CREATE TABLE IF NOT EXISTS copy_relationships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    master_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    follower_mt5_account_id BIGINT NOT NULL,
    risk_ratio DECIMAL(4,3) DEFAULT 1.0 CHECK (risk_ratio >= 0.01 AND risk_ratio <= 1.0),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(master_id, follower_id),
    CHECK (master_id != follower_id)
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_copy_relationships_master_id ON copy_relationships(master_id);
CREATE INDEX IF NOT EXISTS idx_copy_relationships_follower_id ON copy_relationships(follower_id);
CREATE INDEX IF NOT EXISTS idx_copy_relationships_status ON copy_relationships(status);
CREATE INDEX IF NOT EXISTS idx_copy_relationships_mt5_account ON copy_relationships(follower_mt5_account_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE copy_relationships ENABLE ROW LEVEL SECURITY;

-- Política RLS: Los usuarios pueden ver sus propias relaciones como master o follower
CREATE POLICY "Users can view their own copy relationships" ON copy_relationships
    FOR SELECT USING (
        auth.uid() = master_id OR 
        auth.uid() = follower_id
    );

-- Política RLS: Los usuarios pueden crear relaciones donde son el follower
CREATE POLICY "Users can create relationships as follower" ON copy_relationships
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Política RLS: Los usuarios pueden actualizar sus propias relaciones
CREATE POLICY "Users can update their own relationships" ON copy_relationships
    FOR UPDATE USING (
        auth.uid() = master_id OR 
        auth.uid() = follower_id
    );

-- Política RLS: Los usuarios pueden eliminar sus propias relaciones
CREATE POLICY "Users can delete their own relationships" ON copy_relationships
    FOR DELETE USING (
        auth.uid() = master_id OR 
        auth.uid() = follower_id
    );

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_copy_relationships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_copy_relationships_updated_at
    BEFORE UPDATE ON copy_relationships
    FOR EACH ROW
    EXECUTE FUNCTION update_copy_relationships_updated_at();
