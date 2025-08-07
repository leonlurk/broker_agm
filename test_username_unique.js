// Verificar si username debe ser único
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ukngiipxprielwdfuvln.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbmdpaXB4cHJpZWx3ZGZ1dmxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxOTYxMTksImV4cCI6MjA2OTc3MjExOX0.hetsRCLnf4ovhK2GAd3F3Fa8rnVNoSGu1ldaYvYIEJY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testUsernameUnique() {
    console.log('=== PROBANDO SI USERNAME DEBE SER ÚNICO ===\n');
    
    // Intentar crear dos usuarios con el mismo username
    const uniqueUsername = `unique_${Date.now()}`;
    
    console.log(`1. Creando primer usuario con username: ${uniqueUsername}`);
    const { data: user1, error: error1 } = await supabase.auth.signUp({
        email: `first_${Date.now()}@example.com`,
        password: 'TestPassword123!',
        options: {
            data: {
                username: uniqueUsername,
                full_name: 'First User'
            }
        }
    });
    
    if (error1) {
        console.log('❌ Error en primer usuario:', error1.message);
        return;
    }
    console.log('✅ Primer usuario creado:', user1.user.id);
    
    // Esperar un poco
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`\n2. Intentando crear segundo usuario con MISMO username: ${uniqueUsername}`);
    const { data: user2, error: error2 } = await supabase.auth.signUp({
        email: `second_${Date.now()}@example.com`,
        password: 'TestPassword123!',
        options: {
            data: {
                username: uniqueUsername, // MISMO USERNAME
                full_name: 'Second User'
            }
        }
    });
    
    if (error2) {
        console.log('❌ Error en segundo usuario:', error2.message);
        if (error2.message.includes('Database error')) {
            console.log('\n✅ CONFIRMADO: Username debe ser ÚNICO');
            console.log('   El backend tiene un UNIQUE constraint en username');
        }
    } else {
        console.log('✅ Segundo usuario creado:', user2.user.id);
        console.log('\n⚠️ Username NO es único (permite duplicados)');
    }
    
    // Ahora probar con mrlurk específicamente
    console.log('\n3. Probando con username "mrlurk"...');
    const { data: mrlurk, error: errorMrlurk } = await supabase.auth.signUp({
        email: `mrlurk_${Date.now()}@example.com`,
        password: 'TestPassword123!',
        options: {
            data: {
                username: 'mrlurk',
                full_name: 'Mr Lurk'
            }
        }
    });
    
    if (errorMrlurk) {
        console.log('❌ Error con "mrlurk":', errorMrlurk.message);
        if (errorMrlurk.message.includes('Database error')) {
            console.log('   → Username "mrlurk" ya existe en la base de datos');
        }
    } else {
        console.log('✅ Usuario "mrlurk" creado exitosamente');
    }
}

testUsernameUnique();