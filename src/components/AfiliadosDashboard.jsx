import React, { useState, useEffect } from 'react';
import { ChevronDown, Copy, ArrowUpDown, Lock, Menu, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseAdapter } from '../services/database.adapter';
import affiliatesService from '../services/affiliatesService';
import WithdrawalHistoryDetails from './WithdrawalHistoryDetails';
import Pagination from './utils/Pagination';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

// Component now uses affiliatesService for all data

const AfiliadosDashboard = () => {
  const { currentUser } = useAuth();
  const { t } = useTranslation('affiliates');
  const [activeTab, setActiveTab] = useState('panel');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [userId, setUserId] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [totalCommissions, setTotalCommissions] = useState(0);
  const [currentTier, setCurrentTier] = useState(1);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [selectedTrader, setSelectedTrader] = useState(null);
  const [visibleAfiliados] = useState(3);
  const [isMobile, setIsMobile] = useState(false);
  const [referralLink, setReferralLink] = useState('');

  // Estados para paginación y datos dinámicos
  const [currentPageCuentas, setCurrentPageCuentas] = useState(1);
  const [activeAccounts, setActiveAccounts] = useState([]);
  const [totalActiveAccounts, setTotalActiveAccounts] = useState(0);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [totalPayments, setTotalPayments] = useState(0);
  const itemsPerPage = 10;
  
  // All data now comes from affiliatesService - no more mock data
  const referenciasData = [];
  const pagosData = paymentHistory;
  
  const totalPagesCuentas = Math.ceil(totalActiveAccounts / itemsPerPage);

  // Detectar si es dispositivo móvil
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  // Load user data and affiliate statistics
  useEffect(() => {
    const fetchUserData = async () => {
      // setIsLoadingData(true); // Disabled to prevent stuck loading
      try {
        // Verificar que currentUser esté disponible y tenga ID antes de cargar datos
        if (currentUser && currentUser.id) {
          setUserId(currentUser.id);
          setReferralLink(`https://agm-broker.com/register?ref=${currentUser.id}`);

          // Statistics are loaded via separate useEffect hooks below
          // loadAffiliateStats, loadActiveAccounts, loadPaymentHistory
        } else if (currentUser === null) {
          // Solo mostrar error si currentUser es explícitamente null (no autenticado)
          setError(t('dashboard.messages.notAuthenticated'));
        }
        // Si currentUser es undefined, esperar a que se cargue
      } catch (err) {
        console.error('Error loading user data:', err);
        setError('Error al cargar los datos. Intente de nuevo más tarde.');
      } finally {
        // setIsLoadingData(false); // Disabled to prevent stuck loading
      }
    };

    // Solo ejecutar si currentUser está definido (no undefined)
    if (currentUser !== undefined) {
      fetchUserData();
    }
  }, [currentUser, currentUser?.id, t]);
  
  // Load active accounts data
  useEffect(() => {
    const fetchActiveAccounts = async () => {
      if (currentUser && activeTab === 'cuentas-activas') {
        try {
          const { accounts, totalCount } = await affiliatesService.getActiveAccounts(
            currentUser.id, 
            currentPageCuentas, 
            itemsPerPage
          );
          setActiveAccounts(accounts);
          setTotalActiveAccounts(totalCount);
        } catch (err) {
          console.error('Error loading active accounts:', err);
        }
      }
    };

    fetchActiveAccounts();
  }, [currentUser, activeTab, currentPageCuentas, itemsPerPage]);
  
  // Load payment history
  useEffect(() => {
    const fetchPaymentHistory = async () => {
      if (currentUser && activeTab === 'pagos') {
        try {
          const { payments, totalCount } = await affiliatesService.getPaymentHistory(
            currentUser.id, 
            currentPageCuentas, 
            itemsPerPage
          );
          setPaymentHistory(payments);
          setTotalPayments(totalCount);
        } catch (err) {
          console.error('Error loading payment history:', err);
        }
      }
    };

    fetchPaymentHistory();
  }, [currentUser, activeTab, currentPageCuentas, itemsPerPage]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };
  
  
  const copyToClipboard = (text) => {
    if (!text) return;
    const referralLink = affiliatesService.generateReferralLink(text);
    navigator.clipboard.writeText(referralLink)
      .then(() => {
        toast.success(t('dashboard.messages.linkCopied'));
      })
      .catch(err => {
        console.error('Error al copiar: ', err);
        toast.error(t('dashboard.messages.copyError'));
      });
  };

  const handleShowDetails = (trader) => {
    setSelectedTrader(trader);
  };

  const handleBackToDashboard = () => {
    setSelectedTrader(null);
  };

  // Renderizar cards móviles para afiliados
  const renderMobileAfiliadosCard = (trader) => (
    <div key={trader.id} className="bg-[#202020] rounded-xl p-4 space-y-3">
      {/* Header con usuario */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-lg font-semibold text-gray-500">{trader.id}.</div>
          <img src="/Foto.svg" alt="User" className="w-10 h-10 rounded-lg" />
          <div>
            <div className="font-semibold">{trader.nombre}</div>
            <div className="text-sm text-gray-400">{trader.tipoCuenta}</div>
          </div>
        </div>
        <button 
          onClick={() => handleShowDetails(trader)}
          className="text-xs bg-[#2d2d2d] hover:bg-[#3f3f3f] transition-colors text-white py-2 px-3 rounded-lg"
        >
          {t('dashboard.activeAccounts.history')}
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-gray-400">{t('dashboard.activeAccounts.table.balance')}</div>
          <div className="font-semibold">{trader.balance}</div>
        </div>
        <div>
          <div className="text-gray-400">{t('dashboard.activeAccounts.table.equity')}</div>
          <div className="font-semibold">{trader.equidad}</div>
        </div>
        <div>
          <div className="text-gray-400">{t('dashboard.activeAccounts.table.lotsTraded')}</div>
          <div className="font-semibold">{trader.lotesOperados}</div>
        </div>
        <div>
          <div className="text-gray-400">{t('dashboard.activeAccounts.table.commissionsGenerated')}</div>
          <div className="font-semibold">{trader.comisionesGeneradas}</div>
        </div>
      </div>

      {/* Retiros */}
      <div className="pt-2 border-t border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">{t('dashboard.activeAccounts.table.withdrawalsClaimed')}</span>
          <span className="font-semibold">{trader.retirosCobrados}</span>
        </div>
      </div>
    </div>
  );

  // Renderizar el contenido según la pestaña activa
  const renderContent = () => {
    // Loading animation disabled to prevent stuck loading
    // if (isLoadingData) {
    //     return (
    //       <div className="flex justify-center items-center h-60">
    //         <Loader size={40} className="animate-spin text-cyan-500" />
    //       </div>
    //     );
    // }
      
    switch (activeTab) {
      case 'panel':
        return (
          <div className="space-y-6">
            {/* Rendimiento */}
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-medium">{t('dashboard.performance.title')}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Comisiones Totales Cobradas */}
                <div className="p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-xl border border-[#333]">
                  <h3 className="text-base md:text-lg font-medium text-gray-400 mb-2">{t('dashboard.performance.totalCommissionsCollected')}</h3>
                  <p className="text-2xl md:text-4xl font-semibold">$0.00</p>
                </div>
                
                {/* Cantidad De Comisiones Totales */}
                <div className="p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-xl border border-[#333]">
                  <h3 className="text-base md:text-lg font-medium text-gray-400 mb-2">{t('dashboard.performance.totalCommissionAmount')}</h3>
                  <p className="text-2xl md:text-4xl font-semibold">0</p>
                </div>
                
                {/* Comisiones Promedio */}
                <div className="p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-xl border border-[#333]">
                  <h3 className="text-base md:text-lg font-medium text-gray-400 mb-2">{t('dashboard.performance.averageCommissions')}</h3>
                  <p className="text-2xl md:text-4xl font-semibold">$0.00</p>
                </div>
              </div>
            </div>
            
            {/* Enlace De Afiliados, Registro y Conversion */}
            <div className="space-y-4">
              {/* Enlace De Afiliados Card - Span completo en móvil */}
              <div className="p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-xl border border-[#333] space-y-3">
                <h3 className="text-base md:text-lg font-medium text-gray-400">{t('dashboard.affiliateSection.affiliateLink')}</h3>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                  <div className="flex-grow p-3 bg-[#1a1a1a] rounded-lg border border-[#333] text-gray-300 text-sm break-all">
                    {userId ? `${window.location.origin}/register?ref=${userId}` : t('dashboard.affiliateSection.generateLink')}
                  </div>
                  <button
                    className="p-3 hover:bg-[#333] rounded-lg border border-[#333] disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    onClick={() => copyToClipboard(userId)}
                    disabled={!userId}
                  >
                    <Copy size={16} className="text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Registro y Conversion - Grid en desktop, stack en móvil */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cantidad De Registro Card */}
              <div className="p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-xl border border-[#333]">
                  <h3 className="text-base md:text-lg font-medium text-gray-400 mb-2">{t('dashboard.affiliateSection.registeredReferrals')}</h3>
                  <p className="text-2xl md:text-4xl font-semibold">{referralCount}</p> 
                  </div>
                  
              {/* Conversion Card */}
              <div className="p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-xl border border-[#333]">
                  <h3 className="text-base md:text-lg font-medium text-gray-400 mb-2">{t('dashboard.affiliateSection.conversion')}</h3>
                  <p className="text-2xl md:text-4xl font-semibold">N/A</p>
                </div>
              </div>
            </div>
            
        {/* Tiers Section */}
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-medium">{t('dashboard.commissionLevels.title')}</h2>
              
              {/* Commission Info Box */}
              <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/30 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="text-blue-400 mt-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-blue-400 font-semibold mb-2">{t('dashboard.commissionLevels.systemTitle')}</h4>
                    <div className="space-y-2">
                      <div className="border-l-2 border-cyan-400 pl-3">
                        <p className="text-cyan-400 font-medium">{t('dashboard.commissionLevels.marketDirect')}</p>
                        <p className="text-gray-300 text-sm">{t('dashboard.commissionLevels.allInstruments')}</p>
                        <p className="text-gray-400 text-xs">{t('dashboard.commissionLevels.instrumentsNote')}</p>
                      </div>
                      <div className="border-l-2 border-yellow-400 pl-3">
                        <p className="text-yellow-400 font-medium">{t('dashboard.commissionLevels.institucional')}</p>
                        <p className="text-gray-300 text-sm">{t('dashboard.commissionLevels.forexMetalsOnly')}</p>
                        <p className="text-gray-400 text-xs">{t('dashboard.commissionLevels.metaquotesRestriction')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tier 1 */}
          <div className={`p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-xl border ${
            currentTier >= 1 ? 'border-cyan-500' : 'border-[#333]'
          } space-y-2`}>
                  <h3 className="text-lg md:text-xl font-semibold mb-1">{t('dashboard.commissionLevels.tier1.name')}</h3>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="text-cyan-400 text-sm">{t('dashboard.commissionLevels.marketDirect')}:</span>
                      <span className="text-white font-bold">{t('dashboard.commissionLevels.tier1.marketDirectAmount')}</span>
                      <span className="text-gray-500 text-xs">{t('dashboard.commissionLevels.perLot')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400 text-sm">{t('dashboard.commissionLevels.institucional')}:</span>
                      <span className="text-white font-bold">{t('dashboard.commissionLevels.tier1.institucionalAmount')}</span>
                      <span className="text-gray-500 text-xs">{t('dashboard.commissionLevels.perLot')}</span>
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-gray-500">{t('dashboard.commissionLevels.requirement')}: {t('dashboard.commissionLevels.tier1.requirement')}</p> 
          </div>

          {/* Tier 2 */}
          <div className={`relative p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-xl border ${
            currentTier >= 2 ? 'border-cyan-500' : 'border-[#333]'
          } space-y-2`}>
            {currentTier < 2 ? (
              <div className="absolute top-3 right-3 text-gray-500">
                <Lock size={18} />
              </div>
            ) : null}
                  <h3 className="text-lg md:text-xl font-semibold mb-1">{t('dashboard.commissionLevels.tier2.name')}</h3>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="text-cyan-400 text-sm">{t('dashboard.commissionLevels.marketDirect')}:</span>
                      <span className="text-white font-bold">{t('dashboard.commissionLevels.tier2.marketDirectAmount')}</span>
                      <span className="text-gray-500 text-xs">{t('dashboard.commissionLevels.perLot')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400 text-sm">{t('dashboard.commissionLevels.institucional')}:</span>
                      <span className="text-white font-bold">{t('dashboard.commissionLevels.tier2.institucionalAmount')}</span>
                      <span className="text-gray-500 text-xs">{t('dashboard.commissionLevels.perLot')}</span>
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-gray-500">{t('dashboard.commissionLevels.requirement')}: {t('dashboard.commissionLevels.tier2.requirement')}</p>
          </div>

          {/* Tier 3 */}
          <div className={`relative p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-xl border ${
            currentTier >= 3 ? 'border-cyan-500' : 'border-[#333]'
          } space-y-2`}>
            {currentTier < 3 ? (
              <div className="absolute top-3 right-3 text-gray-500">
                <Lock size={18} />
              </div>
            ) : null}
                  <h3 className="text-lg md:text-xl font-semibold mb-1">{t('dashboard.commissionLevels.tier3.name')}</h3>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="text-cyan-400 text-sm">{t('dashboard.commissionLevels.marketDirect')}:</span>
                      <span className="text-white font-bold">{t('dashboard.commissionLevels.tier3.marketDirectAmount')}</span>
                      <span className="text-gray-500 text-xs">{t('dashboard.commissionLevels.perLot')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400 text-sm">{t('dashboard.commissionLevels.institucional')}:</span>
                      <span className="text-white font-bold">{t('dashboard.commissionLevels.tier3.institucionalAmount')}</span>
                      <span className="text-gray-500 text-xs">{t('dashboard.commissionLevels.perLot')}</span>
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-gray-500">{t('dashboard.commissionLevels.requirement')}: {t('dashboard.commissionLevels.tier3.requirement')}</p>
                </div>
          </div>
        </div>

            {/* Cuentas activas y comisiones generadas */}
            <div className="space-y-4 pt-6">
              {/* Titles */}
              <div>
                <h2 className="text-2xl md:text-3xl font-medium">{t('dashboard.activeAccounts.title')}</h2>
                <p className="text-gray-400 text-base md:text-lg">{t('dashboard.activeAccounts.topAffiliates', { count: visibleAfiliados })}</p>
              </div>

              {/* Desktop Table View */}
              {!isMobile && (
                <>
              {/* Headers */}
              <div className="grid grid-cols-[minmax(150px,1.5fr)_minmax(0,3fr)_minmax(0,1.5fr)_repeat(5,minmax(0,1fr))] gap-x-4 px-4 text-sm text-gray-400 font-medium">
                <div className="col-start-2">{t('dashboard.activeAccounts.table.user')}</div>
                <div>{t('dashboard.activeAccounts.table.accountType')}</div>
                <div className="text-center">{t('dashboard.activeAccounts.table.balance')}</div>
                <div className="text-center">{t('dashboard.activeAccounts.table.equity')}</div>
                <div className="text-center">{t('dashboard.activeAccounts.table.lotsTraded')}</div>
                <div className="text-center">{t('dashboard.activeAccounts.table.commissionsGenerated')}</div>
                <div className="text-center">{t('dashboard.activeAccounts.table.withdrawalsClaimed')}</div>
              </div>

              {/* Rows */}
              <div className="space-y-3">
                {activeAccounts.map((trader) => (
                  <div key={trader.id} className="grid grid-cols-[minmax(150px,1.5fr)_minmax(0,3fr)_minmax(0,1.5fr)_repeat(5,minmax(0,1fr))] items-center gap-x-4 p-4 rounded-xl bg-[#202020]">
                    {/* Column 1: Button */}
                    <button 
                      onClick={() => handleShowDetails(trader)}
                      className="text-sm bg-[#2d2d2d] hover:bg-[#3f3f3f] transition-colors text-white py-2 px-4 rounded-lg"
                    >
                      {t('dashboard.activeAccounts.withdrawalHistory')}
                    </button>
                    
                    {/* Column 2: User Info */}
                    <div className="flex items-center space-x-3">
                      <div className="text-lg font-semibold text-gray-500">{trader.id}.</div>
                      <img src="/Foto.svg" alt="User" className="w-10 h-10 rounded-lg" />
                      <div>
                        <div className="font-semibold whitespace-nowrap">{trader.nombre}</div>
                      </div>
                    </div>

                    {/* Other data columns */}
                    <div className="text-sm">{trader.tipoCuenta}</div>
                    <div className="text-sm text-center">{trader.balance}</div>
                    <div className="text-sm text-center">{trader.equidad}</div>
                    <div className="text-sm text-center">{trader.lotesOperados}</div>
                    <div className="text-sm text-center">{trader.comisionesGeneradas}</div>
                    <div className="text-sm text-center">{trader.retirosCobrados}</div>
                  </div>
                ))}
              </div>
                </>
              )}

              {/* Mobile Card View */}
              {isMobile && (
                <div className="space-y-3">
                  {activeAccounts.map(trader => renderMobileAfiliadosCard(trader))}
                </div>
              )}

              {/* Pagination */}
              <div className="mt-6">
                <Pagination
                  currentPage={currentPageCuentas}
                  totalPages={totalPagesCuentas}
                  onPageChange={setCurrentPageCuentas}
                  itemsPerPage={itemsPerPage}
                  totalItems={totalActiveAccounts}
                  className="justify-center"
                />
              </div>
            </div>
          </div>
        );
      case 'referencias':
        return (
          <div className="space-y-4">
            {/* Mobile-friendly table */}
            {isMobile ? (
              <div className="space-y-4">
                <p className="text-center text-gray-400 py-8">{t('dashboard.references.noReferencesAvailable')}</p>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="py-4 px-3 font-medium">{t('dashboard.references.table.referenceId')}</th>
                    <th className="py-4 px-3 font-medium">{t('dashboard.references.table.fullName')}</th>
                    <th className="py-4 px-3 font-medium">{t('dashboard.references.table.country')}</th>
                    <th className="py-4 px-3 font-medium">{t('dashboard.references.table.createdAt')}</th>
                    <th className="py-4 px-3 font-medium">{t('dashboard.references.table.campaignId')}</th>
                    <th className="py-4 px-3 font-medium">{t('dashboard.references.table.campaignName')}</th>
                    <th className="py-4 px-3 font-medium">{t('dashboard.references.table.purchaseCount')}</th>
                    <th className="py-4 px-3 font-medium">{t('dashboard.references.table.totalRevenue')}</th>
                    <th className="py-4 px-3 font-medium">{t('dashboard.references.table.commissions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {referenciasData.length > 0 ? (
                    referenciasData.map((item, index) => (
                      <tr key={index} className="border-b border-gray-800 text-sm">
                        {/* Datos dinámicos aquí */}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-gray-400">
                        {t('dashboard.references.noDataAvailable')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            )}
          </div>
        );
      case 'pagos':
        return (
          <div className="space-y-4">
            {/* Mobile-friendly table */}
            {isMobile ? (
              <div className="space-y-4">
                <p className="text-center text-gray-400 py-8">{t('dashboard.payments.noPaymentsAvailable')}</p>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="py-4 px-3 font-medium">{t('dashboard.payments.table.paymentId')}</th>
                    <th className="py-4 px-3 font-medium">
                      <div className="flex items-center">
                        {t('dashboard.payments.table.createdAt')}
                        <ArrowUpDown size={14} className="ml-1" />
                      </div>
                    </th>
                    <th className="py-4 px-3 font-medium">{t('dashboard.payments.table.amountToPay')}</th>
                    <th className="py-4 px-3 font-medium">{t('dashboard.payments.table.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pagosData.length > 0 ? (
                    pagosData.map((item, index) => (
                      <tr key={index} className="border-b border-gray-800 text-sm">
                        {/* Datos dinámicos aquí */}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-400">
                        {t('dashboard.references.noDataAvailable')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (selectedTrader) {
    return <WithdrawalHistoryDetails user={selectedTrader} onBack={handleBackToDashboard} />;
  }

  return (
    <div className="flex flex-col min-h-screen border border-[#333] rounded-3xl bg-[#232323] text-white p-3 md:p-6">

      {/* Tabs */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full">
          <button
            className={`px-3 md:px-4 py-2 md:py-3 rounded-full focus:outline-none bg-gradient-to-br from-[#232323] to-[#2d2d2d] border-[#333] font-regular flex items-center justify-center space-x-2 text-sm md:text-base ${
              activeTab === 'panel' 
                ? 'border border-cyan-500 text-white' 
                : 'border border-[#333] text-gray-300 hover:bg-[#2a2a2a]'
            }`}
            onClick={() => handleTabClick('panel')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>{t('dashboard.tabs.panel')}</span>
          </button>
          
          <button
            className={`px-3 md:px-4 py-2 md:py-3 rounded-full focus:outline-none font-regular bg-gradient-to-br from-[#232323] to-[#2d2d2d] border-[#333] flex items-center justify-center space-x-2 text-sm md:text-base ${
              activeTab === 'referencias' 
                ? 'border border-cyan-500 text-white' 
                : 'border border-[#333] text-gray-300 hover:bg-[#2a2a2a]'
            }`}
            onClick={() => handleTabClick('referencias')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
            <span>{t('dashboard.tabs.references')}</span>
          </button>
          
          <button
            className={`px-3 md:px-4 py-2 md:py-3 rounded-full flex focus:outline-none font-regular bg-gradient-to-br from-[#232323] to-[#2d2d2d] border-[#333] items-center justify-center space-x-2 text-sm md:text-base ${
              activeTab === 'pagos' 
                ? 'border border-cyan-500 text-white' 
                : 'border border-[#333] text-gray-300 hover:bg-[#2a2a2a]'
            }`}
            onClick={() => handleTabClick('pagos')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M2 10h20" />
            </svg>
            <span>{t('dashboard.tabs.payments')}</span>
          </button>
        </div>
      </div>
      
      {/* Content Container */}
      <div className="p-3 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-xl border border-[#333] mb-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default AfiliadosDashboard;