import React, { useState } from 'react';

const WithdrawComponent = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const handleSelectMethod = (method) => {
    setSelectedMethod(method);
    setCurrentStep(2);
  };
  
  const handleSelectCoin = (coin) => {
    setSelectedCoin(coin);
    setCurrentStep(3);
  };
  
  const handleWithdraw = () => {
    // Lógica para procesar el retiro
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
  
  return (
    <div className="p-4 bg-gradient-to-br from-[#232323] to-[#2b2b2b] text-white border border-[#333] rounded-3xl">
      {/* Header con selección de cuenta */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8z" />
            <path d="M12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
          </svg>
          <span className="font-medium">Cuentas</span>
        </div>
        <div className="px-6 py-2 bg-[#333] rounded-full border border-[#444]">
          Cuenta 1 (ID 3452)
        </div>
      </div>
      
      {/* Balance Card */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <p className="text-gray-400 mb-1">Balance Disponible (USD)</p>
          <h1 className="text-3xl font-bold">$5.620</h1>
        </div>
        <div className="space-y-2">
          <button className="w-40 flex justify-between items-center px-4 py-2 bg-[#333] hover:bg-[#444] rounded-md transition">
            <span>Depositar</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button className="w-40 flex justify-between items-center px-4 py-2 bg-[#333] hover:bg-[#444] rounded-md transition">
            <span>Retirar</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Withdraw Title */}
      <h2 className="text-2xl font-bold mb-6">Retirar</h2>
      
      {/* Steps Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1 */}
        <div className={`p-4 bg-[#1e1e1e] rounded-xl border ${currentStep === 1 ? 'border-cyan-500' : 'border-[#333]'}`}>
          <h3 className="text-lg font-semibold mb-2">Paso 1</h3>
          <p className="text-gray-400 mb-4">Seleccionar el método de retiro</p>
          
          <div className="space-y-2">
            <button 
              onClick={() => handleSelectMethod('stableCoins')}
              className={`w-full p-3 text-left rounded-md border ${selectedMethod === 'stableCoins' ? 'bg-[#333] border-cyan-500' : 'bg-[#2a2a2a] border-[#444]'} hover:bg-[#333] transition`}
            >
              Stable Coins
            </button>
            
            <button 
              onClick={() => handleSelectMethod('onlinePayment')}
              className={`w-full p-3 text-left rounded-md border ${selectedMethod === 'onlinePayment' ? 'bg-[#333] border-cyan-500' : 'bg-[#2a2a2a] border-[#444]'} hover:bg-[#333] transition`}
            >
              Online Payment
            </button>
          </div>
        </div>
        
        {/* Step 2 */}
        <div className={`p-4 bg-[#1e1e1e] rounded-xl border ${currentStep === 2 ? 'border-cyan-500' : 'border-[#333]'}`}>
          <h3 className="text-lg font-semibold mb-2">Paso 2</h3>
          <p className="text-gray-400 mb-4">Seleccionar una moneda</p>
          
          {currentStep >= 2 && (
            <div className="space-y-2">
              <button 
                onClick={() => handleSelectCoin('USDT_ETH')}
                className={`w-full p-3 rounded-md border ${selectedCoin === 'USDT_ETH' ? 'bg-[#333] border-cyan-500' : 'bg-[#2a2a2a] border-[#444]'} hover:bg-[#333] transition`}
              >
                <div className="flex justify-between">
                  <span className="font-medium">USDT (ETH)</span>
                  <span className="text-gray-400">USDT (ETH)</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400 mt-1">
                  <span>Mínimo: 25</span>
                  <span>Confirmaciones: 3</span>
                </div>
              </button>
              
              <button 
                onClick={() => handleSelectCoin('USDC_ETH')}
                className={`w-full p-3 rounded-md border ${selectedCoin === 'USDC_ETH' ? 'bg-[#333] border-cyan-500' : 'bg-[#2a2a2a] border-[#444]'} hover:bg-[#333] transition`}
              >
                <div className="flex justify-between">
                  <span className="font-medium">USDC (ETH)</span>
                  <span className="text-gray-400">USDC (ETH)</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400 mt-1">
                  <span>Mínimo: 25</span>
                  <span>Confirmaciones: 3</span>
                </div>
              </button>
              
              <button 
                onClick={() => handleSelectCoin('USDT_TRC20')}
                className={`w-full p-3 rounded-md border ${selectedCoin === 'USDT_TRC20' ? 'bg-[#333] border-cyan-500' : 'bg-[#2a2a2a] border-[#444]'} hover:bg-[#333] transition`}
              >
                <div className="flex justify-between">
                  <span className="font-medium">USDT (TRC-20)</span>
                  <span className="text-gray-400">USDT TRX</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400 mt-1">
                  <span>Mínimo: 12</span>
                  <span>Confirmaciones: 20</span>
                </div>
              </button>
            </div>
          )}
        </div>
        
        {/* Step 3 */}
        <div className={`p-4 bg-[#1e1e1e] rounded-xl border ${currentStep === 3 ? 'border-cyan-500' : 'border-[#333]'}`}>
          <h3 className="text-lg font-semibold mb-2">Paso 3</h3>
          <p className="text-gray-400 mb-4">Retirar</p>
          
          {currentStep >= 3 && (
            <div>
              <div className="bg-[#2a2a2a] p-4 rounded-md mb-4 text-sm">
                <p className="text-gray-300 mb-2">Asegúrese de enviar solo:</p>
                <p className="text-gray-400 mb-2">• la dirección de depósito designada para este activo. Si se envía a la billetera incorrecta o blockchain, corren el riesgo de perderse permanentemente.</p>
                <p className="text-gray-400">• No somos responsables por las pérdidas incurridas debido a depósitos incorrectos.</p>
              </div>
              
              <div className="flex items-center mb-4">
                <input 
                  type="checkbox" 
                  id="terms" 
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="terms" className="text-sm text-gray-300">Entiendo y quiero continuar</label>
              </div>
              
              <button 
                onClick={handleWithdraw}
                disabled={!acceptTerms}
                className={`w-full py-2 rounded-md text-center transition ${acceptTerms ? 'bg-gradient-to-br from-[#0F7490] to-[#053a4b] hover:opacity-90' : 'bg-gray-700 cursor-not-allowed'}`}
              >
                Retirar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WithdrawComponent;