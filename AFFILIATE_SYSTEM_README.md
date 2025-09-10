# Sistema de Afiliados - Guía Completa

## 📋 Estado Actual del Sistema

### ✅ Componentes Existentes:
1. **Tablas en Base de Datos:**
   - `users` - Con campos `referral_count` y `referred_by`
   - `user_referrals` - Relación entre afiliado y referidos
   - `affiliate_tiers` - Configuración de niveles y comisiones
   - `affiliate_commissions` - Registro de comisiones generadas
   - `affiliate_payments` - Historial de pagos a afiliados
   - `commission_history` - Historial detallado de comisiones

2. **Frontend:**
   - `AfiliadosDashboard.jsx` - Dashboard completo de afiliados
   - `affiliatesService.js` - Servicio para operaciones de afiliados

### ⚠️ Estado: NO CONFIGURADO
Las tablas existen pero están **vacías**. Necesitan configuración inicial antes de poder testear.

## 🚀 Pasos para Activar el Sistema

### 1. Configurar Niveles de Afiliados
Ejecuta en Supabase SQL Editor:
```sql
-- Ejecutar el archivo: setup_affiliate_complete.sql
```

Este script:
- Configura 3 niveles (Bronze, Silver, Gold)
- Crea funciones necesarias
- Configura triggers automáticos
- Establece políticas de seguridad

### 2. Verificar Configuración
```sql
-- Ver niveles configurados
SELECT * FROM affiliate_tiers ORDER BY tier_level;

-- Verificar funciones creadas
SELECT proname FROM pg_proc 
WHERE proname IN ('register_referral', 'get_user_tier', 'generate_affiliate_commission');
```

## 📊 Estructura de Niveles (Tiers)

| Nivel | Nombre | Referidos | Comisión | Market Direct | Institucional | Pago Mínimo |
|-------|--------|-----------|----------|---------------|---------------|-------------|
| 1 | Bronze | 0-99 | 10% | $3.00/lote | $1.50/lote | $50 |
| 2 | Silver | 100-199 | 15% | $3.50/lote | $1.75/lote | $25 |
| 3 | Gold | 200+ | 20% | $4.00/lote | $2.00/lote | $10 |

## 🔄 Flujo del Sistema

### 1. Registro con Referido
```mermaid
Usuario nuevo → Registra con link referido → Trigger automático → Incrementa referral_count → Crea registro en user_referrals
```

### 2. Generación de Comisiones
```mermaid
Referido opera → Sistema detecta operación → Calcula comisión según tier → Registra en affiliate_commissions
```

### 3. Proceso de Pago
```mermaid
Comisiones acumuladas → Alcanza mínimo → Solicita pago → Procesa y registra en affiliate_payments
```

## 🧪 Testing del Sistema

### Test Básico (Ejecutar test_affiliate_system.sql):
1. Crea usuarios de prueba
2. Simula referidos
3. Genera comisiones
4. Procesa pagos

### Test Manual en Frontend:

#### 1. Crear Afiliado:
- Registrar usuario normalmente
- Usuario ya es afiliado potencial

#### 2. Generar Link de Referido:
- Ir a sección Afiliados
- Copiar link personal
- Formato: `https://tudominio.com/register?ref=USER_ID`

#### 3. Registrar Referido:
- Nuevo usuario se registra con link
- Sistema detecta `?ref=USER_ID`
- Al crear usuario, debe guardar `referred_by`
- Trigger incrementa `referral_count`

#### 4. Verificar en Dashboard:
- Ver contador de referidos
- Ver tier actual
- Ver comisiones pendientes

## 🔍 Queries de Verificación

### Ver Afiliados Activos:
```sql
SELECT 
    u.email,
    u.referral_count,
    COUNT(ur.referred_user_id) as referidos_activos,
    SUM(ur.commission_earned) as total_comisiones
FROM users u
LEFT JOIN user_referrals ur ON u.id = ur.referrer_user_id
WHERE u.referral_count > 0
GROUP BY u.id, u.email, u.referral_count;
```

### Ver Comisiones Pendientes:
```sql
SELECT 
    u.email,
    COUNT(ac.id) as num_comisiones,
    SUM(ac.commission_amount) as total_pendiente
FROM affiliate_commissions ac
JOIN users u ON ac.affiliate_id = u.id
WHERE ac.status = 'pending'
GROUP BY u.email;
```

## ⚠️ Puntos Críticos a Verificar

### 1. En el Frontend (Register.jsx):
```javascript
// Al registrar, debe verificar si hay ref en URL
const urlParams = new URLSearchParams(window.location.search);
const referredBy = urlParams.get('ref');

// Al crear usuario, incluir referred_by
if (referredBy) {
    userData.referred_by = referredBy;
}
```

### 2. En el Backend (Trigger):
- El trigger `auto_register_referral_trigger` debe estar activo
- Se ejecuta DESPUÉS de INSERT en users
- Llama a `register_referral()` si `referred_by` no es null

### 3. En el Service (affiliatesService.js):
- Verifica que use las funciones RPC correctas
- Maneja errores si el usuario no tiene permisos

## 📝 Checklist Pre-Testing

- [ ] Ejecutar `setup_affiliate_complete.sql`
- [ ] Verificar que affiliate_tiers tiene 3 registros
- [ ] Verificar que el trigger está activo
- [ ] Confirmar que Register.jsx maneja parámetro `ref`
- [ ] Verificar que affiliatesService.js apunta a las tablas correctas
- [ ] Comprobar políticas RLS están activas

## 🚨 Troubleshooting

### Problema: Referidos no se registran
```sql
-- Verificar trigger
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'auto_register_referral_trigger';

-- Verificar función
SELECT prosrc FROM pg_proc WHERE proname = 'register_referral';
```

### Problema: Comisiones no se calculan
```sql
-- Verificar tier del usuario
SELECT * FROM get_user_tier('USER_ID_HERE');

-- Ver logs de errores
SELECT * FROM affiliate_commissions 
WHERE affiliate_id = 'USER_ID_HERE' 
ORDER BY created_at DESC;
```

### Problema: No se puede procesar pago
```sql
-- Verificar monto mínimo
SELECT 
    calculate_pending_commissions('USER_ID_HERE') as pendiente,
    (SELECT min_payout FROM get_user_tier('USER_ID_HERE')) as minimo;
```

## ✅ Sistema Listo para Testing

Una vez ejecutado `setup_affiliate_complete.sql`, el sistema está:
1. **Configurado** con niveles y comisiones
2. **Automatizado** con triggers para referidos
3. **Seguro** con políticas RLS
4. **Optimizado** con índices de performance
5. **Listo** para pruebas completas

El frontend ya tiene todos los componentes necesarios y debería funcionar automáticamente una vez configurada la base de datos.