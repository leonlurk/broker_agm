-- ====================================
-- AGREGAR COLUMNAS FALTANTES A KYC_VERIFICATIONS
-- ====================================

-- Agregar columnas que faltan en la tabla kyc_verifications
ALTER TABLE kyc_verifications 
ADD COLUMN IF NOT EXISTS document_country VARCHAR(100),
ADD COLUMN IF NOT EXISTS residence_country VARCHAR(100),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- Verificar que las columnas se agregaron
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'kyc_verifications'
ORDER BY ordinal_position;

-- Mensaje de confirmación
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Columnas agregadas exitosamente:';
    RAISE NOTICE '   - document_country';
    RAISE NOTICE '   - residence_country';
    RAISE NOTICE '   - email';
    RAISE NOTICE '   - phone';
    RAISE NOTICE '';
    RAISE NOTICE 'La tabla kyc_verifications está lista para usar.';
END $$;