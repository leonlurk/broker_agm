# 🧪 Cómo Testear el Sistema de Depósitos Sin Enviar Dinero

## Opción 1: Test desde la Consola del Navegador

### Pasos:
1. Abre el broker en Chrome/Edge: https://broker-agm.netlify.app
2. Inicia sesión con tu cuenta
3. Abre la consola del navegador (F12 → Console)
4. Copia y pega este código:

```javascript
// Crear un depósito de prueba
async function testDeposit() {
  const { supabase } = window;
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('Por favor inicia sesión primero');
    return;
  }
  
  const { data, error } = await supabase.rpc('create_deposit_request', {
    p_account_id: 'TEST_001',
    p_account_name: 'Cuenta Prueba',
    p_amount: 100,
    p_payment_method: 'crypto',
    p_crypto_currency: 'USDT_TRC20',
    p_crypto_network: 'TRON',
    p_wallet_address: 'TEaQgjdWECF4fjzgscF6pA5v2GQvPPhBpR',
    p_transaction_hash: 'TEST_' + Date.now(),
    p_payroll_data: { test_mode: true, confirmed: true }
  });
  
  if (data?.success) {
    console.log('✅ Depósito de prueba creado!');
    console.log('ID:', data.deposit_id);
    window.testDepositId = data.deposit_id;
  } else {
    console.error('Error:', error || data);
  }
}

// Ejecutar el test
await testDeposit();
```

5. Verifica que aparezca "✅ Depósito de prueba creado!"

### Para ver el estado:
```javascript
// Ver tus depósitos
const { supabase } = window;
const { data } = await supabase
  .from('deposits')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(5);
  
console.table(data);
```

### Para limpiar el test:
```javascript
// Eliminar el depósito de prueba
const { supabase } = window;
await supabase
  .from('deposits')
  .delete()
  .eq('id', window.testDepositId);
console.log('Depósito de prueba eliminado');
```

## Opción 2: Test Visual (Sin Backend)

### Pasos:
1. Ve a la sección Wallet/Billetera
2. Selecciona "Depositar"
3. Elige USDT (TRC-20) o USDT (ERC-20)
4. Ingresa cualquier monto (ej: 100)
5. Verifica que aparezcan las direcciones correctas:
   - **TRC-20**: `TEaQgjdWECF4fjzgscF6pA5v2GQvPPhBpR`
   - **ERC-20**: `0x38CfeC0B9199d6cA2944df012621F7C60be4b0d9`
6. Verifica que el QR code se genere correctamente
7. **NO** envíes dinero real, solo verifica la UI

## Opción 3: Verificar Configuración

### En la consola del navegador:
```javascript
// Verificar que las billeteras están configuradas
console.log('Verificando configuración...');

// Esta dirección debería aparecer para TRC-20
console.log('TRON:', 'TEaQgjdWECF4fjzgscF6pA5v2GQvPPhBpR');

// Esta dirección debería aparecer para ERC-20
console.log('ETH/BSC:', '0x38CfeC0B9199d6cA2944df012621F7C60be4b0d9');

// Verificar conexión con Supabase
const { supabase } = window;
const { data: { user } } = await supabase.auth.getUser();
console.log('Usuario conectado:', user?.email || 'No conectado');
```

## Verificación en el CRM

Si tienes acceso al CRM:
1. Los depósitos de prueba aparecerán con estado "pending"
2. Tendrán `payroll_data.test_mode = true`
3. Puedes aprobarlos/rechazarlos desde ahí
4. El usuario recibirá notificación en tiempo real

## Monitoreo en Tiempo Real

Para verificar que las notificaciones funcionan:
1. Abre el broker en una pestaña
2. Abre Supabase Dashboard en otra
3. Ve a la tabla `deposits`
4. Cambia manualmente el `status` de un depósito
5. Deberías ver una notificación toast en el broker

## ⚠️ Importante

- **NUNCA** envíes dinero real para pruebas
- Los depósitos de prueba tienen `test_mode: true` en `payroll_data`
- Limpia los datos de prueba después de testear
- El Payroll API solo detecta transacciones reales en blockchain

## Problemas Comunes

### "No hay usuario autenticado"
→ Inicia sesión primero en el broker

### "RPC function not found"
→ La función RPC no existe en Supabase. Verifica que se ejecutaron los scripts SQL

### "Permission denied"
→ El usuario no tiene permisos. Verifica las políticas RLS en Supabase

### Las direcciones no coinciden
→ Verifica que el build del frontend esté actualizado: `npm run build`