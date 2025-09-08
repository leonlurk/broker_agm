import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
// Usar el servicio mejorado si está disponible, si no usar el original
import enhancedChatService from '../services/enhancedChatService';
import chatService from '../services/chatService';
import { logger } from '../utils/logger';
import { supabase } from '../supabase/config';

// Decidir qué servicio usar
const activeChatService = enhancedChatService || chatService;

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { currentUser, userData } = useAuth();
  const [conversations, setConversations] = useState(new Map());
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [actualConversationId, setActualConversationId] = useState(null); // UUID real de DB
  const [isHumanControlled, setIsHumanControlled] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageIdMap, setMessageIdMap] = useState(new Map()); // Map de mensajes locales a IDs de DB
  const [realtimeSubscription, setRealtimeSubscription] = useState(null);

  // Initialize chat service when user is authenticated
  useEffect(() => {
    if (currentUser) {
      initializeChatService();
    }
    
    // Cleanup on unmount
    return () => {
      if (realtimeSubscription) {
        realtimeSubscription.unsubscribe();
      }
    };
  }, [currentUser]);

  // Load messages from database
  const loadMessagesFromDB = async (conversationId, localConvId) => {
    try {
      logger.info('[CHAT_CONTEXT] Loading messages from DB for conversation:', conversationId);
      
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (error) {
        logger.error('[CHAT_CONTEXT] Error loading messages from DB:', error);
        return;
      }
      
      if (messages && messages.length > 0) {
        logger.info('[CHAT_CONTEXT] Found', messages.length, 'messages in DB');
        
        // Log tipos de mensajes encontrados
        const messageCounts = messages.reduce((acc, msg) => {
          acc[msg.sender_type] = (acc[msg.sender_type] || 0) + 1;
          return acc;
        }, {});
        logger.info('[CHAT_CONTEXT] Message types found:', messageCounts);
        
        // Convert DB messages to local format
        const formattedMessages = messages.map(msg => ({
          id: msg.id,
          sender: msg.sender_type === 'user' ? 'user' : 
                  msg.sender_type === 'ai' ? 'flofy' : 
                  msg.sender_type === 'human' ? 'human' : 
                  msg.sender_type,
          message: msg.message,
          timestamp: msg.created_at,
          sender_name: msg.sender_name
        }));
        
        // Log muestra de mensajes
        logger.info('[CHAT_CONTEXT] Sample messages:', {
          first: formattedMessages[0],
          humanMessages: formattedMessages.filter(m => m.sender === 'human').slice(0, 3),
          last: formattedMessages[formattedMessages.length - 1]
        });
        
        // Add to conversations - use the DB conversation ID as key
        setConversations(prev => {
          const newConversations = prev instanceof Map ? new Map(prev) : new Map();
          // Store messages using the DB conversation ID
          const existingMessages = newConversations.get(conversationId) || [];
          
          // Merge and deduplicate
          const mergedMessages = [...existingMessages];
          formattedMessages.forEach(newMsg => {
            if (!mergedMessages.some(m => m.id === newMsg.id || 
                (m.message === newMsg.message && 
                 Math.abs(new Date(m.timestamp) - new Date(newMsg.timestamp)) < 1000))) {
              mergedMessages.push(newMsg);
            }
          });
          
          // Sort by timestamp
          mergedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          
          // Store using the DB conversation ID
          newConversations.set(conversationId, mergedMessages);
          logger.info('[CHAT_CONTEXT] Stored messages in Map with key:', conversationId, 'count:', mergedMessages.length);
          return newConversations;
        });
        
        logger.info('[CHAT_CONTEXT] Successfully loaded and merged messages from DB');
      } else {
        logger.info('[CHAT_CONTEXT] No messages found in DB for conversation:', conversationId);
      }
    } catch (error) {
      logger.error('[CHAT_CONTEXT] Error in loadMessagesFromDB:', error);
    }
  };

  const initializeChatService = async () => {
    try {
      setConnectionStatus('connecting');
      await activeChatService.initialize();
      
      if (currentUser) {
        const userId = currentUser.id || currentUser.uid;
        const localConvId = `conversation_${userId}`;
        setCurrentConversationId(localConvId);
        
        // Get or create actual conversation in DB
        let dbConversationId = null;
        if (activeChatService.getOrCreateConversation) {
          logger.info('[CHAT_CONTEXT] Calling getOrCreateConversation...');
          dbConversationId = await activeChatService.getOrCreateConversation(userId);
          logger.info('[CHAT_CONTEXT] Got conversation ID:', dbConversationId);
          setActualConversationId(dbConversationId);
          
          // Subscribe to real-time messages for this conversation
          if (dbConversationId) {
            subscribeToRealtimeMessages(dbConversationId);
            
            // Load existing messages from DB
            logger.info('[CHAT_CONTEXT] About to load messages from DB...');
            await loadMessagesFromDB(dbConversationId, dbConversationId); // Use DB ID for both params
          }
        } else {
          logger.warn('[CHAT_CONTEXT] getOrCreateConversation method not found in service');
        }
        
        // Load conversation history from local service
        await loadConversationHistory(userId);
        
        // Check human control status
        const humanControlStatus = await activeChatService.checkHumanControl(userId);
        setIsHumanControlled(humanControlStatus);
      }
      
      setConnectionStatus('connected');
      logger.info('[CHAT_CONTEXT] Chat service initialized successfully');
      
    } catch (error) {
      logger.error('[CHAT_CONTEXT] Failed to initialize chat service:', error);
      setConnectionStatus('disconnected');
    }
  };

  const loadConversationHistory = async (userId) => {
    try {      
      const result = await activeChatService.getConversationHistory(userId);
      
      if (result && result.success) {
        // Use DB conversation ID if available, otherwise use local ID
        const conversationId = actualConversationId || `conversation_${userId}`;
        const messages = result.messages || [];
        
        logger.info('[CHAT_CONTEXT] Loading conversation history with ID:', conversationId);
        
        setConversations(prev => {
          // Ensure prev is a Map
          const newConversations = prev instanceof Map ? new Map(prev) : new Map();
          
          // If we already have messages from DB, merge them
          const existingMessages = newConversations.get(conversationId) || [];
          if (existingMessages.length > 0) {
            logger.info('[CHAT_CONTEXT] Merging local history with existing DB messages');
            // Don't overwrite, just return existing
            return newConversations;
          }
          
          newConversations.set(conversationId, messages);
          return newConversations;
        });
        
        // Count unread messages (this is a simplified version)
        const unread = messages.filter(msg => 
          msg.sender !== 'user' && !msg.isRead
        ).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      logger.error('[CHAT_CONTEXT] Error loading conversation history:', error);
    }
  };

  const sendMessage = async (message) => {
    if (!currentUser || !message.trim()) return { success: false };

    const userId = currentUser.id || currentUser.uid;
    // Use DB conversation ID if available, otherwise use local ID
    const conversationId = actualConversationId || `conversation_${userId}`;
    
    logger.info('[CHAT_CONTEXT] Sending message with conversation ID:', conversationId);
    
    try {
      // Add user message immediately to UI (optimistic update)
      const userMessage = {
        id: `temp_${Date.now()}`,
        sender: 'user',
        message: message.trim(),
        timestamp: new Date().toISOString(),
        isTemporary: true
      };

      setConversations(prev => {
        const newConversations = new Map(prev);
        const currentMessages = newConversations.get(conversationId) || [];
        newConversations.set(conversationId, [...currentMessages, userMessage]);
        return newConversations;
      });

      // Process message through chat service
      const result = await activeChatService.processUserMessage(userId, message, userData);

      if (result.success) {
        // Update actual conversation ID if returned from service
        if (result.conversationId) {
          setActualConversationId(result.conversationId);
          
          // If conversation ID changed, subscribe to the new one
          if (result.conversationId !== actualConversationId) {
            logger.info('[CHAT_CONTEXT] New conversation ID received, subscribing to realtime');
            subscribeToRealtimeMessages(result.conversationId);
          }
        }
        
        // Just remove the temporary message
        // The real messages will come through the realtime subscription
        setConversations(prev => {
          const newConversations = new Map(prev);
          const currentMessages = newConversations.get(conversationId) || [];
          
          // Remove temporary message only
          const filteredMessages = currentMessages.filter(msg => !msg.isTemporary);
          newConversations.set(conversationId, filteredMessages);
          
          // If conversation ID changed, also update the new ID's messages
          if (result.conversationId && result.conversationId !== conversationId) {
            const existingMessages = newConversations.get(result.conversationId) || [];
            newConversations.set(result.conversationId, existingMessages);
          }
          
          return newConversations;
        });
        
        logger.info('[CHAT_CONTEXT] Message sent successfully, waiting for realtime updates');

        // Update human control status
        if (result.isHumanControlled !== undefined) {
          setIsHumanControlled(result.isHumanControlled);
        }

        return { success: true, response: result.response };
      } else {
        // Remove temporary message on error
        setConversations(prev => {
          const newConversations = new Map(prev);
          const currentMessages = newConversations.get(conversationId) || [];
          newConversations.set(conversationId, 
            currentMessages.filter(msg => !msg.isTemporary)
          );
          return newConversations;
        });

        return { success: false, error: result.error };
      }

    } catch (error) {
      logger.error('[CHAT_CONTEXT] Error sending message:', error);
      return { success: false, error: error.message };
    }
  };

  const subscribeToRealtimeMessages = (conversationId) => {
    try {
      logger.info('[CHAT_CONTEXT] Subscribing to realtime messages for:', conversationId);
      
      const subscription = supabase
        .channel(`messages-${conversationId}`)
        .on('postgres_changes', 
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => {
            logger.info('[CHAT_CONTEXT] New message received from realtime:', payload);
            
            // Process ALL message types for real-time updates
            if (payload.new) {
              const msg = payload.new;
              const newMessage = {
                id: msg.id,
                sender: msg.sender_type === 'user' ? 'user' : 
                        msg.sender_type === 'ai' ? 'flofy' : 
                        msg.sender_type === 'human' ? 'human' : 
                        msg.sender_type,
                message: msg.message,
                timestamp: msg.created_at,
                sender_name: msg.sender_name
              };
              
              logger.info('[CHAT_CONTEXT] Processing realtime message:', {
                id: newMessage.id,
                sender: newMessage.sender,
                preview: newMessage.message?.substring(0, 50)
              });
              
              // Add to conversation using DB conversation ID
              setConversations(prev => {
                const newConversations = new Map(prev);
                const currentMessages = newConversations.get(conversationId) || [];
                
                // Check if message already exists
                const exists = currentMessages.some(m => 
                  m.id === newMessage.id || 
                  (m.message === newMessage.message && 
                   m.sender === newMessage.sender &&
                   Math.abs(new Date(m.timestamp) - new Date(newMessage.timestamp)) < 1000)
                );
                
                if (!exists) {
                  logger.info('[CHAT_CONTEXT] Adding new realtime message to conversation');
                  newConversations.set(conversationId, [...currentMessages, newMessage]);
                } else {
                  logger.info('[CHAT_CONTEXT] Message already exists, skipping');
                }
                
                return newConversations;
              });
              
              // Update control status if message is from human
              if (msg.sender_type === 'human') {
                checkHumanControlStatus();
              }
            }
          }
        )
        .on('postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_conversations',
            filter: `id=eq.${conversationId}`
          },
          (payload) => {
            logger.info('[CHAT_CONTEXT] Conversation updated:', payload);
            
            // Update human control status
            if (payload.new && payload.new.is_human_controlled !== undefined) {
              setIsHumanControlled(payload.new.is_human_controlled);
            }
          }
        )
        .subscribe();
      
      setRealtimeSubscription(subscription);
      logger.info('[CHAT_CONTEXT] Realtime subscription established');
      
    } catch (error) {
      logger.error('[CHAT_CONTEXT] Error subscribing to realtime:', error);
    }
  };
  
  const checkHumanControlStatus = async () => {
    if (currentUser) {
      const userId = currentUser.id || currentUser.uid;
      const status = await activeChatService.checkHumanControl(userId);
      setIsHumanControlled(status);
    }
  };

  const toggleHumanControl = async () => {
    if (!currentUser) return { success: false };

    const userId = currentUser.id || currentUser.uid;
    const newControlStatus = !isHumanControlled;

    try {
      const result = await activeChatService.toggleHumanControl(userId, newControlStatus);
      
      if (result.success) {
        setIsHumanControlled(newControlStatus);
        
        // Add system message about control change
        const conversationId = `conversation_${userId}`;
        const systemMessage = {
          id: `sys_${Date.now()}`,
          sender: 'system',
          message: newControlStatus 
            ? 'Un asesor humano se ha unido a la conversación' 
            : 'Control devuelto a Flofy AI',
          timestamp: new Date().toISOString(),
          type: 'control_change'
        };

        setConversations(prev => {
          const newConversations = new Map(prev);
          const currentMessages = newConversations.get(conversationId) || [];
          newConversations.set(conversationId, [...currentMessages, systemMessage]);
          return newConversations;
        });
      }

      return result;
    } catch (error) {
      logger.error('[CHAT_CONTEXT] Error toggling human control:', error);
      return { success: false, error: error.message };
    }
  };

  const getCurrentMessages = () => {
    if (!currentConversationId) return [];
    return conversations.get(currentConversationId) || [];
  };

  const markMessagesAsRead = () => {
    setUnreadCount(0);
    // Here you could also update the database to mark messages as read
  };

  const addMessage = (message) => {
    if (!currentConversationId) return;

    setConversations(prev => {
      const newConversations = new Map(prev);
      const currentMessages = newConversations.get(currentConversationId) || [];
      newConversations.set(currentConversationId, [...currentMessages, message]);
      return newConversations;
    });

    // Increment unread count if message is not from user
    if (message.sender !== 'user') {
      setUnreadCount(prev => prev + 1);
    }
  };

  const clearConversation = () => {
    if (!currentConversationId) return;

    setConversations(prev => {
      const newConversations = new Map(prev);
      newConversations.set(currentConversationId, []);
      return newConversations;
    });
    setUnreadCount(0);
  };

  const value = {
    // State
    conversations, // Pass the full Map, not just current messages
    isHumanControlled,
    connectionStatus,
    unreadCount,
    currentConversationId: actualConversationId || currentConversationId, // Prefer DB ID
    
    // Actions
    sendMessage,
    toggleHumanControl,
    markMessagesAsRead,
    addMessage,
    clearConversation,
    loadConversationHistory: () => loadConversationHistory(currentUser?.id || currentUser?.uid),
    
    // Utils
    isConnected: connectionStatus === 'connected',
    isLoading: connectionStatus === 'connecting',
    getDBMessageId: (localId) => messageIdMap.get(localId) || localId // Helper to get DB ID
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;