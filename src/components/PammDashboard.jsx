import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, ArrowUp, TrendingUp, TrendingDown, Users, User, MoreHorizontal, Pause, StopCircle, Eye, Search, Filter, SlidersHorizontal, Star, Copy, TrendingUp as TrendingUpIcon, BarChart3, Activity, History, MessageSquare, Shield, Award, Calendar, DollarSign, Crown, CheckCircle, Settings, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, BarChart, Bar, CartesianGrid } from 'recharts';
import { getPammFunds, getMyFunds, leavePammFund, joinPammFund, getFundDetails } from '../services/pammService';
import InvertirPAMMModal from './InvertirPAMMModal';
import RetirarPAMMModal from './RetirarPAMMModal';
import PammInvestorMessaging from './PammInvestorMessaging';
import { useAccounts } from '../contexts/AccountsContext';
import { useTranslation } from 'react-i18next';
import { followMaster } from '../services/copytradingService';
import { scrollToTopManual } from '../hooks/useScrollToTop';
import { MasterAccountBadge, PerformanceStatusIndicator, MasterAccountSummaryCard } from './StatusIndicators';

const PammDashboard = ({ setSelectedOption, navigationParams, setNavigationParams, scrollContainerRef }) => {
    const { t } = useTranslation('pamm');
    const [view, setView] = useState('dashboard'); // dashboard, explorer, fundProfile
    const [selectedFund, setSelectedFund] = useState(null);
    const [chartPeriod, setChartPeriod] = useState('1M');
    const [showDropdown, setShowDropdown] = useState({});
    
    // Explorer states
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        performance: { min: '', max: '' },
        riskLevel: '',
        fundType: '',
        aum: { min: '', max: '' },
        investors: { min: '' },
        maxDrawdown: { max: '' }
    });
    const [filteredFunds, setFilteredFunds] = useState([]);
    const [myFunds, setMyFunds] = useState({ summary: {}, funds: [] });
    const [userMasterFunds, setUserMasterFunds] = useState([]);
    const [fundCreationSuccess, setFundCreationSuccess] = useState(false);
    const [isLoadingMyFunds, setIsLoadingMyFunds] = useState(false);
    
    // Estado para rastrear fondos en los que se está invirtiendo
    const [investedFunds, setInvestedFunds] = useState(new Set());
    
    // Fund Profile states
    const [activeTab, setActiveTab] = useState('performance');

    // Investment Modal states
    const [showInvertirModal, setShowInvertirModal] = useState(false);
    const [selectedFundForInvest, setSelectedFundForInvest] = useState(null);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [selectedFundForWithdraw, setSelectedFundForWithdraw] = useState(null);

    // Efecto para hacer scroll hacia arriba cuando cambie la vista
    useEffect(() => {
        scrollToTopManual(scrollContainerRef);
    }, [view, selectedFund]);

    // Cargar fondos PAMM del usuario para el dashboard
    useEffect(() => {
        const fetchMyFunds = async () => {
            if (view !== 'dashboard') return;
            
            try {
                setIsLoadingMyFunds(true);
                const myFundsData = await getMyFunds();
                setMyFunds(myFundsData);
            } catch (error) {
                console.error('Error loading my PAMM funds:', error);
                console.error('Error details:', error.response?.data || error.message);
                // Mantener datos vacíos en caso de error
                setMyFunds({ summary: {}, funds: [] });
            } finally {
                setIsLoadingMyFunds(false);
            }
        };

        fetchMyFunds();
    }, [view]);

    const handleExploreFunds = () => {
        setView('explorer');
    };

    const handleBackToDashboard = () => {
        setView('dashboard');
        setSelectedFund(null);
    };

    const handleViewFundDetails = async (fund) => {
        console.log('Viewing fund details:', fund);
        try {
            if (fund && fund.id) {
                setView('fundProfile');
                
                // Usar datos del fondo directamente (ya vienen del explorador o dashboard)
                // Enriquecer con datos calculados si es necesario
                const enrichedFund = {
                    ...fund,
                    // Asegurar que existan todos los campos necesarios
                    aum: fund.current_aum || fund.aum || 0,
                    totalReturn: fund.total_return || fund.totalReturn || 0,
                    investors: fund.investor_count || fund.investors || 0,
                    riskLevel: fund.risk_level || fund.riskLevel || 'Medium',
                    managementFee: fund.management_fee || fund.managementFee || 2,
                    performanceFee: fund.performance_fee || fund.performanceFee || 20,
                    monthlyReturn: fund.monthly_return || fund.monthlyReturn || 0,
                    maxDrawdown: fund.max_drawdown || fund.maxDrawdown || 0,
                    sharpeRatio: fund.sharpe_ratio || fund.sharpeRatio || 0,
                    winRate: fund.win_rate || fund.winRate || 0
                };
                
                setSelectedFund(enrichedFund);
            } else {
                console.error('Invalid fund data:', fund);
            }
        } catch (error) {
            console.error('Error in handleViewFundDetails:', error);
        }
    };

    const toggleDropdown = (fundId) => {
        setShowDropdown(prev => ({
            ...prev,
            [fundId]: !prev[fundId]
        }));
    };

    const formatCurrency = (value) => {
        if (value === null || value === undefined || isNaN(value)) {
            return '$0.00';
        }
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value);
    };

    const formatPercentage = (value) => {
        if (value === null || value === undefined || isNaN(value)) {
            return '0.0%';
        }
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(1)}%`;
    };

    const formatAUM = (value) => {
        if (value === null || value === undefined || isNaN(value)) {
            return '$0';
        }
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
            return `$${(value / 1000).toFixed(0)}K`;
        }
        return formatCurrency(value);
    };

    const getRiskColor = (risk) => {
        switch (risk) {
            case 'Bajo': return 'text-green-400';
            case 'Moderado': return 'text-yellow-400';
            case 'Alto': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    const handleInvestInFund = (fund) => {
        if (investedFunds.has(fund.id)) {
            return; // Ya está invertido
        }
        console.log('[PammDashboard] Opening investment modal for fund:', fund.name);
        console.log('[PammDashboard] Fund data:', fund);
        setSelectedFundForInvest(fund);
        setShowInvertirModal(true);
        console.log('[PammDashboard] Modal state set to true');
    };

    const handleWithdrawFromFund = (fund) => {
        setSelectedFundForWithdraw(fund);
        setShowWithdrawModal(true);
    };

    const handleConfirmWithdraw = async (fundId) => {
        try {
            await leavePammFund(fundId);
            // Actualizar lista de fondos
            setInvestedFunds(prev => {
                const newSet = new Set(prev);
                newSet.delete(fundId);
                return newSet;
            });
            // Recargar mis fondos
            const updatedFunds = await getMyFunds();
            setMyFunds(updatedFunds);
            setShowWithdrawModal(false);
            setSelectedFundForWithdraw(null);
        } catch (error) {
            console.error('Error withdrawing from fund:', error);
            alert(error.message || 'Error al retirar del fondo');
        }
    };

    // Render current view
    let currentView;
    if (view === 'dashboard') {
        currentView = <PammDashboardView
            formatCurrency={formatCurrency}
            formatPercentage={formatPercentage}
            formatAUM={formatAUM}
            onExploreFunds={handleExploreFunds}
            chartPeriod={chartPeriod}
            setChartPeriod={setChartPeriod}
            onViewFundDetails={handleViewFundDetails}
            handleWithdrawFromFund={handleWithdrawFromFund}
            showDropdown={showDropdown}
            toggleDropdown={toggleDropdown}
            t={t}
            myFunds={myFunds}
            isLoadingMyFunds={isLoadingMyFunds}
        />;
    } else if (view === 'explorer') {
        currentView = <PammExplorerView
            formatCurrency={formatCurrency}
            formatPercentage={formatPercentage}
            formatAUM={formatAUM}
            getRiskColor={getRiskColor}
            onBackToDashboard={handleBackToDashboard}
            onViewFundDetails={handleViewFundDetails}
            onInvestInFund={handleInvestInFund}
            investedFunds={investedFunds}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            filters={filters}
            setFilters={setFilters}
            filteredFunds={filteredFunds}
            t={t}
        />;
    } else if (view === 'fundProfile' && selectedFund) {
        currentView = <PammFundProfileView
            fund={selectedFund}
            formatCurrency={formatCurrency}
            formatPercentage={formatPercentage}
            formatAUM={formatAUM}
            getRiskColor={getRiskColor}
            onBackToDashboard={handleBackToDashboard}
            onInvestInFund={handleInvestInFund}
            investedFunds={investedFunds}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            t={t}
        />;
    } else {
        // Fallback
        currentView = (
            <div className="p-4 md:p-6 bg-[#232323] text-white rounded-3xl border border-[#333]">
                <p className="text-gray-400">{t('pamm.errors.viewNotFound')}</p>
            </div>
        );
    }

    // Always render modals alongside the current view
    return (
        <>
            {currentView}

            {/* Modal de Invertir en PAMM - Always rendered */}
            <InvertirPAMMModal
                isOpen={showInvertirModal}
                onClose={() => {
                    console.log('[PammDashboard] Closing investment modal');
                    setShowInvertirModal(false);
                    setSelectedFundForInvest(null);
                }}
                gestor={selectedFundForInvest}
                onConfirm={async (formData) => {
                    try {
                        console.log('[PammDashboard] Confirming investment with data:', formData);
                        console.log('[PammDashboard] Selected fund:', selectedFundForInvest);

                        if (!selectedFundForInvest) {
                            return { success: false, error: 'No se seleccionó ningún fondo' };
                        }

                        const fundId = selectedFundForInvest.id || selectedFundForInvest.fund_id;
                        const accountId = parseInt(formData.cuentaMT5Seleccionada);
                        const amount = parseFloat(formData.montoInversion);

                        console.log('[PammDashboard] Raw form data:', formData);
                        console.log('[PammDashboard] Parsed values:', {
                            fundId,
                            accountId,
                            amount,
                            isAccountIdValid: !isNaN(accountId),
                            isAmountValid: !isNaN(amount)
                        });

                        // Validate parsed values
                        if (!fundId) {
                            return { success: false, error: 'ID del fondo no válido' };
                        }
                        if (isNaN(accountId) || !accountId) {
                            return { success: false, error: 'Cuenta MT5 no válida. Por favor seleccione una cuenta.' };
                        }
                        if (isNaN(amount) || amount <= 0) {
                            return { success: false, error: 'Monto de inversión no válido' };
                        }

                        // Usar joinPammFund para PAMM (no followMaster que es para copy trading)
                        const response = await joinPammFund(fundId, accountId, amount);

                        console.log('[PammDashboard] Join response:', response);

                        if (response.message || response.investment || response.success) {
                            // Marcar fondo como invertido
                            setInvestedFunds(prev => new Set([...prev, selectedFundForInvest.id]));

                            // Recargar mis fondos
                            const updatedFunds = await getMyFunds();
                            setMyFunds(updatedFunds);

                            return { success: true };
                        } else {
                            return { success: false, error: response.error || 'Error al invertir en el fondo PAMM' };
                        }
                    } catch (error) {
                        console.error('[PammDashboard] Error invirtiendo en PAMM:', error);
                        return { success: false, error: error.message || 'Error desconocido' };
                    }
                }}
            />

            {/* Modal de Retirar de PAMM - Always rendered */}
            <RetirarPAMMModal
                isOpen={showWithdrawModal}
                onClose={() => {
                    setShowWithdrawModal(false);
                    setSelectedFundForWithdraw(null);
                }}
                fund={selectedFundForWithdraw}
                onConfirm={handleConfirmWithdraw}
            />
        </>
    );
};

// Estados iniciales vacíos - datos dinámicos desde la API
const initialPammPortfolioData = {
    totalBalance: 0,
    totalPnL: 0,
    totalPnLPercentage: 0,
    activeCapital: 0
};

const PammDashboardView = ({
    formatCurrency,
    formatPercentage,
    formatAUM,
    onExploreFunds,
    chartPeriod,
    setChartPeriod,
    onViewFundDetails,
    handleWithdrawFromFund,
    t,
    myFunds = { summary: {}, funds: [] },
    isLoadingMyFunds = false
}) => {
    // Usar datos dinámicos del prop myFunds
    const portfolioData = myFunds.summary || initialPammPortfolioData;
    const investedFundsArray = myFunds.funds || [];

    // Generar datos mock para el gráfico si no hay datos reales
    const generateMockHistoricalData = () => {
        const data = [];
        const baseValue = portfolioData.total_invested || 10000;
        const days = 30;

        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (days - 1 - i));
            const randomVariation = (Math.random() - 0.48) * 200; // Ligera tendencia alcista
            const value = baseValue + (i * 50) + randomVariation;

            data.push({
                date: date.toISOString().split('T')[0],
                value: Math.max(value, baseValue * 0.95) // No menos del 95% del valor base
            });
        }
        return data;
    };

    const historicalData = myFunds.historicalData && myFunds.historicalData.length > 0
        ? myFunds.historicalData
        : generateMockHistoricalData();
    return (
        <div className="p-4 md:p-6 bg-[#232323] text-white rounded-3xl border border-[#333]">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="flex-1">
                        <h1 className="text-3xl font-semibold mb-3">{t('pamm.dashboard')}</h1>
                        <div className="space-y-2">
                            <p className="text-gray-300 font-medium">{t('pamm.subtitle')}</p>
                            <p className="text-gray-400 max-w-2xl">
                                {t('pamm.investor.description')}
                            </p>
                        </div>
                    </div>
                    <div className="flex-shrink-0">
                        <button
                            onClick={onExploreFunds}
                            className="bg-gradient-to-r from-[#0F7490] to-[#0A5A72] text-white py-3 px-8 rounded-xl hover:opacity-90 transition-opacity text-lg font-medium flex items-center gap-2"
                        >
                            <Eye size={20} />
                            {t('pamm.exploreFunds')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Widget 1: Resumen de Portafolio PAMM */}
            <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">{t('pamm.portfolio')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-[#1C1C1C] rounded-xl p-4 border border-[#333]">
                        <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide">Total Invertido</p>
                        <p className="text-2xl font-bold text-white">{formatCurrency(portfolioData.total_invested || portfolioData.totalBalance || 0)}</p>
                    </div>
                    <div className="bg-[#1C1C1C] rounded-xl p-4 border border-[#333]">
                        <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide">Valor Actual</p>
                        <p className="text-2xl font-bold text-white">{formatCurrency(portfolioData.total_current_value || portfolioData.activeCapital || 0)}</p>
                    </div>
                    <div className="bg-[#1C1C1C] rounded-xl p-4 border border-[#333]">
                        <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide">{t('pamm.totalPnL')}</p>
                        <div className="flex items-center gap-2">
                            <p className={`text-2xl font-bold ${(portfolioData.total_pnl || portfolioData.totalPnL || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {formatCurrency(portfolioData.total_pnl || portfolioData.totalPnL || 0)}
                            </p>
                            {(portfolioData.total_pnl || portfolioData.totalPnL || 0) >= 0 ?
                                <ArrowUp size={20} className="text-green-500" /> :
                                <TrendingDown size={20} className="text-red-500" />
                            }
                        </div>
                        <p className={`text-sm font-medium mt-1 ${(portfolioData.total_pnl || portfolioData.totalPnL || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {formatPercentage(portfolioData.total_pnl_percentage || portfolioData.totalPnLPercentage || 0)}
                        </p>
                    </div>
                    <div className="bg-[#1C1C1C] rounded-xl p-4 border border-[#333]">
                        <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide">Fondos Activos</p>
                        <div className="flex items-center gap-2">
                            <p className="text-2xl font-bold text-white">{portfolioData.active_funds || investedFundsArray.length || 0}</p>
                            <Users size={20} className="text-cyan-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Widget 2: Mis Fondos PAMM */}
            <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-cyan-400">{t('pamm.myFunds')}</h2>
                    {investedFundsArray.length > 0 && (
                        <span className="text-sm text-gray-400">
                            {investedFundsArray.length} {investedFundsArray.length === 1 ? 'fondo activo' : 'fondos activos'}
                        </span>
                    )}
                </div>

                {investedFundsArray.length === 0 ? (
                    /* Empty State */
                    <div className="text-center py-12">
                        <div className="w-20 h-20 bg-[#333] rounded-full flex items-center justify-center mx-auto mb-4">
                            <TrendingUp size={40} className="text-gray-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-300 mb-2">No hay inversiones activas</h3>
                        <p className="text-gray-400 mb-6 max-w-md mx-auto">
                            Comienza a invertir en fondos PAMM gestionados por traders experimentados
                        </p>
                        <button
                            onClick={onExploreFunds}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center gap-2"
                        >
                            <Eye size={18} />
                            Explorar Fondos
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {investedFundsArray.map((fund) => (
                            <div key={fund.id} className="bg-[#1C1C1C] rounded-xl border border-[#333] overflow-hidden hover:border-cyan-600/50 transition-all duration-200">
                                {/* Header */}
                                <div className="p-5 border-b border-[#333]">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <span className="text-white font-bold text-xl">{(fund.fund_name || fund.name || 'F').charAt(0)}</span>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-white mb-1">{fund.fund_name || fund.name || 'Sin nombre'}</h3>
                                                <p className="text-sm text-gray-400 flex items-center gap-1">
                                                    <User size={14} />
                                                    {typeof fund.manager === 'string' ? fund.manager : (fund.manager?.name || fund.manager?.display_name || 'Manager')}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            fund.status === 'active'
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                        }`}>
                                            {fund.status === 'active' ? t('pamm.status.active') : t('pamm.status.paused')}
                                        </span>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-[#191919]">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Inversión Inicial</p>
                                        <p className="text-base font-semibold text-white">{formatCurrency(fund.invested_amount || fund.investedAmount || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Valor Actual</p>
                                        <p className="text-base font-semibold text-white">{formatCurrency(fund.current_value || fund.invested_amount || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Ganancia/Pérdida</p>
                                        <div className="flex items-center gap-2">
                                            <p className={`text-base font-semibold ${(fund.profit_loss || fund.personalPnL || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {formatCurrency(fund.profit_loss || fund.personalPnL || 0)}
                                            </p>
                                            {(fund.profit_loss || fund.personalPnL || 0) >= 0 ?
                                                <ArrowUp size={16} className="text-green-500" /> :
                                                <TrendingDown size={16} className="text-red-500" />
                                            }
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Rendimiento</p>
                                        <p className={`text-base font-semibold ${(fund.profit_loss || fund.personalPnL || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {formatPercentage(fund.profit_loss_percentage || fund.personalPnLPercentage || 0)}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between p-4 bg-[#1C1C1C] border-t border-[#333]">
                                    <div className="text-xs text-gray-500">
                                        {fund.joined_at && (
                                            <span>Invertido: {new Date(fund.joined_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => onViewFundDetails(fund)}
                                            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
                                        >
                                            <Eye size={16} />
                                            Ver Detalles
                                        </button>
                                        <button
                                            onClick={() => handleWithdrawFromFund(fund)}
                                            className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/30 hover:border-red-600/50 rounded-lg transition-all duration-200 text-sm font-medium"
                                        >
                                            Retirar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Widget 3: Gráfico de Rendimiento Histórico */}
            <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl border border-[#333] p-6 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <h2 className="text-xl font-semibold text-cyan-400 mb-4 sm:mb-0">{t('pamm.investor.historicalPerformance')}</h2>
                    <div className="flex gap-2">
                        {['1M', '3M', '6M', '1A'].map((period) => (
                            <button
                                key={period}
                                onClick={() => setChartPeriod(period)}
                                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                    chartPeriod === period
                                        ? 'bg-cyan-600 text-white'
                                        : 'bg-[#333] text-gray-400 hover:text-white'
                                }`}
                            >
                                {period}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="h-64">
                    {isLoadingMyFunds ? (
                        // Skeleton loading for chart
                        <div className="w-full h-full animate-pulse">
                            <div className="flex items-end justify-between h-full gap-2">
                                {Array.from({ length: 15 }).map((_, index) => (
                                    <div
                                        key={index}
                                        className="flex-1 bg-[#333] rounded-t"
                                        style={{
                                            height: `${Math.random() * 60 + 30}%`,
                                            opacity: 0.3 + Math.random() * 0.3
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={historicalData}>
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1C1C1C',
                                        border: '1px solid #333',
                                        borderRadius: '8px',
                                        color: '#ffffff'
                                    }}
                                    formatter={(value) => [formatCurrency(value), t('pamm.portfolioValue')]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#22d3ee"
                                    strokeWidth={2}
                                    fill="#22d3ee"
                                    fillOpacity={0.1}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Botón CTA Principal */}
            <div className="text-center">
                <button
                    onClick={onExploreFunds}
                    className="bg-gradient-to-r from-[#0F7490] to-[#0A5A72] text-white py-3 px-8 rounded-xl hover:opacity-90 transition-opacity text-lg font-medium"
                >
                    {t('pamm.exploreFunds')}
                </button>
            </div>
        </div>
    );
};

// Los fondos PAMM se cargan dinámicamente desde la API

const PammExplorerView = ({ 
    formatCurrency, 
    formatPercentage, 
    formatAUM, 
    getRiskColor, 
    onBackToDashboard, 
    onViewFundDetails, 
    onInvestInFund,
    investedFunds,
    searchTerm,
    setSearchTerm,
    showFilters,
    setShowFilters,
    filters,
    setFilters,
    t,
    availableFunds = []
}) => {
    const [expandedFund, setExpandedFund] = useState(null);
    const [isLoadingFunds, setIsLoadingFunds] = useState(true);
    const [funds, setFunds] = useState([]);
    
    // Custom dropdown states
    const [showFundTypeDropdown, setShowFundTypeDropdown] = useState(false);
    const [showRiskLevelDropdown, setShowRiskLevelDropdown] = useState(false);
    
    // Dropdown refs
    const fundTypeDropdownRef = useRef(null);
    const riskLevelDropdownRef = useRef(null);
    
    // Cargar fondos PAMM disponibles
    useEffect(() => {
        const fetchAvailableFunds = async () => {
            try {
                setIsLoadingFunds(true);
                const fundsData = await getPammFunds();
                setFunds(fundsData);
            } catch (error) {
                console.error('Error loading PAMM funds:', error);
                setFunds([]);
            } finally {
                setIsLoadingFunds(false);
            }
        };
        
        fetchAvailableFunds();
    }, []);
    
    const getTypeColor = (type) => {
        switch (type) {
            case 'Premium': return 'bg-purple-600';
            case 'Verificado': return 'bg-blue-600';
            case 'Nuevo': return 'bg-green-600';
            default: return 'bg-gray-600';
        }
    };
    
    // Handle click outside for dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (fundTypeDropdownRef.current && !fundTypeDropdownRef.current.contains(event.target)) {
                setShowFundTypeDropdown(false);
            }
            if (riskLevelDropdownRef.current && !riskLevelDropdownRef.current.contains(event.target)) {
                setShowRiskLevelDropdown(false);
            }
        };

        if (showFundTypeDropdown || showRiskLevelDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showFundTypeDropdown, showRiskLevelDropdown]);
    
    const toggleExpandFund = (fundId) => {
        setExpandedFund(expandedFund === fundId ? null : fundId);
    };
    
    const filteredFunds = funds.filter(fund => {
        const managerName = fund.manager?.name || fund.manager?.display_name || '';
        const matchesSearch = searchTerm === '' ||
            fund.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            managerName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRisk = !filters.riskLevel || fund.riskLevel === filters.riskLevel;
        const matchesType = !filters.fundType || fund.type === filters.fundType;
        const matchesAUM = (!filters.aum.min || fund.aum >= parseFloat(filters.aum.min)) &&
                          (!filters.aum.max || fund.aum <= parseFloat(filters.aum.max));

        return matchesSearch && matchesRisk && matchesType && matchesAUM;
    });
    
    const renderFundCard = (fund) => {
        const isExpanded = expandedFund === fund.id;
        
        return (
            <div key={fund.id} className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] p-6 rounded-xl border border-[#333] mb-4">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-medium">{fund.name}</h3>
                        <p className="text-green-500 text-sm">{formatPercentage(fund.monthlyReturn)} {t('pamm.explorer.lastMonth')}</p>
                        <p className="text-gray-400 text-sm mt-1">{t('pamm.fund.manager')}: {typeof fund.manager === 'string' ? fund.manager : (fund.manager?.name || fund.manager?.display_name || 'Manager')} • {t('pamm.fund.inception')}: {fund.since}</p>
                    </div>
                    <div className={`${getTypeColor(fund.type)} text-xs px-2 py-1 rounded text-white`}>
                        {fund.type}
                    </div>
                </div>
                
                <div className="mb-4">
                    <div className="flex justify-between mb-1">
                        <span className="text-xs text-gray-400">{t('pamm.explorer.totalReturn')}</span>
                        <span className="text-xs text-green-400">{formatPercentage(fund.totalReturn)}</span>
                    </div>
                    <div className="w-full bg-[#333] h-2 rounded-full">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(fund.totalReturn, 100)}%` }}></div>
                    </div>
                </div>
                
                <div className="mb-4">
                    <div className="flex justify-between mb-1">
                        <span className="text-xs text-gray-400">{t('pamm.explorer.riskLevel')}</span>
                        <span className={`text-xs ${getRiskColor(fund.riskLevel)}`}>{fund.riskLevel}</span>
                    </div>
                    <div className="w-full bg-[#333] h-2 rounded-full">
                        <div className={`${
                            fund.riskLevel === 'Alto' ? 'bg-red-500' :
                            fund.riskLevel === 'Moderado' ? 'bg-yellow-500' : 'bg-green-500'
                        } h-2 rounded-full`} style={{ 
                            width: fund.riskLevel === 'Alto' ? '80%' : fund.riskLevel === 'Moderado' ? '50%' : '30%' 
                        }}></div>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                        <span className="text-gray-400">{t('pamm.explorer.aum')}</span>
                        <span className="ml-2 font-medium">{formatAUM(fund.aum)}</span>
                    </div>
                    <div>
                        <span className="text-gray-400">{t('pamm.explorer.investors')}</span>
                        <span className="ml-2 font-medium">{fund.investors}</span>
                    </div>
                    <div>
                        <span className="text-gray-400">Min. Inversión:</span>
                        <span className="ml-2 font-medium">{formatCurrency(fund.minInvestment)}</span>
                    </div>
                    <div>
                        <span className="text-gray-400">{t('pamm.explorer.successRate')}</span>
                        <span className="ml-2 font-medium text-green-400">{fund.winRate}%</span>
                    </div>
                </div>
                
                <div className="flex space-x-2">
                    <button 
                        className={`flex-1 px-4 py-2 rounded-md text-sm transition-colors ${
                            investedFunds.has(fund.id) 
                                ? 'bg-green-600 hover:bg-green-700' 
                                : 'bg-cyan-700 hover:bg-cyan-600'
                        }`}
                        onClick={() => onInvestInFund(fund)}
                        disabled={investedFunds.has(fund.id)}
                    >
                        {investedFunds.has(fund.id) ? t('pamm.invested') : t('pamm.invest')}
                    </button>
                    <button 
                        className="px-4 py-2 bg-[#333] hover:bg-[#444] rounded-md text-sm"
                        onClick={() => onViewFundDetails(fund)}
                    >
                        {t('pamm.explorer.view')}
                    </button>
                    <button 
                        className="px-4 py-2 bg-[#333] hover:bg-[#444] rounded-md text-sm"
                        onClick={() => toggleExpandFund(fund.id)}
                    >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>
                
                {/* Panel expandible con información adicional */}
                {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-[#333]">
                        <div className="bg-[#232323] p-4 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <p className="text-sm text-gray-400">{t('pamm.explorer.maxDrawdown')}</p>
                                    <p className="text-xl font-medium text-red-400">{fund.maxDrawdown}%</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Sharpe Ratio</p>
                                    <p className="text-xl font-medium">{fund.sharpeRatio}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Lock-up</p>
                                    <p className="text-xl font-medium">{fund.lockupDays} {t('pamm.explorer.lockupDays')}</p>
                                </div>
                            </div>
                            
                            <p className="text-sm text-gray-400 mb-2">{t('pamm.explorer.strategy')}</p>
                            <p className="text-sm mb-4">{fund.description}</p>
                            
                            <p className="text-sm text-gray-400 mb-2">{t('pamm.explorer.markets')}</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {fund.markets && fund.markets.length > 0 ? (
                                    fund.markets.map((market, index) => (
                                        <span key={index} className="bg-[#1C1C1C] px-2 py-1 rounded text-xs">
                                            {typeof market === 'string' ? market : JSON.stringify(market)}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-gray-400 text-xs">{t('pamm.investor.noMarketsAvailable')}</span>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-400">{t('pamm.explorer.managementFeeShort')}</span>
                                    <span className="ml-2">{fund.managementFee}%</span>
                                </div>
                                <div>
                                    <span className="text-gray-400">{t('pamm.explorer.performanceFeeShort')}</span>
                                    <span className="ml-2">{fund.performanceFee}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };
    
    return (
        <div className="p-4 md:p-6 bg-[#232323] text-white rounded-3xl border border-[#333]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBackToDashboard}
                        className="p-2 bg-[#333] hover:bg-[#444] rounded-lg transition-colors"
                    >
                        <ArrowUp className="rotate-[-90deg]" size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-semibold">{t('pamm.explorer.title')}</h1>
                        <p className="text-gray-400">{t('pamm.explorer.description')}</p>
                    </div>
                </div>
            </div>
            
            {/* Filtros y búsqueda */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder={t('pamm.explorer.searchPlaceholder')}
                        className="w-full p-3 bg-[#1C1C1C] border border-[#333] rounded-lg text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                    <div className="relative" ref={fundTypeDropdownRef}>
                        <div 
                            className="flex items-center justify-between p-3 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-lg hover:border-cyan-400 transition-all duration-200 cursor-pointer"
                            onClick={() => setShowFundTypeDropdown(!showFundTypeDropdown)}
                        >
                            <span className="text-white">
                                {filters.fundType ? 
                                    (filters.fundType === 'Premium' ? t('pamm.explorer.premium') :
                                     filters.fundType === 'Verificado' ? t('pamm.explorer.verified') :
                                     filters.fundType === 'Nuevo' ? t('pamm.explorer.new') : t('pamm.explorer.allTypes'))
                                    : t('pamm.explorer.allTypes')}
                            </span>
                            <ChevronDown 
                                size={20} 
                                className={`text-cyan-400 transition-transform duration-200 ${showFundTypeDropdown ? 'rotate-180' : ''}`} 
                            />
                        </div>
                        {showFundTypeDropdown && (
                            <div className="absolute z-50 mt-1 w-full bg-[#2d2d2d] border border-[#444] rounded-lg shadow-lg overflow-hidden">
                                <div 
                                    className="px-4 py-3 hover:bg-[#3a3a3a] cursor-pointer"
                                    onClick={() => {
                                        setFilters(prev => ({ ...prev, fundType: '' }));
                                        setShowFundTypeDropdown(false);
                                    }}
                                >
                                    {t('pamm.explorer.allTypes')}
                                </div>
                                <div 
                                    className="px-4 py-3 hover:bg-[#3a3a3a] cursor-pointer"
                                    onClick={() => {
                                        setFilters(prev => ({ ...prev, fundType: 'Premium' }));
                                        setShowFundTypeDropdown(false);
                                    }}
                                >
                                    {t('pamm.explorer.premium')}
                                </div>
                                <div 
                                    className="px-4 py-3 hover:bg-[#3a3a3a] cursor-pointer"
                                    onClick={() => {
                                        setFilters(prev => ({ ...prev, fundType: 'Verificado' }));
                                        setShowFundTypeDropdown(false);
                                    }}
                                >
                                    {t('pamm.explorer.verified')}
                                </div>
                                <div 
                                    className="px-4 py-3 hover:bg-[#3a3a3a] cursor-pointer"
                                    onClick={() => {
                                        setFilters(prev => ({ ...prev, fundType: 'Nuevo' }));
                                        setShowFundTypeDropdown(false);
                                    }}
                                >
                                    {t('pamm.explorer.new')}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="relative" ref={riskLevelDropdownRef}>
                        <div 
                            className="flex items-center justify-between p-3 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-lg hover:border-cyan-400 transition-all duration-200 cursor-pointer"
                            onClick={() => setShowRiskLevelDropdown(!showRiskLevelDropdown)}
                        >
                            <span className="text-white">
                                {filters.riskLevel ? 
                                    (filters.riskLevel === 'Bajo' ? t('pamm.explorer.lowRisk') :
                                     filters.riskLevel === 'Moderado' ? t('pamm.explorer.moderateRisk') :
                                     filters.riskLevel === 'Alto' ? t('pamm.explorer.highRisk') : t('pamm.explorer.allRisks'))
                                    : t('pamm.explorer.allRisks')}
                            </span>
                            <ChevronDown 
                                size={20} 
                                className={`text-cyan-400 transition-transform duration-200 ${showRiskLevelDropdown ? 'rotate-180' : ''}`} 
                            />
                        </div>
                        {showRiskLevelDropdown && (
                            <div className="absolute z-50 mt-1 w-full bg-[#2d2d2d] border border-[#444] rounded-lg shadow-lg overflow-hidden">
                                <div 
                                    className="px-4 py-3 hover:bg-[#3a3a3a] cursor-pointer"
                                    onClick={() => {
                                        setFilters(prev => ({ ...prev, riskLevel: '' }));
                                        setShowRiskLevelDropdown(false);
                                    }}
                                >
                                    {t('pamm.explorer.allRisks')}
                                </div>
                                <div 
                                    className="px-4 py-3 hover:bg-[#3a3a3a] cursor-pointer"
                                    onClick={() => {
                                        setFilters(prev => ({ ...prev, riskLevel: 'Bajo' }));
                                        setShowRiskLevelDropdown(false);
                                    }}
                                >
                                    {t('pamm.explorer.lowRisk')}
                                </div>
                                <div 
                                    className="px-4 py-3 hover:bg-[#3a3a3a] cursor-pointer"
                                    onClick={() => {
                                        setFilters(prev => ({ ...prev, riskLevel: 'Moderado' }));
                                        setShowRiskLevelDropdown(false);
                                    }}
                                >
                                    {t('pamm.explorer.moderateRisk')}
                                </div>
                                <div 
                                    className="px-4 py-3 hover:bg-[#3a3a3a] cursor-pointer"
                                    onClick={() => {
                                        setFilters(prev => ({ ...prev, riskLevel: 'Alto' }));
                                        setShowRiskLevelDropdown(false);
                                    }}
                                >
                                    {t('pamm.explorer.highRisk')}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Lista de fondos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {isLoadingFunds ? (
                    // Skeleton loading
                    Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] p-6 rounded-xl border border-[#333] animate-pulse">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <div className="h-6 bg-[#333] rounded w-3/4 mb-2"></div>
                                    <div className="h-4 bg-[#333] rounded w-1/2 mb-2"></div>
                                    <div className="h-4 bg-[#333] rounded w-2/3"></div>
                                </div>
                                <div className="h-6 w-16 bg-[#333] rounded"></div>
                            </div>
                            <div className="mb-4">
                                <div className="h-2 bg-[#333] rounded-full w-full mb-2"></div>
                                <div className="h-2 bg-[#333] rounded-full w-1/2"></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="h-4 bg-[#333] rounded"></div>
                                <div className="h-4 bg-[#333] rounded"></div>
                                <div className="h-4 bg-[#333] rounded"></div>
                                <div className="h-4 bg-[#333] rounded"></div>
                            </div>
                            <div className="flex space-x-2">
                                <div className="flex-1 h-10 bg-[#333] rounded-md"></div>
                                <div className="h-10 w-20 bg-[#333] rounded-md"></div>
                                <div className="h-10 w-10 bg-[#333] rounded-md"></div>
                            </div>
                        </div>
                    ))
                ) : filteredFunds.length > 0 ? (
                    filteredFunds.map(fund => renderFundCard(fund))
                ) : (
                    <div className="col-span-full text-center py-8">
                        <p className="text-gray-400">{t('pamm.explorer.noFundsFound')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const PammFundProfileView = ({ 
    fund, 
    formatCurrency, 
    formatPercentage, 
    formatAUM, 
    getRiskColor,
    onBackToDashboard, 
    onInvestInFund,
    investedFunds,
    activeTab,
    setActiveTab,
    t
}) => {
    if (!fund) {
        return (
            <div className="p-4 md:p-6 bg-[#232323] text-white rounded-3xl border border-[#333]">
                <p className="text-gray-400">{t('pamm.errors.fundNotFound')}</p>
            </div>
        );
    }
    
    // Datos históricos del fondo - cargados dinámicamente
    const historicalData = fund.historicalData || [];
    
    return (
        <div className="p-4 md:p-6 bg-[#232323] text-white rounded-3xl border border-[#333] space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBackToDashboard}
                        className="p-2 bg-[#333] hover:bg-[#444] rounded-lg transition-colors"
                    >
                        <ArrowUp className="rotate-[-90deg]" size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-semibold">{fund.name}</h1>
                        <p className="text-gray-400">{t('pamm.fund.manager')}: {typeof fund.manager === 'string' ? fund.manager : (fund.manager?.name || fund.manager?.display_name || 'Manager')}</p>
                    </div>
                </div>
                <button
                    onClick={() => onInvestInFund(fund)}
                    className={`py-2 px-6 rounded-lg transition-all ${
                        investedFunds.has(fund.id)
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gradient-to-r from-[#0F7490] to-[#0A5A72] text-white hover:opacity-90'
                    }`}
                    disabled={investedFunds.has(fund.id)}
                >
                    {investedFunds.has(fund.id) ? t('pamm.invested') : t('pamm.invest')}
                </button>
            </div>
            
            {/* Fund Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">{t('pamm.manager.totalAUM')}</span>
                        <DollarSign className="text-cyan-500" size={16} />
                    </div>
                    <div className="text-xl font-bold">{formatAUM(fund.aum)}</div>
                </div>
                
                <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">{t('pamm.manager.totalReturn')}</span>
                        <TrendingUp className="text-green-500" size={16} />
                    </div>
                    <div className="text-xl font-bold text-green-500">{formatPercentage(fund.totalReturn)}</div>
                </div>
                
                <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">{t('pamm.manager.investors')}</span>
                        <Users className="text-blue-500" size={16} />
                    </div>
                    <div className="text-xl font-bold">{fund.investors}</div>
                </div>
                
                <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">{t('pamm.explorer.riskLevel')}</span>
                        <Shield className={getRiskColor(fund.riskLevel).replace('text-', '')} size={16} />
                    </div>
                    <div className={`text-xl font-bold ${getRiskColor(fund.riskLevel)}`}>{fund.riskLevel}</div>
                </div>
            </div>
            
            {/* Tabs */}
            <div className="flex border-b border-[#333] overflow-x-auto">
                {['performance', 'strategy', 'fees', 'messages'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-3 px-6 whitespace-nowrap ${
                            activeTab === tab
                                ? 'text-cyan-400 border-b-2 border-cyan-400'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        {tab === 'performance' ? t('pamm.investor.performance') : 
                         tab === 'strategy' ? t('pamm.investor.strategy') : 
                         tab === 'fees' ? t('pamm.investor.fees') :
                         'Mensajes'}
                    </button>
                ))}
            </div>
            
            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'performance' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] p-6 rounded-xl">
                                <h3 className="text-lg font-semibold mb-4">{t('pamm.investor.performanceMetrics')}</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">{t('pamm.investor.monthlyReturn')}</span>
                                        <span className="font-medium text-green-500">{formatPercentage(fund.monthlyReturn)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">{t('pamm.investor.maxDrawdownLabel')}</span>
                                        <span className="font-medium text-red-400">{fund.maxDrawdown}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">{t('pamm.investor.sharpeRatio')}</span>
                                        <span className="font-medium">{fund.sharpeRatio}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">{t('pamm.explorer.successRate')}</span>
                                        <span className="font-medium text-green-400">{fund.winRate}%</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] p-6 rounded-xl">
                                <h3 className="text-lg font-semibold mb-4">{t('pamm.investor.fundInformation')}</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">{t('pamm.investor.startDate')}</span>
                                        <span className="font-medium">{fund.since}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">{t('pamm.investor.lockupPeriod')}</span>
                                        <span className="font-medium">{fund.lockupDays} días</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Min. Inversión:</span>
                                        <span className="font-medium">{formatCurrency(fund.minInvestment)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Total Inversores:</span>
                                        <span className="font-medium">{fund.investors}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] p-6 rounded-xl">
                                <h3 className="text-lg font-semibold mb-4">{t('pamm.investor.markets')}</h3>
                                <div className="space-y-2">
                                    {fund.markets && fund.markets.length > 0 ? (
                                        fund.markets.map((market, index) => (
                                            <div key={index} className="bg-[#333] px-3 py-2 rounded-lg text-sm">
                                                {typeof market === 'string' ? market : JSON.stringify(market)}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-gray-400 text-sm">{t('pamm.investor.noMarketsAvailable')}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Historical Chart */}
                        <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] p-6 rounded-xl">
                            <h3 className="text-lg font-semibold mb-4">{t('pamm.investor.fundEvolution')}</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={historicalData}>
                                        <XAxis 
                                            dataKey="date" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                            tickFormatter={(value) => formatAUM(value)}
                                        />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#1C1C1C', 
                                                border: '1px solid #333', 
                                                borderRadius: '8px',
                                                color: '#ffffff'
                                            }}
                                            formatter={(value) => [formatAUM(value), 'AUM']}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="value" 
                                            stroke="#22d3ee" 
                                            strokeWidth={2}
                                            fill="#22d3ee" 
                                            fillOpacity={0.1}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'strategy' && (
                    <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] p-6 rounded-xl">
                        <h3 className="text-lg font-semibold mb-4">{t('pamm.investor.investmentStrategy')}</h3>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-medium mb-2">{t('pamm.investor.investmentDescription')}</h4>
                                <p className="text-gray-300">{fund.description}</p>
                            </div>
                            
                            <div>
                                <h4 className="font-medium mb-2">{t('pamm.investor.strategyType')}</h4>
                                <span className="bg-[#333] px-3 py-1 rounded-lg text-sm">{fund.strategy}</span>
                            </div>
                            
                            <div>
                                <h4 className="font-medium mb-2">{t('pamm.investor.operatedMarkets')}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {fund.markets && fund.markets.length > 0 ? (
                                        fund.markets.map((market, index) => (
                                            <span key={index} className="bg-[#333] px-3 py-1 rounded-lg text-sm">
                                                {typeof market === 'string' ? market : JSON.stringify(market)}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-gray-400 text-sm">{t('pamm.investor.noMarketsAvailable')}</span>
                                    )}
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="font-medium mb-2">{t('pamm.investor.riskManagement')}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-[#333] p-4 rounded-lg">
                                        <div className="text-sm text-gray-400">{t('pamm.investor.riskLevel')}</div>
                                        <div className={`text-lg font-medium ${getRiskColor(fund.riskLevel)}`}>
                                            {fund.riskLevel}
                                        </div>
                                    </div>
                                    <div className="bg-[#333] p-4 rounded-lg">
                                        <div className="text-sm text-gray-400">{t('pamm.investor.maxDrawdown')}</div>
                                        <div className="text-lg font-medium text-red-400">
                                            {fund.maxDrawdown}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'fees' && (
                    <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] p-6 rounded-xl">
                        <h3 className="text-lg font-semibold mb-6">{t('pamm.investor.feeStructure')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-[#333] p-6 rounded-xl">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-medium">{t('pamm.managementFee')}</h4>
                                    <DollarSign className="text-cyan-500" size={20} />
                                </div>
                                <div className="text-3xl font-bold mb-2">{fund.managementFee}%</div>
                                <p className="text-sm text-gray-400">{t('pamm.investor.annualManagementFee')}</p>
                            </div>
                            
                            <div className="bg-[#333] p-6 rounded-xl">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-medium">{t('pamm.performanceFee')}</h4>
                                    <TrendingUp className="text-green-500" size={20} />
                                </div>
                                <div className="text-3xl font-bold mb-2">{fund.performanceFee}%</div>
                                <p className="text-sm text-gray-400">{t('pamm.investor.performanceFeeDescription')}</p>
                            </div>
                        </div>
                        
                        <div className="mt-6 p-4 bg-[#333] rounded-xl">
                            <h4 className="font-medium mb-3">{t('pamm.investor.calculationExample')}</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">{t('pamm.investor.initialInvestment')}</span>
                                    <span>$10,000</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">{t('pamm.investor.annualManagementFeeLabel')}</span>
                                    <span>${(10000 * fund.managementFee / 100).toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">{t('pamm.investor.estimatedGain')}</span>
                                    <span className="text-green-400">$1,500</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">{t('pamm.investor.performanceFeeLabel')}</span>
                                    <span>${(1500 * fund.performanceFee / 100).toFixed(0)}</span>
                                </div>
                                <div className="border-t border-[#444] pt-2 mt-2">
                                    <div className="flex justify-between font-medium">
                                        <span>{t('pamm.investor.estimatedNetGain')}</span>
                                        <span className="text-green-400">
                                            ${(1500 - (1500 * fund.performanceFee / 100) - (10000 * fund.managementFee / 100)).toFixed(0)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'messages' && (
                    <div className="mt-6">
                        <PammInvestorMessaging 
                            fundId={fund.fund_id || fund.id}
                            fundName={fund.fund_name || fund.name}
                            managerId={fund.manager_id || fund.manager?.id}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

const PammListView = ({ onSelectTrader }) => {
    // Filter states
    const [filters, setFilters] = useState({
        misFavoritos: false,
        tasaRendimiento: false,
        deposito: false
    });
    const [selectedAge, setSelectedAge] = useState('');
    const [selectedCommission, setSelectedCommission] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Data states
    const [allPammData, setAllPammData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPammData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const funds = await getPammFunds();
                
                // Asegurarse de que funds sea un array antes de mapear
                if (!Array.isArray(funds)) {
                    console.warn("[PammDashboard] getPammFunds no devolvió un array. Se recibió:", funds);
                    setAllPammData([]); // Establecer como array vacío para evitar errores
                    return;
                }

                // El frontend espera campos como 'nombre', 'rendimiento', etc.
                // Mapeamos la respuesta de la API a la estructura que necesita el componente.
                const formattedFunds = funds.map((fund, index) => ({
                    ranking: index + 1,
                    id: fund.id, // ID del fondo PAMM
                    nombre: fund.name || 'Estrategia sin nombre',
                    serverType: 'MT5', // Asumimos MT5 o lo obtenemos de la API
                    cuenta: fund.masterMt5AccountId,
                    pnl: fund.performance?.total_pnl_usd?.toFixed(2) || '0.00',
                    rendimiento: `${fund.performance?.total_pnl_percentage?.toFixed(2) || 0}%`,
                    rendimientoNumerico: fund.performance?.total_pnl_percentage || 0,
                    retraccionMax: `-${fund.performance?.max_drawdown?.toFixed(2) || 0}%`,
                    cuentaAbierta: `${fund.performance?.age_days || 0} días`,
                    diasAbierta: fund.performance?.age_days || 0,
                    depositoMinimo: `${fund.min_investment?.toFixed(2) || '100.00'} USD`,
                    depositoNumerico: fund.min_investment || 100,
                    balancePropio: fund.performance?.balance?.toFixed(2) || '0.00',
                    capitalAdministrado: fund.performance?.managed_capital?.toFixed(2) || '0.00',
                    gananciasUltimoMes: '0.00', // Este dato podría necesitar un cálculo específico en el backend
                    inversores: fund.investors_count || 0,
                    comision: fund.performance_fee || 0,
                    esFavorito: false // La lógica de favoritos se implementará por separado
                }));
                setAllPammData(formattedFunds);
            } catch (err) {
                setError('No se pudieron cargar los fondos PAMM. El servicio puede no estar disponible.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPammData();
    }, []);

    // Filter logic
    const getFilteredData = () => {
        let filtered = [...allPammData];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(trader => 
                trader.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                trader.cuenta.includes(searchTerm)
            );
        }

        // Checkbox filters
        if (filters.misFavoritos) {
            filtered = filtered.filter(trader => trader.esFavorito);
        }

        if (filters.tasaRendimiento) {
            filtered = filtered.sort((a, b) => b.rendimientoNumerico - a.rendimientoNumerico);
        }

        if (filters.deposito) {
            filtered = filtered.sort((a, b) => a.depositoNumerico - b.depositoNumerico);
        }

        // Age filter
        if (selectedAge) {
            const ageFilters = {
                '1mes': (days) => days >= 30,
                '2meses': (days) => days >= 60,
                '3meses': (days) => days >= 90,
                '6meses': (days) => days >= 180,
                '1año': (days) => days >= 365
            };
            
            if (ageFilters[selectedAge]) {
                filtered = filtered.filter(trader => ageFilters[selectedAge](trader.diasAbierta));
            }
        }

        // Commission filter
        if (selectedCommission) {
            const commissionFilters = {
                'sinComision': (comision) => comision === 0,
                '1-5': (comision) => comision >= 1 && comision <= 5,
                '5-10': (comision) => comision >= 5 && comision <= 10,
                '10-20': (comision) => comision >= 10 && comision <= 20,
                '20-30': (comision) => comision >= 20 && comision <= 30,
                '30+': (comision) => comision > 30
            };
            
            if (commissionFilters[selectedCommission]) {
                filtered = filtered.filter(trader => commissionFilters[selectedCommission](trader.comision));
            }
        }

        return filtered;
    };

    const pammData = getFilteredData();

    const handleFilterChange = (filterName) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: !prev[filterName]
        }));
    };

    if (isLoading) {
        return (
            <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] text-white p-8 rounded-3xl text-center">
                <h1 className="text-2xl font-bold">Cargando fondos PAMM...</h1>
                <p className="text-gray-400 mt-2">Por favor, espere un momento.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] text-white p-8 rounded-3xl text-center">
                <h1 className="text-2xl font-bold text-red-500">Error</h1>
                <p className="text-gray-400 mt-2">{error}</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] text-white p-4 sm:p-6 md:p-8 rounded-3xl">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold">Pamm</h1>
                    <p className="text-gray-400 mt-1">Busca tu próxima cuenta Pamm</p>
                </div>
                <div className="relative mt-4 md:mt-0 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Buscar por nombre o número de cuenta"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-[#1C1C1C] border border-[#333] rounded-lg py-2 pl-10 pr-4 w-full md:w-80 text-white"
                    />
                    <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
            </div>

            {/* Filters */}
            <div className="space-y-6 mb-8">
                <div>
                    <h3 className="text-lg font-semibold mb-3">Filtrar por</h3>
                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={filters.misFavoritos}
                                onChange={() => handleFilterChange('misFavoritos')}
                                className="form-checkbox bg-transparent border-[#333] rounded text-cyan-500 focus:ring-cyan-500" 
                            />
                            <span>Mis favoritos</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={filters.tasaRendimiento}
                                onChange={() => handleFilterChange('tasaRendimiento')}
                                className="form-checkbox bg-transparent border-[#333] rounded text-cyan-500 focus:ring-cyan-500" 
                            />
                            <span>Tasa de rendimiento</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={filters.deposito}
                                onChange={() => handleFilterChange('deposito')}
                                className="form-checkbox bg-transparent border-[#333] rounded text-cyan-500 focus:ring-cyan-500" 
                            />
                            <span>Depósito</span>
                        </label>
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-3">Antiguedad</h3>
                    <div className="flex flex-wrap gap-3">
                        {[
                            { key: '1mes', label: '+1 mes' },
                            { key: '2meses', label: '+2 meses' },
                            { key: '3meses', label: '+3 meses' },
                            { key: '6meses', label: '+6 meses' },
                            { key: '1año', label: '+1 año' }
                        ].map(age => (
                            <button 
                                key={age.key} 
                                onClick={() => setSelectedAge(selectedAge === age.key ? '' : age.key)}
                                className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
                                    selectedAge === age.key 
                                        ? 'bg-cyan-600 border border-cyan-500 text-white' 
                                        : 'bg-[#2D2D2D] border border-[#333] hover:bg-[#3f3f3f]'
                                }`}
                            >
                                {age.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-3">Comisión</h3>
                    <div className="flex flex-wrap gap-3">
                        {[
                            { key: 'sinComision', label: 'Trader sin comisión' },
                            { key: '1-5', label: '1%-5%' },
                            { key: '5-10', label: '5%-10%' },
                            { key: '10-20', label: '10%-20%' },
                            { key: '20-30', label: '20%-30%' },
                            { key: '30+', label: '+30%' }
                        ].map(commission => (
                            <button 
                                key={commission.key} 
                                onClick={() => setSelectedCommission(selectedCommission === commission.key ? '' : commission.key)}
                                className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
                                    selectedCommission === commission.key 
                                        ? 'bg-cyan-600 border border-cyan-500 text-white' 
                                        : 'bg-[#2D2D2D] border border-[#333] hover:bg-[#3f3f3f]'
                                }`}
                            >
                                {commission.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* PAMM Table */}
            <div className="overflow-x-auto">
                <div className="min-w-full inline-block align-middle">
                    {/* Header */}
                    <div className="grid grid-cols-[auto_2fr_repeat(10,1fr)] gap-4 px-4 py-3 text-sm text-gray-400 font-medium">
                        <div>Ranking</div>
                        <div>Trader</div>
                        <div className="text-right">PNL en USD</div>
                        <div className="text-right">Rendimiento</div>
                        <div className="text-right">Retracción Máxima</div>
                        <div className="text-center">Cuenta Abierta</div>
                        <div className="text-right">Depósito Mínimo</div>
                        <div className="text-right">Balance Propio</div>
                        <div className="text-right">Capital Administrado</div>
                        <div className="text-right">Ganancias del último mes</div>
                        <div className="text-center">Inversores</div>
                        <div className="text-center">Cartera</div>
                    </div>
                    {/* Body */}
                    <div className="space-y-3">
                        {pammData.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <p className="text-lg mb-2">No se encontraron traders</p>
                                <p className="text-sm">Intenta ajustar los filtros para ver más resultados</p>
                            </div>
                        ) : (
                            pammData.map((trader) => (
                            <div key={trader.ranking} className="grid grid-cols-[auto_2fr_repeat(10,1fr)] gap-4 items-center p-4 rounded-xl bg-[#232323] border border-[#333] cursor-pointer hover:border-cyan-500" onClick={() => onSelectTrader(trader)}>
                                <div className="font-semibold text-lg">{trader.ranking}.</div>
                                <div className="flex items-center space-x-3">
                                    <img src="/Foto.svg" alt="Trader" className="w-12 h-12 rounded-lg bg-[#D9D9D9]" />
                                    <div>
                                        <div className="font-semibold">{trader.nombre}</div>
                                        <div className="text-xs text-gray-400">Server Type: {trader.serverType}</div>
                                        <div className="text-xs text-gray-400">Cuenta: {trader.cuenta}</div>
                                    </div>
                                </div>
                                <div className="text-right">{trader.pnl}</div>
                                <div className="text-right">{trader.rendimiento}</div>
                                <div className="text-right text-white">{trader.retraccionMax}</div>
                                <div className="text-center">{trader.cuentaAbierta}</div>
                                <div className="text-right">{trader.depositoMinimo}</div>
                                <div className="text-right">{trader.balancePropio}</div>
                                <div className="text-right">{trader.capitalAdministrado}</div>
                                <div className="text-right">{trader.gananciasUltimoMes}</div>
                                <div className="text-center">{trader.inversores}</div>
                                <div className="flex justify-center">
                                    <button className="p-2 rounded-lg bg-[#2D2D2D] hover:bg-[#3f3f3f]">
                                        <BarChart2 size={20} />
                                    </button>
                                </div>
                            </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const PammDetailView = ({ trader, onBack, investedFunds, setInvestedFunds }) => {
    const [activeTab, setActiveTab] = useState('Rendimiento');
    const [timeFilter, setTimeFilter] = useState('mensual');
    const [showInvertirModal, setShowInvertirModal] = useState(false);
    const [selectedFundForInvest, setSelectedFundForInvest] = useState(null);

    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [selectedFundForWithdraw, setSelectedFundForWithdraw] = useState(null);

    // Custom dropdown states
    const [showTimeFilterDropdown, setShowTimeFilterDropdown] = useState(false);
    
    // Dropdown refs
    const timeFilterDropdownRef = useRef(null);

    const chartData = {
        'Rendimiento': {
            mensual: { data: [ { name: 'Ene', value: 3.2 }, { name: 'Feb', value: 5.0 }, { name: 'Mar', value: 4.5 }, { name: 'Abr', value: 7.9 }, { name: 'May', value: 10.0 }, { name: 'Jun', value: 8.5 }, { name: 'Jul', value: 13.2 }, { name: 'Ago', value: 15.0 }, { name: 'Sep', value: 14.4 }, { name: 'Oct', value: 18.0 }, { name: 'Nov', value: 15.2 }, { name: 'Dic', value: 19.8 } ], max: 30, step: 5 },
            trimestral: { data: [ { name: 'Q1', value: 12.7 }, { name: 'Q2', value: 26.4 }, { name: 'Q3', value: 42.6 }, { name: 'Q4', value: 53.0 } ], max: 60, step: 10 }
        },
        'Retracción': {
            mensual: { data: [ { name: 'Ene', value: 2 }, { name: 'Feb', value: 3 }, { name: 'Mar', value: 2.5 }, { name: 'Abr', value: 4 }, { name: 'May', value: 5.5 }, { name: 'Jun', value: 4.2 }, { name: 'Jul', value: 6 }, { name: 'Ago', value: 7 }, { name: 'Sep', value: 6.5 }, { name: 'Oct', value: 8 }, { name: 'Nov', value: 7.2 }, { name: 'Dic', value: 9 } ], max: 15, step: 3 },
            trimestral: { data: [ { name: 'Q1', value: 7.5 }, { name: 'Q2', value: 13.7 }, { name: 'Q3', value: 19.5 }, { name: 'Q4', value: 24.2 } ], max: 30, step: 5 }
        },
        'Balance': {
            mensual: { data: [ { name: 'Ene', value: 10 }, { name: 'Feb', value: 12 }, { name: 'Mar', value: 11 }, { name: 'Abr', value: 15 }, { name: 'May', value: 18 }, { name: 'Jun', value: 16 }, { name: 'Jul', value: 22 }, { name: 'Ago', value: 25 }, { name: 'Sep', value: 24 }, { name: 'Oct', value: 28 }, { name: 'Nov', value: 26 }, { name: 'Dic', value: 30 } ], max: 40, step: 10 },
            trimestral: { data: [ { name: 'Q1', value: 33 }, { name: 'Q2', value: 49 }, { name: 'Q3', value: 71 }, { name: 'Q4', value: 84 } ], max: 100, step: 20 }
        }
    };

    const getBarColor = (value, maxValue) => {
        const minLightness = 25; 
        const maxLightness = 75; 
        const lightness = minLightness + (value / maxValue) * (maxLightness - minLightness);
        return `hsl(191, 95%, ${lightness}%)`;
    };

    // Handle click outside for dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (timeFilterDropdownRef.current && !timeFilterDropdownRef.current.contains(event.target)) {
                setShowTimeFilterDropdown(false);
            }
        };

        if (showTimeFilterDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showTimeFilterDropdown]);

    const renderChart = () => {
        const currentChart = chartData[activeTab][timeFilter];
        
        return (
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <BarChart data={currentChart.data} margin={{ top: 20, right: 0, left: -20, bottom: 5 }}>
                        <CartesianGrid vertical={false} stroke="#373737" />
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} domain={[0, currentChart.max]}/>
                        <Tooltip
                          cursor={false}
                          contentStyle={{
                            backgroundColor: '#232323',
                            border: '1px solid #333',
                            borderRadius: '8px',
                            fontSize: '14px',
                            color: '#ffffff',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          labelStyle={{ color: '#ffffff' }}
                          itemStyle={{ color: '#ffffff' }}
                          formatter={(value) => [`${value.toFixed(1)}%`, activeTab]}
                          labelFormatter={(label) => `${timeFilter === 'mensual' ? 'Mes' : 'Trimestre'}: ${label}`}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                            {currentChart.data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getBarColor(entry.value, currentChart.max)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        )
    };

    return (
        <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] text-white p-4 sm:p-6 md:p-8 rounded-3xl space-y-8">
            {/* Header Section */}
            <div className="mb-4">
              <img 
                src="/Back.svg" 
                alt="Back" 
                onClick={onBack}
                className="w-10 h-10 cursor-pointer hover:brightness-75 transition-all duration-300"
              />
                </div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center -mt-8">
                    <div className="flex items-center space-x-4">
                    <img src="/Foto.svg" alt={trader.nombre} className="w-16 h-16 rounded-full border-2 border-cyan-400" />
                        <div>
                        <h1 className="text-2xl font-bold">{trader.nombre}</h1>
                        <p className="text-gray-400">ID de la estrategia: {trader.cuenta}</p>
                    </div>
                </div>
                <button 
                    onClick={() => {
                        if (!investedFunds.has(trader.id)) {
                            setInvestedFunds(prev => new Set([...prev, trader.id]));
                        }
                        setShowInvertirModal(true);
                    }}
                    className={`mt-4 md:mt-0 flex items-center gap-2 rounded-full px-6 py-2 transition-colors font-medium ${
                        investedFunds.has(trader.id)
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                    }`}
                >
                    <TrendingUp size={18} />
                    {investedFunds.has(trader.id) ? t('pamm.invested') : t('pamm.invest')}
                </button>
            </div>

            {/* Informacion & Reglas Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#232323] p-6 rounded-2xl border border-[#333]">
                    <h3 className="text-xl font-semibold mb-4">Información</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-gray-400">Número de cuenta</span><span>657237</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Nombre del servidor</span><span>MT5</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Tipo de cuenta</span><span>CopyFX MT5 Prime</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Verificado</span><span className="text-green-500 font-semibold">Sí</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Saldo de la cuenta</span><span>5 000.23 USD</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Capital administrado</span><span>75 009.73 USD</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Apalancamiento</span><span>1:300</span></div>
                    </div>
                </div>
                <div className="bg-[#232323] p-6 rounded-2xl border border-[#333]">
                    <h3 className="text-xl font-semibold mb-4">Reglas</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-gray-400">Nombre de la estrategia</span><span>Nombre estrategia</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Depósito mínimo</span><span>100 USD</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Tipo de comisión</span><span>20%</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Frecuencia de pagos</span><span>1 semana</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Modo de copia</span><span>Proporcional</span></div>
                    </div>
                </div>
            </div>

            {/* 5 Cards Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-[#232323] p-6 rounded-2xl border border-[#333]"><h4 className="text-gray-400 text-sm">Comisión Por Rendimiento</h4><p className="font-bold text-2xl mt-1">35%</p></div>
                <div className="bg-[#232323] p-6 rounded-2xl border border-[#333]"><h4 className="text-gray-400 text-sm">Moneda De La Cuenta</h4><p className="font-bold text-2xl mt-1">USD</p></div>
                <div className="bg-[#232323] p-6 rounded-2xl border border-[#333]"><h4 className="text-gray-400 text-sm">Capital Propio Del Gestor</h4><p className="font-bold text-2xl mt-1">$1.572,98 USD</p></div>
                <div className="bg-[#232323] p-6 rounded-2xl border border-[#333] sm:col-span-1 lg:col-span-1"><h4 className="text-gray-400 text-sm">Saldo Del Gestor</h4><p className="font-bold text-2xl mt-1">$1.570,67 USD</p></div>
                <div className="bg-[#232323] p-6 rounded-2xl border border-[#333] sm:col-span-1 lg:col-span-2"><h4 className="text-gray-400 text-sm">Período De Operación</h4><p className="font-bold text-2xl mt-1">1 Mes</p></div>
            </div>

            {/* 8 Performance Cards Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#232323] p-4 rounded-2xl border border-[#333]"><h4 className="text-gray-400 text-sm mb-1">Rentabilidad total</h4><p className="font-bold text-lg">8.91%</p><p className="text-xs text-gray-400">6.298,99 USD</p></div>
                <div className="bg-[#232323] p-4 rounded-2xl border border-[#333]"><h4 className="text-gray-400 text-sm mb-1">Seguidores Actuales</h4><p className="font-bold text-lg flex items-center">20 <span className="text-xs text-green-500 flex items-center ml-2">(+24.7% <ArrowUpRight size={12} className="inline"/>)</span></p></div>
                <div className="bg-[#232323] p-4 rounded-2xl border border-[#333]"><h4 className="text-gray-400 text-sm mb-1">Operaciones</h4><p className="font-bold text-lg">7</p></div>
                <div className="bg-[#232323] p-4 rounded-2xl border border-[#333]">
                    <h4 className="text-gray-400 text-sm mb-1">Tasa de Éxito</h4>
                    <p className="text-xs text-gray-500">Operaciones Rentables</p>
                    <p className="font-bold text-lg mt-1">6 <span className="text-sm font-normal text-gray-400">(85.71%)</span></p>
                </div>
                <div className="bg-[#232323] p-4 rounded-2xl border border-[#333]"><h4 className="text-gray-400 text-sm mb-1">Retracción Máxima</h4><p className="font-bold text-lg text-red-500">-48.40%</p></div>
                <div className="bg-[#232323] p-4 rounded-2xl border border-[#333]"><h4 className="text-gray-400 text-sm mb-1">Promedio de Ganancia</h4><p className="font-bold text-lg">5%</p></div>
                <div className="bg-[#232323] p-4 rounded-2xl border border-[#333]"><h4 className="text-gray-400 text-sm mb-1">Beneficio</h4><p className="text-xs">Mayor <span className="font-bold text-sm block">1,915.17 USD</span></p><p className="text-xs">Menor <span className="font-bold text-sm block text-red-500">-124.75 USD</span></p></div>
                <div className="bg-[#232323] p-4 rounded-2xl border border-[#333]"><h4 className="text-gray-400 text-sm mb-1">Suscriptores Activos</h4><p className="font-bold text-lg">8</p></div>
            </div>

            {/* Chart Section */}
            <div className="bg-gradient-to-br from-[#232323] to-[#282828] p-6 rounded-2xl border border-[#333]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                    <div className="flex space-x-1 sm:space-x-2">
                        {['Rendimiento', 'Retracción', 'Balance'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab ? 'bg-[#2D2D2D] border border-cyan-500 text-white' : 'text-gray-400 hover:bg-[#2D2D2D]'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="relative mt-3 sm:mt-0" ref={timeFilterDropdownRef}>
                        <div 
                            className="flex items-center justify-between py-2 pl-4 pr-3 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-lg hover:border-cyan-400 transition-all duration-200 cursor-pointer min-w-[120px]"
                            onClick={() => setShowTimeFilterDropdown(!showTimeFilterDropdown)}
                        >
                            <span className="text-white">
                                {timeFilter === 'mensual' ? 'Mensual' : 'Trimestral'}
                            </span>
                            <ChevronDown 
                                size={16} 
                                className={`text-cyan-400 transition-transform duration-200 ${showTimeFilterDropdown ? 'rotate-180' : ''}`} 
                            />
                        </div>
                        {showTimeFilterDropdown && (
                            <div className="absolute z-50 mt-1 w-full bg-[#2d2d2d] border border-[#444] rounded-lg shadow-lg overflow-hidden">
                                <div 
                                    className="px-4 py-2 hover:bg-[#3a3a3a] cursor-pointer text-sm"
                                    onClick={() => {
                                        setTimeFilter('mensual');
                                        setShowTimeFilterDropdown(false);
                                    }}
                                >
                                    Mensual
                                </div>
                                <div 
                                    className="px-4 py-2 hover:bg-[#3a3a3a] cursor-pointer text-sm"
                                    onClick={() => {
                                        setTimeFilter('trimestral');
                                        setShowTimeFilterDropdown(false);
                                    }}
                                >
                                    Trimestral
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {renderChart()}
            </div>

            {/* Modal de Invertir en PAMM */}
            <InvertirPAMMModal 
                isOpen={showInvertirModal}
                onClose={() => setShowInvertirModal(false)}
                gestor={trader}
                onConfirm={async (formData) => {
                    try {
                        // Extract master MT5 account from trader's pamm_config
                        const masterMt5Account = trader.pamm_config?.pamm_mt5_account || 
                                                trader.master_config?.cuentaMT5Seleccionada || 
                                                trader.master_config?.master_mt5_account ||
                                                trader.masterAccount ||
                                                trader.mt5Account;
                        
                        if (!masterMt5Account) {
                            alert('Error: No se encontró la cuenta MT5 del PAMM manager');
                            return;
                        }

                        // Llamar al endpoint followMaster del backend para PAMM
                        const response = await followMaster({
                            master_user_id: trader.user_id || trader.id,
                            master_mt5_account_id: masterMt5Account,
                            follower_mt5_account_id: parseInt(formData.accountId),
                            risk_ratio: parseFloat(formData.riskRatio || 1.0)
                        });
                        
                        if (response.success || response.message) {
                            alert(t('copyTrading.messages.followSuccess') || 'Successfully following PAMM fund');
                            setShowInvertirModal(false);
                        } else {
                            throw new Error(response.error || 'Error following PAMM fund');
                        }
                    } catch (error) {
                        console.error('Error siguiendo PAMM fund:', error);
                        alert(t('copyTrading.messages.followError') + ': ' + (error.message || 'Error desconocido'));
                    }
                }}
            />

            {/* Modal de Retirar de PAMM */}
            <RetirarPAMMModal
                isOpen={showWithdrawModal}
                onClose={() => {
                    setShowWithdrawModal(false);
                    setSelectedFundForWithdraw(null);
                }}
                fund={selectedFundForWithdraw}
                onConfirm={handleConfirmWithdraw}
            />
        </div>
    );
};

export default PammDashboard; 