import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertTriangle, TrendingDown, DollarSign, Calendar, AlertCircle, Shield } from 'lucide-react';
import { requestWithdrawal } from '../services/pammService';
import twoFactorService from '../services/twoFactorService';
import TwoFactorWithdrawModal from './TwoFactorWithdrawModal';
import { toast } from 'react-hot-toast';

const RetirarPAMMModalWithdrawal = ({ isOpen, onClose, fund, investment, onSuccess, currentUser }) => {
  const { t } = useTranslation(['pamm', 'wallet']);
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [withdrawalType, setWithdrawalType] = useState('full');
  const [partialAmount, setPartialAmount] = useState('');
  const [reason, setReason] = useState('');
  
  // 2FA states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorMethods, setTwoFactorMethods] = useState(null);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [pendingWithdrawal, setPendingWithdrawal] = useState(null);

  useEffect(() => {
    const userId = currentUser?.uid || currentUser?.id;
    if (isOpen && userId) {
      check2FAStatus();
    } else if (isOpen && !currentUser) {
      console.warn('[RetirarPAMMModal] currentUser is undefined');
    }
  }, [isOpen, currentUser]);

  const check2FAStatus = async () => {
    try {
      // Support both uid and id from different auth providers
      const userId = currentUser?.uid || currentUser?.id;
      
      if (!userId) {
        console.error('[RetirarPAMMModal] No user ID available', currentUser);
        setTwoFactorEnabled(false);
        return;
      }

      const status = await twoFactorService.get2FAStatus(userId);
      console.log('[RetirarPAMMModal] 2FA status:', status);
      setTwoFactorEnabled(status.enabled);
      
      if (status.enabled) {
        setTwoFactorMethods({
          userId: userId,
          email: currentUser.email,
          name: currentUser.displayName || currentUser.display_name || currentUser.email,
          methods: status.methods || [],
          secret: status.secret
        });
      }
    } catch (error) {
      console.error('[RetirarPAMMModal] Error checking 2FA status:', error);
      setTwoFactorEnabled(false);
    }
  };

  if (!isOpen || !fund || !investment) return null;

  const currentValue = investment.current_value || investment.invested_amount || 0;
  const investedAmount = investment.invested_amount || 0;
  const profitLoss = currentValue - investedAmount;
  const profitLossPercentage = investedAmount > 0 ? ((profitLoss / investedAmount) * 100).toFixed(2) : 0;

  const maxWithdrawAmount = currentValue;
  const withdrawAmount = withdrawalType === 'full' ? maxWithdrawAmount : parseFloat(partialAmount) || 0;

  const handleWithdraw = async () => {
    if (confirmText.toUpperCase() !== 'CONFIRMAR' || !acceptTerms) {
      return;
    }

    if (withdrawalType === 'partial' && (!partialAmount || parseFloat(partialAmount) <= 0)) {
      toast.error(t('pamm:withdraw.errors.invalidAmount', 'Monto inválido'));
      return;
    }

    if (withdrawalType === 'partial' && parseFloat(partialAmount) > maxWithdrawAmount) {
      toast.error(t('pamm:withdraw.errors.exceedsBalance', 'El monto excede tu balance disponible'));
      return;
    }

    // Check if 2FA is enabled
    if (!twoFactorEnabled) {
      toast.error(
        t('pamm:withdraw.errors.require2FA', 'Debes habilitar 2FA en tu perfil antes de solicitar retiros'),
        { duration: 5000 }
      );
      return;
    }

    // Store withdrawal data and show 2FA modal
    setPendingWithdrawal({
      investmentId: investment.id,
      amount: withdrawAmount,
      withdrawalType,
      reason: reason || null
    });
    setShow2FAModal(true);
  };

  const handle2FASuccess = async () => {
    setShow2FAModal(false);
    
    if (!pendingWithdrawal) return;

    setLoading(true);
    try {
      const response = await requestWithdrawal(
        pendingWithdrawal.investmentId,
        pendingWithdrawal.amount,
        pendingWithdrawal.withdrawalType,
        pendingWithdrawal.reason,
        null, // paymentMethod
        {} // paymentDetails
      );

      if (response.success) {
        toast.success(
          t('pamm:withdraw.success', 'Solicitud de retiro enviada exitosamente. El manager la revisará pronto.'),
          { duration: 5000 }
        );
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      toast.error(error.error || t('pamm:withdraw.errors.failed', 'Error al solicitar retiro'));
    } finally {
      setLoading(false);
      setPendingWithdrawal(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-red-500/20">
          <div className="sticky top-0 bg-gradient-to-r from-red-600/20 to-red-800/20 backdrop-blur-md px-6 py-4 border-b border-red-500/20 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {t('pamm:withdraw.title', 'Solicitar Retiro')}
                </h2>
                <p className="text-sm text-gray-400">
                  {fund.fund_name || fund.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* 2FA Warning if not enabled */}
            {!twoFactorEnabled && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
                <Shield className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-yellow-400 font-semibold mb-1">
                    {t('pamm:withdraw.require2FA', '2FA Requerido')}
                  </h3>
                  <p className="text-sm text-gray-300">
                    {t('pamm:withdraw.require2FAMessage', 'Debes habilitar la autenticación de dos factores en tu perfil antes de poder solicitar retiros.')}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-red-400 font-semibold mb-1">
                  {t('pamm:withdraw.warning', 'Advertencia Importante')}
                </h3>
                <p className="text-sm text-gray-300">
                  {t('pamm:withdraw.warningText', 'Tu solicitud de retiro será revisada por el manager del fondo. El proceso puede tomar tiempo según las reglas del fondo.')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-400">{t('pamm:withdraw.invested', 'Invertido')}</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  ${investedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-400">{t('pamm:withdraw.currentValue', 'Valor Actual')}</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  ${currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <div className={`bg-gradient-to-br ${profitLoss >= 0 ? 'from-green-500/10 to-green-600/10 border-green-500/20' : 'from-red-500/10 to-red-600/10 border-red-500/20'} border rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className={`w-4 h-4 ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                  <span className="text-sm text-gray-400">{t('pamm:withdraw.profitLoss', 'Ganancia/Pérdida')}</span>
                </div>
                <p className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {profitLoss >= 0 ? '+' : ''}${profitLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-sm ml-2">({profitLossPercentage}%)</span>
                </p>
              </div>
            </div>

            {/* Withdrawal Type Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                {t('pamm:withdraw.type', 'Tipo de Retiro')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setWithdrawalType('full')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    withdrawalType === 'full'
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }`}
                >
                  <p className="font-semibold text-white">{t('pamm:withdraw.fullWithdrawal', 'Retiro Total')}</p>
                  <p className="text-xs text-gray-400 mt-1">{t('pamm:withdraw.fullWithdrawalDesc', 'Retirar toda la inversión')}</p>
                </button>
                <button
                  onClick={() => setWithdrawalType('partial')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    withdrawalType === 'partial'
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }`}
                >
                  <p className="font-semibold text-white">{t('pamm:withdraw.partialWithdrawal', 'Retiro Parcial')}</p>
                  <p className="text-xs text-gray-400 mt-1">{t('pamm:withdraw.partialWithdrawalDesc', 'Retirar un monto específico')}</p>
                </button>
              </div>
            </div>

            {/* Partial Amount Input */}
            {withdrawalType === 'partial' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  {t('pamm:withdraw.amount', 'Monto a Retirar')}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    max={maxWithdrawAmount}
                    step="0.01"
                    className="w-full pl-8 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-400">
                  {t('pamm:withdraw.maxAmount', 'Máximo disponible')}: ${maxWithdrawAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}

            {/* Reason (optional) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                {t('pamm:withdraw.reason', 'Motivo (Opcional)')}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('pamm:withdraw.reasonPlaceholder', 'Explica brevemente el motivo de tu retiro...')}
                rows={3}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-yellow-400 font-semibold mb-2">
                    {t('pamm:withdraw.fees', 'Comisiones Aplicables')}
                  </h4>
                  <div className="space-y-1 text-sm text-gray-300">
                    <p>• Performance Fee: <span className="text-white font-semibold">{fund.performance_fee || 20}%</span> {profitLoss > 0 && `(~$${((Math.max(0, currentValue - (fund.high_water_mark || investedAmount)) * (fund.performance_fee || 20)) / 100).toFixed(2)})`}</p>
                    <p className="text-xs text-gray-400 ml-4">✓ {t('pamm:withdraw.performanceFeeNote', 'Solo sobre ganancias encima del High Water Mark')}</p>
                    <p>• Management Fee: <span className="text-white font-semibold">{fund.management_fee || 2}%</span> {t('pamm:withdraw.managementFeeNote', 'anual prorrateado')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                {t('pamm:withdraw.confirmLabel', 'Escribe "CONFIRMAR" para continuar')}
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="CONFIRMAR"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-700 bg-gray-800 text-red-500 focus:ring-red-500 focus:ring-offset-0"
              />
              <span className="text-sm text-gray-300 flex-1">
                {t('pamm:withdraw.terms', 'Entiendo que mi solicitud de retiro será revisada por el manager y que se aplicarán las comisiones correspondientes según las reglas del fondo.')}
              </span>
            </label>
          </div>

          <div className="sticky bottom-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 backdrop-blur-md px-6 py-4 border-t border-gray-700 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-200"
            >
              {t('common:cancel', 'Cancelar')}
            </button>
            <button
              onClick={handleWithdraw}
              disabled={loading || confirmText.toUpperCase() !== 'CONFIRMAR' || !acceptTerms || !twoFactorEnabled}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>{t('common:processing', 'Procesando...')}</span>
                </>
              ) : (
                <span>{t('pamm:withdraw.confirm', 'Solicitar Retiro')}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2FA Modal */}
      {show2FAModal && twoFactorMethods && (
        <TwoFactorWithdrawModal
          isOpen={show2FAModal}
          onClose={() => {
            setShow2FAModal(false);
            setPendingWithdrawal(null);
          }}
          onSuccess={handle2FASuccess}
          userMethods={twoFactorMethods}
          withdrawAmount={`$${withdrawAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
        />
      )}
    </>
  );
};

export default RetirarPAMMModalWithdrawal;
