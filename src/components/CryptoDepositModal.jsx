import React, { useState, useEffect } from 'react';
import { QrCodeIcon, CopyIcon, CheckCircleIcon, XCircleIcon, Loader2Icon } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [walletInfo, setWalletInfo] = useState(null);
  const [copied, setCopied] = useState({ tron: false, bsc: false });
  const [depositStatus, setDepositStatus] = useState('waiting'); // waiting, detected, confirmed
  const [depositData, setDepositData] = useState(null);
  const [error, setError] = useState('');

  // Mapeo de monedas a redes
  const getCoinNetwork = (coinId) => {
    if (coinId === 'USDT_TRC20') return 'tron';
    if (coinId === 'USDT_ETH' || coinId === 'USDC_ETH') return 'bsc';
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
    if (!walletInfo || depositStatus !== 'waiting') return;

    const checkDepositStatus = async () => {
      try {
        // Verificar si hay una transacción confirmada para esta wallet
        const response = await cryptoPaymentService.checkTransactionStatus(walletInfo.tron.address, walletInfo.bsc.address);
        
        if (response.success && response.confirmed) {
          setDepositStatus('confirmed');
          setDepositData(response.transaction);
          
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
    
    // Verificar inmediatamente
    checkDepositStatus();

    return () => clearInterval(interval);
  }, [walletInfo, depositStatus, onDepositConfirmed]);

  const generateWallet = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Usar wallet fija para TRON
      const fixedWallet = {
        tron: {
          address: 'TX6uUsVShHYr59Uc7htYvmEHeY47pgehP4',
          qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TX6uUsVShHYr59Uc7htYvmEHeY47pgehP4`
        },
        bsc: {
          address: '0x4e9d9e0c1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p',
          qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=0x4e9d9e0c1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p`
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
        }
      }
        throw new Error(result.error || 'Error al generar wallet');
      }
    } catch (error) {
      console.error('Error generating wallet:', error);
      setError(error.message || 'Error al generar la dirección de depósito');
      toast.error('Error al generar la dirección de depósito');
    } finally {
      setLoading(false);
    }
  };


  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied({ ...copied, [type]: true });
      toast.success('Dirección copiada');
      
      setTimeout(() => {
        setCopied({ ...copied, [type]: false });
      }, 2000);
    } catch (error) {
      toast.error('Error al copiar');
    }
  };

  const getRelevantWallet = () => {
    if (!walletInfo) return null;
    
    const network = getCoinNetwork(selectedCoin);
    return network === 'tron' ? walletInfo.tron : walletInfo.bsc;
  };

  const getNetworkName = () => {
    const network = getCoinNetwork(selectedCoin);
    return network === 'tron' ? 'TRON (TRC-20)' : 'Binance Smart Chain (BEP-20)';
  };

  const getMinimumDeposit = () => {
    if (selectedCoin === 'USDT_TRC20') return 12;
    return 25;
  };

  if (!isOpen) return null;

  const relevantWallet = getRelevantWallet();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-[#1e1e1e] rounded-2xl p-6 max-w-lg w-full mx-auto border border-[#334155] max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Depósito Crypto</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
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
            <p className="text-gray-400">Generando dirección de depósito...</p>
          </div>
        )}

        {/* Wallet Info */}
        {!loading && relevantWallet && (
          <div className="space-y-4">
            {/* Network Info */}
            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Red</p>
              <p className="text-white font-semibold">{getNetworkName()}</p>
            </div>

            {/* Amount Info */}
            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Monto a depositar</p>
              <p className="text-2xl font-bold text-cyan-500">${amount} USD</p>
              <p className="text-xs text-gray-500 mt-1">
                Mínimo: ${getMinimumDeposit()} USD
              </p>
            </div>

            {/* QR Code */}
            <div className="bg-[#2a2a2a] rounded-lg p-6 flex flex-col items-center">
              <p className="text-sm text-gray-400 mb-3">Escanea el código QR</p>
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
              <p className="text-sm text-gray-400 mb-2">O copia la dirección</p>
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
                  <p className="text-white font-semibold">Esperando depósito...</p>
                  <p className="text-xs text-gray-400">
                    Verificando cada 10 segundos
                  </p>
                </div>
              </div>
            )}

            {depositStatus === 'confirmed' && (
              <div className="bg-green-900/20 border border-green-800 rounded-lg p-4 flex items-center space-x-3">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <div className="flex-1">
                  <p className="text-green-400 font-semibold">¡Depósito confirmado!</p>
                  <p className="text-xs text-green-300">
                    Monto: {depositData?.amount} {depositData?.network}
                  </p>
                </div>
              </div>
            )}

            {/* Important Notes */}
            <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
              <p className="text-yellow-400 font-semibold text-sm mb-2">
                ⚠️ Importante
              </p>
              <ul className="text-xs text-yellow-300 space-y-1">
                <li>• Envía solo {selectedCoin.split('_')[0]} a esta dirección</li>
                <li>• Red: {getNetworkName()}</li>
                <li>• Monto mínimo: ${getMinimumDeposit()} USD</li>
                <li>• Los fondos se acreditarán automáticamente</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={generateWallet}
                className="flex-1 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-lg transition-colors"
              >
                Generar Nueva Dirección
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CryptoDepositModal;