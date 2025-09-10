// ========================================
// SCRIPTS DE TESTING PARA WALLET - VERSIÓN FINAL
// ========================================
// Funciona con la estructura real de tu base de datos

// ====================
// 1. DEPÓSITOS (DEPOSITS)
// ====================

async function testDepositFinal() {
  console.log("🔵 INICIANDO TEST DE DEPÓSITO...");
  
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.error("❌ No hay usuario autenticado");
      return;
    }
    
    console.log("✅ Usuario:", user.email);
    
    // Ver balance antes
    const { data: profileBefore } = await window.supabase
      .from('profiles')
      .select('broker_balance')
      .eq('id', user.id)
      .single();
    
    console.log("💰 Balance ANTES:", profileBefore?.broker_balance || 0);
    
    // Crear depósito con TODAS las columnas necesarias
    const depositData = {
      user_id: user.id,
      account_id: 'general',
      account_name: 'Balance General',
      amount: 100,
      amount_usd: 100,
      currency: 'USD',
      payment_method: 'crypto',
      crypto_currency: 'USDT',
      crypto_network: 'tron',
      wallet_address: 'TTestWalletAddress123456789',
      transaction_hash: 'test_tx_' + Date.now(),
      status: 'pending',
      submitted_at: new Date().toISOString(),
      email: user.email,
      client_name: user.email
    };
    
    console.log("📝 Creando depósito de prueba...");
    
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
    
    // Simular aprobación del depósito
    console.log("⏳ Simulando aprobación...");
    
    const { error: updateError } = await window.supabase
      .from('deposits')
      .update({ 
        status: 'completed',
        approved_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
      .eq('id', deposit.id);
    
    if (!updateError) {
      // Actualizar balance del broker
      const newBalance = (profileBefore?.broker_balance || 0) + 100;
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
    
    console.log("💰 Balance DESPUÉS:", profileAfter?.broker_balance || 0);
    console.log("✅ TEST DE DEPÓSITO COMPLETADO");
    
    return deposit.id;
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// ====================
// 2. RETIROS (WITHDRAWALS)
// ====================

async function testWithdrawalFinal() {
  console.log("🟡 INICIANDO TEST DE RETIRO...");
  
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
      console.log("💡 Ejecuta primero testDepositFinal()");
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
    
    console.log("💳 Método de pago:", paymentMethod?.alias);
    
    // Crear solicitud de retiro
    const withdrawalData = {
      user_id: user.id,
      account_id: 'general',
      account_name: 'Balance General',
      amount: 50,
      currency: 'USD',
      withdrawal_type: 'crypto',
      wallet_address: paymentMethod?.address || 'TTestWallet123',
      network: paymentMethod?.network === 'tron_trc20' ? 'tron' : 'ethereum',
      status: 'pending',
      requested_at: new Date().toISOString()
    };
    
    console.log("📝 Creando retiro de prueba...");
    
    const { data: withdrawal, error } = await window.supabase
      .from('withdrawals')
      .insert([withdrawalData])
      .select()
      .single();
    
    if (error) {
      console.error("❌ Error al crear retiro:", error);
      return;
    }
    
    console.log("✅ Retiro creado (pendiente de aprobación):", withdrawal.id);
    
    // Actualizar balance (restar el monto)
    const newBalance = currentBalance - 50;
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
    console.error("❌ Error:", error);
  }
}

// ====================
// 3. TRANSFERENCIAS (TRANSFERS)
// ====================

async function testTransferToMT5Final() {
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
      console.warn("⚠️ Balance insuficiente. Ejecuta testDepositFinal() primero");
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
      console.log("📝 Creando cuenta MT5 de prueba...");
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
        console.error("❌ Error creando cuenta MT5:", error);
        return;
      }
      
      mt5Account = newAccount;
    } else {
      mt5Account = accounts[0];
    }
    
    console.log("🎯 Cuenta MT5 destino:", mt5Account.account_name);
    
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
    
    console.log("📊 Resultado:", result);
    
    if (result?.success) {
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
      console.error("❌ Transferencia falló:", result?.error);
    }
    
    return result;
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

async function testTransferFromMT5Final() {
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
      console.warn("⚠️ No hay cuentas MT5 con balance. Ejecuta testTransferToMT5Final() primero");
      return;
    }
    
    const mt5Account = accounts[0];
    console.log("🎯 Cuenta MT5 origen:", mt5Account.account_name, "Balance:", mt5Account.balance);
    
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
    
    console.log("📊 Resultado:", result);
    
    if (result?.success) {
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
    console.error("❌ Error:", error);
  }
}

// ====================
// 4. FUNCIONES DE UTILIDAD
// ====================

async function checkWalletStatusFinal() {
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
        console.log(`    - $${d.amount} ${d.currency || 'USD'} - ${d.status} (${new Date(d.submitted_at).toLocaleDateString()})`);
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
        console.log(`    - $${w.amount} ${w.currency || 'USD'} - ${w.status} (${new Date(w.requested_at).toLocaleDateString()})`);
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
    console.error("❌ Error:", error);
  }
}

async function cleanTestDataFinal() {
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
    console.error("❌ Error:", error);
  }
}

// ====================
// 5. SUITE COMPLETA DE PRUEBAS
// ====================

async function runFullTestSuiteFinal() {
  console.log("🚀 EJECUTANDO SUITE COMPLETA DE PRUEBAS");
  console.log("========================================\n");
  
  // Estado inicial
  console.log("📊 ESTADO INICIAL:");
  await checkWalletStatusFinal();
  
  console.log("\n⏳ Esperando 2 segundos...\n");
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 1: Depósito
  console.log("TEST 1: DEPÓSITO");
  await testDepositFinal();
  
  console.log("\n⏳ Esperando 2 segundos...\n");
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 2: Transferencia a MT5
  console.log("\nTEST 2: TRANSFERENCIA A MT5");
  await testTransferToMT5Final();
  
  console.log("\n⏳ Esperando 2 segundos...\n");
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 3: Transferencia desde MT5
  console.log("\nTEST 3: TRANSFERENCIA DESDE MT5");
  await testTransferFromMT5Final();
  
  console.log("\n⏳ Esperando 2 segundos...\n");
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 4: Retiro
  console.log("\nTEST 4: RETIRO");
  await testWithdrawalFinal();
  
  console.log("\n⏳ Esperando 2 segundos...\n");
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Estado final
  console.log("\n📊 ESTADO FINAL:");
  await checkWalletStatusFinal();
  
  console.log("\n✅ SUITE DE PRUEBAS COMPLETADA");
  console.log("========================================");
}

// ====================
// INSTRUCCIONES
// ====================

console.log(`
╔════════════════════════════════════════════════════════════╗
║         SCRIPTS DE TESTING PARA WALLET - FINAL              ║
╠════════════════════════════════════════════════════════════╣
║                                                              ║
║  FUNCIONES DISPONIBLES:                                     ║
║                                                              ║
║  1. testDepositFinal()         - Simula depósito crypto     ║
║  2. testWithdrawalFinal()      - Simula retiro              ║
║  3. testTransferToMT5Final()   - Transfer a MT5             ║
║  4. testTransferFromMT5Final() - Transfer desde MT5         ║
║  5. checkWalletStatusFinal()   - Ver estado completo        ║
║  6. cleanTestDataFinal()       - Limpiar datos de prueba    ║
║  7. runFullTestSuiteFinal()    - Ejecutar todo              ║
║                                                              ║
║  FLUJO RECOMENDADO:                                         ║
║  1. checkWalletStatusFinal()   - Ver estado inicial         ║
║  2. testDepositFinal()         - Agregar fondos             ║
║  3. testTransferToMT5Final()   - Probar transferencia       ║
║  4. testWithdrawalFinal()      - Probar retiro              ║
║                                                              ║
║  INICIO RÁPIDO:                                             ║
║  > runFullTestSuiteFinal()     - Ejecuta todo               ║
║                                                              ║
╚════════════════════════════════════════════════════════════╝

💡 Ejecuta: checkWalletStatusFinal() para comenzar
`);

// Exportar funciones
window.walletTestsFinal = {
  testDepositFinal,
  testWithdrawalFinal,
  testTransferToMT5Final,
  testTransferFromMT5Final,
  checkWalletStatusFinal,
  cleanTestDataFinal,
  runFullTestSuiteFinal
};