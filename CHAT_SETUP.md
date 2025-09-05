# Configuración del Chat de Soporte AGM

## ✨ Características Implementadas

### 1. **Base de Conocimientos Completa**
- Información detallada sobre AGM (trading, cuentas, depósitos, retiros, KYC)
- FAQs frecuentes con respuestas precisas
- Guías paso a paso para procesos comunes
- Troubleshooting para problemas técnicos

### 2. **Sistema de Inteligencia Avanzado**
- Detección automática de intents (10+ categorías)
- Contexto de usuario personalizado
- Respuestas inteligentes basadas en el estado del usuario
- Historial de conversación persistente

### 3. **Integración con IA (Opcional)**
- Soporte para OpenAI GPT-4
- Soporte para Google Gemini
- Fallback inteligente si no hay API configurada

### 4. **Sistema de Feedback**
- Botones 👍/👎 en cada respuesta de IA
- Almacenamiento de feedback para mejora continua
- Análisis de respuestas no útiles

## 🚀 Configuración Rápida (Sin IA Externa)

El chat funciona perfectamente sin configurar ninguna API externa. Usa la base de conocimientos integrada para responder preguntas sobre AGM.

```bash
# No se necesita configuración adicional
# El chat usará respuestas inteligentes basadas en la knowledge base
```

## 🤖 Configuración con IA (Recomendado)

### Opción 1: OpenAI GPT-4 (Mejor calidad)

1. Obtén una API key de OpenAI: https://platform.openai.com/api-keys
2. Agrega al archivo `.env`:

```env
VITE_OPENAI_API_KEY=sk-tu-api-key-aqui
```

**Costos estimados:** $0.01-0.03 por mensaje

### Opción 2: Google Gemini (Gratis)

1. Obtén una API key de Google: https://makersuite.google.com/app/apikey
2. Agrega al archivo `.env`:

```env
VITE_GEMINI_API_KEY=tu-api-key-aqui
```

**Costos:** Gratis hasta 60 consultas por minuto

## 📊 Características del Chat

### Responde a:
- ✅ Creación de cuentas (demo/real)
- ✅ Procesos de depósito (métodos, tiempos, fees)
- ✅ Procesos de retiro (requisitos, KYC)
- ✅ Verificación KYC (documentos, proceso)
- ✅ Trading (instrumentos, spreads, apalancamiento)
- ✅ Sistema PAMM (inversión, gestión)
- ✅ Copy Trading (cómo funciona, requisitos)
- ✅ Problemas técnicos (troubleshooting)
- ✅ Plataforma MT5 (descarga, instalación)

### Contexto Inteligente:
- Detecta si el usuario está autenticado
- Conoce el estado KYC del usuario
- Personaliza respuestas según el perfil
- Recuerda conversaciones anteriores

### Quick Actions:
- Botones rápidos para preguntas comunes
- Acceso directo a procesos frecuentes
- Sugerencias contextuales

## 🔧 Archivos Principales

```
src/
├── services/
│   ├── knowledgeBase.js         # Base de conocimientos de AGM
│   ├── enhancedChatService.js   # Servicio de chat mejorado
│   └── chatService.js           # Servicio original (fallback)
├── components/
│   ├── ChatWidget.jsx           # Widget de chat con feedback
│   └── FloatingChatButton.jsx   # Botón flotante
└── contexts/
    └── ChatContext.jsx           # Contexto global del chat
```

## 📈 Métricas y Análisis

El sistema guarda automáticamente:
- Historial de conversaciones (localStorage)
- Feedback de usuarios (localStorage)
- Intents detectados
- Tasa de respuestas útiles

Para ver las métricas:

```javascript
// En la consola del navegador
const feedback = JSON.parse(localStorage.getItem('agm_chat_feedback') || '[]');
const helpful = feedback.filter(f => f.isHelpful).length;
const notHelpful = feedback.filter(f => !f.isHelpful).length;
console.log(`Útiles: ${helpful}, No útiles: ${notHelpful}`);
```

## 🎯 Próximas Mejoras Sugeridas

1. **Panel de Administración**
   - Editar FAQs en tiempo real
   - Ver conversaciones problemáticas
   - Estadísticas de uso

2. **Integración con CRM**
   - Crear tickets automáticamente
   - Escalar a soporte humano
   - Historial unificado

3. **Machine Learning**
   - Aprender de respuestas exitosas
   - Mejorar detección de intents
   - Personalización avanzada

## 💡 Tips para Mejorar el Chat

1. **Actualizar Knowledge Base:**
   - Editar `src/services/knowledgeBase.js`
   - Agregar nuevas FAQs
   - Actualizar información de productos

2. **Ajustar Respuestas:**
   - Modificar templates en `generateSmartFallbackResponse()`
   - Personalizar mensajes por intent
   - Agregar más categorías

3. **Mejorar Contexto:**
   - Usar más datos del usuario
   - Agregar preferencias
   - Historial de transacciones

## 🔒 Seguridad

- Las API keys se mantienen en variables de entorno
- No se expone información sensible
- El historial se guarda localmente
- Sanitización de inputs del usuario

## 📞 Soporte

Si necesitas ayuda con la configuración:
1. Revisa los logs en la consola
2. Verifica las API keys
3. Prueba sin IA externa primero
4. Contacta al equipo de desarrollo

---

**Versión:** 1.0.0  
**Última actualización:** Diciembre 2024  
**Desarrollado para:** Alpha Global Market (AGM)