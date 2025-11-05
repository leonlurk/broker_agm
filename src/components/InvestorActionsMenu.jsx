import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, MessageCircle, DollarSign, UserX, Mail, TrendingUp, FileText } from 'lucide-react';

const InvestorActionsMenu = ({ investor, onSendMessage, onViewDetails, onRequestWithdrawal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const actions = [
    {
      icon: MessageCircle,
      label: 'Enviar mensaje',
      onClick: () => {
        onSendMessage(investor);
        setIsOpen(false);
      },
      color: 'text-cyan-400'
    },
    {
      icon: FileText,
      label: 'Ver detalles',
      onClick: () => {
        onViewDetails(investor);
        setIsOpen(false);
      },
      color: 'text-blue-400'
    },
    {
      icon: TrendingUp,
      label: 'Ver rendimiento',
      onClick: () => {
        onViewDetails(investor);
        setIsOpen(false);
      },
      color: 'text-green-400'
    },
    {
      icon: DollarSign,
      label: 'Solicitar retiro',
      onClick: () => {
        onRequestWithdrawal(investor);
        setIsOpen(false);
      },
      color: 'text-yellow-400'
    },
    {
      icon: Mail,
      label: 'Enviar email',
      onClick: () => {
        window.location.href = `mailto:${investor.email}`;
        setIsOpen(false);
      },
      color: 'text-purple-400'
    }
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:bg-[#444] rounded transition-colors"
      >
        <MoreHorizontal size={16} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl z-50">
          <div className="py-1">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.onClick}
                  className="w-full px-4 py-2 text-left hover:bg-[#2a2a2a] transition-colors flex items-center gap-3"
                >
                  <Icon size={16} className={action.color} />
                  <span className="text-sm">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestorActionsMenu;
