import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Shield, AlertTriangle, Mail, Smartphone } from 'lucide-react';
import twoFactorService from '../services/twoFactorService';
import { toast } from 'react-hot-toast';

const TwoFactorDisableModal = ({ isOpen, onClose, onSuccess, userMethods }) => {
  const { t } = useTranslation(['common', 'settings']);
  const [step, setStep] = useState('warning'); // 'warning' -> 'verify'
  const [loading, setLoading] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState(null);
  
  // Verification inputs
  const [totpCode, setTotpCode] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailCodeSent, setEmailCodeSent] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setStep('warning');
      setVerificationMethod(null);
      setTotpCode('');
      setEmailCode('');
      setEmailCodeSent(false);
    }
  }, [isOpen]);

  // Determine available verification methods
  const hasTotp = userMethods?.methods?.includes('totp') || userMethods?.methods?.includes('app');
  const hasEmail = userMethods?.methods?.includes('email');

  const handleContinueToVerification = () => {
    // If user has both methods, let them choose
    if (hasTotp && hasEmail) {
      setStep('verify');
      setVerificationMethod('choose');
    } else if (hasTotp) {
      setStep('verify');
      setVerificationMethod('totp');
    } else if (hasEmail) {
      setStep('verify');
      setVerificationMethod('email');
      sendEmailCode();
    }
  };

  const sendEmailCode = async () => {
    try {
      setLoading(true);
      const result = await twoFactorService.sendEmailCode(
        userMethods?.userId,
        userMethods?.email,
        userMethods?.name
      );
      
      if (result.success) {
        setEmailCodeSent(true);
        toast.success(t('twoFactor.emailCodeSent', { ns: 'settings' }));
      } else {
        toast.error(result.message || t('twoFactor.errors.emailFailed', { ns: 'settings' }));
      }
    } catch (error) {
      console.error('Error sending email code:', error);
      toast.error(t('twoFactor.errors.emailFailed', { ns: 'settings' }));
    } finally {
      setLoading(false);
    }
  };

  const selectVerificationMethod = (method) => {
    setVerificationMethod(method);
    if (method === 'email' && !emailCodeSent) {
      sendEmailCode();
    }
  };

  const handleVerifyAndDisable = async () => {
    if (!verificationMethod || verificationMethod === 'choose') {
      toast.error(t('twoFactor.errors.selectMethod', { ns: 'settings' }));
      return;
    }

    if (verificationMethod === 'totp' && totpCode.length !== 6) {
      toast.error(t('twoFactor.errors.invalidCode', { ns: 'settings' }));
      return;
    }

    if (verificationMethod === 'email' && emailCode.length !== 6) {
      toast.error(t('twoFactor.errors.invalidCode', { ns: 'settings' }));
      return;
    }

    try {
      setLoading(true);
      
      let verificationResult;
      
      if (verificationMethod === 'totp') {
        console.log('[TwoFactorDisableModal] TOTP verification:', {
          code: totpCode,
          hasSecret: !!userMethods?.secret,
          userId: userMethods?.userId
        });
        
        verificationResult = await twoFactorService.verifyToken(
          totpCode,
          userMethods?.secret,
          userMethods?.userId
        );
        
        console.log('[TwoFactorDisableModal] TOTP result:', verificationResult);
      } else if (verificationMethod === 'email') {
        verificationResult = await twoFactorService.verifyEmailCode(
          userMethods?.userId,
          emailCode
        );
        console.log('[TwoFactorDisableModal] Email result:', verificationResult);
      }

      console.log('[TwoFactorDisableModal] Final verification result:', verificationResult);

      // Handle both formats: boolean (TOTP) and object with success property (Email)
      const isVerified = typeof verificationResult === 'boolean' ? verificationResult : verificationResult.success;
      
      if (!isVerified) {
        const errorMessage = verificationResult.message || t('twoFactor.errors.incorrectCode', { ns: 'settings' });
        console.log('[TwoFactorDisableModal] Verification failed:', errorMessage);
        toast.error(errorMessage);
        return;
      }

      console.log('[TwoFactorDisableModal] Verification successful, calling disable2FA...');
      
      // If verification successful, disable 2FA
      const disableResult = await twoFactorService.disable2FA(userMethods?.userId);
      
      console.log('[TwoFactorDisableModal] Disable2FA result:', disableResult);
      
      if (disableResult.success) {
        toast.success(t('notifications.twoFactorDisabled', { ns: 'settings' }));
        onSuccess();
        onClose();
      } else {
        toast.error(t('twoFactor.errors.disableFailed', { ns: 'settings' }));
      }

    } catch (error) {
      console.error('Error verifying and disabling 2FA:', error);
      toast.error(t('twoFactor.errors.verifyFailed', { ns: 'settings' }));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Shield className="h-6 w-6 text-red-500" />
              <h2 className="text-xl font-semibold text-white">
                {t('twoFactor.disableTitle', { ns: 'settings' })}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {step === 'warning' && (
            <div className="space-y-6">
              <div className="flex items-start space-x-3 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-500 mt-1" />
                <div className="flex-1">
                  <h3 className="text-red-400 font-semibold mb-2">
                    {t('twoFactor.disableWarningTitle', { ns: 'settings' })}
                  </h3>
                  <p className="text-red-300 text-sm">
                    {t('twoFactor.disableWarningText', { ns: 'settings' })}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-gray-300 text-sm">
                  {t('twoFactor.disableVerificationRequired', { ns: 'settings' })}
                </p>
                
                <div className="space-y-2">
                  {hasTotp && (
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Smartphone className="h-4 w-4 text-blue-400" />
                      <span className="text-sm">{t('twoFactor.methods.app', { ns: 'settings' })}</span>
                    </div>
                  )}
                  {hasEmail && (
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Mail className="h-4 w-4 text-green-400" />
                      <span className="text-sm">{t('twoFactor.methods.email', { ns: 'settings' })}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleContinueToVerification}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  {t('twoFactor.continueDisable', { ns: 'settings' })}
                </button>
              </div>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-6">
              <p className="text-gray-300 text-sm">
                {t('twoFactor.verifyToDisable', { ns: 'settings' })}
              </p>

              {/* Method selection (if user has both) */}
              {verificationMethod === 'choose' && (
                <div className="space-y-3">
                  <p className="text-white font-medium">
                    {t('twoFactor.chooseVerificationMethod', { ns: 'settings' })}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => selectVerificationMethod('totp')}
                      className="p-3 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors text-left"
                    >
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-5 w-5 text-blue-400" />
                        <span className="text-white">{t('twoFactor.methods.app', { ns: 'settings' })}</span>
                      </div>
                    </button>
                    <button
                      onClick={() => selectVerificationMethod('email')}
                      className="p-3 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors text-left"
                    >
                      <div className="flex items-center space-x-2">
                        <Mail className="h-5 w-5 text-green-400" />
                        <span className="text-white">{t('twoFactor.methods.email', { ns: 'settings' })}</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* TOTP verification */}
              {verificationMethod === 'totp' && (
                <div className="space-y-3">
                  <label className="block text-white font-medium">
                    {t('twoFactor.enterAppCode', { ns: 'settings' })}
                  </label>
                  <input
                    type="text"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                    placeholder="000000"
                    maxLength="6"
                  />
                </div>
              )}

              {/* Email verification */}
              {verificationMethod === 'email' && (
                <div className="space-y-3">
                  {emailCodeSent && (
                    <div className="p-3 bg-green-900/30 border border-green-500/50 rounded-lg">
                      <p className="text-green-300 text-sm">
                        {t('twoFactor.emailCodeSent', { ns: 'settings' })}
                      </p>
                    </div>
                  )}
                  
                  <label className="block text-white font-medium">
                    {t('twoFactor.enterEmailCode', { ns: 'settings' })}
                  </label>
                  <input
                    type="text"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                    placeholder="000000"
                    maxLength="6"
                  />
                  
                  {emailCodeSent && (
                    <button
                      onClick={sendEmailCode}
                      disabled={loading}
                      className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                    >
                      {t('twoFactor.resendCode', { ns: 'settings' })}
                    </button>
                  )}
                </div>
              )}

              {/* Action buttons */}
              {verificationMethod && verificationMethod !== 'choose' && (
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setStep('warning')}
                    className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    {t('back')}
                  </button>
                  <button
                    onClick={handleVerifyAndDisable}
                    disabled={loading || 
                      (verificationMethod === 'totp' && totpCode.length !== 6) ||
                      (verificationMethod === 'email' && emailCode.length !== 6)
                    }
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? t('processing') : t('twoFactor.disableConfirm', { ns: 'settings' })}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TwoFactorDisableModal;