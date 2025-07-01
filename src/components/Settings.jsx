import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import KYCVerification from './KYCVerification';
import { useAuth } from '../contexts/AuthContext';
import { sendPasswordReset, verifyEmailUpdate, reauthenticateUser } from '../firebase/auth';
import PaymentMethodSettings from './PaymentMethodSettings';

const Settings = ({ onBack }) => {
  const [expandedSection, setExpandedSection] = useState(null);
  const [showKYC, setShowKYC] = useState(false);
  const [showPaymentSettings, setShowPaymentSettings] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  
  const { currentUser } = useAuth();

  const toggleSection = (section) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };
  
  const handleChangePassword = async () => {
    if (!currentUser || !currentUser.email) {
      setFeedbackMessage('No se pudo encontrar el email del usuario.');
      return;
    }
    
    setFeedbackMessage('Enviando correo de restablecimiento...');
    const result = await sendPasswordReset(currentUser.email);
    
    if (result.success) {
      setFeedbackMessage('¡Correo de restablecimiento enviado! Revisa tu bandeja de entrada.');
    } else {
      setFeedbackMessage(`Error: ${result.error}`);
    }
  };

  const handleUpdateEmail = async () => {
    if (!currentUser) {
      setFeedbackMessage('Usuario no encontrado. Por favor, inicie sesión de nuevo.');
      return;
    }

    const newEmail = prompt("Por favor, ingresa tu nuevo correo electrónico:");
    if (!newEmail) return;

    if (!/\S+@\S+\.\S+/.test(newEmail)) {
      setFeedbackMessage('Error: Por favor, ingresa un formato de correo válido.');
      return;
    }
    
    const password = prompt("Por seguridad, por favor, ingresa tu contraseña actual:");
    if (!password) return;

    setFeedbackMessage('Re-autenticando...');
    const reauthResult = await reauthenticateUser(currentUser, password);

    if (!reauthResult.success) {
      setFeedbackMessage('Error: La contraseña es incorrecta o la autenticación falló.');
      return;
    }
    
    setFeedbackMessage('Enviando correo de verificación a la nueva dirección...');
    const result = await verifyEmailUpdate(currentUser, newEmail);

    if (result.success) {
      setFeedbackMessage(`¡Correo de verificación enviado a ${newEmail}! Revisa tu bandeja de entrada para confirmar el cambio.`);
    } else {
      setFeedbackMessage(`Error: ${result.error}`);
    }
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
      
      {/* Feedback Message */}
      {feedbackMessage && (
        <div className={`p-4 mb-4 rounded-lg text-center ${feedbackMessage.startsWith('Error') ? 'bg-red-500 bg-opacity-30 text-red-300' : 'bg-green-500 bg-opacity-30 text-green-300'}`}>
          {feedbackMessage}
        </div>
      )}
      
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
    </div>
  );
};

export default Settings;