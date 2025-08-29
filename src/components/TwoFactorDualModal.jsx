import React, { useState, useEffect } from 'react';
import { X, Shield, Copy, Check, AlertCircle, Mail, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import twoFactorService from '../services/twoFactorService';
import toast from 'react-hot-toast';

const TwoFactorDualModal = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation('settings');
  const { currentUser, userData } = useAuth();
  const [step, setStep] = useState(1); // 1: Intro, 2: App Setup, 3: Verify App, 4: Email Info, 5: Backup Codes
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  useEffect(() => {
    if (isOpen && step === 2) {
      generateSecret();
    }
  }, [isOpen, step]);

  const generateSecret = async () => {
    if (!currentUser?.email) return;
    
    setLoading(true);
    try {
      const result = await twoFactorService.generateSecret(currentUser.email);
      setQrCode(result.qrCode);
      setSecret(result.secret);
      setBackupCodes(result.backupCodes);
    } catch (error) {
      console.error('Error generating 2FA secret:', error);
      toast.error(t('twoFactor.errors.generateFailed') || 'Error al generar el código 2FA');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast.error(t('twoFactor.errors.invalidCode') || 'Código inválido');
      return;
    }

    setLoading(true);
    try {
      // Verify the code
      const userId = currentUser.id || currentUser.uid;
      const isValid = await twoFactorService.verifyToken(verificationCode, secret, userId);
      
      if (!isValid) {
        toast.error(t('twoFactor.errors.incorrectCode') || 'Código incorrecto');
        setLoading(false);
        return;
      }

      // Move to email info step
      setStep(4);
      setVerificationCode('');
    } catch (error) {
      console.error('Error verifying 2FA code:', error);
      toast.error(t('twoFactor.errors.verifyFailed') || 'Error al verificar el código');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableDual2FA = async () => {
    setLoading(true);
    try {
      const userId = currentUser.id || currentUser.uid;
      
      // Enable both 2FA methods
      const result = await twoFactorService.enable2FA(userId, secret, backupCodes);
      
      if (result.success) {
        setStep(5); // Show backup codes
      } else {
        toast.error(t('twoFactor.errors.enableFailed') || 'Error al activar 2FA');
      }
    } catch (error) {
      console.error('Error enabling dual 2FA:', error);
      toast.error(t('twoFactor.errors.enableFailed') || 'Error al activar 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopiedCodes(true);
    toast.success(t('twoFactor.backupCodesCopied') || 'Códigos copiados');
    setTimeout(() => setCopiedCodes(false), 3000);
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    toast.success(t('twoFactor.secretCopied') || 'Código secreto copiado');
    setTimeout(() => setCopiedSecret(false), 3000);
  };

  const handleComplete = () => {
    toast.success(t('notifications.twoFactorEnabled') || '2FA activado correctamente');
    onSuccess && onSuccess();
    onClose();
    // Reset state
    setStep(1);
    setVerificationCode('');
  };

  const handleCloseModal = () => {
    if (step === 5) {
      // If we're on the backup codes step, warn the user
      if (!window.confirm(t('twoFactor.confirmCloseBackup') || '¿Has guardado los códigos de respaldo? No se mostrarán nuevamente.')) {
        return;
      }
    }
    onClose();
    setStep(1);
    setVerificationCode('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#232323] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#333] sticky top-0 bg-[#232323]">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-cyan-500" />
            <h2 className="text-xl font-semibold text-white">
              {t('twoFactor.title') || 'Configurar 2FA'}
            </h2>
          </div>
          <button
            onClick={handleCloseModal}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 mx-1 rounded-full transition-colors ${
                  s <= step ? 'bg-cyan-500' : 'bg-[#333]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Introduction */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {t('twoFactor.dualTitle') || 'Protección Doble para tu Cuenta'}
                </h3>
                <p className="text-gray-300 mb-6">
                  {t('twoFactor.dualDescription') || 'Configuraremos dos métodos de verificación para máxima seguridad:'}
                </p>
                
                <div className="space-y-3">
                  <div className="bg-[#1a1a1a] p-4 rounded-lg flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-cyan-500 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-white font-medium">
                        {t('twoFactor.appMethod') || 'Aplicación Autenticadora'}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {t('twoFactor.appDescription') || 'Google Authenticator, Authy, etc.'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-[#1a1a1a] p-4 rounded-lg flex items-center gap-3">
                    <Mail className="w-5 h-5 text-cyan-500 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-white font-medium">
                        {t('twoFactor.emailMethod') || 'Verificación por Email'}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {t('twoFactor.emailDescription') || 'Código adicional a tu correo'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
              >
                {t('twoFactor.startSetup') || 'Comenzar Configuración'}
              </button>
            </div>
          )}

          {/* Step 2: App QR Code */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {t('twoFactor.step1Title') || 'Paso 1: Configurar Aplicación'}
                </h3>
                <p className="text-gray-300 mb-6">
                  {t('twoFactor.scanQR')}
                </p>
                
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
                  </div>
                ) : (
                  <>
                    <div className="bg-white p-4 rounded-lg inline-block mb-4">
                      <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                    </div>
                    
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <p className="text-xs text-gray-400 mb-2">{t('twoFactor.manualEntry')}</p>
                      <div className="flex items-center justify-center gap-2">
                        <p className="font-mono text-sm text-white break-all">{secret}</p>
                        <button
                          onClick={handleCopySecret}
                          className="p-1.5 hover:bg-[#333] rounded transition-colors"
                        >
                          {copiedSecret ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setStep(3)}
                disabled={loading}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {t('twoFactor.next') || 'Siguiente'}
              </button>
            </div>
          )}

          {/* Step 3: Verify App Code */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 text-center">
                  {t('twoFactor.verifyAppTitle') || 'Verificar Aplicación'}
                </h3>
                <p className="text-gray-300 mb-6 text-center">
                  {t('twoFactor.enterCode')}
                </p>
                
                <div className="flex justify-center mb-6">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="text-center text-2xl font-mono w-40 px-4 py-3 bg-[#1a1a1a] border border-[#4b5563] rounded-lg text-white placeholder-[#6b7280] focus:border-cyan-500 focus:outline-none"
                    maxLength="6"
                  />
                </div>

                <div className="bg-[#1a1a1a] p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-400">
                    {t('twoFactor.codeHelp')}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 bg-[#333] hover:bg-[#444] text-white rounded-lg font-medium transition-colors"
                >
                  {t('twoFactor.back') || 'Atrás'}
                </button>
                <button
                  onClick={handleVerifyCode}
                  disabled={loading || verificationCode.length !== 6}
                  className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? t('twoFactor.verifying') : t('twoFactor.verify')}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Email Info */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                
                <h3 className="text-lg font-semibold text-white mb-4">
                  {t('twoFactor.appConfigured') || '¡Aplicación Configurada!'}
                </h3>
                
                <p className="text-gray-300 mb-6">
                  {t('twoFactor.emailSetupInfo') || 'Ahora configuraremos la verificación por email como segundo factor de seguridad.'}
                </p>
                
                <div className="bg-[#1a1a1a] p-4 rounded-lg">
                  <Mail className="w-8 h-8 text-cyan-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 mb-2">
                    {t('twoFactor.emailWillReceive') || 'Recibirás códigos de verificación en:'}
                  </p>
                  <p className="text-white font-medium">{currentUser?.email}</p>
                </div>
              </div>

              <button
                onClick={handleEnableDual2FA}
                disabled={loading}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? t('twoFactor.enabling') : t('twoFactor.continue')}
              </button>
            </div>
          )}

          {/* Step 5: Backup Codes */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {t('twoFactor.enabledSuccess')}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {t('twoFactor.dualEnabledInfo') || 'Ambos métodos de verificación están activos'}
                  </p>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-yellow-500 font-medium mb-1">
                        {t('twoFactor.backupCodesWarning')}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {t('twoFactor.backupCodesInfo')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-white font-medium">{t('twoFactor.backupCodes')}</p>
                    <button
                      onClick={handleCopyBackupCodes}
                      className="flex items-center gap-2 px-3 py-1.5 bg-[#333] hover:bg-[#444] text-white rounded transition-colors text-sm"
                    >
                      {copiedCodes ? (
                        <>
                          <Check className="w-4 h-4 text-green-500" />
                          <span>{t('twoFactor.copied')}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>{t('twoFactor.copy')}</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="font-mono text-sm text-gray-300 py-1">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleComplete}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                {t('twoFactor.complete') || 'Completar'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TwoFactorDualModal;