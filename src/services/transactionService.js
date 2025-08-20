/**
 * Transaction Service for Alpha Global Market
 * Handles deposits, withdrawals and transfers using Supabase RPC functions
 */

import { supabase } from '../supabase/config';
import { logger } from '../utils/logger';

class TransactionService {
  /**
   * Create a deposit request (called after Payroll confirmation)
   */
  async createDepositRequest(depositData) {
    try {
      logger.info('[TransactionService] Creating deposit request', depositData);
      
      const { data, error } = await supabase.rpc('create_deposit_request', {
        p_account_id: depositData.account_id,
        p_account_name: depositData.account_name,
        p_amount: depositData.amount,
        p_payment_method: depositData.payment_method,
        p_crypto_currency: depositData.crypto_currency || null,
        p_crypto_network: depositData.crypto_network || null,
        p_wallet_address: depositData.wallet_address || null,
        p_transaction_hash: depositData.transaction_hash || null,
        p_payroll_data: depositData.payroll_data || null
      });

      if (error) {
        logger.error('[TransactionService] Error creating deposit request:', error);
        return { success: false, error: error.message };
      }

      if (!data || !data.success) {
        return { 
          success: false, 
          error: data?.error || 'Failed to create deposit request' 
        };
      }

      logger.info('[TransactionService] Deposit request created successfully', data);
      return { 
        success: true, 
        depositId: data.deposit_id,
        data: data.data 
      };
    } catch (error) {
      logger.error('[TransactionService] Exception creating deposit request:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a withdrawal request
   */
  async createWithdrawalRequest(withdrawalData) {
    try {
      logger.info('[TransactionService] Creating withdrawal request', withdrawalData);
      
      const { data, error } = await supabase.rpc('create_withdrawal_request', {
        p_account_id: withdrawalData.account_id,
        p_account_name: withdrawalData.account_name,
        p_amount: withdrawalData.amount,
        p_withdrawal_type: withdrawalData.withdrawal_type,
        p_crypto_currency: withdrawalData.crypto_currency || null,
        p_wallet_address: withdrawalData.wallet_address || null,
        p_network: withdrawalData.network || null,
        p_bank_name: withdrawalData.bank_name || null,
        p_bank_account: withdrawalData.bank_account || null,
        p_bank_details: withdrawalData.bank_details || null
      });

      if (error) {
        logger.error('[TransactionService] Error creating withdrawal request:', error);
        return { success: false, error: error.message };
      }

      if (!data || !data.success) {
        return { 
          success: false, 
          error: data?.error || 'Failed to create withdrawal request' 
        };
      }

      logger.info('[TransactionService] Withdrawal request created successfully', data);
      return { 
        success: true, 
        withdrawalId: data.withdrawal_id,
        data: data.data 
      };
    } catch (error) {
      logger.error('[TransactionService] Exception creating withdrawal request:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create an internal transfer request
   */
  async createTransferRequest(transferData) {
    try {
      logger.info('[TransactionService] Creating transfer request', transferData);
      
      const { data, error } = await supabase.rpc('create_transfer_request', {
        p_from_account_id: transferData.from_account_id,
        p_from_account_name: transferData.from_account_name,
        p_to_account_id: transferData.to_account_id,
        p_to_account_name: transferData.to_account_name,
        p_amount: transferData.amount
      });

      if (error) {
        logger.error('[TransactionService] Error creating transfer request:', error);
        return { success: false, error: error.message };
      }

      if (!data || !data.success) {
        return { 
          success: false, 
          error: data?.error || 'Failed to create transfer request' 
        };
      }

      logger.info('[TransactionService] Transfer request created successfully', data);
      return { 
        success: true, 
        transferId: data.transfer_id,
        data: data.data 
      };
    } catch (error) {
      logger.error('[TransactionService] Exception creating transfer request:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user transactions
   */
  async getUserTransactions(type = 'all', limit = 50) {
    try {
      logger.info('[TransactionService] Getting user transactions', { type, limit });
      
      const { data, error } = await supabase.rpc('get_user_transactions', {
        p_type: type,
        p_limit: limit
      });

      if (error) {
        logger.error('[TransactionService] Error getting transactions:', error);
        return { success: false, error: error.message };
      }

      if (!data || !data.success) {
        return { 
          success: false, 
          error: data?.error || 'Failed to get transactions' 
        };
      }

      return { 
        success: true, 
        deposits: data.deposits || [],
        withdrawals: data.withdrawals || [],
        transfers: data.transfers || []
      };
    } catch (error) {
      logger.error('[TransactionService] Exception getting transactions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get transaction status for monitoring
   */
  async getTransactionStatus(transactionId, type) {
    try {
      let tableName;
      switch(type) {
        case 'deposit':
          tableName = 'deposits';
          break;
        case 'withdrawal':
          tableName = 'withdrawals';
          break;
        case 'transfer':
          tableName = 'internal_transfers';
          break;
        default:
          throw new Error('Invalid transaction type');
      }

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', transactionId)
        .single();

      if (error) {
        logger.error('[TransactionService] Error getting transaction status:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      logger.error('[TransactionService] Exception getting transaction status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Subscribe to transaction updates (realtime)
   */
  subscribeToTransactionUpdates(userId, callback) {
    logger.info('[TransactionService] Subscribing to transaction updates for user:', userId);
    
    const channels = [];
    
    // Subscribe to deposits
    const depositsChannel = supabase
      .channel(`deposits-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deposits',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          logger.info('[TransactionService] Deposit update:', payload);
          callback('deposit', payload);
        }
      )
      .subscribe();
    
    channels.push(depositsChannel);
    
    // Subscribe to withdrawals
    const withdrawalsChannel = supabase
      .channel(`withdrawals-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawals',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          logger.info('[TransactionService] Withdrawal update:', payload);
          callback('withdrawal', payload);
        }
      )
      .subscribe();
    
    channels.push(withdrawalsChannel);
    
    // Subscribe to transfers
    const transfersChannel = supabase
      .channel(`transfers-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'internal_transfers',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          logger.info('[TransactionService] Transfer update:', payload);
          callback('transfer', payload);
        }
      )
      .subscribe();
    
    channels.push(transfersChannel);
    
    // Return unsubscribe function
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }
}

// Export singleton instance
const transactionService = new TransactionService();
export default transactionService;