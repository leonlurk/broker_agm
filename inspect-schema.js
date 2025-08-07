// Script to inspect existing table structures
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ukngiipxprielwdfuvln.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbmdpaXB4cHJpZWx3ZGZ1dmxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxOTYxMTksImV4cCI6MjA2OTc3MjExOX0.hetsRCLnf4ovhK2GAd3F3Fa8rnVNoSGu1ldaYvYIEJY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectSchema() {
    console.log('=== DETAILED SCHEMA INSPECTION ===\n');
    
    // Create a test user to inspect tables
    const testEmail = `inspect_${Date.now()}@example.com`;
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testEmail,
        password: 'TestPassword123!',
        options: {
            data: {
                username: 'testuser',
                full_name: 'Test User'
            }
        }
    });
    
    if (authError) {
        console.log('Error creating test user:', authError);
        return;
    }
    
    const userId = authData.user.id;
    console.log('Test user created:', userId);
    
    // 1. Check profiles table structure
    console.log('\n=== PROFILES TABLE ===');
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (profile) {
        console.log('Profile structure:');
        for (const [key, value] of Object.entries(profile)) {
            console.log(`  ${key}: ${typeof value} = ${JSON.stringify(value)}`);
        }
    } else {
        console.log('Profile error:', profileError);
    }
    
    // 2. Check users table structure  
    console.log('\n=== USERS TABLE ===');
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
    
    if (userData && userData.length > 0) {
        console.log('Users table structure:');
        for (const [key, value] of Object.entries(userData[0])) {
            console.log(`  ${key}: ${typeof value}`);
        }
    } else if (userError) {
        console.log('Users table error:', userError.message);
    }
    
    // 3. Check trading_accounts structure
    console.log('\n=== TRADING_ACCOUNTS TABLE ===');
    
    // Try to create a trading account
    const { data: accountData, error: accountError } = await supabase
        .from('trading_accounts')
        .insert([{
            user_id: userId,
            account_name: 'Test Account',
            account_type: 'DEMO',
            balance: 10000
        }])
        .select()
        .single();
    
    if (accountData) {
        console.log('Trading account structure:');
        for (const [key, value] of Object.entries(accountData)) {
            console.log(`  ${key}: ${typeof value}`);
        }
        
        // Clean up
        await supabase
            .from('trading_accounts')
            .delete()
            .eq('id', accountData.id);
    } else if (accountError) {
        console.log('Trading accounts error:', accountError.message);
        
        // Try to just query structure
        const { data: sampleAccount } = await supabase
            .from('trading_accounts')
            .select('*')
            .limit(1);
        
        if (sampleAccount && sampleAccount.length > 0) {
            console.log('Trading account structure (from existing):');
            for (const [key, value] of Object.entries(sampleAccount[0])) {
                console.log(`  ${key}: ${typeof value}`);
            }
        }
    }
    
    // 4. Check transactions structure
    console.log('\n=== TRANSACTIONS TABLE ===');
    const { data: transData } = await supabase
        .from('transactions')
        .select('*')
        .limit(1);
    
    if (transData && transData.length > 0) {
        console.log('Transaction structure:');
        for (const [key, value] of Object.entries(transData[0])) {
            console.log(`  ${key}: ${typeof value}`);
        }
    } else {
        console.log('No transactions found or access denied');
    }
    
    // Check if we can update the profile
    console.log('\n=== TESTING PROFILE UPDATE ===');
    const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({ 
            username: 'updated_user',
            phone: '+1234567890'
        })
        .eq('id', userId)
        .select();
    
    if (updateData) {
        console.log('✅ Profile update successful');
    } else {
        console.log('❌ Profile update failed:', updateError?.message);
    }
}

inspectSchema();