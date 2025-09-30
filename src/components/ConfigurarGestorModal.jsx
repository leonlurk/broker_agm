import React, { useState } from 'react';
import { X, DollarSign, AlertTriangle, TrendingUp, Shield, Users, Clock, Target, Star, Settings } from 'lucide-react';
import { useAccounts } from '../contexts/AccountsContext';
import { supabase } from '../supabase/config';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { configureMaster } from '../services/copytradingService';

const ConfigurarGestorModal = ({ isOpen, onClose, onConfirm }) => {
  const { getAllAccounts } = useAccounts();
  const { user } = useAuth();
  const { t } = useTranslation('copytrading');
  const [formData, setFormData] = useState({
    nombreEstrategia: '',
    descripcionEstrategia: '',
    comisionSolicitada: 25,
    riesgoMaximo: 10,
    drawdownMaximo: 15,
    experienciaRequerida: 'Intermedio',
    mercadosOperados: ['Forex'],
    horariosOperacion: '08:00-18:00 GMT',
    capitalMinimo: 100,
    maximoSeguidores: 100,
    cuentaMT5Seleccionada: '',
    convertirseEnMaster: false
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Obtener cuentas MT5 reales del usuario
  const accounts = getAllAccounts();
  const realAccounts = accounts.filter(acc => 
    acc.account_type === 'Real' || 
    acc.accountType === 'Real' ||
    acc.account_type === 'real' ||
    acc.accountType === 'real'
  );

  const experienciaNiveles = ['Principiante', 'Intermedio', 'Avanzado'];
  const mercadosDisponibles = ['Forex', 'Criptomonedas', 'Acciones', 'Índices', 'Materias Primas'];
  const horariosDisponibles = ['24/7', '08:00-18:00 GMT', '14:00-22:00 GMT', 'Solo sesión europea', 'Solo sesión americana'];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleMercadoChange = (mercado) => {
    setFormData(prev => ({
      ...prev,
      mercadosOperados: prev.mercadosOperados.includes(mercado)
        ? prev.mercadosOperados.filter(m => m !== mercado)
        : [...prev.mercadosOperados, mercado]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombreEstrategia.trim()) {
      newErrors.nombreEstrategia = t('copyTrading.errors.strategyNameRequired');
    }

    if (!formData.descripcionEstrategia.trim()) {
      newErrors.descripcionEstrategia = t('copyTrading.errors.descriptionRequired');
    }

    if (formData.descripcionEstrategia.length < 30) {
      newErrors.descripcionEstrategia = t('copyTrading.errors.descriptionMinLength');
    }

    if (!formData.comisionSolicitada || formData.comisionSolicitada < 0 || formData.comisionSolicitada > 50) {
      newErrors.comisionSolicitada = t('copyTrading.errors.commissionRange');
    }

    if (!formData.riesgoMaximo || formData.riesgoMaximo < 1 || formData.riesgoMaximo > 50) {
      newErrors.riesgoMaximo = t('copyTrading.errors.riskRange');
    }

    if (!formData.drawdownMaximo || formData.drawdownMaximo < 1 || formData.drawdownMaximo > 50) {
      newErrors.drawdownMaximo = t('copyTrading.errors.drawdownRange');
    }

    if (formData.mercadosOperados.length === 0) {
      newErrors.mercadosOperados = t('copyTrading.errors.selectMarket');
    }

    if (!formData.capitalMinimo || formData.capitalMinimo < 10) {
      newErrors.capitalMinimo = t('copyTrading.errors.minCapitalAmount');
    }

    if (!formData.maximoSeguidores || formData.maximoSeguidores < 1 || formData.maximoSeguidores > 1000) {
      newErrors.maximoSeguidores = t('copyTrading.errors.maxFollowersRange');
    }

    if (formData.convertirseEnMaster && !formData.cuentaMT5Seleccionada) {
      newErrors.cuentaMT5Seleccionada = t('copyTrading.errors.selectMT5Account');
    }

    if (realAccounts.length === 0) {
      newErrors.cuentaMT5Seleccionada = t('copyTrading.errors.needRealAccount');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    console.log('User:', user);
    console.log('Convert to master:', formData.convertirseEnMaster);
    
    if (!validateForm()) {
      console.log('Form validation failed:', errors);
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Si el usuario quiere convertirse en master trader, configurar a través del backend
      if (formData.convertirseEnMaster) {
        console.log('Calling configureMaster with data:', formData);
        try {
          const result = await configureMaster(formData);
          console.log('Master trader configured successfully:', result);
          alert(t('copyTrading.manager.successMessage') || '¡Master trader configurado exitosamente!');
        } catch (backendError) {
          console.error('Error configuring master trader:', backendError);
          alert(t('copyTrading.errors.configError') + ': ' + (backendError.error || backendError.message || 'Error desconocido'));
          return;
        }
      } else {
        console.log('Not converting to master - toggle is off');
      }
      
      onConfirm(formData);
      onClose();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      alert(t('copyTrading.errors.saveError') + ': ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#232323] rounded-2xl border border-[#333] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#333]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500 bg-opacity-20 rounded-lg">
              <Star className="text-cyan-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{t('copyTrading.manager.configureStrategy')}</h2>
              <p className="text-sm text-gray-400">{t('copyTrading.manager.description')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#333] rounded-lg transition-colors"
          >
            <X className="text-gray-400" size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Toggle Convertirse en Master Trader */}
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">{t('copyTrading.manager.becomeMasterTrader')}</h3>
                <p className="text-sm text-gray-400">{t('copyTrading.manager.becomeMasterDescription')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.convertirseEnMaster}
                  onChange={(e) => handleInputChange('convertirseEnMaster', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>
          </div>

          {/* Selección de Cuenta MT5 Master */}
          {formData.convertirseEnMaster && (
            <div className="bg-[#2a2a2a] border border-[#333] rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <TrendingUp className="text-cyan-500" size={20} />
                {t('copyTrading.manager.strategyInformation')}
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                {t('copyTrading.manager.masterAccountDescription')}
              </p>
              
              {realAccounts.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={formData.cuentaMT5Seleccionada}
                    onChange={(e) => handleInputChange('cuentaMT5Seleccionada', e.target.value)}
                    className="w-full px-4 py-3 bg-[#1C1C1C] border border-[#333] rounded-lg text-white focus:border-cyan-500 focus:outline-none hover:bg-[#252525] transition-colors"
                  >
                    <option value="">{t('copyTrading.manager.selectMT5Account')}</option>
                    {realAccounts.map((account) => (
                      <option key={account.id} value={account.accountNumber || account.account_number || account.login}>
                        {account.name || account.accountName || account.account_name || `Account ${account.accountNumber || account.account_number || account.login}`} - ${account.balance?.toLocaleString() || '0'} USD (Leverage 1:{account.leverage})
                      </option>
                    ))}
                  </select>
                  
                  {/* Mostrar detalles de la cuenta seleccionada */}
                  {formData.cuentaMT5Seleccionada && (
                    <div className="mt-4 p-4 bg-[#1a1a1a] border border-cyan-500/30 rounded-lg">
                      {(() => {
                        const selectedAccount = realAccounts.find(acc => (acc.accountNumber || acc.account_number || acc.login) === formData.cuentaMT5Seleccionada);
                        return selectedAccount ? (
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-white">{selectedAccount.name || selectedAccount.accountName || selectedAccount.account_name || `Account ${selectedAccount.accountNumber || selectedAccount.account_number || selectedAccount.login}`}</h4>
                              <p className="text-sm text-gray-400">#{selectedAccount.accountNumber || selectedAccount.account_number || selectedAccount.login}</p>
                              <p className="text-xs text-gray-500">{selectedAccount.accountTypeSelection || 'Standard'} • Leverage 1:{selectedAccount.leverage}</p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-cyan-400 font-semibold">
                                <DollarSign size={16} />
                                <span>{selectedAccount.balance?.toLocaleString() || '0'}</span>
                              </div>
                              <p className="text-xs text-gray-400">{t('copyTrading.manager.balance')} USD</p>
                            </div>
                          </div>
                        ) : null;
                      })()
                      }
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="mx-auto mb-4 text-yellow-500" size={48} />
                  <h3 className="text-lg font-semibold text-white mb-2">{t('copyTrading.manager.noRealAccounts')}</h3>
                  <p className="text-gray-400 mb-4">
                    {t('copyTrading.manager.needRealAccountMessage')}
                  </p>
                </div>
              )}
              
              {errors.cuentaMT5Seleccionada && (
                <p className="text-red-400 text-sm flex items-center gap-1 mt-3">
                  <AlertTriangle size={14} />
                  {errors.cuentaMT5Seleccionada}
                </p>
              )}
            </div>
          )}

          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-[#333] pb-2">
              {t('copyTrading.manager.strategyInformation')}
            </h3>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                {t('copyTrading.manager.strategyName')} *
              </label>
              <input
                type="text"
                value={formData.nombreEstrategia}
                onChange={(e) => handleInputChange('nombreEstrategia', e.target.value)}
                placeholder={t('copyTrading.manager.strategyNamePlaceholder')}
                className="w-full px-4 py-3 bg-[#1C1C1C] border border-[#333] rounded-lg text-white focus:border-cyan-500 focus:outline-none hover:bg-[#252525] transition-colors"
              />
              {errors.nombreEstrategia && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {errors.nombreEstrategia}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                {t('copyTrading.manager.strategyDescription')} *
              </label>
              <textarea
                value={formData.descripcionEstrategia}
                onChange={(e) => handleInputChange('descripcionEstrategia', e.target.value)}
                placeholder={t('copyTrading.manager.strategyDescriptionPlaceholder')}
                rows={4}
                className="w-full px-4 py-3 bg-[#1C1C1C] border border-[#333] rounded-lg text-white focus:border-cyan-500 focus:outline-none hover:bg-[#252525] transition-colors resize-none"
              />
              <p className="text-xs text-gray-500">
                {formData.descripcionEstrategia.length}/500 {t('copyTrading.manager.characterCount')}
              </p>
              {errors.descripcionEstrategia && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {errors.descripcionEstrategia}
                </p>
              )}
            </div>
          </div>

          {/* Configuración de Riesgo */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-[#333] pb-2">
              {t('copyTrading.manager.riskConfiguration')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  {t('copyTrading.manager.commissionRequested')}
                </label>
                <input
                  type="number"
                  value={formData.comisionSolicitada}
                  onChange={(e) => handleInputChange('comisionSolicitada', Number(e.target.value))}
                  className="w-full px-4 py-3 bg-[#1C1C1C] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none hover:bg-[#252525] transition-colors"
                  placeholder="25"
                  min="0"
                  max="50"
                />
                {errors.comisionSolicitada && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {errors.comisionSolicitada}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  {t('copyTrading.manager.maxRisk')}
                </label>
                <input
                  type="number"
                  value={formData.riesgoMaximo}
                  onChange={(e) => handleInputChange('riesgoMaximo', Number(e.target.value))}
                  className="w-full px-4 py-3 bg-[#1C1C1C] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none hover:bg-[#252525] transition-colors"
                  placeholder="10"
                  min="1"
                  max="50"
                />
                {errors.riesgoMaximo && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {errors.riesgoMaximo}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                {t('copyTrading.manager.maxDrawdownConfig')}
              </label>
              <input
                type="number"
                value={formData.drawdownMaximo}
                onChange={(e) => handleInputChange('drawdownMaximo', Number(e.target.value))}
                className="w-full px-4 py-3 bg-[#1C1C1C] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none hover:bg-[#252525] transition-colors"
                placeholder="15"
                min="1"
                max="50"
              />
              {errors.drawdownMaximo && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {errors.drawdownMaximo}
                </p>
              )}
            </div>
          </div>

          {/* Mercados y Horarios */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-[#333] pb-2">
              {t('copyTrading.manager.marketsAndSchedules')}
            </h3>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                {t('copyTrading.manager.operatedMarkets')} *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {mercadosDisponibles.map((mercado) => (
                  <label key={mercado} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.mercadosOperados.includes(mercado)}
                      onChange={() => handleMercadoChange(mercado)}
                      className="w-5 h-5 text-cyan-500 bg-[#2a2a2a] border-[#333] rounded focus:ring-cyan-500 focus:ring-2"
                    />
                    <span className="text-white font-medium">{mercado === 'Forex' ? t('copyTrading.manager.markets.Forex') : mercado === 'Criptomonedas' ? t('copyTrading.manager.markets.Criptomonedas') : mercado === 'Acciones' ? t('copyTrading.manager.markets.Acciones') : mercado === 'Índices' ? t('copyTrading.manager.markets.Índices') : mercado === 'Materias Primas' ? t('copyTrading.manager.markets.Materias Primas') : mercado}</span>
                  </label>
                ))}
              </div>
              {errors.mercadosOperados && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {errors.mercadosOperados}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                {t('copyTrading.manager.operatingHours')}
              </label>
              <select
                value={formData.horariosOperacion}
                onChange={(e) => handleInputChange('horariosOperacion', e.target.value)}
                className="w-full px-4 py-3 bg-[#1C1C1C] border border-[#333] rounded-lg text-white focus:border-cyan-500 focus:outline-none hover:bg-[#252525] transition-colors"
              >
                {horariosDisponibles.map((horario) => (
                  <option key={horario} value={horario}>{horario === '24/7' ? t('copyTrading.manager.schedules.24/7') : horario === '08:00-18:00 GMT' ? t('copyTrading.manager.schedules.08:00-18:00 GMT') : horario === '14:00-22:00 GMT' ? t('copyTrading.manager.schedules.14:00-22:00 GMT') : horario === 'Solo sesión europea' ? t('copyTrading.manager.schedules.Solo sesión europea') : horario === 'Solo sesión americana' ? t('copyTrading.manager.schedules.Solo sesión americana') : horario}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Configuración de Seguidores */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-[#333] pb-2">
              {t('copyTrading.manager.followersConfiguration')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  {t('copyTrading.manager.minCapital')}
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="number"
                    value={formData.capitalMinimo}
                    onChange={(e) => handleInputChange('capitalMinimo', Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 bg-[#1C1C1C] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none hover:bg-[#252525] transition-colors"
                    placeholder="100"
                    min="10"
                  />
                </div>
                {errors.capitalMinimo && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {errors.capitalMinimo}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  {t('copyTrading.manager.maxFollowers')}
                </label>
                <input
                  type="number"
                  value={formData.maximoSeguidores}
                  onChange={(e) => handleInputChange('maximoSeguidores', Number(e.target.value))}
                  className="w-full px-4 py-3 bg-[#1C1C1C] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none hover:bg-[#252525] transition-colors"
                  placeholder="100"
                  min="1"
                  max="1000"
                />
                {errors.maximoSeguidores && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {errors.maximoSeguidores}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                {t('copyTrading.manager.requiredExperience')}
              </label>
              <select
                value={formData.experienciaRequerida}
                onChange={(e) => handleInputChange('experienciaRequerida', e.target.value)}
                className="w-full px-4 py-3 bg-[#1C1C1C] border border-[#333] rounded-lg text-white focus:border-cyan-500 focus:outline-none hover:bg-[#252525] transition-colors"
              >
                {experienciaNiveles.map((nivel) => (
                  <option key={nivel} value={nivel}>{nivel === 'Principiante' ? t('copyTrading.manager.experienceLevels.Principiante') : nivel === 'Intermedio' ? t('copyTrading.manager.experienceLevels.Intermedio') : nivel === 'Avanzado' ? t('copyTrading.manager.experienceLevels.Avanzado') : nivel}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-[#333] hover:bg-[#444] text-white rounded-lg transition-colors"
            >
              {t('copyTrading.manager.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('copyTrading.manager.configuring')}
                </>
              ) : (
                t('copyTrading.manager.configureStrategy')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfigurarGestorModal; 