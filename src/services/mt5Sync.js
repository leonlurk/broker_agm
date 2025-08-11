/**
 * MT5 Synchronization Service
 * Sincroniza datos de MT5 con Supabase periódicamente
 */

import { supabase } from '../supabase/config';
import { logger } from '../utils/logger';
import { getAccountMetrics } from './mt5Metrics';
import { recordBalanceSnapshot, recordTradingOperation } from './accountHistory';

/**
 * Sincroniza el balance de una cuenta con Supabase
 */
export const syncAccountBalance = async (account) => {
  try {
    if (!account || !account.account_number) {
      return { success: false, error: 'Invalid account data' };
    }

    // Obtener métricas actuales de MT5
    const metricsResult = await getAccountMetrics(account.account_number);
    
    if (!metricsResult.success) {
      throw new Error(metricsResult.error || 'Failed to get metrics');
    }

    // Guardar snapshot en Supabase
    const snapshotResult = await recordBalanceSnapshot(
      account.id,
      account.account_number,
      {
        balance: metricsResult.data.balance,
        equity: metricsResult.data.equity,
        margin: metricsResult.data.margin,
        free_margin: metricsResult.data.free_margin
      }
    );

    // Actualizar balance en la tabla trading_accounts
    const { error: updateError } = await supabase
      .from('trading_accounts')
      .update({
        balance: metricsResult.data.balance,
        equity: metricsResult.data.equity,
        margin: metricsResult.data.margin,
        free_margin: metricsResult.data.free_margin,
        updated_at: new Date().toISOString()
      })
      .eq('id', account.id);

    if (updateError) {
      logger.error('[MT5 Sync] Error updating account balance', updateError);
    }

    logger.info('[MT5 Sync] Account balance synchronized', {
      accountNumber: account.account_number,
      balance: metricsResult.data.balance
    });

    return { 
      success: true, 
      data: {
        balance: metricsResult.data.balance,
        equity: metricsResult.data.equity,
        snapshotId: snapshotResult.data?.id
      }
    };

  } catch (error) {
    logger.error('[MT5 Sync] Error syncing account balance', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sincroniza todas las cuentas del usuario actual
 */
export const syncAllUserAccounts = async (userId) => {
  try {
    // Obtener todas las cuentas del usuario
    const { data: accounts, error } = await supabase
      .from('trading_accounts')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    if (!accounts || accounts.length === 0) {
      return { success: true, message: 'No accounts to sync' };
    }

    // Sincronizar cada cuenta
    const syncResults = await Promise.all(
      accounts.map(account => syncAccountBalance(account))
    );

    const successCount = syncResults.filter(r => r.success).length;
    const failedCount = syncResults.filter(r => !r.success).length;

    logger.info('[MT5 Sync] All accounts synchronized', {
      total: accounts.length,
      success: successCount,
      failed: failedCount
    });

    return {
      success: true,
      data: {
        total: accounts.length,
        success: successCount,
        failed: failedCount,
        results: syncResults
      }
    };

  } catch (error) {
    logger.error('[MT5 Sync] Error syncing all accounts', error);
    return { success: false, error: error.message };
  }
};

/**
 * Inicia sincronización automática periódica
 */
let syncInterval = null;

export const startAutoSync = (userId, intervalMinutes = 5) => {
  // Detener sincronización previa si existe
  stopAutoSync();

  // Sincronización inicial
  syncAllUserAccounts(userId);

  // Configurar sincronización periódica
  const intervalMs = intervalMinutes * 60 * 1000;
  
  syncInterval = setInterval(() => {
    logger.info('[MT5 Sync] Running automatic synchronization');
    syncAllUserAccounts(userId);
  }, intervalMs);

  logger.info(`[MT5 Sync] Auto-sync started with ${intervalMinutes} minute interval`);
  
  return true;
};

/**
 * Detiene la sincronización automática
 */
export const stopAutoSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    logger.info('[MT5 Sync] Auto-sync stopped');
  }
};

/**
 * Sincroniza operaciones desde MT5 a Supabase
 */
export const syncTradingOperations = async (accountId, accountNumber, operations) => {
  try {
    if (!operations || operations.length === 0) {
      return { success: true, message: 'No operations to sync' };
    }

    // Obtener tickets existentes para evitar duplicados
    const { data: existingOps, error: fetchError } = await supabase
      .from('trading_operations')
      .select('ticket')
      .eq('account_number', accountNumber);

    if (fetchError) throw fetchError;

    const existingTickets = new Set(existingOps?.map(op => op.ticket) || []);

    // Filtrar operaciones nuevas
    const newOperations = operations.filter(op => !existingTickets.has(op.ticket));

    if (newOperations.length === 0) {
      return { success: true, message: 'All operations already synced' };
    }

    // Insertar operaciones nuevas
    const syncResults = await Promise.all(
      newOperations.map(op => 
        recordTradingOperation(accountId, accountNumber, op)
      )
    );

    const successCount = syncResults.filter(r => r.success).length;

    logger.info('[MT5 Sync] Trading operations synchronized', {
      accountNumber,
      total: newOperations.length,
      success: successCount
    });

    return {
      success: true,
      data: {
        total: newOperations.length,
        synced: successCount
      }
    };

  } catch (error) {
    logger.error('[MT5 Sync] Error syncing operations', error);
    return { success: false, error: error.message };
  }
};

export default {
  syncAccountBalance,
  syncAllUserAccounts,
  syncTradingOperations,
  startAutoSync,
  stopAutoSync
};