import { DatabaseAdapter } from './database.adapter';
import { logger } from '../utils/logger';

class ChatService {
  constructor() {
    this.GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    this.GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
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

  // Obtener o crear conversación
  async getOrCreateConversation(userId) {
    try {
      // Por ahora retornar un ID simple basado en el userId
      // En el futuro esto debería buscar o crear en la tabla chat_conversations
      const conversationId = `conv_${userId}`;
      logger.info('[CHAT] Getting/creating conversation for user:', userId);
      return conversationId;
    } catch (error) {
      logger.error('[CHAT] Error getting/creating conversation:', error);
      return null;
    }
  }

  // Verificar si hay control humano activo (admin intervening)
  async checkHumanControl(userId) {
    try {
      // Get user's active ticket
      const ticketResult = await DatabaseAdapter.generic.get('support_tickets', {
        user_id: userId,
        status: 'open'
      });

      if (!ticketResult || !ticketResult.data || !ticketResult.data[0]) {
        return false;
      }

      const ticketId = ticketResult.data[0].id;

      // Check for active admin intervention
      const interventionResult = await DatabaseAdapter.generic.query(
        'admin_interventions',
        { ticket_id: ticketId },
        { filter: { ended_at: null } }
      );

      if (interventionResult && interventionResult.data && interventionResult.data.length > 0) {
        logger.info('[CHAT] Human control active for user:', userId);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('[CHAT] Error checking human control:', error);
      return false;
    }
  }

  // Get or create support ticket for user
  async getOrCreateTicket(userId, userEmail, userName) {
    try {
      // Check for existing open ticket
      const existingResult = await DatabaseAdapter.generic.get('support_tickets', {
        user_id: userId,
        status: 'open'
      });

      if (existingResult && existingResult.data && existingResult.data[0]) {
        return existingResult.data[0];
      }

      // Create new ticket
      const ticketData = {
        user_id: userId,
        user_email: userEmail || '',
        user_name: userName || 'Usuario',
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_message_at: new Date().toISOString()
      };

      const createResult = await DatabaseAdapter.generic.create('support_tickets', ticketData);

      if (createResult && createResult.data) {
        return createResult.data;
      }

      return null;
    } catch (error) {
      logger.error('[CHAT] Error getting/creating ticket:', error);
      return null;
    }
  }

  // Guardar mensaje en base de datos (support_messages)
  async saveMessage(userId, messageData, ticketId = null) {
    try {
      // Get ticket ID if not provided
      if (!ticketId) {
        const ticket = await this.getOrCreateTicket(userId);
        if (!ticket) {
          logger.error('[CHAT] Could not get/create ticket for message');
          return;
        }
        ticketId = ticket.id;
      }

      // Map sender to sender_type
      const senderType = messageData.sender === 'user' ? 'user' : 'ai';

      // Create message in support_messages
      const message = {
        ticket_id: ticketId,
        sender_type: senderType,
        sender_id: messageData.sender === 'user' ? userId : null,
        sender_name: messageData.sender === 'user' ? 'Usuario' : 'Flofy (AI)',
        content: messageData.message,
        created_at: messageData.timestamp || new Date().toISOString()
      };

      const result = await DatabaseAdapter.generic.create('support_messages', message);

      if (result && result.error) {
        logger.error('[CHAT] Error saving message:', result.error);
      } else {
        // Update ticket's last_message_at
        await DatabaseAdapter.generic.update('support_tickets', ticketId, {
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        logger.info('[CHAT] Message saved:', { userId, sender: messageData.sender, ticketId });
      }

    } catch (error) {
      logger.error('[CHAT] Error saving message:', error);
      // No throw error para no interrumpir flujo del chat
    }
  }

  // Actualizar última actividad de conversación
  async updateConversationActivity(conversationId, userId) {
    try {
      // TODO: Implement when chat_conversations table is available
      // For now, just return
      return;
      
      /* Future implementation:
      const conversationData = {
        id: conversationId,
        user_id: userId,
        last_activity: new Date().toISOString(),
        is_human_controlled: false, // Por defecto IA
        status: 'active'
      };

      // Upsert conversation record
      await DatabaseAdapter.generic.upsert('chat_conversations', conversationData, { id: conversationId });
      */
      
    } catch (error) {
      logger.error('[CHAT] Error updating conversation activity:', error);
    }
  }

  // Obtener historial de conversación
  async getConversationHistory(userId, limit = 50) {
    try {
      // Get user's active or most recent ticket
      const ticketResult = await DatabaseAdapter.generic.query('support_tickets', {
        user_id: userId
      }, {
        orderBy: { column: 'last_message_at', ascending: false },
        limit: 1
      });

      if (!ticketResult || !ticketResult.data || !ticketResult.data[0]) {
        return { success: true, messages: [] };
      }

      const ticketId = ticketResult.data[0].id;

      // Get messages for this ticket
      const messagesResult = await DatabaseAdapter.generic.query('support_messages', {
        ticket_id: ticketId
      }, {
        orderBy: { column: 'created_at', ascending: true },
        limit
      });

      if (!messagesResult || messagesResult.error) {
        throw messagesResult?.error || new Error('Failed to fetch messages');
      }

      // Transform to expected format
      const messages = (messagesResult.data || []).map(msg => ({
        id: msg.id,
        sender: msg.sender_type === 'user' ? 'user' : 'flofy',
        message: msg.content,
        timestamp: msg.created_at
      }));

      return {
        success: true,
        messages,
        ticketId,
        ticketStatus: ticketResult.data[0].status
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

  // Reopen an archived ticket
  async reopenTicket(userId) {
    try {
      // Find archived ticket for user
      const ticketResult = await DatabaseAdapter.generic.query('support_tickets', {
        user_id: userId,
        status: 'archived'
      }, {
        orderBy: { column: 'updated_at', ascending: false },
        limit: 1
      });

      if (!ticketResult || !ticketResult.data || !ticketResult.data[0]) {
        return { success: false, error: 'No archived ticket found' };
      }

      const ticketId = ticketResult.data[0].id;

      // Update ticket status to open
      await DatabaseAdapter.generic.update('support_tickets', ticketId, {
        status: 'open',
        updated_at: new Date().toISOString()
      });

      logger.info('[CHAT] Ticket reopened:', { userId, ticketId });

      return { success: true, ticketId };

    } catch (error) {
      logger.error('[CHAT] Error reopening ticket:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user's tickets (for history view)
  async getUserTickets(userId) {
    try {
      const result = await DatabaseAdapter.generic.query('support_tickets', {
        user_id: userId
      }, {
        orderBy: { column: 'updated_at', ascending: false }
      });

      return {
        success: true,
        tickets: result?.data || []
      };

    } catch (error) {
      logger.error('[CHAT] Error getting user tickets:', error);
      return { success: false, tickets: [], error: error.message };
    }
  }

  // Cambiar control humano/IA
  async toggleHumanControl(userId, isHumanControlled) {
    try {
      // TODO: Implement when chat_conversations table is available
      return { success: true };
      
      /* Future implementation:
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
      */

    } catch (error) {
      logger.error('[CHAT] Error toggling human control:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtener todas las conversaciones activas (para CRM)
  async getAllActiveConversations() {
    try {
      // TODO: Implement when chat_conversations table is available
      return { success: true, conversations: [] };
      
      /* Future implementation:
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
      */

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