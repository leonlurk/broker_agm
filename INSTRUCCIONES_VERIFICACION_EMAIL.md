# ✅ Sistema de Verificación de Email - Instrucciones de Implementación

## Estado Actual
El sistema de verificación de email ha sido completamente restaurado y mejorado. Todos los archivos han sido actualizados para usar correctamente la tabla `profiles`.

## Cambios Realizados

### 1. ✅ Verificación de Email Restaurada
- `src/App.jsx`: Verificación de email restaurada en rutas
- `src/components/Login.jsx`: Verificación de email restaurada después del login

### 2. ✅ Corrección de Referencias a Tablas
Todos los archivos ahora usan `profiles` en lugar de `users`:
- `src/supabase/auth.js`
- `src/services/twoFactorService.js`
- `src/services/kycService.js`

### 3. ✅ Script SQL Creado
- `fix_email_verification_permissions_v2.sql`: Script completo para configurar permisos

## 🚀 Pasos para Implementar

### Paso 1: Ejecutar el Script SQL
1. Abre Supabase Dashboard
2. Ve a **SQL Editor**
3. Copia todo el contenido de `fix_email_verification_permissions_v2.sql`
4. Pégalo en el editor
5. Haz clic en **Run**

### Paso 2: Verificar la Configuración
Ejecuta estas queries en el SQL Editor para confirmar:

```sql
-- Verificar que las columnas existan
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('email_verified', 'verification_token');

-- Verificar las políticas RLS
SELECT policyname FROM pg_policies WHERE tablename = 'profiles';

-- Verificar las funciones
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('verify_user_email', 'request_email_verification');
```

### Paso 3: Probar el Sistema
1. **Registrar un nuevo usuario**: Debería recibir un email de verificación
2. **Intentar acceder al dashboard**: Debería redirigir a la página de verificación pendiente
3. **Reenviar email**: El botón de reenvío debería funcionar (con rate limiting de 60 segundos)
4. **Verificar email**: Hacer clic en el enlace del email debería verificar la cuenta

## 📋 Checklist de Verificación

- [ ] Script SQL ejecutado sin errores
- [ ] Las 3 funciones SQL creadas correctamente
- [ ] Columnas `email_verified` y `verification_token` existen en `profiles`
- [ ] Políticas RLS configuradas
- [ ] Registro de nuevo usuario envía email
- [ ] Reenvío de email funciona con rate limiting
- [ ] Verificación por enlace funciona
- [ ] Usuario verificado puede acceder al dashboard

## 🔧 Solución de Problemas

### Error 406 al reenviar email
**Causa**: Permisos RLS incorrectos
**Solución**: Ejecutar el script SQL proporcionado

### No se envían emails
**Causa**: Configuración del servicio de email
**Verificar**:
- El endpoint `https://whapy.apekapital.com:446/api` está activo
- Las credenciales de API están configuradas

### Token inválido al verificar
**Causa**: Token expirado o no existe
**Solución**: Usar el botón de reenvío para generar un nuevo token

## 📝 Notas Importantes

1. **Tabla Correcta**: El sistema usa la tabla `profiles`, NO `users`
2. **Rate Limiting**: 60 segundos entre reenvíos de email
3. **Seguridad**: Las políticas RLS permiten lectura pública pero actualizaciones controladas
4. **Fallback**: Si el backend falla, el sistema intenta verificación directa con Supabase

## 🎯 Resultado Esperado

Después de implementar estos cambios:
1. Los usuarios nuevos deben verificar su email antes de acceder
2. El botón de reenvío funciona sin errores 406
3. Los enlaces de verificación funcionan correctamente
4. El sistema es seguro y previene spam con rate limiting

---

**Última actualización**: 2025-09-02
**Estado**: ✅ Listo para implementar