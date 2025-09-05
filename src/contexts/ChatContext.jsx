import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
// Usar el servicio mejorado si está disponible, si no usar el original
import enhancedChatService from '../services/enhancedChatService';
import chatService from '../services/chatService';
import { logger } from '../utils/logger';

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
  const [isHumanControlled, setIsHumanControlled] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize chat service when user is authenticated
  useEffect(() => {
    if (currentUser) {
      initializeChatService();
    }
  }, [currentUser]);

  const initializeChatService = async () => {
    try {
      setConnectionStatus('connecting');
      await activeChatService.initialize();
      
      if (currentUser) {
        const userId = currentUser.id || currentUser.uid;
        setCurrentConversationId(`conversation_${userId}`);
        
        // Load conversation history
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
      
      if (result.success) {
        const conversationId = `conversation_${userId}`;
        setConversations(prev => {
          const newConversations = new Map(prev);
          newConversations.set(conversationId, result.messages);
          return newConversations;
        });
        
        // Count unread messages (this is a simplified version)
        const unread = result.messages.filter(msg => 
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
    const conversationId = `conversation_${userId}`;
    
    try {
      // Add user message immediately to UI
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
        // Update conversation with real message IDs and AI response
        setConversations(prev => {
          const newConversations = new Map(prev);
          let currentMessages = newConversations.get(conversationId) || [];
          
          // Remove temporary message and add real messages
          currentMessages = currentMessages.filter(msg => !msg.isTemporary);
          
          // Add user message
          const realUserMessage = {
            id: `msg_${Date.now()}_user`,
            sender: 'user',
            message: message.trim(),
            timestamp: new Date().toISOString()
          };
          currentMessages.push(realUserMessage);

          // Add AI response if available
          if (result.response && !result.isHumanControlled) {
            const aiMessage = {
              id: `msg_${Date.now()}_ai`,
              sender: 'flofy',
              message: result.response,
              timestamp: new Date().toISOString()
            };
            currentMessages.push(aiMessage);
          }

          newConversations.set(conversationId, currentMessages);
          return newConversations;
        });

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
    conversations: getCurrentMessages(),
    isHumanControlled,
    connectionStatus,
    unreadCount,
    currentConversationId,
    
    // Actions
    sendMessage,
    toggleHumanControl,
    markMessagesAsRead,
    addMessage,
    clearConversation,
    loadConversationHistory: () => loadConversationHistory(currentUser?.id || currentUser?.uid),
    
    // Utils
    isConnected: connectionStatus === 'connected',
    isLoading: connectionStatus === 'connecting'
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;