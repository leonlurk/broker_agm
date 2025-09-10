// ========================================
// SCRIPTS COMPLETOS DE TESTING PARA WALLET
// ========================================
// Versión final que funciona con tu base de datos

// ====================
// 1. DEPÓSITO USANDO RPC (COMO LA APP REAL)
// ====================
async function testDeposit() {
  console.log("🔵 TEST DE DEPÓSITO...");
  
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.error("❌ No hay usuario autenticado");
      return;
    }
    
    console.log("👤 Usuario:", user.email);
    
    // Ver balance antes
    const { data: before } = await window.supabase
      .from('profiles')
      .select('broker_balance')
      .eq('id', user.id)
      .single();
    
    console.log("💰 Balance antes:", before?.broker_balance || 0);
    
    // Usar la función RPC como tu app real
    const { data, error } = await window.supabase.rpc('create_deposit_request', {
      p_account_id: 'general',
      p_account_name: 'Balance General',
      p_amount: 100,
      p_payment_method: 'crypto',
      p_crypto_currency: 'USDT',
      p_crypto_network: 'tron',
      p_wallet_address: 'TTestWallet123456789',
      p_transaction_hash: 'test_tx_' + Date.now(),
      p_payroll_data: { test: true, verified: true }
    });
    
    if (error) {
      console.error("❌ Error:", error);
      return;
    }
    
    console.log("✅ Resultado:", data);
    
    if (data?.success) {
      // Ver balance después
      const { data: after } = await window.supabase
        .from('profiles')
        .select('broker_balance')
        .eq('id', user.id)
        .single();
      
      console.log("💰 Balance después:", after?.broker_balance || 0);
      console.log("✅ DEPÓSITO EXITOSO - ID:", data.deposit_id);
      return data.deposit_id;
    } else {
      console.error("❌ Fallo:", data?.error);
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// ====================
// 2. RETIRO
// ====================
async function testWithdrawal() {
  console.log("🟡 TEST DE RETIRO...");
  
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.error("❌ No hay usuario autenticado");
      return;
    }
    
    // Verificar balance
    const { data: profile } = await window.supabase
      .from('profiles')
      .select('broker_balance')
      .eq('id', user.id)
      .single();
    
    const currentBalance = profile?.broker_balance || 0;
    console.log("💰 Balance actual:", currentBalance);
    
    if (currentBalance < 50) {
      console.warn("⚠️ Balance insuficiente. Mínimo: 50 USD");
      console.log("💡 Ejecuta primero testDeposit()");
      return;
    }
    
    // Buscar o crear método de pago
    let paymentMethod;
    const { data: methods } = await window.supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', user.id)
      .limit(1);
    
    if (!methods || methods.length === 0) {
      console.log("📝 Creando método de pago...");
      const { data: newMethod } = await window.supabase
        .from('payment_methods')
        .insert([{
          user_id: user.id,
          alias: 'Mi Wallet Test',
          address: 'TTestWallet987654321',
          network: 'tron_trc20',
          currency: 'USDT',
          is_active: true
        }])
        .select()
        .single();
      paymentMethod = newMethod;
    } else {
      paymentMethod = methods[0];
    }
    
    console.log("💳 Método de pago:", paymentMethod?.alias);
    
    // Usar RPC para crear retiro
    const { data, error } = await window.supabase.rpc('create_withdrawal_request', {
      p_account_id: 'general',
      p_account_name: 'Balance General',
      p_amount: 50,
      p_withdrawal_type: 'crypto',
      p_crypto_currency: 'USDT',
      p_wallet_address: paymentMethod?.address || 'TTestWallet123',
      p_network: paymentMethod?.network === 'tron_trc20' ? 'tron' : 'ethereum'
    });
    
    if (error) {
      console.error("❌ Error:", error);
      return;
    }
    
    console.log("✅ Resultado:", data);
    
    if (data?.success) {
      console.log("✅ Retiro creado - ID:", data.withdrawal_id);
      console.log("⏳ Requiere aprobación del administrador");
      
      // Ver balance actualizado
      const { data: after } = await window.supabase
        .from('profiles')
        .select('broker_balance')
        .eq('id', user.id)
        .single();
      
      console.log("💰 Balance después:", after?.broker_balance || 0);
      return data.withdrawal_id;
    } else {
      console.error("❌ Fallo:", data?.error);
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// ====================
// 3. TRANSFERENCIA A MT5
// ====================
async function testTransferToMT5() {
  console.log("🟢 TEST DE TRANSFERENCIA A MT5...");
  
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.error("❌ No hay usuario autenticado");
      return;
    }
    
    // Verificar balance general
    const { data: profile } = await window.supabase
      .from('profiles')
      .select('broker_balance')
      .eq('id', user.id)
      .single();
    
    const generalBalance = profile?.broker_balance || 0;
    console.log("💰 Balance general:", generalBalance);
    
    if (generalBalance < 10) {
      console.warn("⚠️ Balance insuficiente. Ejecuta testDeposit() primero");
      return;
    }
    
    // Obtener o crear cuenta MT5
    let { data: accounts } = await window.supabase
      .from('broker_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');
    
    let mt5Account;
    
    if (!accounts || accounts.length === 0) {
      console.log("📝 Creando cuenta MT5...");
      const { data: newAccount, error } = await window.supabase
        .from('broker_accounts')
        .insert([{
          user_id: user.id,
          account_name: 'MT5 Test Account',
          account_number: 'MT5-' + Date.now(),
          account_type: 'real',
          balance: 0,
          currency: 'USD',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) {
        console.error("❌ Error creando MT5:", error);
        return;
      }
      
      mt5Account = newAccount;
    } else {
      mt5Account = accounts[0];
    }
    
    console.log("🎯 Cuenta MT5:", mt5Account.account_name);
    
    // Transferir usando RPC
    const transferAmount = 10;
    console.log(`📤 Transfiriendo ${transferAmount} USD...`);
    
    const { data: result, error } = await window.supabase.rpc('create_transfer_request', {
      p_from_account_id: 'general',
      p_from_account_name: 'Balance General',
      p_to_account_id: mt5Account.id,
      p_to_account_name: mt5Account.account_name,
      p_amount: transferAmount
    });
    
    if (error) {
      console.error("❌ Error:", error);
      return;
    }
    
    console.log("📊 Resultado:", result);
    
    if (result?.success) {
      // Verificar balances
      const { data: updatedProfile } = await window.supabase
        .from('profiles')
        .select('broker_balance')
        .eq('id', user.id)
        .single();
      
      const { data: updatedAccount } = await window.supabase
        .from('broker_accounts')
        .select('balance')
        .eq('id', mt5Account.id)
        .single();
      
      console.log("✅ TRANSFERENCIA EXITOSA");
      console.log("💰 Balance general:", updatedProfile?.broker_balance);
      console.log("💰 Balance MT5:", updatedAccount?.balance);
      
      return result.transfer_id;
    } else {
      console.error("❌ Fallo:", result?.error);
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// ====================
// 4. TRANSFERENCIA DESDE MT5
// ====================
async function testTransferFromMT5() {
  console.log("🔵 TEST DE TRANSFERENCIA DESDE MT5...");
  
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.error("❌ No hay usuario autenticado");
      return;
    }
    
    // Buscar cuenta MT5 con balance
    const { data: accounts } = await window.supabase
      .from('broker_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('balance', 0);
    
    if (!accounts || accounts.length === 0) {
      console.warn("⚠️ No hay cuentas MT5 con balance");
      console.log("💡 Ejecuta testTransferToMT5() primero");
      return;
    }
    
    const mt5Account = accounts[0];
    console.log("🎯 MT5 origen:", mt5Account.account_name);
    console.log("💰 Balance MT5:", mt5Account.balance);
    
    const transferAmount = Math.min(5, mt5Account.balance);
    console.log(`📥 Transfiriendo ${transferAmount} USD...`);
    
    const { data: result, error } = await window.supabase.rpc('create_transfer_request', {
      p_from_account_id: mt5Account.id,
      p_from_account_name: mt5Account.account_name,
      p_to_account_id: 'general',
      p_to_account_name: 'Balance General',
      p_amount: transferAmount
    });
    
    if (error) {
      console.error("❌ Error:", error);
      return;
    }
    
    console.log("📊 Resultado:", result);
    
    if (result?.success) {
      // Verificar balances
      const { data: updatedProfile } = await window.supabase
        .from('profiles')
        .select('broker_balance')
        .eq('id', user.id)
        .single();
      
      const { data: updatedAccount } = await window.supabase
        .from('broker_accounts')
        .select('balance')
        .eq('id', mt5Account.id)
        .single();
      
      console.log("✅ TRANSFERENCIA EXITOSA");
      console.log("💰 Balance general:", updatedProfile?.broker_balance);
      console.log("💰 Balance MT5:", updatedAccount?.balance);
      
      return result.transfer_id;
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// ====================
// 5. VER ESTADO COMPLETO
// ====================
async function checkWalletStatus() {
  console.log("\n📊 ESTADO DEL WALLET");
  console.log("======================");
  
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.error("❌ No autenticado");
      return;
    }
    
    // Balance general
    const { data: profile } = await window.supabase
      .from('profiles')
      .select('broker_balance, broker_balance_updated_at')
      .eq('id', user.id)
      .single();
    
    console.log("👤 Usuario:", user.email);
    console.log("💰 Balance General:", profile?.broker_balance || 0, "USD");
    
    // Cuentas MT5
    const { data: accounts } = await window.supabase
      .from('broker_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');
    
    if (accounts && accounts.length > 0) {
      console.log("\n📈 CUENTAS MT5:");
      accounts.forEach(acc => {
        console.log(`   ${acc.account_name}: $${acc.balance || 0}`);
      });
    } else {
      console.log("\n📈 No hay cuentas MT5");
    }
    
    // Métodos de pago
    const { data: methods } = await window.supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', user.id);
    
    if (methods && methods.length > 0) {
      console.log("\n💳 MÉTODOS DE PAGO:");
      methods.forEach(m => {
        console.log(`   ${m.alias} (${m.network})`);
      });
    }
    
    // Transacciones recientes
    const { data: deposits } = await window.supabase
      .from('deposits')
      .select('amount, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (deposits && deposits.length > 0) {
      console.log("\n💵 DEPÓSITOS RECIENTES:");
      deposits.forEach(d => {
        console.log(`   $${d.amount} - ${d.status}`);
      });
    }
    
    console.log("======================");
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// ====================
// 6. LIMPIAR DATOS DE PRUEBA
// ====================
async function cleanTestData() {
  console.log("🧹 LIMPIANDO DATOS DE PRUEBA...");
  
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) return;
    
    // Limpiar depósitos de prueba
    await window.supabase
      .from('deposits')
      .delete()
      .eq('user_id', user.id)
      .like('transaction_hash', 'test_%');
    
    // Limpiar retiros pendientes
    await window.supabase
      .from('withdrawals')
      .delete()
      .eq('user_id', user.id)
      .eq('status', 'pending');
    
    // Resetear balances
    await window.supabase
      .from('profiles')
      .update({
        broker_balance: 0,
        broker_balance_updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    
    await window.supabase
      .from('broker_accounts')
      .update({ balance: 0 })
      .eq('user_id', user.id);
    
    console.log("✅ Datos limpiados");
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// ====================
// 7. SUITE COMPLETA
// ====================
async function runFullTest() {
  console.log("🚀 EJECUTANDO SUITE COMPLETA");
  console.log("============================\n");
  
  // Estado inicial
  await checkWalletStatus();
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Test 1: Depósito
  console.log("\n➡️ TEST 1: DEPÓSITO");
  await testDeposit();
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Test 2: Transferencia a MT5
  console.log("\n➡️ TEST 2: TRANSFERENCIA A MT5");
  await testTransferToMT5();
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Test 3: Transferencia desde MT5
  console.log("\n➡️ TEST 3: TRANSFERENCIA DESDE MT5");
  await testTransferFromMT5();
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Test 4: Retiro
  console.log("\n➡️ TEST 4: RETIRO");
  await testWithdrawal();
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Estado final
  console.log("\n📊 ESTADO FINAL:");
  await checkWalletStatus();
  
  console.log("\n✅ SUITE COMPLETADA");
  console.log("============================");
}

// ====================
// FUNCIÓN DE AYUDA RÁPIDA
// ====================
async function quickBalance(amount = 100) {
  console.log(`💰 Agregando $${amount} rápidamente...`);
  
  const { data: { user } } = await window.supabase.auth.getUser();
  if (!user) return;
  
  const { data: current } = await window.supabase
    .from('profiles')
    .select('broker_balance')
    .eq('id', user.id)
    .single();
  
  const newBalance = (current?.broker_balance || 0) + amount;
  
  await window.supabase
    .from('profiles')
    .update({
      broker_balance: newBalance,
      broker_balance_updated_at: new Date().toISOString()
    })
    .eq('id', user.id);
  
  console.log(`✅ Nuevo balance: $${newBalance}`);
}

// ====================
// INSTRUCCIONES
// ====================
console.log(`
╔════════════════════════════════════════════════════════════╗
║              TESTING DE WALLET - SUITE COMPLETA             ║
╠════════════════════════════════════════════════════════════╣
║                                                              ║
║  FUNCIONES PRINCIPALES:                                     ║
║                                                              ║
║  testDeposit()         - Depositar $100                     ║
║  testWithdrawal()      - Retirar $50                        ║
║  testTransferToMT5()   - Transferir $10 a MT5               ║
║  testTransferFromMT5() - Regresar $5 de MT5                 ║
║  checkWalletStatus()   - Ver estado actual                  ║
║  cleanTestData()       - Limpiar datos de prueba            ║
║                                                              ║
║  EJECUCIÓN RÁPIDA:                                          ║
║  runFullTest()         - Ejecutar todos los tests           ║
║  quickBalance(100)     - Agregar balance rápidamente        ║
║                                                              ║
║  FLUJO RECOMENDADO:                                         ║
║  1. checkWalletStatus()                                     ║
║  2. testDeposit()                                           ║
║  3. testTransferToMT5()                                     ║
║  4. testWithdrawal()                                        ║
║                                                              ║
╚════════════════════════════════════════════════════════════╝

💡 Comienza con: checkWalletStatus()
`);

// Exportar funciones
window.walletTest = {
  testDeposit,
  testWithdrawal,
  testTransferToMT5,
  testTransferFromMT5,
  checkWalletStatus,
  cleanTestData,
  runFullTest,
  quickBalance
};