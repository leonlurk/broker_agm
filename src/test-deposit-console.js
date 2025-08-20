/**
 * Script para ejecutar en la consola del navegador
 * Simula un depósito sin enviar dinero real
 * 
 * INSTRUCCIONES:
 * 1. Abre el broker en el navegador
 * 2. Inicia sesión con tu usuario
 * 3. Abre la consola del navegador (F12)
 * 4. Copia y pega este código
 * 5. Ejecuta testDeposit()
 */

async function testDeposit() {
  console.log('🧪 TEST DE DEPÓSITO SIMULADO');
  console.log('================================\n');
  
  // Importar supabase desde el contexto global
  const { supabase } = window;
  
  if (!supabase) {
    console.error('❌ Supabase no está disponible. Asegúrate de estar en la aplicación del broker.');
    return;
  }
  
  // Verificar que el usuario está autenticado
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('❌ No hay usuario autenticado. Por favor inicia sesión primero.');
    return;
  }
  
  console.log('✅ Usuario autenticado:', user.email);
  console.log('   User ID:', user.id);
  
  // Datos de prueba para el depósito
  const testDepositData = {
    p_account_id: 'TEST_ACCOUNT_001',
    p_account_name: 'Cuenta de Prueba',
    p_amount: 50, // $50 USD de prueba
    p_payment_method: 'crypto',
    p_crypto_currency: 'USDT_TRC20',
    p_crypto_network: 'TRON',
    p_wallet_address: 'TEaQgjdWECF4fjzgscF6pA5v2GQvPPhBpR',
    p_transaction_hash: 'TEST_HASH_' + Date.now(),
    p_payroll_data: {
      test_mode: true,
      confirmed: true,
      amount: 50,
      network: 'TRON',
      confirmed_at: new Date().toISOString()
    }
  };
  
  console.log('\n📝 Creando solicitud de depósito de prueba...');
  console.log('   Monto: $' + testDepositData.p_amount + ' USD');
  console.log('   Red: ' + testDepositData.p_crypto_network);
  console.log('   Cuenta: ' + testDepositData.p_account_name);
  
  try {
    // Llamar a la función RPC
    const { data, error } = await supabase.rpc('create_deposit_request', testDepositData);
    
    if (error) {
      console.error('❌ Error al crear depósito:', error);
      return;
    }
    
    if (data && data.success) {
      console.log('\n✅ ¡DEPÓSITO DE PRUEBA CREADO EXITOSAMENTE!');
      console.log('   Deposit ID:', data.deposit_id);
      console.log('   Estado: PENDING (esperando aprobación)');
      
      // Verificar en la tabla
      const { data: deposit } = await supabase
        .from('deposits')
        .select('*')
        .eq('id', data.deposit_id)
        .single();
      
      if (deposit) {
        console.log('\n📊 Detalles del depósito en BD:');
        console.log('   Status:', deposit.status);
        console.log('   Payroll Verified:', deposit.payroll_verified);
        console.log('   MT5 Processed:', deposit.mt5_processed);
        console.log('   Created At:', new Date(deposit.created_at).toLocaleString());
      }
      
      console.log('\n📋 PRÓXIMOS PASOS:');
      console.log('1. El CRM debería ver esta solicitud');
      console.log('2. Un admin puede aprobarla desde el CRM');
      console.log('3. Recibirás una notificación cuando se apruebe');
      console.log('4. Para eliminar este test: deleteTestDeposit("' + data.deposit_id + '")');
      
      // Guardar el ID para poder eliminarlo después
      window.lastTestDepositId = data.deposit_id;
      
    } else {
      console.error('❌ Error en la respuesta:', data);
    }
  } catch (err) {
    console.error('❌ Error ejecutando la prueba:', err);
  }
}

async function deleteTestDeposit(depositId) {
  const { supabase } = window;
  const id = depositId || window.lastTestDepositId;
  
  if (!id) {
    console.error('❌ No hay ID de depósito. Proporciona uno o ejecuta testDeposit() primero.');
    return;
  }
  
  const { error } = await supabase
    .from('deposits')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('❌ Error eliminando depósito:', error);
  } else {
    console.log('✅ Depósito de prueba eliminado');
  }
}

async function checkDepositStatus() {
  const { supabase } = window;
  
  // Ver los últimos 5 depósitos del usuario
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: deposits, error } = await supabase
    .from('deposits')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (error) {
    console.error('❌ Error obteniendo depósitos:', error);
    return;
  }
  
  console.log('📊 TUS ÚLTIMOS DEPÓSITOS:');
  console.log('========================\n');
  
  if (!deposits || deposits.length === 0) {
    console.log('No hay depósitos registrados');
    return;
  }
  
  deposits.forEach((dep, index) => {
    console.log(`${index + 1}. Depósito ${dep.id.substring(0, 8)}...`);
    console.log(`   Monto: $${dep.amount} USD`);
    console.log(`   Estado: ${dep.status}`);
    console.log(`   Método: ${dep.payment_method}`);
    console.log(`   Fecha: ${new Date(dep.created_at).toLocaleString()}`);
    if (dep.payroll_data?.test_mode) {
      console.log(`   ⚠️  MODO PRUEBA`);
    }
    console.log('');
  });
}

// Hacer las funciones disponibles globalmente
window.testDeposit = testDeposit;
window.deleteTestDeposit = deleteTestDeposit;
window.checkDepositStatus = checkDepositStatus;

console.log('✅ Funciones de prueba cargadas:');
console.log('   - testDeposit() : Crea un depósito de prueba');
console.log('   - checkDepositStatus() : Ver tus últimos depósitos');
console.log('   - deleteTestDeposit(id) : Eliminar un depósito de prueba');