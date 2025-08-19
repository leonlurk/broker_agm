# Configuración del Bucket KYC-Documents

## 🚨 Problema Actual
- Error: `Bucket not found` al intentar subir documentos KYC
- El bucket `kyc-documents` no existe en Supabase Storage

## ✅ Solución Paso a Paso

### 1. Ejecutar el SQL de configuración
Ejecuta el archivo `setup_kyc_storage.sql` en tu Supabase SQL Editor para crear:
- Tabla `kyc_verifications`
- Columnas KYC en la tabla `profiles`
- Políticas RLS necesarias

### 2. Crear el Bucket KYC-Documents

1. **Ir a Supabase Dashboard** → Storage
2. Click en **"New bucket"**
3. Configurar con estos valores EXACTOS:

   | Campo | Valor |
   |-------|-------|
   | **Name** | `kyc-documents` |
   | **Public bucket** | ❌ **NO** (debe ser privado) |
   | **File size limit** | `10485760` (10MB) |
   | **Allowed MIME types** | |
   | | `image/jpeg` |
   | | `image/jpg` |
   | | `image/png` |
   | | `image/pdf` |
   | | `application/pdf` |

4. Click en **"Create bucket"**

### 3. Configurar las Políticas del Bucket

Después de crear el bucket, configura las políticas:

1. Click en el bucket `kyc-documents`
2. Ir a la pestaña **"Policies"**
3. Click en **"New Policy"** → **"For full customization"**

#### Política 1: Usuarios suben sus documentos
- **Policy name**: `Users upload own KYC`
- **Allowed operation**: INSERT
- **Target roles**: `authenticated`
- **WITH CHECK expression**: 
```sql
(bucket_id = 'kyc-documents') AND (auth.uid()::text = (storage.foldername(name))[1])
```

#### Política 2: Usuarios ven sus documentos
- **Policy name**: `Users view own KYC`
- **Allowed operation**: SELECT
- **Target roles**: `authenticated`
- **USING expression**:
```sql
(bucket_id = 'kyc-documents') AND (auth.uid()::text = (storage.foldername(name))[1])
```

#### Política 3: Usuarios actualizan sus documentos
- **Policy name**: `Users update own KYC`
- **Allowed operation**: UPDATE
- **Target roles**: `authenticated`
- **USING expression**:
```sql
(bucket_id = 'kyc-documents') AND (auth.uid()::text = (storage.foldername(name))[1])
```

#### Política 4: Usuarios eliminan sus documentos
- **Policy name**: `Users delete own KYC`
- **Allowed operation**: DELETE
- **Target roles**: `authenticated`
- **USING expression**:
```sql
(bucket_id = 'kyc-documents') AND (auth.uid()::text = (storage.foldername(name))[1])
```

### 4. Verificar la Configuración

Ejecuta este SQL para verificar:

```sql
-- Verificar bucket
SELECT * FROM storage.buckets WHERE id = 'kyc-documents';

-- Verificar políticas
SELECT * FROM storage.policies WHERE bucket_id = 'kyc-documents';

-- Verificar tabla KYC
SELECT * FROM kyc_verifications LIMIT 1;
```

## 🔒 Seguridad Importante

- El bucket KYC **DEBE ser privado** (no público)
- Solo el usuario dueño puede ver/modificar sus documentos
- Los documentos se organizan por userId: `{userId}/front_xxx.png`
- Los administradores necesitarán políticas adicionales para revisar KYC

## 🎯 Después de Configurar

1. **Recarga la aplicación** (F5)
2. **Intenta subir documentos KYC** nuevamente
3. Los archivos se subirán a: `kyc-documents/{userId}/{document_type}_{timestamp}.{ext}`

## ⚠️ Nota sobre los cambios en el código

Ya corregí el código para usar `currentUser.id` en lugar de `currentUser.uid` que estaba causando el error de `undefined` en la ruta.

## 📝 Checklist

- [ ] SQL ejecutado (`setup_kyc_storage.sql`)
- [ ] Bucket `kyc-documents` creado
- [ ] Bucket configurado como PRIVADO
- [ ] 4 políticas creadas
- [ ] Aplicación recargada
- [ ] KYC funcionando correctamente