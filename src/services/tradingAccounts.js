import { DatabaseAdapter } from './database.adapter';
import { logger } from '../utils/logger';
import { createMT5Account } from './mt5Api';
import { getCurrentUser, supabase } from '../supabase/config';
import emailServiceProxy from './emailServiceProxy';

// Collection name for trading accounts
const TRADING_ACCOUNTS_COLLECTION = "trading_accounts";

// Generate a unique account number
const generateAccountNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${timestamp}${random}`;
};

// Clean inactive demo accounts (older than 30 days without operations)
export const cleanInactiveDemoAccounts = async (userId) => {
  logger.info('Cleaning inactive demo accounts', { userId });
  
  try {
    const { data: existingAccounts } = await DatabaseAdapter.tradingAccounts.getByUserId(userId);
    if (!existingAccounts || existingAccounts.length === 0) {
      return { success: true, deletedCount: 0 };
    }

    const demoAccounts = existingAccounts.filter(acc => acc.account_type === 'DEMO' || acc.account_type === 'demo');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const inactiveAccounts = [];
    
    for (const account of demoAccounts) {
      // Check if account is older than 30 days AND has no recent activity
      const accountCreated = new Date(account.created_at || account.createdAt);
      const lastActivity = new Date(account.last_activity || account.updated_at || account.created_at || account.createdAt);
      
      // If both creation date and last activity are older than 30 days
      if (lastActivity < thirtyDaysAgo && accountCreated < thirtyDaysAgo) {
        inactiveAccounts.push(account);
      }
    }
    
    // Delete inactive demo accounts from frontend (Supabase)
    let deletedCount = 0;
    for (const account of inactiveAccounts) {
      try {
        const deleteResult = await DatabaseAdapter.tradingAccounts.delete(account.id);
        if (deleteResult.success) {
          deletedCount++;
          logger.info('Deleted inactive demo account', { 
            accountId: account.id, 
            accountName: account.account_name,
            lastActivity: account.last_activity || account.updated_at 
          });
        }
      } catch (error) {
        logger.error('Error deleting inactive demo account', { accountId: account.id, error });
      }
    }
    
    return { 
      success: true, 
      deletedCount,
      inactiveAccounts: inactiveAccounts.length,
      message: deletedCount > 0 ? `Se eliminaron ${deletedCount} cuentas demo inactivas` : 'No hay cuentas demo inactivas para eliminar'
    };
    
  } catch (error) {
    logger.error('Error cleaning inactive demo accounts', error);
    return { 
      success: false, 
      error: error.message,
      deletedCount: 0
    };
  }
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

    // Check account limits (3 demo + 3 real per user)
    if (existingAccounts && existingAccounts.length > 0) {
      const demoAccounts = existingAccounts.filter(acc => acc.account_type === 'DEMO' || acc.account_type === 'demo');
      const realAccounts = existingAccounts.filter(acc => acc.account_type === 'Real' || acc.account_type === 'real');
      
      if (accountData.accountType === 'demo' || accountData.accountType === 'DEMO') {
        if (demoAccounts.length >= 3) {
          // Try to clean inactive demo accounts first
          const cleanupResult = await cleanInactiveDemoAccounts(userId);
          
          if (cleanupResult.success && cleanupResult.deletedCount > 0) {
            logger.info(`Cleaned ${cleanupResult.deletedCount} inactive demo accounts for user ${userId}`);
            // Re-fetch accounts after cleanup
            const { data: updatedAccounts } = await DatabaseAdapter.tradingAccounts.getByUserId(userId);
            const updatedDemoAccounts = updatedAccounts?.filter(acc => acc.account_type === 'DEMO' || acc.account_type === 'demo') || [];
            
            if (updatedDemoAccounts.length >= 3) {
              throw new Error('Has alcanzado el límite máximo de 3 cuentas demo. No puedes crear más cuentas demo.');
            }
          } else {
            throw new Error('Has alcanzado el límite máximo de 3 cuentas demo. No puedes crear más cuentas demo.');
          }
        }
      } else if (accountData.accountType === 'real' || accountData.accountType === 'Real') {
        if (realAccounts.length >= 3) {
          throw new Error('Has alcanzado el límite máximo de 3 cuentas reales. No puedes crear más cuentas reales.');
        }
      }
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

    // The MT5 API backend already created the account in broker_accounts
    // We just need to fetch it to get the created account data
    // Wait a moment for the backend to complete the insertion
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Fetch the created account from broker_accounts first to get the ID
    const { data: updatedAccounts } = await DatabaseAdapter.tradingAccounts.getByUserId(userId);
    let createdAccount = updatedAccounts?.find(acc => 
      acc.login?.toString() === accountNumber || 
      acc.account_number?.toString() === accountNumber
    );
    
    // Save the MT5 passwords and tournament flag to the database if we found the account
    if (createdAccount) {
      const updateData = {};

      // Add passwords if available
      if (mt5Result.data.password || mt5Result.data.investor_password) {
        updateData.mt5_password = mt5Result.data.password;
        updateData.mt5_investor_password = mt5Result.data.investor_password;
      }

      // Add tournament flag if this is a tournament account
      if (accountData.is_tournament_account) {
        updateData.is_tournament_account = true;
        logger.info('Setting tournament account flag', { accountId: createdAccount.id });
      }

      // Only update if we have data to update
      if (Object.keys(updateData).length > 0) {
        logger.info('Updating account data in database', {
          accountId: createdAccount.id,
          accountNumber,
          isTournament: !!accountData.is_tournament_account
        });

        const updateResult = await DatabaseAdapter.tradingAccounts.update(createdAccount.id, updateData);

        if (updateResult.error) {
          logger.error('Failed to update account data', updateResult.error);
        } else {
          logger.info('Account data updated successfully');
          // Update the local object
          if (updateData.mt5_password) {
            createdAccount.mt5_password = mt5Result.data.password;
            createdAccount.mt5_investor_password = mt5Result.data.investor_password;
          }
          if (updateData.is_tournament_account) {
            createdAccount.is_tournament_account = true;
          }
        }
      }
    }
    
    if (!createdAccount) {
      // If we can't find it, create a minimal record to return
      // This is just for the response, the actual account exists in broker_accounts
      createdAccount = {
        id: `temp-${accountNumber}`,
        user_id: userId,
        account_number: accountNumber,
        login: accountNumber,
        account_name: accountData.accountName,
        account_type: accountData.accountType,
        leverage: mt5Result.data.leverage || accountData.leverage,
        balance: mt5Result.data.balance || 0,
        equity: mt5Result.data.balance || 0,
        margin: 0,
        free_margin: mt5Result.data.balance || 0
      };
      
      logger.warn('Could not find created account in broker_accounts, using fallback data', { accountNumber });
    }
    
    logger.info('Trading account created successfully', { 
      accountId: createdAccount.id, 
      accountNumber,
      mt5Login: mt5Result.data.login,
      accountType: accountData.accountType 
    });

    // Send email notification with MT5 credentials
    try {
      const currentUser = await getCurrentUser();
      if (currentUser?.email && mt5Result.data.password) {
        logger.info('Sending MT5 account creation email', { 
          email: currentUser.email, 
          accountType: accountData.accountType 
        });
        
        const emailResult = await emailServiceProxy.sendMT5AccountCreatedEmail(
          {
            email: currentUser.email,
            name: currentUser.displayName || currentUser.username || 'Usuario'
          },
          {
            accountType: accountData.accountType,
            accountName: accountData.accountName,
            accountNumber: mt5Result.data.login?.toString() || accountNumber,
            leverage: `1:${accountData.leverage}`,
            balance: mt5Result.data.balance || (accountData.accountType === 'DEMO' ? 10000 : 0),
            currency: 'USD',
            server: mt5Result.data.server || 'AGM-Server',
            groupType: accountData.accountTypeSelection || 'Institucional'
          },
          {
            login: mt5Result.data.login?.toString() || accountNumber,
            password: mt5Result.data.password,
            investorPassword: mt5Result.data.investor_password || mt5Result.data.investorPassword
          }
        );
        
        if (emailResult.success) {
          logger.info('MT5 account creation email sent successfully');
        } else {
          logger.error('Failed to send MT5 account creation email', emailResult.error);
        }
      }
    } catch (emailError) {
      // Don't fail the account creation if email fails
      logger.error('Error sending MT5 account creation email (non-critical)', emailError);
    }

    // Force sync of the new account to get real balance from MT5
    // This ensures the balance shown is the actual MT5 balance
    try {
      logger.info('Forcing sync for new account', { accountNumber });
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      if (!baseUrl) {
        throw new Error('VITE_API_BASE_URL is not defined in environment variables');
      }
      const syncUrl = `${baseUrl}/api/v1/supabase/accounts/${accountNumber}/sync`;
      
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await fetch(syncUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        logger.info('Sync triggered for new account', { accountNumber });
      }
    } catch (syncError) {
      // Don't fail the account creation if sync fails
      logger.error('Failed to sync new account (non-critical)', syncError);
    }

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