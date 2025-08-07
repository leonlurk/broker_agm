import { useEffect } from 'react';

export default function TestSupabase() {
  useEffect(() => {
    console.log('=== Environment Variables Check ===');
    console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('VITE_SUPABASE_ANON_KEY length:', import.meta.env.VITE_SUPABASE_ANON_KEY?.length);
    console.log('VITE_SUPABASE_ANON_KEY first 50 chars:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 50));
    console.log('VITE_SUPABASE_ANON_KEY last 50 chars:', import.meta.env.VITE_SUPABASE_ANON_KEY?.slice(-50));
    console.log('VITE_DATABASE_PROVIDER:', import.meta.env.VITE_DATABASE_PROVIDER);
    
    // Check for any hidden characters
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (key) {
      console.log('Key starts with space?', key[0] === ' ');
      console.log('Key ends with space?', key[key.length - 1] === ' ');
      console.log('Key contains newline?', key.includes('\n'));
      console.log('Key contains carriage return?', key.includes('\r'));
      
      // Check actual vs expected
      const expectedKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbmdpaXB4cHJpZWx3ZGZ1dmxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxOTYxMTksImV4cCI6MjA2OTc3MjExOX0.hetsRCLnf4ovhK2GAd3F3Fa8rnVNoSGu1ldaYvYIEJY';
      console.log('Key matches expected?', key === expectedKey);
      if (key !== expectedKey) {
        console.log('Expected length:', expectedKey.length);
        console.log('Actual length:', key.length);
        
        // Find where they differ
        for (let i = 0; i < Math.max(key.length, expectedKey.length); i++) {
          if (key[i] !== expectedKey[i]) {
            console.log(`First difference at position ${i}:`);
            console.log(`  Expected: "${expectedKey[i]}" (char code: ${expectedKey.charCodeAt(i)})`);
            console.log(`  Actual: "${key[i]}" (char code: ${key.charCodeAt(i)})`);
            break;
          }
        }
      }
    }
  }, []);

  return <div>Check console for environment variable diagnostics</div>;
}