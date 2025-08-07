# 🎯 INSTRUCCIONES FINALES - CONFIGURACIÓN MANUAL DE SUPABASE

## ✅ MIGRACIÓN COMPLETADA

He completado exitosamente la migración de tu código de Firebase a Supabase. Todos los componentes y servicios ahora usan un adapter que permite cambiar entre Firebase y Supabase con una simple variable de entorno.

---

## 📋 PASOS MANUALES REQUERIDOS

### 1. CONFIGURAR LA BASE DE DATOS EN SUPABASE

1. **Accede a tu proyecto Supabase:**
   ```
   https://app.supabase.com/project/ukngiipxprielwdfuvln
   ```

2. **Ve al SQL Editor** (icono de base de datos en el menú lateral)

3. **Copia TODO el contenido del archivo:**
   ```
   supabase/migrations/001_create_tables.sql
   ```

4. **Pega el contenido en el SQL Editor y ejecuta** (botón Run)

   Esto creará:
   - 6 tablas principales (users, trading_accounts, transactions, etc.)
   - Políticas de seguridad RLS
   - Triggers automáticos
   - Funciones de base de datos
   - Índices para optimización

5. **Verifica que las tablas se crearon:**
   - Ve a "Table Editor" en el menú
   - Deberías ver las 6 tablas listadas

---

### 2. CONFIGURAR STORAGE EN SUPABASE

1. **Ve a Storage** en el menú lateral de Supabase

2. **Crea un nuevo bucket:**
   - Click en "New bucket"
   - Nombre: `profile-pictures`
   - Public bucket: ✅ Sí (marcar)
   - Click en "Create bucket"

3. **Configura las políticas del bucket:**
   - Click en el bucket `profile-pictures`
   - Ve a "Policies"
   - Click en "New Policy"
   - Selecciona "For full customization"
   - Nombre: `Allow authenticated uploads`
   - Policy:
   ```sql
   (auth.role() = 'authenticated'::text)
   ```
   - Aplicar a: SELECT, INSERT, UPDATE, DELETE

---

### 3. CONFIGURAR AUTENTICACIÓN EN SUPABASE

1. **Ve a Authentication → Settings**

2. **En la pestaña "General":**
   - Site URL: `http://localhost:5173` (o tu URL de producción)
   - Redirect URLs: Agrega `http://localhost:5173/*`

3. **En la pestaña "Email Templates":**
   - Personaliza los templates si lo deseas
   - Asegúrate de que "Enable email confirmations" esté activado

4. **En la pestaña "Auth Providers":**
   - Email/Password ya debería estar habilitado por defecto

---

### 4. PROBAR LA MIGRACIÓN

#### Opción A: Seguir usando Firebase (por defecto)
No necesitas hacer nada. El proyecto seguirá funcionando con Firebase como hasta ahora.

#### Opción B: Cambiar a Supabase
1. **Edita el archivo `.env`:**
   ```env
   # Cambia esta línea:
   VITE_DATABASE_PROVIDER=firebase
   
   # Por esta:
   VITE_DATABASE_PROVIDER=supabase
   ```

2. **Reinicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

3. **Prueba las funcionalidades:**
   - ✅ Registro de nuevo usuario
   - ✅ Login con email
   - ✅ Recuperación de contraseña
   - ✅ Crear cuenta de trading
   - ✅ Subir foto de perfil
   - ✅ Realizar transacciones

---

## 🔄 MIGRACIÓN DE DATOS (OPCIONAL)

Si tienes datos en Firebase que quieres migrar a Supabase:

### Opción 1: Exportación Manual desde Firebase Console

1. Ve a Firebase Console → Firestore
2. Exporta cada colección como JSON
3. Importa en Supabase usando el SQL Editor

### Opción 2: Script Automático

1. **Instala Firebase Admin SDK:**
   ```bash
   npm install firebase-admin --save-dev
   ```

2. **Crea el archivo `scripts/migrate-data.js`:**
   ```javascript
   // Ver el archivo MIGRATION_GUIDE.md para el script completo
   ```

3. **Ejecuta la migración:**
   ```bash
   node scripts/migrate-data.js
   ```

---

## 🚨 IMPORTANTE - ANTES DE IR A PRODUCCIÓN

### 1. Seguridad
- [ ] Revisa todas las políticas RLS en Supabase
- [ ] Asegúrate de que las API keys están en variables de entorno
- [ ] NO expongas el service role key en el frontend

### 2. Testing
- [ ] Prueba todas las funcionalidades con Supabase
- [ ] Verifica que los datos se guardan correctamente
- [ ] Comprueba que las imágenes se suben correctamente

### 3. Backup
- [ ] Haz backup de Firebase antes de migrar datos
- [ ] Guarda una copia del proyecto con Firebase funcionando

### 4. Monitoreo
- [ ] Configura alertas en Supabase Dashboard
- [ ] Revisa los logs después del despliegue

---

## 📊 RESUMEN DE CAMBIOS REALIZADOS

### Archivos Creados:
- `src/supabase/config.js` - Configuración del cliente Supabase
- `src/supabase/auth.js` - Servicios de autenticación
- `src/supabase/storage.js` - Servicios de storage
- `src/services/database.adapter.js` - Adapter para cambiar entre proveedores
- `supabase/migrations/001_create_tables.sql` - Script de base de datos
- `MIGRATION_GUIDE.md` - Guía completa de migración

### Archivos Modificados (21 archivos):
- `.env` - Agregadas variables de Supabase
- `package.json` - Agregada dependencia @supabase/supabase-js
- `src/contexts/AuthContext.jsx` - Usa el adapter
- `src/components/Login.jsx` - Usa el adapter
- `src/components/Register.jsx` - Usa el adapter
- `src/components/ForgotPassword.jsx` - Usa el adapter
- `src/components/UserInformationContent.jsx` - Usa el adapter
- `src/components/TradingAccounts.jsx` - Usa el adapter
- `src/components/Wallet.jsx` - Usa el adapter
- `src/components/PaymentMethodSettings.jsx` - Usa el adapter
- `src/components/PipCalculator.jsx` - Usa el adapter
- `src/components/AfiliadosDashboard.jsx` - Usa el adapter
- `src/components/Home.jsx` - Usa el adapter
- `src/App.jsx` - Usa el adapter
- `src/services/tradingAccounts.js` - Usa el adapter
- `src/services/copytradingService.js` - Usa el adapter
- `src/services/pammService.js` - Usa el adapter

---

## 🆘 SOPORTE

Si encuentras algún problema:

1. **Revisa los logs del navegador** (F12 → Console)
2. **Revisa los logs de Supabase** (Dashboard → Logs → API)
3. **Verifica las variables de entorno** en `.env`
4. **Asegúrate de que ejecutaste el SQL** completo

### Errores Comunes:

**Error: "Missing Supabase configuration"**
- Solución: Verifica que las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY estén en `.env`

**Error: "User not found"**
- Solución: El usuario no existe en Supabase. Regístrate de nuevo.

**Error: "Permission denied"**
- Solución: Revisa las políticas RLS en Supabase

---

## ✅ PRÓXIMOS PASOS

1. **Ejecuta el SQL en Supabase** (paso más importante)
2. **Configura el Storage**
3. **Prueba con `VITE_DATABASE_PROVIDER=supabase`**
4. **Si todo funciona, migra los datos**
5. **Despliega en producción**

---

## 🎉 ¡FELICIDADES!

Tu proyecto ahora puede funcionar tanto con Firebase como con Supabase. Puedes cambiar entre ambos proveedores en cualquier momento simplemente cambiando una variable de entorno.

**Recuerda:** El proyecto seguirá funcionando con Firebase hasta que cambies `VITE_DATABASE_PROVIDER` a `supabase`.

---

**Fecha de migración:** Enero 2025
**Versión de Supabase:** @supabase/supabase-js@2.53.0
**Estado:** ✅ Migración de código completada - Pendiente configuración manual en Supabase Dashboard