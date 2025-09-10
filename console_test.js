// COPIA Y PEGA ESTE CÓDIGO EN LA CONSOLA DEL NAVEGADOR
// Asegúrate de estar logueado en la aplicación

// Obtener supabase del window (ya está disponible en tu app)
const { supabase } = window;

// FUNCIONES DE PRUEBA
const walletTest = {
  // 1. DEPOSITAR
  async deposit(amount = 100) {
    console.log('🟢 Depositando $' + amount);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
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

    if (!error) {
      // Actualizar balance
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
      
      console.log('✅ Depósito exitoso. Nuevo balance: $' + newBalance);
      return newBalance;
    } else {
      console.error('❌ Error:', error);
      return null;
    }
  },

  // 2. RETIRAR
  async withdraw(amount = 50) {
    console.log('🔴 Retirando $' + amount);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
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
        status: 'pending',
        requested_at: new Date().toISOString()
      })
      .select()
      .single();

    if (!error) {
      console.log('✅ Retiro solicitado (pendiente de aprobación)');
      return data;
    } else {
      console.error('❌ Error:', error);
      return null;
    }
  },

  // 3. TRANSFERIR
  async transfer(amount = 25) {
    console.log('🔄 Transfiriendo $' + amount);
    const { data: { user } } = await supabase.auth.getUser();
    
    // Obtener cuentas
    const { data: accounts } = await supabase
      .from('broker_accounts')
      .select('*')
      .eq('user_id', user.id);
    
    const brokerBalance = accounts[0]?.broker_balance || 0;
    if (brokerBalance < amount) {
      console.error('❌ Balance insuficiente: $' + brokerBalance);
      return null;
    }
    
    // Buscar cuenta MT5
    const mt5 = accounts.find(a => a.account_type === 'real' || a.account_type === 'demo');
    if (!mt5) {
      console.error('❌ No hay cuenta MT5');
      return null;
    }
    
    // Crear transferencia
    const { data, error } = await supabase
      .from('internal_transfers')
      .insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        from_account_id: 'general',
        from_account_name: 'Balance General',
        to_account_id: mt5.id,
        to_account_name: mt5.account_name || 'MT5',
        amount: amount,
        currency: 'USD',
        status: 'completed',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (!error) {
      // Actualizar balances
      await supabase
        .from('broker_accounts')
        .update({ broker_balance: brokerBalance - amount })
        .eq('user_id', user.id);
      
      await supabase
        .from('broker_accounts')
        .update({ balance: (mt5.balance || 0) + amount })
        .eq('id', mt5.id);
      
      console.log('✅ Transferencia exitosa');
      console.log('   Balance General: $' + (brokerBalance - amount));
      console.log('   Balance MT5: $' + ((mt5.balance || 0) + amount));
      return data;
    } else {
      console.error('❌ Error:', error);
      return null;
    }
  },

  // 4. VER BALANCES
  async balances() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: accounts } = await supabase
      .from('broker_accounts')
      .select('*')
      .eq('user_id', user.id);
    
    console.log('💰 BALANCES:');
    console.log('   Balance General: $' + (accounts[0]?.broker_balance || 0));
    accounts.forEach(acc => {
      if (acc.account_type) {
        console.log(`   ${acc.account_name || acc.id}: $${acc.balance || 0}`);
      }
    });
    return accounts;
  }
};

// Hacer disponible globalmente
window.walletTest = walletTest;

console.log(`
✅ PRUEBAS DE WALLET CARGADAS
============================

Comandos disponibles:

walletTest.deposit(100)   // Depositar $100
walletTest.withdraw(50)   // Retirar $50 
walletTest.transfer(25)   // Transferir $25
walletTest.balances()     // Ver balances

Ejemplo de uso completo:
1. await walletTest.deposit(100)
2. await walletTest.transfer(30)
3. await walletTest.withdraw(20)
4. await walletTest.balances()
`);