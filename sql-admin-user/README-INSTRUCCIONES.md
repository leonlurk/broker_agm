# 🔐 Crear Usuario Administrador en Supabase

## 📋 Orden de Ejecución

Sigue estos pasos **EN ORDEN** para crear tu usuario administrador:

---

## ✅ PASO 1: Explorar estructura actual

**Archivo:** `01_explorar_estructura_usuarios.sql`

**Qué hace:**
- Muestra la estructura de la tabla `profiles`
- Lista usuarios existentes y sus roles
- Muestra qué roles hay en el sistema

**Cómo ejecutar:**
1. Abre **Supabase Dashboard**
2. Ve a **SQL Editor**
3. Copia y pega TODO el contenido de `01_explorar_estructura_usuarios.sql`
4. Click en **RUN**
5. **REVISA LOS RESULTADOS** para ver si ya tienes admins o usuarios existentes

**¿Qué buscar?**
- Si ves usuarios con `role = 'admin'` → Ya tienes admins
- Si ves tu email en la lista → Puedes usar el archivo OPCIONAL (paso 4)

---

## ✅ PASO 2: Crear usuario administrador

**Archivo:** `02_crear_usuario_admin_completo.sql`

**⚠️ ANTES DE EJECUTAR:**
1. Abre el archivo `02_crear_usuario_admin_completo.sql`
2. **Busca estas 3 líneas** (están cerca del inicio):
   ```sql
   v_email TEXT := 'admin@tudominio.com';  -- ✅ CAMBIAR ESTE EMAIL
   v_password TEXT := 'AdminPassword2025!';  -- ✅ CAMBIAR ESTE PASSWORD
   v_username TEXT := 'admin';  -- ✅ CAMBIAR USERNAME
   ```
3. **Reemplaza** con tus datos reales:
   - Email que quieres usar para el admin
   - Password seguro (mínimo 8 caracteres)
   - Username único

**Cómo ejecutar:**
1. Copia TODO el contenido (después de hacer los cambios arriba)
2. Pégalo en **Supabase SQL Editor**
3. Click en **RUN**
4. Verás mensajes como:
   ```
   ✅ Usuario creado en auth.users con ID: xxx
   ✅ Perfil creado en public.profiles con rol admin
   ✅ USUARIO ADMINISTRADOR CREADO!
   ```

**Si ves errores:**
- `duplicate key value` → El email ya existe, usa el archivo OPCIONAL (paso 4)
- `permission denied` → Estás usando el client key, usa el **service_role key**
- `profiles_kyc_status_check` → ✅ **YA CORREGIDO**, el archivo incluye `kyc_status = 'not_submitted'`

---

## ✅ PASO 3: Verificar que funciona

**Archivo:** `03_verificar_admin_creado.sql`

**Qué hace:**
- Verifica que el usuario existe en `auth.users`
- Verifica que el perfil tiene `role = 'admin'`
- Muestra todos los datos del usuario creado

**Cómo ejecutar:**
1. Abre el archivo `03_verificar_admin_creado.sql`
2. **Busca estas líneas** (aparece 3 veces):
   ```sql
   WHERE email = 'admin@tudominio.com';  -- ✅ CAMBIAR ESTE EMAIL
   ```
3. Reemplaza con el email que usaste en el PASO 2
4. Copia TODO y pégalo en **Supabase SQL Editor**
5. Click en **RUN**

**¿Qué deberías ver?**
- ✅ Una fila en la primera query con tu email
- ✅ `role = 'admin'` en la segunda query
- ✅ `status = 'active'` en todas las queries

---

## 🔄 OPCIONAL: Convertir usuario existente a admin

**Archivo:** `04_OPCIONAL_convertir_usuario_existente_a_admin.sql`

**¿Cuándo usar esto?**
- Si YA tienes un usuario registrado
- Y solo quieres cambiarle el rol a `admin`
- **NO crea un usuario nuevo**, solo modifica uno existente

**Cómo ejecutar:**
1. Abre el archivo `04_OPCIONAL_convertir_usuario_existente_a_admin.sql`
2. Reemplaza `'tu-email@dominio.com'` (aparece 3 veces) con tu email real
3. Ejecuta en **Supabase SQL Editor**
4. Verifica que ahora tiene `role = 'admin'`

---

## 🔑 Acceso a Supabase SQL Editor

### Opción A: Con Service Role Key (RECOMENDADO)

1. Ve a **Supabase Dashboard** → **Settings** → **API**
2. Copia el **service_role key** (secret, no la pública)
3. En SQL Editor, usa el toggle para cambiar a **service_role**

### Opción B: Desde la consola

1. Ve a **SQL Editor** en el dashboard
2. Asegúrate de estar autenticado como propietario del proyecto
3. Los scripts deberían funcionar directamente

---

## 📊 Resumen rápido

| Paso | Archivo | Acción | ¿Obligatorio? |
|------|---------|--------|---------------|
| 1 | `01_explorar_estructura_usuarios.sql` | Ver estructura actual | ✅ Sí |
| 2 | `02_crear_usuario_admin_completo.sql` | Crear admin nuevo | ✅ Sí (si no tienes admin) |
| 3 | `03_verificar_admin_creado.sql` | Verificar creación | ✅ Sí |
| 4 | `04_OPCIONAL_convertir_usuario_existente_a_admin.sql` | Convertir existente | ⚪ Solo si aplica |

---

## ⚠️ Seguridad

- **NO commitear** estos archivos SQL con credenciales reales a Git
- Usa passwords fuertes (mínimo 12 caracteres, números, símbolos)
- Guarda el password del admin en un lugar seguro
- Considera usar el archivo `.env` para passwords en producción

---

## 🐛 Troubleshooting

### Error: "permission denied for table auth.users"

**Solución:** Usa el **service_role key** en lugar del anon key

### Error: "duplicate key value violates unique constraint"

**Solución:** El email ya existe, usa el archivo OPCIONAL (04) para convertir ese usuario a admin

### Error: "function crypt does not exist"

**Solución:** Ejecuta primero:
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### No veo mensajes de RAISE NOTICE

**Solución:** En Supabase SQL Editor, los mensajes pueden no mostrarse. Verifica directamente con el archivo 03.

---

## ✅ Checklist final

Después de ejecutar todo, verifica:

- [ ] Ejecuté PASO 1 y revisé la estructura
- [ ] Edité el archivo PASO 2 con mis credenciales reales
- [ ] Ejecuté PASO 2 y vi mensajes de éxito
- [ ] Ejecuté PASO 3 y confirmé `role = 'admin'`
- [ ] Guardé el password en un lugar seguro
- [ ] Puedo iniciar sesión con el nuevo usuario admin

---

**¿Todo listo? Ahora deberías tener un usuario administrador funcionando! 🚀**
