// ========================================
// SCRIPTS DE TESTING PARA WALLET - AGM BROKER
// ========================================
// Ejecutar estos scripts en la consola del navegador mientras estás en la sección Wallet

// ====================
// 1. DEPÓSITOS (DEPOSITS)
// ====================
// Flujo: Usuario deposita crypto → Va al balance general (broker_balance) → Luego puede transferir a MT5

// 1.1 Simular un depósito de prueba (sin dinero real)
async function testDeposit() {
  console.log("🔵 INICIANDO TEST DE DEPÓSITO...");
  
  try {
    // Verificar que supabase esté disponible
    if (!window.supabase) {
      console.error("❌ Supabase no está disponible. Asegúrate de estar en la sección Wallet");
      return;
    }
    
    // Obtener usuario actual
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.error("❌ No hay usuario autenticado");
      return;
    }
    
    console.log("✅ Usuario autenticado:", user.email);
    
    // Ver balance actual del broker
    const { data: profileBefore } = await window.supabase
      .from('profiles')
      .select('broker_balance')
      .eq('id', user.id)
      .single();
    
    console.log("💰 Balance general ANTES:", profileBefore?.broker_balance || 0);
    
    // Crear una solicitud de depósito de prueba
    const depositData = {
      user_id: user.id,
      account_id: 'general',
      account_name: 'Balance General',
      amount: 100, // Monto de prueba
      currency: 'USD',
      payment_method: 'crypto',
      crypto_currency: 'USDT',
      crypto_network: 'tron',
      wallet_address: 'TTestWalletAddress123456789',
      transaction_hash: 'test_tx_' + Date.now(),
      status: 'pending',
      submitted_at: new Date().toISOString()
    };
    
    console.log("📝 Creando depósito de prueba:", depositData);
    
    const { data: deposit, error } = await window.supabase
      .from('deposits')
      .insert([depositData])
      .select()
      .single();
    
    if (error) {
      console.error("❌ Error al crear depósito:", error);
      return;
    }
    
    console.log("✅ Depósito creado:", deposit);
    
    // Simular aprobación del depósito (normalmente lo haría un admin)
    console.log("⏳ Simulando aprobación del depósito...");
    
    // Actualizar estado a completado
    const { error: updateError } = await window.supabase
      .from('deposits')
      .update({ 
        status: 'completed',
        approved_at: new Date().toISOString()
      })
      .eq('id', deposit.id);
    
    if (!updateError) {
      // Actualizar balance del broker
      const newBalance = (profileBefore?.broker_balance || 0) + depositData.amount;
      await window.supabase
        .from('profiles')
        .update({ 
          broker_balance: newBalance,
          broker_balance_updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      console.log("✅ Balance actualizado a:", newBalance);
    }
    
    // Verificar balance final
    const { data: profileAfter } = await window.supabase
      .from('profiles')
      .select('broker_balance')
      .eq('id', user.id)
      .single();
    
    console.log("💰 Balance general DESPUÉS:", profileAfter?.broker_balance || 0);
    console.log("✅ TEST DE DEPÓSITO COMPLETADO");
    
    return deposit.id;
  } catch (error) {
    console.error("❌ Error en test de depósito:", error);
  }
}

// ====================
// 2. RETIROS (WITHDRAWALS)
// ====================
// Flujo: Usuario retira desde balance general → Requiere aprobación admin → Se procesa el pago

// 2.1 Simular un retiro de prueba
async function testWithdrawal() {
  console.log("🟡 INICIANDO TEST DE RETIRO...");
  
  try {
    // Verificar usuario y balance
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.error("❌ No hay usuario autenticado");
      return;
    }
    
    const { data: profile } = await window.supabase
      .from('profiles')
      .select('broker_balance')
      .eq('id', user.id)
      .single();
    
    const currentBalance = profile?.broker_balance || 0;
    console.log("💰 Balance general actual:", currentBalance);
    
    if (currentBalance < 50) {
      console.warn("⚠️ Balance insuficiente para retiro. Mínimo: 50 USD");
      console.log("💡 Ejecuta primero testDeposit() para agregar fondos de prueba");
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
      console.log("📝 Creando método de pago de prueba...");
      const { data: newMethod } = await window.supabase
        .from('payment_methods')
        .insert([{
          user_id: user.id,
          alias: 'Mi Wallet Test',
          address: 'TTestWalletAddress987654321',
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
    
    console.log("💳 Método de pago:", paymentMethod);
    
    // Crear solicitud de retiro
    const withdrawalData = {
      user_id: user.id,
      account_id: 'general',
      account_name: 'Balance General',
      amount: 50, // Monto mínimo de prueba
      currency: 'USD',
      withdrawal_type: 'crypto',
      wallet_address: paymentMethod.address,
      network: paymentMethod.network === 'tron_trc20' ? 'tron' : 'ethereum',
      status: 'pending',
      requested_at: new Date().toISOString()
    };
    
    console.log("📝 Creando retiro de prueba:", withdrawalData);
    
    const { data: withdrawal, error } = await window.supabase
      .from('withdrawals')
      .insert([withdrawalData])
      .select()
      .single();
    
    if (error) {
      console.error("❌ Error al crear retiro:", error);
      return;
    }
    
    console.log("✅ Retiro creado (pendiente de aprobación):", withdrawal);
    
    // Actualizar balance (restar el monto)
    const newBalance = currentBalance - withdrawalData.amount;
    await window.supabase
      .from('profiles')
      .update({ 
        broker_balance: newBalance,
        broker_balance_updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    
    console.log("💰 Balance actualizado a:", newBalance);
    console.log("⏳ El retiro requiere aprobación del administrador");
    console.log("✅ TEST DE RETIRO COMPLETADO");
    
    return withdrawal.id;
  } catch (error) {
    console.error("❌ Error en test de retiro:", error);
  }
}

// ====================
// 3. TRANSFERENCIAS (TRANSFERS)
// ====================
// Flujo: Balance General ↔ Cuentas MT5

// 3.1 Transferir de Balance General a cuenta MT5
async function testTransferToMT5() {
  console.log("🟢 INICIANDO TEST DE TRANSFERENCIA A MT5...");
  
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
    
    // Obtener cuentas MT5
    const { data: accounts } = await window.supabase
      .from('broker_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');
    
    if (!accounts || accounts.length === 0) {
      console.log("📝 Creando cuenta MT5 de prueba...");
      const { data: newAccount } = await window.supabase
        .from('broker_accounts')
        .insert([{
          user_id: user.id,
          account_name: 'MT5 Test Account',
          account_number: 'MT5-' + Date.now(),
          account_type: 'real',
          balance: 0,
          currency: 'USD',
          status: 'active'
        }])
        .select()
        .single();
      accounts = [newAccount];
    }
    
    const mt5Account = accounts[0];
    console.log("🎯 Cuenta MT5 destino:", mt5Account);
    
    // Ejecutar transferencia usando la función RPC
    const transferAmount = 10;
    console.log(`📤 Transfiriendo ${transferAmount} USD a MT5...`);
    
    const { data: result, error } = await window.supabase.rpc('create_transfer_request', {
      p_from_account_id: 'general',
      p_from_account_name: 'Balance General',
      p_to_account_id: mt5Account.id,
      p_to_account_name: mt5Account.account_name,
      p_amount: transferAmount
    });
    
    if (error) {
      console.error("❌ Error en transferencia:", error);
      return;
    }
    
    console.log("✅ Resultado de transferencia:", result);
    
    if (result.success) {
      // Verificar balances actualizados
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
      
      console.log("💰 Balance general después:", updatedProfile?.broker_balance);
      console.log("💰 Balance MT5 después:", updatedAccount?.balance);
      console.log("✅ TRANSFERENCIA COMPLETADA");
    } else {
      console.error("❌ Transferencia falló:", result.error);
    }
    
    return result;
  } catch (error) {
    console.error("❌ Error en test de transferencia:", error);
  }
}

// 3.2 Transferir de MT5 a Balance General
async function testTransferFromMT5() {
  console.log("🔵 INICIANDO TEST DE TRANSFERENCIA DESDE MT5...");
  
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.error("❌ No hay usuario autenticado");
      return;
    }
    
    // Obtener cuenta MT5 con balance
    const { data: accounts } = await window.supabase
      .from('broker_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('balance', 0);
    
    if (!accounts || accounts.length === 0) {
      console.warn("⚠️ No hay cuentas MT5 con balance. Ejecuta testTransferToMT5() primero");
      return;
    }
    
    const mt5Account = accounts[0];
    console.log("🎯 Cuenta MT5 origen:", mt5Account);
    
    const transferAmount = Math.min(5, mt5Account.balance);
    console.log(`📥 Transfiriendo ${transferAmount} USD al Balance General...`);
    
    const { data: result, error } = await window.supabase.rpc('create_transfer_request', {
      p_from_account_id: mt5Account.id,
      p_from_account_name: mt5Account.account_name,
      p_to_account_id: 'general',
      p_to_account_name: 'Balance General',
      p_amount: transferAmount
    });
    
    if (error) {
      console.error("❌ Error en transferencia:", error);
      return;
    }
    
    console.log("✅ Resultado de transferencia:", result);
    
    if (result.success) {
      // Verificar balances actualizados
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
      
      console.log("💰 Balance general después:", updatedProfile?.broker_balance);
      console.log("💰 Balance MT5 después:", updatedAccount?.balance);
      console.log("✅ TRANSFERENCIA COMPLETADA");
    }
    
    return result;
  } catch (error) {
    console.error("❌ Error en test de transferencia:", error);
  }
}

// ====================
// 4. FUNCIONES DE UTILIDAD
// ====================

// 4.1 Ver estado completo del wallet
async function checkWalletStatus() {
  console.log("📊 ESTADO COMPLETO DEL WALLET");
  console.log("================================");
  
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.error("❌ No hay usuario autenticado");
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
    console.log("📅 Última actualización:", profile?.broker_balance_updated_at);
    
    // Cuentas MT5
    const { data: accounts } = await window.supabase
      .from('broker_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');
    
    console.log("\n📈 CUENTAS MT5:");
    if (accounts && accounts.length > 0) {
      accounts.forEach(acc => {
        console.log(`  - ${acc.account_name}: $${acc.balance || 0} USD (${acc.account_number})`);
      });
    } else {
      console.log("  No hay cuentas MT5 activas");
    }
    
    // Métodos de pago
    const { data: methods } = await window.supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', user.id);
    
    console.log("\n💳 MÉTODOS DE PAGO:");
    if (methods && methods.length > 0) {
      methods.forEach(method => {
        console.log(`  - ${method.alias}: ${method.network === 'tron_trc20' ? 'TRC-20' : 'ERC-20'}`);
        console.log(`    ${method.address}`);
      });
    } else {
      console.log("  No hay métodos de pago configurados");
    }
    
    // Transacciones recientes
    console.log("\n📜 TRANSACCIONES RECIENTES:");
    
    // Depósitos
    const { data: deposits } = await window.supabase
      .from('deposits')
      .select('*')
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })
      .limit(3);
    
    if (deposits && deposits.length > 0) {
      console.log("  Depósitos:");
      deposits.forEach(d => {
        console.log(`    - $${d.amount} ${d.currency} - ${d.status} (${new Date(d.submitted_at).toLocaleDateString()})`);
      });
    }
    
    // Retiros
    const { data: withdrawals } = await window.supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', user.id)
      .order('requested_at', { ascending: false })
      .limit(3);
    
    if (withdrawals && withdrawals.length > 0) {
      console.log("  Retiros:");
      withdrawals.forEach(w => {
        console.log(`    - $${w.amount} ${w.currency} - ${w.status} (${new Date(w.requested_at).toLocaleDateString()})`);
      });
    }
    
    // Transferencias
    const { data: transfers } = await window.supabase
      .from('internal_transfers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (transfers && transfers.length > 0) {
      console.log("  Transferencias:");
      transfers.forEach(t => {
        console.log(`    - $${t.amount} de ${t.from_account_name} a ${t.to_account_name} - ${t.status} (${new Date(t.created_at).toLocaleDateString()})`);
      });
    }
    
    console.log("================================");
  } catch (error) {
    console.error("❌ Error al verificar estado:", error);
  }
}

// 4.2 Limpiar datos de prueba
async function cleanTestData() {
  console.log("🧹 LIMPIANDO DATOS DE PRUEBA...");
  
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.error("❌ No hay usuario autenticado");
      return;
    }
    
    // Eliminar depósitos de prueba
    await window.supabase
      .from('deposits')
      .delete()
      .eq('user_id', user.id)
      .like('transaction_hash', 'test_tx_%');
    
    // Eliminar retiros pendientes
    await window.supabase
      .from('withdrawals')
      .delete()
      .eq('user_id', user.id)
      .eq('status', 'pending');
    
    // Resetear balance general a 0
    await window.supabase
      .from('profiles')
      .update({ 
        broker_balance: 0,
        broker_balance_updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    
    // Resetear balances de cuentas MT5
    await window.supabase
      .from('broker_accounts')
      .update({ balance: 0 })
      .eq('user_id', user.id);
    
    console.log("✅ Datos de prueba limpiados");
  } catch (error) {
    console.error("❌ Error al limpiar datos:", error);
  }
}

// ====================
// 5. SUITE DE PRUEBAS COMPLETA
// ====================
async function runFullTestSuite() {
  console.log("🚀 EJECUTANDO SUITE COMPLETA DE PRUEBAS");
  console.log("========================================\n");
  
  // Estado inicial
  console.log("📊 ESTADO INICIAL:");
  await checkWalletStatus();
  
  console.log("\n⏳ Esperando 2 segundos...\n");
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 1: Depósito
  console.log("TEST 1: DEPÓSITO");
  await testDeposit();
  
  console.log("\n⏳ Esperando 2 segundos...\n");
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 2: Transferencia a MT5
  console.log("\nTEST 2: TRANSFERENCIA A MT5");
  await testTransferToMT5();
  
  console.log("\n⏳ Esperando 2 segundos...\n");
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 3: Transferencia desde MT5
  console.log("\nTEST 3: TRANSFERENCIA DESDE MT5");
  await testTransferFromMT5();
  
  console.log("\n⏳ Esperando 2 segundos...\n");
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 4: Retiro
  console.log("\nTEST 4: RETIRO");
  await testWithdrawal();
  
  console.log("\n⏳ Esperando 2 segundos...\n");
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Estado final
  console.log("\n📊 ESTADO FINAL:");
  await checkWalletStatus();
  
  console.log("\n✅ SUITE DE PRUEBAS COMPLETADA");
  console.log("========================================");
}

// ====================
// INSTRUCCIONES DE USO
// ====================
console.log(`
╔════════════════════════════════════════════════════════════╗
║              SCRIPTS DE TESTING PARA WALLET                 ║
╠════════════════════════════════════════════════════════════╣
║                                                              ║
║  FUNCIONES DISPONIBLES:                                     ║
║                                                              ║
║  1. testDeposit()         - Simula un depósito crypto       ║
║  2. testWithdrawal()      - Simula un retiro                ║
║  3. testTransferToMT5()   - Transfer Balance → MT5          ║
║  4. testTransferFromMT5() - Transfer MT5 → Balance          ║
║  5. checkWalletStatus()   - Ver estado completo             ║
║  6. cleanTestData()       - Limpiar datos de prueba         ║
║  7. runFullTestSuite()    - Ejecutar todas las pruebas      ║
║                                                              ║
║  FLUJO RECOMENDADO:                                         ║
║  1. checkWalletStatus()   - Ver estado inicial              ║
║  2. testDeposit()         - Agregar fondos de prueba        ║
║  3. testTransferToMT5()   - Probar transferencia            ║
║  4. testWithdrawal()      - Probar retiro                   ║
║  5. cleanTestData()       - Limpiar al terminar             ║
║                                                              ║
║  NOTA: Estos son datos de PRUEBA. No se usa dinero real.    ║
║                                                              ║
╚════════════════════════════════════════════════════════════╝

💡 Ejecuta: checkWalletStatus() para comenzar
`);

// Exportar funciones globalmente para fácil acceso
window.walletTests = {
  testDeposit,
  testWithdrawal,
  testTransferToMT5,
  testTransferFromMT5,
  checkWalletStatus,
  cleanTestData,
  runFullTestSuite
};