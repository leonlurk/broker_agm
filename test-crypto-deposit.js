/**
 * Script de prueba para simular un depósito crypto sin enviar dinero real
 * Ejecutar con: node test-crypto-deposit.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Usar las variables de entorno correctas de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gjlztlpwffkphdnjuxoe.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_FIREBASE_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function simulateDeposit() {
  console.log('🔍 Simulando depósito crypto...\n');
  
  // 1. Primero autenticarse como usuario de prueba
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'fuckingnewtest@gmail.com', // Cambiar por tu email de prueba
    password: 'tupassword' // Cambiar por tu password
  });
  
  if (authError) {
    console.error('❌ Error de autenticación:', authError);
    return;
  }
  
  console.log('✅ Autenticado como:', authData.user.email);
  console.log('User ID:', authData.user.id);
  
  // 2. Simular que el Payroll detectó un depósito
  // Normalmente esto lo haría el Payroll API al detectar una transacción real
  const mockDepositData = {
    p_account_id: '12345', // ID de cuenta MT5
    p_account_name: 'Test Account',
    p_amount: 100, // $100 USD de prueba
    p_payment_method: 'crypto',
    p_crypto_currency: 'USDT_TRC20',
    p_crypto_network: 'TRON',
    p_wallet_address: 'TEaQgjdWECF4fjzgscF6pA5v2GQvPPhBpR',
    p_transaction_hash: 'TEST_TX_' + Date.now(), // Hash de prueba único
    p_payroll_data: {
      confirmed: true,
      amount: 100,
      network: 'TRON',
      tx_hash: 'TEST_TX_' + Date.now(),
      confirmed_at: new Date().toISOString(),
      test_mode: true // Marcador para identificar que es prueba
    }
  };
  
  console.log('\n📝 Creando solicitud de depósito con estos datos:');
  console.log('- Cuenta:', mockDepositData.p_account_name);
  console.log('- Monto:', mockDepositData.p_amount, 'USD');
  console.log('- Red:', mockDepositData.p_crypto_network);
  console.log('- Wallet:', mockDepositData.p_wallet_address);
  
  // 3. Llamar a la función RPC para crear el depósito
  const { data, error } = await supabase.rpc('create_deposit_request', mockDepositData);
  
  if (error) {
    console.error('\n❌ Error creando depósito:', error);
    return;
  }
  
  if (data && data.success) {
    console.log('\n✅ Depósito creado exitosamente!');
    console.log('- Deposit ID:', data.deposit_id);
    console.log('- Estado: pending (esperando aprobación del CRM)');
    console.log('\n📋 Próximos pasos:');
    console.log('1. El CRM debería ver esta solicitud en su panel');
    console.log('2. Un admin puede aprobarla desde el CRM');
    console.log('3. El usuario recibirá notificación cuando se apruebe');
  } else {
    console.error('\n❌ Error en la respuesta:', data);
  }
  
  // 4. Verificar que se creó en la base de datos
  if (data && data.deposit_id) {
    const { data: deposit, error: fetchError } = await supabase
      .from('deposits')
      .select('*')
      .eq('id', data.deposit_id)
      .single();
    
    if (deposit) {
      console.log('\n✅ Verificación - Depósito encontrado en BD:');
      console.log('- Status:', deposit.status);
      console.log('- Payroll Verified:', deposit.payroll_verified);
      console.log('- Created At:', deposit.created_at);
    }
  }
  
  // 5. Cerrar sesión
  await supabase.auth.signOut();
  console.log('\n👋 Sesión cerrada');
}

// Ejecutar la simulación
simulateDeposit().catch(console.error);