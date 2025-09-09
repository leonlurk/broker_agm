import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from './AuthContext';
import { ChatServiceAPI } from '../services/chatServiceAPI';
import { supabase } from '../services/supabase';
import logger from '../utils/logger';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { currentUser, userData } = useContext(AuthContext);
  
  // Estado simple y directo
  const [messages, setMessages] = useState([]);
  const [isHumanControlled, setIsHumanControlled] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [conversationId, setConversationId] = useState(null);
  const [isSending, setIsSending] = useState(false);
  
  // Referencias
  const subscriptionRef = useRef(null);
  const chatService = useRef(new ChatServiceAPI());
  const lastFetchTime = useRef(0);

  // Inicializar cuando el usuario se conecta
  useEffect(() => {
    if (!currentUser) {
      setMessages([]);
      setConversationId(null);
      return;
    }

    const initChat = async () => {
      try {
        setConnectionStatus('connecting');
        
        // Inicializar servicio
        await chatService.current.initialize();
        
        const userId = currentUser.id || currentUser.uid;
        
        // Obtener o crear conversación
        const dbConvId = await chatService.current.getOrCreateConversation(userId);
        setConversationId(dbConvId);
        
        if (dbConvId) {
          // Cargar mensajes existentes
          await loadMessages(dbConvId);
          
          // Suscribirse a nuevos mensajes
          subscribeToMessages(dbConvId);
          
          // Verificar control humano
          const humanControl = await chatService.current.checkHumanControl(userId);
          setIsHumanControlled(humanControl);
        }
        
        setConnectionStatus('connected');
      } catch (error) {
        logger.error('[CHAT] Error initializing:', error);
        setConnectionStatus('disconnected');
      }
    };

    initChat();

    // Cleanup
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [currentUser?.id, currentUser?.uid]);

  // Cargar mensajes de la DB
  const loadMessages = async (convId) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedMessages = data.map(msg => ({
          id: msg.id,
          sender: msg.sender_type === 'ai' ? 'flofy' : msg.sender_type,
          message: msg.message,
          timestamp: msg.created_at,
          sender_name: msg.sender_name
        }));
        
        setMessages(formattedMessages);
        lastFetchTime.current = Date.now();
      }
    } catch (error) {
      logger.error('[CHAT] Error loading messages:', error);
    }
  };

  // Suscripción simple a mensajes nuevos
  const subscribeToMessages = (convId) => {
    // Limpiar suscripción anterior
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    const channel = supabase
      .channel(`chat-${convId}`)
      .on('postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${convId}`
        },
        (payload) => {
          if (payload.new) {
            const newMsg = {
              id: payload.new.id,
              sender: payload.new.sender_type === 'ai' ? 'flofy' : payload.new.sender_type,
              message: payload.new.message,
              timestamp: payload.new.created_at,
              sender_name: payload.new.sender_name
            };
            
            // Agregar mensaje si no existe
            setMessages(prev => {
              const exists = prev.some(m => m.id === newMsg.id);
              if (!exists) {
                return [...prev, newMsg].sort((a, b) => 
                  new Date(a.timestamp) - new Date(b.timestamp)
                );
              }
              return prev;
            });

            // Actualizar control humano si es necesario
            if (payload.new.sender_type === 'human') {
              setIsHumanControlled(true);
            }
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;
  };

  // Enviar mensaje simplificado
  const sendMessage = async (text) => {
    if (!currentUser || !text.trim() || isSending) return { success: false };
    
    const userId = currentUser.id || currentUser.uid;
    
    setIsSending(true);
    
    try {
      // Agregar mensaje temporal del usuario
      const tempMsg = {
        id: `temp_${Date.now()}`,
        sender: 'user',
        message: text.trim(),
        timestamp: new Date().toISOString(),
        isTemp: true
      };
      
      setMessages(prev => [...prev, tempMsg]);
      
      // Enviar mensaje
      const result = await chatService.current.processUserMessage(userId, text, userData);
      
      if (result.success) {
        // Actualizar conversationId si cambió
        if (result.conversationId && result.conversationId !== conversationId) {
          setConversationId(result.conversationId);
          subscribeToMessages(result.conversationId);
        }
        
        // Actualizar control humano
        if (result.isHumanControlled !== undefined) {
          setIsHumanControlled(result.isHumanControlled);
        }
        
        // Agregar indicador de carga para respuesta
        const loadingMsg = {
          id: `loading_${Date.now()}`,
          sender: 'flofy',
          message: '...',
          timestamp: new Date().toISOString(),
          isLoading: true
        };
        
        setMessages(prev => {
          // Remover mensaje temporal y agregar loading
          const filtered = prev.filter(m => !m.isTemp);
          return [...filtered, loadingMsg];
        });
        
        // Fetch mensajes después de un breve delay
        setTimeout(async () => {
          if (conversationId || result.conversationId) {
            await fetchRecentMessages(result.conversationId || conversationId);
          }
        }, 300);
        
        return { success: true };
      } else {
        // Remover mensaje temporal en caso de error
        setMessages(prev => prev.filter(m => !m.isTemp));
        return { success: false, error: result.error };
      }
    } catch (error) {
      logger.error('[CHAT] Error sending message:', error);
      setMessages(prev => prev.filter(m => !m.isTemp));
      return { success: false, error: error.message };
    } finally {
      setIsSending(false);
    }
  };

  // Fetch mensajes recientes (simplificado)
  const fetchRecentMessages = async (convId) => {
    // Evitar fetch muy frecuentes
    const now = Date.now();
    if (now - lastFetchTime.current < 200) return;
    lastFetchTime.current = now;
    
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedMessages = data.map(msg => ({
          id: msg.id,
          sender: msg.sender_type === 'ai' ? 'flofy' : msg.sender_type,
          message: msg.message,
          timestamp: msg.created_at,
          sender_name: msg.sender_name
        }));
        
        // Reemplazar todos los mensajes
        setMessages(formattedMessages.reverse());
      }
    } catch (error) {
      logger.error('[CHAT] Error fetching recent messages:', error);
    }
  };

  // Toggle control humano
  const toggleHumanControl = async () => {
    if (!currentUser) return { success: false };
    
    const userId = currentUser.id || currentUser.uid;
    const newStatus = !isHumanControlled;
    
    try {
      const result = await chatService.current.toggleHumanControl(userId, newStatus);
      
      if (result.success) {
        setIsHumanControlled(newStatus);
        
        // Agregar mensaje del sistema
        const sysMsg = {
          id: `sys_${Date.now()}`,
          sender: 'system',
          message: newStatus 
            ? 'Un asesor humano se ha unido a la conversación' 
            : 'Control devuelto a Flofy AI',
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, sysMsg]);
      }
      
      return result;
    } catch (error) {
      logger.error('[CHAT] Error toggling human control:', error);
      return { success: false };
    }
  };

  // Limpiar conversación
  const clearConversation = () => {
    setMessages([]);
  };

  const value = {
    messages,
    isHumanControlled,
    connectionStatus,
    sendMessage,
    toggleHumanControl,
    clearConversation,
    isConnected: connectionStatus === 'connected',
    isLoading: connectionStatus === 'connecting',
    isSending
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;