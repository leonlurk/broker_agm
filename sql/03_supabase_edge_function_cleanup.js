// ========================================
// SUPABASE EDGE FUNCTION - LIMPIEZA AUTOMÁTICA DE CHAT
// ========================================
// Crear en Supabase Dashboard > Edge Functions
// Nombre: cleanup-chat-messages
// Schedule: Cada 24 horas a las 3 AM

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Crear cliente de Supabase con service role key (tiene permisos completos)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 1. Eliminar mensajes de más de 24 horas
    const { data: deletedMessages, error: msgError } = await supabaseClient
      .from('chat_messages')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select()

    if (msgError) throw msgError

    // 2. Eliminar conversaciones expiradas (excepto archivadas)
    const { data: deletedConversations, error: convError } = await supabaseClient
      .from('chat_conversations')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .neq('status', 'archived')
      .select()

    if (convError) throw convError

    // 3. Eliminar contextos expirados
    const { data: deletedContexts, error: ctxError } = await supabaseClient
      .from('chat_context')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select()

    if (ctxError) throw ctxError

    // 4. Registrar métrica de limpieza
    const { error: metricError } = await supabaseClient
      .from('chat_metrics')
      .insert({
        metric_type: 'cleanup',
        metric_value: {
          cleaned_at: new Date().toISOString(),
          deleted_messages: deletedMessages?.length || 0,
          deleted_conversations: deletedConversations?.length || 0,
          deleted_contexts: deletedContexts?.length || 0,
          type: 'scheduled_24h_cleanup'
        }
      })

    if (metricError) {
      console.error('Error recording metrics:', metricError)
    }

    // 5. Limpiar conversaciones inactivas de más de 7 días (opcional)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: archivedConversations, error: archiveError } = await supabaseClient
      .from('chat_conversations')
      .update({ status: 'archived' })
      .lt('last_activity', sevenDaysAgo.toISOString())
      .eq('status', 'active')
      .select()

    if (archiveError) {
      console.error('Error archiving old conversations:', archiveError)
    }

    // Respuesta exitosa
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Chat cleanup completed',
        stats: {
          messages_deleted: deletedMessages?.length || 0,
          conversations_deleted: deletedConversations?.length || 0,
          contexts_deleted: deletedContexts?.length || 0,
          conversations_archived: archivedConversations?.length || 0,
          executed_at: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Cleanup error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// ========================================
// CONFIGURACIÓN EN SUPABASE
// ========================================
/*
Para configurar esta función:

1. En Supabase Dashboard, ve a "Edge Functions"
2. Crea una nueva función llamada "cleanup-chat-messages"
3. Pega este código
4. Deploy la función

5. Para programar ejecución diaria, usa uno de estos métodos:

OPCIÓN A - Usando pg_cron (si está habilitado):
-------------------------------------------------
En SQL Editor de Supabase:

-- Habilitar la extensión pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Programar la función para ejecutarse diariamente a las 3 AM
SELECT cron.schedule(
  'cleanup-chat-messages',
  '0 3 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-chat-messages',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || 'YOUR_ANON_KEY',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('trigger', 'scheduled')
    );
  $$
);

OPCIÓN B - Usando un servicio externo de CRON:
-----------------------------------------------
Usa servicios como:
- cron-job.org
- EasyCron
- Zapier
- GitHub Actions

Configura para hacer POST a:
https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-chat-messages

Con headers:
Authorization: Bearer YOUR_ANON_KEY
Content-Type: application/json

OPCIÓN C - Trigger manual desde el frontend (menos ideal):
----------------------------------------------------------
En tu aplicación, puedes verificar y ejecutar la limpieza
cuando un usuario inicia sesión si han pasado 24h desde
la última limpieza.
*/