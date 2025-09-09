import { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  const [updateVersion, setUpdateVersion] = useState(0); // Force re-renders on updates
  const previousUserIdRef = useRef(null);

  // Add visibility change handler to reconnect subscription
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && actualConversationId) {
        logger.info('[CHAT_CONTEXT] Page became visible, checking subscription');
        // Check if subscription is still alive, reconnect if needed
        if (!realtimeSubscription || realtimeSubscription._state === 'closed' || realtimeSubscription._state === 'CLOSED') {
          logger.info('[CHAT_CONTEXT] Subscription is closed, reconnecting...');
          subscribeToRealtimeMessages(actualConversationId);
        } else {
          // Even if subscription exists, fetch recent messages in case we missed any
          logger.info('[CHAT_CONTEXT] Fetching any missed messages on visibility change');
          fetchRecentMessages(actualConversationId);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also handle focus event as backup
    const handleFocus = () => {
      if (actualConversationId && (!realtimeSubscription || realtimeSubscription._state === 'closed' || realtimeSubscription._state === 'CLOSED')) {
        logger.info('[CHAT_CONTEXT] Window focused, reconnecting subscription');
        subscribeToRealtimeMessages(actualConversationId);
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [actualConversationId, realtimeSubscription]);

  // Periodic subscription health check
  useEffect(() => {
    if (!actualConversationId) return;

    const checkSubscriptionHealth = () => {
      if (realtimeSubscription) {
        const state = realtimeSubscription._state || realtimeSubscription.state;
        
        // Only log if there's an issue
        if (state === 'closed' || state === 'CLOSED' || state === 'error' || state === 'ERROR') {
          logger.info('[CHAT_CONTEXT] Subscription unhealthy, reconnecting...');
          subscribeToRealtimeMessages(actualConversationId);
        }
      } else if (actualConversationId) {
        // Only create subscription if we have a conversation ID
        logger.info('[CHAT_CONTEXT] No subscription found, creating...');
        subscribeToRealtimeMessages(actualConversationId);
      }
    };

    // Check every 30 seconds (less aggressive)
    const interval = setInterval(checkSubscriptionHealth, 30000);

    return () => clearInterval(interval);
  }, [actualConversationId]); // Remove realtimeSubscription from dependencies to avoid recreating interval

  // Initialize chat service when user is authenticated
  useEffect(() => {
    // Only initialize if user ID actually changed
    const currentUserId = currentUser?.id || currentUser?.uid;
    const previousUserId = previousUserIdRef.current;
    
    if (currentUserId && currentUserId !== previousUserId) {
      logger.info('[CHAT_CONTEXT] User ID changed, initializing chat service', {
        previousUserId,
        currentUserId
      });
      previousUserIdRef.current = currentUserId;
      initializeChatService();
    } else if (!currentUserId && previousUserId) {
      // User logged out
      logger.info('[CHAT_CONTEXT] User logged out, cleaning up');
      previousUserIdRef.current = null;
      if (realtimeSubscription) {
        realtimeSubscription.unsubscribe();
      }
      setConversations(new Map());
      setCurrentConversationId(null);
      setActualConversationId(null);
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
      const tempId = `user_temp_${Date.now()}`; // Use consistent format
      const userMessage = {
        id: tempId,
        sender: 'user',
        message: message.trim(),
        timestamp: new Date().toISOString(),
        isTemporary: true
      };

      setConversations(prev => {
        const newConversations = new Map(prev);
        const currentMessages = newConversations.get(conversationId) || [];
        newConversations.set(conversationId, [...currentMessages, userMessage]);
        setUpdateVersion(v => v + 1); // Force immediate re-render
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
        
        const targetConversationId = result.conversationId || actualConversationId || conversationId;
        
        // Don't remove the temporary message - keep it visible
        // The real message from DB will replace it when it arrives via WebSocket
        logger.info('[CHAT_CONTEXT] Message sent, keeping temporary message visible');
        
        // Update human control status
        if (result.isHumanControlled !== undefined) {
          setIsHumanControlled(result.isHumanControlled);
        }

        // Add a loading message for the bot response
        const loadingMessage = {
          id: `bot_loading_${Date.now()}`,
          sender: 'flofy',
          message: '...',
          timestamp: new Date().toISOString(),
          isLoading: true
        };
        
        setConversations(prev => {
          const newConversations = new Map(prev);
          
          // Keep the temp message and add loading indicator
          let currentMessages = newConversations.get(targetConversationId) || [];
          
          // If conversation ID changed, copy messages to new ID
          if (targetConversationId !== conversationId) {
            const oldMessages = newConversations.get(conversationId) || [];
            currentMessages = [...oldMessages];
            newConversations.set(targetConversationId, currentMessages);
          }
          
          // Add loading message
          newConversations.set(targetConversationId, [...currentMessages, loadingMessage]);
          setUpdateVersion(v => v + 1);
          return newConversations;
        });
        
        // Always fetch recent messages after a delay to ensure we get the response
        // This handles cases where WebSocket might miss the message
        setTimeout(() => {
          fetchRecentMessages(targetConversationId);
        }, 500); // 500ms delay for faster response

        return { success: true, response: result.response };
      } else {
        // Remove temporary message on error
        setConversations(prev => {
          const newConversations = new Map(prev);
          const currentMessages = newConversations.get(conversationId) || [];
          newConversations.set(conversationId, 
            currentMessages.filter(msg => msg.id !== tempId)
          );
          setUpdateVersion(v => v + 1);
          return newConversations;
        });

        return { success: false, error: result.error };
      }
    } catch (error) {
      logger.error('[CHAT_CONTEXT] Error sending message:', error);
      return { success: false, error: error.message };
    }
  };

  // Fetch recent messages that might have been missed
  const fetchRecentMessages = async (conversationId) => {
    try {
      // Get the timestamp from 10 seconds ago to fetch recent messages
      const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();
      
      logger.info('[CHAT_CONTEXT] Fetching recent messages from last 10 seconds');
      
      // Fetch messages from the last 10 seconds
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .gt('created_at', tenSecondsAgo)
        .order('created_at', { ascending: true });
      
      if (error) {
        logger.error('[CHAT_CONTEXT] Error fetching recent messages:', error);
        return;
      }
      
      if (data && data.length > 0) {
        logger.info('[CHAT_CONTEXT] Found', data.length, 'recent messages');
        
        // Process fetched messages
        const fetchedMessages = data.map(msg => ({
          id: msg.id,
          sender: msg.sender_type === 'user' ? 'user' : 
                  msg.sender_type === 'ai' ? 'flofy' : 
                  msg.sender_type === 'human' ? 'human' : 
                  msg.sender_type,
          message: msg.message,
          timestamp: msg.created_at,
          sender_name: msg.sender_name
        }));
        
        setConversations(prev => {
          const newConversations = new Map(prev);
          const currentMessages = newConversations.get(conversationId) || [];
          
          // Create a map of existing message IDs for quick lookup
          const existingIds = new Set(currentMessages.filter(m => !m.isTemporary && !m.isLoading).map(m => m.id));
          
          // Process each fetched message
          let updatedMessages = [...currentMessages];
          
          fetchedMessages.forEach(fetchedMsg => {
            // Skip if we already have this message (by ID)
            if (existingIds.has(fetchedMsg.id)) {
              return;
            }
            
            // Check if this should replace a temporary or loading message
            if (fetchedMsg.sender === 'user') {
              // Find and replace temporary user message (within 10 seconds for more tolerance)
              const tempIndex = updatedMessages.findIndex(m => {
                // More robust check for temporary messages
                const isTemp = m.isTemporary || (m.id && (m.id.startsWith('user_temp_') || m.id.startsWith('temp_')));
                const isSameUser = m.sender === 'user';
                const timeDiff = Math.abs(new Date(fetchedMsg.timestamp) - new Date(m.timestamp));
                const isRecent = timeDiff < 10000; // 10 seconds tolerance
                
                return isTemp && isSameUser && isRecent;
              });
              
              if (tempIndex !== -1) {
                // Replace temporary message with real one
                updatedMessages[tempIndex] = fetchedMsg;
                logger.info('[CHAT_CONTEXT] Replaced temporary user message with real message at index:', tempIndex);
              } else {
                // Add as new message
                updatedMessages.push(fetchedMsg);
              }
            } else if (fetchedMsg.sender === 'flofy' || fetchedMsg.sender === 'human') {
              // Find and replace loading message
              const loadingIndex = updatedMessages.findIndex(m => m.isLoading && m.sender === 'flofy');
              
              if (loadingIndex !== -1) {
                // Replace loading message with real response
                updatedMessages[loadingIndex] = fetchedMsg;
                logger.info('[CHAT_CONTEXT] Replaced loading message with real response');
              } else {
                // Add as new message
                updatedMessages.push(fetchedMsg);
              }
            } else {
              // Add any other message type
              updatedMessages.push(fetchedMsg);
            }
          });
          
          // Sort messages by timestamp to maintain order
          updatedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          
          // Create a completely new Map to ensure React detects the change
          const finalMap = new Map(newConversations);
          finalMap.set(conversationId, updatedMessages);
          setUpdateVersion(v => v + 1); // Force re-render
          return finalMap;
        });
      }
    } catch (error) {
      logger.error('[CHAT_CONTEXT] Exception fetching recent messages:', error);
    }
  };

  const subscribeToRealtimeMessages = (conversationId) => {
    try {
      logger.info('[CHAT_CONTEXT] Subscribing to realtime messages for:', conversationId);
      
      // Unsubscribe from previous subscription if exists
      if (realtimeSubscription) {
        logger.info('[CHAT_CONTEXT] Cleaning up previous subscription');
        realtimeSubscription.unsubscribe();
        setRealtimeSubscription(null);
      }
      
      // Use timestamp to ensure unique channel name
      const subscription = supabase
        .channel(`messages-${conversationId}-${Date.now()}`)
        .on('postgres_changes', 
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => {
            // Reduced logging - only log essential info
            
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
              
              // Log only when message is from human or ai for debugging
              if (msg.sender_type === 'human' || msg.sender_type === 'ai') {
                logger.info('[CHAT_CONTEXT] Realtime message:', msg.sender_type, newMessage.id);
              }
              
              // Add to conversation using DB conversation ID
              setConversations(prev => {
                const currentMessages = prev.get(conversationId) || [];
                
                // Check if message already exists
                const exists = currentMessages.some(m => 
                  m.id === newMessage.id
                );
                
                if (!exists) {
                  // Check if this is a message that might replace a temporary/loading one
                  let shouldReplaceTempMessage = false;
                  if (msg.sender_type === 'user') {
                    // Check if there's a recent temporary user message (within last 5 seconds)
                    const recentTempMessage = currentMessages.find(m => {
                      const isUserMessage = m.sender === 'user';
                      const isRecent = new Date(newMessage.timestamp) - new Date(m.timestamp) < 5000;
                      const hasUserPrefix = m.id && m.id.startsWith('user_');
                      return isUserMessage && isRecent && hasUserPrefix;
                    });
                    shouldReplaceTempMessage = !!recentTempMessage;
                  } else if (msg.sender_type === 'ai') {
                    // Check if there's a loading message from the bot
                    const loadingMessage = currentMessages.find(m => 
                      m.isLoading && m.sender === 'flofy'
                    );
                    shouldReplaceTempMessage = !!loadingMessage;
                  }
                  
                  // Create completely new Map
                  const newConversations = new Map();
                  for (const [key, value] of prev) {
                    if (key === conversationId) {
                      let updatedMessages;
                      if (shouldReplaceTempMessage) {
                        // Replace the temporary/loading message with the real one
                        updatedMessages = value.map(m => {
                          // Replace temporary user message
                          if (msg.sender_type === 'user' && m.id && m.id.startsWith('user_') && m.sender === 'user') {
                            const isRecent = new Date(newMessage.timestamp) - new Date(m.timestamp) < 5000;
                            if (isRecent) {
                              return newMessage; // Replace with real message
                            }
                          }
                          // Replace loading bot message
                          if (msg.sender_type === 'ai' && m.isLoading && m.sender === 'flofy') {
                            return newMessage; // Replace loading message with real response
                          }
                          return m;
                        });
                        // If no replacement happened, add as new
                        if (!updatedMessages.some(m => m.id === newMessage.id)) {
                          updatedMessages = [...updatedMessages, newMessage];
                        }
                      } else {
                        // Just add the new message
                        updatedMessages = [...value, newMessage];
                      }
                      newConversations.set(key, updatedMessages);
                    } else {
                      newConversations.set(key, value);
                    }
                  }
                  
                  // Handle case where conversation doesn't exist yet
                  if (!prev.has(conversationId)) {
                    newConversations.set(conversationId, [newMessage]);
                  }
                  
                  setUpdateVersion(v => v + 1); // Force re-render
                  return newConversations;
                } else {
                  // Message exists
                  return prev;
                }
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
            table: 'chat_messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => {
            // Message UPDATE received
            
            if (payload.new) {
              const msg = payload.new;
              const updatedMessage = {
                id: msg.id,
                sender: msg.sender_type === 'user' ? 'user' : 
                        msg.sender_type === 'ai' ? 'flofy' : 
                        msg.sender_type === 'human' ? 'human' : 
                        msg.sender_type,
                message: msg.message,
                timestamp: msg.created_at,
                sender_name: msg.sender_name
              };
              
              logger.info('[CHAT_CONTEXT] Message UPDATE:', updatedMessage.sender, updatedMessage.id);
              
              // Update existing message in conversation
              setConversations(prev => {
                const newConversations = new Map();
                
                // Copy all conversations to new Map
                for (const [key, value] of prev) {
                  if (key === conversationId) {
                    // Find and update the message for this conversation
                    const currentMessages = value || [];
                    const wasUpdated = currentMessages.some(m => m.id === updatedMessage.id);
                    
                    if (wasUpdated) {
                      // Message updated
                      const updatedMessages = currentMessages.map(m => 
                        m.id === updatedMessage.id ? updatedMessage : m
                      );
                      newConversations.set(key, updatedMessages);
                    } else {
                      // If message doesn't exist yet, add it
                      // Message added as new
                      newConversations.set(key, [...currentMessages, updatedMessage]);
                    }
                  } else {
                    newConversations.set(key, value);
                  }
                }
                
                // New Map created after UPDATE
                setUpdateVersion(v => v + 1); // Force re-render
                return newConversations;
              });
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
        .subscribe((status) => {
          logger.info('[CHAT_CONTEXT] Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            logger.info('[CHAT_CONTEXT] Successfully subscribed to realtime updates');
            // After reconnection, fetch any messages we might have missed
            fetchRecentMessages(conversationId);
          } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
            logger.error('[CHAT_CONTEXT] Channel error/closed - attempting to reconnect');
            // Retry subscription after a delay
            setTimeout(() => {
              if (conversationId === actualConversationId) { // Only reconnect if still the active conversation
                subscribeToRealtimeMessages(conversationId);
              }
            }, 1000); // Reduced delay for faster reconnection
          } else if (status === 'TIMED_OUT') {
            logger.error('[CHAT_CONTEXT] Subscription timed out - attempting to reconnect');
            setTimeout(() => {
              if (conversationId === actualConversationId) {
                subscribeToRealtimeMessages(conversationId);
              }
            }, 1000); // Reduced delay for faster reconnection
          }
        });
      
      setRealtimeSubscription(subscription);
      logger.info('[CHAT_CONTEXT] Realtime subscription initiated');
      
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
    updateVersion, // Include version to trigger re-renders
    
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