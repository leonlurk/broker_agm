/**
 * Script para marcar todos los usuarios existentes como verificados
 * Ejecutar una sola vez antes de activar la verificación obligatoria
 * 
 * Uso: node mark-existing-users-verified.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Necesitas la service key para esto

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan las variables de entorno VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  console.log('Asegúrate de tener la service role key (no la anon key) en tu .env');
  process.exit(1);
}

// Crear cliente con service role key para permisos de admin
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function markExistingUsersAsVerified() {
  console.log('🔄 Iniciando actualización de usuarios existentes...\n');

  try {
    // Primero, contar usuarios que serán actualizados
    const { data: usersToUpdate, error: countError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .or('email_verified.is.null,email_verified.eq.false');

    if (countError) {
      throw countError;
    }

    const count = usersToUpdate?.length || 0;
    console.log(`📊 Usuarios a actualizar: ${count}`);

    if (count === 0) {
      console.log('✅ No hay usuarios para actualizar. Todos ya están verificados.');
      return;
    }

    // Actualizar todos los usuarios existentes
    const { data, error } = await supabase
      .from('profiles')
      .update({
        email_verified: true,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .or('email_verified.is.null,email_verified.eq.false')
      .select();

    if (error) {
      throw error;
    }

    console.log(`✅ ${data.length} usuarios marcados como verificados exitosamente`);

    // Mostrar algunos ejemplos de usuarios actualizados
    if (data.length > 0) {
      console.log('\n📋 Primeros 5 usuarios actualizados:');
      data.slice(0, 5).forEach(user => {
        console.log(`   - ${user.username || user.email} (ID: ${user.id})`);
      });
    }

    // Verificar el resultado final
    const { count: remainingCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('email_verified', false);

    console.log(`\n📈 Resumen final:`);
    console.log(`   - Usuarios actualizados: ${data.length}`);
    console.log(`   - Usuarios sin verificar restantes: ${remainingCount || 0}`);
    console.log(`\n✅ Proceso completado exitosamente`);
    console.log(`\n⚠️  IMPORTANTE: A partir de ahora, solo los NUEVOS usuarios necesitarán verificar su email.`);

  } catch (error) {
    console.error('❌ Error actualizando usuarios:', error.message);
    process.exit(1);
  }
}

// Confirmación antes de ejecutar
console.log('⚠️  ADVERTENCIA: Este script marcará TODOS los usuarios existentes como verificados.');
console.log('Los nuevos usuarios (creados después de ejecutar este script) SÍ necesitarán verificar su email.\n');

// Ejecutar después de 3 segundos para dar tiempo a cancelar
console.log('Ejecutando en 3 segundos... (Ctrl+C para cancelar)\n');
setTimeout(() => {
  markExistingUsersAsVerified();
}, 3000);