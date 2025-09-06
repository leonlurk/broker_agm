import React, { useState, useEffect } from 'react';
import { X, Shield, Copy, Check, AlertCircle, Mail, Smartphone, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import twoFactorService from '../services/twoFactorService';
import toast from 'react-hot-toast';

const TwoFactorDualModalImproved = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation('settings');
  const { currentUser, userData } = useAuth();
  const [step, setStep] = useState(1); // 1: Intro, 2: App Setup, 3: Verify App, 4: Email Verify, 5: Success
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [selectedMethods, setSelectedMethods] = useState({ app: false, email: false });
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  // Calculate button text dynamically
  const getActivateButtonText = () => {
    const count = [selectedMethods.app, selectedMethods.email].filter(Boolean).length;
    if (count === 0) return '';
    if (count === 1) return t('twoFactor.activateMethod', { ns: 'settings' });
    return t('twoFactor.activateMethods', { ns: 'settings' });
  };
  
  // Calculate total steps based on selected methods
  const getTotalSteps = () => {
    if (selectedMethods.app && selectedMethods.email) return 5;
    if (selectedMethods.app || selectedMethods.email) return 3;
    return 1;
  };

  useEffect(() => {
    if (isOpen && step === 2 && selectedMethods.app) {
      generateSecret();
    }
  }, [isOpen, step, selectedMethods.app]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const generateSecret = async () => {
    if (!currentUser?.email) return;
    
    setLoading(true);
    try {
      const result = await twoFactorService.generateSecret(currentUser.email);
      setQrCode(result.qrCode);
      setSecret(result.secret);
    } catch (error) {
      console.error('Error generating 2FA secret:', error);
      toast.error(t('twoFactor.errors.generateFailed', { ns: 'settings' }));
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const sendEmailVerificationCode = async () => {
    if (!currentUser?.email) return;
    
    setLoading(true);
    try {
      // Send email code using twoFactorService (it generates its own code)
      const result = await twoFactorService.sendEmailCode(currentUser.id, userData.email, userData.email.split('@')[0]);
      
      if (!result.success) {
        throw new Error(result.message || 'Error al enviar código por email');
      }
      
      setEmailCodeSent(true);
      setResendCooldown(60); // 60 seconds cooldown
      toast.success(t('twoFactor.emailCodeSent', { ns: 'settings' }));
    } catch (error) {
      console.error('Error sending email code:', error);
      toast.error(t('twoFactor.errors.emailSendFailed', { ns: 'settings' }));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAppCode = async () => {
    if (verificationCode.length !== 6) {
      toast.error(t('twoFactor.errors.invalidCode', { ns: 'settings' }));
      return;
    }

    setLoading(true);
    try {
      const userId = currentUser.id || currentUser.uid;
      const isValid = await twoFactorService.verifyToken(verificationCode, secret, userId);
      
      if (!isValid) {
        toast.error(t('twoFactor.errors.incorrectCode', { ns: 'settings' }));
        setLoading(false);
        return;
      }

      // If email is also selected, go to email verification
      if (selectedMethods.email) {
        setStep(4);
        await sendEmailVerificationCode();
      } else {
        // Only app selected, enable it and finish
        await enableSelectedMethods();
      }
      setVerificationCode('');
    } catch (error) {
      console.error('Error verifying app code:', error);
      toast.error(t('twoFactor.errors.verifyFailed', { ns: 'settings' }));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailCode = async () => {
    if (emailCode.length !== 6) {
      toast.error(t('twoFactor.errors.invalidCode', { ns: 'settings' }));
      return;
    }

    setLoading(true);
    try {
      // Verify email code using the service
      const result = await twoFactorService.verifyEmailCode(currentUser.id, emailCode);
      
      if (!result.success) {
        toast.error(result.message || t('twoFactor.errors.incorrectCode', { ns: 'settings' }));
        setLoading(false);
        return;
      }

      // Enable all selected methods
      await enableSelectedMethods();
    } catch (error) {
      console.error('Error verifying email code:', error);
      toast.error(t('twoFactor.errors.verifyFailed', { ns: 'settings' }));
    } finally {
      setLoading(false);
    }
  };

  const enableSelectedMethods = async () => {
    setLoading(true);
    try {
      const userId = currentUser.id || currentUser.uid;
      let success = true;
      
      if (selectedMethods.app) {
        const appResult = await twoFactorService.enable2FA(userId, secret, []);
        if (!appResult.success) {
          success = false;
          toast.error(t('twoFactor.errors.enableAppFailed', { ns: 'settings' }));
        }
      }
      
      if (selectedMethods.email && success) {
        const emailResult = await twoFactorService.enableEmail2FA(userId);
        if (!emailResult.success) {
          success = false;
          toast.error(t('twoFactor.errors.enableEmailFailed', { ns: 'settings' }));
        }
      }
      
      if (success) {
        setStep(5); // Show success
        toast.success(t('messages.twoFactorEnabled'));
      }
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      toast.error(t('twoFactor.errors.enableFailed', { ns: 'settings' }));
    } finally {
      setLoading(false);
    }
  };

  const handleStartSetup = async () => {
    if (selectedMethods.app) {
      setStep(2); // Go to app setup
    } else if (selectedMethods.email) {
      setStep(4); // Go to email verification
      await sendEmailVerificationCode();
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    toast.success(t('twoFactor.secretCopied', { ns: 'settings' }));
    setTimeout(() => setCopiedSecret(false), 3000);
  };

  const handleComplete = () => {
    onSuccess && onSuccess();
    onClose();
    resetModal();
  };

  const resetModal = () => {
    setStep(1);
    setVerificationCode('');
    setEmailCode('');
    setSelectedMethods({ app: false, email: false });
    setEmailCodeSent(false);
  };

  const handleCloseModal = () => {
    if (step > 1 && step < 5) {
      setShowConfirmClose(true);
    } else {
      onClose();
      resetModal();
    }
  };

  const handleMethodToggle = (method) => {
    setSelectedMethods(prev => ({ ...prev, [method]: !prev[method] }));
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-[#232323] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#333] sticky top-0 bg-[#232323]">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-cyan-500" />
              <h2 className="text-xl font-semibold text-white">
                {t('twoFactor.title', { ns: 'settings' })}
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
          {step > 1 && (
            <div className="px-6 pt-4">
              <div className="flex items-center justify-between mb-6">
                {Array.from({ length: getTotalSteps() }, (_, i) => i + 1).map((s) => (
                  <div
                    key={s}
                    className={`flex-1 h-2 mx-1 rounded-full transition-colors ${
                      s <= step ? 'bg-cyan-500' : 'bg-[#333]'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {/* Step 1: Method Selection */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {t('twoFactor.selectMethods', { ns: 'settings' })}
                  </h3>
                  <p className="text-gray-300 mb-6">
                    {t('twoFactor.selectDescription', { ns: 'settings' })}
                  </p>
                  
                  <div className="space-y-3">
                    <div 
                      onClick={() => handleMethodToggle('app')}
                      className={`bg-[#1a1a1a] p-4 rounded-lg flex items-center gap-3 cursor-pointer transition-all border-2 ${
                        selectedMethods.app ? 'border-cyan-500 bg-cyan-500/10' : 'border-transparent hover:border-gray-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMethods.app}
                        onChange={() => {}}
                        className="w-5 h-5 rounded border-gray-600 bg-transparent text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
                      />
                      <Smartphone className="w-5 h-5 text-cyan-500 flex-shrink-0" />
                      <div className="text-left flex-1">
                        <p className="text-white font-medium">
                          {t('twoFactor.appMethod', { ns: 'settings' })}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {t('twoFactor.appDescription', { ns: 'settings' })}
                        </p>
                      </div>
                    </div>
                    
                    <div 
                      onClick={() => handleMethodToggle('email')}
                      className={`bg-[#1a1a1a] p-4 rounded-lg flex items-center gap-3 cursor-pointer transition-all border-2 ${
                        selectedMethods.email ? 'border-cyan-500 bg-cyan-500/10' : 'border-transparent hover:border-gray-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMethods.email}
                        onChange={() => {}}
                        className="w-5 h-5 rounded border-gray-600 bg-transparent text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
                      />
                      <Mail className="w-5 h-5 text-cyan-500 flex-shrink-0" />
                      <div className="text-left flex-1">
                        <p className="text-white font-medium">
                          {t('twoFactor.emailMethod', { ns: 'settings' })}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {t('twoFactor.emailDescription', { ns: 'settings' })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {(selectedMethods.app || selectedMethods.email) && (
                  <button
                    onClick={handleStartSetup}
                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
                  >
                    {getActivateButtonText()}
                  </button>
                )}
                
                {!selectedMethods.app && !selectedMethods.email && (
                  <div className="text-center text-amber-400 text-sm">
                    {t('twoFactor.selectAtLeastOne', { ns: 'settings' })}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: App QR Code */}
            {step === 2 && selectedMethods.app && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {t('twoFactor.scanQRTitle', { ns: 'settings' })}
                  </h3>
                  <p className="text-gray-300 mb-6">
                    {t('twoFactor.scanQR', { ns: 'settings' })}
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
                        <p className="text-xs text-gray-400 mb-2">{t('twoFactor.manualEntry', { ns: 'settings' })}</p>
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
                  {t('twoFactor.next', { ns: 'settings' })}
                </button>
              </div>
            )}

            {/* Step 3: Verify App Code */}
            {step === 3 && selectedMethods.app && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 text-center">
                    {t('twoFactor.verifyAppTitle', { ns: 'settings' })}
                  </h3>
                  <p className="text-gray-300 mb-6 text-center">
                    {t('twoFactor.enterCode', { ns: 'settings' })}
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
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 bg-[#333] hover:bg-[#444] text-white rounded-lg font-medium transition-colors"
                  >
                    {t('twoFactor.back', { ns: 'settings' })}
                  </button>
                  <button
                    onClick={handleVerifyAppCode}
                    disabled={loading || verificationCode.length !== 6}
                    className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? t('twoFactor.verifying', { ns: 'settings' }) : t('twoFactor.verify', { ns: 'settings' })}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Email Verification */}
            {step === 4 && selectedMethods.email && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 text-center">
                    {t('twoFactor.verifyEmailTitle', { ns: 'settings' })}
                  </h3>
                  <p className="text-gray-300 mb-2 text-center">
                    {t('twoFactor.emailCodeSentTo', { ns: 'settings' })}
                  </p>
                  <p className="text-white font-medium text-center mb-6">{currentUser?.email}</p>
                  
                  <div className="flex justify-center mb-6">
                    <input
                      type="text"
                      value={emailCode}
                      onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="text-center text-2xl font-mono w-40 px-4 py-3 bg-[#1a1a1a] border border-[#4b5563] rounded-lg text-white placeholder-[#6b7280] focus:border-cyan-500 focus:outline-none"
                      maxLength="6"
                    />
                  </div>

                  {resendCooldown === 0 && (
                    <button
                      onClick={sendEmailVerificationCode}
                      disabled={loading}
                      className="w-full py-2 text-cyan-500 hover:text-cyan-400 text-sm transition-colors"
                    >
                      {t('twoFactor.resendCode', { ns: 'settings' })}
                    </button>
                  )}
                  {resendCooldown > 0 && (
                    <p className="text-center text-gray-400 text-sm">
                      {t('twoFactor.resendIn', { seconds: resendCooldown, ns: 'settings' }) || `Reenviar en ${resendCooldown}s`}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleVerifyEmailCode}
                  disabled={loading || emailCode.length !== 6}
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? t('twoFactor.verifying', { ns: 'settings' }) : t('activate', { ns: 'common' })}
                </button>
              </div>
            )}

            {/* Step 5: Success */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {t('twoFactor.successTitle', { ns: 'settings' })}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {t('twoFactor.successMessage', { ns: 'settings' })}
                  </p>
                </div>

                <button
                  onClick={handleComplete}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  {t('twoFactor.complete', { ns: 'settings' })}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Native Confirm Close Modal */}
      {showConfirmClose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-[#232323] rounded-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              <h3 className="text-lg font-semibold text-white">
                {t('twoFactor.confirmCloseTitle', { ns: 'settings' })}
              </h3>
            </div>
            <p className="text-gray-300 mb-6">
              {t('twoFactor.confirmCloseMessage', { ns: 'settings' })}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmClose(false)}
                className="flex-1 py-2 bg-[#333] hover:bg-[#444] text-white rounded-lg font-medium transition-colors"
              >
                {t('cancel', { ns: 'common' })}
              </button>
              <button
                onClick={() => {
                  setShowConfirmClose(false);
                  onClose();
                  resetModal();
                }}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                {t('close', { ns: 'common' })}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TwoFactorDualModalImproved;