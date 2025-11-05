import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Loader2, Users, User } from 'lucide-react';
import { getFundMessages, sendMessage, markMessagesAsRead } from '../services/pammService';

const PammMessagingSystem = ({ fundId, userType = 'manager', investors = [] }) => {
  const [activeChat, setActiveChat] = useState('group'); // 'group' or investor_id
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadMessages(activeChat);
  }, [fundId, activeChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages[activeChat]]);

  const loadMessages = async (chatId) => {
    try {
      setLoading(true);
      const recipientId = chatId === 'group' ? null : chatId;
      const response = await getFundMessages(fundId, 50, recipientId);
      
      if (response.success) {
        setMessages(prev => ({
          ...prev,
          [chatId]: response.messages
        }));
        
        // Marcar como leídos
        if (response.messages.length > 0) {
          await markMessagesAsRead(fundId, recipientId);
        }
        
        // Actualizar contador de no leídos
        setUnreadCounts(prev => ({
          ...prev,
          [chatId]: 0
        }));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages(prev => ({
        ...prev,
        [chatId]: []
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const recipientId = activeChat === 'group' ? null : activeChat;
      const response = await sendMessage(fundId, newMessage.trim(), null, recipientId);
      
      if (response.success) {
        setMessages(prev => ({
          ...prev,
          [activeChat]: [...(prev[activeChat] || []), response.message]
        }));
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

  const currentMessages = messages[activeChat] || [];
  const activeInvestor = investors.find(inv => inv.id === activeChat);

  return (
    <div className="bg-[#2a2a2a] rounded-xl flex h-[600px]">
      {/* Sidebar - Lista de Chats */}
      <div className="w-64 border-r border-[#333] flex flex-col">
        <div className="p-4 border-b border-[#333]">
          <h3 className="font-semibold">Mensajes</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {/* Chat Grupal */}
          <button
            onClick={() => setActiveChat('group')}
            className={`w-full p-4 text-left hover:bg-[#333] transition-colors border-b border-[#333] ${
              activeChat === 'group' ? 'bg-[#333]' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <Users size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">Chat Grupal</p>
                <p className="text-xs text-gray-400">Todos los inversores</p>
              </div>
              {unreadCounts.group > 0 && (
                <span className="px-2 py-1 bg-cyan-500 text-white text-xs rounded-full">
                  {unreadCounts.group}
                </span>
              )}
            </div>
          </button>

          {/* Chats Privados */}
          {investors.map(investor => (
            <button
              key={investor.id}
              onClick={() => setActiveChat(investor.id)}
              className={`w-full p-4 text-left hover:bg-[#333] transition-colors border-b border-[#333] ${
                activeChat === investor.id ? 'bg-[#333]' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                {investor.avatar ? (
                  <img
                    src={investor.avatar}
                    alt={investor.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                    {investor.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{investor.name}</p>
                  <p className="text-xs text-gray-400">{investor.email}</p>
                </div>
                {unreadCounts[investor.id] > 0 && (
                  <span className="px-2 py-1 bg-purple-500 text-white text-xs rounded-full">
                    {unreadCounts[investor.id]}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#333] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {activeChat === 'group' ? (
              <>
                <Users className="text-cyan-500" size={20} />
                <div>
                  <h3 className="font-semibold">Chat Grupal</h3>
                  <p className="text-xs text-gray-400">
                    {investors.length} inversores
                  </p>
                </div>
              </>
            ) : (
              <>
                <User className="text-purple-500" size={20} />
                <div>
                  <h3 className="font-semibold">{activeInvestor?.name}</h3>
                  <p className="text-xs text-gray-400">Chat privado</p>
                </div>
              </>
            )}
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
              <p className="text-xs mt-1">Inicia la conversación</p>
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
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        msg.sender_type === 'manager' 
                          ? 'bg-cyan-500 bg-opacity-20 text-cyan-400' 
                          : 'bg-purple-500 bg-opacity-20 text-purple-400'
                      }`}>
                        {msg.sender_type === 'manager' ? 'Manager' : 'Inversor'}
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
              placeholder={
                activeChat === 'group' 
                  ? 'Mensaje al grupo...' 
                  : `Mensaje a ${activeInvestor?.name}...`
              }
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
    </div>
  );
};

export default PammMessagingSystem;
