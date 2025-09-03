import React, { useState, useEffect } from 'react';
import { X, Mail, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const EmailChangeModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation('settings');
  const { currentUser } = useAuth();
  const [currentEmail, setCurrentEmail] = useState(currentUser?.email || '');
  const [newEmail, setNewEmail] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Actualizar el correo actual cuando cambie el usuario
  useEffect(() => {
    if (currentUser?.email) {
      setCurrentEmail(currentUser.email);
    }
  }, [currentUser?.email]);

  const reasons = [
    { key: 'security', label: t('modal.changeReasons.security') },
    { key: 'access', label: t('modal.changeReasons.access') },
    { key: 'typo', label: t('modal.changeReasons.typo') },
    { key: 'preference', label: t('modal.changeReasons.preference') },
    { key: 'work', label: t('modal.changeReasons.work') },
    { key: 'other', label: t('modal.changeReasons.other') }
  ];

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleClose = () => {
    onClose();
    // Limpiar campos excepto el correo actual que se mantiene
    setNewEmail('');
    setSelectedReason('');
    setShowReasonDropdown(false);
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!currentEmail || !validateEmail(currentEmail)) {
      toast.error(t('modal.emailValidationError'));
      return;
    }

    if (!newEmail || !validateEmail(newEmail)) {
      toast.error(t('modal.emailValidationError'));
      return;
    }

    if (currentEmail === newEmail) {
      toast.error(t('modal.emailsMatchError'));
      return;
    }

    if (!selectedReason) {
      toast.error(t('modal.reasonRequiredError'));
      return;
    }

    setIsSubmitting(true);

    try {
      // Simular envío de solicitud (aquí iría la lógica real de API)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mostrar notificación toast de éxito
      toast.success(t('modal.emailChangeSubmitted'), {
        duration: 6000,
        position: 'top-right',
        style: {
          background: '#1f2937',
          color: '#fff',
          border: '1px solid #374151',
          borderRadius: '0.75rem',
          fontSize: '0.875rem',
          maxWidth: '400px'
        }
      });

      // Cerrar modal y limpiar campos
      handleClose();
      
    } catch (error) {
      toast.error('Error al enviar la solicitud. Inténtalo nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReasonSelect = (reasonKey) => {
    setSelectedReason(reasonKey);
    setShowReasonDropdown(false);
  };

  const getSelectedReasonLabel = () => {
    const reason = reasons.find(r => r.key === selectedReason);
    return reason ? reason.label : t('modal.changeReasonPlaceholder');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">{t('modal.updateEmailTitle')}</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Description */}
        <p className="text-gray-300 text-sm leading-relaxed mb-6">
          {t('modal.updateEmailMessage')}
        </p>

        {/* Form */}
        <div className="space-y-4">
          {/* Current Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('modal.currentEmail')}
            </label>
            <div className="relative">
              <input
                type="email"
                value={currentEmail}
                onChange={(e) => setCurrentEmail(e.target.value)}
                placeholder={t('modal.currentEmailPlaceholder')}
                className="w-full px-4 py-3 rounded-xl bg-[#1a1a1a] border border-[#333] text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </div>

          {/* New Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('modal.newEmail')}
            </label>
            <div className="relative">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={t('modal.newEmailPlaceholder')}
                className="w-full px-4 py-3 rounded-xl bg-[#1a1a1a] border border-[#333] text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </div>

          {/* Change Reason Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('modal.changeReason')}
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowReasonDropdown(!showReasonDropdown)}
                className="w-full px-4 py-3 rounded-xl bg-[#1a1a1a] border border-[#333] text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 flex items-center justify-between"
              >
                <span className={selectedReason ? 'text-white' : 'text-gray-400'}>
                  {getSelectedReasonLabel()}
                </span>
                <ChevronDown 
                  size={18} 
                  className={`text-gray-400 transition-transform ${showReasonDropdown ? 'rotate-180' : ''}`} 
                />
              </button>
              
              {showReasonDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                  {reasons.map((reason) => (
                    <button
                      key={reason.key}
                      type="button"
                      onClick={() => handleReasonSelect(reason.key)}
                      className="w-full px-4 py-3 text-left text-white hover:bg-[#2a2a2a] transition-colors first:rounded-t-xl last:rounded-b-xl"
                    >
                      {reason.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 px-6 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                {t('common:loading')}
              </>
            ) : (
              <>
                <Mail size={20} />
                {t('modal.submitEmailChange')}
              </>
            )}
          </button>
        </div>
        
        {/* Close button */}
        <div className="mt-6">
          <button
            onClick={handleClose}
            className="w-full bg-gradient-to-r from-[#0891b2] to-[#0c4a6e] text-white py-2.5 px-6 rounded-xl hover:opacity-90 transition-opacity"
          >
            {t('modal.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailChangeModal;