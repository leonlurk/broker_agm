// Script to check existing Supabase schema
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ukngiipxprielwdfuvln.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbmdpaXB4cHJpZWx3ZGZ1dmxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxOTYxMTksImV4cCI6MjA2OTc3MjExOX0.hetsRCLnf4ovhK2GAd3F3Fa8rnVNoSGu1ldaYvYIEJY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkExistingSchema() {
    console.log('=== CHECKING EXISTING SUPABASE SCHEMA ===\n');
    
    try {
        // Try to query common table names
        const tableNames = [
            'users',
            'user',
            'profiles',
            'profile',
            'accounts',
            'trading_accounts',
            'transactions',
            'brokers',
            'traders'
        ];
        
        console.log('Checking for existing tables...\n');
        
        for (const tableName of tableNames) {
            try {
                const { data, error, status } = await supabase
                    .from(tableName)
                    .select('*')
                    .limit(0); // Just check if table exists
                
                if (!error) {
                    console.log(`✅ Table "${tableName}" EXISTS`);
                    
                    // Try to get column info
                    const { data: sampleData, error: sampleError } = await supabase
                        .from(tableName)
                        .select('*')
                        .limit(1);
                    
                    if (sampleData && sampleData.length > 0) {
                        console.log(`   Columns: ${Object.keys(sampleData[0]).join(', ')}`);
                    }
                } else if (error.code === '42P01') {
                    console.log(`❌ Table "${tableName}" does not exist`);
                } else if (error.code === '42501') {
                    console.log(`🔒 Table "${tableName}" exists but RLS blocks access`);
                } else {
                    console.log(`⚠️ Table "${tableName}": ${error.message}`);
                }
            } catch (e) {
                console.log(`⚠️ Error checking "${tableName}": ${e.message}`);
            }
        }
        
        // Check auth users
        console.log('\n=== CHECKING AUTH USERS ===\n');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (user) {
            console.log('Current authenticated user:', user.email);
        } else {
            console.log('No authenticated user');
        }
        
        // Try to sign up a test user to see what happens
        console.log('\n=== TESTING USER CREATION ===\n');
        const testEmail = `test_${Date.now()}@example.com`;
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email: testEmail,
            password: 'TestPassword123!'
        });
        
        if (signupError) {
            console.log('Signup error:', signupError.message);
        } else if (signupData.user) {
            console.log('Test user created successfully:', signupData.user.id);
            
            // Check if any trigger created a profile
            const possibleProfileTables = ['users', 'profiles', 'user', 'profile'];
            for (const table of possibleProfileTables) {
                try {
                    const { data, error } = await supabase
                        .from(table)
                        .select('*')
                        .eq('id', signupData.user.id)
                        .single();
                    
                    if (data) {
                        console.log(`✅ User profile found in "${table}" table:`, Object.keys(data));
                    }
                } catch (e) {
                    // Silent fail
                }
            }
        }
        
    } catch (error) {
        console.error('Error checking schema:', error);
    }
}

checkExistingSchema();