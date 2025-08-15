/**
 * Email Service Proxy for Alpha Global Market
 * Routes email requests through the backend API to avoid browser blocking
 */

import cryptoPaymentService from './cryptoPaymentService';

// Get the crypto API URL from the payment service config
const API_URL = import.meta.env.VITE_CRYPTO_API_URL || 'https://whapy.apekapital.com:446/api';

class EmailServiceProxy {
  constructor() {
    this.apiUrl = `${API_URL}/email`;
  }

  /**
   * Send email through backend API
   * @param {string} endpoint - The email endpoint to call
   * @param {Object} data - Email data
   * @returns {Promise} API response
   */
  async sendEmailThroughBackend(endpoint, data) {
    try {
      const token = localStorage.getItem('crypto_token');
      
      const response = await fetch(`${this.apiUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'x-auth-token': token })
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log(`[EmailServiceProxy] Email sent successfully through backend: ${endpoint}`);
        return { success: true, ...result };
      } else {
        console.error(`[EmailServiceProxy] Failed to send email through backend:`, result);
        return { success: false, error: result.message || 'Error sending email' };
      }
    } catch (error) {
      console.error('[EmailServiceProxy] Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send welcome email after registration
   */
  async sendWelcomeEmail(userData) {
    return await this.sendEmailThroughBackend('welcome', {
      email: userData.email,
      userName: userData.name || userData.email.split('@')[0]
    });
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(userData, verificationCode) {
    return await this.sendEmailThroughBackend('verification', {
      email: userData.email,
      verificationCode: verificationCode
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(userData, resetCode) {
    return await this.sendEmailThroughBackend('password-reset', {
      email: userData.email,
      resetCode: resetCode
    });
  }

  /**
   * Send deposit confirmation email
   */
  async sendDepositConfirmation(userData, depositData) {
    return await this.sendEmailThroughBackend('transaction', {
      email: userData.email,
      transactionDetails: {
        type: 'deposit',
        amount: depositData.amount,
        currency: depositData.currency || 'USD',
        txHash: depositData.txHash,
        network: depositData.network || 'TRON'
      }
    });
  }

  /**
   * Send withdrawal confirmation email
   */
  async sendWithdrawalConfirmation(userData, withdrawalData) {
    return await this.sendEmailThroughBackend('transaction', {
      email: userData.email,
      transactionDetails: {
        type: 'withdrawal',
        amount: withdrawalData.amount,
        currency: withdrawalData.currency || 'USD',
        txHash: withdrawalData.txHash,
        network: withdrawalData.network || 'TRON'
      }
    });
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(userData, paymentDetails) {
    return await this.sendEmailThroughBackend('payment-confirmation', {
      email: userData.email,
      paymentDetails: {
        amount: paymentDetails.amount,
        method: paymentDetails.method,
        status: paymentDetails.status || 'Confirmado',
        date: paymentDetails.date || new Date().toISOString()
      }
    });
  }

  /**
   * Send security alert
   */
  async sendSecurityAlert(userData, alertDetails) {
    return await this.sendEmailThroughBackend('security-alert', {
      email: userData.email,
      alertDetails: {
        type: alertDetails.type || 'Acceso sospechoso',
        ipAddress: alertDetails.ipAddress,
        location: alertDetails.location,
        device: alertDetails.device,
        timestamp: alertDetails.timestamp || new Date().toISOString()
      }
    });
  }

  /**
   * Send KYC approved email (uses welcome template with custom message)
   */
  async sendKYCApprovedEmail(userData) {
    return await this.sendEmailThroughBackend('welcome', {
      email: userData.email,
      userName: userData.name || userData.email.split('@')[0],
      customSubject: 'Tu cuenta ha sido verificada - AGM Broker'
    });
  }

  /**
   * Send KYC rejected email (uses verification template with reason)
   */
  async sendKYCRejectedEmail(userData, reason) {
    return await this.sendEmailThroughBackend('verification', {
      email: userData.email,
      verificationCode: `KYC Rechazado: ${reason}`,
      customSubject: 'Verificación KYC pendiente - AGM Broker'
    });
  }

  /**
   * Send account credentials (uses welcome template with credentials)
   */
  async sendAccountCredentials(userData, accountData) {
    return await this.sendEmailThroughBackend('welcome', {
      email: userData.email,
      userName: userData.name || userData.email.split('@')[0],
      customSubject: 'Credenciales de tu cuenta MT5 - AGM Broker',
      additionalInfo: {
        accountNumber: accountData.login,
        server: accountData.server,
        accountType: accountData.accountType
      }
    });
  }
}

// Export singleton instance
const emailServiceProxy = new EmailServiceProxy();
export default emailServiceProxy;