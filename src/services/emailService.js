/**
 * Email Service for Alpha Global Market
 * Handles all transactional emails via backend API
 */

import axios from 'axios';
import { AuthAdapter } from './database.adapter';

// La URL base para Email Service - usa MT5Manager como proxy
// MT5Manager en producción hace proxy interno a Copy-PAMM (localhost:8080)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is not defined in environment variables. Please check your .env file.');
}

// Creamos una instancia de Axios para el servicio de email
const logicApiClient = axios.create({
  baseURL: API_BASE_URL
});

// Interceptor para añadir automáticamente el token de autenticación
logicApiClient.interceptors.request.use(
  async (config) => {
    try {
      if (AuthAdapter.isSupabase()) {
        const { supabase } = await import('../supabase/config');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
        }
      } else {
        const user = await AuthAdapter.getCurrentUser();
        if (user && user.getIdToken) {
          const token = await user.getIdToken();
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.warn('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API configuration
// ⚠️ DEPRECATION NOTICE: Este servicio llama al backend MT5Manager que puede no tener emails implementados.
// Se recomienda usar emailServiceProxy.js que llama a payroll-crypto-api (donde están los templates).
// TODO: Migrar todos los componentes a usar emailServiceProxy.js y deprecar este archivo.
const SENDER_EMAIL = 'noreply@alphaglobalmarket.io'; // Hardcoded - backend decide el remitente real
const SENDER_NAME = 'Alpha Global Market'; // Hardcoded - backend decide el nombre real

class EmailService {
  constructor() {
    this.senderEmail = SENDER_EMAIL;
    this.senderName = SENDER_NAME;
    this.supportEmail = 'support@alphaglobalmarket.io';
  }

  /**
   * Send email via backend API
   * @param {Object} emailData - Email configuration
   * @returns {Promise} API response
   */
  async sendEmail(emailData) {
    try {
      const response = await logicApiClient.post('/api/v1/email/send', emailData);

      if (response.data.success) {
        return { success: true, messageId: response.data.messageId };
      } else {
        console.error('[EmailService] Failed to send email:', response.data.error);
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      console.error('[EmailService] Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send welcome email after registration
   */
  async sendWelcomeEmail(userData) {
    const emailData = {
      sender: {
        name: this.senderName,
        email: this.senderEmail
      },
      to: [{
        email: userData.email,
        name: userData.name || 'Usuario'
      }],
      subject: 'Bienvenido a Alpha Global Market – Tu cuenta ha sido creada correctamente',
      htmlContent: this.getWelcomeEmailTemplate(userData)
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Send 2FA verification code via email
   */
  async send2FACode(userData, verificationCode) {
    const emailData = {
      sender: {
        name: this.senderName,
        email: this.senderEmail
      },
      to: [{
        email: userData.email,
        name: userData.name || 'Usuario'
      }],
      subject: 'Código de Verificación - Alpha Global Market',
      htmlContent: this.get2FAEmailTemplate(userData, verificationCode)
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(userData, verificationLink) {
    const emailData = {
      sender: {
        name: this.senderName,
        email: this.senderEmail
      },
      to: [{
        email: userData.email,
        name: userData.name || 'Usuario'
      }],
      subject: 'Verifica tu correo electrónico - Alpha Global Market',
      htmlContent: this.getVerificationEmailTemplate(userData, verificationLink)
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Send email when verification is confirmed
   */
  async sendEmailVerifiedConfirmation(userData) {
    const emailData = {
      sender: {
        name: this.senderName,
        email: this.senderEmail
      },
      to: [{
        email: userData.email,
        name: userData.name || 'Usuario'
      }],
      subject: 'Tu correo electrónico ha sido verificado con éxito',
      htmlContent: this.getEmailVerifiedTemplate(userData)
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Send KYC approved email
   */
  async sendKYCApprovedEmail(userData) {
    const emailData = {
      sender: {
        name: this.senderName,
        email: this.senderEmail
      },
      to: [{
        email: userData.email,
        name: userData.name || 'Usuario'
      }],
      subject: 'Tu cuenta en Alpha Global Market ha sido activada',
      htmlContent: this.getKYCApprovedTemplate(userData)
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Send KYC rejected email
   */
  async sendKYCRejectedEmail(userData, reason) {
    const emailData = {
      sender: {
        name: this.senderName,
        email: this.senderEmail
      },
      to: [{
        email: userData.email,
        name: userData.name || 'Usuario'
      }],
      subject: 'Problema con la verificación de tu cuenta en Alpha Global Market',
      htmlContent: this.getKYCRejectedTemplate(userData, reason)
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Send deposit confirmation email
   */
  async sendDepositConfirmation(userData, depositData) {
    const emailData = {
      sender: {
        name: this.senderName,
        email: this.senderEmail
      },
      to: [{
        email: userData.email,
        name: userData.name || 'Usuario'
      }],
      subject: 'Depósito confirmado en tu cuenta de Alpha Global Market',
      htmlContent: this.getDepositConfirmationTemplate(userData, depositData)
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Send withdrawal confirmation email
   */
  async sendWithdrawalConfirmation(userData, withdrawalData) {
    const emailData = {
      sender: {
        name: this.senderName,
        email: this.senderEmail
      },
      to: [{
        email: userData.email,
        name: userData.name || 'Usuario'
      }],
      subject: 'Solicitud de retiro recibida - Alpha Global Market',
      htmlContent: this.getWithdrawalConfirmationTemplate(userData, withdrawalData)
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Send MT5 account credentials
   */
  async sendAccountCredentials(userData, accountData) {
    const emailData = {
      sender: {
        name: this.senderName,
        email: this.senderEmail
      },
      to: [{
        email: userData.email,
        name: userData.name || 'Usuario'
      }],
      subject: 'Credenciales de tu cuenta MT5 - Alpha Global Market',
      htmlContent: this.getAccountCredentialsTemplate(userData, accountData)
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(userData, resetLink) {
    const emailData = {
      sender: {
        name: this.senderName,
        email: this.senderEmail
      },
      to: [{
        email: userData.email,
        name: userData.name || 'Usuario'
      }],
      subject: 'Solicitud de restablecimiento de contraseña',
      htmlContent: this.getPasswordResetTemplate(userData, resetLink)
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Send margin call alert email
   */
  async sendMarginCallEmail(userData, accountData) {
    const emailData = {
      sender: {
        name: this.senderName,
        email: this.senderEmail
      },
      to: [{
        email: userData.email,
        name: userData.name || 'Usuario'
      }],
      subject: '⚠️ ALERTA: Margin Call en tu Cuenta MT5 - Acción Requerida',
      htmlContent: this.getMarginCallTemplate(userData, accountData)
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Send stop out notification email
   */
  async sendStopOutEmail(userData, accountData, closedPositions) {
    const emailData = {
      sender: {
        name: this.senderName,
        email: this.senderEmail
      },
      to: [{
        email: userData.email,
        name: userData.name || 'Usuario'
      }],
      subject: '🔴 STOP OUT: Posiciones Cerradas Automáticamente - MT5',
      htmlContent: this.getStopOutTemplate(userData, accountData, closedPositions)
    };

    return await this.sendEmail(emailData);
  }

  // Email Templates

  getBaseTemplate(content, userName = 'Usuario') {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #e4e4e7; background-color: #0a0a0a; }
        .email-wrapper { width: 100%; background-color: #0a0a0a; padding: 40px 20px; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; overflow: hidden; }
        .banner-section { width: 100%; display: block; background-color: #000000; }
        .banner-image { width: 100%; height: auto; display: block; }
        .content-section { padding: 50px 40px; background-color: #18181b; border-top: 3px solid #3b82f6; }
        .logo-text { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #71717a; margin-bottom: 30px; text-align: center; }
        h2 { color: #fafafa; font-size: 24px; font-weight: 300; margin-bottom: 25px; letter-spacing: -0.5px; text-align: center; }
        .greeting { color: #a1a1aa; font-size: 15px; margin-bottom: 20px; }
        p { color: #d4d4d8; font-size: 15px; line-height: 1.7; margin-bottom: 20px; }
        .highlight { color: #fafafa; font-weight: 500; }
        .button-wrapper { margin: 40px 0; text-align: center; }
        .cta-button { display: inline-block; padding: 14px 40px; background-color: #3b82f6; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase; border: 1px solid #3b82f6; }
        .divider { width: 100%; height: 1px; background-color: #27272a; margin: 35px 0; }
        .security-notice { background-color: #1f1f23; border-left: 3px solid #3b82f6; padding: 20px; margin: 30px 0; }
        .security-notice p { color: #a1a1aa; font-size: 13px; margin-bottom: 0; }
        .footer-section { background-color: #0f0f11; padding: 35px 40px; border-top: 1px solid #27272a; }
        .footer-text { color: #71717a; font-size: 12px; margin-bottom: 15px; line-height: 1.6; }
        .company-info { margin-top: 30px; padding-top: 20px; border-top: 1px solid #27272a; }
        .company-name { color: #fafafa; font-size: 14px; font-weight: 500; margin-bottom: 5px; }
        .company-details { color: #52525b; font-size: 11px; line-height: 1.5; }
        .credentials-box { background-color: #1f1f23; border: 1px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 8px; }
        .credentials-box .label { color: #71717a; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
        .credentials-box .value { color: #fafafa; font-size: 16px; font-weight: 500; margin-bottom: 15px; }
        ul { list-style: none; padding-left: 0; }
        ul li { color: #d4d4d8; padding: 8px 0; border-bottom: 1px solid #27272a; }
        ul li:before { content: "•"; color: #3b82f6; font-weight: bold; display: inline-block; width: 1em; margin-left: 1em; }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-container">
            <div class="banner-section">
                <img src="https://ukngiipxprielwdfuvln.supabase.co/storage/v1/object/public/emails/Banner%20Mail%20-%20AGM%20(2).png" 
                     alt="Alpha Global Markets" class="banner-image">
            </div>
            <div class="content-section">
                <div class="logo-text">ALPHA GLOBAL MARKET</div>
                <p class="greeting">Estimado/a ${userName},</p>
                ${content}
            </div>
            <div class="footer-section">
                <div class="company-info">
                    <p class="company-name">ALPHA GLOBAL MARKET LTD.</p>
                    <p class="company-details">
                        No. 2025-00193<br>
                        Ground Floor, The Sotheby building, Rodney Village,<br>
                        Rodney Bay, Gros-islet, Saint Lucia<br><br>
                        Email: support@alphaglobalmarket.io<br>
                        Telegram: https://t.me/agm_soporte
                    </p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  get2FAEmailTemplate(userData, verificationCode) {
    const content = `
      <h2>Código de Verificación de Dos Factores</h2>
      <p>Has solicitado un código de verificación para acceder a tu cuenta en Alpha Global Market.</p>
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin: 30px 0;">
        <p style="color: white; margin: 0; font-size: 14px;">Tu código de verificación es:</p>
        <h1 style="color: white; font-size: 48px; letter-spacing: 10px; margin: 15px 0; font-family: monospace;">${verificationCode}</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 12px;">Este código expira en 10 minutos</p>
      </div>
      <div class="security-notice">
        <p><strong>Nota de Seguridad:</strong></p>
        <ul style="text-align: left;">
          <li>Este código es único y personal</li>
          <li>Nunca compartas este código con nadie</li>
          <li>Nuestro equipo nunca te pedirá este código</li>
          <li>Si no solicitaste este código, ignora este mensaje</li>
        </ul>
      </div>
      <p style="color: #71717a; font-size: 13px; margin-top: 20px;">
        Si no reconoces esta actividad, por favor contacta inmediatamente con nuestro equipo de soporte en ${this.supportEmail}
      </p>
    `;
    return this.getBaseTemplate(content, userData.name || 'Usuario');
  }

  getWelcomeEmailTemplate(userData) {
    const content = `
      <h2>Bienvenido a Alpha Global Market</h2>
      <p>Gracias por registrarte en Alpha Global Market. Nos complace darte la bienvenida a nuestra comunidad de traders.</p>
      <p>Tu cuenta ha sido creada con éxito y ya puedes acceder al Área de Cliente para gestionar tus datos, verificar tu identidad y comenzar a operar en los mercados financieros con condiciones competitivas y tecnología de vanguardia.</p>
      <p><strong>¿Qué puedes hacer a continuación?</strong></p>
      <ul>
        <li>Acceder a tu Área de Cliente</li>
        <li>Completar el proceso de verificación (KYC) si aún no lo has hecho</li>
        <li>Depositar fondos mediante nuestras pasarelas seguras</li>
        <li>Descargar MetaTrader 5 y comenzar a operar</li>
      </ul>
      <div class="button-wrapper">
        <a href="https://alphaglobalmarket.io/dashboard" class="cta-button">Acceder al Área de Cliente</a>
      </div>
      <p>Si tienes cualquier duda, puedes ponerte en contacto con nuestro equipo de soporte en cualquier momento.</p>
    `;
    return this.getBaseTemplate(content, userData.name || 'Usuario');
  }

  getVerificationEmailTemplate(userData, verificationLink) {
    const content = `
      <h2>Verifica tu correo electrónico</h2>
      <p>Para completar tu registro en Alpha Global Market, necesitamos verificar tu dirección de correo electrónico.</p>
      <p>Por favor, haz clic en el siguiente enlace para verificar tu cuenta:</p>
      <div class="button-wrapper">
        <a href="${verificationLink}" class="cta-button">Verificar Correo Electrónico</a>
      </div>
      <div class="security-notice">
        <p><strong>Nota de Seguridad:</strong> Este enlace es único y personal. Por tu seguridad, no compartas este correo con terceros. El enlace expirará en 24 horas.</p>
      </div>
      <p style="color: #71717a; font-size: 13px;">Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>${verificationLink}</p>
    `;
    return this.getBaseTemplate(content, userData.name || 'Usuario');
  }

  getEmailVerifiedTemplate(userData) {
    const content = `
      <h2>Correo Electrónico Verificado</h2>
      <p>Tu dirección de correo electrónico ha sido verificada correctamente. Ya puedes continuar con el proceso de activación de tu cuenta en Alpha Global Market.</p>
      <p><strong>¿Qué puedes hacer a continuación?</strong></p>
      <ul>
        <li>Acceder a tu Área de Cliente</li>
        <li>Completar el proceso de verificación de identidad (KYC)</li>
        <li>Depositar fondos mediante nuestras pasarelas seguras</li>
        <li>Descargar MetaTrader 5 y comenzar a operar</li>
      </ul>
      <div class="button-wrapper">
        <a href="https://alphaglobalmarket.io/dashboard" class="cta-button">Acceder al Dashboard</a>
      </div>
    `;
    return this.getBaseTemplate(content, userData.name || 'Usuario');
  }

  getKYCApprovedTemplate(userData) {
    const content = `
      <h2>Tu Cuenta ha sido Activada</h2>
      <p>Te informamos que tu cuenta ha sido activada correctamente tras completar el proceso de KYC. Ya puedes acceder a todas las funcionalidades de Alpha Global Market y comenzar a operar en los mercados con total seguridad.</p>
      <p><strong>¿Qué puedes hacer a continuación?</strong></p>
      <ul>
        <li>Acceder a tu Área de Cliente</li>
        <li>Descargar MetaTrader 5 desde nuestra web</li>
        <li>Realizar tu primer depósito mediante nuestras pasarelas seguras</li>
        <li>Empezar a operar en los mercados globales</li>
      </ul>
      <div class="button-wrapper">
        <a href="https://alphaglobalmarket.io/dashboard" class="cta-button">Comenzar a Operar</a>
      </div>
      <p>Recuerda que estamos aquí para ayudarte en todo momento.</p>
    `;
    return this.getBaseTemplate(content, userData.name || 'Usuario');
  }

  getKYCRejectedTemplate(userData, reason) {
    const content = `
      <h2>Problema con la Verificación</h2>
      <p>Lamentamos informarte que no hemos podido aprobar tu proceso de verificación (KYC) con la documentación proporcionada.</p>
      <div class="security-notice">
        <p><strong>Motivo:</strong> ${reason || 'Documentación no válida o ilegible'}</p>
      </div>
      <p>Para poder activar tu cuenta y operar con nosotros, necesitamos que revises los siguientes aspectos:</p>
      <ul>
        <li>Asegúrate de que los documentos sean legibles y estén en vigor</li>
        <li>El documento de identidad debe mostrar claramente tu nombre completo, fecha de nacimiento y fotografía</li>
        <li>Si estás enviando un comprobante de domicilio, debe tener una antigüedad inferior a 3 meses</li>
      </ul>
      <div class="button-wrapper">
        <a href="https://alphaglobalmarket.io/dashboard" class="cta-button">Volver a Intentar</a>
      </div>
      <p>Nuestro equipo de soporte está a tu disposición para ayudarte en el proceso.</p>
    `;
    return this.getBaseTemplate(content, userData.name || 'Usuario');
  }

  getDepositConfirmationTemplate(userData, depositData) {
    const content = `
      <h2>Depósito Confirmado</h2>
      <p>Te confirmamos que hemos recibido exitosamente tu depósito en Alpha Global Market.</p>
      <div class="credentials-box">
        <div class="label">MONTO</div>
        <div class="value">${depositData.currency || 'USD'} ${depositData.amount}</div>
        <div class="label">CUENTA</div>
        <div class="value">${depositData.accountName || 'Cuenta Principal'}</div>
        <div class="label">MÉTODO</div>
        <div class="value">${depositData.method || 'Transferencia Bancaria'}</div>
        <div class="label">FECHA</div>
        <div class="value">${new Date().toLocaleString('es-ES')}</div>
      </div>
      <p>Los fondos ya están disponibles en tu cuenta y puedes comenzar a operar inmediatamente.</p>
      <div class="button-wrapper">
        <a href="https://alphaglobalmarket.io/dashboard" class="cta-button">Ver en Dashboard</a>
      </div>
    `;
    return this.getBaseTemplate(content, userData.name || 'Usuario');
  }

  getWithdrawalConfirmationTemplate(userData, withdrawalData) {
    const content = `
      <h2>Solicitud de Retiro Recibida</h2>
      <p>Hemos recibido tu solicitud de retiro y está siendo procesada por nuestro equipo.</p>
      <div class="credentials-box">
        <div class="label">MONTO SOLICITADO</div>
        <div class="value">${withdrawalData.currency || 'USD'} ${withdrawalData.amount}</div>
        <div class="label">CUENTA</div>
        <div class="value">${withdrawalData.accountName || 'Cuenta Principal'}</div>
        <div class="label">MÉTODO</div>
        <div class="value">${withdrawalData.method || 'Transferencia Bancaria'}</div>
        <div class="label">TIEMPO ESTIMADO</div>
        <div class="value">1-3 días hábiles</div>
      </div>
      <p>Te notificaremos cuando el retiro haya sido completado. Los fondos serán enviados al método de pago registrado en tu cuenta.</p>
      <div class="security-notice">
        <p><strong>Nota:</strong> Por razones de seguridad, los retiros solo pueden procesarse al mismo método utilizado para el depósito.</p>
      </div>
    `;
    return this.getBaseTemplate(content, userData.name || 'Usuario');
  }

  getAccountCredentialsTemplate(userData, accountData) {
    const content = `
      <h2>Credenciales de tu Cuenta MT5</h2>
      <p>Tu cuenta de trading en MetaTrader 5 ha sido creada exitosamente. A continuación encontrarás las credenciales para acceder:</p>
      <div class="credentials-box">
        <div class="label">NÚMERO DE CUENTA</div>
        <div class="value">${accountData.login}</div>
        <div class="label">CONTRASEÑA</div>
        <div class="value">${accountData.password}</div>
        <div class="label">SERVIDOR</div>
        <div class="value">${accountData.server || 'AlphaGlobalMarket-Demo'}</div>
        <div class="label">TIPO DE CUENTA</div>
        <div class="value">${accountData.accountType || 'Demo'}</div>
      </div>
      <div class="security-notice">
        <p><strong>Importante:</strong> Por tu seguridad, te recomendamos cambiar la contraseña en tu primer acceso. Nunca compartas estas credenciales con terceros.</p>
      </div>
      <p><strong>Para comenzar a operar:</strong></p>
      <ul>
        <li>Descarga MetaTrader 5 desde nuestra web</li>
        <li>Ingresa las credenciales proporcionadas</li>
        <li>Selecciona el servidor indicado</li>
        <li>Comienza tu experiencia de trading</li>
      </ul>
      <div class="button-wrapper">
        <a href="https://alphaglobalmarket.io/download/mt5" class="cta-button">Descargar MT5</a>
      </div>
    `;
    return this.getBaseTemplate(content, userData.name || 'Usuario');
  }

  getPasswordResetTemplate(userData, resetLink) {
    const content = `
      <h2>Restablecimiento de Contraseña</h2>
      <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Alpha Global Market.</p>
      <p>Si has sido tú quien ha solicitado el cambio, por favor haz clic en el siguiente enlace para crear una nueva contraseña:</p>
      <div class="button-wrapper">
        <a href="${resetLink}" class="cta-button">Restablecer Contraseña</a>
      </div>
      <div class="security-notice">
        <p><strong>Nota de Seguridad:</strong> Este enlace es válido por 24 horas y solo puede usarse una vez. Si no has solicitado este cambio, ignora este mensaje.</p>
      </div>
      <p style="color: #71717a; font-size: 13px;">Si el botón no funciona, copia y pega este enlace en tu navegador:<br>${resetLink}</p>
    `;
    return this.getBaseTemplate(content, userData.name || 'Usuario');
  }

  getMarginCallTemplate(userData, accountData) {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Margin Call Alert - Alpha Global Market</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #e4e4e7; background-color: #0a0a0a; }
        .email-wrapper { width: 100%; background-color: #0a0a0a; padding: 40px 20px; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; overflow: hidden; }
        .banner-section { width: 100%; display: block; background-color: #000000; }
        .banner-image { width: 100%; height: auto; display: block; }
        .content-section { padding: 50px 40px; background-color: #18181b; border-top: 3px solid #dc2626; }
        .logo-text { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #71717a; margin-bottom: 30px; text-align: center; }
        .alert-icon { font-size: 64px; text-align: center; margin: 20px 0; }
        .alert-badge { display: inline-block; margin: 0 auto 30px; padding: 12px 24px; background-color: #dc2626; color: #ffffff; font-size: 14px; font-weight: 600; border-radius: 50px; text-transform: uppercase; letter-spacing: 1px; }
        h2 { color: #fafafa; font-size: 24px; font-weight: 300; margin-bottom: 25px; letter-spacing: -0.5px; text-align: center; }
        p { color: #d4d4d8; font-size: 15px; line-height: 1.7; margin-bottom: 20px; }
        .highlight { color: #fafafa; font-weight: 500; }
        .account-details { background-color: #1f1f23; border: 1px solid #27272a; padding: 25px; margin: 30px 0; border-radius: 4px; }
        .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #27272a; color: #d4d4d8; font-size: 14px; }
        .detail-row:last-child { border-bottom: none; margin-top: 10px; padding-top: 20px; border-top: 2px solid #dc2626; }
        .detail-label { color: #a1a1aa; }
        .detail-value { color: #fafafa; font-weight: 500; text-align: right; }
        .detail-value-critical { font-size: 24px; color: #dc2626; font-weight: 600; }
        .warning-box { background-color: #422006; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; }
        .warning-box p { color: #fbbf24; font-size: 14px; margin-bottom: 10px; }
        .warning-box strong { color: #fcd34d; }
        .warning-box ul { color: #fcd34d; margin: 10px 0 0 20px; }
        .action-list { background-color: #1f1f23; border: 1px solid #27272a; padding: 25px; margin: 30px 0; border-radius: 4px; }
        .action-list h3 { color: #fafafa; font-size: 16px; font-weight: 500; margin-bottom: 15px; }
        .action-list ol { color: #d4d4d8; margin-left: 20px; line-height: 1.8; }
        .action-list ol li { margin-bottom: 8px; }
        .action-list strong { color: #fafafa; }
        .button-wrapper { margin: 40px 0; text-align: center; }
        .cta-button { display: inline-block; padding: 14px 40px; background-color: #22c55e; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase; border: 1px solid #22c55e; border-radius: 4px; }
        .cta-button:hover { background-color: #16a34a; border-color: #16a34a; }
        .secondary-button { display: inline-block; padding: 14px 40px; background-color: transparent; color: #3b82f6 !important; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase; border: 1px solid #3b82f6; border-radius: 4px; margin-left: 10px; }
        .divider { width: 100%; height: 1px; background-color: #27272a; margin: 35px 0; }
        .footer-section { background-color: #0f0f11; padding: 35px 40px; border-top: 1px solid #27272a; }
        .footer-text { color: #71717a; font-size: 12px; margin-bottom: 15px; line-height: 1.6; }
        .footer-link { color: #3b82f6; text-decoration: none; font-size: 12px; }
        .footer-link:hover { text-decoration: underline; }
        .company-info { margin-top: 30px; padding-top: 20px; border-top: 1px solid #27272a; }
        .company-name { color: #fafafa; font-size: 14px; font-weight: 500; margin-bottom: 5px; }
        .company-details { color: #52525b; font-size: 11px; line-height: 1.5; }
        @media only screen and (max-width: 600px) {
            .content-section { padding: 35px 25px; }
            .footer-section { padding: 30px 25px; }
            h2 { font-size: 22px; }
            p { font-size: 14px; }
            .cta-button { padding: 12px 35px; font-size: 13px; }
            .secondary-button { padding: 12px 35px; font-size: 13px; margin-left: 0; margin-top: 10px; display: block; }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-container">
            <!-- Banner Section -->
            <div class="banner-section">
                <img src="https://ukngiipxprielwdfuvln.supabase.co/storage/v1/object/public/emails/Banner%20Mail%20-%20AGM%20(2).png"
                     alt="Alpha Global Markets"
                     class="banner-image">
            </div>

            <!-- Content Section -->
            <div class="content-section">
                <div class="logo-text">ALPHA GLOBAL MARKET</div>

                <div class="alert-icon">⚠️</div>

                <div style="text-align: center;">
                    <div class="alert-badge">MARGIN CALL</div>
                </div>

                <h2>¡Tu cuenta está en riesgo de cierre automático!</h2>

                <p>Estimado/a <span class="highlight">${userData.name || 'Usuario'}</span>,</p>

                <div class="warning-box">
                    <p><strong>⚠️ ALERTA CRÍTICA</strong></p>
                    <p>Tu cuenta MT5 ha alcanzado el nivel de Margin Call. Esto significa que:</p>
                    <ul>
                        <li>No puedes abrir nuevas posiciones</li>
                        <li>Si el Margin Level cae a 50% (Stop Out), tus posiciones se cerrarán automáticamente</li>
                        <li>Podrías perder más de lo que esperas</li>
                    </ul>
                </div>

                <div class="account-details">
                    <div class="detail-row">
                        <span class="detail-label">Cuenta MT5:</span>
                        <span class="detail-value">#${accountData.login || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Balance:</span>
                        <span class="detail-value">$${(accountData.balance || 0).toFixed(2)} USD</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Equity:</span>
                        <span class="detail-value" style="color: #dc2626;">$${(accountData.equity || 0).toFixed(2)} USD</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Margen Usado:</span>
                        <span class="detail-value">$${(accountData.margin || 0).toFixed(2)} USD</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Margen Libre:</span>
                        <span class="detail-value">$${(accountData.freeMargin || 0).toFixed(2)} USD</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Margin Level:</span>
                        <span class="detail-value-critical">${(accountData.marginLevel || 0).toFixed(2)}%</span>
                    </div>
                </div>

                <div class="action-list">
                    <h3>🎯 Acciones Recomendadas (URGENTE):</h3>
                    <ol>
                        <li><strong>Deposita fondos ahora</strong> para aumentar tu margin level y evitar cierres automáticos</li>
                        <li><strong>Cierra posiciones perdedoras</strong> para liberar margen y reducir el riesgo</li>
                        <li><strong>Reduce el tamaño de tus posiciones</strong> actuales para disminuir el margen usado</li>
                        <li><strong>Contacta a tu Account Manager</strong> si necesitas asesoría urgente</li>
                    </ol>
                </div>

                <div class="button-wrapper">
                    <a href="https://alphaglobalmarket.io/wallet" class="cta-button">Depositar Ahora</a>
                    <a href="https://alphaglobalmarket.io/trading-accounts" class="secondary-button">Ver Mis Cuentas</a>
                </div>

                <div class="divider"></div>

                <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">
                    <strong>¿Qué es un Stop Out?</strong><br>
                    Si tu Margin Level cae por debajo del 50%, nuestro sistema cerrará automáticamente tus posiciones empezando por las más perdedoras para proteger tu capital restante.
                </p>

                <p style="color: #71717a; font-size: 13px;">
                    <strong>Nota de Riesgo:</strong> El trading de CFDs conlleva un alto riesgo de pérdida. Asegúrate de entender completamente los riesgos antes de operar. Solo opera con capital que puedas permitirte perder.
                </p>
            </div>

            <!-- Footer Section -->
            <div class="footer-section">
                <p class="footer-text">
                    Si tienes alguna pregunta o necesitas asistencia urgente, contacta a nuestro equipo de soporte 24/7:
                </p>
                <a href="mailto:support@alphaglobalmarket.io" class="footer-link">support@alphaglobalmarket.io</a><br>
                <a href="https://t.me/agm_soporte" class="footer-link">https://t.me/agm_soporte</a>

                <div class="company-info">
                    <p class="company-name">ALPHA GLOBAL MARKET LTD.</p>
                    <p class="company-details">
                        No. 2025-00193<br>
                        Ground Floor, The Sotheby building, Rodney Village,<br>
                        Rodney Bay, Gros-islet, Saint Lucia
                    </p>
                </div>

                <p class="footer-text" style="margin-top: 20px; font-size: 10px;">
                    © 2025 Alpha Global Market Ltd. Todos los derechos reservados.<br><br>
                    Este es un email automático de alerta. Tu cuenta requiere atención inmediata para evitar pérdidas adicionales.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
  }

  getStopOutTemplate(userData, accountData, closedPositions = []) {
    const positionsHTML = closedPositions.length > 0
      ? closedPositions.map(pos => `
          <div class="detail-row">
            <span class="detail-label">${pos.symbol || 'N/A'} ${pos.type || ''}</span>
            <span class="detail-value" style="color: #dc2626;">$${(pos.profit || 0).toFixed(2)}</span>
          </div>
        `).join('')
      : '<div class="detail-row"><span class="detail-label">No hay información de posiciones</span></div>';

    const totalLoss = closedPositions.reduce((sum, pos) => sum + (pos.profit || 0), 0);

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stop Out Notification - Alpha Global Market</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #e4e4e7; background-color: #0a0a0a; }
        .email-wrapper { width: 100%; background-color: #0a0a0a; padding: 40px 20px; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; overflow: hidden; }
        .banner-section { width: 100%; display: block; background-color: #000000; }
        .banner-image { width: 100%; height: auto; display: block; }
        .content-section { padding: 50px 40px; background-color: #18181b; border-top: 3px solid #dc2626; }
        .logo-text { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #71717a; margin-bottom: 30px; text-align: center; }
        .alert-icon { font-size: 64px; text-align: center; margin: 20px 0; }
        .alert-badge { display: inline-block; margin: 0 auto 30px; padding: 12px 24px; background-color: #dc2626; color: #ffffff; font-size: 14px; font-weight: 600; border-radius: 50px; text-transform: uppercase; letter-spacing: 1px; }
        h2 { color: #fafafa; font-size: 24px; font-weight: 300; margin-bottom: 25px; letter-spacing: -0.5px; text-align: center; }
        p { color: #d4d4d8; font-size: 15px; line-height: 1.7; margin-bottom: 20px; }
        .highlight { color: #fafafa; font-weight: 500; }
        .account-details { background-color: #1f1f23; border: 1px solid #27272a; padding: 25px; margin: 30px 0; border-radius: 4px; }
        .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #27272a; color: #d4d4d8; font-size: 14px; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { color: #a1a1aa; }
        .detail-value { color: #fafafa; font-weight: 500; text-align: right; }
        .loss-summary { background-color: #27272a; border: 2px solid #dc2626; padding: 20px; margin: 30px 0; border-radius: 4px; text-align: center; }
        .loss-amount { font-size: 36px; color: #dc2626; font-weight: 700; margin: 10px 0; }
        .info-box { background-color: #422006; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; }
        .info-box p { color: #fbbf24; font-size: 14px; margin-bottom: 8px; }
        .info-box strong { color: #fcd34d; }
        .info-box ul { color: #fcd34d; margin: 10px 0 0 20px; }
        .button-wrapper { margin: 40px 0; text-align: center; }
        .cta-button { display: inline-block; padding: 14px 40px; background-color: #3b82f6; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase; border: 1px solid #3b82f6; border-radius: 4px; }
        .cta-button:hover { background-color: #2563eb; border-color: #2563eb; }
        .divider { width: 100%; height: 1px; background-color: #27272a; margin: 35px 0; }
        .footer-section { background-color: #0f0f11; padding: 35px 40px; border-top: 1px solid #27272a; }
        .footer-text { color: #71717a; font-size: 12px; margin-bottom: 15px; line-height: 1.6; }
        .footer-link { color: #3b82f6; text-decoration: none; font-size: 12px; }
        .footer-link:hover { text-decoration: underline; }
        .company-info { margin-top: 30px; padding-top: 20px; border-top: 1px solid #27272a; }
        .company-name { color: #fafafa; font-size: 14px; font-weight: 500; margin-bottom: 5px; }
        .company-details { color: #52525b; font-size: 11px; line-height: 1.5; }
        @media only screen and (max-width: 600px) {
            .content-section { padding: 35px 25px; }
            .footer-section { padding: 30px 25px; }
            h2 { font-size: 22px; }
            p { font-size: 14px; }
            .loss-amount { font-size: 28px; }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-container">
            <!-- Banner Section -->
            <div class="banner-section">
                <img src="https://ukngiipxprielwdfuvln.supabase.co/storage/v1/object/public/emails/Banner%20Mail%20-%20AGM%20(2).png"
                     alt="Alpha Global Markets"
                     class="banner-image">
            </div>

            <!-- Content Section -->
            <div class="content-section">
                <div class="logo-text">ALPHA GLOBAL MARKET</div>

                <div class="alert-icon">🔴</div>

                <div style="text-align: center;">
                    <div class="alert-badge">STOP OUT EJECUTADO</div>
                </div>

                <h2>Tus posiciones han sido cerradas automáticamente</h2>

                <p>Estimado/a <span class="highlight">${userData.name || 'Usuario'}</span>,</p>

                <p>
                    Te informamos que tu cuenta MT5 <strong>#${accountData.login || 'N/A'}</strong> ha alcanzado el nivel de Stop Out (Margin Level por debajo del 50%).
                </p>

                <p>
                    Como medida de protección automática, nuestro sistema ha cerrado algunas o todas tus posiciones abiertas para evitar mayores pérdidas.
                </p>

                <div class="loss-summary">
                    <p style="color: #a1a1aa; font-size: 14px; margin: 0;">Pérdida Total</p>
                    <div class="loss-amount">$${totalLoss.toFixed(2)} USD</div>
                    <p style="color: #a1a1aa; font-size: 13px; margin: 0;">Balance restante: $${(accountData.balance || 0).toFixed(2)} USD</p>
                </div>

                <div class="account-details">
                    <h3 style="color: #fafafa; font-size: 16px; margin-bottom: 15px;">Posiciones Cerradas:</h3>
                    ${positionsHTML}
                </div>

                <div class="info-box">
                    <p><strong>📚 ¿Cómo evitar un Stop Out en el futuro?</strong></p>
                    <ul>
                        <li>Mantén un balance adecuado en tu cuenta</li>
                        <li>Usa stop loss en todas tus posiciones</li>
                        <li>No uses todo tu margen disponible</li>
                        <li>Monitorea tu Margin Level regularmente</li>
                        <li>Considera depositar más fondos antes de alcanzar el Margin Call</li>
                    </ul>
                </div>

                <div class="button-wrapper">
                    <a href="https://alphaglobalmarket.io/trading-accounts" class="cta-button">Ver Estado de Mi Cuenta</a>
                </div>

                <div class="divider"></div>

                <p style="color: #71717a; font-size: 13px;">
                    Si necesitas asesoría sobre gestión de riesgo o cómo evitar situaciones similares, nuestro equipo de Account Managers está disponible para ayudarte 24/7.
                </p>

                <p style="color: #71717a; font-size: 13px;">
                    <strong>Nota de Riesgo:</strong> El trading de CFDs conlleva un alto riesgo de pérdida. Recuerda usar siempre una gestión de riesgo apropiada y solo opera con capital que puedas permitirte perder.
                </p>
            </div>

            <!-- Footer Section -->
            <div class="footer-section">
                <p class="footer-text">
                    ¿Necesitas ayuda o asesoría? Contáctanos:
                </p>
                <a href="mailto:support@alphaglobalmarket.io" class="footer-link">support@alphaglobalmarket.io</a><br>
                <a href="https://t.me/agm_soporte" class="footer-link">https://t.me/agm_soporte</a>

                <div class="company-info">
                    <p class="company-name">ALPHA GLOBAL MARKET LTD.</p>
                    <p class="company-details">
                        No. 2025-00193<br>
                        Ground Floor, The Sotheby building, Rodney Village,<br>
                        Rodney Bay, Gros-islet, Saint Lucia
                    </p>
                </div>

                <p class="footer-text" style="margin-top: 20px; font-size: 10px;">
                    © 2025 Alpha Global Market Ltd. Todos los derechos reservados.<br><br>
                    Este es un email automático de notificación. Esta acción se ejecutó automáticamente para proteger tu capital restante.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
  }
}

// Export singleton instance
const emailService = new EmailService();
export default emailService;