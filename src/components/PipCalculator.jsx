import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Star, Search as SearchIcon } from 'lucide-react';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

// Expanded and refined list of Forex currency pairs
const forexInstruments = [
  // Major Pairs
  { value: 'EUR/USD', label: 'EUR/USD', type: 'forex' },
  { value: 'GBP/USD', label: 'GBP/USD', type: 'forex' },
  { value: 'USD/JPY', label: 'USD/JPY', type: 'forex' },
  { value: 'USD/CHF', label: 'USD/CHF', type: 'forex' },
  { value: 'USD/CAD', label: 'USD/CAD', type: 'forex' },
  { value: 'AUD/USD', label: 'AUD/USD', type: 'forex' },
  { value: 'NZD/USD', label: 'NZD/USD', type: 'forex' },

  // Minor Pairs (Crosses) - EUR
  { value: 'EUR/GBP', label: 'EUR/GBP', type: 'forex' }, { value: 'EUR/JPY', label: 'EUR/JPY', type: 'forex' },
  { value: 'EUR/CHF', label: 'EUR/CHF', type: 'forex' }, { value: 'EUR/AUD', label: 'EUR/AUD', type: 'forex' },
  { value: 'EUR/CAD', label: 'EUR/CAD', type: 'forex' }, { value: 'EUR/NZD', label: 'EUR/NZD', type: 'forex' },
  { value: 'EUR/NOK', label: 'EUR/NOK', type: 'forex' }, { value: 'EUR/SEK', label: 'EUR/SEK', type: 'forex' },
  { value: 'EUR/PLN', label: 'EUR/PLN', type: 'forex' }, { value: 'EUR/HUF', label: 'EUR/HUF', type: 'forex' },
  { value: 'EUR/CZK', label: 'EUR/CZK', type: 'forex' }, { value: 'EUR/TRY', label: 'EUR/TRY', type: 'forex' },
  { value: 'EUR/ZAR', label: 'EUR/ZAR', type: 'forex' }, { value: 'EUR/SGD', label: 'EUR/SGD', type: 'forex' },
  { value: 'EUR/HKD', label: 'EUR/HKD', type: 'forex' }, { value: 'EUR/MXN', label: 'EUR/MXN', type: 'forex' },

  // Minor Pairs (Crosses) - GBP
  { value: 'GBP/JPY', label: 'GBP/JPY', type: 'forex' }, { value: 'GBP/CHF', label: 'GBP/CHF', type: 'forex' },
  { value: 'GBP/AUD', label: 'GBP/AUD', type: 'forex' }, { value: 'GBP/CAD', label: 'GBP/CAD', type: 'forex' },
  { value: 'GBP/NZD', label: 'GBP/NZD', type: 'forex' }, { value: 'GBP/NOK', label: 'GBP/NOK', type: 'forex' },
  { value: 'GBP/SEK', label: 'GBP/SEK', type: 'forex' }, { value: 'GBP/PLN', label: 'GBP/PLN', type: 'forex' },
  { value: 'GBP/ZAR', label: 'GBP/ZAR', type: 'forex' }, { value: 'GBP/SGD', label: 'GBP/SGD', type: 'forex' },

  // Minor Pairs (Crosses) - AUD
  { value: 'AUD/JPY', label: 'AUD/JPY', type: 'forex' }, { value: 'AUD/CHF', label: 'AUD/CHF', type: 'forex' },
  { value: 'AUD/CAD', label: 'AUD/CAD', type: 'forex' }, { value: 'AUD/NZD', label: 'AUD/NZD', type: 'forex' },
  { value: 'AUD/SGD', label: 'AUD/SGD', type: 'forex' }, { value: 'AUD/HKD', label: 'AUD/HKD', type: 'forex' },

  // Minor Pairs (Crosses) - NZD
  { value: 'NZD/JPY', label: 'NZD/JPY', type: 'forex' }, { value: 'NZD/CHF', label: 'NZD/CHF', type: 'forex' },
  { value: 'NZD/CAD', label: 'NZD/CAD', type: 'forex' }, { value: 'NZD/SGD', label: 'NZD/SGD', type: 'forex' },

  // Minor Pairs (Crosses) - CAD
  { value: 'CAD/JPY', label: 'CAD/JPY', type: 'forex' }, { value: 'CAD/CHF', label: 'CAD/CHF', type: 'forex' },
  { value: 'CAD/SGD', label: 'CAD/SGD', type: 'forex' },

  // Minor Pairs (Crosses) - CHF
  { value: 'CHF/JPY', label: 'CHF/JPY', type: 'forex' }, { value: 'CHF/NOK', label: 'CHF/NOK', type: 'forex' },
  { value: 'CHF/SEK', label: 'CHF/SEK', type: 'forex' },

  // Exotic Pairs
  { value: 'USD/NOK', label: 'USD/NOK', type: 'forex' }, { value: 'USD/SEK', label: 'USD/SEK', type: 'forex' },
  { value: 'USD/DKK', label: 'USD/DKK', type: 'forex' }, { value: 'USD/PLN', label: 'USD/PLN', type: 'forex' },
  { value: 'USD/HUF', label: 'USD/HUF', type: 'forex' }, { value: 'USD/CZK', label: 'USD/CZK', type: 'forex' },
  { value: 'USD/TRY', label: 'USD/TRY', type: 'forex' }, { value: 'USD/ZAR', label: 'USD/ZAR', type: 'forex' },
  { value: 'USD/MXN', label: 'USD/MXN', type: 'forex' }, { value: 'USD/SGD', label: 'USD/SGD', type: 'forex' },
  { value: 'USD/HKD', label: 'USD/HKD', type: 'forex' }, { value: 'USD/THB', label: 'USD/THB', type: 'forex' },
  { value: 'USD/CNH', label: 'USD/CNH', type: 'forex' }, { value: 'USD/ILS', label: 'USD/ILS', type: 'forex' },
  { value: 'USD/RUB', label: 'USD/RUB', type: 'forex' }, // Note: May have trading restrictions

  // Other common exotic crosses
  { value: 'NOK/SEK', label: 'NOK/SEK', type: 'forex' },
  { value: 'SEK/NOK', label: 'SEK/NOK', type: 'forex' }, // Inverse of above
  { value: 'TRY/JPY', label: 'TRY/JPY', type: 'forex' },
  { value: 'ZAR/JPY', label: 'ZAR/JPY', type: 'forex' },
];

const stockInstruments = [
  { value: 'AAPL', label: 'Apple Inc. (AAPL)', type: 'stocks' },
  { value: 'MSFT', label: 'Microsoft Corp. (MSFT)', type: 'stocks' },
  { value: 'GOOGL', label: 'Alphabet Inc. (GOOGL)', type: 'stocks' },
  { value: 'AMZN', label: 'Amazon.com Inc. (AMZN)', type: 'stocks' },
  { value: 'TSLA', label: 'Tesla Inc. (TSLA)', type: 'stocks' },
  { value: 'NVDA', label: 'NVIDIA Corp. (NVDA)', type: 'stocks' },
  { value: 'JPM', label: 'JPMorgan Chase & Co. (JPM)', type: 'stocks' },
  { value: 'V', label: 'Visa Inc. (V)', type: 'stocks' },
  { value: 'XOM', label: 'Exxon Mobil Corp. (XOM)', type: 'stocks' },
  { value: 'GS', label: 'Goldman Sachs Group Inc. (GS)', type: 'stocks' },
];

const cryptoInstruments = [
  { value: 'BTC/USD', label: 'Bitcoin / USD (BTC/USD)', type: 'crypto' },
  { value: 'ETH/USD', label: 'Ethereum / USD (ETH/USD)', type: 'crypto' },
  { value: 'XRP/USD', label: 'Ripple / USD (XRP/USD)', type: 'crypto' },
  { value: 'LTC/USD', label: 'Litecoin / USD (LTC/USD)', type: 'crypto' },
  { value: 'ADA/USD', label: 'Cardano / USD (ADA/USD)', type: 'crypto' },
  { value: 'SOL/USD', label: 'Solana / USD (SOL/USD)', type: 'crypto' },
  { value: 'DOGE/USD', label: 'Dogecoin / USD (DOGE/USD)', type: 'crypto' },
  { value: 'DOT/USD', label: 'Polkadot / USD (DOT/USD)', type: 'crypto' },
];

// Combine all instruments into a single array
const allInstruments = [
  ...forexInstruments,
  ...stockInstruments,
  ...cryptoInstruments,
];

// Componente principal
const PipCalculator = () => {
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState('pips');
  const [instrumentType, setInstrumentType] = useState('forex'); // State to filter dropdown content
  const [pipValue, setPipValue] = useState(1.00);
  const [positionSize, setPositionSize] = useState(1.00);
  const [accountCurrency, setAccountCurrency] = useState('USD');
  const [instrument, setInstrument] = useState('EUR/USD'); // Default to a common pair
  const [isMobile, setIsMobile] = useState(false);
  const [stopLossPips, setStopLossPips] = useState(10); // Default SL pips
  const [calculatedResult, setCalculatedResult] = useState(null);
  const [riskPercentage, setRiskPercentage] = useState(1);
  const [accountBalance, setAccountBalance] = useState(10000);

  // Raw input states for more intuitive typing
  const [rawPipValueInput, setRawPipValueInput] = useState(pipValue.toFixed(2));
  const [rawPositionSizeInput, setRawPositionSizeInput] = useState(positionSize.toFixed(2));
  const [rawAccountBalanceInput, setRawAccountBalanceInput] = useState(accountBalance.toString());
  const [rawRiskPercentageInput, setRawRiskPercentageInput] = useState(riskPercentage.toString());
  const [rawStopLossPipsInput, setRawStopLossPipsInput] = useState(stopLossPips.toString());

  // New state for instrument search and favorites
  const [instrumentSearchTerm, setInstrumentSearchTerm] = useState('');
  const [favoriteInstruments, setFavoriteInstruments] = useState([]);
  const [showInstrumentDropdown, setShowInstrumentDropdown] = useState(false);
  const instrumentDropdownRef = useRef(null); // Ref for the dropdown container

  // Load favorites from Firestore on mount if user is logged in
  useEffect(() => {
    if (currentUser) {
      const userPrefsRef = doc(db, 'userPreferences', currentUser.uid);
      getDoc(userPrefsRef).then(docSnap => {
        if (docSnap.exists() && docSnap.data().favoritePipInstruments) {
          setFavoriteInstruments(docSnap.data().favoritePipInstruments);
        }
      }).catch(error => {
        console.error("Error fetching favorite instruments from Firestore:", error);
      });
    }
    // Clear favorites if user logs out or changes
    return () => {
      if (!currentUser) {
        setFavoriteInstruments([]);
      }
    };
  }, [currentUser]);

  // Effect to handle clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (instrumentDropdownRef.current && !instrumentDropdownRef.current.contains(event.target)) {
        setShowInstrumentDropdown(false);
      }
    };

    if (showInstrumentDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInstrumentDropdown]);

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

  // Set default instrument when activeTab or instrumentType changes
  useEffect(() => {
    let defaultInstrumentValue = '';
    if (instrumentType === 'forex') {
      defaultInstrumentValue = forexInstruments[0]?.value || '';
    } else if (instrumentType === 'stocks') {
      defaultInstrumentValue = stockInstruments[0]?.value || '';
    } else if (instrumentType === 'crypto') {
      defaultInstrumentValue = cryptoInstruments[0]?.value || '';
    }
    setInstrument(defaultInstrumentValue);
    setInstrumentSearchTerm(''); // Clear search when type changes
  }, [instrumentType]);


  // Update raw input when numeric state changes (e.g. from +/- buttons)
  useEffect(() => { setRawPipValueInput(pipValue.toFixed(2)); }, [pipValue]);
  useEffect(() => { setRawPositionSizeInput(positionSize.toFixed(2)); }, [positionSize]);
  useEffect(() => { setRawAccountBalanceInput(accountBalance.toString()); }, [accountBalance]);
  useEffect(() => { setRawRiskPercentageInput(riskPercentage.toString()); }, [riskPercentage]);
  useEffect(() => { setRawStopLossPipsInput(stopLossPips.toString()); }, [stopLossPips]);

  const handlePipChange = (increment) => {
    setPipValue(prev => {
      const newValue = parseFloat((prev + increment).toFixed(2));
      return newValue > 0 ? newValue : prev;
    });
  };

  const handlePositionSizeChange = (increment) => {
    setPositionSize(prev => {
      const newValue = parseFloat((prev + increment).toFixed(2));
      return newValue > 0 ? newValue : prev;
    });
  };

  // Generic handler for input changes
  const handleRawInputChange = (value, setter, allowDecimal = true, maxChars) => {
    let sanitizedValue = value;
    if (allowDecimal) {
      sanitizedValue = value.replace(/,/g, '.'); // Allow comma as decimal, convert to period
      if (!/^\d*\.?\d*$/.test(sanitizedValue)) {
        return;
      }
    } else {
      if (!/^\d*$/.test(sanitizedValue)) {
        return;
      }
    }
    if (maxChars && sanitizedValue.length > maxChars) {
      sanitizedValue = sanitizedValue.substring(0, maxChars);
    }
    setter(sanitizedValue);
  };

  // Generic handler for input blur
  const handleNumericInputBlur = (rawValue, numericSetter, currentNumericValue, min = 0, max = Infinity, decimalPlaces = 2, isInteger = false) => {
    let num = parseFloat(rawValue.replace(/,/g, '.'));

    if (isNaN(num) || num < min) {
      num = min;
    } else if (num > max) {
      num = max;
    }

    if (isInteger) {
      num = Math.round(num);
      numericSetter(num);
    } else {
      numericSetter(parseFloat(num.toFixed(decimalPlaces)));
    }
  };

  // Pre-defined exchange rates (simplified for demonstration)
  // In a real application, these would come from a real-time API.
  const getExchangeRate = (base, quote) => {
    const rates = {
      // Major USD pairs (bi-directional for easier lookup)
      'EUR/USD': 1.0850, 'USD/EUR': 1 / 1.0850,
      'GBP/USD': 1.2700, 'USD/GBP': 1 / 1.2700,
      'USD/JPY': 150.00, 'JPY/USD': 1 / 150.00,
      'USD/CHF': 0.8800, 'CHF/USD': 1 / 0.8800,
      'USD/CAD': 1.3500, 'CAD/USD': 1 / 1.3500,
      'AUD/USD': 0.6550, 'USD/AUD': 1 / 0.6550,
      'NZD/USD': 0.6150, 'USD/NZD': 1 / 0.6150,

      // Common EUR crosses
      'EUR/GBP': 0.8550, 'GBP/EUR': 1 / 0.8550,
      'EUR/JPY': 162.75, 'JPY/EUR': 1 / 162.75,
      'EUR/CHF': 0.9550, 'CHF/EUR': 1 / 0.9550,
      'EUR/AUD': 1.6560, 'AUD/EUR': 1 / 1.6560,
      'EUR/CAD': 1.4650, 'CAD/EUR': 1 / 1.4650,
      'EUR/NZD': 1.7640, 'NZD/EUR': 1 / 1.7640,
      'EUR/NOK': 11.3000, 'NOK/EUR': 1 / 11.3000,
      'EUR/SEK': 11.2000, 'SEK/EUR': 1 / 11.2000,
      'EUR/PLN': 4.3300, 'PLN/EUR': 1 / 4.3300,
      'EUR/HUF': 390.00, 'HUF/EUR': 1 / 390.00,
      'EUR/CZK': 25.20, 'CZK/EUR': 1 / 25.20,
      'EUR/TRY': 33.5000, 'TRY/EUR': 1 / 33.5000,
      'EUR/ZAR': 20.5000, 'ZAR/EUR': 1 / 20.5000,
      'EUR/SGD': 1.4580, 'SGD/EUR': 1 / 1.4580,
      'EUR/HKD': 8.4880, 'HKD/EUR': 1 / 8.4880,
      'EUR/MXN': 18.4500, 'MXN/EUR': 1 / 18.4500,

      // Common GBP crosses
      'GBP/JPY': 190.50, 'JPY/GBP': 1 / 190.50,
      'GBP/CHF': 1.1180, 'CHF/GBP': 1 / 1.1180,
      'GBP/AUD': 1.9380, 'AUD/GBP': 1 / 1.9380,
      'GBP/CAD': 1.7145, 'CAD/GBP': 1 / 1.7145,
      'GBP/NZD': 2.0650, 'NZD/GBP': 1 / 2.0650,
      'GBP/NOK': 13.2200, 'NOK/GBP': 1 / 13.2200,
      'GBP/SEK': 13.1000, 'SEK/GBP': 1 / 13.1000,
      'GBP/PLN': 5.0670, 'PLN/GBP': 1 / 5.0670,
      'GBP/ZAR': 24.0000, 'ZAR/GBP': 1 / 24.0000,
      'GBP/SGD': 1.7070, 'SGD/GBP': 1 / 1.7070,

      // Common AUD crosses
      'AUD/JPY': 98.25, 'JPY/AUD': 1 / 98.25,
      'AUD/CHF': 0.5760, 'CHF/AUD': 1 / 0.5760,
      'AUD/CAD': 0.8840, 'CAD/AUD': 1 / 0.8840,
      'AUD/NZD': 1.0650, 'NZD/AUD': 1 / 1.0650,
      'AUD/SGD': 0.8800, 'SGD/AUD': 1 / 0.8800,
      'AUD/HKD': 5.1200, 'HKD/AUD': 1 / 5.1200,

      // Common NZD crosses
      'NZD/JPY': 92.25, 'JPY/NZD': 1 / 92.25,
      'NZD/CHF': 0.5410, 'CHF/NZD': 1 / 0.5410,
      'NZD/CAD': 0.8300, 'CAD/NZD': 1 / 0.8300,
      'NZD/SGD': 0.8260, 'SGD/NZD': 1 / 0.8260,

      // Common CAD crosses
      'CAD/JPY': 111.10, 'JPY/CAD': 1 / 111.10,
      'CAD/CHF': 0.6520, 'CHF/CAD': 1 / 0.6520,
      'CAD/SGD': 0.9950, 'SGD/CAD': 1 / 0.9950,

      // Common CHF crosses
      'CHF/JPY': 170.45, 'JPY/CHF': 1 / 170.45,
      'CHF/NOK': 11.8500, 'NOK/CHF': 1 / 11.8500,
      'CHF/SEK': 11.7000, 'SEK/CHF': 1 / 11.7000,

      // USD Exotic Pairs (Direct)
      'USD/NOK': 10.5000, 'NOK/USD': 1 / 10.5000,
      'USD/SEK': 10.4000, 'SEK/USD': 1 / 10.4000,
      'USD/DKK': 6.8500, 'DKK/USD': 1 / 6.8500,
      'USD/PLN': 3.9800, 'PLN/USD': 1 / 3.9800,
      'USD/HUF': 360.00, 'HUF/USD': 1 / 360.00,
      'USD/CZK': 23.3000, 'CZK/USD': 1 / 23.3000,
      'USD/TRY': 32.0000, 'TRY/USD': 1 / 32.0000,
      'USD/ZAR': 18.9000, 'ZAR/USD': 1 / 18.9000,
      'USD/MXN': 17.0000, 'MXN/USD': 1 / 17.0000,
      'USD/SGD': 1.3450, 'SGD/USD': 1 / 1.3450,
      'USD/HKD': 7.8200, 'HKD/USD': 1 / 7.8200,
      'USD/THB': 35.8000, 'THB/USD': 1 / 35.8000,
      'USD/CNH': 7.2500, 'CNH/USD': 1 / 7.2500,
      'USD/ILS': 3.7000, 'ILS/USD': 1 / 3.7000,
      'USD/RUB': 92.0000, 'RUB/USD': 1 / 92.0000,

      // Other exotic crosses
      'NOK/SEK': 0.9900, 'SEK/NOK': 1 / 0.9900,
      'TRY/JPY': 4.6875, 'JPY/TRY': 1 / 4.6875,
      'ZAR/JPY': 7.9365, 'JPY/ZAR': 1 / 7.9365
    };

    if (rates[`${base}/${quote}`]) {
      return rates[`${base}/${quote}`];
    } else if (rates[`${quote}/${base}`]) {
      return 1 / rates[`${quote}/${base}`];
    }

    // Attempt cross-currency calculation via USD
    if (rates[`${base}/USD`] && rates[`USD/${quote}`]) {
      return rates[`${base}/USD`] * rates[`USD/${quote}`];
    } else if (rates[`USD/${base}`] && rates[`USD/${quote}`]) {
      return rates[`USD/${quote}`] / rates[`USD/${base}`];
    } else if (rates[`USD/${base}`] && rates[`${quote}/USD`]) {
      return 1 / (rates[`USD/${base}`] * rates[`${quote}/USD`]);
    }

    console.warn(`Exchange rate not found for ${base}/${quote}, returning 1. Cross rates via USD might be missing or incorrect.`);
    return 1; // Default fallback if no direct or USD cross-rate found
  };

  // Helper to get instrument specific details (pip/tick size, contract size)
  const getInstrumentDetails = (instrumentValue) => {
    // Find the instrument in the combined list to get its type
    const instrumentObj = allInstruments.find(item => item.value === instrumentValue);
    const type = instrumentObj ? instrumentObj.type : 'forex'; // Default to forex if not found (shouldn't happen with valid instrument)

    switch (type) {
      case 'forex':
        const [base, quote] = instrumentValue.split('/');
        let pipMultiplier = 0.0001; // Standard for most Forex pairs
        if (quote && quote.toUpperCase() === 'JPY') {
          pipMultiplier = 0.01; // JPY pairs have 2 decimal places for pips
        }
        return { pipMultiplier: pipMultiplier, contractSize: 100000, currency: quote, displayUnit: 'pip' };
      case 'stocks':
        // For stocks, 1 "pip" or "point" is typically 1 unit of the quote currency.
        // Contract size typically 1 share for CFD, or 100 shares for standard lots.
        // This is a simplification. Real stock pip/tick values vary per stock and broker.
        return { pipMultiplier: 1, contractSize: 1, currency: 'USD', displayUnit: 'point' }; // Assuming USD stocks
      case 'crypto':
        // For crypto, a "tick" value depends on the specific crypto and exchange.
        // This is a simplification. Actual crypto tick values can vary (e.g., BTC $0.01, ETH $0.10).
        const [, cryptoQuote] = instrumentValue.split('/');
        return { pipMultiplier: 1, contractSize: 1, currency: cryptoQuote || 'USD', displayUnit: 'tick' }; // Default to USD if quote not found
      default:
        return { pipMultiplier: 0.0001, contractSize: 100000, currency: 'USD', displayUnit: 'pip' }; // Default Forex values
    }
  };


  // Calcular el valor de pip para el par de divisas y la moneda de la cuenta
  const calculatePipValue = () => {
    const { pipMultiplier, contractSize, currency: instrumentQuoteCurrency } = getInstrumentDetails(instrument);

    let valueInQuote = positionSize * contractSize * pipMultiplier;

    if (instrumentQuoteCurrency.toUpperCase() === accountCurrency.toUpperCase()) {
      return valueInQuote;
    } else {
      const exchangeRate = getExchangeRate(instrumentQuoteCurrency, accountCurrency);
      if (exchangeRate === 1 && instrumentQuoteCurrency.toUpperCase() !== accountCurrency.toUpperCase()) {
        console.warn(`Could not find exchange rate for ${instrumentQuoteCurrency} to ${accountCurrency}. Pip value calculation might be inaccurate.`);
      }
      return valueInQuote * exchangeRate;
    }
  };

  // Calcular el tamaño de posición basado en riesgo
  const calculatePositionSize = () => {
    const riskAmountValue = (accountBalance * riskPercentage) / 100;

    const { pipMultiplier, contractSize, currency: instrumentQuoteCurrency } = getInstrumentDetails(instrument);

    const getPipValueForOneLot = () => {
      let valueInQuoteCurrency = 1 * contractSize * pipMultiplier; // For 1 lot

      if (instrumentQuoteCurrency.toUpperCase() === accountCurrency.toUpperCase()) {
        return valueInQuoteCurrency;
      } else {
        const rate = getExchangeRate(instrumentQuoteCurrency, accountCurrency);
        return valueInQuoteCurrency * rate;
      }
    };

    const pipValuePerLot = getPipValueForOneLot();

    const calculatedSize = stopLossPips > 0 && pipValuePerLot > 0 ? riskAmountValue / (stopLossPips * pipValuePerLot) : 0;

    return {
      positionSize: calculatedSize.toFixed(2),
      riskAmount: riskAmountValue.toFixed(2)
    };
  };

  // Ejecutar cálculo basado en la pestaña activa
  const handleCalculate = () => {
    if (activeTab === 'pips') {
      const totalPipValue = calculatePipValue() * pipValue; // calculatePipValue gives for current positionSize, then multiply by pips
      const { displayUnit } = getInstrumentDetails(instrument);
      setCalculatedResult({
        pipsValue: totalPipValue.toFixed(2),
        currency: accountCurrency,
        displayUnit: displayUnit // Pass the dynamic unit
      });
    } else {
      const result = calculatePositionSize();
      setCalculatedResult({
        suggestedSize: result.positionSize,
        riskAmount: result.riskAmount,
        currency: accountCurrency
      });
    }
  };

  const toggleFavorite = async (instrumentValue) => {
    if (!currentUser) {
      setFavoriteInstruments(prev =>
        prev.includes(instrumentValue)
          ? prev.filter(fav => fav !== instrumentValue)
          : [...prev, instrumentValue]
      );
      return;
    }

    const userPrefsRef = doc(db, 'userPreferences', currentUser.uid);
    const isCurrentlyFavorite = favoriteInstruments.includes(instrumentValue);

    setFavoriteInstruments(prev =>
      isCurrentlyFavorite
        ? prev.filter(fav => fav !== instrumentValue)
        : [...prev, instrumentValue]
    );

    try {
      if (isCurrentlyFavorite) {
        await updateDoc(userPrefsRef, {
          favoritePipInstruments: arrayRemove(instrumentValue)
        });
      } else {
        await setDoc(userPrefsRef, {
          favoritePipInstruments: arrayUnion(instrumentValue)
        }, { merge: true });
      }
    } catch (error) {
      console.error("Error updating favorite instruments in Firestore:", error);
      // Revert if error occurs
      setFavoriteInstruments(prev =>
        isCurrentlyFavorite
          ? [...prev, instrumentValue]
          : prev.filter(fav => fav !== instrumentValue)
      );
    }
  };

  // Filter instruments based on the selected instrumentType and search term
  const getFilteredInstruments = () => {
    let instrumentsToFilter = [];
    if (instrumentType === 'forex') {
      instrumentsToFilter = forexInstruments;
    } else if (instrumentType === 'stocks') {
      instrumentsToFilter = stockInstruments;
    } else if (instrumentType === 'crypto') {
      instrumentsToFilter = cryptoInstruments;
    }

    const searched = instrumentsToFilter.filter(item =>
      item.label.toLowerCase().includes(instrumentSearchTerm.toLowerCase())
    );

    const favorites = searched.filter(item => favoriteInstruments.includes(item.value));
    const nonFavorites = searched.filter(item => !favoriteInstruments.includes(item.value));

    // Sort favorites and non-favorites alphabetically by label
    favorites.sort((a, b) => a.label.localeCompare(b.label));
    nonFavorites.sort((a, b) => a.label.localeCompare(b.label));

    return { favorites, nonFavorites };
  };

  const { favorites: favoriteFilteredInstruments, nonFavorites: nonFavoriteFilteredInstruments } = getFilteredInstruments();

  const currencies = [
    { code: 'USD', flag: '/us.png' },
    { code: 'EUR', flag: '/eu.png' },
    { code: 'GBP', flag: '/gb.png' },
    { code: 'JPY', flag: '/jp.png' },
    { code: 'CHF', flag: '/ch.png' },
    { code: 'CAD', flag: '/ca.png' },
    { code: 'AUD', flag: '/au.png' },
    { code: 'NZD', flag: '/nz.png' },
    { code: 'CNY', flag: '/cn.png' },
    { code: 'SEK', flag: '/se.png' },
    { code: 'NOK', flag: '/no.png' },
    { code: 'SGD', flag: '/sg.png' },
    { code: 'HKD', flag: '/hk.png' },
    { code: 'MXN', flag: '/mx.png' },
    { code: 'ZAR', flag: '/za.png' },
    { code: 'TRY', flag: '/tr.png' },
  ];

  // For Pips calculation, account currency is usually only the major ones
  const pipsCurrencies = [
    { code: 'USD', flag: '/us.png' },
  ];

  // Get the display label for the currently selected instrument from the combined list
  const selectedInstrumentLabel = allInstruments.find(item => item.value === instrument)?.label || instrument;


  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-3xl text-white flex flex-col">
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
          Pips
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
          Tamaño de Posición
        </button>
      </div>

      {/* Contenedor principal - Responsive */}
      <div className="flex-1 border border-[#333] rounded-3xl p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] flex flex-col overflow-y-auto custom-scrollbar">
        {/* Instrumento - Responsivo */}
        <div className="mb-6">
                        <h2 className="text-base md:text-lg mb-2">Instrumento</h2>
          <div className="relative w-full sm:w-3/4 md:w-1/2" ref={instrumentDropdownRef}>
            <div className="flex items-center bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-lg">
              <input
                type="text"
                value={selectedInstrumentLabel}
                onClick={() => setShowInstrumentDropdown(!showInstrumentDropdown)}
                readOnly
                className="w-full bg-transparent px-4 py-3 appearance-none cursor-pointer focus:outline-none"
                                  placeholder="Seleccionar instrumento"
              />
              <div
                className="p-3 cursor-pointer"
                onClick={() => setShowInstrumentDropdown(!showInstrumentDropdown)}
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>

            {showInstrumentDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-[#2d2d2d] border border-[#444] rounded-lg shadow-lg max-h-72 overflow-y-auto custom-scrollbar">
                {activeTab === 'pips' && ( // Only show instrument type filters if activeTab is 'pips'
                  <div className="p-2 sticky top-0 bg-[#2d2d2d] z-20 border-b border-[#444]">
                    <div className="flex justify-between space-x-2 mb-2">
                      <button
                        onClick={() => setInstrumentType('forex')}
                        className={`flex-1 px-3 py-1.5 rounded-full text-xs sm:text-sm border ${
                          instrumentType === 'forex'
                            ? 'border-cyan-500 bg-transparent'
                            : 'border-gray-700 bg-transparent'
                        }`}
                        style={{ outline: 'none' }}
                      >
                        Forex
                      </button>
                      <button
                        onClick={() => setInstrumentType('stocks')}
                        className={`flex-1 px-3 py-1.5 rounded-full text-xs sm:text-sm border ${
                          instrumentType === 'stocks'
                            ? 'border-cyan-500 bg-transparent'
                            : 'border-gray-700 bg-transparent'
                        }`}
                        style={{ outline: 'none' }}
                      >
                        Acciones
                      </button>
                      <button
                        onClick={() => setInstrumentType('crypto')}
                        className={`flex-1 px-3 py-1.5 rounded-full text-xs sm:text-sm border ${
                          instrumentType === 'crypto'
                            ? 'border-cyan-500 bg-transparent'
                            : 'border-gray-700 bg-transparent'
                        }`}
                        style={{ outline: 'none' }}
                      >
                        Cripto
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar instrumento"
                        value={instrumentSearchTerm}
                        onChange={(e) => setInstrumentSearchTerm(e.target.value)}
                        className="w-full bg-[#232323] border border-[#444] rounded-md px-3 py-2 pl-10 focus:outline-none focus:border-cyan-500"
                      />
                      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>
                  </div>
                )}
                {/* When not in 'pips' tab, only show search bar and all instruments */}
                {activeTab !== 'pips' && (
                  <div className="p-2 sticky top-0 bg-[#2d2d2d] z-20 border-b border-[#444]">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar instrumento"
                        value={instrumentSearchTerm}
                        onChange={(e) => setInstrumentSearchTerm(e.target.value)}
                        className="w-full bg-[#232323] border border-[#444] rounded-md px-3 py-2 pl-10 focus:outline-none focus:border-cyan-500"
                      />
                      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>
                  </div>
                )}

                {favoriteFilteredInstruments.length > 0 && (
                  <>
                    <div className="px-4 py-2 text-xs text-gray-400 font-semibold sticky top-[88px] bg-[#2d2d2d] z-10">Favoritos</div>
                    {favoriteFilteredInstruments.map(item => (
                      <div
                        key={item.value + '-fav'}
                        onClick={() => {
                          setInstrument(item.value);
                          setShowInstrumentDropdown(false);
                          setInstrumentSearchTerm('');
                        }}
                        className={`px-4 py-3 hover:bg-[#3a3a3a] cursor-pointer flex justify-between items-center ${instrument === item.value ? 'bg-[#3f3f3f]' : ''}`}
                      >
                        <span>{item.label}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item.value);
                          }}
                          className="p-1 rounded-full hover:bg-[#4f4f4f] focus:outline-none"
                          title={favoriteInstruments.includes(item.value) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                        >
                          <Star
                            className={`w-4 h-4 ${favoriteInstruments.includes(item.value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'}`}
                          />
                        </button>
                      </div>
                    ))}
                  </>
                )}
                {nonFavoriteFilteredInstruments.length > 0 && (
                  <>
                    {favoriteFilteredInstruments.length > 0 && nonFavoriteFilteredInstruments.length > 0 && (
                      <div className="px-4 py-2 text-xs text-gray-400 font-semibold sticky top-[88px] bg-[#2d2d2d] z-10">
                        Todos los Instrumentos
                      </div>
                    )}
                    {nonFavoriteFilteredInstruments.map(item => (
                      <div
                        key={item.value}
                        onClick={() => {
                          setInstrument(item.value);
                          setShowInstrumentDropdown(false);
                          setInstrumentSearchTerm('');
                        }}
                        className={`px-4 py-3 hover:bg-[#3a3a3a] cursor-pointer flex justify-between items-center ${instrument === item.value ? 'bg-[#3f3f3f]' : ''}`}
                      >
                        <span>{item.label}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item.value);
                          }}
                          className="p-1 rounded-full hover:bg-[#4f4f4f] focus:outline-none"
                          title={favoriteInstruments.includes(item.value) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                        >
                          <Star
                            className={`w-4 h-4 ${favoriteInstruments.includes(item.value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'}`}
                          />
                        </button>
                      </div>
                    ))}
                  </>
                )}
                {favoriteFilteredInstruments.length === 0 && nonFavoriteFilteredInstruments.length === 0 && (
                  <div className="px-4 py-3 text-gray-400 text-sm">
                    No se encontraron resultados
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {activeTab === 'pips' ? (
          <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-4 mb-6">
            <div className="w-full md:w-1/2">
              <h2 className="text-base md:text-lg mb-2">
                {instrumentType === 'forex' && 'Cantidad de Pips'}
                {instrumentType === 'stocks' && 'Cantidad de Puntos'}
                {instrumentType === 'crypto' && 'Cantidad de Ticks'}
              </h2>
              <div className="relative flex items-center">
                <button
                  onClick={() => handlePipChange(-0.01)}
                  className="bg-transparent absolute left-4 text-2xl text-gray-400 focus:outline-none"
                >
                  ‹
                </button>
                <input
                  type="text"
                  value={rawPipValueInput}
                  onChange={(e) => handleRawInputChange(e.target.value, setRawPipValueInput)}
                  onBlur={() => handleNumericInputBlur(rawPipValueInput, setPipValue, pipValue, 0.01)}
                  className="w-full bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-lg px-12 py-4 md:py-5 text-center"
                  style={{ outline: 'none' }}
                  placeholder="0.00"
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
              <h2 className="text-base md:text-lg mb-2">Tamaño de Posición (Lotes)</h2>
              <div className="relative flex items-center">
                <button
                  onClick={() => handlePositionSizeChange(-0.01)}
                  className="absolute left-4 text-2xl bg-transparent text-gray-400 focus:outline-none"
                >
                  ‹
                </button>
                <input
                  type="text"
                  value={rawPositionSizeInput}
                  onChange={(e) => handleRawInputChange(e.target.value, setRawPositionSizeInput)}
                  onBlur={() => handleNumericInputBlur(rawPositionSizeInput, setPositionSize, positionSize, 0.01)}
                  className="w-full bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-lg px-12 py-4 md:py-5 text-center focus:outline-none"
                  placeholder="0.00"
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
          <div className="flex flex-col space-y-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-base md:text-lg mb-2">Balance de la Cuenta</h2>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={rawAccountBalanceInput}
                    onChange={(e) => handleRawInputChange(e.target.value, setRawAccountBalanceInput, false, 10)}
                    onBlur={() => handleNumericInputBlur(rawAccountBalanceInput, setAccountBalance, accountBalance, 1, Infinity, 0, true)}
                    className="w-full bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-lg px-4 py-4 text-center focus:outline-none"
                    placeholder="10000"
                  />
                </div>
              </div>
              <div>
                <h2 className="text-base md:text-lg mb-2">Porcentaje de Riesgo</h2>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={rawRiskPercentageInput}
                    onChange={(e) => handleRawInputChange(e.target.value, setRawRiskPercentageInput, true, 5)}
                    onBlur={() => handleNumericInputBlur(rawRiskPercentageInput, setRiskPercentage, riskPercentage, 0.01, 100, 2)}
                    className="w-full bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-lg px-4 py-4 text-center focus:outline-none"
                    placeholder="1"
                  />
                </div>
              </div>
              <div>
                <h2 className="text-base md:text-lg mb-2">Objetivo de Pips</h2>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={rawStopLossPipsInput}
                    onChange={(e) => handleRawInputChange(e.target.value, setRawStopLossPipsInput, false, 5)}
                    onBlur={() => handleNumericInputBlur(rawStopLossPipsInput, setStopLossPips, stopLossPips, 1, Infinity, 0, true)}
                    className="w-full bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] rounded-lg px-4 py-4 text-center focus:outline-none"
                    placeholder="10"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-base md:text-lg mb-2">Moneda de la Cuenta</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {pipsCurrencies.map((currency) => (
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

        {calculatedResult && (
          <div className="my-6 p-4 border border-cyan-700 rounded-lg bg-gradient-to-br from-[#152e35] to-[#1a3746]">
            <h2 className="text-lg md:text-xl mb-3 text-cyan-300">Valor del Pip:</h2>
            {activeTab === 'pips' ? (
              <p className="text-xl font-bold">
                {parseFloat(pipValue).toFixed(2)} {calculatedResult.displayUnit}
                {pipValue !== 1 && (calculatedResult.displayUnit === 'pip' ? 's' : 's')} = {calculatedResult.pipsValue} {calculatedResult.currency}
              </p>
            ) : (
              <div>
                <p className="text-lg md:text-xl mb-2">
                  Tamaño de Posición Sugerido: <span className="font-bold">{calculatedResult.suggestedSize} lotes</span>
                </p>
                <p className="text-base md:text-lg text-cyan-200">
                  Cantidad en Riesgo: {calculatedResult.riskAmount} {calculatedResult.currency} ({riskPercentage}% del balance)
                </p>
              </div>
            )}
          </div>
        )}

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