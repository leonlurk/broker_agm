/**
 * Affiliates Service
 * Handles affiliate program data and operations
 */

import { supabase } from '../supabase/config';
import { logger } from '../utils/logger';

class AffiliatesService {
  /**
   * Get user referral stats
   * @param {string} userId - User ID
   * @returns {Promise<{referralCount: number, totalCommissions: number, tier: number}>}
   */
  async getReferralStats(userId) {
    try {
      const { data, error } = await supabase
        .from('user_referrals')
        .select(`
          id,
          referred_user_id,
          status,
          commission_earned,
          created_at
        `)
        .eq('referrer_user_id', userId)
        .eq('status', 'active');

      if (error) {
        // If table doesn't exist, return default values instead of error
        if (error.code === '42P01') {
          logger.warn('[Affiliates] user_referrals table does not exist, returning default values');
          return { referralCount: 0, totalCommissions: 0, tier: 1 };
        }
        logger.error('[Affiliates] Error fetching referral stats:', error);
        return { referralCount: 0, totalCommissions: 0, tier: 1 };
      }

      const referralCount = data.length;
      const totalCommissions = data.reduce((sum, ref) => sum + (ref.commission_earned || 0), 0);
      const tier = this.calculateTier(referralCount);

      return {
        referralCount,
        totalCommissions,
        tier
      };
    } catch (error) {
      logger.error('[Affiliates] Error in getReferralStats:', error);
      return { referralCount: 0, totalCommissions: 0, tier: 1 };
    }
  }

  /**
   * Get active referral accounts
   * @param {string} userId - User ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<{accounts: Array, totalCount: number}>}
   */
  async getActiveAccounts(userId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const { data, error, count } = await supabase
        .from('user_referrals')
        .select(`
          id,
          referred_user_id,
          commission_earned,
          status,
          created_at,
          users!referred_user_id (
            id,
            full_name,
            email
          ),
          trading_accounts!referred_user_id (
            id,
            account_number,
            account_name,
            account_type,
            balance,
            equity,
            created_at
          )
        `, { count: 'exact' })
        .eq('referrer_user_id', userId)
        .eq('status', 'active')
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) {
        // If table doesn't exist, return empty results
        if (error.code === '42P01') {
          logger.warn('[Affiliates] user_referrals table does not exist, returning empty results');
          return { accounts: [], totalCount: 0 };
        }
        logger.error('[Affiliates] Error fetching active accounts:', error);
        return { accounts: [], totalCount: 0 };
      }

      // Transform data to match component expectations
      const accounts = data.map(referral => {
        const user = referral.users;
        const account = referral.trading_accounts?.[0]; // Take first account if multiple
        
        return {
          id: referral.id,
          userId: referral.referred_user_id,
          nombre: user?.full_name || user?.email || 'Unknown User',
          tipoCuenta: account?.account_type || 'Standard',
          balance: account?.balance || 0,
          equidad: account?.equity || 0,
          lotesOperados: 0, // Would need trading history data
          comisionesGeneradas: referral.commission_earned || 0,
          retirosCobrados: 0, // Would need withdrawal history
          createdAt: referral.created_at
        };
      });

      return {
        accounts,
        totalCount: count || 0
      };
    } catch (error) {
      logger.error('[Affiliates] Error in getActiveAccounts:', error);
      return { accounts: [], totalCount: 0 };
    }
  }

  /**
   * Get referral payment history
   * @param {string} userId - User ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<{payments: Array, totalCount: number}>}
   */
  async getPaymentHistory(userId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const { data, error, count } = await supabase
        .from('affiliate_payments')
        .select(`
          id,
          amount,
          currency,
          status,
          payment_method,
          transaction_id,
          created_at,
          processed_at
        `, { count: 'exact' })
        .eq('user_id', userId)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('[Affiliates] Error fetching payment history:', error);
        return { payments: [], totalCount: 0 };
      }

      return {
        payments: data || [],
        totalCount: count || 0
      };
    } catch (error) {
      logger.error('[Affiliates] Error in getPaymentHistory:', error);
      return { payments: [], totalCount: 0 };
    }
  }

  /**
   * Generate referral link
   * @param {string} userId - User ID
   * @returns {string} Referral link
   */
  generateReferralLink(userId) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/register?ref=${userId}`;
  }

  /**
   * Calculate tier based on referral count
   * @param {number} referralCount - Number of referrals
   * @returns {number} Tier level (1-3)
   */
  calculateTier(referralCount) {
    if (referralCount >= 200) return 3;
    if (referralCount >= 100) return 2;
    return 1;
  }

  /**
   * Get tier benefits
   * @param {number} tier - Tier level
   * @returns {Object} Tier benefits
   */
  getTierBenefits(tier) {
    const benefits = {
      1: {
        commissionRate: 0.10, // 10%
        bonuses: [],
        minPayout: 50
      },
      2: {
        commissionRate: 0.15, // 15%
        bonuses: ['priority_support'],
        minPayout: 25
      },
      3: {
        commissionRate: 0.20, // 20%
        bonuses: ['priority_support', 'exclusive_materials'],
        minPayout: 10
      }
    };

    return benefits[tier] || benefits[1];
  }

  /**
   * Request commission withdrawal
   * @param {string} userId - User ID
   * @param {number} amount - Amount to withdraw
   * @param {string} paymentMethod - Payment method
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async requestWithdrawal(userId, amount, paymentMethod) {
    try {
      // Check available balance first
      const stats = await this.getReferralStats(userId);
      
      if (amount > stats.totalCommissions) {
        return {
          success: false,
          message: 'Insufficient commission balance'
        };
      }

      const { error } = await supabase
        .from('affiliate_payments')
        .insert({
          user_id: userId,
          amount,
          currency: 'USD',
          status: 'pending',
          payment_method: paymentMethod,
          created_at: new Date().toISOString()
        });

      if (error) {
        logger.error('[Affiliates] Error requesting withdrawal:', error);
        return {
          success: false,
          message: 'Failed to process withdrawal request'
        };
      }

      return {
        success: true,
        message: 'Withdrawal request submitted successfully'
      };
    } catch (error) {
      logger.error('[Affiliates] Error in requestWithdrawal:', error);
      return {
        success: false,
        message: 'An error occurred while processing your request'
      };
    }
  }
}

// Export singleton instance
const affiliatesService = new AffiliatesService();
export default affiliatesService;