import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuthAdapter } from '../services/database.adapter';
import { Trash2, PlusCircle, ChevronDown, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const PaymentMethodSettings = ({ onBack }) => {
  const { t } = useTranslation('settings');
  const { currentUser, userData, refreshUserData } = useAuth();
  const [methodType, setMethodType] = useState('crypto');
  const [alias, setAlias] = useState('');
  
  // Crypto fields
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [cryptoNetwork, setCryptoNetwork] = useState('tron_trc20');
  const [addressError, setAddressError] = useState('');

  // Bank fields
  const [cbu, setCbu] = useState('');
  const [holderName, setHolderName] = useState('');
  const [holderId, setHolderId] = useState('');
  
  // Estados para el dropdown de red
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
  const networkDropdownRef = useRef(null);
  
  // Estado local para métodos de pago
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Cargar métodos de pago al montar el componente
  useEffect(() => {
    const loadPaymentMethods = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      try {
        const userId = currentUser.id || currentUser.uid;
        
        // Cargar los métodos de pago directamente
        const { getPaymentMethods } = await import('../supabase/auth');
        const { data } = await getPaymentMethods(userId);
        console.log('Payment methods loaded:', data);
        setPaymentMethods(data || []);
        
        // También refrescar userData para mantener sincronización
        await refreshUserData();
      } catch (error) {
        console.error('Error loading payment methods:', error);
        toast.error(t('paymentMethods.errors.loadingMethods'));
      } finally {
        setLoading(false);
      }
    };
    
    loadPaymentMethods();
  }, [currentUser]);
  
  // Actualizar cuando userData cambie
  useEffect(() => {
    if (userData?.paymentMethods) {
      setPaymentMethods(userData.paymentMethods);
    }
  }, [userData?.paymentMethods]);
  
  // Opciones de red disponibles con validación y formato mejorado
  const networkOptions = [
    { 
      value: 'tron_trc20', 
      label: t('paymentMethods.networks.tetherTron'),
      placeholder: 'TJk2UJsS9x...',
      regex: /^T[A-Za-z1-9]{33}$/,
      errorMessage: t('paymentMethods.errors.tronAddressFormat')
    },
    { 
      value: 'ethereum_erc20', 
      label: t('paymentMethods.networks.tetherEthereum'),
      placeholder: '0x742d35Cc6...',
      regex: /^0x[a-fA-F0-9]{40}$/,
      errorMessage: t('paymentMethods.errors.ethereumAddressFormat')
    },
    { 
      value: 'bitcoin', 
      label: t('paymentMethods.networks.bitcoinMain'),
      placeholder: 'bc1qxy2kgdyg...',
      regex: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/,
      errorMessage: t('paymentMethods.errors.bitcoinAddressFormat')
    }
  ];

  // Función para validar direcciones crypto
  const validateCryptoAddress = (address, network) => {
    const selectedNetwork = networkOptions.find(n => n.value === network);
    if (!selectedNetwork) return false;
    
    return selectedNetwork.regex.test(address);
  };

  // Obtener el network seleccionado actual
  const getCurrentNetwork = () => {
    return networkOptions.find(n => n.value === cryptoNetwork) || networkOptions[0];
  };

  // Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (networkDropdownRef.current && !networkDropdownRef.current.contains(event.target)) {
        setIsNetworkDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNetworkSelect = (networkValue) => {
    setCryptoNetwork(networkValue);
    setIsNetworkDropdownOpen(false);
    setCryptoAddress(''); // Limpiar dirección al cambiar de red
    setAddressError(''); // Limpiar error
  };

  // Validar dirección en tiempo real
  const handleAddressChange = (e) => {
    const address = e.target.value;
    setCryptoAddress(address);
    
    if (address && !validateCryptoAddress(address, cryptoNetwork)) {
      const network = getCurrentNetwork();
      setAddressError(network.errorMessage);
    } else {
      setAddressError('');
    }
  };

  const handleAddMethod = async (e) => {
    e.preventDefault();

    let newMethod;
    if (methodType === 'crypto') {
      if (!alias || !cryptoAddress || !cryptoNetwork) {
        toast.error(t('paymentMethods.errors.completeAllCryptoFields'));
        return;
      }
      
      // Validar dirección crypto
      if (!validateCryptoAddress(cryptoAddress, cryptoNetwork)) {
        const network = getCurrentNetwork();
        toast.error(network.errorMessage);
        return;
      }
      
      newMethod = { type: 'crypto', alias, address: cryptoAddress, network: cryptoNetwork };
    } else { // bank
      if (!alias || !cbu || !holderName || !holderId) {
        toast.error(t('paymentMethods.errors.completeAllBankFields'));
        return;
      }
      
      // Validar CBU (22 dígitos)
      if (!/^\d{22}$/.test(cbu.replace(/[^0-9]/g, ''))) {
        toast.error(t('paymentMethods.errors.invalidCbu'));
        return;
      }
      
      // Validar CUIT/CUIL (11 dígitos)
      if (!/^\d{11}$/.test(holderId.replace(/[^0-9]/g, ''))) {
        toast.error(t('paymentMethods.errors.invalidCuit'));
        return;
      }
      
      newMethod = { type: 'bank', alias, cbu, holderName, holderId };
    }

    const loadingToast = toast.loading(t('paymentMethods.addingMethod'));
    const userId = currentUser.id || currentUser.uid;
    
    const result = await AuthAdapter.addPaymentMethod(userId, newMethod);
    if (result.success) {
      toast.success(t('paymentMethods.methodAddedSuccess'), { id: loadingToast });
      
      // Refrescar datos del usuario y actualizar lista local
      await refreshUserData();
      
      // Cargar los métodos de pago actualizados
      const { getPaymentMethods } = await import('../supabase/auth');
      const { data } = await getPaymentMethods(userId);
      setPaymentMethods(data || []);
      
      // Reset form
      setAlias('');
      setCryptoAddress('');
      setAddressError('');
      setCbu('');
      setHolderName('');
      setHolderId('');
    } else {
      toast.error(`Error: ${result.error}`, { id: loadingToast });
    }
  };

  const handleDeleteMethod = async (method) => {
    // Usar una confirmación con toast más elegante
    const confirmDelete = () => {
      toast((t) => (
        <div>
          <p className="font-medium mb-2">{t('paymentMethods.confirmDelete', { alias: method.alias })}</p>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const loadingToast = toast.loading(t('paymentMethods.deleting'));
                const userId = currentUser.id || currentUser.uid;
                const result = await AuthAdapter.deletePaymentMethod(userId, method);
                if (result.success) {
                  toast.success(t('paymentMethods.methodDeletedSuccess'), { id: loadingToast });
                  
                  // Refrescar datos del usuario y actualizar lista local
                  await refreshUserData();
                  
                  // Cargar los métodos de pago actualizados
                  const { getPaymentMethods } = await import('../supabase/auth');
                  const { data } = await getPaymentMethods(userId);
                  setPaymentMethods(data || []);
                } else {
                  toast.error(`Error: ${result.error}`, { id: loadingToast });
                }
              }}
              className="px-3 py-1 bg-red-500 text-white rounded-md text-sm"
            >
              {t('paymentMethods.delete')}
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 bg-gray-600 text-white rounded-md text-sm"
            >
              {t('paymentMethods.cancel')}
            </button>
          </div>
        </div>
      ), {
        duration: 5000,
        position: 'top-center',
      });
    };
    
    confirmDelete();
  };

  return (
    <div className="p-4 md:p-6 text-white">
      {/* Header */}
      <div className="flex items-center mb-6">
        <img 
          src="/Back.svg" 
          alt="Back" 
          onClick={onBack}
          className="w-10 h-10 cursor-pointer hover:brightness-75 transition-all duration-300 mr-4"
        />
        <h1 className="text-2xl md:text-3xl font-semibold">{t('paymentMethods.title')}</h1>
      </div>

      {/* Lista de métodos existentes */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">{t('paymentMethods.yourPaymentMethods')}</h2>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          </div>
        ) : paymentMethods.length > 0 ? (
          <div className="space-y-3">
            {paymentMethods.map(method => (
              <div key={method.id} className="p-4 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-lg flex justify-between items-center border border-[#333] hover:border-cyan-500/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-white">{method.alias}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      method.type === 'crypto' 
                        ? 'bg-yellow-500/20 text-yellow-500' 
                        : 'bg-blue-500/20 text-blue-500'
                    }`}>
                      {method.type === 'crypto' ? t('paymentMethods.crypto') : t('paymentMethods.bank')}
                    </span>
                  </div>
                  
                  {method.type === 'crypto' ? (
                    <>
                      <p className="text-sm text-cyan-400 mb-1">
                        {networkOptions.find(n => n.value === method.network)?.label || method.network}
                      </p>
                      <p className="text-xs text-gray-400 font-mono break-all">
                        {method.address}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-300">
                        <span className="text-gray-500">{t('paymentMethods.cbuCvu')}:</span> <span className="font-mono">{method.cbu}</span>
                      </p>
                      <p className="text-sm text-gray-300">
                        <span className="text-gray-500">{t('paymentMethods.holder')}:</span> {method.holderName}
                      </p>
                      <p className="text-sm text-gray-300">
                        <span className="text-gray-500">{t('paymentMethods.holderCuit')}:</span> {method.holderId}
                      </p>
                    </>
                  )}
                </div>
                <button onClick={() => handleDeleteMethod(method)} className="p-2 hover:bg-red-500/20 rounded-full text-red-400">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">{t('paymentMethods.noMethodsConfigured')}</p>
        )}
      </div>

      {/* Formulario para agregar nuevo método */}
      <div>
        <h2 className="text-xl font-bold mb-4">{t('paymentMethods.addNewMethod')}</h2>
        <form onSubmit={handleAddMethod} className="p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-lg border border-[#333] space-y-4">
          {/* Selector de Tipo */}
          <div className="flex gap-4 mb-4">
             <button type="button" onClick={() => setMethodType('crypto')} className={`flex-1 py-2 px-4 rounded-lg transition ${methodType === 'crypto' ? 'bg-cyan-600 text-white' : 'bg-[#333] hover:bg-[#444]'}`}>{t('paymentMethods.cryptoWallet')}</button>
             <button type="button" onClick={() => setMethodType('bank')} className={`flex-1 py-2 px-4 rounded-lg transition ${methodType === 'bank' ? 'bg-cyan-600 text-white' : 'bg-[#333] hover:bg-[#444]'}`}>{t('paymentMethods.bankTransfer')}</button>
          </div>
          
          {/* Campos Comunes */}
          <div>
            <label htmlFor="alias" className="block text-sm font-medium text-gray-300 mb-1">{t('paymentMethods.alias')}</label>
            <input type="text" id="alias" value={alias} onChange={e => setAlias(e.target.value)} className="w-full p-2 bg-[#1a1a1a] border border-[#444] rounded-lg focus:outline-none focus:border-cyan-500" placeholder={t('paymentMethods.aliasPlaceholder')} />
          </div>

          {methodType === 'crypto' ? (
            <>
              {/* Campos Crypto */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('paymentMethods.network')}</label>
                <div className="relative" ref={networkDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
                    className="w-full p-2 bg-[#1a1a1a] border border-[#444] rounded-lg focus:outline-none focus:border-cyan-500 text-left flex items-center justify-between text-white"
                  >
                    <span>{getCurrentNetwork().label}</span>
                    <ChevronDown 
                      size={20} 
                      className={`text-gray-400 transition-transform ${isNetworkDropdownOpen ? 'rotate-180' : ''}`} 
                    />
                  </button>
                  
                  {isNetworkDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#2d2d2d] border border-[#444] rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                      {networkOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleNetworkSelect(option.value)}
                          className="w-full text-left px-3 py-2 text-white hover:bg-[#404040] transition-colors first:rounded-t-lg last:rounded-b-lg"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="cryptoAddress" className="block text-sm font-medium text-gray-300 mb-1">
                  {t('paymentMethods.walletAddress')}
                </label>
                <input 
                  type="text" 
                  id="cryptoAddress" 
                  value={cryptoAddress} 
                  onChange={handleAddressChange}
                  placeholder={getCurrentNetwork().placeholder}
                  className={`w-full p-2 bg-[#1a1a1a] border ${addressError ? 'border-red-500' : 'border-[#444]'} rounded-lg focus:outline-none focus:border-cyan-500 font-mono text-sm`}
                />
                {addressError && (
                  <div className="mt-1 flex items-start gap-1">
                    <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-400">{addressError}</p>
                  </div>
                )}
                {!addressError && cryptoAddress && (
                  <p className="text-xs text-green-400 mt-1">{t('paymentMethods.validAddress')}</p>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Campos Banco */}
              <div>
                <label htmlFor="holderName" className="block text-sm font-medium text-gray-300 mb-1">{t('paymentMethods.holderName')}</label>
                <input type="text" id="holderName" value={holderName} onChange={e => setHolderName(e.target.value)} className="w-full p-2 bg-[#1a1a1a] border border-[#444] rounded-lg focus:outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label htmlFor="holderId" className="block text-sm font-medium text-gray-300 mb-1">{t('paymentMethods.holderCuit')}</label>
                <input type="text" id="holderId" value={holderId} onChange={e => setHolderId(e.target.value)} className="w-full p-2 bg-[#1a1a1a] border border-[#444] rounded-lg focus:outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label htmlFor="cbu" className="block text-sm font-medium text-gray-300 mb-1">{t('paymentMethods.cbuCvu')}</label>
                <input type="text" id="cbu" value={cbu} onChange={e => setCbu(e.target.value)} className="w-full p-2 bg-[#1a1a1a] border border-[#444] rounded-lg focus:outline-none focus:border-cyan-500" />
              </div>
            </>
          )}

          <button type="submit" className="w-full py-3 bg-gradient-to-r from-[#0F7490] to-[#0A5A72] text-white rounded-lg hover:opacity-90 transition flex items-center justify-center">
            <PlusCircle size={20} className="mr-2" />
            {t('paymentMethods.addMethod')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentMethodSettings; 