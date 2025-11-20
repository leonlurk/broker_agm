import React, { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { Send, Minimize2, X, Bot, User, Clock, CheckCircle, AlertCircle, ThumbsUp, ThumbsDown, RefreshCw, Archive, History, ArrowLeft, UserCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase/config';
import { logger } from '../utils/logger';
import toast from 'react-hot-toast';

// Componente Message memoizado para evitar re-renders innecesarios
const Message = memo(({ message, isUser, isAI, isAsesor, isSystem, isTemp, isLoading, onFeedback, hasFeedback, currentUser }) => {
  return (
    <React.Fragment>
      <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {/* Avatar para Bot/Humano (izquierda) */}
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
        <div className={`max-w-[70%] px-4 py-2 rounded-2xl break-words ${
          isUser
            ? isTemp
              ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white opacity-70'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
            : isSystem
            ? 'bg-red-100 border border-red-300 text-red-700'
            : isLoading
            ? 'bg-gray-100 text-gray-800 border border-gray-200 animate-pulse'
            : isAsesor
            ? 'bg-green-50 text-gray-800 border border-green-200'
            : 'bg-gray-100 text-gray-800 border border-gray-200'
        }`}>
          {/* Sender Label */}
          {!isUser && (
            <div className={`text-xs font-medium mb-1 ${isAsesor ? 'text-green-600' : 'opacity-70'}`}>
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

        {/* Avatar para Usuario (derecha) */}
        {isUser && (
          <div className="flex-shrink-0 ml-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Feedback buttons para mensajes de IA */}
      {isAI && !hasFeedback && currentUser && (
        <div className="flex gap-2 ml-11 mt-1 mb-2">
          <button
            onClick={() => onFeedback(message.id, true)}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-green-100 rounded-full text-gray-600 hover:text-green-600 transition-colors"
            title="Respuesta util"
          >
            <ThumbsUp size={12} />
            <span>Util</span>
          </button>
          <button
            onClick={() => onFeedback(message.id, false)}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-red-100 rounded-full text-gray-600 hover:text-red-600 transition-colors"
            title="Respuesta no util"
          >
            <ThumbsDown size={12} />
            <span>No util</span>
          </button>
        </div>
      )}
    </React.Fragment>
  );
});

Message.displayName = 'Message';

// Ticket History Item Component
const TicketHistoryItem = memo(({ ticket, onSelect, onReopen }) => {
  const statusColors = {
    open: 'bg-green-100 text-green-800',
    archived: 'bg-yellow-100 text-yellow-800',
    closed: 'bg-gray-100 text-gray-800'
  };

  const statusLabels = {
    open: 'Abierto',
    archived: 'Archivado',
    closed: 'Cerrado'
  };

  return (
    <div className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => onSelect(ticket)}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[ticket.status]}`}>
          {statusLabels[ticket.status]}
        </span>
        <span className="text-xs text-gray-500">
          {new Date(ticket.created_at).toLocaleDateString()}
        </span>
      </div>
      <p className="text-sm text-gray-700 truncate">{ticket.subject || 'Soporte General'}</p>
      <p className="text-xs text-gray-500 mt-1">
        {ticket.message_count || 0} mensajes
      </p>
      {ticket.status === 'archived' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReopen(ticket);
          }}
          className="mt-2 text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
        >
          <RefreshCw size={12} />
          Reabrir ticket
        </button>
      )}
    </div>
  );
});

TicketHistoryItem.displayName = 'TicketHistoryItem';

const ChatWidget = ({ onClose, onMinimize, onNewMessage }) => {
  const { t } = useTranslation();
  const { currentUser, userData } = useAuth();
  const {
    conversations,
    currentConversationId,
    sendMessage,
    isHumanControlled,
    connectionStatus,
    isLoading: contextLoading,
    updateVersion
  } = useChat();

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSection, setCurrentSection] = useState('messages'); // 'messages', 'history'
  const [messageFeedback, setMessageFeedback] = useState({});
  const [ticketHistory, setTicketHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [currentTicketStatus, setCurrentTicketStatus] = useState('open');
  const [adminIntervening, setAdminIntervening] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Get messages from conversations Map
  const messages = currentConversationId && conversations instanceof Map
    ? conversations.get(currentConversationId) || []
    : [];

  // Check if admin is currently intervening
  useEffect(() => {
    const checkIntervention = async () => {
      if (!currentConversationId) return;

      try {
        const { data, error } = await supabase
          .from('admin_interventions')
          .select('*')
          .eq('ticket_id', currentConversationId)
          .is('ended_at', null)
          .maybeSingle();

        if (data && !error) {
          setAdminIntervening(true);
        } else {
          setAdminIntervening(false);
        }
      } catch (error) {
        logger.error('[CHAT_WIDGET] Error checking intervention:', error);
      }
    };

    checkIntervention();

    // Subscribe to intervention changes
    const channel = supabase
      .channel(`interventions-${currentConversationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'admin_interventions',
        filter: `ticket_id=eq.${currentConversationId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setAdminIntervening(true);
          toast.success('Un asesor se ha unido a la conversacion');
        } else if (payload.eventType === 'UPDATE' && payload.new.ended_at) {
          setAdminIntervening(false);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentConversationId]);

  // Check current ticket status
  useEffect(() => {
    const checkTicketStatus = async () => {
      if (!currentConversationId) return;

      try {
        const { data, error } = await supabase
          .from('support_tickets')
          .select('status')
          .eq('id', currentConversationId)
          .maybeSingle();

        if (data && !error) {
          setCurrentTicketStatus(data.status);
        }
      } catch (error) {
        logger.error('[CHAT_WIDGET] Error checking ticket status:', error);
      }
    };

    checkTicketStatus();
  }, [currentConversationId]);

  // Load ticket history
  const loadTicketHistory = async () => {
    if (!currentUser) return;

    setLoadingHistory(true);
    try {
      const userId = currentUser.id || currentUser.uid;

      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          support_messages(count)
        `)
        .eq('user_id', userId)
        .order('last_message_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const ticketsWithCount = data.map(ticket => ({
        ...ticket,
        message_count: ticket.support_messages?.[0]?.count || 0
      }));

      setTicketHistory(ticketsWithCount);
    } catch (error) {
      logger.error('[CHAT_WIDGET] Error loading ticket history:', error);
      toast.error('Error al cargar historial');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Load messages for a specific ticket
  const loadTicketMessages = async (ticket) => {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages = data.map(msg => ({
        id: msg.id,
        sender: msg.sender_type === 'user' ? 'user' :
                msg.sender_type === 'ai' ? 'flofy' :
                msg.sender_type === 'admin' ? 'human' :
                msg.sender_type,
        message: msg.content,
        timestamp: msg.created_at,
        sender_name: msg.sender_name
      }));

      setTicketMessages(formattedMessages);
      setSelectedTicket(ticket);
    } catch (error) {
      logger.error('[CHAT_WIDGET] Error loading ticket messages:', error);
      toast.error('Error al cargar mensajes');
    }
  };

  // Reopen archived ticket
  const handleReopenTicket = async (ticket) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: 'open', updated_at: new Date().toISOString() })
        .eq('id', ticket.id);

      if (error) throw error;

      toast.success('Ticket reabierto');
      loadTicketHistory();

      // Switch to this ticket
      setSelectedTicket({ ...ticket, status: 'open' });
      await loadTicketMessages(ticket);
      setCurrentSection('messages');
    } catch (error) {
      logger.error('[CHAT_WIDGET] Error reopening ticket:', error);
      toast.error('Error al reabrir ticket');
    }
  };

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, ticketMessages, updateVersion]);

  // Focus input on open
  useEffect(() => {
    if (currentUser) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [currentUser]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

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
        toast.error(result.error || 'Error al enviar mensaje. Intentalo de nuevo.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar mensaje. Intentalo de nuevo.');
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

  // Manejar feedback de mensajes simplificado
  const handleFeedback = useCallback(async (messageId, isHelpful) => {
    // Actualizar UI inmediatamente
    setMessageFeedback(prev => ({
      ...prev,
      [messageId]: isHelpful
    }));

    // Guardar en localStorage
    try {
      const feedbackData = {
        messageId,
        isHelpful,
        timestamp: new Date().toISOString(),
        userId: currentUser?.uid
      };

      const storedFeedback = localStorage.getItem('chatFeedback') || '{}';
      const feedbackMap = JSON.parse(storedFeedback);
      feedbackMap[messageId] = feedbackData;
      localStorage.setItem('chatFeedback', JSON.stringify(feedbackMap));
    } catch (error) {
      logger.error('[CHAT] Error guardando feedback:', error);
    }

    // Mensajes de toast
    if (!isHelpful) {
      toast('Gracias por tu feedback. Estamos mejorando constantemente.', {
        duration: 4000,
        icon: '?'
      });
    } else {
      toast.success('Gracias por tu feedback!');
    }
  }, [currentUser, messageFeedback]);

  // Render current messages (either from current conversation or selected ticket)
  const displayMessages = selectedTicket ? ticketMessages : messages;

  return (
    <div className="w-96 h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {selectedTicket && (
              <button
                onClick={() => {
                  setSelectedTicket(null);
                  setTicketMessages([]);
                }}
                className="p-1 rounded-full hover:bg-white/20 transition-colors mr-1"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              {adminIntervening ? <UserCheck size={18} /> : <Bot size={18} />}
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
                  {adminIntervening ? 'Asesor conectado' :
                   isHumanControlled ? 'Asesor conectado' : 'IA activa'}
                </span>
              </div>
              {currentTicketStatus === 'archived' && (
                <span className="text-xs bg-yellow-400/30 px-2 py-0.5 rounded-full">
                  Ticket archivado
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (currentSection === 'history') {
                  setCurrentSection('messages');
                  setSelectedTicket(null);
                  setTicketMessages([]);
                } else {
                  setCurrentSection('history');
                  loadTicketHistory();
                }
              }}
              className={`p-1 rounded-full hover:bg-white/20 transition-colors ${
                currentSection === 'history' ? 'bg-white/30' : ''
              }`}
              title="Historial de tickets"
            >
              <History size={16} />
            </button>
            <button
              onClick={onMinimize}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <Minimize2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Admin Intervention Banner */}
      {adminIntervening && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-2 flex items-center gap-2">
          <UserCheck size={16} className="text-green-600" />
          <span className="text-sm text-green-700">Un asesor esta atendiendo tu consulta</span>
        </div>
      )}

      {/* Content Area */}
      {currentSection === 'history' && !selectedTicket ? (
        // Ticket History View
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-3 border-b border-gray-200 bg-white">
            <h4 className="font-medium text-sm text-gray-700">Historial de Tickets</h4>
          </div>
          {loadingHistory ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500 text-sm">Cargando historial...</div>
            </div>
          ) : ticketHistory.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <Archive size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 text-sm">No hay tickets anteriores</p>
              </div>
            </div>
          ) : (
            ticketHistory.map(ticket => (
              <TicketHistoryItem
                key={ticket.id}
                ticket={ticket}
                onSelect={loadTicketMessages}
                onReopen={handleReopenTicket}
              />
            ))
          )}
        </div>
      ) : (
        // Messages Area
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
          {contextLoading && displayMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500 text-sm">Cargando conversacion...</div>
            </div>
          ) : displayMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Bot size={48} className="mx-auto text-cyan-500 mb-4" />
                <h3 className="text-gray-700 font-medium mb-2">Hola! Soy Alpha</h3>
                <p className="text-gray-500 text-sm">
                  Tu asistente de trading en AGM.{' '}
                  {currentUser ? `Hola ${userData?.username || 'trader'}!` : ''}
                  <br />En que puedo ayudarte hoy?
                </p>
              </div>
            </div>
          ) : (
            <>
              {displayMessages.map(message => (
                <Message
                  key={message.id}
                  message={message}
                  isUser={message.sender === 'user'}
                  isAI={message.sender === 'flofy' || message.sender === 'alpha' || message.sender === 'ai'}
                  isAsesor={message.sender === 'asesor' || message.sender === 'human' || message.sender === 'admin'}
                  isSystem={message.sender === 'system'}
                  isTemp={message.isTemp}
                  isLoading={message.isLoading}
                  onFeedback={handleFeedback}
                  hasFeedback={messageFeedback[message.id]}
                  currentUser={currentUser}
                />
              ))}

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
      )}

      {/* Input Area - Only show when viewing messages */}
      {(currentSection === 'messages' || selectedTicket) && (
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={currentTicketStatus === 'archived' ? 'Enviar mensaje reabrira el ticket...' : 'Escribe tu mensaje...'}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center hover:from-blue-700 hover:to-blue-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              title="Enviar mensaje"
            >
              <span className="text-white text-xl font-bold" style={{color: 'white'}}>&#10148;</span>
            </button>
          </div>

          {/* Quick Actions */}
          {!selectedTicket && (
            <div className="flex flex-wrap gap-1 mt-2">
              {[
                'Crear cuenta demo',
                'Hacer deposito',
                'Verificar KYC',
                'Como retirar',
                'Sistema PAMM',
                'Copy Trading'
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
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
