import React, { useState } from 'react';
import { X, Shield, Mail, Smartphone, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const TwoFactorMethodModal = ({ isOpen, onClose, onSelectMethod }) => {
  const { t } = useTranslation('settings');
  const [selectedMethod, setSelectedMethod] = useState(null);

  if (!isOpen) return null;

  const handleSelectMethod = () => {
    if (selectedMethod) {
      onSelectMethod(selectedMethod);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-2xl p-6 max-w-lg w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Shield className="text-cyan-500" size={24} />
            {t('twoFactor.selectMethod')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Method Selection */}
        <div className="space-y-4 mb-6">
          <p className="text-gray-300 text-sm">
            {t('twoFactor.selectMethodDescription')}
          </p>

          {/* Email Method */}
          <div
            onClick={() => setSelectedMethod('email')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selectedMethod === 'email'
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-[#444] hover:border-gray-500 bg-[#1a1a1a]'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                selectedMethod === 'email' ? 'bg-cyan-500/20' : 'bg-[#333]'
              }`}>
                <Mail className={`${
                  selectedMethod === 'email' ? 'text-cyan-400' : 'text-gray-400'
                }`} size={24} />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-medium mb-1">
                  {t('twoFactor.emailMethod.title')}
                </h4>
                <p className="text-sm text-gray-400">
                  {t('twoFactor.emailMethod.description')}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                    {t('twoFactor.simple')}
                  </span>
                  <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                    {t('twoFactor.noAppRequired')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Authenticator Method */}
          <div
            onClick={() => setSelectedMethod('authenticator')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selectedMethod === 'authenticator'
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-[#444] hover:border-gray-500 bg-[#1a1a1a]'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                selectedMethod === 'authenticator' ? 'bg-cyan-500/20' : 'bg-[#333]'
              }`}>
                <Smartphone className={`${
                  selectedMethod === 'authenticator' ? 'text-cyan-400' : 'text-gray-400'
                }`} size={24} />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-medium mb-1">
                  {t('twoFactor.authenticatorMethod.title')}
                </h4>
                <p className="text-sm text-gray-400">
                  {t('twoFactor.authenticatorMethod.description')}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                    {t('twoFactor.moreSecure')}
                  </span>
                  <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-400 rounded">
                    {t('twoFactor.offline')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-[#333] text-white rounded-lg hover:bg-[#444] transition-colors"
          >
            {t('buttons.cancel')}
          </button>
          <button
            onClick={handleSelectMethod}
            disabled={!selectedMethod}
            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {t('buttons.continue')}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorMethodModal;