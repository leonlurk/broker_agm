import React, { useState } from 'react';
import { X, DollarSign, User, Calendar, TrendingUp, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { updateWithdrawalStatus } from '../services/pammService';

const PAMMWithdrawalApprovalModal = ({ withdrawal, onClose, onApproved, onRejected }) => {
  const [processing, setProcessing] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  if (!withdrawal) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await updateWithdrawalStatus(withdrawal.id, 'approved');
      onApproved?.(withdrawal);
      onClose();
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      alert('Error al aprobar el retiro');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Por favor ingresa una razón para el rechazo');
      return;
    }

    setProcessing(true);
    try {
      await updateWithdrawalStatus(withdrawal.id, 'rejected', rejectReason);
      onRejected?.(withdrawal, rejectReason);
      onClose();
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      alert('Error al rechazar el retiro');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-70" 
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-2xl z-10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-[#333] flex items-center justify-between sticky top-0 bg-[#1a1a1a] z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <DollarSign className="text-yellow-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Solicitud de Retiro PAMM</h2>
              <p className="text-sm text-gray-400">Requiere tu aprobación</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-center">
            <span className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium flex items-center gap-2">
              <AlertCircle size={16} />
              Pendiente de Aprobación
            </span>
          </div>

          {/* Amount Section */}
          <div className="bg-[#2a2a2a] p-6 rounded-xl text-center">
            <p className="text-gray-400 text-sm mb-2">Monto Solicitado</p>
            <p className="text-4xl font-bold text-white mb-4">
              {formatCurrency(withdrawal.requested_amount)}
            </p>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#333]">
              <div>
                <p className="text-xs text-gray-400 mb-1">Fee de Retiro</p>
                <p className="text-sm font-medium text-red-400">
                  -{formatCurrency(withdrawal.withdrawal_fee || 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">P&L Incluido</p>
                <p className={`text-sm font-medium ${
                  withdrawal.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {withdrawal.profit_loss >= 0 ? '+' : ''}{formatCurrency(withdrawal.profit_loss)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Monto Final</p>
                <p className="text-sm font-medium text-cyan-400">
                  {formatCurrency(withdrawal.final_amount)}
                </p>
              </div>
            </div>
          </div>

          {/* Investor Details */}
          <div className="bg-[#2a2a2a] p-6 rounded-xl space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User size={20} className="text-cyan-500" />
              Información del Inversor
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Nombre</p>
                <p className="text-sm font-medium text-white">
                  {withdrawal.investor_profile?.display_name || 
                   withdrawal.investor_profile?.username || 
                   withdrawal.investor_profile?.email?.split('@')[0] || 
                   'Inversor'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Email</p>
                <p className="text-sm font-medium text-white">
                  {withdrawal.investor_profile?.email || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Inversión Actual</p>
                <p className="text-sm font-medium text-white">
                  {formatCurrency(withdrawal.current_investment)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Fecha de Inversión</p>
                <p className="text-sm font-medium text-white">
                  {withdrawal.investment?.joined_at 
                    ? formatDate(withdrawal.investment.joined_at)
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Withdrawal Details */}
          <div className="bg-[#2a2a2a] p-6 rounded-xl space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-cyan-500" />
              Detalles del Retiro
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Tipo de Retiro</span>
                <span className="text-white font-medium">
                  {withdrawal.withdrawal_type === 'full' ? 'Retiro Total' : 'Retiro Parcial'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fecha de Solicitud</span>
                <span className="text-white font-medium">
                  {formatDate(withdrawal.requested_at)}
                </span>
              </div>
              {withdrawal.payment_method && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Método de Pago</span>
                  <span className="text-white font-medium capitalize">
                    {withdrawal.payment_method}
                  </span>
                </div>
              )}
              {withdrawal.reason && (
                <div className="pt-3 border-t border-[#333]">
                  <p className="text-gray-400 text-sm mb-2">Razón del Retiro</p>
                  <p className="text-white text-sm bg-[#1a1a1a] p-3 rounded-lg">
                    {withdrawal.reason}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Fund Impact */}
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 p-4 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-cyan-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-sm font-medium text-white mb-1">Impacto en el Fondo</p>
                <p className="text-xs text-gray-300">
                  Este retiro {withdrawal.withdrawal_type === 'full' ? 'eliminará completamente' : 'reducirá'} la 
                  participación del inversor en el fondo. Asegúrate de tener suficiente liquidez disponible.
                </p>
              </div>
            </div>
          </div>

          {/* Reject Form */}
          {showRejectForm && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
              <label className="block text-sm font-medium text-white mb-2">
                Razón del Rechazo *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explica por qué estás rechazando esta solicitud..."
                className="w-full bg-[#1a1a1a] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                rows={3}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {!showRejectForm ? (
              <>
                <button
                  onClick={() => setShowRejectForm(true)}
                  disabled={processing}
                  className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <XCircle size={20} />
                  Rechazar
                </button>
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      Aprobar Retiro
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectReason('');
                  }}
                  disabled={processing}
                  className="flex-1 bg-[#333] hover:bg-[#404040] text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing || !rejectReason.trim()}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <XCircle size={20} />
                      Confirmar Rechazo
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PAMMWithdrawalApprovalModal;
