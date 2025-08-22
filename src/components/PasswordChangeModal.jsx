import React, { useState } from 'react';
import { X, Mail, Loader, Eye, EyeOff, Lock, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PasswordChangeModal = ({
  isOpen,
  onClose,
  passwordResetStep,
  verificationCode,
  setVerificationCode,
  oldPassword,
  setOldPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showOldPassword,
  setShowOldPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  handleSendPasswordResetEmail,
  handleVerifyCode,
  handlePasswordChange,
  validatePassword
}) => {
  const { t } = useTranslation('settings');
  const [sending, setSending] = useState(false);
  const requirements = validatePassword(newPassword);
  const allRequirementsMet = Object.values(requirements).every(req => req);
  
  if (!isOpen) return null;

  const handleEmailClick = async () => {
    setSending(true);
    await handleSendPasswordResetEmail();
    setSending(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">{t('modal.changePasswordTitle')}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content based on step */}
        <div className="space-y-4">
          {passwordResetStep === 'initial' && (
            <>
              <p className="text-gray-300 text-sm leading-relaxed">
                Para cambiar tu contraseña de forma segura, te enviaremos un código de verificación a tu email registrado.
              </p>
              <button
                onClick={handleEmailClick}
                disabled={sending}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail size={20} />
                    Enviar Código de Verificación
                  </>
                )}
              </button>
            </>
          )}

          {passwordResetStep === 'code-sent' && (
            <>
              <p className="text-gray-300 text-sm leading-relaxed">
                Hemos enviado un código de 6 dígitos a tu email. Ingrésalo a continuación:
              </p>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full px-4 py-3 rounded-xl bg-[#1a1a1a] border border-[#333] text-white text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-cyan-500"
                maxLength="6"
              />
              <button
                onClick={handleVerifyCode}
                disabled={verificationCode.length !== 6}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Verificar Código
              </button>
              <button
                onClick={handleEmailClick}
                className="w-full text-gray-400 hover:text-cyan-400 transition-colors text-sm"
              >
                Reenviar código
              </button>
            </>
          )}

          {passwordResetStep === 'verified' && (
            <>
              <p className="text-green-400 text-sm mb-4">✓ Código verificado correctamente</p>
              
              {/* Contraseña Actual */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#1a1a1a] border border-[#333] text-white pr-12 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Ingresa tu contraseña actual"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showOldPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Nueva Contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#1a1a1a] border border-[#333] text-white pr-12 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Ingresa tu nueva contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                
                {/* Requisitos */}
                <div className="mt-2 space-y-1">
                  <p className={`text-xs flex items-center gap-1 ${requirements.length ? 'text-green-400' : 'text-gray-400'}`}>
                    {requirements.length ? <Check size={14} /> : <X size={14} />}
                    Mínimo 8 caracteres
                  </p>
                  <p className={`text-xs flex items-center gap-1 ${requirements.uppercase ? 'text-green-400' : 'text-gray-400'}`}>
                    {requirements.uppercase ? <Check size={14} /> : <X size={14} />}
                    Una mayúscula
                  </p>
                  <p className={`text-xs flex items-center gap-1 ${requirements.lowercase ? 'text-green-400' : 'text-gray-400'}`}>
                    {requirements.lowercase ? <Check size={14} /> : <X size={14} />}
                    Una minúscula
                  </p>
                  <p className={`text-xs flex items-center gap-1 ${requirements.number ? 'text-green-400' : 'text-gray-400'}`}>
                    {requirements.number ? <Check size={14} /> : <X size={14} />}
                    Un número
                  </p>
                  <p className={`text-xs flex items-center gap-1 ${requirements.special ? 'text-green-400' : 'text-gray-400'}`}>
                    {requirements.special ? <Check size={14} /> : <X size={14} />}
                    Un carácter especial (!@#$%^&*)
                  </p>
                </div>
              </div>

              {/* Confirmar Contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl bg-[#1a1a1a] border ${
                      confirmPassword && confirmPassword !== newPassword ? 'border-red-500' : 'border-[#333]'
                    } text-white pr-12 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                    placeholder="Confirma tu nueva contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="mt-1 text-sm text-red-400">Las contraseñas no coinciden</p>
                )}
              </div>

              <button
                onClick={handlePasswordChange}
                disabled={!oldPassword || !allRequirementsMet || newPassword !== confirmPassword}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Lock size={20} />
                Actualizar Contraseña
              </button>
            </>
          )}
        </div>
        
        {/* Close button */}
        <div className="mt-4">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-[#0891b2] to-[#0c4a6e] text-white py-2.5 px-6 rounded-lg hover:opacity-90 transition-opacity"
          >
            {t('modal.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordChangeModal;