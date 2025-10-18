import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertTriangle, TrendingDown, DollarSign, Calendar, AlertCircle } from 'lucide-react';

const RetirarPAMMModal = ({ isOpen, onClose, fund, onConfirm }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  if (!isOpen || !fund) return null;

  const handleWithdraw = async () => {
    if (confirmText.toUpperCase() !== 'CONFIRMAR' || !acceptTerms) {
      return;
    }

    setLoading(true);
    try {
      await onConfirm(fund.fund_id || fund.id);
      onClose();
    } catch (error) {
      console.error('Error withdrawing from fund:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentValue = fund.current_value || fund.invested_amount || 0;
  const investedAmount = fund.invested_amount || 0;
  const profitLoss = currentValue - investedAmount;
  const profitLossPercentage = investedAmount > 0 ? ((profitLoss / investedAmount) * 100).toFixed(2) : 0;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-red-500/20">
        <div className="sticky top-0 bg-gradient-to-r from-red-600/20 to-red-800/20 backdrop-blur-md px-6 py-4 border-b border-red-500/20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {t('pamm.withdraw.title', 'Retirar Inversi�n')}
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
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-red-400 font-semibold mb-1">
                {t('pamm.withdraw.warning', 'Advertencia Importante')}
              </h3>
              <p className="text-sm text-gray-300">
                {t('pamm.withdraw.warningText', 'Al retirar tu inversi�n, saldr�s permanentemente de este fondo PAMM. Esta acci�n no se puede deshacer.')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-400">Invertido</span>
              </div>
              <p className="text-2xl font-bold text-white">
                ${investedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-400">Valor Actual</span>
              </div>
              <p className="text-2xl font-bold text-white">
                ${currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className={`bg-gradient-to-br ${profitLoss >= 0 ? 'from-green-500/10 to-green-600/10 border-green-500/20' : 'from-red-500/10 to-red-600/10 border-red-500/20'} border rounded-xl p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className={`w-4 h-4 ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                <span className="text-sm text-gray-400">Ganancia/P�rdida</span>
              </div>
              <p className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {profitLoss >= 0 ? '+' : ''}${profitLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-sm ml-2">({profitLossPercentage}%)</span>
              </p>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-yellow-400 font-semibold mb-2">
                  {t('pamm.withdraw.fees', 'Comisiones Aplicables')}
                </h4>
                <div className="space-y-1 text-sm text-gray-300">
                  <p>• Performance Fee: <span className="text-white font-semibold">{fund.performance_fee || 20}%</span> {profitLoss > 0 && `(~$${((Math.max(0, currentValue - (fund.high_water_mark || investedAmount)) * (fund.performance_fee || 20)) / 100).toFixed(2)})`}</p>
                  <p className="text-xs text-gray-400 ml-4">✓ Solo sobre ganancias encima del High Water Mark</p>
                  <p>• Management Fee: <span className="text-white font-semibold">{fund.management_fee || 2}%</span> anual prorrateado</p>
                </div>
              </div>
            </div>
          </div>

          {/* High Water Mark Visualization */}
          {profitLoss > 0 && (
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-blue-400 font-semibold mb-2">
                    {t('pamm.highWaterMark.title', 'High Water Mark')}
                  </h4>
                  <p className="text-sm text-gray-300 mb-3">
                    {t('pamm.highWaterMark.description', 'Solo pagas Performance Fee sobre ganancias que superen tu pico histórico.')}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Pico Histórico (HWM):</span>
                      <span className="text-white font-semibold">${(fund.high_water_mark || investedAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Ganancia sobre HWM:</span>
                      <span className="text-green-400 font-semibold">
                        +${Math.max(0, currentValue - (fund.high_water_mark || investedAmount)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              {t('pamm.withdraw.confirmLabel', 'Escribe "CONFIRMAR" para continuar')}
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
              {t('pamm.withdraw.terms', 'Entiendo que al retirar mi inversi�n, estar� saliendo permanentemente de este fondo PAMM y se aplicar�n las comisiones correspondientes.')}
            </span>
          </label>
        </div>

        <div className="sticky bottom-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 backdrop-blur-md px-6 py-4 border-t border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-200"
          >
            {t('common.cancel', 'Cancelar')}
          </button>
          <button
            onClick={handleWithdraw}
            disabled={loading || confirmText.toUpperCase() !== 'CONFIRMAR' || !acceptTerms}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>{t('common.processing', 'Procesando...')}</span>
              </>
            ) : (
              <span>{t('pamm.withdraw.confirm', 'Confirmar Retiro')}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RetirarPAMMModal;
