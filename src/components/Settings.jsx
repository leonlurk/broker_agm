import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, X, Check, AlertCircle, Clock } from 'lucide-react';
import KYCVerification from './KYCVerification';
import { useAuth } from '../contexts/AuthContext';
import PaymentMethodSettings from './PaymentMethodSettings';
import kycService from '../services/kycService';
import { useTranslation } from 'react-i18next';
import emailServiceProxy from '../services/emailServiceProxy';
import toast from 'react-hot-toast';
import { AuthAdapter, DatabaseAdapter } from '../services/database.adapter';
import PasswordChangeModal from './PasswordChangeModal';
import TwoFactorDualModalImproved from './TwoFactorDualModalImproved';
import TwoFactorDisableModal from './TwoFactorDisableModal';
import EmailChangeModal from './EmailChangeModal';
import twoFactorService from '../services/twoFactorService';
import { FormLoader, KYCStatusLoader, useMinLoadingTime } from './WaveLoader';
import { SettingsLayoutLoader } from './ExactLayoutLoaders';

const Settings = ({ onBack, openKYC = false, fromHome = false }) => {
  const { t } = useTranslation('settings');
  const [expandedSection, setExpandedSection] = useState(null);
  const [showKYC, setShowKYC] = useState(openKYC);
  const [showPaymentSettings, setShowPaymentSettings] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [kycStatus, setKycStatus] = useState(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState(null);
  const [twoFactorMethod, setTwoFactorMethod] = useState(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  
  // Use minimum loading time of 2 seconds
  const showLoader = useMinLoadingTime(isLoadingSettings, 2000);
  
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
  
  // Check KYC and 2FA status
  useEffect(() => {
    const checkStatus = async () => {
      setIsLoadingSettings(true);
      try {
        if (currentUser?.uid || currentUser?.id) {
          const userId = currentUser.id || currentUser.uid;
        
        // Check KYC status - first in kyc_verifications
        const kycResult = await kycService.getKYCStatus(userId);
        console.log('[Settings] KYC status from kyc_verifications:', kycResult);
        
        // If not found in kyc_verifications, check profiles table
        if (kycResult.status === 'not_submitted') {
          try {
            const { data: userData } = await DatabaseAdapter.users.getById(userId);
            
            if (userData?.kyc_status && userData.kyc_status !== 'not_submitted') {
              console.log('[Settings] KYC status from profiles:', userData.kyc_status);
              setKycStatus({
                status: userData.kyc_status,
                details: {
                  submittedAt: userData.kyc_submitted || userData.created_at,
                  reviewedAt: userData.kyc_reviewed,
                  fromProfiles: true
                }
              });
              return;
            }
          } catch (error) {
            console.error('[Settings] Error checking profiles table:', error);
          }
        }
        
        setKycStatus(kycResult);
        
        // Check 2FA status
        const twoFAStatus = await twoFactorService.get2FAStatus(userId);
        setTwoFactorEnabled(twoFAStatus.enabled);
        
        // Get 2FA method if enabled
        if (twoFAStatus.enabled) {
          const methodResult = await twoFactorService.get2FAMethod(userId);
          setTwoFactorMethod(methodResult.method);
        }
      }
      } finally {
        setIsLoadingSettings(false);
      }
    };
    checkStatus();
    
    // Recheck when returning from KYC page
    if (!showKYC) {
      checkStatus();
    }
  }, [currentUser, showKYC]);

  const toggleSection = (section) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  const handleToggle2FA = async () => {
    if (!twoFactorEnabled) {
      // Go directly to 2FA setup modal (both methods will be configured)
      setShow2FAModal(true);
    } else {
      // Get user's 2FA data for verification modal
      const userId = currentUser.id || currentUser.uid;
      const twoFAStatus = await twoFactorService.get2FAStatus(userId);
      
      console.log('[Settings] 2FA Status for disable:', twoFAStatus);
      
      if (twoFAStatus.enabled) {
        // Prepare data for disable modal
        const userData = {
          userId: userId,
          email: currentUser.email,
          name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuario',
          secret: twoFAStatus.secret
        };
        
        console.log('[Settings] User data for disable modal:', {
          ...userData,
          secret: userData.secret ? '[REDACTED]' : 'null'
        });
        
        // Determine what methods the user has
        const methods = [];
        if (twoFAStatus.secret) methods.push('totp'); // Has app authentication
        if (twoFAStatus.enabled) methods.push('email'); // Assume email is always available
        
        userData.methods = methods;
        setTwoFactorData(userData);
        setShowDisable2FAModal(true);
      }
    }
  };

  const handleSelectMethod = (method) => {
    // This function is no longer needed for dual 2FA
    // Keeping it for compatibility but it won't be called
    setShow2FAMethodModal(false);
    setShow2FAModal(true);
  };

  const handle2FADisableSuccess = () => {
    setTwoFactorEnabled(false);
    setTwoFactorMethod(null);
    setTwoFactorData(null);
    setShowDisable2FAModal(false);
  };

  const handle2FASuccess = () => {
    setTwoFactorEnabled(true);
    setShow2FAModal(false);
    // Refresh 2FA method
    const checkMethod = async () => {
      const userId = currentUser.id || currentUser.uid;
      const methodResult = await twoFactorService.get2FAMethod(userId);
      setTwoFactorMethod(methodResult.method);
    };
    checkMethod();
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
    const requirements = validatePassword(newPassword);
    const allRequirementsMet = Object.values(requirements).every(req => req);
    
    if (!allRequirementsMet) {
      toast.error(t('modal.passwordRequirementsNotMet') || 'La nueva contraseña no cumple con todos los requisitos');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('modal.passwordMismatch'));
      return;
    }

    const toastId = toast.loading(t('modal.updatingPassword') || 'Actualizando contraseña...');

    try {
      // Actualizar la contraseña directamente (sin verificar la actual)
      const result = await AuthAdapter.updatePassword(currentUser.email, newPassword);

      if (result.success) {
        toast.success(t('modal.passwordUpdatedSuccess') || 'Contraseña actualizada correctamente', { id: toastId });
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


  if (showKYC) {
    return <KYCVerification 
      onBack={() => {
        setShowKYC(false);
        // Si vino desde Home, volver al Dashboard
        if (fromHome) {
          onBack();
        }
      }}
      fromHome={fromHome}
    />;
  }
  
  if (showPaymentSettings) {
    return <PaymentMethodSettings onBack={() => setShowPaymentSettings(false)} />;
  }

  // Show loader during initial loading
  if (showLoader) {
    return <SettingsLayoutLoader />;
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
                          {kycStatus.status === 'pending' ? t('kycStatus.pending') :
                           kycStatus.status === 'approved' ? t('kycStatus.approved') :
                           kycStatus.status === 'rejected' ? t('kycStatus.rejected') :
                           t('kycStatus.notSubmitted')}
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

        {/* Two-Factor Authentication */}
        <div className="border border-[#333] rounded-3xl bg-gradient-to-br from-[#232323] to-[#202020]">
          <div className="p-4 flex rounded-3xl bg-gradient-to-br from-[#232323] to-[#2d2d2d] justify-between items-center">
            <h2 className="text-lg md:text-xl">{t('notifications.twoFactorAuth')}</h2>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={twoFactorEnabled}
                onChange={handleToggle2FA}
              />
              <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-cyan-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all duration-300"></div>
            </label>
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

      <EmailChangeModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
      />

      {/* 2FA Dual Modal */}
      <TwoFactorDualModalImproved
        isOpen={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        onSuccess={handle2FASuccess}
      />

      {/* 2FA Disable Modal */}
      <TwoFactorDisableModal
        isOpen={showDisable2FAModal}
        onClose={() => setShowDisable2FAModal(false)}
        onSuccess={handle2FADisableSuccess}
        userMethods={twoFactorData}
      />
    </div>
  );
};

export default Settings;