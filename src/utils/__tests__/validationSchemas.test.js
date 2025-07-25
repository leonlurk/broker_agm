import { describe, it, expect } from 'vitest';
import { 
  loginSchema, 
  registerSchema, 
  withdrawalSchema, 
  tradingOperationSchema,
  validateData 
} from '../validationSchemas';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        identifier: 'user@example.com',
        password: 'password123'
      };
      
      const result = validateData(loginSchema, validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid login data', () => {
      const invalidData = {
        identifier: 'ab', // Too short
        password: '123'   // Too short
      };
      
      const result = validateData(loginSchema, invalidData);
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('withdrawalSchema', () => {
    it('should validate correct withdrawal data', () => {
      const validData = {
        amount: 100,
        method: 'stableCoins',
        currency: 'USDT_ETH',
        walletAddress: '0x742d35Cc6635C0532925a3b8D2203d2f42b85e9D',
        acceptTerms: true
      };
      
      const result = validateData(withdrawalSchema, validData);
      expect(result.success).toBe(true);
    });

    it('should reject withdrawal below minimum', () => {
      const invalidData = {
        amount: 10, // Below minimum of 25
        method: 'stableCoins',
        currency: 'USDT_ETH',
        walletAddress: '0x742d35Cc6635C0532925a3b8D2203d2f42b85e9D',
        acceptTerms: true
      };
      
      const result = validateData(withdrawalSchema, invalidData);
      expect(result.success).toBe(false);
      expect(result.errors.some(err => err.message.includes('mínimo'))).toBe(true);
    });

    it('should reject withdrawal without accepting terms', () => {
      const invalidData = {
        amount: 100,
        method: 'stableCoins',
        currency: 'USDT_ETH',
        walletAddress: '0x742d35Cc6635C0532925a3b8D2203d2f42b85e9D',
        acceptTerms: false
      };
      
      const result = validateData(withdrawalSchema, invalidData);
      expect(result.success).toBe(false);
      expect(result.errors.some(err => err.message.includes('términos'))).toBe(true);
    });
  });

  describe('tradingOperationSchema', () => {
    it('should validate correct trading operation', () => {
      const validData = {
        symbol: 'EURUSD',
        type: 'buy',
        volume: 1.5,
        price: 1.1000,
        stopLoss: 1.0950,
        takeProfit: 1.1100
      };
      
      const result = validateData(tradingOperationSchema, validData);
      expect(result.success).toBe(true);
    });

    it('should reject excessive volume', () => {
      const invalidData = {
        symbol: 'EURUSD',
        type: 'buy',
        volume: 150, // Above maximum of 100
        price: 1.1000
      };
      
      const result = validateData(tradingOperationSchema, invalidData);
      expect(result.success).toBe(false);
      expect(result.errors.some(err => err.message.includes('máximo'))).toBe(true);
    });
  });
});
 