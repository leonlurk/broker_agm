# Sistema de Transacciones Integrado - Alpha Global Market

## Resumen Ejecutivo

Se ha implementado exitosamente un sistema completo de transacciones que conecta armoniosamente el broker frontend con el CRM backend a través de Supabase RPC functions. El sistema maneja depósitos, retiros y transferencias internas con un flujo de aprobación similar al sistema KYC.

## Arquitectura del Sistema

### 1. Flujo de Transacciones

```
Usuario (Broker) → RPC Function → Base de Datos → CRM Admin → MT5
```

### 2. Componentes Principales

#### Frontend (Broker)
- **Wallet.jsx**: Componente principal para gestión de transacciones
- **CryptoDepositModal.jsx**: Modal para depósitos de criptomonedas
- **transactionService.js**: Servicio para comunicación con RPC functions
- **useTransactionMonitor.js**: Hook para monitoreo en tiempo real

#### Backend (Supabase)
- **Tablas**: `deposits`, `withdrawals`, `internal_transfers`
- **RPC Functions**: 
  - `create_deposit_request`
  - `create_withdrawal_request`
  - `create_transfer_request`
  - `update_deposit_status`
  - `update_withdrawal_status`
  - `get_user_transactions`

#### CRM
- Sistema de aprobación para procesar solicitudes
- Integración con MT5 para sincronización de saldos

## Flujos de Trabajo

### Depósitos con Criptomonedas

1. **Usuario inicia depósito**
   - Selecciona cuenta y monto
   - Genera dirección de wallet

2. **Verificación Payroll API**
   - Sistema detecta transacción blockchain
   - Payroll API confirma el pago

3. **Creación de solicitud**
   ```javascript
   await transactionService.createDepositRequest({
     account_id: account.id,
     amount: amount,
     payment_method: 'crypto',
     payroll_verified: true,
     payroll_data: {...}
   })
   ```

4. **Aprobación CRM**
   - Admin revisa solicitud
   - Actualiza estado a 'confirmed'
   - Sistema sincroniza con MT5

5. **Notificación al usuario**
   - Real-time update vía websocket
   - Toast notification con estado

### Retiros

1. **Usuario solicita retiro**
   ```javascript
   await transactionService.createWithdrawalRequest({
     account_id: account.id,
     amount: amount,
     withdrawal_type: 'crypto',
     wallet_address: address
   })
   ```

2. **Validaciones**
   - Verificación de saldo disponible
   - Límites de retiro

3. **Aprobación CRM**
   - Admin revisa y aprueba
   - Actualiza saldo en MT5
   - Procesa pago

4. **Estados del retiro**
   - `pending`: Solicitud creada
   - `approved`: Aprobado por admin
   - `processing`: En proceso de pago
   - `completed`: Pago completado
   - `rejected`: Rechazado (con razón)

### Transferencias Internas

1. **Usuario inicia transferencia**
   ```javascript
   await transactionService.createTransferRequest({
     from_account_id: fromAccount.id,
     to_account_id: toAccount.id,
     amount: amount
   })
   ```

2. **Validaciones**
   - Cuentas pertenecen al usuario
   - Saldo disponible
   - Cuentas diferentes

3. **Aprobación CRM**
   - Admin aprueba transferencia
   - Actualiza ambas cuentas en MT5
   - Genera tickets MT5

## Monitoreo en Tiempo Real

### Hook useTransactionMonitor

```javascript
const { refresh } = useTransactionMonitor(
  userId,
  (update) => {
    // update contiene:
    // - type: 'deposit' | 'withdrawal' | 'transfer'
    // - transactionId
    // - oldStatus
    // - newStatus
    // - data: transaction completa
  }
);
```

### Suscripciones Realtime

- Escucha cambios en tablas de transacciones
- Filtra por user_id
- Notifica cambios de estado inmediatamente
- Toast notifications automáticas

## Seguridad

### Row Level Security (RLS)

```sql
-- Usuarios solo ven sus propias transacciones
CREATE POLICY "Users can view own deposits" 
ON deposits FOR SELECT 
USING (auth.uid() = user_id);
```

### Validaciones

1. **Frontend**
   - Validación de montos mínimos
   - Verificación de cuentas disponibles
   - Términos y condiciones

2. **RPC Functions**
   - Autenticación de usuario
   - Validación de parámetros
   - Verificación de permisos

3. **CRM**
   - Doble verificación manual
   - Logs de auditoría
   - Aprobación multinivel

## Estados de Transacciones

### Depósitos
- `pending`: Esperando aprobación
- `processing`: Verificando con Payroll
- `confirmed`: Aprobado y acreditado
- `failed`: Rechazado o falló
- `cancelled`: Cancelado

### Retiros
- `pending`: Esperando aprobación
- `approved`: Aprobado, pendiente de proceso
- `processing`: Procesando pago
- `completed`: Pago completado
- `rejected`: Rechazado
- `cancelled`: Cancelado

### Transferencias
- `pending`: Esperando aprobación
- `approved`: Aprobado
- `completed`: Completado
- `rejected`: Rechazado
- `cancelled`: Cancelado

## Notificaciones

### Para Usuarios
- Confirmación de solicitud creada
- Cambios de estado de transacciones
- Aprobaciones y rechazos
- Completación de procesos

### Para Admins (CRM)
- Nuevas solicitudes pendientes
- Alertas de montos altos
- Errores de sincronización MT5

## Integración MT5

### Campos de Tracking
- `mt5_processed`: Boolean indicando sincronización
- `mt5_ticket`: ID de transacción en MT5
- `mt5_from_ticket` / `mt5_to_ticket`: Para transferencias

### Proceso de Sincronización
1. CRM aprueba transacción
2. Sistema genera comando MT5
3. MT5 procesa y retorna ticket
4. Sistema actualiza registro con ticket

## Manejo de Errores

### Errores Comunes

1. **Saldo Insuficiente**
   ```javascript
   {
     success: false,
     error: 'Saldo insuficiente en la cuenta'
   }
   ```

2. **Cuenta No Encontrada**
   ```javascript
   {
     success: false,
     error: 'Cuenta no encontrada o no pertenece al usuario'
   }
   ```

3. **Límites Excedidos**
   ```javascript
   {
     success: false,
     error: 'Monto excede el límite permitido'
   }
   ```

### Recuperación de Errores

- Reintentos automáticos para errores de red
- Rollback de transacciones fallidas
- Notificación al soporte para intervención manual

## Testing

### Pruebas Recomendadas

1. **Depósito Crypto**
   - Verificar detección Payroll
   - Crear solicitud post-confirmación
   - Verificar notificación real-time

2. **Retiro**
   - Validar saldo disponible
   - Crear solicitud
   - Verificar estados de aprobación

3. **Transferencia**
   - Validar cuentas propias
   - Crear transferencia
   - Verificar actualización de ambas cuentas

## Monitoreo y Métricas

### KPIs a Monitorear
- Tiempo promedio de aprobación
- Tasa de rechazo
- Volumen de transacciones por tipo
- Errores de sincronización MT5

### Logs
```javascript
logger.info('[TransactionService] Creating deposit request', data);
logger.error('[TransactionService] Error:', error);
```

## Mejoras Futuras

1. **Automatización**
   - Auto-aprobación para montos pequeños
   - Verificación KYC automática
   - Límites dinámicos por usuario

2. **Nuevos Métodos de Pago**
   - Transferencias bancarias
   - Tarjetas de crédito/débito
   - Wallets digitales

3. **Optimizaciones**
   - Cache de transacciones frecuentes
   - Batch processing para múltiples operaciones
   - Webhooks para integraciones externas

## Conclusión

El sistema de transacciones está completamente integrado y funcional, proporcionando:
- ✅ Flujo completo de depósitos, retiros y transferencias
- ✅ Integración con Payroll API para crypto
- ✅ Sistema de aprobación CRM
- ✅ Sincronización con MT5
- ✅ Monitoreo en tiempo real
- ✅ Notificaciones instantáneas
- ✅ Seguridad mediante RLS y validaciones

El sistema está listo para producción y maneja de manera armoniosa la comunicación entre el broker frontend, Supabase y el CRM backend.