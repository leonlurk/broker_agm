import { logger } from '../utils/logger';

class ConfigService {
  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  loadConfig() {
    return {
      // Environment
      NODE_ENV: import.meta.env.MODE,
      IS_DEVELOPMENT: import.meta.env.MODE === 'development',
      IS_PRODUCTION: import.meta.env.MODE === 'production',
      IS_TEST: import.meta.env.MODE === 'test',

      // Application
      APP_NAME: import.meta.env.VITE_APP_NAME || 'AGM Broker',
      APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
      APP_ENV: import.meta.env.VITE_APP_ENV || 'development',

      // Firebase (required)
      FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
      FIREBASE_MEASUREMENT_ID: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,

      // API Configuration
      API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.agm.com',
      TRADING_API_URL: import.meta.env.VITE_TRADING_API_URL || 'https://trading-api.agm.com',

      // Feature Flags
      ENABLE_LOGGING: import.meta.env.VITE_ENABLE_LOGGING === 'true',
      ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',

      // Security
      SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    };
  }

  validateConfig() {
    const provider = import.meta.env.VITE_DATABASE_PROVIDER || 'firebase';
    // Only require Firebase vars when provider is 'firebase'
    const requiredVars = provider === 'firebase' ? [
      'FIREBASE_API_KEY',
      'FIREBASE_AUTH_DOMAIN',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_STORAGE_BUCKET',
      'FIREBASE_MESSAGING_SENDER_ID',
      'FIREBASE_APP_ID'
    ] : [];

    const missingVars = requiredVars.filter(varName => !this.config[varName]);

    if (missingVars.length > 0) {
      const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`;
      logger.error('Configuration validation failed', { missingVars });
      
      if (this.config.IS_PRODUCTION) {
        throw new Error(errorMessage);
      } else {
        logger.warn('Running with missing environment variables in development mode');
      }
    }

    // Validate Firebase config format
    if (provider === 'firebase' && this.config.FIREBASE_API_KEY && !this.config.FIREBASE_API_KEY.startsWith('AIzaSy')) {
      logger.warn('Firebase API key format may be incorrect');
    }

    if (provider === 'firebase' && this.config.FIREBASE_PROJECT_ID && this.config.FIREBASE_AUTH_DOMAIN) {
      const expectedDomain = `${this.config.FIREBASE_PROJECT_ID}.firebaseapp.com`;
      if (this.config.FIREBASE_AUTH_DOMAIN !== expectedDomain) {
        logger.warn('Firebase auth domain may not match project ID');
      }
    }

    logger.info('Configuration loaded successfully', {
      environment: this.config.NODE_ENV,
      appName: this.config.APP_NAME,
      version: this.config.APP_VERSION
    });
  }

  get(key) {
    return this.config[key];
  }

  getFirebaseConfig() {
    return {
      apiKey: this.config.FIREBASE_API_KEY,
      authDomain: this.config.FIREBASE_AUTH_DOMAIN,
      projectId: this.config.FIREBASE_PROJECT_ID,
      storageBucket: this.config.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: this.config.FIREBASE_MESSAGING_SENDER_ID,
      appId: this.config.FIREBASE_APP_ID,
      measurementId: this.config.FIREBASE_MEASUREMENT_ID
    };
  }

  isFeatureEnabled(feature) {
    switch (feature) {
      case 'logging':
        return this.config.ENABLE_LOGGING || this.config.IS_DEVELOPMENT;
      case 'analytics':
        return this.config.ENABLE_ANALYTICS && this.config.IS_PRODUCTION;
      default:
        return false;
    }
  }

  getApiConfig() {
    return {
      baseUrl: this.config.API_BASE_URL,
      tradingUrl: this.config.TRADING_API_URL,
      timeout: 60000, // Aumentado a 60 segundos
      retries: 3
    };
  }

  // Security configuration
  getSecurityConfig() {
    return {
      sentryDsn: this.config.SENTRY_DSN,
      enableCSP: this.config.IS_PRODUCTION,
      enableHTTPS: this.config.IS_PRODUCTION
    };
  }
}

// Export singleton instance
export const configService = new ConfigService();

// Export individual methods for convenience
export const getConfig = (key) => configService.get(key);
export const getFirebaseConfig = () => configService.getFirebaseConfig();
export const isFeatureEnabled = (feature) => configService.isFeatureEnabled(feature);
export const getApiConfig = () => configService.getApiConfig();
export const getSecurityConfig = () => configService.getSecurityConfig();

export default configService; 
