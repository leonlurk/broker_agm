import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Shield, AlertTriangle, Mail, Smartphone } from 'lucide-react';
import twoFactorService from '../services/twoFactorService';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const TwoFactorVerifyModal = ({ isOpen, onClose, onSuccess, purpose = 'verify' }) => {
  const { t } = useTranslation(['common', 'settings']);
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState(null);
  const [userMethods, setUserMethods] = useState(null);
  
  // Verification inputs
  const [totpCode, setTotpCode] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadUserMethods();
    } else {
      // Reset state when modal closes
      setVerificationMethod(null);
      setTotpCode('');
      setEmailCode('');
      setEmailCodeSent(false);
      setResendCooldown(0);
    }
  }, [isOpen]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const loadUserMethods = async () => {
    if (!currentUser) return;
    
    try {
      const userId = currentUser.id || currentUser.uid;
      const twoFAStatus = await twoFactorService.get2FAStatus(userId);
      
      if (twoFAStatus.enabled) {
        const methods = [];
        if (twoFAStatus.secret) methods.push('totp');
        if (twoFAStatus.enabled) methods.push('email'); // Email always available if 2FA is enabled
        
        setUserMethods({
          userId: userId,
          email: currentUser.email,
          name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuario',
          secret: twoFAStatus.secret,
          methods: methods
        });

        // If only one method available, select it automatically
        if (methods.length === 1) {
          setVerificationMethod(methods[0]);
          if (methods[0] === 'email') {
            sendEmailCode();
          }
        }
      }
    } catch (error) {
      console.error('Error loading 2FA methods:', error);
      toast.error(t('twoFactor.errors.loadFailed', { ns: 'settings' }));
      onClose();
    }
  };

  const sendEmailCode = async () => {
    try {
      setLoading(true);
      const result = await twoFactorService.sendEmailCode(
        userMethods?.userId || currentUser.id,
        userMethods?.email || currentUser.email,
        userMethods?.name || userData?.email?.split('@')[0]
      );
      
      if (result.success) {
        setEmailCodeSent(true);
        setResendCooldown(60);
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

  const handleVerify = async () => {
    if (!verificationMethod) {
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

      if (verificationResult?.verified) {
        toast.success(t('twoFactor.verificationSuccess', { ns: 'settings' }));
        onSuccess();
        onClose();
      } else {
        toast.error(verificationResult?.message || t('twoFactor.errors.verificationFailed', { ns: 'settings' }));
      }
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      toast.error(t('twoFactor.errors.verificationFailed', { ns: 'settings' }));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const hasTotp = userMethods?.methods?.includes('totp');
  const hasEmail = userMethods?.methods?.includes('email');
  const hasBothMethods = hasTotp && hasEmail;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1e1e] rounded-2xl max-w-md w-full border border-[#333]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#333]">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-semibold text-white">
              {purpose === 'withdraw' 
                ? t('twoFactor.verifyForWithdraw', { ns: 'settings' })
                : t('twoFactor.verifyTitle', { ns: 'settings' })}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Method Selection (if user has both methods) */}
          {hasBothMethods && !verificationMethod && (
            <div className="space-y-4">
              <p className="text-gray-300 text-sm">
                {t('twoFactor.selectVerificationMethod', { ns: 'settings' })}
              </p>
              
              <button
                onClick={() => selectVerificationMethod('totp')}
                className="w-full p-4 bg-[#2a2a2a] hover:bg-[#333] border border-[#444] rounded-lg transition-colors flex items-center gap-3"
              >
                <Smartphone className="w-5 h-5 text-cyan-400" />
                <span className="text-white">{t('twoFactor.useApp', { ns: 'settings' })}</span>
              </button>
              
              <button
                onClick={() => selectVerificationMethod('email')}
                className="w-full p-4 bg-[#2a2a2a] hover:bg-[#333] border border-[#444] rounded-lg transition-colors flex items-center gap-3"
              >
                <Mail className="w-5 h-5 text-cyan-400" />
                <span className="text-white">{t('twoFactor.useEmail', { ns: 'settings' })}</span>
              </button>
            </div>
          )}

          {/* TOTP Verification */}
          {verificationMethod === 'totp' && (
            <div className="space-y-4">
              <p className="text-gray-300 text-sm">
                {t('twoFactor.enterAppCode', { ns: 'settings' })}
              </p>
              
              <input
                type="text"
                maxLength="6"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#444] rounded-lg text-white text-center text-2xl tracking-widest focus:outline-none focus:border-cyan-400"
              />
              
              {hasBothMethods && (
                <button
                  onClick={() => setVerificationMethod(null)}
                  className="text-sm text-cyan-400 hover:text-cyan-300"
                >
                  {t('twoFactor.useAnotherMethod', { ns: 'settings' })}
                </button>
              )}
            </div>
          )}

          {/* Email Verification */}
          {verificationMethod === 'email' && (
            <div className="space-y-4">
              <p className="text-gray-300 text-sm">
                {emailCodeSent 
                  ? t('twoFactor.emailCodeSentTo', { email: userMethods?.email, ns: 'settings' })
                  : t('twoFactor.sendingEmailCode', { ns: 'settings' })}
              </p>
              
              <input
                type="text"
                maxLength="6"
                value={emailCode}
                onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#444] rounded-lg text-white text-center text-2xl tracking-widest focus:outline-none focus:border-cyan-400"
                disabled={!emailCodeSent}
              />
              
              <div className="flex items-center justify-between">
                <button
                  onClick={sendEmailCode}
                  disabled={resendCooldown > 0 || loading}
                  className="text-sm text-cyan-400 hover:text-cyan-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 
                    ? t('twoFactor.resendIn', { seconds: resendCooldown, ns: 'settings' })
                    : t('twoFactor.resendCode', { ns: 'settings' })}
                </button>
                
                {hasBothMethods && (
                  <button
                    onClick={() => setVerificationMethod(null)}
                    className="text-sm text-cyan-400 hover:text-cyan-300"
                  >
                    {t('twoFactor.useAnotherMethod', { ns: 'settings' })}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {verificationMethod && (
          <div className="p-6 border-t border-[#333] flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-[#2a2a2a] hover:bg-[#333] text-white rounded-lg transition-colors"
            >
              {t('common.cancel', { ns: 'common' })}
            </button>
            <button
              onClick={handleVerify}
              disabled={loading || 
                (verificationMethod === 'totp' && totpCode.length !== 6) ||
                (verificationMethod === 'email' && (emailCode.length !== 6 || !emailCodeSent))}
              className="flex-1 py-3 px-4 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {loading ? t('common.verifying', { ns: 'common' }) : t('common.verify', { ns: 'common' })}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFactorVerifyModal;