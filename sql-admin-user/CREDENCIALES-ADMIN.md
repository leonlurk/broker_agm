# 🔐 Credenciales de Administradores

## ⚠️ ARCHIVO CONFIDENCIAL - NO COMMITEAR A GIT

---

## 👤 Admin 1: Tudominio

**Email:** `admin@tudominio.com`
**Password:** `AdminPassword2025!`
**Username:** `admin948`
**UUID:** `751ada8d-50fb-44e5-ad88-d786d7280093`
**Rol:** `admin`
**Creado:** 2025-10-28 15:52:32

**Notas:**
- Primer usuario admin creado con script genérico
- Cambiar password después del primer login

---

## 👤 Admin 2: AGM Principal

**Email:** `admin@agm.com`
**Password:** `Admin@AGM2025!`
**Username:** `admin_agm`
**Rol:** `admin`
**Script:** `06_crear_admin_agm.sql`

**Notas:**
- Usuario administrador principal del sistema AGM
- Password más fuerte con símbolo especial
- Crear ejecutando el archivo `06_crear_admin_agm.sql`

---

## 👤 Admin 3: Existente

**Email:** `angigod@protonmail.com`
**Username:** `admin2`
**UUID:** `4b292b73-91d3-4941-932f-9f46c2b3a1fb`
**Rol:** `admin`
**Creado:** 2025-10-22 15:32:14

**Notas:**
- Usuario admin existente antes de estos scripts

---

## 🛡️ Recomendaciones de Seguridad

1. **Cambiar passwords:**
   - Cambiar todos los passwords después del primer login
   - Usar passwords únicos de al menos 16 caracteres

2. **Rotación de credenciales:**
   - Cambiar passwords cada 90 días
   - Usar un gestor de contraseñas (1Password, Bitwarden)

3. **Acceso:**
   - Habilitar 2FA cuando esté disponible
   - No compartir credenciales de admin

4. **Este archivo:**
   - **NO commitear** a Git
   - Guardar en lugar seguro (gestor de contraseñas)
   - Eliminar después de guardar las credenciales

---

## 📋 Cómo crear admin@agm.com

1. Abre **Supabase SQL Editor**
2. Ejecuta el archivo: `06_crear_admin_agm.sql`
3. Verifica con:
   ```sql
   SELECT email, username, role, status
   FROM profiles
   WHERE email = 'admin@agm.com';
   ```
4. Login con:
   - Email: `admin@agm.com`
   - Password: `Admin@AGM2025!`

---

**Fecha:** 2025-10-28
**Generado por:** Scripts SQL en `sql-admin-user/`
