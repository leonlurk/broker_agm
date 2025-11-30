// Professional logging system to replace console.log calls
class Logger {
  constructor() {
    // Disable all info/debug logs - only errors in production
    this.isDevelopment = false; // Force disabled to prevent console buffer issues
    this.isLoggingEnabled = false;
  }

  // Format log message with timestamp and level
  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logObj = {
      timestamp,
      level,
      message,
      ...(data && { data })
    };
    return logObj;
  }

  // Log info messages - DISABLED to prevent UI buffer
  info(message, data = null) {
    // Disabled - was causing UI rendering delays
  }

  // Log warning messages - DISABLED to prevent UI buffer
  warn(message, data = null) {
    // Disabled - was causing UI rendering delays
  }

  // Log error messages (always logged)
  error(message, error = null) {
    const logObj = this.formatMessage('ERROR', message, {
      error: error?.message || error,
      stack: error?.stack
    });
    console.error(`[${logObj.timestamp}] ERROR: ${message}`, error || '');
    // In production, you would send this to error tracking service (Sentry, etc.)
  }

  // Log debug messages (only in development)
  debug(message, data = null) {
    if (this.isDevelopment) {
      const logObj = this.formatMessage('DEBUG', message, data);
      console.debug(`[${logObj.timestamp}] DEBUG: ${message}`, data || '');
    }
  }

  // Sanitize sensitive data before logging
  sanitizeData(data) {
    if (!data || typeof data !== 'object') return data;
    
    const sanitized = { ...data };
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'uid', 'email'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  // Log authentication events with sanitized data
  auth(message, userData = null) {
    const sanitizedData = this.sanitizeData(userData);
    this.info(`[AUTH] ${message}`, sanitizedData);
  }

  // Log trading operations
  trading(message, data = null) {
    this.info(`[TRADING] ${message}`, data);
  }

  // Log financial operations
  financial(message, data = null) {
    this.info(`[FINANCIAL] ${message}`, data);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export individual methods for convenience
export const { info, warn, error, debug, auth, trading, financial } = logger; 