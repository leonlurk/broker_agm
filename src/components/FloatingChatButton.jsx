import { useState, useEffect } from 'react';
import { MessageCircle, X, Minimize2, User, Bot, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import ChatWidget from './ChatWidget';

const FloatingChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const { currentUser, userData } = useAuth();
  const { unreadCount, connectionStatus } = useChat();

  // Animación de pulsación para nuevo mensaje
  useEffect(() => {
    if (hasNewMessage && !isOpen) {
      const timer = setTimeout(() => {
        setHasNewMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [hasNewMessage, isOpen]);

  const toggleChat = () => {
    if (isOpen) {
      setIsOpen(false);
      setIsMinimized(false);
    } else {
      setIsOpen(true);
    }
  };

  const minimizeChat = () => {
    setIsMinimized(true);
    setIsOpen(false);
  };

  const handleNewMessage = () => {
    if (!isOpen) {
      setHasNewMessage(true);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Chat Widget */}
        {isOpen && (
          <div className="mb-4">
            <ChatWidget 
              onClose={toggleChat}
              onMinimize={minimizeChat}
              onNewMessage={handleNewMessage}
            />
          </div>
        )}

        {/* Minimized Chat Indicator */}
        {isMinimized && (
          <div 
            onClick={() => setIsOpen(true)}
            className="mb-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full p-3 shadow-lg cursor-pointer hover:scale-105 transition-transform duration-200 border border-cyan-400/30"
          >
            <div className="flex items-center gap-2 text-white">
              <MessageCircle size={20} />
              <span className="text-sm font-medium">Chat minimizado</span>
            </div>
          </div>
        )}

        {/* Main FAB */}
        <button
          onClick={toggleChat}
          className={`
            group relative w-14 h-14 rounded-full shadow-lg transition-all duration-300 ease-out
            ${isOpen 
              ? 'bg-red-500 hover:bg-red-600 rotate-45' 
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:scale-110'
            }
            ${hasNewMessage ? 'animate-pulse' : ''}
          `}
        >
          {/* FAB Icon */}
          <div className="absolute inset-0 flex items-center justify-center text-white">
            {isOpen ? (
              <X size={24} className="transition-transform duration-200" />
            ) : (
              <MessageCircle size={24} className="transition-transform duration-200 group-hover:scale-110" />
            )}
          </div>

          {/* Unread Badge */}
          {unreadCount > 0 && !isOpen && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}

          {/* Ripple Effect */}
          <div className={`
            absolute inset-0 rounded-full transition-all duration-300
            ${isOpen 
              ? 'bg-red-400/20 scale-0' 
              : 'bg-cyan-400/20 scale-100 animate-ping'
            }
          `} />

          {/* Hover Tooltip */}
          {!isOpen && (
            <div className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
              {currentUser ? 'Abrir chat de soporte' : 'Iniciar conversación'}
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-900" />
            </div>
          )}
        </button>

        {/* Connection Status Indicator */}
        <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${
          connectionStatus === 'connected' 
            ? 'bg-green-500 animate-pulse' 
            : connectionStatus === 'connecting' 
            ? 'bg-yellow-500 animate-bounce' 
            : 'bg-red-500'
        }`} />
      </div>

      {/* Background Overlay when chat is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={toggleChat}
        />
      )}
    </>
  );
};

export default FloatingChatButton;