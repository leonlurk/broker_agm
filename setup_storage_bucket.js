/**
 * Script para configurar el bucket de storage en Supabase
 * Ejecutar este script una sola vez para crear el bucket y las políticas
 */

import { createClient } from '@supabase/supabase-js';

// Reemplazar con tus credenciales de Supabase
const SUPABASE_URL = 'https://ukngiipxprielwdfuvln.supabase.co';
const SUPABASE_SERVICE_KEY = 'TU_SERVICE_ROLE_KEY_AQUI'; // IMPORTANTE: Usar la service key, no la anon key

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function setupStorage() {
  console.log('Configurando storage bucket para fotos de perfil...');
  
  try {
    // 1. Crear el bucket
    const { data: bucket, error: bucketError } = await supabase.storage
      .createBucket('profile-pictures', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
      });
    
    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('Error creando bucket:', bucketError);
      return;
    }
    
    console.log('✓ Bucket creado o ya existe');
    
    // 2. Listar buckets para verificar
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error('Error listando buckets:', listError);
    } else {
      console.log('Buckets disponibles:', buckets.map(b => b.id));
    }
    
    console.log('\n=== CONFIGURACIÓN COMPLETADA ===');
    console.log('Ahora debes ejecutar el siguiente SQL en el editor SQL de Supabase:\n');
    
    console.log(`
-- Políticas de storage para fotos de perfil
-- Permitir a los usuarios subir sus propias fotos
CREATE POLICY "Users can upload own profile pictures" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'profile-pictures' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Permitir a los usuarios actualizar sus propias fotos
CREATE POLICY "Users can update own profile pictures" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'profile-pictures' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Permitir a los usuarios eliminar sus propias fotos
CREATE POLICY "Users can delete own profile pictures" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'profile-pictures' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Permitir a todos ver las fotos de perfil (bucket público)
CREATE POLICY "Anyone can view profile pictures" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-pictures');
    `);
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

// Ejecutar el setup
setupStorage();