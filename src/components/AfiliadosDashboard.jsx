import React, { useState, useEffect } from 'react';
import { ChevronDown, Copy, ArrowUpDown, Save, AlertTriangle, Loader, Lock } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

// Definir los requisitos de referidos para cada tier (para pruebas)
const TIER_REQUIREMENTS = {
  1: 0, // Tier 1 base
  2: 1, // Necesita 1 referido para Tier 2
  3: 2  // Necesita 2 referidos para Tier 3
};

// Función para determinar el tier basado en el número de referidos
const determineTier = (referralCount) => {
  if (referralCount >= TIER_REQUIREMENTS[3]) {
    return 3;
  }
  if (referralCount >= TIER_REQUIREMENTS[2]) {
    return 2;
  }
  return 1;
};

const AfiliadosDashboard = () => {
  const [activeTab, setActiveTab] = useState('panel');
  const [walletAddress, setWalletAddress] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editWalletAddress, setEditWalletAddress] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [userId, setUserId] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [currentTier, setCurrentTier] = useState(1);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Datos para las tablas
  const referenciasData = [];
  const pagosData = [];
  
  // Cargar datos del usuario (wallet, referidos, etc.) desde Firebase
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoadingData(true);
      try {
        const user = auth.currentUser;
        if (user) {
          setUserId(user.uid); // Guardar User ID para el link
          const userDocRef = doc(db, 'users_broker', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Cargar Wallet
            if (userData.withdrawals_wallet) {
              setWalletAddress(userData.withdrawals_wallet);
              setEditWalletAddress(userData.withdrawals_wallet);
            }
            // Cargar Conteo de Referidos y Determinar Tier
            const count = userData.referralCount || 0; // Asumir 0 si no existe
            setReferralCount(count);
            setCurrentTier(determineTier(count));
          } else {
            // Si el doc no existe, valores por defecto
            setReferralCount(0);
            setCurrentTier(1);
          }
        } else {
          setError('Usuario no autenticado.'); // Manejar caso no logueado
        }
      } catch (err) {
        console.error('Error al obtener datos del usuario:', err);
        setError('Error al cargar los datos. Intente de nuevo más tarde.');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchUserData();
  }, []);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };
  
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    setEditWalletAddress(walletAddress);
    setError('');
    setSuccessMessage('');
  };
  
  const saveWalletAddress = async () => {
    if (!editWalletAddress.trim()) {
      setError('Por favor, introduzca una dirección de wallet válida.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { withdrawals_wallet: editWalletAddress.trim() }, { merge: true });
        setWalletAddress(editWalletAddress.trim());
        setSuccessMessage('Dirección de wallet actualizada correctamente');
        setTimeout(() => setSuccessMessage(''), 3000);
        setIsEditing(false);
      } else {
        setError('Debe iniciar sesión para actualizar la dirección de wallet.');
      }
    } catch (err) {
      console.error('Error al actualizar la wallet:', err);
      setError('Error al guardar los cambios. Intente de nuevo más tarde.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(`${window.location.origin}/register?ref=${text}`) // Asume una ruta de registro
      .then(() => {
        alert('Enlace de afiliado copiado al portapapeles');
      })
      .catch(err => {
        console.error('Error al copiar: ', err);
        alert('Error al copiar el enlace.');
      });
  };

  // Renderizar el contenido según la pestaña activa
  const renderContent = () => {
    if (isLoadingData) {
        return (
          <div className="flex justify-center items-center h-60">
            <Loader size={40} className="animate-spin text-cyan-500" />
          </div>
        );
    }
      
    switch (activeTab) {
      case 'panel':
        return (
          <div className="space-y-6">
            {/* Rendimiento */}
            <div className="space-y-4">
              <h2 className="text-3xl font-medium">Rendimiento</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Comisiones Totales Cobradas */}
                <div className="p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-xl border border-[#333]">
                  <h3 className="text-lg font-medium text-gray-400 mb-2">Comisiones Totales Cobradas</h3>
                  <p className="text-3xl md:text-4xl font-semibold">$0.00</p> {/* Placeholder */} 
                </div>
                
                {/* Cantidad De Comisiones Totales */}
                <div className="p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-xl border border-[#333]">
                  <h3 className="text-lg font-medium text-gray-400 mb-2">Cantidad De Comisiones Totales</h3>
                  <p className="text-3xl md:text-4xl font-semibold">0</p> {/* Placeholder */}
                </div>
                
                {/* Comisiones Promedio */}
                <div className="p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-xl border border-[#333]">
                  <h3 className="text-lg font-medium text-gray-400 mb-2">Comisiones Promedio</h3>
                  <p className="text-3xl md:text-4xl font-semibold">$0.00</p> {/* Placeholder */}
                </div>
              </div>
            </div>
            
            {/* Enlace De Afiliados, Registro y Conversion */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Enlace De Afiliados Card */}
              <div className="p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-xl border border-[#333] space-y-2">
                <h3 className="text-lg font-medium text-gray-400">Enlace De Afiliados</h3>
                <div className="flex items-center space-x-2">
                  <span className="p-2 bg-[#1a1a1a] rounded-lg border border-[#333] text-gray-300 truncate text-sm flex-grow">
                    {userId ? `${window.location.origin}/register?ref=${userId}` : 'Generando enlace...'}
                  </span>
                  <button
                    className="p-2 hover:bg-[#333] rounded-lg border border-[#333] disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => copyToClipboard(userId)}
                    disabled={!userId}
                  >
                    <Copy size={16} className="text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Cantidad De Registro Card */}
              <div className="p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-xl border border-[#333]">
                <h3 className="text-lg font-medium text-gray-400 mb-2">Referidos Registrados</h3>
                <p className="text-3xl md:text-4xl font-semibold">{referralCount}</p> 
              </div>

              {/* Conversion Card */}
              <div className="p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-xl border border-[#333]">
                <h3 className="text-lg font-medium text-gray-400 mb-2">Conversion</h3>
                <p className="text-3xl md:text-4xl font-semibold">N/A</p> {/* Placeholder */}
              </div>
            </div>
            
            {/* Direccion De Pago USDT */}
            <div className="space-y-4">
              <h2 className="text-3xl font-medium">Direccion De Pago USDT</h2>
              <p className="text-gray-400">Proporcionar Una Dirección USDT TRC20 Válida</p>
              
              {successMessage && (
                <div className="bg-green-900/20 border border-green-600 text-green-400 p-3 rounded-lg mb-3">
                  {successMessage}
                </div>
              )}
              
              {error && (
                <div className="bg-red-900/20 border border-red-600 text-red-400 p-3 rounded-lg mb-3 flex items-center">
                  <AlertTriangle size={16} className="mr-2" />
                  {error}
                </div>
              )}
              
              {isEditing ? (
                <div className="flex flex-col space-y-3">
                  <input
                    type="text"
                    className="flex-grow p-3 bg-gradient-to-br from-[#1a1a1a] to-[#252525] rounded-lg border border-[#333] text-white"
                    value={editWalletAddress}
                    onChange={(e) => setEditWalletAddress(e.target.value)}
                    placeholder="Ingrese su dirección TRC20 USDT"
                  />
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      className="px-6 py-3 bg-gradient-to-br from-[#0F7490] to-[#0A5A72] text-white rounded-full hover:opacity-90 transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={saveWalletAddress}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader size={16} className="animate-spin mr-2" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save size={16} className="mr-2" />
                          Guardar
                        </>
                      )}
                    </button>
                    <button 
                      className="px-6 py-3 bg-[#2a2a2a] text-white rounded-full hover:bg-[#333] transition"
                      onClick={toggleEditMode}
                      disabled={isSaving}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-grow p-3 bg-gradient-to-br from-[#1a1a1a] to-[#252525] rounded-lg border border-[#333] text-gray-300 overflow-hidden flex items-center">
                    <span className="truncate mr-2">{walletAddress || 'No se ha establecido una dirección de wallet'}</span>
                  </div>
                  <button 
                    className="px-6 py-3 bg-gradient-to-br focus:outline-none from-[#0F7490] to-[#0A5A72] text-white rounded-full hover:opacity-90 transition"
                    onClick={toggleEditMode}
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>

        {/* Tiers Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tier 1 */}
          <div className={`p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-xl border ${
            currentTier >= 1 ? 'border-cyan-500' : 'border-[#333]'
          } space-y-2`}>
            <h3 className="text-xl font-semibold mb-1">Tier 1</h3>
            <p className="text-gray-400">Comision 10%</p>
            <p className="text-sm text-gray-500">Hasta {TIER_REQUIREMENTS[2]} Afiliado</p> 
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
            <h3 className="text-xl font-semibold mb-1">Tier 2</h3>
            <p className="text-gray-400">Comision 15% + 5% Tier 1</p>
            <p className="text-sm text-gray-500">Hasta {TIER_REQUIREMENTS[3]} Afiliados</p>
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
            <h3 className="text-xl font-semibold mb-1">Tier 3</h3>
            <p className="text-gray-400">Comision 20% + 5% Tier 1 + 10% De Pagos</p>
            <p className="text-sm text-gray-500">{TIER_REQUIREMENTS[3]}+ Afiliados</p>
          </div>
        </div>

            {/* Traders Fondeados Section */}
            <div className="space-y-4">
              <h2 className="text-3xl font-medium mb-4">Traders Fondeados</h2>
              <div className="relative rounded-xl border border-[#333] overflow-hidden">
                <div className="h-60 bg-gradient-to-br from-[#1a1a1a] to-[#252525]">
                  {/* Placeholder para tabla/contenido real */} 
                  {currentTier === 3 && (
                      <div className="p-4 text-center text-gray-400">Contenido desbloqueado (Tier 3)</div>
                  )} 
                </div>

                {/* Overlay de bloqueo si no es Tier 3 */} 
                {currentTier < 3 && (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a]/90 to-[#252525]/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
                    <Lock size={40} className="text-gray-500 mb-3" />
                    <h3 className="text-2xl font-semibold mb-2">Sección Por Desbloquear</h3>
                    <p className="text-gray-400 text-sm">Accede A Esta Sección Al Alcanzar Tier 3 ({TIER_REQUIREMENTS[3]}+ Afiliados).</p>
                    <p className="text-gray-400 text-sm">Desbloquea Nuevas Oportunidades</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'referencias':
        return (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="py-4 px-3 font-medium">Identificacion de referencia</th>
                    <th className="py-4 px-3 font-medium">Nombre Completo</th>
                    <th className="py-4 px-3 font-medium">País</th>
                    <th className="py-4 px-3 font-medium">Creado en</th>
                    <th className="py-4 px-3 font-medium">Identificacion de campaña</th>
                    <th className="py-4 px-3 font-medium">Nombre de la campaña</th>
                    <th className="py-4 px-3 font-medium">N° de compras</th>
                    <th className="py-4 px-3 font-medium">Ingresos totales</th>
                    <th className="py-4 px-3 font-medium">Comisiones</th>
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
                        No hay datos disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'pagos':
        return (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="py-4 px-3 font-medium">Identificacion de pago</th>
                    <th className="py-4 px-3 font-medium">
                      <div className="flex items-center">
                        Creado en
                        <ArrowUpDown size={14} className="ml-1" />
                      </div>
                    </th>
                    <th className="py-4 px-3 font-medium">Cantidad a pagar</th>
                    <th className="py-4 px-3 font-medium">Estado</th>
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
                        No hay datos disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen border border-[#333] rounded-3xl bg-[#232323] text-white p-4 md:p-6">
      {/* Tabs */}
      <div className="flex space-x-2 mb-6">
        <button
          className={`px-4 py-3 rounded-full focus:outline-none bg-gradient-to-br from-[#232323] to-[#2d2d2d] border-[#333] font-regular flex items-center space-x-2 ${
            activeTab === 'panel' 
              ? 'border border-cyan-500 text-white' 
              : 'border border-[#333] text-gray-300 hover:bg-[#2a2a2a]'
          }`}
          onClick={() => handleTabClick('panel')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
          <span>Panel</span>
        </button>
        
        <button
          className={`px-4 py-3 rounded-full focus:outline-none font-regular bg-gradient-to-br from-[#232323] to-[#2d2d2d] border-[#333] flex items-center space-x-2 ${
            activeTab === 'referencias' 
              ? 'border border-cyan-500 text-white' 
              : 'border border-[#333] text-gray-300 hover:bg-[#2a2a2a]'
          }`}
          onClick={() => handleTabClick('referencias')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
          <span>Referencias</span>
        </button>
        
        <button
          className={`px-4 py-3 rounded-full flex focus:outline-none font-regular bg-gradient-to-br from-[#232323] to-[#2d2d2d] border-[#333] items-center space-x-2 ${
            activeTab === 'pagos' 
              ? 'border border-cyan-500 text-white' 
              : 'border border-[#333] text-gray-300 hover:bg-[#2a2a2a]'
          }`}
          onClick={() => handleTabClick('pagos')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <path d="M2 10h20" />
          </svg>
          <span>Pagos</span>
        </button>
      </div>
      
      {/* Content Container */}
      <div className="p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-xl border border-[#333] mb-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default AfiliadosDashboard;