// Direct test of API key with curl-like request
const SUPABASE_URL = 'https://ukngiipxprielwdfuvln.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbmdpaXB4cHJpZWx3ZGZ1dmxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxOTYxMTksImV4cCI6MjA2OTc3MjExOX0.hetsRCLnf4ovhK2GAd3F3Fa8rnVNoSGu1ldaYvYIEJY';

console.log('Testing Supabase API key...\n');

// Decode JWT payload
const parts = SUPABASE_ANON_KEY.split('.');
if (parts.length === 3) {
  try {
    const payload = JSON.parse(atob(parts[1]));
    console.log('JWT Payload:', JSON.stringify(payload, null, 2));
    console.log('\nProject ref from JWT:', payload.ref);
    console.log('URL project ID:', SUPABASE_URL.match(/https:\/\/([^.]+)/)[1]);
    console.log('Match:', payload.ref === SUPABASE_URL.match(/https:\/\/([^.]+)/)[1] ? '✅ YES' : '❌ NO');
  } catch (e) {
    console.error('Failed to decode JWT:', e);
  }
}

// Test 1: Health endpoint
async function testHealth() {
  console.log('\n=== Testing Health Endpoint ===');
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('Status:', response.status, response.statusText);
    const text = await response.text();
    console.log('Response:', text);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Test 2: Test with wrong key to see different error
async function testWrongKey() {
  console.log('\n=== Testing with deliberately wrong key ===');
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: {
        'apikey': 'wrong-key-123',
        'Content-Type': 'application/json'
      }
    });
    console.log('Status:', response.status, response.statusText);
    const text = await response.text();
    console.log('Response:', text);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Test 3: Test without key
async function testNoKey() {
  console.log('\n=== Testing without API key ===');
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('Status:', response.status, response.statusText);
    const text = await response.text();
    console.log('Response:', text);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run tests
(async () => {
  await testHealth();
  await testWrongKey();
  await testNoKey();
})();