# Configuración de Recuperación de Contraseña en Supabase

## Resumen de Cambios Realizados

### 1. **Eliminación del campo Usuario en ForgotPassword.jsx**
- Se eliminó el campo de "username" del formulario
- Ahora solo se requiere el email para solicitar recuperación de contraseña

### 2. **Actualización del flujo de reset de contraseña**
- Se corrigió el componente `PasswordReset.jsx` para trabajar correctamente con Supabase
- Se eliminó el sistema de códigos de verificación manual
- Se implementó la detección automática de sesión de recuperación de Supabase

### 3. **Corrección de la URL de redirección**
- Se cambió la URL de redirección de `/reset-password` a `/password-reset` en `supabase/auth.js`

## Configuración Requerida en Supabase Dashboard

Para que el flujo funcione correctamente, debes configurar lo siguiente en tu proyecto de Supabase:

### 1. **Configurar las URLs de redirección**

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **Authentication** → **URL Configuration**
3. En **Redirect URLs**, agrega las siguientes URLs:
   ```
   http://localhost:5173/password-reset
   https://tudominio.com/password-reset
   ```

### 2. **Configurar la plantilla de email**

1. Ve a **Authentication** → **Email Templates**
2. Selecciona **Reset Password**
3. Asegúrate de que el enlace en la plantilla sea:
   ```html
   <a href="{{ .ConfirmationURL }}">Reset Password</a>
   ```

### 3. **Verificar la configuración de Auth**

1. En **Authentication** → **Providers** → **Email**
2. Asegúrate de que:
   - "Enable Email Signup" esté activado
   - "Confirm email" esté configurado según tu preferencia

## Flujo de Recuperación de Contraseña

1. **Usuario solicita reset**: Ingresa su email en `/forgot-password`
2. **Supabase envía email**: Con un enlace mágico que incluye un token
3. **Usuario hace clic en el enlace**: Es redirigido a `/password-reset#access_token=...&type=recovery`
4. **Validación automática**: El componente detecta el token y valida la sesión
5. **Usuario ingresa nueva contraseña**: Y la actualiza directamente con Supabase
6. **Redirección al login**: Después de actualizar exitosamente

## Prueba del Sistema

Para probar que todo funciona correctamente:

1. Ve a `/forgot-password`
2. Ingresa un email registrado
3. Revisa el correo y haz clic en el enlace
4. Deberías ser redirigido a `/password-reset` con una sesión válida
5. Ingresa la nueva contraseña
6. Verifica que puedes iniciar sesión con la nueva contraseña

## Notas Importantes

- **No uses Firebase**: El sistema ahora usa exclusivamente Supabase
- **El token expira**: Los tokens de Supabase expiran después de un tiempo (configurable en el dashboard)
- **Una sola vez**: Cada token solo se puede usar una vez
- **Sesión temporal**: La sesión de recuperación es temporal y solo permite cambiar la contraseña

## Troubleshooting

### El email no llega
- Verifica la configuración SMTP en Supabase
- Revisa los logs en Supabase Dashboard → **Logs** → **Auth**

### Token inválido
- El token puede haber expirado
- El usuario debe solicitar un nuevo enlace

### La contraseña no se actualiza
- Verifica que la nueva contraseña cumple con los requisitos
- Revisa los logs del navegador para errores de Supabase