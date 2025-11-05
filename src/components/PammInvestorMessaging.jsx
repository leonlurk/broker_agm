import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Loader2, User } from 'lucide-react';
import { getFundMessages, sendMessage, markMessagesAsRead } from '../services/pammService';

const PammInvestorMessaging = ({ fundId, fundName, managerId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadMessages();
  }, [fundId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      
      // Verificar que tengamos los datos necesarios
      if (!fundId || !managerId) {
        console.warn('Missing fundId or managerId for messages');
        setMessages([]);
        setLoading(false);
        return;
      }
      
      // Cargar mensajes privados con el manager
      const response = await getFundMessages(fundId, 50, managerId);
      
      if (response.success) {
        setMessages(response.messages);
        
        // Marcar como leídos
        if (response.messages.length > 0) {
          await markMessagesAsRead(fundId, managerId);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      // No mostrar error al usuario, solo dejar vacío
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      // Enviar mensaje privado al manager
      const response = await sendMessage(fundId, newMessage.trim(), null, managerId);
      
      if (response.success) {
        setMessages(prev => [...prev, response.message]);
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

  return (
    <div className="bg-[#2a2a2a] rounded-xl flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-[#333] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="text-cyan-500" size={20} />
          <div>
            <h3 className="font-semibold">Chat con el Manager</h3>
            <p className="text-xs text-gray-400">{fundName}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="animate-spin text-cyan-500" size={32} />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <MessageCircle size={48} className="mb-3 opacity-50" />
            <p className="text-sm">No hay mensajes aún</p>
            <p className="text-xs mt-1">Inicia la conversación con el manager</p>
          </div>
        ) : (
          messages.map((msg) => (
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
            placeholder="Mensaje al manager..."
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
