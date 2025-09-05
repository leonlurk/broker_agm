import { DatabaseAdapter } from './database.adapter';
import { logger } from '../utils/logger';
import { AGM_KNOWLEDGE_BASE, searchKnowledgeBase } from './knowledgeBase';

class EnhancedChatService {
  constructor() {
    // API Keys - Puedes usar Gemini o OpenAI
    this.OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
    this.GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    
    // Configuración
    this.USE_OPENAI = !!this.OPENAI_API_KEY && this.OPENAI_API_KEY !== 'your-openai-api-key';
    this.conversationHistory = new Map();
    this.userContextCache = new Map();
    this.isInitialized = false;
    
    // Intents del sistema
    this.intents = {
      'crear_cuenta': {
        keywords: ['crear cuenta', 'abrir cuenta', 'nueva cuenta', 'cuenta demo', 'cuenta real'],
        category: 'accounts'
      },
      'deposito': {
        keywords: ['depositar', 'deposit', 'añadir fondos', 'cargar dinero', 'agregar saldo', 'meter dinero'],
        category: 'deposits'
      },
      'retiro': {
        keywords: ['retirar', 'withdrawal', 'sacar dinero', 'transferir fondos', 'sacar plata'],
        category: 'withdrawals'
      },
      'kyc': {
        keywords: ['verificar', 'kyc', 'documentos', 'verificación', 'identidad', 'aprobar cuenta'],
        category: 'verification'
      },
      'trading': {
        keywords: ['operar', 'trade', 'comprar', 'vender', 'spread', 'apalancamiento', 'leverage', 'forex', 'crypto'],
        category: 'trading'
      },
      'pamm': {
        keywords: ['pamm', 'gestor', 'invertir con', 'gestión', 'administrador'],
        category: 'pamm'
      },
      'copy': {
        keywords: ['copy', 'copiar', 'seguir trader', 'copytrading', 'copiar operaciones'],
        category: 'copytrading'
      },
      'problema': {
        keywords: ['problema', 'error', 'no funciona', 'ayuda', 'no puedo', 'falla', 'bug'],
        category: 'troubleshooting'
      },
      'plataforma': {
        keywords: ['mt5', 'metatrader', 'descargar', 'plataforma', 'app', 'instalar'],
        category: 'platform'
      },
      'comisiones': {
        keywords: ['comisión', 'fee', 'costo', 'cobran', 'gratis', 'precio'],
        category: 'fees'
      }
    };
    
    // Inicializar historial local
    this.loadLocalHistory();
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      this.isInitialized = true;
      logger.info('[ENHANCED_CHAT] Chat service initialized with knowledge base');
    } catch (error) {
      logger.error('[ENHANCED_CHAT] Failed to initialize:', error);
      throw error;
    }
  }

  // Analizar intención del mensaje
  analyzeIntent(message) {
    const lowerMessage = message.toLowerCase();
    const detectedIntents = [];
    
    for (const [intentName, intentData] of Object.entries(this.intents)) {
      const score = intentData.keywords.reduce((acc, keyword) => {
        if (lowerMessage.includes(keyword)) {
          return acc + (keyword.split(' ').length * 2); // Más peso a frases largas
        }
        return acc;
      }, 0);
      
      if (score > 0) {
        detectedIntents.push({ name: intentName, score, category: intentData.category });
      }
    }
    
    // Ordenar por score y devolver el principal
    detectedIntents.sort((a, b) => b.score - a.score);
    return detectedIntents[0] || { name: 'general', score: 0, category: 'general' };
  }

  // Obtener contexto del usuario
  async getUserContext(userId, userData) {
    // Verificar caché
    if (this.userContextCache.has(userId)) {
      const cached = this.userContextCache.get(userId);
      if (Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutos
        return cached.context;
      }
    }
    
    const context = {
      isAuthenticated: !!userData,
      username: userData?.username || 'Usuario',
      email: userData?.email,
      kycStatus: userData?.kyc_status || 'not_started',
      hasAccounts: userData?.has_trading_accounts || false,
      accountCount: userData?.trading_accounts?.length || 0,
      walletBalance: userData?.wallet_balance || 0,
      lastActivity: userData?.last_activity,
      preferences: userData?.preferences || {},
      conversationHistory: this.getRecentHistory(userId)
    };
    
    // Guardar en caché
    this.userContextCache.set(userId, {
      context,
      timestamp: Date.now()
    });
    
    return context;
  }

  // Obtener información relevante de la base de conocimientos
  getRelevantKnowledge(message, intent, userContext) {
    const relevant = [];
    
    // Buscar información específica según el intent
    if (intent.category && AGM_KNOWLEDGE_BASE[intent.category]) {
      relevant.push({
        type: 'category_info',
        data: AGM_KNOWLEDGE_BASE[intent.category]
      });
    }
    
    // Buscar en FAQs y troubleshooting
    const searchResults = searchKnowledgeBase(message);
    relevant.push(...searchResults);
    
    // Agregar información contextual según el estado del usuario
    if (!userContext.isAuthenticated) {
      relevant.push({
        type: 'context',
        data: 'Usuario no autenticado - enfocar en información general y registro'
      });
    } else if (userContext.kycStatus !== 'approved') {
      relevant.push({
        type: 'context',
        data: 'KYC no verificado - puede necesitar ayuda con verificación'
      });
    }
    
    return relevant;
  }

  // Generar respuesta mejorada
  async generateEnhancedResponse(message, userData = null) {
    const userId = userData?.id || 'anonymous';
    
    // Analizar intent y obtener contexto
    const intent = this.analyzeIntent(message);
    const userContext = await this.getUserContext(userId, userData);
    const relevantKnowledge = this.getRelevantKnowledge(message, intent, userContext);
    
    logger.info('[ENHANCED_CHAT] Processing message', { intent: intent.name, hasContext: !!userData });
    
    // Si tenemos OpenAI, usar GPT-4
    if (this.USE_OPENAI) {
      return await this.generateOpenAIResponse(message, intent, userContext, relevantKnowledge);
    }
    
    // Si no, usar respuesta inteligente basada en knowledge base
    return this.generateSmartFallbackResponse(message, intent, relevantKnowledge, userContext);
  }

  // Generar respuesta con OpenAI GPT-4
  async generateOpenAIResponse(message, intent, userContext, relevantKnowledge) {
    try {
      // Construir contexto del sistema
      const systemPrompt = `Eres Flofy, el asistente oficial de Alpha Global Market (AGM).

CONTEXTO DEL USUARIO:
- Nombre: ${userContext.username}
- Autenticado: ${userContext.isAuthenticated ? 'Sí' : 'No'}
- Estado KYC: ${userContext.kycStatus}
- Cuentas trading: ${userContext.accountCount}
- Balance wallet: $${userContext.walletBalance}

INTENCIÓN DETECTADA: ${intent.name} (categoría: ${intent.category})

INFORMACIÓN RELEVANTE DE AGM:
${relevantKnowledge.map(k => {
  if (k.type === 'faq') return `FAQ: ${k.content.question} - ${k.content.answer}`;
  if (k.type === 'troubleshooting') return `Problema: ${k.content.problem} - Soluciones: ${k.content.solutions.join(', ')}`;
  if (k.type === 'category_info') return `Información: ${JSON.stringify(k.data).substring(0, 500)}`;
  return '';
}).filter(Boolean).join('\n')}

REGLAS IMPORTANTES:
1. Respuestas concisas y específicas (máx 200 caracteres idealmente)
2. Usa la información de la base de conocimientos
3. Si el usuario necesita hacer algo, da pasos específicos
4. Si no sabes algo con certeza, sugiere contactar soporte humano
5. Sé amigable pero profesional
6. Si detectas frustración o problema grave, ofrece asistencia humana
7. NUNCA inventes información que no esté en la base de conocimientos
8. Siempre recuerda que el trading conlleva riesgos

Responde la siguiente pregunta del usuario:`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 250,
          presence_penalty: 0.6,
          frequency_penalty: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
      
    } catch (error) {
      logger.error('[ENHANCED_CHAT] OpenAI error:', error);
      // Fallback a respuesta inteligente
      return this.generateSmartFallbackResponse(message, intent, relevantKnowledge, userContext);
    }
  }

  // Respuesta inteligente sin IA externa
  generateSmartFallbackResponse(message, intent, relevantKnowledge, userContext) {
    const responses = [];
    
    // Saludar si es necesario
    if (message.toLowerCase().match(/hola|buenos|buenas|hey|hi/)) {
      responses.push(`¡Hola ${userContext.username}! `);
    }
    
    // Respuesta basada en intent principal
    switch (intent.name) {
      case 'crear_cuenta':
        if (!userContext.isAuthenticated) {
          responses.push("Para crear una cuenta, primero regístrate en la plataforma. Luego ve a 'Cuentas de Trading' > 'Nueva Cuenta'.");
        } else if (userContext.accountCount === 0) {
          responses.push("Ve a 'Cuentas de Trading' > 'Nueva Cuenta'. Puedes crear una demo gratis o real desde $50.");
        } else {
          responses.push("Ya tienes cuentas activas. Ve a 'Cuentas de Trading' para crear adicionales.");
        }
        break;
        
      case 'deposito':
        if (!userContext.isAuthenticated) {
          responses.push("Necesitas una cuenta para depositar. Regístrate primero en agm.com");
        } else if (userContext.kycStatus !== 'approved') {
          responses.push("Para depositar, ve a Wallet > Depositar. Acepta tarjetas, transferencias y crypto desde $50. Nota: KYC requerido para retiros.");
        } else {
          responses.push("Ve a Wallet > Depositar. Métodos: transferencia bancaria, tarjetas (2.5% fee), crypto (sin fee). Mínimo $50.");
        }
        break;
        
      case 'retiro':
        if (userContext.kycStatus !== 'approved') {
          responses.push("⚠️ Necesitas verificación KYC aprobada para retirar. Ve a Configuración > Verificación KYC.");
        } else {
          responses.push("Ve a Wallet > Retirar. Mínimo $50, procesamiento 24-72h. Asegúrate de configurar tu método de retiro primero.");
        }
        break;
        
      case 'kyc':
        const kycInfo = AGM_KNOWLEDGE_BASE.accounts.verification.kyc;
        if (userContext.kycStatus === 'approved') {
          responses.push("✅ Tu KYC ya está aprobado. Tienes acceso completo a retiros y todas las funciones.");
        } else if (userContext.kycStatus === 'pending') {
          responses.push("⏳ Tu KYC está en revisión. Proceso toma 24-48h hábiles. Te notificaremos cuando esté listo.");
        } else {
          responses.push(`Para verificar: ${kycInfo.process[0]}, ${kycInfo.process[1]}. Necesitas: ID + comprobante domicilio + selfie.`);
        }
        break;
        
      case 'trading':
        responses.push("Ofrecemos Forex (1:200), Crypto (1:20), Índices y Materias Primas. Spreads desde 0.8 pips. ¿Qué instrumento te interesa?");
        break;
        
      case 'pamm':
        responses.push("PAMM permite invertir con gestores desde $100. Ve a sección PAMM, revisa estadísticas de gestores y elige uno. Comisiones solo sobre ganancias.");
        break;
        
      case 'copy':
        responses.push("Copy Trading copia automáticamente traders exitosos. Mínimo $100. Ve a Copy Trading, filtra por rendimiento y activa la copia.");
        break;
        
      case 'problema':
        // Buscar en troubleshooting
        if (relevantKnowledge.length > 0 && relevantKnowledge[0].type === 'troubleshooting') {
          const problem = relevantKnowledge[0].content;
          responses.push(`Para '${problem.problem}': ${problem.solutions[0]}. ¿Necesitas más ayuda?`);
        } else {
          responses.push("Entiendo que tienes un problema. ¿Podrías darme más detalles? También puedo conectarte con soporte humano si prefieres.");
        }
        break;
        
      case 'plataforma':
        responses.push("Usamos MetaTrader 5. Descarga: Windows/Mac/iOS/Android. WebTrader disponible sin descarga. ¿Qué dispositivo usas?");
        break;
        
      default:
        // Buscar en FAQs
        if (relevantKnowledge.length > 0 && relevantKnowledge[0].type === 'faq') {
          responses.push(relevantKnowledge[0].content.answer);
        } else {
          // Respuesta genérica
          responses.push("Puedo ayudarte con: cuentas, depósitos, retiros, KYC, trading, PAMM y copy trading. ¿Sobre qué necesitas información?");
        }
    }
    
    // Agregar sugerencias contextuales
    if (!userContext.isAuthenticated) {
      responses.push(" ¿Necesitas crear una cuenta?");
    } else if (userContext.kycStatus !== 'approved' && intent.name !== 'kyc') {
      if (Math.random() > 0.7) { // 30% de probabilidad de sugerir KYC
        responses.push(" Recuerda verificar tu KYC para acceso completo.");
      }
    }
    
    return responses.join(' ').substring(0, 300); // Limitar longitud
  }

  // Procesar mensaje del usuario
  async processUserMessage(userId, message, userData = null) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Guardar mensaje en historial
      this.addToHistory(userId, 'user', message);
      
      // Generar respuesta mejorada
      const aiResponse = await this.generateEnhancedResponse(message, userData);
      
      // Guardar respuesta en historial
      this.addToHistory(userId, 'flofy', aiResponse);
      
      // Guardar en localStorage para persistencia
      this.saveLocalHistory();
      
      return {
        success: true,
        response: aiResponse,
        intent: this.analyzeIntent(message).name,
        isHumanControlled: false
      };

    } catch (error) {
      logger.error('[ENHANCED_CHAT] Error processing message:', error);
      return {
        success: false,
        error: error.message,
        response: 'Disculpa, hubo un error. ¿Podrías reformular tu pregunta o intentar más tarde?'
      };
    }
  }

  // Gestión del historial de conversación
  addToHistory(userId, sender, message) {
    if (!this.conversationHistory.has(userId)) {
      this.conversationHistory.set(userId, []);
    }
    
    const history = this.conversationHistory.get(userId);
    history.push({
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sender,
      message,
      timestamp: new Date().toISOString()
    });
    
    // Limitar historial a últimos 50 mensajes
    if (history.length > 50) {
      history.shift();
    }
  }

  getRecentHistory(userId, limit = 10) {
    const history = this.conversationHistory.get(userId) || [];
    return history.slice(-limit);
  }

  // Persistencia local
  saveLocalHistory() {
    try {
      const historyData = Array.from(this.conversationHistory.entries());
      localStorage.setItem('agm_chat_history', JSON.stringify(historyData));
    } catch (error) {
      logger.error('[ENHANCED_CHAT] Error saving history:', error);
    }
  }

  loadLocalHistory() {
    try {
      const saved = localStorage.getItem('agm_chat_history');
      if (saved) {
        const historyData = JSON.parse(saved);
        this.conversationHistory = new Map(historyData);
      }
    } catch (error) {
      logger.error('[ENHANCED_CHAT] Error loading history:', error);
    }
  }

  // Obtener historial de conversación
  async getConversationHistory(userId, limit = 50) {
    const history = this.conversationHistory.get(userId) || [];
    return {
      success: true,
      messages: history.slice(-limit)
    };
  }

  // Limpiar historial
  clearHistory(userId) {
    this.conversationHistory.delete(userId);
    this.saveLocalHistory();
  }

  // Verificar control humano (placeholder)
  async checkHumanControl(userId) {
    // Por ahora siempre retorna false
    return false;
  }

  // Toggle control humano (placeholder)
  async toggleHumanControl(userId, isHumanControlled) {
    return { success: true };
  }
}

// Export singleton instance
export const enhancedChatService = new EnhancedChatService();
export default enhancedChatService;