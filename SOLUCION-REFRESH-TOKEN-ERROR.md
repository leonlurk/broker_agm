# 🔧 Solución: Error "Invalid Refresh Token"

## 📋 Problema

Estás viendo este error en la consola:

```
AuthApiError: Invalid Refresh Token: Refresh Token Not Found
Failed to load resource: the server responded with a status of 400
```

---

## ✅ ¿Es crítico?

**NO** - Es un error común que ocurre cuando:
- Hay tokens antiguos/inválidos en el navegador
- Cambiaste passwords recientemente
- Hiciste cambios en usuarios de Supabase
- Sesiones antiguas expiraron

**Impacto:**
- ❌ Mensajes molestos en consola
- ❌ Puede desloguearte automáticamente
- ✅ No afecta funcionalidad una vez que hagas login de nuevo

---

## 🚀 Soluciones RÁPIDAS

### Opción 1: Limpiar localStorage (30 segundos)

1. Abre DevTools (F12)
2. Ve a la pestaña **Console**
3. Pega este código:

```javascript
// Limpiar tokens de AGM
localStorage.removeItem('agm-broker-auth');
sessionStorage.clear();
location.reload();
```

4. Presiona Enter
5. El navegador recargará automáticamente

---

### Opción 2: Limpiar manualmente

1. Abre DevTools (F12)
2. Ve a **Application** → **Local Storage**
3. Busca y elimina:
   - `agm-broker-auth`
   - Cualquier key que empiece con `supabase`
4. Recarga la página (F5)

---

### Opción 3: Logout/Login

1. Haz logout desde el CRM
2. Cierra completamente el navegador
3. Abre de nuevo
4. Login con tus credenciales

---

## 🛠️ Solución PERMANENTE (Código)

He creado un manejador de errores automático en:

📄 `src/utils/authErrorHandler.js`

Este archivo:
- ✅ Detecta errores de refresh token automáticamente
- ✅ Limpia tokens inválidos sin intervención manual
- ✅ Redirige al login cuando es necesario
- ✅ Previene que se muestren estos errores en consola

### Cómo implementarlo:

1. **El archivo ya está creado** en `src/utils/authErrorHandler.js`

2. **Modificar** `src/supabase/config.js`:

```javascript
// Al final del archivo, agregar:
import { setupAuthErrorListener } from '../utils/authErrorHandler';

// Después de crear el cliente de Supabase
setupAuthErrorListener(supabase);
```

3. **Modificar** `src/contexts/AuthContext.jsx`:

```javascript
// Importar al inicio
import { safeGetSession, handleAuthError } from '../utils/authErrorHandler';

// En el useEffect donde se hace onAuthStateChange, envolver en try-catch:
try {
  const unsubscribe = AuthAdapter.onAuthStateChange(async (user) => {
    // ... código existente
  });
} catch (error) {
  handleAuthError(error);
  setLoading(false);
}
```

---

## ✅ Verificar que funciona

Después de aplicar una solución:

1. Abre DevTools (F12)
2. Ve a **Console**
3. **NO** deberías ver más:
   - `Invalid Refresh Token`
   - `Failed to load resource: 400`

4. Haz login normalmente
5. El sistema debería funcionar sin errores

---

## 🔐 Credenciales de admin actualizado

```
Email:    support@alphaglobalmarket.io
Password: AGM$upp0rt2025!Secur3#Pro
Rol:      admin
```

---

## 📝 Notas adicionales

- Este error es **normal después de hacer cambios en usuarios/passwords**
- La solución rápida (limpiar localStorage) es suficiente
- La solución permanente (código) previene que vuelva a ocurrir
- No afecta a otros usuarios, solo al navegador local

---

**Recomendación:** Usa la **Opción 1** (script de limpieza) ahora, y luego implementa la solución permanente cuando tengas tiempo.
