import { supabase } from '../supabase/config';
import { logger } from '../utils/logger';

class ChatFeedbackService {
  constructor() {
    this.feedbackCache = new Map();
  }

  /**
   * Guardar feedback de un mensaje
   */
  async saveFeedback(feedbackData) {
    try {
      const {
        messageId,
        conversationId,
        userId,
        isHelpful,
        feedbackText = null,
        messageIntent = 'general',
        aiConfidence = 0.5,
        responseTimeMs = null
      } = feedbackData;

      // Validar datos requeridos
      if (!messageId || !conversationId || !userId) {
        throw new Error('Datos requeridos faltantes para guardar feedback');
      }

      const { data, error } = await supabase
        .from('chat_message_feedback')
        .upsert({
          message_id: messageId,
          conversation_id: conversationId,
          user_id: userId,
          is_helpful: isHelpful,
          feedback_text: feedbackText,
          message_intent: messageIntent,
          ai_confidence: aiConfidence,
          response_time_ms: responseTimeMs
        }, {
          onConflict: 'message_id,user_id'
        })
        .select()
        .single();

      if (error) throw error;

      // Actualizar caché
      this.feedbackCache.set(messageId, data);
      
      logger.info('[FEEDBACK] Guardado exitosamente:', { messageId, isHelpful });
      return { success: true, data };

    } catch (error) {
      logger.error('[FEEDBACK] Error guardando:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener feedback de un usuario para mensajes específicos
   */
  async getUserFeedback(userId, messageIds = []) {
    try {
      // Verificar caché primero
      const cached = messageIds
        .map(id => this.feedbackCache.get(id))
        .filter(Boolean);
      
      if (cached.length === messageIds.length) {
        return { success: true, data: cached };
      }

      // Buscar en DB
      const query = supabase
        .from('chat_message_feedback')
        .select('*')
        .eq('user_id', userId);

      if (messageIds.length > 0) {
        query.in('message_id', messageIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Actualizar caché
      data.forEach(feedback => {
        this.feedbackCache.set(feedback.message_id, feedback);
      });

      return { success: true, data };

    } catch (error) {
      logger.error('[FEEDBACK] Error obteniendo feedback:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Obtener estadísticas de feedback para el dashboard
   */
  async getFeedbackStats(startDate = null, endDate = null) {
    try {
      // Usar función SQL para obtener estadísticas
      const { data, error } = await supabase
        .rpc('get_feedback_stats', {
          p_start_date: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          p_end_date: endDate || new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      return { success: true, data: data[0] };

    } catch (error) {
      logger.error('[FEEDBACK] Error obteniendo estadísticas:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener feedback detallado para CRM
   */
  async getCRMFeedbackDetails(filters = {}) {
    try {
      let query = supabase
        .from('crm_chat_feedback_details')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.isHelpful !== undefined) {
        query = query.eq('is_helpful', filters.isHelpful);
      }
      if (filters.intent) {
        query = query.eq('message_intent', filters.intent);
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      if (filters.notReviewed) {
        query = query.is('reviewed_by', null);
      }

      // Limitar resultados
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data };

    } catch (error) {
      logger.error('[FEEDBACK] Error obteniendo detalles para CRM:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Marcar feedback como revisado por el equipo de soporte
   */
  async markAsReviewed(feedbackId, reviewerId, notes = null) {
    try {
      const { data, error } = await supabase
        .from('chat_message_feedback')
        .update({
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
          improvement_notes: notes
        })
        .eq('id', feedbackId)
        .select()
        .single();

      if (error) throw error;

      logger.info('[FEEDBACK] Marcado como revisado:', feedbackId);
      return { success: true, data };

    } catch (error) {
      logger.error('[FEEDBACK] Error marcando como revisado:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener métricas diarias de feedback
   */
  async getDailyMetrics(days = 7) {
    try {
      const { data, error } = await supabase
        .from('chat_feedback_analytics')
        .select('*')
        .order('date', { ascending: false })
        .limit(days);

      if (error) throw error;

      return { success: true, data };

    } catch (error) {
      logger.error('[FEEDBACK] Error obteniendo métricas diarias:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Suscribirse a nuevos feedbacks en tiempo real
   */
  subscribeToFeedback(callback) {
    return supabase
      .channel('feedback-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_message_feedback'
        },
        (payload) => {
          logger.info('[FEEDBACK] Nuevo feedback recibido:', payload.new);
          callback(payload.new);
        }
      )
      .subscribe();
  }

  /**
   * Limpiar caché de feedback
   */
  clearCache() {
    this.feedbackCache.clear();
    logger.info('[FEEDBACK] Caché limpiado');
  }
}

// Exportar singleton
export const chatFeedbackService = new ChatFeedbackService();
export default chatFeedbackService;