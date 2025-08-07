// Test para determinar qué tabla se usa automáticamente
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ukngiipxprielwdfuvln.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbmdpaXB4cHJpZWx3ZGZ1dmxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxOTYxMTksImV4cCI6MjA2OTc3MjExOX0.hetsRCLnf4ovhK2GAd3F3Fa8rnVNoSGu1ldaYvYIEJY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testWhichTable() {
    console.log('=== TEST: QUÉ TABLA USA EL BACKEND ===\n');
    
    // Crear un usuario de prueba
    const testEmail = `test_${Date.now()}@example.com`;
    const testUsername = `test_${Date.now()}`;
    
    console.log('1. Creando usuario de prueba...');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Username: ${testUsername}`);
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testEmail,
        password: 'TestPassword123!',
        options: {
            data: {
                username: testUsername,
                full_name: 'Test User'
            }
        }
    });
    
    if (authError) {
        console.log('❌ Error creando usuario:', authError.message);
        return;
    }
    
    const userId = authData.user.id;
    console.log('✅ Usuario creado en Auth:', userId);
    
    // Esperar un segundo para que los triggers se ejecuten
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n2. Verificando dónde se creó el registro...');
    
    // Buscar en tabla USERS
    try {
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (userData) {
            console.log('\n✅ ENCONTRADO EN TABLA "users":');
            console.log('   Campos:', Object.keys(userData).join(', '));
            console.log('   Username:', userData.username);
            console.log('   Email:', userData.email);
        } else if (userError?.code === 'PGRST116') {
            console.log('❌ NO encontrado en tabla "users"');
        } else if (userError) {
            console.log('⚠️ Error al buscar en "users":', userError.message);
        }
    } catch (e) {
        console.log('⚠️ No se puede acceder a tabla "users"');
    }
    
    // Buscar en tabla PROFILES
    try {
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (profileData) {
            console.log('\n✅ ENCONTRADO EN TABLA "profiles":');
            console.log('   Campos:', Object.keys(profileData).join(', '));
            console.log('   Username:', profileData.username);
            console.log('   Email:', profileData.email);
        } else if (profileError?.code === 'PGRST116') {
            console.log('❌ NO encontrado en tabla "profiles"');
        } else if (profileError) {
            console.log('⚠️ Error al buscar en "profiles":', profileError.message);
        }
    } catch (e) {
        console.log('⚠️ No se puede acceder a tabla "profiles"');
    }
    
    console.log('\n=== CONCLUSIÓN ===');
    console.log('El backend está configurado para usar la tabla donde se encontró el registro.');
    console.log('Esa es la tabla que debemos usar en el frontend.');
    
    // Verificar también broker_accounts
    console.log('\n3. Verificando estructura de broker_accounts...');
    try {
        const { data: brokerSample } = await supabase
            .from('broker_accounts')
            .select('*')
            .limit(1);
        
        if (brokerSample && brokerSample.length > 0) {
            const fields = Object.keys(brokerSample[0]);
            console.log('   Campos en broker_accounts:', fields.join(', '));
            
            if (fields.includes('user_id')) {
                console.log('   ✅ Tiene user_id -> relacionado con tabla "users"');
            }
            if (fields.includes('profile_id')) {
                console.log('   ✅ Tiene profile_id -> relacionado con tabla "profiles"');
            }
        } else {
            console.log('   broker_accounts está vacío o no accesible');
        }
    } catch (e) {
        console.log('   Error accediendo a broker_accounts');
    }
}

testWhichTable();