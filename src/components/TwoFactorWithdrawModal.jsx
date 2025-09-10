import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Shield, AlertTriangle, Mail, Smartphone } from 'lucide-react';
import twoFactorService from '../services/twoFactorService';
import { toast } from 'react-hot-toast';

const TwoFactorWithdrawModal = ({ isOpen, onClose, onSuccess, userMethods, withdrawAmount }) => {
  const { t } = useTranslation(['wallet', 'settings']);
  const [step, setStep] = useState('confirm'); // 'confirm' -> 'verify'
  const [loading, setLoading] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState(null);
  
  // Verification inputs
  const [totpCode, setTotpCode] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailCodeSent, setEmailCodeSent] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setStep('confirm');
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

  const handleVerifyAndConfirm = async () => {
    if (!verificationMethod || verificationMethod === 'choose') {
      toast.error(t('withdraw.twoFactor.selectMethod'));
      return;
    }

    if (verificationMethod === 'totp' && totpCode.length !== 6) {
      toast.error(t('withdraw.twoFactor.invalidCode'));
      return;
    }

    if (verificationMethod === 'email' && emailCode.length !== 6) {
      toast.error(t('withdraw.twoFactor.invalidCode'));
      return;
    }

    try {
      setLoading(true);
      
      let verificationResult;
      
      if (verificationMethod === 'totp') {
        // Usar exactamente el mismo método que Settings (que funciona)
        // IMPORTANTE: El orden de parámetros es: token, secret, userId
        verificationResult = await twoFactorService.verifyToken(
          totpCode,
          userMethods?.secret,
          userMethods?.userId
        );
      } else if (verificationMethod === 'email') {
        verificationResult = await twoFactorService.verifyEmailCode(
          userMethods?.userId,
          emailCode
        );
      }

      if (verificationResult) {
        toast.success(t('withdraw.twoFactor.verified'));
        onSuccess();
      } else {
        toast.error(t('withdraw.twoFactor.incorrectCode'));
      }
    } catch (error) {
      console.error('[TwoFactorWithdrawModal] Verification error:', error);
      toast.error(t('withdraw.twoFactor.verificationError'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-[#1a1a1a] rounded-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-cyan-500" />
            <h2 className="text-xl font-semibold text-white">
              {t('withdraw.twoFactor.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {step === 'confirm' && (
            <div className="space-y-6">
              {/* Withdrawal Info */}
              <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-yellow-400 font-semibold mb-2">
                      {t('withdraw.twoFactor.confirmTitle')}
                    </p>
                    <p className="text-yellow-300 text-sm mb-3">
                      {t('withdraw.twoFactor.confirmMessage', { amount: withdrawAmount })}
                    </p>
                    <ul className="text-yellow-200 text-xs space-y-1">
                      <li>• {t('withdraw.twoFactor.warning1')}</li>
                      <li>• {t('withdraw.twoFactor.warning2')}</li>
                      <li>• {t('withdraw.twoFactor.warning3')}</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {t('common:cancel')}
                </button>
                <button
                  onClick={handleContinueToVerification}
                  className="flex-1 px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
                >
                  {t('withdraw.twoFactor.continue')}
                </button>
              </div>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-6">
              <p className="text-gray-300 text-sm">
                {t('withdraw.twoFactor.verifyMessage')}
              </p>

              {/* Method Selection (if user has both) */}
              {verificationMethod === 'choose' && (
                <div className="space-y-3">
                  <p className="text-white font-semibold">
                    {t('withdraw.twoFactor.selectVerificationMethod')}
                  </p>
                  <button
                    onClick={() => selectVerificationMethod('totp')}
                    className="w-full flex items-center gap-3 p-4 bg-[#2a2a2a] hover:bg-[#333] rounded-lg transition-colors text-left"
                  >
                    <Smartphone className="w-5 h-5 text-cyan-500" />
                    <div>
                      <p className="text-white font-medium">
                        {t('twoFactor.methods.authenticator', { ns: 'settings' })}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {t('twoFactor.methods.authenticatorDesc', { ns: 'settings' })}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => selectVerificationMethod('email')}
                    className="w-full flex items-center gap-3 p-4 bg-[#2a2a2a] hover:bg-[#333] rounded-lg transition-colors text-left"
                  >
                    <Mail className="w-5 h-5 text-cyan-500" />
                    <div>
                      <p className="text-white font-medium">
                        {t('twoFactor.methods.email', { ns: 'settings' })}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {t('twoFactor.methods.emailDesc', { ns: 'settings' })}
                      </p>
                    </div>
                  </button>
                </div>
              )}

              {/* TOTP Verification */}
              {verificationMethod === 'totp' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Smartphone className="w-5 h-5 text-cyan-500" />
                    <p className="text-white font-medium">
                      {t('twoFactor.enterAuthCode', { ns: 'settings' })}
                    </p>
                  </div>
                  <input
                    type="text"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white text-center text-xl tracking-widest focus:outline-none focus:border-cyan-500"
                    autoFocus
                  />
                  <p className="text-gray-400 text-xs text-center">
                    {t('twoFactor.authCodeHelp', { ns: 'settings' })}
                  </p>
                </div>
              )}

              {/* Email Verification */}
              {verificationMethod === 'email' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Mail className="w-5 h-5 text-cyan-500" />
                    <p className="text-white font-medium">
                      {t('twoFactor.enterEmailCode', { ns: 'settings' })}
                    </p>
                  </div>
                  {emailCodeSent && (
                    <div className="bg-green-900/20 border border-green-800 rounded-lg p-3 mb-4">
                      <p className="text-green-400 text-sm">
                        {t('twoFactor.emailSent', { ns: 'settings', email: userMethods?.email })}
                      </p>
                    </div>
                  )}
                  <input
                    type="text"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white text-center text-xl tracking-widest focus:outline-none focus:border-cyan-500"
                    autoFocus
                  />
                  <button
                    onClick={sendEmailCode}
                    disabled={loading}
                    className="w-full text-cyan-500 hover:text-cyan-400 text-sm transition-colors"
                  >
                    {t('twoFactor.resendCode', { ns: 'settings' })}
                  </button>
                </div>
              )}

              {/* Verify Actions */}
              {verificationMethod && verificationMethod !== 'choose' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setVerificationMethod('choose');
                      setTotpCode('');
                      setEmailCode('');
                    }}
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {t('common:back')}
                  </button>
                  <button
                    onClick={handleVerifyAndConfirm}
                    disabled={loading || (verificationMethod === 'totp' ? totpCode.length !== 6 : emailCode.length !== 6)}
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        {t('common:processing')}
                      </>
                    ) : (
                      t('withdraw.twoFactor.confirmWithdraw')
                    )}
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

export default TwoFactorWithdrawModal;