import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const WithdrawComponent = () => {
  const { t } = useTranslation(['wallet', 'common', 'paymentMethods']);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [activeTab, setActiveTab] = useState('retiros');
  const [selectedAccount, setSelectedAccount] = useState({ id: 3452, name: 'Cuenta 1', balance: 5620 });
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Lista de cuentas disponibles
  const availableAccounts = [
    { id: 3452, name: 'Cuenta 1', balance: 5620, type: 'Standard' },
    { id: 3453, name: 'Cuenta 2', balance: 12450, type: 'Premium' },
    { id: 3454, name: 'Cuenta 3', balance: 8930, type: 'VIP' },
    { id: 3455, name: 'Demo Account', balance: 10000, type: 'Demo' }
  ];
  
  const handleSelectMethod = (method) => {
    setSelectedMethod(method);
    setCurrentStep(2);
  };
  
  const handleSelectCoin = (coin) => {
    setSelectedCoin(coin);
    setCurrentStep(3);
  };
  
  const handleWithdraw = () => {
    console.log("Procesando retiro:", {
      método: selectedMethod,
      moneda: selectedCoin,
      acceptTerms
    });
  };
  
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
    setShowAccountDropdown(false);
  };

  const toggleAccountDropdown = () => {
    setShowAccountDropdown(!showAccountDropdown);
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAccountDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sample transaction data
  const transactions = [
    { monto: "$1.200,00 USD", metodo: "Criptomoneda", fecha: "25/04/2025", estado: "Cobrado", tiempo: "15:03 min", numero: "123456" },
    { monto: "$1.200,00 USD", metodo: "Criptomoneda", fecha: "25/04/2025", estado: "Pendiente", tiempo: "15:03 min", numero: "123456" },
    { monto: "$1.200,00 USD", metodo: "Criptomoneda", fecha: "25/04/2025", estado: "Cobrado", tiempo: "15:03 min", numero: "123456" },
    { monto: "$1.200,00 USD", metodo: "Criptomoneda", fecha: "25/04/2025", estado: "Pendiente", tiempo: "15:03 min", numero: "123456" },
  ];
  
  return (
    <div className="p-6 bg-gradient-to-br from-[#232323] to-[#2b2b2b] text-white border border-[#334155] rounded-3xl">
      {/* Header con selección de cuenta */}
      <div className="flex justify-between items-center mb-8">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={toggleAccountDropdown}
            className="flex items-center gap-3 px-4 py-2 bg-[#374151] hover:bg-[#4b5563] rounded-lg border border-[#4b5563] transition-colors"
          >
            <span className="text-[#9ca3af] font-medium text-sm">Seleccionar Cuenta</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-4 w-4 text-[#9ca3af] transition-transform ${showAccountDropdown ? 'rotate-180' : ''}`} 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showAccountDropdown && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-[#232323] border border-[#4b5563] rounded-lg shadow-lg z-50">
              <div className="p-2">
                {availableAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => handleAccountSelect(account)}
                    className={`w-full p-3 text-left rounded-lg transition-colors ${
                      selectedAccount.id === account.id
                        ? 'bg-[#374151] border border-[#06b6d4]'
                        : 'hover:bg-[#374151]'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-white">{account.name} (ID {account.id})</div>
                        <div className="text-xs text-[#9ca3af]">{account.type}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-white">${account.balance.toLocaleString()}</div>
                        <div className="text-xs text-[#9ca3af]">USD</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="px-6 py-2 bg-[#374151] rounded-full border border-[#4b5563] text-white font-medium">
          {selectedAccount.name} (ID {selectedAccount.id})
        </div>
      </div>
              
        {/* Balance Card */}
        <div className="relative rounded-2xl p-[2px] mb-8" style={{
          background: 'linear-gradient(to bottom, rgba(6, 182, 212, 1) 0%, rgba(6, 182, 212, 1) 50%, rgba(6, 182, 212, 0) 100%)'
        }}>
          <div className="bg-[#232323] rounded-2xl p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[#9ca3af] mb-1 text-sm font-medium">Balance Disponible (USD)</p>
                <h1 className="text-4xl font-bold text-white">${selectedAccount.balance.toLocaleString()}</h1>
                <p className="text-xs text-[#9ca3af] mt-1">{selectedAccount.type} Account</p>
              </div>
              <div className="space-y-3">
                <button className="w-44 flex justify-between items-center px-4 py-3 bg-[#374151] hover:bg-[#4b5563] rounded-lg transition-colors border border-[#4b5563]">
                  <span className="text-white font-medium">Depositar</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button className="w-44 flex justify-between items-center px-4 py-3 bg-[#374151] hover:bg-[#4b5563] rounded-lg transition-colors border border-[#4b5563]">
                  <span className="text-white font-medium">Retirar</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Withdraw Title */}
        <h2 className="text-2xl font-bold mb-8 text-white">Retirar</h2>
        
        {/* Steps Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Step 1 */}
          <div className={`bg-[#232323] rounded-xl border-2 p-6 ${currentStep === 1 ? 'border-[#06b6d4]' : 'border-[#334155]'}`}>
            <h3 className="text-lg font-semibold mb-2 text-white">Paso 1</h3>
            <p className="text-[#9ca3af] mb-6 text-sm">Seleccionar el método de retiro</p>
            
            <div className="space-y-3">
              <button 
                onClick={() => handleSelectMethod('skrill')}
                className={`w-full p-4 text-left rounded-lg border-2 font-medium transition-all ${
                  selectedMethod === 'skrill' 
                    ? 'bg-[#374151] border-[#06b6d4] text-white' 
                    : 'bg-[#1e1e1e] border-[#4b5563] text-[#9ca3af] hover:bg-[#374151] hover:text-white'
                }`}
              >
                Skrill
              </button>
              
              <button 
                onClick={() => handleSelectMethod('criptomoneda')}
                className={`w-full p-4 text-left rounded-lg border-2 font-medium transition-all ${
                  selectedMethod === 'criptomoneda' 
                    ? 'bg-[#374151] border-[#06b6d4] text-white' 
                    : 'bg-[#1e1e1e] border-[#4b5563] text-[#9ca3af] hover:bg-[#374151] hover:text-white'
                }`}
              >
                Criptomoneda
              </button>
            </div>
          </div>
          
          {/* Step 2 */}
          <div className={`bg-[#232323] rounded-xl border-2 p-6 ${currentStep === 2 ? 'border-[#06b6d4]' : 'border-[#334155]'} ${currentStep < 2 ? 'opacity-60' : ''}`}>
            <h3 className="text-lg font-semibold mb-2 text-white">Paso 2</h3>
            <p className="text-[#9ca3af] mb-6 text-sm">Seleccionar una moneda</p>
            
            {currentStep >= 2 && (
              <div className="space-y-3">
                <button 
                  onClick={() => handleSelectCoin('USDT_ETH')}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    selectedCoin === 'USDT_ETH' 
                      ? 'bg-[#374151] border-[#06b6d4]' 
                      : 'bg-[#1e1e1e] border-[#4b5563] hover:bg-[#374151]'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-white">USDT (ETH)</span>
                    <span className="text-[#22d3ee] text-sm font-medium">USDT (ETH)</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#9ca3af] mt-2">
                    <span>Mínimo: 25</span>
                    <span>Confirmaciones: 3</span>
                  </div>
                </button>
                
                <button 
                  onClick={() => handleSelectCoin('USDC_ETH')}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    selectedCoin === 'USDC_ETH' 
                      ? 'bg-[#374151] border-[#06b6d4]' 
                      : 'bg-[#1e1e1e] border-[#4b5563] hover:bg-[#374151]'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-white">USDC (ETH)</span>
                    <span className="text-[#22d3ee] text-sm font-medium">USDC (ETH)</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#9ca3af] mt-2">
                    <span>Mínimo: 25</span>
                    <span>Confirmaciones: 3</span>
                  </div>
                </button>
                
                <button 
                  onClick={() => handleSelectCoin('USDT_TRC20')}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    selectedCoin === 'USDT_TRC20' 
                      ? 'bg-[#374151] border-[#06b6d4]' 
                      : 'bg-[#1e1e1e] border-[#4b5563] hover:bg-[#374151]'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-white">USDT (TRC-20)</span>
                    <span className="text-[#22d3ee] text-sm font-medium">USDT TRX</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#9ca3af] mt-2">
                    <span>Mínimo: 12</span>
                    <span>Confirmaciones: 20</span>
                  </div>
                </button>
              </div>
            )}
          </div>
          
          {/* Step 3 */}
          <div className={`bg-[#232323] rounded-xl border-2 p-6 ${currentStep === 3 ? 'border-[#06b6d4]' : 'border-[#334155]'} ${currentStep < 3 ? 'opacity-60' : ''}`}>
            <h3 className="text-lg font-semibold mb-2 text-white">Paso 3</h3>
            <p className="text-[#9ca3af] mb-6 text-sm">Retirar</p>
            
            {currentStep >= 3 && (
              <div>
                <div className="bg-[#1e1e1e] p-4 rounded-lg mb-6 border border-[#334155]">
                  <p className="text-[#22d3ee] mb-2 text-sm font-medium">Asegúrese de enviar solo:</p>
                  <p className="text-[#9ca3af] mb-2 text-xs leading-relaxed">A la dirección de depósito designada. Los depósitos realizados en la billetera incorrecta o blockchain corren el riesgo de perderse permanentemente.</p>
                  <p className="text-[#9ca3af] text-xs leading-relaxed">No asumimos la responsabilidad por las pérdidas incurridas debido a depósitos incorrectos.</p>
                </div>
                
                <div className="flex items-center mb-6">
                  <input 
                    type="checkbox" 
                    id="terms" 
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mr-3 w-4 h-4 text-[#06b6d4] bg-[#1e1e1e] border-[#4b5563] rounded focus:ring-[#06b6d4] focus:ring-2"
                  />
                  <label htmlFor="terms" className="text-sm text-[#9ca3af] font-medium">{t('common:messages.confirmData')}</label>
                </div>
                
                <button 
                  onClick={handleWithdraw}
                  disabled={!acceptTerms}
                  className={`w-full py-3 rounded-lg text-center font-semibold transition-all ${
                    acceptTerms 
                      ? 'bg-gradient-to-r from-[#06b6d4] to-[#0891b2] hover:from-[#0891b2] hover:to-[#0e7490] text-white' 
                      : 'bg-[#374151] text-[#6b7280] cursor-not-allowed'
                  }`}
                >
                  Retirar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* History Section */}
        <div className="bg-[#232323] rounded-2xl border border-[#334155] overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-[#334155]">
            <button 
              onClick={() => setActiveTab('retiros')}
              className={`px-8 py-4 font-semibold text-sm transition-all relative ${
                activeTab === 'retiros' 
                  ? 'text-white border-b-2 border-[#06b6d4]' 
                  : 'text-[#9ca3af] hover:text-white'
              }`}
            >
              Historial De Retiros
            </button>
            <button 
              onClick={() => setActiveTab('depositos')}
              className={`px-8 py-4 font-semibold text-sm transition-all relative ${
                activeTab === 'depositos' 
                  ? 'text-white border-b-2 border-[#06b6d4]' 
                  : 'text-[#9ca3af] hover:text-white'
              }`}
            >
              Historial De Depósitos
            </button>
            <div className="flex-1"></div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#374151]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#9ca3af]">Monto</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#9ca3af]">Moneda / Método</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#9ca3af]">Fecha</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#9ca3af]">Estado De La Orden</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#9ca3af]">Tiempo de procesamiento</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#9ca3af]">Número De Orden</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction, index) => (
                  <tr key={index} className={`${index % 2 === 0 ? 'bg-[#1e1e1e]' : 'bg-[#232323]'} hover:bg-[#374151] transition-colors`}>
                    <td className="px-6 py-4 text-white font-semibold text-sm">{transaction.monto}</td>
                    <td className="px-6 py-4 text-[#9ca3af] text-sm">{transaction.metodo}</td>
                    <td className="px-6 py-4 text-[#9ca3af] text-sm">{transaction.fecha}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`font-medium ${
                        transaction.estado === 'Cobrado' 
                          ? 'text-[#10b981]' 
                          : 'text-[#f59e0b]'
                      }`}>
                        {transaction.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#9ca3af] text-sm">{transaction.tiempo}</td>
                    <td className="px-6 py-4 text-[#9ca3af] text-sm">{transaction.numero}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
};

export default WithdrawComponent;