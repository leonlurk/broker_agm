import React, { useState, useEffect } from 'react';
import { X, Mail, Shield, Check, Loader, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import twoFactorService from '../services/twoFactorService';
import toast from 'react-hot-toast';

const TwoFactorEmailModal = ({ isOpen, onClose, onSuccess, isSetup = false }) => {
  const { t } = useTranslation('settings');
  const { currentUser, userData } = useAuth();
  const [step, setStep] = useState(1); // 1: Send Code, 2: Verify Code
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (isOpen && step === 1 && !isSetup) {
      // If it's for login verification, auto-send the code
      handleSendCode();
    }
  }, [isOpen]);

  const handleSendCode = async () => {
    setLoading(true);
    try {
      const userId = currentUser?.id || currentUser?.uid;
      const result = await twoFactorService.sendEmailCode(
        userId,
        currentUser.email,
        userData?.nombre || userData?.display_name || 'Usuario'
      );

      if (result.success) {
        toast.success(result.message);
        setStep(2);
        setResendTimer(60); // 60 seconds cooldown for resend
      } else {
        toast.error(result.message || t('twoFactor.errors.sendFailed'));
      }
    } catch (error) {
      console.error('Error sending 2FA code:', error);
      toast.error(t('twoFactor.errors.sendFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast.error(t('twoFactor.errors.invalidCode'));
      return;
    }

    setLoading(true);
    try {
      const userId = currentUser?.id || currentUser?.uid;
      const result = await twoFactorService.verifyEmailCode(userId, verificationCode);

      if (result.success) {
        if (isSetup) {
          // Enable email 2FA
          const enableResult = await twoFactorService.enableEmail2FA(userId);
          if (enableResult.success) {
            toast.success(t('twoFactor.emailEnabledSuccess'));
            onSuccess && onSuccess();
            onClose();
          } else {
            toast.error(t('twoFactor.errors.enableFailed'));
          }
        } else {
          // Just verification for login
          toast.success(result.message);
          onSuccess && onSuccess();
          onClose();
        }
      } else {
        toast.error(result.message || t('twoFactor.errors.incorrectCode'));
        setVerificationCode('');
      }
    } catch (error) {
      console.error('Error verifying 2FA code:', error);
      toast.error(t('twoFactor.errors.verifyFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    await handleSendCode();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-2xl p-6 max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Shield className="text-cyan-500" size={24} />
            {isSetup ? t('twoFactor.setupEmailTitle') : t('twoFactor.verifyEmailTitle')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {step === 1 && isSetup ? (
            // Step 1: Setup explanation and send code
            <>
              <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333]">
                <div className="flex items-start gap-3">
                  <Mail className="text-cyan-400 mt-1" size={20} />
                  <div>
                    <p className="text-white font-medium mb-1">
                      {t('twoFactor.emailSetupInfo')}
                    </p>
                    <p className="text-sm text-gray-400">
                      {t('twoFactor.emailSetupDescription')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-gray-300 mb-1">
                  {t('twoFactor.emailToReceiveCode')}
                </p>
                <p className="text-cyan-400 font-medium">{currentUser?.email}</p>
              </div>

              <button
                onClick={handleSendCode}
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    {t('twoFactor.sendingCode')}
                  </>
                ) : (
                  <>
                    <Mail size={20} />
                    {t('twoFactor.sendVerificationCode')}
                  </>
                )}
              </button>
            </>
          ) : (
            // Step 2: Verify code
            <>
              <div className="text-center mb-4">
                <div className="inline-flex p-3 bg-cyan-500/10 rounded-full mb-3">
                  <Mail className="text-cyan-400" size={32} />
                </div>
                <p className="text-gray-300">
                  {t('twoFactor.codeSentTo')}
                </p>
                <p className="text-cyan-400 font-medium">{currentUser?.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('twoFactor.enterSixDigitCode')}
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-3 rounded-xl bg-[#1a1a1a] border border-[#333] text-white text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  maxLength="6"
                  autoFocus
                />
              </div>

              <button
                onClick={handleVerifyCode}
                disabled={loading || verificationCode.length !== 6}
                className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    {t('twoFactor.verifying')}
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    {t('twoFactor.verify')}
                  </>
                )}
              </button>

              <button
                onClick={handleResendCode}
                disabled={resendTimer > 0}
                className="w-full py-2 text-gray-400 hover:text-cyan-400 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                {resendTimer > 0 
                  ? t('twoFactor.resendIn', { seconds: resendTimer })
                  : t('twoFactor.resendCode')
                }
              </button>
            </>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-xs text-yellow-400">
            <strong>{t('twoFactor.securityNote')}:</strong> {t('twoFactor.emailSecurityInfo')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorEmailModal;