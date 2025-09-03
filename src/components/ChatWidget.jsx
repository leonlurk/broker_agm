import { useState, useEffect, useRef } from 'react';
import { Send, Minimize2, X, Bot, User, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const ChatWidget = ({ onClose, onMinimize, onNewMessage }) => {
  const { t } = useTranslation();
  const { currentUser, userData } = useAuth();
  const { 
    conversations, 
    sendMessage, 
    isHumanControlled, 
    connectionStatus, 
    markMessagesAsRead,
    isLoading: contextLoading
  } = useChat();
  
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSection, setCurrentSection] = useState('messages'); // 'messages', 'help'
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations]);

  // Focus input on open and mark messages as read
  useEffect(() => {
    if (currentUser) {
      setTimeout(() => inputRef.current?.focus(), 100);
      markMessagesAsRead();
    }
  }, [currentUser, markMessagesAsRead]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || contextLoading) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const result = await sendMessage(messageText);
      
      if (result.success) {
        if (onNewMessage && result.response) {
          onNewMessage();
        }
      } else {
        toast.error(result.error || 'Error al enviar mensaje. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar mensaje. Inténtalo de nuevo.');
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessage = (message) => {
    const isUser = message.sender === 'user';
    const isAI = message.sender === 'alpha';
    const isAsesor = message.sender === 'asesor';
    const isSystem = message.sender === 'system';

    return (
      <div key={message.id} className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {/* Avatar */}
        {!isUser && (
          <div className="flex-shrink-0 mr-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isAI ? 'bg-gradient-to-r from-cyan-500 to-blue-600' :
              isAsesor ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
              'bg-gradient-to-r from-gray-500 to-gray-600'
            }`}>
              {isAI ? <Bot size={16} className="text-white" /> :
               isAsesor ? <User size={16} className="text-white" /> :
               <AlertCircle size={16} className="text-white" />}
            </div>
          </div>
        )}

        {/* Message Bubble */}
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
          isUser 
            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' 
            : isSystem
            ? 'bg-red-100 border border-red-300 text-red-700'
            : 'bg-gray-100 text-gray-800 border border-gray-200'
        }`}>
          {/* Sender Label */}
          {!isUser && (
            <div className="text-xs font-medium mb-1 opacity-70">
              {isAI ? 'Alpha AI' : isAsesor ? 'Asesor Humano' : 'Sistema'}
            </div>
          )}
          
          {/* Message Content */}
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.message}
          </div>

          {/* Timestamp */}
          <div className={`text-xs mt-1 opacity-60 ${isUser ? 'text-right' : 'text-left'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>

        {/* User Avatar */}
        {isUser && (
          <div className="flex-shrink-0 ml-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-80 h-[500px] max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">AGM Support</h3>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-400' :
                  connectionStatus === 'connecting' ? 'bg-yellow-400' :
                  'bg-red-400'
                }`} />
                <span className="text-xs opacity-90">
                  {isHumanControlled ? 'Asesor conectado' : 'IA activa'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={onMinimize}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <Minimize2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {contextLoading && conversations.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500 text-sm">Cargando conversación...</div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Bot size={48} className="mx-auto text-cyan-500 mb-4" />
              <h3 className="text-gray-700 font-medium mb-2">¡Hola! Soy Alpha</h3>
              <p className="text-gray-500 text-sm">
                Tu asistente de trading en AGM.{' '}
                {currentUser ? `¡Hola ${userData?.username || 'trader'}!` : ''}
                <br />¿En qué puedo ayudarte hoy?
              </p>
            </div>
          </div>
        ) : (
          <>
            {conversations.map(renderMessage)}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="bg-gray-100 rounded-2xl px-4 py-2 border border-gray-200">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center hover:from-blue-700 hover:to-blue-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            title="Enviar mensaje"
          >
            <span className="text-white text-xl font-bold" style={{color: 'white'}}>➤</span>
          </button>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-1 mt-2">
          {[
            'Crear cuenta demo',
            'Hacer depósito',
            'Verificar KYC',
            'Instrumentos disponibles'
          ].map((action) => (
            <button
              key={action}
              onClick={() => setInputMessage(action)}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
            >
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;