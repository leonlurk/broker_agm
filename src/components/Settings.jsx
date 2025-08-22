import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, X, Check, AlertCircle, Clock } from 'lucide-react';
import KYCVerification from './KYCVerification';
import { useAuth } from '../contexts/AuthContext';
import PaymentMethodSettings from './PaymentMethodSettings';
import kycService from '../services/kycService';
import { useTranslation } from 'react-i18next';
import emailServiceProxy from '../services/emailServiceProxy';
import toast from 'react-hot-toast';
import { AuthAdapter } from '../services/database.adapter';
import PasswordChangeModal from './PasswordChangeModal';

const Settings = ({ onBack }) => {
  const { t } = useTranslation('settings');
  const [expandedSection, setExpandedSection] = useState(null);
  const [showKYC, setShowKYC] = useState(false);
  const [showPaymentSettings, setShowPaymentSettings] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [kycStatus, setKycStatus] = useState(null);
  
  // Estados para el cambio de contraseña
  const [passwordResetStep, setPasswordResetStep] = useState('initial'); // 'initial', 'code-sent', 'verified'
  const [verificationCode, setVerificationCode] = useState('');
  const [storedCode, setStoredCode] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { currentUser } = useAuth();
  
  // Check KYC status
  useEffect(() => {
    const checkKYCStatus = async () => {
      if (currentUser?.uid) {
        const status = await kycService.getKYCStatus(currentUser.id || currentUser.uid);
        setKycStatus(status);
      }
    };
    checkKYCStatus();
    
    // Recheck when returning from KYC page
    if (!showKYC) {
      checkKYCStatus();
    }
  }, [currentUser, showKYC]);

  const toggleSection = (section) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };
  
  const handleChangePassword = () => {
    setShowPasswordModal(true);
    setPasswordResetStep('initial');
    setVerificationCode('');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSendPasswordResetEmail = async () => {
    if (!currentUser?.email) {
      toast.error('No se pudo obtener tu email');
      return;
    }

    const toastId = toast.loading('Enviando email de restablecimiento...');
    
    try {
      // Generar un código de 6 dígitos
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Guardar el código en el estado y localStorage
      setStoredCode(resetCode);
      localStorage.setItem('passwordResetCode', JSON.stringify({
        code: resetCode,
        email: currentUser.email,
        timestamp: Date.now(),
        expiresIn: 3600000 // 1 hora
      }));

      // Enviar el email a través del backend
      const result = await emailServiceProxy.sendPasswordResetEmail(
        { email: currentUser.email, name: currentUser.displayName || currentUser.username || 'Usuario' },
        resetCode
      );

      if (result.success) {
        toast.success('Email enviado correctamente. Revisa tu bandeja de entrada.', { id: toastId });
        setPasswordResetStep('code-sent');
      } else {
        toast.error('Error al enviar el email. Intenta nuevamente.', { id: toastId });
      }
    } catch (error) {
      console.error('Error sending password reset email:', error);
      toast.error('Error al enviar el email. Intenta nuevamente.', { id: toastId });
    }
  };

  const handleVerifyCode = () => {
    if (verificationCode === storedCode) {
      toast.success('Código verificado correctamente');
      setPasswordResetStep('verified');
    } else {
      toast.error('Código incorrecto. Verifica e intenta nuevamente.');
    }
  };

  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password)
    };
    return requirements;
  };

  const handlePasswordChange = async () => {
    // Validaciones
    if (!oldPassword) {
      toast.error('Debes ingresar tu contraseña actual');
      return;
    }

    const requirements = validatePassword(newPassword);
    const allRequirementsMet = Object.values(requirements).every(req => req);
    
    if (!allRequirementsMet) {
      toast.error('La nueva contraseña no cumple con todos los requisitos');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (oldPassword === newPassword) {
      toast.error('La nueva contraseña debe ser diferente a la actual');
      return;
    }

    const toastId = toast.loading('Actualizando contraseña...');

    try {
      // Primero verificar la contraseña actual
      const verifyResult = await AuthAdapter.verifyPassword(currentUser.email, oldPassword);
      
      if (!verifyResult.success) {
        toast.error('La contraseña actual es incorrecta', { id: toastId });
        return;
      }

      // Actualizar la contraseña
      const result = await AuthAdapter.updatePassword(currentUser.email, newPassword);

      if (result.success) {
        toast.success('Contraseña actualizada correctamente', { id: toastId });
        setShowPasswordModal(false);
        // Limpiar todos los campos
        setPasswordResetStep('initial');
        setVerificationCode('');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        localStorage.removeItem('passwordResetCode');
      } else {
        toast.error(result.error || 'Error al actualizar la contraseña', { id: toastId });
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Error al actualizar la contraseña', { id: toastId });
    }
  };

  const handleUpdateEmail = () => {
    setShowEmailModal(true);
  };

  // Modal Component para otros usos
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
              <p className="text-xs text-gray-400 mb-1">{t('modal.supportEmail')}</p>
              <p className="text-cyan-400 font-medium">support@alphaglobalmarket.io</p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-[#0891b2] to-[#0c4a6e] text-white py-2.5 px-6 rounded-lg hover:opacity-90 transition-opacity"
            >
              {t('modal.close')}
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
        <h1 className="text-2xl md:text-3xl font-semibold">{t('mainSettings.title')}</h1>
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
            <h2 className="text-lg md:text-xl">{t('mainSettings.accountConfig')}</h2>
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
                    <div className="flex items-center gap-3">
                      <span>{t('mainSettings.kycVerification')}</span>
                      {/* KYC Status Indicator */}
                      {kycStatus && (
                        <span className={`
                          px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1
                          ${kycStatus.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                            kycStatus.status === 'approved' ? 'bg-green-500/20 text-green-500' :
                            kycStatus.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                            'bg-gray-500/20 text-gray-400'}
                        `}>
                          {kycStatus.status === 'pending' && <Clock size={12} />}
                          {kycStatus.status === 'approved' && <Check size={12} />}
                          {kycStatus.status === 'rejected' && <AlertCircle size={12} />}
                          {kycStatus.status === 'pending' ? 'En Proceso' :
                           kycStatus.status === 'approved' ? 'Aprobado' :
                           kycStatus.status === 'rejected' ? 'Rechazado' :
                           'No Enviado'}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <div 
                  className="p-3 rounded-full bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] cursor-pointer"
                  onClick={handleChangePassword}
                >
                  <div className="flex justify-between items-center">
                    <span>{t('mainSettings.changePassword')}</span>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <div 
                  className="p-3 rounded-full bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] cursor-pointer"
                  onClick={handleUpdateEmail}
                >
                  <div className="flex justify-between items-center">
                    <span>{t('mainSettings.updateEmail')}</span>
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
            <h2 className="text-lg md:text-xl">{t('notifications.title')}</h2>
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
            <h2 className="text-lg md:text-xl">{t('mainSettings.paymentMethods')}</h2>
            <ChevronRight className="h-6 w-6 text-gray-400" />
          </div>
        </div>
        </div>
      </div>

      {/* Modales */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordResetStep('initial');
          setVerificationCode('');
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }}
        passwordResetStep={passwordResetStep}
        verificationCode={verificationCode}
        setVerificationCode={setVerificationCode}
        oldPassword={oldPassword}
        setOldPassword={setOldPassword}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        showOldPassword={showOldPassword}
        setShowOldPassword={setShowOldPassword}
        showNewPassword={showNewPassword}
        setShowNewPassword={setShowNewPassword}
        showConfirmPassword={showConfirmPassword}
        setShowConfirmPassword={setShowConfirmPassword}
        handleSendPasswordResetEmail={handleSendPasswordResetEmail}
        handleVerifyCode={handleVerifyCode}
        handlePasswordChange={handlePasswordChange}
        validatePassword={validatePassword}
      />

      <Modal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        title={t('modal.updateEmailTitle')}
        message={t('modal.updateEmailMessage')}
      />
    </div>
  );
};

export default Settings;