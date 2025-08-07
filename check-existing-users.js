// Check existing users
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ukngiipxprielwdfuvln.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbmdpaXB4cHJpZWx3ZGZ1dmxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxOTYxMTksImV4cCI6MjA2OTc3MjExOX0.hetsRCLnf4ovhK2GAd3F3Fa8rnVNoSGu1ldaYvYIEJY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkExisting() {
    console.log('=== CHECKING EXISTING DATA ===\n');
    
    // Check for username "mrlurk"
    console.log('Checking profiles with username "mrlurk":');
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, email, created_at')
        .ilike('username', 'mrlurk');
    
    if (profiles && profiles.length > 0) {
        console.log(`Found ${profiles.length} profiles with username "mrlurk":`);
        profiles.forEach(p => {
            console.log(`  - Username: ${p.username}`);
            console.log(`    Email: ${p.email}`);
            console.log(`    Created: ${p.created_at}`);
            console.log(`    ID: ${p.id}`);
        });
    } else {
        console.log('No profiles found with username "mrlurk"');
    }
    
    // Check for email
    console.log('\nChecking profiles with email "leonagustp@gmail.com":');
    const { data: emailProfiles } = await supabase
        .from('profiles')
        .select('id, username, email, created_at')
        .eq('email', 'leonagustp@gmail.com');
    
    if (emailProfiles && emailProfiles.length > 0) {
        console.log(`Found ${emailProfiles.length} profiles with that email:`);
        emailProfiles.forEach(p => {
            console.log(`  - Username: ${p.username}`);
            console.log(`    Email: ${p.email}`);
            console.log(`    Created: ${p.created_at}`);
        });
    } else {
        console.log('No profiles found with that email');
    }
    
    // Try with a unique username
    console.log('\n=== TESTING WITH UNIQUE USERNAME ===');
    const uniqueUsername = `user_${Date.now()}`;
    const uniqueEmail = `unique_${Date.now()}@example.com`;
    
    console.log(`Attempting signup with username: ${uniqueUsername}`);
    const { data: newUser, error: signupError } = await supabase.auth.signUp({
        email: uniqueEmail,
        password: 'TestPassword123!',
        options: {
            data: {
                username: uniqueUsername,
                full_name: 'Unique User'
            }
        }
    });
    
    if (signupError) {
        console.log('❌ Signup failed:', signupError.message);
    } else {
        console.log('✅ Signup succeeded with unique username!');
        console.log('   User ID:', newUser.user.id);
    }
}

checkExisting();