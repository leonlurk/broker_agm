// Script para verificar qué tabla usa el backend
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ukngiipxprielwdfuvln.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbmdpaXB4cHJpZWx3ZGZ1dmxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxOTYxMTksImV4cCI6MjA2OTc3MjExOX0.hetsRCLnf4ovhK2GAd3F3Fa8rnVNoSGu1ldaYvYIEJY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyTables() {
    console.log('=== VERIFICANDO QUÉ TABLA USA EL BACKEND ===\n');
    
    // 1. Contar registros en cada tabla
    console.log('1. CONTANDO REGISTROS:');
    
    try {
        const { count: usersCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });
        console.log(`   - users: ${usersCount || 0} registros`);
    } catch (e) {
        console.log(`   - users: Error al acceder`);
    }
    
    try {
        const { count: profilesCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });
        console.log(`   - profiles: ${profilesCount || 0} registros`);
    } catch (e) {
        console.log(`   - profiles: Error al acceder`);
    }
    
    // 2. Ver estructura de cada tabla
    console.log('\n2. ESTRUCTURA DE TABLAS:');
    
    try {
        const { data: userData } = await supabase
            .from('users')
            .select('*')
            .limit(1);
        
        if (userData && userData.length > 0) {
            console.log('\n   Tabla USERS tiene estos campos:');
            console.log('   ', Object.keys(userData[0]).join(', '));
        }
    } catch (e) {
        console.log('   No se puede leer users');
    }
    
    try {
        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .limit(1);
        
        if (profileData && profileData.length > 0) {
            console.log('\n   Tabla PROFILES tiene estos campos:');
            console.log('   ', Object.keys(profileData[0]).join(', '));
        }
    } catch (e) {
        console.log('   No se puede leer profiles');
    }
    
    // 3. Verificar relaciones con otras tablas
    console.log('\n3. VERIFICANDO RELACIONES:');
    
    // Verificar broker_accounts
    try {
        const { data: brokerData } = await supabase
            .from('broker_accounts')
            .select('*')
            .limit(1);
        
        if (brokerData && brokerData.length > 0) {
            console.log('\n   broker_accounts tiene estos campos:');
            console.log('   ', Object.keys(brokerData[0]).join(', '));
            
            // Ver si tiene user_id o profile_id
            if ('user_id' in brokerData[0]) {
                console.log('   ✅ broker_accounts tiene user_id -> usa tabla USERS');
            }
            if ('profile_id' in brokerData[0]) {
                console.log('   ✅ broker_accounts tiene profile_id -> usa tabla PROFILES');
            }
        }
    } catch (e) {
        console.log('   No se puede leer broker_accounts');
    }
    
    // Verificar trading_accounts
    try {
        const { data: tradingData } = await supabase
            .from('trading_accounts')
            .select('*')
            .limit(1);
        
        if (tradingData && tradingData.length > 0) {
            console.log('\n   trading_accounts tiene estos campos:');
            console.log('   ', Object.keys(tradingData[0]).join(', '));
            
            // Ver si tiene user_id o profile_id
            if ('user_id' in tradingData[0]) {
                console.log('   ✅ trading_accounts tiene user_id -> usa tabla USERS');
            }
            if ('profile_id' in tradingData[0]) {
                console.log('   ✅ trading_accounts tiene profile_id -> usa tabla PROFILES');
            }
        }
    } catch (e) {
        console.log('   No se puede leer trading_accounts');
    }
    
    // 4. Buscar 'mrlurk' en ambas tablas
    console.log('\n4. BUSCANDO USERNAME "mrlurk":');
    
    try {
        const { data: usersWithMrlurk } = await supabase
            .from('users')
            .select('id, username, email')
            .eq('username', 'mrlurk');
        
        if (usersWithMrlurk && usersWithMrlurk.length > 0) {
            console.log(`   ✅ Encontrado en USERS: ${usersWithMrlurk.length} registro(s)`);
            usersWithMrlurk.forEach(u => {
                console.log(`      - ${u.email} (ID: ${u.id})`);
            });
        } else {
            console.log('   ❌ No encontrado en USERS');
        }
    } catch (e) {
        console.log('   Error buscando en users');
    }
    
    try {
        const { data: profilesWithMrlurk } = await supabase
            .from('profiles')
            .select('id, username, email')
            .eq('username', 'mrlurk');
        
        if (profilesWithMrlurk && profilesWithMrlurk.length > 0) {
            console.log(`   ✅ Encontrado en PROFILES: ${profilesWithMrlurk.length} registro(s)`);
            profilesWithMrlurk.forEach(p => {
                console.log(`      - ${p.email} (ID: ${p.id})`);
            });
        } else {
            console.log('   ❌ No encontrado en PROFILES');
        }
    } catch (e) {
        console.log('   Error buscando en profiles');
    }
    
    // 5. Recomendación
    console.log('\n=== RECOMENDACIÓN ===');
    console.log('Basado en el análisis anterior, el backend probablemente usa la tabla que:');
    console.log('1. Tiene más registros');
    console.log('2. Se relaciona con broker_accounts y trading_accounts');
    console.log('3. Contiene el username que está causando el error');
}

verifyTables();