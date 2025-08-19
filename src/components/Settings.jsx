import React, { useState } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import KYCVerification from './KYCVerification';
import { useAuth } from '../contexts/AuthContext';
import PaymentMethodSettings from './PaymentMethodSettings';

const Settings = ({ onBack }) => {
  const [expandedSection, setExpandedSection] = useState(null);
  const [showKYC, setShowKYC] = useState(false);
  const [showPaymentSettings, setShowPaymentSettings] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  
  const { currentUser } = useAuth();

  const toggleSection = (section) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };
  
  const handleChangePassword = () => {
    setShowPasswordModal(true);
  };

  const handleUpdateEmail = () => {
    setShowEmailModal(true);
  };

  // Modal Component
  const Modal = ({ isOpen, onClose, title, message }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-2xl p-6 max-w-md w-full mx-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Content */}
          <div className="mb-6">
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              {message}
            </p>
            <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Correo de soporte:</p>
              <p className="text-cyan-400 font-medium">support@alphaglobalmarket.io</p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-[#0891b2] to-[#0c4a6e] text-white py-2.5 px-6 rounded-lg hover:opacity-90 transition-opacity"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (showKYC) {
    return <KYCVerification onBack={() => setShowKYC(false)} />;
  }
  
  if (showPaymentSettings) {
    return <PaymentMethodSettings onBack={() => setShowPaymentSettings(false)} />;
  }

  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#262626] text-white flex flex-col">
      {/* Header with back button */}
      <div className="mb-4">
        <img 
          src="/Back.svg" 
          alt="Back" 
          onClick={onBack}
          className="w-10 h-10 cursor-pointer hover:brightness-75 transition-all duration-300"
        />
      </div>
      
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold">Ajustes</h1>
      </div>
      
      {/* Main Settings Container with border */}
      <div className="border border-[#333] rounded-2xl bg-gradient-to-br from-[#232323] to-[#2d2d2d] p-4 md:p-6">
        {/* Settings Sections */}
        <div className="space-y-4">
        {/* Account Configuration */}
        <div className="border border-[#333] rounded-3xl bg-gradient-to-br from-[#232323] to-[#2d2d2d]">
          <div 
            className="p-4 flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection('account')}
          >
            <h2 className="text-lg md:text-xl">Configuracion de Cuenta</h2>
            <div className={`transition-transform duration-500 ease-in-out ${expandedSection === 'account' ? 'rotate-180' : ''}`}>
              <ChevronDown className="h-6 w-6 text-gray-400" />
            </div>
          </div>
          <div 
            className={`overflow-hidden transition-all duration-700 ease-in-out ${
              expandedSection === 'account' ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="px-4 pb-4 border-t border-[#333] pt-4">
              <div className="space-y-4">
                <div className="p-3 rounded-full bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] cursor-pointer" onClick={() => setShowKYC(true)}>
                  <div className="flex justify-between items-center">
                    <span>Verificacion KYC</span>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <div 
                  className="p-3 rounded-full bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] cursor-pointer"
                  onClick={handleChangePassword}
                >
                  <div className="flex justify-between items-center">
                    <span>Cambiar Contraseña</span>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <div 
                  className="p-3 rounded-full bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] cursor-pointer"
                  onClick={handleUpdateEmail}
                >
                  <div className="flex justify-between items-center">
                    <span>Actualizar Correo Electronico</span>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="border border-[#333] rounded-3xl bg-gradient-to-br from-[#232323] to-[#202020]">
          <div 
            className="p-4 flex rounded-3xl bg-gradient-to-br from-[#232323] to-[#2d2d2d] justify-between items-center cursor-pointer"
            onClick={() => toggleSection('notifications')}
          >
            <h2 className="text-lg md:text-xl">Notificaciones</h2>
            <div className={`transition-transform duration-500 ease-in-out ${expandedSection === 'notifications' ? 'rotate-180' : ''}`}>
              <ChevronDown className="h-6 w-6 text-gray-400" />
            </div>
          </div>
          <div 
            className={`overflow-hidden transition-all duration-700 ease-in-out ${
              expandedSection === 'notifications' ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="px-4 pb-4 border-t border-[#333] bg-gradient-to-br from-[#232323] to-[#2d2d2d] pt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Notificaciones Push</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-cyan-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all duration-300"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="border border-[#333] rounded-3xl bg-gradient-to-br from-[#232323] to-[#202020]">
          <div 
            className="p-4 flex  rounded-3xl justify-between items-center cursor-pointer bg-gradient-to-br from-[#232323] to-[#2d2d2d]"
            onClick={() => setShowPaymentSettings(true)}
          >
            <h2 className="text-lg md:text-xl">Método de pago</h2>
            <ChevronRight className="h-6 w-6 text-gray-400" />
          </div>
        </div>
        </div>
      </div>

      {/* Modales */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Cambiar Contraseña"
        message="Para cambiar tu contraseña, por favor contacta a nuestro equipo de soporte. Ellos te ayudarán de manera segura con este proceso."
      />

      <Modal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        title="Actualizar Correo Electrónico"
        message="Para actualizar tu correo electrónico, por favor contacta a nuestro equipo de soporte. Ellos verificarán tu identidad y procesarán el cambio de manera segura."
      />
    </div>
  );
};

export default Settings;