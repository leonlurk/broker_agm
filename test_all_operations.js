/**
 * Script de prueba para todas las operaciones de wallet
 * Ejecutar en la consola del navegador con la app abierta
 */

import { supabase } from './src/supabase/config';

// ============================================
// FUNCIONES DE PRUEBA PARA TODAS LAS OPERACIONES
// ============================================

// 1. PRUEBA DE DEPÓSITO (directo al balance)
async function testDeposit(amount = 100) {
  console.log('🟢 Probando depósito de $' + amount);
  
  try {
    // Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No hay usuario autenticado');

    // Crear depósito directo (sin RPC para testing)
    const { data: deposit, error } = await supabase
      .from('deposits')
      .insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        account_id: 'general',
        account_name: 'Balance General',
        amount: amount,
        currency: 'USD',
        payment_method: 'test',
        status: 'approved',
        submitted_at: new Date().toISOString(),
        approved_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Actualizar balance del broker
    const { data: account } = await supabase
      .from('broker_accounts')
      .select('broker_balance')
      .eq('user_id', user.id)
      .single();

    const newBalance = (account?.broker_balance || 0) + amount;
    
    await supabase
      .from('broker_accounts')
      .update({ broker_balance: newBalance })
      .eq('user_id', user.id);

    console.log('✅ Depósito exitoso:', deposit);
    console.log('💰 Nuevo balance:', newBalance);
    return { success: true, deposit, newBalance };
  } catch (error) {
    console.error('❌ Error en depósito:', error);
    return { success: false, error: error.message };
  }
}

// 2. PRUEBA DE RETIRO (desde balance general)
async function testWithdrawal(amount = 50) {
  console.log('🔴 Probando retiro de $' + amount);
  
  try {
    // Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No hay usuario autenticado');

    // Verificar balance disponible
    const { data: account } = await supabase
      .from('broker_accounts')
      .select('broker_balance')
      .eq('user_id', user.id)
      .single();

    if (!account || account.broker_balance < amount) {
      throw new Error('Balance insuficiente. Balance actual: $' + (account?.broker_balance || 0));
    }

    // Crear solicitud de retiro
    const { data: withdrawal, error } = await supabase
      .from('withdrawals')
      .insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        account_id: 'general',
        account_name: 'Balance General',
        amount: amount,
        currency: 'USD',
        withdrawal_type: 'crypto',
        crypto_currency: 'USDT',
        wallet_address: '0xTEST' + Date.now(),
        network: 'ERC20',
        status: 'pending', // Los retiros quedan pendientes para aprobación admin
        requested_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // NO actualizamos el balance aquí porque está pendiente de aprobación
    console.log('✅ Solicitud de retiro creada (pendiente de aprobación):', withdrawal);
    console.log('⏳ Estado: PENDIENTE - Requiere aprobación del administrador');
    return { success: true, withdrawal };
  } catch (error) {
    console.error('❌ Error en retiro:', error);
    return { success: false, error: error.message };
  }
}

// 3. PRUEBA DE TRANSFERENCIA (de balance general a cuenta MT5)
async function testTransfer(amount = 25, toAccountId = null) {
  console.log('🔄 Probando transferencia de $' + amount);
  
  try {
    // Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No hay usuario autenticado');

    // Verificar balance disponible
    const { data: accounts } = await supabase
      .from('broker_accounts')
      .select('*')
      .eq('user_id', user.id);

    if (!accounts || accounts.length === 0) {
      throw new Error('No tienes cuentas disponibles');
    }

    const brokerBalance = accounts[0].broker_balance || 0;
    if (brokerBalance < amount) {
      throw new Error('Balance insuficiente. Balance actual: $' + brokerBalance);
    }

    // Si no se especifica cuenta destino, usar la primera MT5 disponible
    if (!toAccountId) {
      const mt5Account = accounts.find(acc => acc.account_type === 'real' || acc.account_type === 'demo');
      if (!mt5Account) {
        throw new Error('No tienes cuentas MT5 disponibles para transferir');
      }
      toAccountId = mt5Account.id;
    }

    const toAccount = accounts.find(acc => acc.id === toAccountId);
    if (!toAccount) {
      throw new Error('Cuenta destino no encontrada');
    }

    // Crear transferencia
    const { data: transfer, error } = await supabase
      .from('internal_transfers')
      .insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        from_account_id: 'general',
        from_account_name: 'Balance General',
        to_account_id: toAccount.id,
        to_account_name: toAccount.account_name || 'Cuenta MT5',
        amount: amount,
        currency: 'USD',
        status: 'completed', // Las transferencias se completan inmediatamente
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Actualizar balances
    const newBrokerBalance = brokerBalance - amount;
    const newAccountBalance = (toAccount.balance || 0) + amount;

    // Actualizar balance general
    await supabase
      .from('broker_accounts')
      .update({ broker_balance: newBrokerBalance })
      .eq('user_id', user.id);

    // Actualizar balance de la cuenta destino
    await supabase
      .from('broker_accounts')
      .update({ balance: newAccountBalance })
      .eq('id', toAccountId);

    console.log('✅ Transferencia exitosa:', transfer);
    console.log('💰 Balance general nuevo:', newBrokerBalance);
    console.log('💰 Balance cuenta destino nuevo:', newAccountBalance);
    return { success: true, transfer, newBrokerBalance, newAccountBalance };
  } catch (error) {
    console.error('❌ Error en transferencia:', error);
    return { success: false, error: error.message };
  }
}

// 4. VER ESTADO ACTUAL DE BALANCES
async function checkBalances() {
  console.log('📊 Verificando balances...');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No hay usuario autenticado');

    const { data: accounts } = await supabase
      .from('broker_accounts')
      .select('*')
      .eq('user_id', user.id);

    if (!accounts || accounts.length === 0) {
      console.log('⚠️ No tienes cuentas');
      return { success: false };
    }

    console.log('💰 Balance General: $' + (accounts[0].broker_balance || 0));
    console.log('📊 Cuentas MT5:');
    accounts.forEach(acc => {
      if (acc.account_type === 'real' || acc.account_type === 'demo') {
        console.log(`  - ${acc.account_name || acc.id}: $${acc.balance || 0} (${acc.account_type})`);
      }
    });

    return { success: true, accounts };
  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error: error.message };
  }
}

// 5. VER HISTORIAL DE TRANSACCIONES
async function checkHistory() {
  console.log('📜 Obteniendo historial de transacciones...');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No hay usuario autenticado');

    // Obtener depósitos
    const { data: deposits } = await supabase
      .from('deposits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Obtener retiros
    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', user.id)
      .order('requested_at', { ascending: false })
      .limit(5);

    // Obtener transferencias
    const { data: transfers } = await supabase
      .from('internal_transfers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('💚 Últimos depósitos:', deposits || []);
    console.log('🔴 Últimos retiros:', withdrawals || []);
    console.log('🔄 Últimas transferencias:', transfers || []);

    return { success: true, deposits, withdrawals, transfers };
  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// EXPORTAR FUNCIONES PARA USO GLOBAL
// ============================================
window.walletTest = {
  deposit: testDeposit,
  withdraw: testWithdrawal,
  transfer: testTransfer,
  balances: checkBalances,
  history: checkHistory,
  
  // Función de prueba completa
  async runFullTest() {
    console.log('🚀 INICIANDO PRUEBA COMPLETA DE WALLET');
    console.log('=====================================\n');
    
    // 1. Ver balances iniciales
    await this.balances();
    console.log('\n');
    
    // 2. Hacer un depósito
    console.log('Paso 1: Depositar $100');
    await this.deposit(100);
    console.log('\n');
    
    // 3. Hacer una transferencia
    console.log('Paso 2: Transferir $25 a cuenta MT5');
    await this.transfer(25);
    console.log('\n');
    
    // 4. Intentar un retiro
    console.log('Paso 3: Solicitar retiro de $30');
    await this.withdraw(30);
    console.log('\n');
    
    // 5. Ver balances finales
    console.log('Paso 4: Verificar balances finales');
    await this.balances();
    console.log('\n');
    
    // 6. Ver historial
    console.log('Paso 5: Ver historial de transacciones');
    await this.history();
    
    console.log('\n=====================================');
    console.log('✅ PRUEBA COMPLETA FINALIZADA');
  }
};

// Mensaje de instrucciones
console.log(`
🎯 FUNCIONES DE PRUEBA DE WALLET CARGADAS
========================================

Usa estos comandos en la consola:

📗 DEPÓSITO:
  walletTest.deposit(100)        // Depositar $100

📕 RETIRO:
  walletTest.withdraw(50)        // Retirar $50 (queda pendiente)

📘 TRANSFERENCIA:
  walletTest.transfer(25)        // Transferir $25 a cuenta MT5

📊 VER BALANCES:
  walletTest.balances()          // Ver todos los balances

📜 VER HISTORIAL:
  walletTest.history()           // Ver últimas transacciones

🚀 PRUEBA COMPLETA:
  walletTest.runFullTest()      // Ejecutar todas las pruebas

========================================
`);

export default window.walletTest;