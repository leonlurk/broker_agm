import React, { useState, useEffect } from 'react';
import { X, Shield, Copy, Check, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import twoFactorService from '../services/twoFactorService';
import toast from 'react-hot-toast';

const TwoFactorModal = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation('settings');
  const { currentUser, userData } = useAuth();
  const [step, setStep] = useState(1); // 1: QR Code, 2: Verify, 3: Backup Codes
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  useEffect(() => {
    if (isOpen && step === 1) {
      generateSecret();
    }
  }, [isOpen]);

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
      toast.error(t('twoFactor.errors.generateFailed'));
      onClose();
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
      // Verify the code
      const userId = currentUser.id || currentUser.uid;
      const isValid = await twoFactorService.verifyToken(verificationCode, secret, userId);
      
      if (!isValid) {
        toast.error(t('twoFactor.errors.incorrectCode'));
        setLoading(false);
        return;
      }

      // Enable 2FA
      const result = await twoFactorService.enable2FA(userId, secret, backupCodes);
      
      if (result.success) {
        setStep(3); // Show backup codes
      } else {
        toast.error(t('twoFactor.errors.enableFailed'));
      }
    } catch (error) {
      console.error('Error verifying 2FA code:', error);
      toast.error(t('twoFactor.errors.verifyFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopiedCodes(true);
    toast.success(t('twoFactor.backupCodesCopied'));
    setTimeout(() => setCopiedCodes(false), 3000);
  };

  const handleComplete = () => {
    toast.success(t('notifications.twoFactorEnabled'));
    onSuccess && onSuccess();
    onClose();
    // Reset state
    setStep(1);
    setVerificationCode('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#232323] rounded-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#333]">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-cyan-500" />
            <h2 className="text-xl font-semibold text-white">
              {t('twoFactor.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: QR Code */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
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
                      <p className="font-mono text-sm text-white break-all">{secret}</p>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={loading}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {t('twoFactor.next')}
              </button>
            </div>
          )}

          {/* Step 2: Verify Code */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
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
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-[#333] hover:bg-[#444] text-white rounded-lg font-medium transition-colors"
                >
                  {t('twoFactor.back')}
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

          {/* Step 3: Backup Codes */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Check className="w-6 h-6 text-green-500" />
                  <h3 className="text-lg font-semibold text-white">
                    {t('twoFactor.enabledSuccess')}
                  </h3>
                </div>

                <p className="text-gray-300 mb-4">
                  {t('twoFactor.backupCodesInfo')}
                </p>

                <div className="bg-[#1a1a1a] p-4 rounded-lg mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-medium text-white">{t('twoFactor.backupCodes')}</p>
                    <button
                      onClick={handleCopyBackupCodes}
                      className="flex items-center gap-2 px-3 py-1 bg-[#333] hover:bg-[#444] rounded-lg text-sm text-gray-300 transition-colors"
                    >
                      {copiedCodes ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedCodes ? t('twoFactor.copied') : t('twoFactor.copy')}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="font-mono text-sm text-cyan-400 bg-[#232323] px-3 py-2 rounded">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/50 p-3 rounded-lg">
                  <p className="text-xs text-yellow-500">
                    {t('twoFactor.backupCodesWarning')}
                  </p>
                </div>
              </div>

              <button
                onClick={handleComplete}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                {t('twoFactor.complete')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TwoFactorModal;