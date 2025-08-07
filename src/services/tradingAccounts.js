import { DatabaseAdapter } from './database.adapter';
import { logger } from '../utils/logger';

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

    // Generate account number
    const accountNumber = generateAccountNumber();

    // Prepare account data
    const newAccount = {
      userId,
      accountNumber,
      accountName: accountData.accountName,
      accountType: accountData.accountType, // 'DEMO' or 'Real'
      accountTypeSelection: accountData.accountTypeSelection, // 'Zero Spread' or 'Standard'
      leverage: accountData.leverage,
      balance: accountData.accountType === 'DEMO' ? 10000 : 0, // Demo starts with $10,000
      equity: accountData.accountType === 'DEMO' ? 10000 : 0,
      margin: 0,
      freeMargin: accountData.accountType === 'DEMO' ? 10000 : 0,
      marginLevel: 0,
      currency: 'USD',
      server: 'AGM-Server',
      platform: 'MetaTrader 5',
      status: 'Active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add to database
    const { data: createdAccount, error } = await DatabaseAdapter.tradingAccounts.create(newAccount);
    if (error) throw error;
    
    logger.info('Trading account created successfully', { 
      accountId: createdAccount.id, 
      accountNumber,
      accountType: accountData.accountType 
    });

    return {
      success: true,
      accountId: createdAccount.id,
      accountNumber,
      data: createdAccount
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