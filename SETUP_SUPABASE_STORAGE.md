# Configuración de Storage y Payment Methods en Supabase

## Errores Actuales
1. **Error 404**: La tabla `payment_methods` no existe
2. **Error 400**: El bucket de storage `profile-pictures` no está configurado correctamente

## Solución Paso a Paso

### Paso 1: Ejecutar el SQL para crear la tabla payment_methods

1. Ir al panel de Supabase: https://app.supabase.com
2. Seleccionar tu proyecto
3. Ir a "SQL Editor" en el menú lateral
4. Copiar y pegar TODO el contenido del archivo `fix_payment_methods_and_storage.sql`
5. Hacer clic en "Run" para ejecutar

### Paso 2: Crear el bucket de storage manualmente

1. En el panel de Supabase, ir a "Storage" en el menú lateral
2. Hacer clic en "New bucket"
3. Configurar:
   - **Name**: `profile-pictures`
   - **Public bucket**: ✅ Activado
   - **File size limit**: 5MB
   - **Allowed MIME types**: 
     - image/png
     - image/jpeg
     - image/jpg
     - image/gif
     - image/webp
4. Hacer clic en "Create bucket"

### Paso 3: Configurar las políticas del bucket

1. En Storage, hacer clic en el bucket `profile-pictures`
2. Ir a la pestaña "Policies"
3. Hacer clic en "New Policy"
4. Seleccionar "For full customization" 
5. Crear las siguientes políticas:

#### Política 1: Subir fotos propias
- **Policy name**: `Users can upload own profile pictures`
- **Target roles**: `authenticated`
- **WITH CHECK expression**:
```sql
(bucket_id = 'profile-pictures') AND (auth.uid()::text = (storage.foldername(name))[1])
```

#### Política 2: Ver todas las fotos (público)
- **Policy name**: `Anyone can view profile pictures`
- **Target roles**: `anon, authenticated`
- **USING expression**:
```sql
bucket_id = 'profile-pictures'
```

#### Política 3: Actualizar fotos propias
- **Policy name**: `Users can update own profile pictures`
- **Target roles**: `authenticated`
- **USING expression**:
```sql
(bucket_id = 'profile-pictures') AND (auth.uid()::text = (storage.foldername(name))[1])
```

#### Política 4: Eliminar fotos propias
- **Policy name**: `Users can delete own profile pictures`
- **Target roles**: `authenticated`
- **USING expression**:
```sql
(bucket_id = 'profile-pictures') AND (auth.uid()::text = (storage.foldername(name))[1])
```

### Paso 4: Verificar la configuración

Ejecuta este SQL en el SQL Editor para verificar:

```sql
-- Verificar tabla payment_methods
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'payment_methods'
) as payment_methods_exists;

-- Verificar bucket
SELECT * FROM storage.buckets WHERE id = 'profile-pictures';

-- Verificar políticas
SELECT * FROM storage.policies WHERE bucket_id = 'profile-pictures';
```

### Paso 5: Probar la funcionalidad

1. Recargar la aplicación
2. Intentar subir una foto de perfil
3. Intentar agregar un método de pago

## Solución de Problemas

### Si el error 400 persiste al subir fotos:

1. Verificar que el usuario esté autenticado
2. Verificar el tamaño del archivo (máximo 5MB)
3. Verificar el formato del archivo (solo imágenes)
4. Revisar los logs en Supabase Dashboard > Logs > API

### Si el error 404 persiste para payment_methods:

1. Verificar que la tabla existe:
```sql
SELECT * FROM payment_methods LIMIT 1;
```

2. Verificar las políticas RLS:
```sql
SELECT * FROM pg_policies WHERE tablename = 'payment_methods';
```

## Notas Importantes

- La Service Role Key solo debe usarse en scripts de configuración, NUNCA en el frontend
- Las políticas de RLS son cruciales para la seguridad
- El bucket debe ser público para que las fotos sean visibles
- Los archivos se organizan por user_id para mantener orden