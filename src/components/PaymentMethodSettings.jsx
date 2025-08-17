import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuthAdapter } from '../services/database.adapter';
import { Trash2, PlusCircle, ChevronDown } from 'lucide-react';

const PaymentMethodSettings = ({ onBack }) => {
  const { currentUser, userData, refreshUserData } = useAuth();
  const [methodType, setMethodType] = useState('crypto');
  const [alias, setAlias] = useState('');
  
  // Crypto fields
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [cryptoNetwork, setCryptoNetwork] = useState('USDT TRC20');

  // Bank fields
  const [cbu, setCbu] = useState('');
  const [holderName, setHolderName] = useState('');
  const [holderId, setHolderId] = useState('');
  
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  
  // Estados para el dropdown de red
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
  const networkDropdownRef = useRef(null);

  const paymentMethods = userData?.paymentMethods || [];
  
  // Opciones de red disponibles
  const networkOptions = [
    { value: 'USDT TRC20', label: 'USDT TRC20' },
    { value: 'USDT ERC20', label: 'USDT ERC20' },
    { value: 'BTC', label: 'BTC' }
  ];

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
  };

  const handleAddMethod = async (e) => {
    e.preventDefault();
    setFeedback({ message: '', type: '' });

    let newMethod;
    if (methodType === 'crypto') {
      if (!alias || !cryptoAddress || !cryptoNetwork) {
        setFeedback({ message: 'Por favor, complete todos los campos de la billetera.', type: 'error' });
        return;
      }
      newMethod = { type: 'crypto', alias, address: cryptoAddress, network: cryptoNetwork };
    } else { // bank
      if (!alias || !cbu || !holderName || !holderId) {
        setFeedback({ message: 'Por favor, complete todos los campos de la cuenta bancaria.', type: 'error' });
        return;
      }
      newMethod = { type: 'bank', alias, cbu, holderName, holderId };
    }

    const result = await AuthAdapter.addPaymentMethod(currentUser.id, newMethod);
    if (result.success) {
      setFeedback({ message: 'Método de pago agregado con éxito.', type: 'success' });
      await refreshUserData(); // Refresh user data to get the new list
      // Reset form
      setAlias('');
      setCryptoAddress('');
      setCbu('');
      setHolderName('');
      setHolderId('');
    } else {
      setFeedback({ message: `Error: ${result.error}`, type: 'error' });
    }
  };

  const handleDeleteMethod = async (method) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el método "${method.alias}"?`)) {
      const result = await AuthAdapter.deletePaymentMethod(currentUser.id, method);
      if (result.success) {
        setFeedback({ message: 'Método de pago eliminado con éxito.', type: 'success' });
        await refreshUserData();
      } else {
        setFeedback({ message: `Error al eliminar: ${result.error}`, type: 'error' });
      }
    }
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
        <h1 className="text-2xl md:text-3xl font-semibold">Configurar Métodos de Pago</h1>
      </div>

      {feedback.message && (
        <div className={`p-3 mb-4 rounded-lg text-center ${feedback.type === 'error' ? 'bg-red-500 bg-opacity-30 text-red-300' : 'bg-green-500 bg-opacity-30 text-green-300'}`}>
          {feedback.message}
        </div>
      )}

      {/* Lista de métodos existentes */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Tus Métodos de Pago</h2>
        {paymentMethods.length > 0 ? (
          <div className="space-y-3">
            {paymentMethods.map(method => (
              <div key={method.id} className="p-4 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-lg flex justify-between items-center border border-[#333]">
                <div>
                  <p className="font-bold">{method.alias} <span className="text-xs font-normal text-gray-400">({method.type === 'crypto' ? 'Crypto' : 'Banco'})</span></p>
                  <p className="text-sm text-gray-300">{method.type === 'crypto' ? `${method.network}: ${method.address}` : `CBU/CVU: ${method.cbu}`}</p>
                </div>
                <button onClick={() => handleDeleteMethod(method)} className="p-2 hover:bg-red-500/20 rounded-full text-red-400">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No tienes métodos de pago configurados.</p>
        )}
      </div>

      {/* Formulario para agregar nuevo método */}
      <div>
        <h2 className="text-xl font-bold mb-4">Agregar Nuevo Método</h2>
        <form onSubmit={handleAddMethod} className="p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-lg border border-[#333] space-y-4">
          {/* Selector de Tipo */}
          <div className="flex gap-4 mb-4">
             <button type="button" onClick={() => setMethodType('crypto')} className={`flex-1 py-2 px-4 rounded-lg transition ${methodType === 'crypto' ? 'bg-cyan-600 text-white' : 'bg-[#333] hover:bg-[#444]'}`}>Billetera Crypto</button>
             <button type="button" onClick={() => setMethodType('bank')} className={`flex-1 py-2 px-4 rounded-lg transition ${methodType === 'bank' ? 'bg-cyan-600 text-white' : 'bg-[#333] hover:bg-[#444]'}`}>Transferencia Bancaria</button>
          </div>
          
          {/* Campos Comunes */}
          <div>
            <label htmlFor="alias" className="block text-sm font-medium text-gray-300 mb-1">Alias</label>
            <input type="text" id="alias" value={alias} onChange={e => setAlias(e.target.value)} className="w-full p-2 bg-[#1a1a1a] border border-[#444] rounded-lg focus:outline-none focus:border-cyan-500" placeholder="Ej: Mi cuenta de Binance" />
          </div>

          {methodType === 'crypto' ? (
            <>
              {/* Campos Crypto */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Red</label>
                <div className="relative" ref={networkDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
                    className="w-full p-2 bg-[#1a1a1a] border border-[#444] rounded-lg focus:outline-none focus:border-cyan-500 text-left flex items-center justify-between text-white"
                  >
                    <span>{cryptoNetwork}</span>
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
                <label htmlFor="cryptoAddress" className="block text-sm font-medium text-gray-300 mb-1">Dirección de la Billetera</label>
                <input type="text" id="cryptoAddress" value={cryptoAddress} onChange={e => setCryptoAddress(e.target.value)} className="w-full p-2 bg-[#1a1a1a] border border-[#444] rounded-lg focus:outline-none focus:border-cyan-500" />
              </div>
            </>
          ) : (
            <>
              {/* Campos Banco */}
              <div>
                <label htmlFor="holderName" className="block text-sm font-medium text-gray-300 mb-1">Nombre del Titular</label>
                <input type="text" id="holderName" value={holderName} onChange={e => setHolderName(e.target.value)} className="w-full p-2 bg-[#1a1a1a] border border-[#444] rounded-lg focus:outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label htmlFor="holderId" className="block text-sm font-medium text-gray-300 mb-1">CUIT/CUIL del Titular</label>
                <input type="text" id="holderId" value={holderId} onChange={e => setHolderId(e.target.value)} className="w-full p-2 bg-[#1a1a1a] border border-[#444] rounded-lg focus:outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label htmlFor="cbu" className="block text-sm font-medium text-gray-300 mb-1">CBU/CVU</label>
                <input type="text" id="cbu" value={cbu} onChange={e => setCbu(e.target.value)} className="w-full p-2 bg-[#1a1a1a] border border-[#444] rounded-lg focus:outline-none focus:border-cyan-500" />
              </div>
            </>
          )}

          <button type="submit" className="w-full py-3 bg-gradient-to-r from-[#0F7490] to-[#0A5A72] text-white rounded-lg hover:opacity-90 transition flex items-center justify-center">
            <PlusCircle size={20} className="mr-2" />
            Agregar Método
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentMethodSettings; 