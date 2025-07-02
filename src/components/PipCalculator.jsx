import React, { useState, useEffect } from 'react';

// Componente principal
const PipCalculator = () => {
  const [activeTab, setActiveTab] = useState('pips');
  const [pipValue, setPipValue] = useState(1.00);
  const [positionSize, setPositionSize] = useState(1.00);
  const [accountCurrency, setAccountCurrency] = useState('USD');
  const [instrument, setInstrument] = useState('AUD/CAD');
  const [isMobile, setIsMobile] = useState(false);
  const [pipAmount, setPipAmount] = useState(0);
  const [calculatedResult, setCalculatedResult] = useState(null);
  const [riskAmount, setRiskAmount] = useState(0);
  const [riskPercentage, setRiskPercentage] = useState(1);
  const [accountBalance, setAccountBalance] = useState(10000);
  
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

  const handlePipChange = (increment) => {
    const newValue = parseFloat((pipValue + increment).toFixed(2));
    if (newValue > 0) {
      setPipValue(newValue);
    }
  };

  const handlePositionSizeChange = (increment) => {
    const newValue = parseFloat((positionSize + increment).toFixed(2));
    if (newValue > 0) {
      setPositionSize(newValue);
    }
  };

  // Calcular la conversión de monedas (simplificado para este ejemplo)
  const getExchangeRate = (base, quote) => {
    const rates = {
      'EUR/USD': 1.08,
      'GBP/USD': 1.25,
      'USD/JPY': 150.5,
      'AUD/CAD': 0.89,
      'USD/CAD': 1.36,
      'EUR/GBP': 0.85,
      'AUD/USD': 0.65,
      'USD/CHF': 0.90,
      'EUR/CZK': 25.5,
    };
    
    if (rates[`${base}/${quote}`]) {
      return rates[`${base}/${quote}`];
    } else if (rates[`${quote}/${base}`]) {
      return 1 / rates[`${quote}/${base}`];
    }
    
    // Si necesitamos cruzar a través de USD
    if (rates[`${base}/USD`] && rates[`USD/${quote}`]) {
      return rates[`${base}/USD`] * rates[`USD/${quote}`];
    } else if (rates[`USD/${base}`] && rates[`USD/${quote}`]) {
      return rates[`USD/${quote}`] / rates[`USD/${base}`];
    } else if (rates[`USD/${base}`] && rates[`${quote}/USD`]) {
      return 1 / (rates[`USD/${base}`] * rates[`${quote}/USD`]);
    }
    
    return 1; // Default fallback
  };

  // Calcular el valor de pip para el par de divisas y la moneda de la cuenta
  const calculatePipValue = () => {
    const [base, quote] = instrument.split('/');
    let pipMultiplier = 0.0001; // Default para la mayoría de pares
    
    // Ajustar para pares que incluyen JPY
    if (quote === 'JPY' || base === 'JPY') {
      pipMultiplier = 0.01;
    }
    
    // Valor base del pip en la moneda cotizada
    let pipValueInQuote = positionSize * 100000 * pipMultiplier;
    
    // Convertir a la moneda de la cuenta si es necesario
    if (quote === accountCurrency) {
      return pipValueInQuote;
    } else {
      const exchangeRate = getExchangeRate(quote, accountCurrency);
      return pipValueInQuote * exchangeRate;
    }
  };

  // Calcular el tamaño de posición basado en riesgo
  const calculatePositionSize = () => {
    const [base, quote] = instrument.split('/');
    const riskAmountValue = (accountBalance * riskPercentage) / 100;
    
    // Asumimos un valor de pip para calcular el tamaño de la posición
    const pipValuePerLot = calculatePipValue() / positionSize;
    
    // Calcular el tamaño de la posición basado en el monto a arriesgar y los pips
    const calculatedSize = pipAmount > 0 ? riskAmountValue / (pipAmount * pipValuePerLot) : 0;
    
    return {
      positionSize: calculatedSize.toFixed(2),
      riskAmount: riskAmountValue.toFixed(2)
    };
  };

  // Ejecutar cálculo basado en la pestaña activa
  const handleCalculate = () => {
    if (activeTab === 'pips') {
      // Calcular valor de pip
      const calculatedPipValue = calculatePipValue() * pipValue;
      setCalculatedResult({
        pipsValue: calculatedPipValue.toFixed(2),
        currency: accountCurrency
      });
    } else {
      // Calcular tamaño de posición
      const result = calculatePositionSize();
      setCalculatedResult({
        suggestedSize: result.positionSize,
        riskAmount: result.riskAmount,
        currency: accountCurrency
      });
    }
  };

  const currencies = [
    { code: 'USD', flag: '/us.png' },
    { code: 'GBP', flag: './gbp.png' },
    { code: 'EUR', flag: './eur.png' },
    { code: 'CZK', flag: './czk.png' },
    { code: 'CAD', flag: './cad.png' },
    { code: 'AUD', flag: './aud.png' },
    { code: 'CHF', flag: './chf.png' },
  ];

  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] text-white flex flex-col border border-[#333] rounded-3xl">
      {/* Tabs - Responsivos */}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mb-6">
        <button 
          onClick={() => setActiveTab('pips')}
          className={`px-4 md:px-6 py-2 rounded-full text-base md:text-lg border ${
            activeTab === 'pips' 
              ? 'border-cyan-500 bg-transparent' 
              : 'border-gray-700 bg-gradient-to-br from-[#232323] to-[#2d2d2d]'
          }`}
          style={{ outline: 'none' }}
        >
          Calculadora de pips
        </button>
        <button 
          onClick={() => setActiveTab('position')}
          className={`px-4 md:px-6 py-2 rounded-full text-base md:text-lg border ${
            activeTab === 'position' 
              ? 'border-cyan-500 bg-transparent' 
              : 'border-gray-700 bg-gradient-to-br from-[#232323] to-[#2d2d2d]'
          }`}
          style={{ outline: 'none' }}
        >
          Calculadora de tamaño de posicion
        </button>
      </div>

      {/* Contenedor principal - Responsive */}
      <div className="flex-1 border border-[#333] rounded-3xl p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] flex flex-col">
        {/* Instrumento - Responsivo */}
        <div className="mb-6">
          <h2 className="text-base md:text-lg mb-2">Instrumento</h2>
          <div className="relative">
            <select 
              value={instrument}
              onChange={(e) => setInstrument(e.target.value)}
              className="w-full sm:w-3/4 md:w-1/2 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-lg px-4 py-3 appearance-none"
              style={{ outline: 'none' }}
            >
              <option value="AUD/CAD">AUD/CAD</option>
              <option value="EUR/USD">EUR/USD</option>
              <option value="GBP/USD">GBP/USD</option>
              <option value="USD/JPY">USD/JPY</option>
            </select>
            <div className="absolute inset-y-0 right-4 sm:right-1/4 md:right-1/2 transform translate-x-[-20px] flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>

        {activeTab === 'pips' ? (
          /* Campos de entrada para calculadora de pips */
          <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-4 mb-6">
            <div className="w-full md:w-1/2">
              <h2 className="text-base md:text-lg mb-2">Cantidad de pip</h2>
              <div className="relative flex items-center">
                <button 
                  onClick={() => handlePipChange(-0.01)}
                  className="bg-transparent absolute left-4 text-2xl text-gray-400 focus:outline-none"
                >
                  ‹
                </button>
                <input 
                  type="text" 
                  value={pipValue.toFixed(2)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0) setPipValue(val);
                  }}
                  className="w-full bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-lg px-12 py-4 md:py-5 text-center"
                  style={{ outline: 'none' }}
                />
                <button 
                  onClick={() => handlePipChange(0.01)}
                  className="absolute bg-transparent right-4 text-2xl text-gray-400 focus:outline-none"
                >
                  ›
                </button>
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <h2 className="text-base md:text-lg mb-2">Tamaño de la posición (lotes)</h2>
              <div className="relative flex items-center">
                <button 
                  onClick={() => handlePositionSizeChange(-0.01)}
                  className="absolute left-4 text-2xl bg-transparent text-gray-400 focus:outline-none"
                >
                  ‹
                </button>
                <input 
                  type="text" 
                  value={positionSize.toFixed(2)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0) setPositionSize(val);
                  }}
                  className="w-full bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-lg px-12 py-4 md:py-5 text-center focus:outline-none"
                />
                <button 
                  onClick={() => handlePositionSizeChange(0.01)}
                  className="focus:outline-none absolute right-4 text-2xl bg-transparent text-gray-400"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Campos de entrada para calculadora de tamaño de posición */
          <div className="flex flex-col space-y-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-base md:text-lg mb-2">Balance de la cuenta</h2>
                <div className="relative flex items-center">
                  <input 
                    type="text" 
                    value={accountBalance}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val > 0) setAccountBalance(val);
                    }}
                    className="w-full bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-lg px-4 py-4 text-center focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <h2 className="text-base md:text-lg mb-2">Riesgo (%)</h2>
                <div className="relative flex items-center">
                  <input 
                    type="text" 
                    value={riskPercentage}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val > 0 && val <= 100) setRiskPercentage(val);
                    }}
                    className="w-full bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-lg px-4 py-4 text-center focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <h2 className="text-base md:text-lg mb-2">Stop Loss (pips)</h2>
                <div className="relative flex items-center">
                  <input 
                    type="text" 
                    value={pipAmount}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val > 0) setPipAmount(val);
                    }}
                    className="w-full bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-lg px-4 py-4 text-center focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Moneda de la cuenta - Responsivo */}
        <div className="mb-6">
          <h2 className="text-base md:text-lg mb-2">Moneda de la cuenta</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {currencies.map((currency) => (
              <button
                key={currency.code}
                onClick={() => setAccountCurrency(currency.code)}
                className={`flex items-center justify-center space-x-1 md:space-x-2 py-2 md:py-3 px-2 md:px-4 rounded-lg border ${
                  accountCurrency === currency.code 
                    ? 'border-cyan-500 bg-transparent' 
                    : 'border-gray-700 bg-gradient-to-br from-[#232323] to-[#2d2d2d]'
                }`}
                style={{ outline: 'none' }}
              >
                <img src={currency.flag} alt={currency.code} className="w-4 h-4 md:w-5 md:h-5 object-cover rounded-full" />
                <span className="text-xs md:text-base">{currency.code}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mostrar resultados si hay cálculos */}
        {calculatedResult && (
          <div className="my-6 p-4 border border-cyan-700 rounded-lg bg-gradient-to-br from-[#152e35] to-[#1a3746]">
            <h2 className="text-lg md:text-xl mb-3 text-cyan-300">Resultado:</h2>
            {activeTab === 'pips' ? (
              <p className="text-xl font-bold">
                {pipValue} pip{pipValue !== 1 ? 's' : ''} = {calculatedResult.pipsValue} {calculatedResult.currency}
              </p>
            ) : (
              <div>
                <p className="text-lg md:text-xl mb-2">
                  Tamaño de posición sugerido: <span className="font-bold">{calculatedResult.suggestedSize} lotes</span>
                </p>
                <p className="text-base md:text-lg text-cyan-200">
                  Riesgo: {calculatedResult.riskAmount} {calculatedResult.currency} ({riskPercentage}% del balance)
                </p>
              </div>
            )}
          </div>
        )}

        {/* Botón Calcular - Responsivo */}
        <button 
          onClick={handleCalculate}
          className="focus:outline-none mt-6 w-full sm:w-1/2 md:w-1/6 bg-gradient-to-r from-[#0F7490] to-[#0A5A72] text-white py-3 rounded-xl hover:opacity-90 transition"
        >
          Calcular
        </button>
      </div>
    </div>
  );
};

export default PipCalculator;