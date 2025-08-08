import { DatabaseAdapter } from './database.adapter';
import { logger } from '../utils/logger';
import { createMT5Account } from './mt5Api';
import { getCurrentUser } from '../supabase/config';

// Collection name for trading accounts
const TRADING_ACCOUNTS_COLLECTION = "trading_accounts";

// Generate a unique account number
const generateAccountNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${timestamp}${random}`;
};

// Create a new trading account
export const createTradingAccount = async (userId, accountData) => {
  logger.info('Creating new trading account', { userId, accountType: accountData.accountType });
  
  try {
    // Validate required fields
    if (!accountData.accountName || !accountData.accountType || !accountData.leverage) {
      throw new Error('Todos los campos son requeridos');
    }

    // Check if account name already exists for this user
    const { data: existingAccounts } = await DatabaseAdapter.tradingAccounts.getByUserId(userId);
    const accountExists = existingAccounts?.some(acc => acc.account_name === accountData.accountName);
    
    if (accountExists) {
      throw new Error('Ya existe una cuenta con este nombre');
    }

    // Get current user email for MT5 account
    const currentUser = await getCurrentUser();
    const userEmail = currentUser?.email || '';

    // First, create the MT5 account
    const mt5Result = await createMT5Account(userId, {
      ...accountData,
      email: userEmail
    });

    if (!mt5Result.success) {
      throw new Error(mt5Result.error || 'Error creating MT5 account');
    }

    // Use MT5 login as account number
    const accountNumber = mt5Result.data.login?.toString() || generateAccountNumber();

    // Prepare account data - matching existing schema
    const newAccount = {
      user_id: userId, // Changed from userId to user_id
      account_number: accountNumber, // MT5 login number
      account_name: accountData.accountName, // Changed from accountName to account_name
      account_type: accountData.accountType, // 'DEMO' or 'Real'
      account_type_selection: accountData.accountTypeSelection, // 'Zero Spread' or 'Standard' - changed from accountTypeSelection
      leverage: mt5Result.data.leverage || accountData.leverage,
      balance: mt5Result.data.balance || (accountData.accountType === 'DEMO' ? 10000 : 0),
      equity: mt5Result.data.balance || (accountData.accountType === 'DEMO' ? 10000 : 0),
      margin: 0,
      free_margin: mt5Result.data.balance || (accountData.accountType === 'DEMO' ? 10000 : 0),
      margin_level: 0, // Changed from marginLevel to margin_level
      currency: 'USD',
      server: mt5Result.data.server || 'AGM-Server',
      platform: 'MetaTrader 5',
      status: 'Active',
      // Store MT5 credentials
      mt5_login: mt5Result.data.login,
      mt5_password: mt5Result.data.password, // Should be encrypted in production
      mt5_investor_password: mt5Result.data.investor_password,
      mt5_group: mt5Result.data.group,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add to database
    const { data: createdAccount, error } = await DatabaseAdapter.tradingAccounts.create(newAccount);
    if (error) throw error;
    
    logger.info('Trading account created successfully', { 
      accountId: createdAccount.id, 
      accountNumber,
      mt5Login: mt5Result.data.login,
      accountType: accountData.accountType 
    });

    return {
      success: true,
      accountId: createdAccount.id,
      accountNumber,
      data: createdAccount,
      mt5Credentials: {
        login: mt5Result.data.login,
        password: mt5Result.data.password,
        investor_password: mt5Result.data.investor_password,
        server: mt5Result.data.server
      }
    };

  } catch (error) {
    logger.error('Error creating trading account', error);
    return {
      success: false,
      error: error.message || 'Error al crear la cuenta'
    };
  }
};

// Get trading accounts for a user
export const getUserTradingAccounts = async (userId) => {
  logger.info('Fetching trading accounts for user', { userId });
  
  try {
    const { data: accounts, error } = await DatabaseAdapter.tradingAccounts.getByUserId(userId);
    
    if (error) {
      throw error;
    }

    logger.info('Trading accounts fetched successfully', { count: accounts.length });
    
    return {
      success: true,
      accounts
    };

  } catch (error) {
    logger.error('Error fetching trading accounts', error);
    return {
      success: false,
      error: error.message || 'Error al obtener las cuentas'
    };
  }
};

// Update account balance (for demo accounts)
export const updateAccountBalance = async (accountId, newBalance) => {
  logger.info('Updating account balance', { accountId, newBalance });
  
  try {
    const { error } = await DatabaseAdapter.tradingAccounts.update(accountId, {
      balance: newBalance,
      equity: newBalance,
      free_margin: newBalance,
      updated_at: new Date().toISOString()
    });
    
    if (error) throw error;

    logger.info('Account balance updated successfully');
    
    return {
      success: true
    };

  } catch (error) {
    logger.error('Error updating account balance', error);
    return {
      success: false,
      error: error.message || 'Error al actualizar el balance'
    };
  }
};

// Update investor password for an account
export const updateInvestorPassword = async (accountId, investorPassword) => {
  logger.info('Updating investor password', { accountId });
  
  try {
    const { error } = await DatabaseAdapter.tradingAccounts.update(accountId, {
      investor_password: investorPassword,
      updated_at: new Date().toISOString()
    });
    
    if (error) throw error;

    logger.info('Investor password updated successfully');
    
    return {
      success: true
    };

  } catch (error) {
    logger.error('Error updating investor password', error);
    return {
      success: false,
      error: error.message || 'Error al actualizar la contraseña investor'
    };
  }
};

// Get account statistics
export const getAccountStats = async (userId) => {
  logger.info('Fetching account statistics', { userId });
  
  try {
    const accounts = await getUserTradingAccounts(userId);
    
    if (!accounts.success) {
      return accounts;
    }

    const stats = {
      totalAccounts: accounts.accounts.length,
      demoAccounts: accounts.accounts.filter(acc => acc.accountType === 'DEMO').length,
      realAccounts: accounts.accounts.filter(acc => acc.accountType === 'Real').length,
      totalBalance: accounts.accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0),
      activeAccounts: accounts.accounts.filter(acc => acc.status === 'Active').length
    };

    return {
      success: true,
      stats
    };

  } catch (error) {
    logger.error('Error fetching account statistics', error);
    return {
      success: false,
      error: error.message || 'Error al obtener estadísticas'
    };
  }
}; 