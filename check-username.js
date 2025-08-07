// Check username constraints
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ukngiipxprielwdfuvln.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbmdpaXB4cHJpZWx3ZGZ1dmxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxOTYxMTksImV4cCI6MjA2OTc3MjExOX0.hetsRCLnf4ovhK2GAd3F3Fa8rnVNoSGu1ldaYvYIEJY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkUsernameConstraints() {
    console.log('=== CHECKING USERNAME CONSTRAINTS ===\n');
    
    // First, create a user with a specific username
    const email1 = `first_${Date.now()}@example.com`;
    const { data: data1, error: error1 } = await supabase.auth.signUp({
        email: email1,
        password: 'TestPassword123!',
        options: {
            data: {
                username: 'mrlurk',
                full_name: 'Mr Lurk'
            }
        }
    });
    
    if (error1) {
        console.log('First signup failed:', error1.message);
        return;
    }
    
    console.log('✅ First user created with username "mrlurk"');
    
    // Now try to create another user with the same username
    const email2 = `second_${Date.now()}@example.com`;
    const { data: data2, error: error2 } = await supabase.auth.signUp({
        email: email2,
        password: 'TestPassword123!',
        options: {
            data: {
                username: 'mrlurk',  // Same username
                full_name: 'Another Lurk'
            }
        }
    });
    
    if (error2) {
        console.log('❌ Second signup with same username failed:', error2.message);
        console.log('This suggests username must be unique!');
    } else {
        console.log('✅ Second user created with same username (no uniqueness constraint)');
    }
    
    // Check if username "mrlurk" already exists in profiles
    console.log('\n=== CHECKING EXISTING USERNAMES ===');
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, email')
        .eq('username', 'mrlurk');
    
    if (profiles && profiles.length > 0) {
        console.log(`Found ${profiles.length} profiles with username "mrlurk":`);
        profiles.forEach(p => {
            console.log(`  - ${p.email} (${p.id})`);
        });
    } else {
        console.log('No profiles found with username "mrlurk"');
    }
}

checkUsernameConstraints();