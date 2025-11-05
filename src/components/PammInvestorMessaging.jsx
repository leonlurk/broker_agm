import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Loader2, User, Users } from 'lucide-react';
import { getFundMessages, sendMessage, markMessagesAsRead, getUnreadCount } from '../services/pammService';

const PammInvestorMessaging = ({ fundId, fundName, managerId }) => {
  const [activeTab, setActiveTab] = useState('group'); // 'group' o 'private'
  const [groupMessages, setGroupMessages] = useState([]);
  const [privateMessages, setPrivateMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({ group: 0, private: { manager: 0 } });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadMessages();
    loadUnreadCounts();
  }, [fundId, activeTab]);

  useEffect(() => {
    scrollToBottom();
  }, [groupMessages, privateMessages]);

  const loadUnreadCounts = async () => {
    try {
      if (!fundId) return;
      const response = await getUnreadCount(fundId);
      if (response.success) {
        setUnreadCounts(response.counts);
      }
    } catch (error) {
      console.error('Error loading unread counts:', error);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      
      if (!fundId) {
        console.warn('Missing fundId for messages');
        setLoading(false);
        return;
      }
      
      if (activeTab === 'group') {
        // Cargar mensajes grupales (sin recipient_id)
        const response = await getFundMessages(fundId, 50);
        if (response.success) {
          setGroupMessages(response.messages);
        }
      } else {
        // Cargar mensajes privados con el manager
        if (!managerId) {
          console.warn('Missing managerId for private messages');
          setLoading(false);
          return;
        }
        
        const response = await getFundMessages(fundId, 50, managerId);
        if (response.success) {
          setPrivateMessages(response.messages);
          
          // Marcar como leídos
          if (response.messages.length > 0) {
            await markMessagesAsRead(fundId);
            // Actualizar contadores
            loadUnreadCounts();
          }
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const recipientId = activeTab === 'private' ? managerId : null;
      const response = await sendMessage(fundId, newMessage.trim(), null, recipientId);
      
      if (response.success) {
        if (activeTab === 'group') {
          setGroupMessages(prev => [...prev, response.message]);
        } else {
          setPrivateMessages(prev => [...prev, response.message]);
        }
        setNewMessage('');
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error al enviar mensaje');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const currentMessages = activeTab === 'group' ? groupMessages : privateMessages;

  return (
    <div className="bg-[#2a2a2a] rounded-xl flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-[#333]">
        <div className="flex items-center gap-3 mb-3">
          <MessageCircle className="text-cyan-500" size={20} />
          <div>
            <h3 className="font-semibold">Mensajes del Fondo</h3>
            <p className="text-xs text-gray-400">{fundName}</p>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('group')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors relative ${
              activeTab === 'group'
                ? 'bg-cyan-600 text-white'
                : 'bg-[#333] text-gray-400 hover:bg-[#3a3a3a]'
            }`}
          >
            <Users size={16} />
            <span className="text-sm">Chat Grupal</span>
            {unreadCounts.group > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                {unreadCounts.group}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('private')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors relative ${
              activeTab === 'private'
                ? 'bg-cyan-600 text-white'
                : 'bg-[#333] text-gray-400 hover:bg-[#3a3a3a]'
            }`}
          >
            <User size={16} />
            <span className="text-sm">Chat Privado</span>
            {unreadCounts.private?.manager > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                {unreadCounts.private.manager}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="animate-spin text-cyan-500" size={32} />
          </div>
        ) : currentMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <MessageCircle size={48} className="mb-3 opacity-50" />
            <p className="text-sm">No hay mensajes aún</p>
            <p className="text-xs mt-1">
              {activeTab === 'group' 
                ? 'Los mensajes grupales aparecerán aquí' 
                : 'Inicia la conversación con el manager'}
            </p>
          </div>
        ) : (
          currentMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.is_own ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${msg.is_own ? 'order-2' : 'order-1'}`}>
                {!msg.is_own && (
                  <div className="flex items-center gap-2 mb-1">
                    {msg.sender_avatar ? (
                      <img
                        src={msg.sender_avatar}
                        alt={msg.sender_name}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-xs">
                        {msg.sender_name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs text-gray-400">{msg.sender_name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500 bg-opacity-20 text-cyan-400">
                      Manager
                    </span>
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl ${
                    msg.is_own
                      ? 'bg-cyan-600 text-white rounded-br-sm'
                      : 'bg-[#333] text-white rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                  <p className={`text-xs mt-1 ${
                    msg.is_own ? 'text-cyan-200' : 'text-gray-400'
                  }`}>
                    {msg.time_ago}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-[#333]">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={activeTab === 'group' ? 'Mensaje al grupo...' : 'Mensaje al manager...'}
            className="flex-1 bg-[#333] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
          >
            {sending ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Presiona Enter para enviar, Shift+Enter para nueva línea
        </p>
      </form>
    </div>
  );
};

export default PammInvestorMessaging;
