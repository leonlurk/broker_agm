// ========================================
// SCRIPTS SIMPLIFICADOS DE TESTING - SIN MODIFICAR BD
// ========================================
// Para usar cuando no quieres modificar la estructura de la base de datos

// 1. AGREGAR BALANCE DE PRUEBA DIRECTAMENTE
async function addTestBalance(amount = 100) {
  console.log(`💰 Agregando ${amount} USD de balance de prueba...`);
  
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.error("❌ No hay usuario autenticado");
      return;
    }
    
    // Obtener balance actual
    const { data: profile } = await window.supabase
      .from('profiles')
      .select('broker_balance')
      .eq('id', user.id)
      .single();
    
    const currentBalance = profile?.broker_balance || 0;
    console.log("📊 Balance actual:", currentBalance, "USD");
    
    // Agregar el monto especificado
    const newBalance = currentBalance + amount;
    
    const { error } = await window.supabase
      .from('profiles')
      .update({
        broker_balance: newBalance,
        broker_balance_updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    
    if (!error) {
      console.log("✅ Nuevo balance:", newBalance, "USD");
      console.log(`✅ Se agregaron ${amount} USD exitosamente`);
      return newBalance;
    } else {
      console.error("❌ Error:", error);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// 2. RESTAR BALANCE (SIMULAR RETIRO)
async function subtractTestBalance(amount = 50) {
  console.log(`💸 Restando ${amount} USD del balance...`);
  
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.error("❌ No hay usuario autenticado");
      return;
    }
    
    // Obtener balance actual
    const { data: profile } = await window.supabase
      .from('profiles')
      .select('broker_balance')
      .eq('id', user.id)
      .single();
    
    const currentBalance = profile?.broker_balance || 0;
    console.log("📊 Balance actual:", currentBalance, "USD");
    
    if (currentBalance < amount) {
      console.warn("⚠️ Balance insuficiente");
      return;
    }
    
    // Restar el monto
    const newBalance = currentBalance - amount;
    
    const { error } = await window.supabase
      .from('profiles')
      .update({
        broker_balance: newBalance,
        broker_balance_updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    
    if (!error) {
      console.log("✅ Nuevo balance:", newBalance, "USD");
      console.log(`✅ Se restaron ${amount} USD exitosamente`);
      return newBalance;
    } else {
      console.error("❌ Error:", error);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// 3. TRANSFERIR A MT5 SIMPLIFICADO
async function quickTransferToMT5(amount = 10) {
  console.log(`🔄 Transfiriendo ${amount} USD a cuenta MT5...`);
  
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
    
    if ((profile?.broker_balance || 0) < amount) {
      console.warn("⚠️ Balance insuficiente. Ejecuta addTestBalance() primero");
      return;
    }
    
    // Buscar o crear cuenta MT5
    let { data: accounts } = await window.supabase
      .from('broker_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');
    
    let mt5Account;
    
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
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      mt5Account = newAccount;
    } else {
      mt5Account = accounts[0];
    }
    
    console.log("🎯 Cuenta MT5:", mt5Account.account_name);
    
    // Ejecutar transferencia con RPC
    const { data: result, error } = await window.supabase.rpc('create_transfer_request', {
      p_from_account_id: 'general',
      p_from_account_name: 'Balance General',
      p_to_account_id: mt5Account.id,
      p_to_account_name: mt5Account.account_name,
      p_amount: amount
    });
    
    if (error) {
      console.error("❌ Error en transferencia:", error);
      return;
    }
    
    if (result?.success) {
      console.log("✅ Transferencia exitosa!");
      console.log("📊 Resultado:", result);
      
      // Verificar nuevos balances
      const { data: newProfile } = await window.supabase
        .from('profiles')
        .select('broker_balance')
        .eq('id', user.id)
        .single();
      
      const { data: updatedAccount } = await window.supabase
        .from('broker_accounts')
        .select('balance')
        .eq('id', mt5Account.id)
        .single();
      
      console.log("💰 Balance General después:", newProfile?.broker_balance, "USD");
      console.log("💰 Balance MT5 después:", updatedAccount?.balance, "USD");
    } else {
      console.error("❌ Transferencia falló:", result?.error);
    }
    
    return result;
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// 4. VER ESTADO RÁPIDO
async function quickStatus() {
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.error("❌ No hay usuario autenticado");
      return;
    }
    
    // Balance general
    const { data: profile } = await window.supabase
      .from('profiles')
      .select('broker_balance')
      .eq('id', user.id)
      .single();
    
    // Cuentas MT5
    const { data: accounts } = await window.supabase
      .from('broker_accounts')
      .select('account_name, balance')
      .eq('user_id', user.id)
      .eq('status', 'active');
    
    console.log("📊 ESTADO RÁPIDO");
    console.log("================");
    console.log("👤 Usuario:", user.email);
    console.log("💰 Balance General:", profile?.broker_balance || 0, "USD");
    
    if (accounts && accounts.length > 0) {
      console.log("📈 Cuentas MT5:");
      accounts.forEach(acc => {
        console.log(`  - ${acc.account_name}: ${acc.balance || 0} USD`);
      });
    } else {
      console.log("📈 No hay cuentas MT5");
    }
    console.log("================");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// 5. RESETEAR TODO A CERO
async function resetAllBalances() {
  console.log("🔄 Reseteando todos los balances a 0...");
  
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.error("❌ No hay usuario autenticado");
      return;
    }
    
    // Resetear balance general
    await window.supabase
      .from('profiles')
      .update({
        broker_balance: 0,
        broker_balance_updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    
    // Resetear balances MT5
    await window.supabase
      .from('broker_accounts')
      .update({ 
        balance: 0,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);
    
    console.log("✅ Todos los balances reseteados a 0");
    
    // Mostrar estado
    await quickStatus();
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// 6. TEST RÁPIDO COMPLETO
async function quickTest() {
  console.log("🚀 EJECUTANDO TEST RÁPIDO");
  console.log("=========================\n");
  
  console.log("1️⃣ Estado inicial:");
  await quickStatus();
  
  console.log("\n2️⃣ Agregando 100 USD...");
  await addTestBalance(100);
  
  console.log("\n3️⃣ Transfiriendo 10 USD a MT5...");
  await quickTransferToMT5(10);
  
  console.log("\n4️⃣ Estado final:");
  await quickStatus();
  
  console.log("\n✅ TEST COMPLETADO");
}

// MOSTRAR INSTRUCCIONES
console.log(`
╔════════════════════════════════════════════════════════════╗
║           SCRIPTS SIMPLIFICADOS DE TESTING                  ║
╠════════════════════════════════════════════════════════════╣
║                                                              ║
║  FUNCIONES RÁPIDAS:                                         ║
║                                                              ║
║  addTestBalance(100)    - Agregar balance de prueba         ║
║  subtractTestBalance(50) - Restar balance                   ║
║  quickTransferToMT5(10) - Transferir a MT5                  ║
║  quickStatus()          - Ver balances actuales             ║
║  resetAllBalances()     - Resetear todo a 0                 ║
║  quickTest()            - Ejecutar test completo            ║
║                                                              ║
║  INICIO RÁPIDO:                                             ║
║  > quickTest()          - Ejecuta todo automáticamente      ║
║                                                              ║
╚════════════════════════════════════════════════════════════╝
`);

// Exportar funciones
window.simpleTests = {
  addTestBalance,
  subtractTestBalance,
  quickTransferToMT5,
  quickStatus,
  resetAllBalances,
  quickTest
};