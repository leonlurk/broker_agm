// Check what happens during signup
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ukngiipxprielwdfuvln.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbmdpaXB4cHJpZWx3ZGZ1dmxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxOTYxMTksImV4cCI6MjA2OTc3MjExOX0.hetsRCLnf4ovhK2GAd3F3Fa8rnVNoSGu1ldaYvYIEJY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSignup() {
    console.log('=== TESTING SIGNUP WITH DIFFERENT METADATA ===\n');
    
    // Test 1: Minimal signup
    console.log('Test 1: Minimal signup (no metadata)');
    const email1 = `minimal_${Date.now()}@example.com`;
    const { data: data1, error: error1 } = await supabase.auth.signUp({
        email: email1,
        password: 'TestPassword123!'
    });
    
    if (error1) {
        console.log('❌ Minimal signup failed:', error1.message);
    } else {
        console.log('✅ Minimal signup succeeded:', data1.user.id);
        
        // Check if profile was created
        const { data: profile1 } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data1.user.id)
            .single();
        
        if (profile1) {
            console.log('   Profile created with fields:', Object.keys(profile1).join(', '));
        }
    }
    
    // Test 2: With username in metadata
    console.log('\nTest 2: With username in metadata');
    const email2 = `username_${Date.now()}@example.com`;
    const { data: data2, error: error2 } = await supabase.auth.signUp({
        email: email2,
        password: 'TestPassword123!',
        options: {
            data: {
                username: 'testuser2'
            }
        }
    });
    
    if (error2) {
        console.log('❌ Username signup failed:', error2.message);
    } else {
        console.log('✅ Username signup succeeded:', data2.user.id);
    }
    
    // Test 3: With display_name in metadata
    console.log('\nTest 3: With display_name in metadata');
    const email3 = `display_${Date.now()}@example.com`;
    const { data: data3, error: error3 } = await supabase.auth.signUp({
        email: email3,
        password: 'TestPassword123!',
        options: {
            data: {
                display_name: 'Test User 3'
            }
        }
    });
    
    if (error3) {
        console.log('❌ Display name signup failed:', error3.message);
    } else {
        console.log('✅ Display name signup succeeded:', data3.user.id);
    }
    
    // Test 4: With full_name in metadata
    console.log('\nTest 4: With full_name in metadata');
    const email4 = `fullname_${Date.now()}@example.com`;
    const { data: data4, error: error4 } = await supabase.auth.signUp({
        email: email4,
        password: 'TestPassword123!',
        options: {
            data: {
                full_name: 'Test User Four'
            }
        }
    });
    
    if (error4) {
        console.log('❌ Full name signup failed:', error4.message);
    } else {
        console.log('✅ Full name signup succeeded:', data4.user.id);
    }
    
    // Test 5: With both username and full_name
    console.log('\nTest 5: With both username and full_name');
    const email5 = `both_${Date.now()}@example.com`;
    const { data: data5, error: error5 } = await supabase.auth.signUp({
        email: email5,
        password: 'TestPassword123!',
        options: {
            data: {
                username: 'testuser5',
                full_name: 'Test User Five'
            }
        }
    });
    
    if (error5) {
        console.log('❌ Both fields signup failed:', error5.message);
    } else {
        console.log('✅ Both fields signup succeeded:', data5.user.id);
    }
}

testSignup();