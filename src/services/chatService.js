import { DatabaseAdapter } from './database.adapter';
import { logger } from '../utils/logger';

class ChatService {
  constructor() {
    this.GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    this.GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    this.conversationCache = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Initialize any necessary connections
      this.isInitialized = true;
      logger.info('[CHAT] Chat service initialized');
    } catch (error) {
      logger.error('[CHAT] Failed to initialize chat service:', error);
      throw error;
    }
  }

  // Generar contexto especializado en trading
  generateTradingContext(userMessage, userData = null) {
    const baseContext = `
Eres Flofy, el asistente inteligente de Alpha Global Market (AGM), una plataforma de trading profesional.

INFORMACIÓN DE LA PLATAFORMA:
- AGM ofrece trading de Forex, materias primas, índices y criptomonedas
- Más de 100 instrumentos disponibles
- Sistema PAMM para gestión de inversiones
- Copytrading para copiar traders exitosos
- Cuentas demo y reales disponibles
- Verificación KYC requerida para retiros
- Soporte para múltiples métodos de pago

INSTRUCCIONES:
- Responde en español de manera amigable y profesional
- Enfócate en temas relacionados con trading y la plataforma
- Si no sabes algo específico, recomienda contactar soporte humano
- Mantén respuestas concisas (máximo 200 caracteres)
- Nunca proporciones consejos de inversión específicos
- Siempre menciona que el trading conlleva riesgo

${userData ? `
INFORMACIÓN DEL USUARIO:
- Nombre: ${userData.username || 'Usuario'}
- Email: ${userData.email || 'No disponible'}
- Estado KYC: ${userData.kycStatus || 'No verificado'}
- Cuentas: ${userData.tradingAccounts ? userData.tradingAccounts.length : 0} cuenta(s)
` : ''}

PREGUNTA DEL USUARIO: "${userMessage}"

Responde como Flofy de manera natural y útil:`;

    return baseContext;
  }

  // Procesar mensaje del usuario
  async processUserMessage(userId, message, userData = null) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Verificar si hay control humano activo
      const isHumanControlled = await this.checkHumanControl(userId);
      
      if (isHumanControlled) {
        return {
          success: true,
          response: null, // No response from AI when human is in control
          isHumanControlled: true,
          message: 'Un asesor humano se encargará de tu consulta.'
        };
      }

      // Generar respuesta con IA
      const aiResponse = await this.generateAIResponse(message, userData);
      
      // Guardar conversación
      await this.saveMessage(userId, {
        sender: 'user',
        message: message,
        timestamp: new Date().toISOString()
      });

      await this.saveMessage(userId, {
        sender: 'flofy',
        message: aiResponse,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        response: aiResponse,
        isHumanControlled: false
      };

    } catch (error) {
      logger.error('[CHAT] Error processing message:', error);
      return {
        success: false,
        error: error.message,
        response: 'Lo siento, hubo un error al procesar tu mensaje. Un asesor humano se pondrá en contacto contigo pronto.'
      };
    }
  }

  // Generar respuesta con Gemini AI
  async generateAIResponse(userMessage, userData = null) {
    try {
      if (!this.GEMINI_API_KEY || this.GEMINI_API_KEY === 'your-gemini-api-key-here') {
        // Usar fallback si no hay API key configurada
        logger.warn('[CHAT] Gemini API key not configured, using fallback responses');
        return this.generateFallbackResponse(userMessage);
      }

      const context = this.generateTradingContext(userMessage, userData);

      const response = await fetch(`${this.GEMINI_API_URL}?key=${this.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: context
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 150, // Limitar respuesta
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        let aiResponse = data.candidates[0].content.parts[0].text.trim();
        
        // Limpiar respuesta si es muy larga
        if (aiResponse.length > 200) {
          aiResponse = aiResponse.substring(0, 197) + '...';
        }
        
        return aiResponse;
      } else {
        throw new Error('Invalid response format from Gemini');
      }

    } catch (error) {
      logger.error('[CHAT] Gemini API error:', error);
      
      // Fallback responses basadas en palabras clave
      return this.generateFallbackResponse(userMessage);
    }
  }

  // Respuestas de fallback cuando falla la IA
  generateFallbackResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    const responses = {
      cuenta: 'Puedes crear cuentas demo o reales desde "Cuentas de Trading". ¿Necesitas ayuda específica?',
      deposit: 'Ve a "Wallet" para ver opciones de depósito: transferencia bancaria, tarjetas y criptomonedas.',
      retiro: 'Los retiros se procesan desde "Wallet". Necesitas verificación KYC completada.',
      kyc: 'Verifica tu cuenta en Configuración > KYC. Proceso toma 24-48 horas.',
      trading: 'Ofrecemos Forex, materias primas, índices y criptomonedas. ¿Algún mercado específico?',
      pamm: 'PAMM te permite invertir con gestores o ser gestor. ¿Quieres más información?',
      copy: 'Copytrading copia automáticamente traders exitosos. Explora gestores disponibles.'
    };

    for (const [keyword, response] of Object.entries(responses)) {
      if (lowerMessage.includes(keyword)) {
        return response;
      }
    }

    return 'Como asistente de AGM, puedo ayudarte con cuentas, depósitos, retiros, KYC, trading, PAMM y copytrading. ¿Sobre qué necesitas información?';
  }

  // Verificar si hay control humano activo
  async checkHumanControl(userId) {
    try {
      const { data, error } = await DatabaseAdapter.generic.get('chat_conversations', { user_id: userId });
      
      if (error || !data || !data[0]) {
        return false;
      }

      return data[0].is_human_controlled || false;
    } catch (error) {
      logger.error('[CHAT] Error checking human control:', error);
      return false;
    }
  }

  // Guardar mensaje en base de datos
  async saveMessage(userId, messageData) {
    try {
      const conversationId = `conversation_${userId}`;
      
      // Crear estructura del mensaje
      const message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conversation_id: conversationId,
        user_id: userId,
        sender: messageData.sender,
        message: messageData.message,
        timestamp: messageData.timestamp,
        metadata: messageData.metadata || {}
      };

      // Guardar en Supabase/Firebase
      const { error } = await DatabaseAdapter.generic.create('chat_messages', message);
      
      if (error) {
        throw error;
      }

      // También actualizar última actividad de la conversación
      await this.updateConversationActivity(conversationId, userId);

      logger.info('[CHAT] Message saved successfully:', { userId, sender: messageData.sender });
      
    } catch (error) {
      logger.error('[CHAT] Error saving message:', error);
      // No throw error para no interrumpir flujo del chat
    }
  }

  // Actualizar última actividad de conversación
  async updateConversationActivity(conversationId, userId) {
    try {
      const conversationData = {
        id: conversationId,
        user_id: userId,
        last_activity: new Date().toISOString(),
        is_human_controlled: false, // Por defecto IA
        status: 'active'
      };

      // Upsert conversation record
      await DatabaseAdapter.generic.upsert('chat_conversations', conversationData, { id: conversationId });
      
    } catch (error) {
      logger.error('[CHAT] Error updating conversation activity:', error);
    }
  }

  // Obtener historial de conversación
  async getConversationHistory(userId, limit = 50) {
    try {
      const conversationId = `conversation_${userId}`;
      
      const { data, error } = await DatabaseAdapter.generic.get(
        'chat_messages', 
        { conversation_id: conversationId },
        { orderBy: 'timestamp', limit }
      );

      if (error) {
        throw error;
      }

      return {
        success: true,
        messages: data || []
      };

    } catch (error) {
      logger.error('[CHAT] Error loading conversation history:', error);
      return {
        success: false,
        messages: [],
        error: error.message
      };
    }
  }

  // Cambiar control humano/IA
  async toggleHumanControl(userId, isHumanControlled) {
    try {
      const conversationId = `conversation_${userId}`;
      
      const { error } = await DatabaseAdapter.generic.update(
        'chat_conversations',
        { is_human_controlled: isHumanControlled },
        { id: conversationId }
      );

      if (error) {
        throw error;
      }

      logger.info('[CHAT] Human control toggled:', { userId, isHumanControlled });
      
      return { success: true };

    } catch (error) {
      logger.error('[CHAT] Error toggling human control:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtener todas las conversaciones activas (para CRM)
  async getAllActiveConversations() {
    try {
      const { data, error } = await DatabaseAdapter.generic.get(
        'chat_conversations',
        { status: 'active' },
        { orderBy: 'last_activity', descending: true }
      );

      if (error) {
        throw error;
      }

      return {
        success: true,
        conversations: data || []
      };

    } catch (error) {
      logger.error('[CHAT] Error loading active conversations:', error);
      return {
        success: false,
        conversations: [],
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const chatService = new ChatService();
export default chatService;