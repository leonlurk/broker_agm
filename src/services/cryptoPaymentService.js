import axios from 'axios';

// Configuración base de la API de crypto
const CRYPTO_API_URL = import.meta.env.VITE_CRYPTO_API_URL || 'http://localhost:3000/api';

// Crear instancia de axios para la API de crypto
const cryptoApi = axios.create({
  baseURL: CRYPTO_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar el token de autenticación
cryptoApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('crypto_token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
cryptoApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('crypto_token');
      // Aquí podrías redirigir al login o refrescar el token
    }
    return Promise.reject(error);
  }
);

class CryptoPaymentService {
  /**
   * Usa el token de Supabase existente para autenticar en la crypto API
   * @param {string} supabaseToken - Token de Supabase del usuario
   * @param {string} email - Email del usuario
   * @returns {Promise<{success: boolean, token?: string}>}
   */
  async authenticateWithSupabase(supabaseToken, email) {
    try {
      // Usar el nuevo endpoint de autenticación por token
      const response = await cryptoApi.post('/users/auth-token', {
        token: supabaseToken,
        email
      });

      if (response.data.success && response.data.token) {
        localStorage.setItem('crypto_token', response.data.token);
        return { success: true, token: response.data.token };
      }
      
      return { 
        success: false, 
        error: response.data.msg || 'Error de autenticación' 
      };
    } catch (error) {
      console.error('Error en autenticación crypto:', error);
      return { 
        success: false, 
        error: error.response?.data?.msg || 'Error de autenticación' 
      };
    }
  }


  /**
   * Genera una nueva billetera temporal para depósitos
   * @returns {Promise<{success: boolean, wallets?: object, error?: string}>}
   */
  async generateDepositWallet() {
    try {
      const response = await cryptoApi.post('/wallet/generate-wallet');
      
      if (response.data.success) {
        return {
          success: true,
          wallets: response.data.wallets,
          message: response.data.message
        };
      }
      
      return { 
        success: false, 
        error: 'No se pudo generar la billetera' 
      };
    } catch (error) {
      console.error('Error generando billetera:', error);
      return { 
        success: false, 
        error: error.response?.data?.msg || 'Error al generar billetera' 
      };
    }
  }

  /**
   * Verifica el balance de todas las billeteras del usuario
   * @returns {Promise<{success: boolean, wallets?: Array, error?: string}>}
   */
  async checkWalletBalances() {
    try {
      const response = await cryptoApi.get('/wallet/check-balance');
      
      if (response.data.success) {
        return {
          success: true,
          wallets: response.data.wallets
        };
      }
      
      return { 
        success: false, 
        error: 'No se pudo verificar el balance' 
      };
    } catch (error) {
      console.error('Error verificando balance:', error);
      return { 
        success: false, 
        error: error.response?.data?.msg || 'Error al verificar balance' 
      };
    }
  }

  /**
   * Obtiene el historial de transacciones
   * @returns {Promise<{success: boolean, transactions?: Array, error?: string}>}
   */
  async getTransactionHistory() {
    try {
      const response = await cryptoApi.get('/wallet/transaction-history');
      
      if (response.data.success) {
        return {
          success: true,
          transactions: response.data.transactions
        };
      }
      
      return { 
        success: false, 
        error: 'No se pudo obtener el historial' 
      };
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      return { 
        success: false, 
        error: error.response?.data?.msg || 'Error al obtener historial' 
      };
    }
  }

  /**
   * Transfiere fondos de una billetera temporal a la principal
   * @param {string} walletId - ID de la billetera a transferir
   * @returns {Promise<{success: boolean, transfers?: object, error?: string}>}
   */
  async transferFunds(walletId) {
    try {
      const response = await cryptoApi.post('/wallet/transfer-funds', {
        walletId
      });
      
      if (response.data.success) {
        return {
          success: true,
          transfers: response.data.transfers,
          message: response.data.message
        };
      }
      
      return { 
        success: false, 
        error: 'No se pudo transferir los fondos' 
      };
    } catch (error) {
      console.error('Error transfiriendo fondos:', error);
      return { 
        success: false, 
        error: error.response?.data?.msg || 'Error al transferir fondos' 
      };
    }
  }

  /**
   * Confirma un depósito (webhook)
   * @param {object} depositData - Datos del depósito
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async confirmDeposit(depositData) {
    try {
      const response = await cryptoApi.post('/wallet/confirm-deposit', depositData);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      }
      
      return { 
        success: false, 
        error: 'No se pudo confirmar el depósito' 
      };
    } catch (error) {
      console.error('Error confirmando depósito:', error);
      return { 
        success: false, 
        error: error.response?.data?.msg || 'Error al confirmar depósito' 
      };
    }
  }

  /**
   * Verifica el estado de una transacción específica
   * @param {string} tronAddress - Dirección TRON a verificar
   * @param {string} bscAddress - Dirección BSC a verificar
   * @returns {Promise<{success: boolean, confirmed?: boolean, transaction?: object, error?: string}>}
   */
  async checkTransactionStatus(tronAddress, bscAddress) {
    try {
      const response = await cryptoApi.get('/wallet/transaction-status', {
        params: { tronAddress, bscAddress }
      });
      
      if (response.data.success) {
        return {
          success: true,
          confirmed: response.data.confirmed,
          transaction: response.data.transaction
        };
      }
      
      return { 
        success: false, 
        confirmed: false,
        error: 'No se pudo verificar el estado' 
      };
    } catch (error) {
      console.error('Error verificando estado de transacción:', error);
      return { 
        success: false, 
        confirmed: false,
        error: error.response?.data?.msg || 'Error al verificar estado' 
      };
    }
  }

  /**
   * Monitorea el balance de una billetera específica
   * @param {string} tronAddress - Dirección TRON a monitorear
   * @param {string} bscAddress - Dirección BSC a monitorear
   * @param {function} onBalanceChange - Callback cuando el balance cambia
   * @param {number} interval - Intervalo de polling en ms (default: 10000)
   * @returns {function} Función para detener el polling
   */
  startBalanceMonitoring(tronAddress, bscAddress, onBalanceChange, interval = 10000) {
    let previousTronBalance = 0;
    let previousBscBalance = 0;
    
    const checkBalance = async () => {
      const result = await this.checkWalletBalances();
      
      if (result.success) {
        const wallet = result.wallets.find(
          w => w.tronAddress === tronAddress || w.bscAddress === bscAddress
        );
        
        if (wallet) {
          const tronChanged = wallet.tronBalance !== previousTronBalance;
          const bscChanged = wallet.bscBalance !== previousBscBalance;
          
          if (tronChanged || bscChanged) {
            onBalanceChange({
              tronBalance: wallet.tronBalance,
              bscBalance: wallet.bscBalance,
              tronChanged,
              bscChanged,
              previousTronBalance,
              previousBscBalance
            });
            
            previousTronBalance = wallet.tronBalance;
            previousBscBalance = wallet.bscBalance;
          }
        }
      }
    };
    
    // Verificar inmediatamente
    checkBalance();
    
    // Configurar intervalo
    const intervalId = setInterval(checkBalance, interval);
    
    // Retornar función para detener el monitoreo
    return () => clearInterval(intervalId);
  }

  /**
   * Valida una dirección de wallet
   * @param {string} address - Dirección a validar
   * @param {string} network - Red (TRON o BSC)
   * @returns {boolean}
   */
  validateWalletAddress(address, network) {
    if (network === 'TRON') {
      // Las direcciones TRON empiezan con T
      return /^T[A-Za-z0-9]{33}$/.test(address);
    } else if (network === 'BSC') {
      // Las direcciones BSC/Ethereum son hexadecimales de 42 caracteres
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    }
    return false;
  }

  /**
   * Formatea el balance para mostrar
   * @param {number} balance - Balance a formatear
   * @param {string} currency - Moneda (TRX, BNB)
   * @returns {string}
   */
  formatBalance(balance, currency) {
    if (typeof balance !== 'number') return '0.0000';
    
    const formatted = balance.toFixed(4);
    return `${formatted} ${currency}`;
  }

  /**
   * Obtiene el estado de la API
   * @returns {Promise<boolean>}
   */
  async checkApiHealth() {
    try {
      const response = await axios.get(`${CRYPTO_API_URL.replace('/api', '')}/health`);
      return response.data.status === 'OK';
    } catch (error) {
      console.error('API de crypto no disponible:', error);
      return false;
    }
  }
}

// Exportar instancia única del servicio
const cryptoPaymentService = new CryptoPaymentService();
export default cryptoPaymentService;