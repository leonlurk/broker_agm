-- SQL para verificar si los documentos KYC se están guardando correctamente

-- 1. Verificar si existe el bucket kyc-documents
SELECT 
    id as bucket_id,
    name as bucket_name,
    public as is_public,
    created_at
FROM storage.buckets
WHERE name = 'kyc-documents';

-- 2. Ver las últimas verificaciones KYC enviadas
SELECT 
    id,
    user_id,
    email,
    status,
    document_type,
    front_document_url,
    back_document_url,
    selfie_url,
    address_proof_url,
    submitted_at,
    created_at
FROM kyc_verifications
ORDER BY created_at DESC
LIMIT 10;

-- 3. Buscar específicamente el KYC del usuario de los logs
SELECT 
    id,
    user_id,
    email,
    status,
    document_type,
    submitted_at,
    CASE 
        WHEN front_document_url IS NOT NULL THEN 'Sí' 
        ELSE 'No' 
    END as tiene_front,
    CASE 
        WHEN back_document_url IS NOT NULL THEN 'Sí' 
        ELSE 'No' 
    END as tiene_back,
    CASE 
        WHEN selfie_url IS NOT NULL THEN 'Sí' 
        ELSE 'No' 
    END as tiene_selfie,
    CASE 
        WHEN address_proof_url IS NOT NULL THEN 'Sí' 
        ELSE 'No' 
    END as tiene_address
FROM kyc_verifications
WHERE user_id = '82dece2b-9f56-4677-858c-75d9dc96f506'
   OR email = 'chagpteam@gmail.com'
ORDER BY created_at DESC;

-- 4. Ver archivos en el bucket de storage (si tienes permisos)
SELECT 
    name as file_name,
    created_at,
    updated_at,
    metadata
FROM storage.objects
WHERE bucket_id = 'kyc-documents'
ORDER BY created_at DESC
LIMIT 20;

-- 5. Verificar el estado KYC en profiles
SELECT 
    id,
    email,
    kyc_status,
    kyc_verified_at,
    kyc_level
FROM profiles
WHERE id = '82dece2b-9f56-4677-858c-75d9dc96f506'
   OR email = 'chagpteam@gmail.com';