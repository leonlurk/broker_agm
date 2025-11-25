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
   * Get tier benefits with account type consideration
   * @param {number} tier - Tier level
   * @param {string} accountType - Account type (Market Direct or Institucional)
   * @returns {Object} Tier benefits
   */
  getTierBenefits(tier, accountType = 'Market Direct') {
    // Fixed commission amounts in USD per lot
    const marketDirectAmounts = {
      1: 3.00,  // $3.00 USD
      2: 3.50,  // $3.50 USD
      3: 4.00   // $4.00 USD
    };
    
    // Calculate commission amount based on account type
    const baseAmount = marketDirectAmounts[tier] || marketDirectAmounts[1];
    const commissionAmount = accountType === 'Institucional' 
      ? baseAmount / 2  // Half commission for Institucional
      : baseAmount;     // Full commission for Market Direct
    
    const benefits = {
      1: {
        commissionAmount,
        commissionRate: 0, // Deprecated - using fixed amounts now
        bonuses: [],
        minPayout: 50
      },
      2: {
        commissionAmount,
        commissionRate: 0, // Deprecated - using fixed amounts now
        bonuses: ['priority_support'],
        minPayout: 25
      },
      3: {
        commissionAmount,
        commissionRate: 0, // Deprecated - using fixed amounts now
        bonuses: ['priority_support', 'exclusive_materials'],
        minPayout: 10
      }
    };

    return benefits[tier] || benefits[1];
  }

  /**
   * Get commission amount based on tier and account type
   * @param {number} tier - Tier level
   * @param {string} accountType - Account type (Market Direct or Institucional)
   * @returns {number} Commission amount in USD per lot
   */
  getCommissionAmount(tier, accountType = 'Market Direct') {
    const benefits = this.getTierBenefits(tier, accountType);
    return benefits.commissionAmount;
  }

  /**
   * Calculate commission rate based on tier and account type
   * @param {number} tier - Tier level
   * @param {string} accountType - Account type (Market Direct or Institucional)
   * @returns {number} Commission rate as decimal
   * @deprecated Use getCommissionAmount instead
   */
  getCommissionRate(tier, accountType = 'Market Direct') {
    const benefits = this.getTierBenefits(tier, accountType);
    return benefits.commissionRate;
  }

  /**
   * Check if instrument is eligible for commission based on account type
   * @param {string} instrument - Trading instrument symbol
   * @param {string} accountType - Account type (Market Direct or Institucional)
   * @returns {boolean} True if eligible for commission
   */
  isEligibleInstrument(instrument, accountType = 'Market Direct') {
    if (!instrument) return false;
    
    // Market Direct: ALL instruments generate commission
    if (accountType === 'Market Direct') {
      return true;
    }
    
    // Institucional: ONLY Forex and Metals generate commission
    const upperInstrument = instrument.toUpperCase();
    
    // Forex pairs (contains currency codes)
    const forexPairs = [
      'EUR', 'USD', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD',
      'SEK', 'NOK', 'DKK', 'PLN', 'HUF', 'CZK', 'TRY', 'MXN',
      'ZAR', 'RUB', 'INR', 'BRL', 'CNY', 'CNH', 'SGD', 'HKD'
    ];
    
    // Metals symbols
    const metals = [
      'XAU', 'XAG', 'GOLD', 'SILVER', 'PLATINUM', 'PALLADIUM',
      'XPT', 'XPD', 'COPPER', 'ALUMINUM'
    ];
    
    // Check if it's a forex pair (contains at least one currency code)
    const isForex = forexPairs.some(currency => upperInstrument.includes(currency));
    
    // Check if it's a metal
    const isMetal = metals.some(metal => upperInstrument.includes(metal));
    
    return isForex || isMetal;
  }

  /**
   * Calculate commission for a trade
   * @param {Object} trade - Trade details (should include lots/volume)
   * @param {number} tier - Affiliate tier
   * @param {string} accountType - Account type
   * @returns {number} Commission amount in USD
   */
  calculateTradeCommission(trade, tier, accountType = 'Market Direct') {
    // Check if instrument is eligible based on account type
    if (!this.isEligibleInstrument(trade.symbol, accountType)) {
      return 0;
    }
    
    // Get fixed commission amount per lot based on tier and account type
    const commissionPerLot = this.getCommissionAmount(tier, accountType);
    
    // Calculate total commission based on lots traded
    // Assuming trade.lots contains the number of lots traded
    const lots = trade.lots || trade.volume || 0;
    const totalCommission = lots * commissionPerLot;
    
    return Math.max(0, totalCommission); // Ensure non-negative
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

  /**
   * Check if user has accepted IB agreement
   * @param {string} userId - User ID
   * @returns {Promise<{hasAccepted: boolean, acceptedAt: string|null, version: string|null}>}
   */
  async checkIBAgreement(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('ib_agreement_accepted, ib_agreement_accepted_at, ib_agreement_version, is_ib_active')
        .eq('id', userId)
        .single();

      if (error) {
        logger.error('[Affiliates] Error checking IB agreement:', error);
        return { hasAccepted: false, acceptedAt: null, version: null, isActive: false };
      }

      return {
        hasAccepted: data?.ib_agreement_accepted || false,
        acceptedAt: data?.ib_agreement_accepted_at || null,
        version: data?.ib_agreement_version || null,
        isActive: data?.is_ib_active || false
      };
    } catch (error) {
      logger.error('[Affiliates] Error in checkIBAgreement:', error);
      return { hasAccepted: false, acceptedAt: null, version: null, isActive: false };
    }
  }

  /**
   * Get active IB agreement content
   * @returns {Promise<{content: string, version: string}>}
   */
  async getActiveAgreement() {
    try {
      const { data, error } = await supabase
        .from('ib_agreement_versions')
        .select('content, version')
        .eq('is_active', true)
        .single();

      if (error) {
        logger.error('[Affiliates] Error fetching IB agreement:', error);
        return { content: '', version: '1.0' };
      }

      return {
        content: data?.content || '',
        version: data?.version || '1.0'
      };
    } catch (error) {
      logger.error('[Affiliates] Error in getActiveAgreement:', error);
      return { content: '', version: '1.0' };
    }
  }

  /**
   * Accept IB agreement
   * @param {string} userId - User ID
   * @param {string} agreementVersion - Agreement version
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async acceptIBAgreement(userId, agreementVersion = '1.0') {
    try {
      // Get user's IP address (client-side, limited accuracy)
      let ipAddress = null;
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        ipAddress = data.ip;
      } catch (ipError) {
        logger.warn('[Affiliates] Could not fetch IP address:', ipError);
      }

      // Get user agent
      const userAgent = navigator.userAgent;

      // Call database function to record acceptance
      const { data, error } = await supabase.rpc('accept_ib_agreement', {
        p_user_id: userId,
        p_agreement_version: agreementVersion,
        p_ip_address: ipAddress,
        p_user_agent: userAgent
      });

      if (error) {
        logger.error('[Affiliates] Error accepting IB agreement:', error);
        return {
          success: false,
          message: 'Failed to record IB agreement acceptance'
        };
      }

      logger.info('[Affiliates] IB agreement accepted successfully', { userId, version: agreementVersion });

      return {
        success: true,
        message: 'IB agreement accepted successfully',
        data
      };
    } catch (error) {
      logger.error('[Affiliates] Error in acceptIBAgreement:', error);
      return {
        success: false,
        message: 'An error occurred while processing your acceptance'
      };
    }
  }
}

// Export singleton instance
const affiliatesService = new AffiliatesService();
export default affiliatesService;