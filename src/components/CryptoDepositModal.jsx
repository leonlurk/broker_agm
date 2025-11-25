import React, { useState, useEffect } from 'react';
import { QrCodeIcon, CopyIcon, CheckCircleIcon, XCircleIcon, Loader2Icon, InfoIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import cryptoPaymentService from '../services/cryptoPaymentService';
import { supabase } from '../supabase/config';
import toast from 'react-hot-toast';

const CryptoDepositModal = ({ 
  isOpen, 
  onClose, 
  selectedCoin, 
  amount, 
  onDepositConfirmed,
  userEmail
}) => {
  const { t } = useTranslation('wallet');
  const [loading, setLoading] = useState(false);
  const [walletInfo, setWalletInfo] = useState(null);
  const [copied, setCopied] = useState({ tron: false, bsc: false });
  const [depositStatus, setDepositStatus] = useState('waiting'); // waiting, detected, confirmed
  const [depositData, setDepositData] = useState(null);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Mapeo de monedas a redes
  const getCoinNetwork = (coinId) => {
    if (coinId === 'USDT_TRC20') return 'tron';
    if (coinId === 'USDT_ERC20' || coinId === 'USDT_ETH' || coinId === 'USDC_ETH') return 'bsc'; // ERC-20 usa la misma dirección que BSC
    return 'tron'; // default
  };

  // Generar wallet cuando se abre el modal
  useEffect(() => {
    if (isOpen && !walletInfo) {
      generateWallet();
    }
  }, [isOpen]);

  // Polling para verificar el estado del depósito en el backend
  useEffect(() => {
    if (!walletInfo || depositStatus !== 'waiting' || !isAuthenticated) return;

    const checkDepositStatus = async () => {
      try {
        // Verificar si hay una transacción confirmada para esta wallet
        const response = await cryptoPaymentService.checkTransactionStatus(walletInfo.tron.address, walletInfo.bsc.address);
        
        if (response.success && response.confirmed) {
          setDepositStatus('confirmed');
          setDepositData(response.transaction);

          // Notificar con toast
          toast.success(
            `Depósito confirmado: $${response.transaction.amount} ${response.transaction.network}`,
            { duration: 5000 }
          );

          // Notificar al componente padre
          setTimeout(() => {
            onDepositConfirmed({
              amount: response.transaction.amount,
              network: response.transaction.network,
              walletAddress: response.transaction.wallet_address,
              txHash: response.transaction.tx_hash,
              status: 'completed'
            });
          }, 2000);
        }
      } catch (error) {
        console.error('Error checking deposit status:', error);
      }
    };

    // Verificar cada 10 segundos
    const interval = setInterval(checkDepositStatus, 10000);
    
    // Verificar inmediatamente solo si estamos autenticados
    if (isAuthenticated) {
      checkDepositStatus();
    }

    return () => clearInterval(interval);
  }, [walletInfo, depositStatus, onDepositConfirmed, isAuthenticated]);

  const generateWallet = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Usar wallets fijas de la empresa para recibir depósitos
      // IMPORTANTE: Estas son las billeteras donde los clientes envían sus depósitos
      const fixedWallet = {
        tron: {
          address: 'TEaQgjdWECF4fjzgscF6pA5v2GQvPPhBpR', // Billetera TRON de la empresa (TRC-20)
          qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TEaQgjdWECF4fjzgscF6pA5v2GQvPPhBpR`
        },
        bsc: {
          // Esta dirección se usa tanto para ERC-20 (Ethereum) como BEP-20 (BSC)
          address: '0x38CfeC0B9199d6cA2944df012621F7C60be4b0d9', // Billetera Ethereum/BSC de la empresa
          qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=0x38CfeC0B9199d6cA2944df012621F7C60be4b0d9`
        }
      };
      
      setWalletInfo(fixedWallet);
      setDepositStatus('waiting');
      
      // Obtener el token de la sesión actual de Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        console.warn('No se pudo obtener el token de autenticación');
      } else {
        // Autenticar usando el token de Supabase
        const authResult = await cryptoPaymentService.authenticateWithSupabase(session.access_token, userEmail);
        
        if (!authResult.success) {
          console.warn('Error de autenticación:', authResult.error);
          setError(t('cryptoModal.errors.authError'));
        } else {
          setIsAuthenticated(true);
          console.log('Autenticación exitosa con Payroll API');
        }
      }
    } catch (error) {
      console.error('Error generating wallet:', error);
      setError(error.message || t('cryptoModal.errors.generateError'));
      toast.error(t('cryptoModal.errors.generateError'));
    } finally {
      setLoading(false);
    }
  };


  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied({ ...copied, [type]: true });
      toast.success(t('cryptoModal.success.addressCopied'));
      
      setTimeout(() => {
        setCopied({ ...copied, [type]: false });
      }, 2000);
    } catch (error) {
      toast.error(t('cryptoModal.errors.copyError'));
    }
  };

  const getRelevantWallet = () => {
    if (!walletInfo) return null;
    
    const network = getCoinNetwork(selectedCoin);
    return network === 'tron' ? walletInfo.tron : walletInfo.bsc;
  };

  const getNetworkName = () => {
    if (selectedCoin === 'USDT_TRC20') return 'TRON (TRC-20)';
    if (selectedCoin === 'USDT_ERC20') return 'Ethereum (ERC-20) / BSC (BEP-20)';
    // Por defecto
    const network = getCoinNetwork(selectedCoin);
    return network === 'tron' ? 'TRON (TRC-20)' : 'Ethereum/BSC';
  };

  const getMinimumDeposit = () => {
    // Mínimo de $50 USD para todos los depósitos
    return 50;
  };

  // Handler para cerrar el modal
  const handleCloseAttempt = () => {
    onClose();
  };

  // Permitir cierre con ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        handleCloseAttempt();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const relevantWallet = getRelevantWallet();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
      onClick={(e) => {
        // Prevenir cierre al hacer clic fuera del modal durante polling
        if (e.target === e.currentTarget) {
          handleCloseAttempt();
        }
      }}
    >
      <div className="bg-[#1e1e1e] rounded-2xl p-6 max-w-lg w-full mx-auto border border-[#334155] max-h-[85vh] relative">
        <div className="overflow-y-auto max-h-[calc(85vh-3rem)]">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{t('cryptoModal.title')}</h2>
          <button
            onClick={handleCloseAttempt}
            className="text-gray-400 hover:text-white cursor-pointer transition-colors"
          >
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2Icon className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
            <p className="text-gray-400">{t('cryptoModal.generating')}</p>
          </div>
        )}

        {/* Wallet Info */}
        {!loading && relevantWallet && (
          <div className="space-y-4">
            {/* Network Info */}
            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-400 mb-1">{t('cryptoModal.network')}</p>
                <div className="relative group">
                  <InfoIcon className="w-4 h-4 text-cyan-400 cursor-help" />
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[9999] border border-gray-700">
                    Red blockchain
                  </div>
                </div>
              </div>
              <p className="text-white font-semibold">{getNetworkName()}</p>
            </div>

            {/* Amount Info */}
            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-1">
                <p className="text-sm text-gray-400">{t('cryptoModal.amountToDeposit')}</p>
                <div className="relative group">
                  <InfoIcon className="w-4 h-4 text-cyan-400 cursor-help" />
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[9999] border border-gray-700">
                    Transferir monto exacto
                  </div>
                </div>
              </div>
              <p className="text-2xl font-bold text-white">${amount} USD</p>
              <p className="text-xs text-gray-500 mt-1">
                {t('cryptoModal.minimum')}: ${getMinimumDeposit()} USD
              </p>
            </div>

            {/* QR Code */}
            <div className="bg-[#2a2a2a] rounded-lg p-6 flex flex-col items-center">
              <div className="flex items-center space-x-2 mb-3">
                <p className="text-sm text-gray-400">{t('cryptoModal.scanQR')}</p>
                <div className="relative group">
                  <InfoIcon className="w-4 h-4 text-cyan-400 cursor-help" />
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[9999] border border-gray-700">
                    Escanee QR
                  </div>
                </div>
              </div>
              <div className="bg-white p-2 rounded-lg">
                <img 
                  src={relevantWallet.qrCode} 
                  alt="QR Code" 
                  className="w-48 h-48"
                />
              </div>
            </div>

            {/* Wallet Address */}
            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <p className="text-sm text-gray-400">{t('cryptoModal.copyAddress')}</p>
                <div className="relative group">
                  <InfoIcon className="w-4 h-4 text-cyan-400 cursor-help" />
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[9999] border border-gray-700">
                    Copiar dirección
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={relevantWallet.address}
                  readOnly
                  className="flex-1 bg-[#1e1e1e] border border-[#4b5563] rounded-lg px-3 py-2 text-white text-sm font-mono"
                />
                <button
                  onClick={() => copyToClipboard(
                    relevantWallet.address, 
                    getCoinNetwork(selectedCoin)
                  )}
                  className="p-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors"
                >
                  {copied[getCoinNetwork(selectedCoin)] ? (
                    <CheckCircleIcon className="w-5 h-5 text-white" />
                  ) : (
                    <CopyIcon className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
            </div>

            {/* Status */}
            {depositStatus === 'waiting' && (
              <div className="bg-[#2a2a2a] rounded-lg p-4 flex items-center space-x-3">
                <Loader2Icon className="w-5 h-5 text-cyan-500 animate-spin" />
                <div className="flex-1">
                  <p className="text-white font-semibold">{t('cryptoModal.waiting')}</p>
                  <p className="text-xs text-gray-400">
                    {t('cryptoModal.checking')}
                  </p>
                </div>
              </div>
            )}

            {depositStatus === 'confirmed' && (
              <div className="bg-green-900/20 border border-green-800 rounded-lg p-4 flex items-center space-x-3">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <div className="flex-1">
                  <p className="text-green-400 font-semibold">{t('cryptoModal.confirmed')}</p>
                  <p className="text-xs text-green-300">
                    {t('cryptoModal.amount')}: {depositData?.amount} {depositData?.network}
                  </p>
                </div>
              </div>
            )}

            {/* Important Notes */}
            <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
              <p className="text-yellow-400 font-semibold text-sm mb-2">
                ⚠️ {t('cryptoModal.important')}
              </p>
              <ul className="text-xs text-yellow-300 space-y-1">
                <li>• {t('cryptoModal.sendOnly', { coin: selectedCoin.split('_')[0] })}</li>
                <li>• {t('cryptoModal.networkLabel', { network: getNetworkName() })}</li>
                {selectedCoin === 'USDT_ERC20' && (
                  <li className="text-yellow-200">• {t('cryptoModal.acceptsBoth')}</li>
                )}
                <li>• {t('cryptoModal.minAmount', { amount: getMinimumDeposit() })}</li>
                <li>• {t('cryptoModal.autoCredit')}</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex justify-center">
              <button
                onClick={handleCloseAttempt}
                className="px-8 py-3 rounded-lg transition-colors bg-gray-700 hover:bg-gray-600 text-white cursor-pointer"
              >
                {t('cryptoModal.close')}
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default CryptoDepositModal;