import React, { useState } from 'react';
import { ChevronDown, Copy, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { createTradingAccount } from '../services/tradingAccounts';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { useAccounts } from '../contexts/AccountsContext';
import emailServiceProxy from '../services/emailServiceProxy';
import { useTranslation } from 'react-i18next';
import { resendVerificationEmail } from '../supabase/auth';
import toast from 'react-hot-toast';

export default function TradingChallengeUI() {
  const { t } = useTranslation('trading');
  const { currentUser, userData } = useAuth();
  const { notifyAccountCreated } = useNotifications();
  const { loadAccounts } = useAccounts();
  const [accountType, setAccountType] = useState('Real');
  const [accountName, setAccountName] = useState('');
  const [accountTypeSelection, setAccountTypeSelection] = useState('Institucional');
  const [leverage, setLeverage] = useState('');
  const [showLeverageDropdown, setShowLeverageDropdown] = useState(false);
  const [initialBalance, setInitialBalance] = useState('');  // Campo para balance inicial
  
  // Check if user is verified (both email and KYC)
  const isUserVerified = currentUser?.email_verified !== false;
  const isKYCApproved = userData?.kyc_status === 'approved';
  
  // Loading and feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mt5Credentials, setMt5Credentials] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showInvestorPassword, setShowInvestorPassword] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const leverageOptions = ['1:30', '1:50', '1:100', '1:200'];

  const handleCopy = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleLeverageSelect = (option) => {
    setLeverage(option);
    setShowLeverageDropdown(false);
  };

  const handleCreateAccount = async () => {
    // Clear previous messages
    setError('');
    setSuccess('');
    
    // Validation
    if (!accountName.trim()) {
      setError(t('accounts.creation.validation.accountNameRequired'));
      return;
    }
    
    if (!leverage) {
      setError(t('accounts.creation.validation.leverageRequired'));
      return;
    }
    
    if (!currentUser) {
      setError(t('accounts.creation.validation.authRequired'));
      return;
    }

    setIsLoading(true);

    try {
      const accountData = {
        accountName: accountName.trim(),
        accountType,
        accountTypeSelection,
        leverage,
        ...(accountType === 'DEMO' && initialBalance && { initialBalance: parseFloat(initialBalance) })
      };

      const result = await createTradingAccount(currentUser.id, accountData);

      if (result.success) {
        setSuccess(t('accounts.creation.success', { accountNumber: result.accountNumber }));
        
        // Store MT5 credentials if available
        if (result.mt5Credentials) {
          setMt5Credentials(result.mt5Credentials);
          
          // Send MT5 credentials email using the new endpoint
          try {
            await emailServiceProxy.sendMT5AccountCreatedEmail(
              { 
                email: currentUser.email, 
                name: currentUser.displayName || currentUser.username || 'Usuario' 
              },
              {
                accountType: accountType,
                accountName: accountName.trim(),
                accountNumber: result.mt5Credentials.login?.toString() || result.accountNumber,
                leverage: leverage,
                balance: accountType === 'DEMO' ? (initialBalance ? parseFloat(initialBalance) : 10000) : 0,
                currency: 'USD',
                server: result.mt5Credentials.server || 'AGM-Server',
                groupType: accountTypeSelection
              },
              {
                login: result.mt5Credentials.login?.toString() || result.accountNumber,
                password: result.mt5Credentials.password,
                investorPassword: result.mt5Credentials.investor_password || result.mt5Credentials.investorPassword
              }
            );
            console.log('[TradingChallenge] MT5 account creation email sent successfully');
          } catch (emailError) {
            console.error('[TradingChallenge] Error sending MT5 account creation email:', emailError);
          }
        }
        
        // Crear notificación
        notifyAccountCreated(accountName.trim(), `${accountType} - ${accountTypeSelection}`);
        
        // Reload accounts to show the new one immediately
        await loadAccounts();
        
        // Reset form
        setAccountName('');
        setLeverage('');
        setInitialBalance('');
        setAccountType('Real');
        setAccountTypeSelection('Institucional');
    } else {
        setError(result.error || t('accounts.creation.validation.createError'));
      }
    } catch (error) {
      console.error('Error creating account:', error);
      setError(t('accounts.creation.validation.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#232323] text-white bg-gradient-to-br from-[#232323] to-[#2d2d2d]">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-center">
          {/* Show verification required message for unverified users */}
          {!isUserVerified ? (
            <div className="w-full max-w-2xl p-8 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-2xl border border-yellow-500/50">
              <div className="flex flex-col items-center text-center">
                <AlertCircle className="text-yellow-500 mb-4" size={48} />
                <h2 className="text-2xl font-semibold text-white mb-3">
                  {t('accounts.creation.verificationRequired')}
                </h2>
                <p className="text-gray-400 mb-6 max-w-md">
                  {t('accounts.creation.verificationMessage')}
                </p>
                <button
                  onClick={async () => {
                    const result = await resendVerificationEmail(currentUser.email);
                    if (result.success) {
                      toast.success(t('accounts.creation.verificationEmailSent'));
                    } else {
                      // Show specific error message including rate limiting
                      toast.error(result.error || t('accounts.creation.verificationEmailError'));
                    }
                  }}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  {t('accounts.creation.verifyAccount')}
                </button>
              </div>
            </div>
          ) : (
          /* Main Content - Only show for verified users */
          <div className="w-full max-w-2xl p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-2xl border border-[#333]">
            <div className="mb-6 md:mb-10">
              {/* Title */}
              <div className="mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl font-medium">{t('accounts.creation.title')}</h2>
              </div>
              
              {/* Success/Error Messages */}
              {success && (
                <div className="mb-6 p-4 bg-green-900/20 border border-green-500 rounded-lg">
                  <p className="text-green-400 text-sm md:text-base mb-3">{success}</p>
                  
                  {/* MT5 Credentials Display */}
                  {mt5Credentials && (
                    <div className="mt-4 p-3 bg-black/30 rounded-lg">
                      <p className="text-cyan-400 font-semibold mb-2">{t('accounts.creation.mt5Credentials')}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">{t('accounts.creation.loginLabel')}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-mono">{mt5Credentials.login}</span>
                            <button
                              onClick={() => handleCopy(mt5Credentials.login, 'login')}
                              className="p-1 hover:bg-gray-700 rounded transition-colors"
                              title="Copiar"
                            >
                              {copiedField === 'login' ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">{t('accounts.creation.passwordLabel')}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-mono">
                              {showPassword ? mt5Credentials.password : '••••••••'}
                            </span>
                            <button
                              onClick={() => setShowPassword(!showPassword)}
                              className="p-1 hover:bg-gray-700 rounded transition-colors"
                              title={showPassword ? 'Ocultar' : 'Mostrar'}
                            >
                              {showPassword ? (
                                <EyeOff className="w-4 h-4 text-gray-400 hover:text-white" />
                              ) : (
                                <Eye className="w-4 h-4 text-gray-400 hover:text-white" />
                              )}
                            </button>
                            <button
                              onClick={() => handleCopy(mt5Credentials.password, 'password')}
                              className="p-1 hover:bg-gray-700 rounded transition-colors"
                              title="Copiar"
                            >
                              {copiedField === 'password' ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">{t('accounts.creation.investorPasswordLabel')}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-mono">
                              {showInvestorPassword ? mt5Credentials.investor_password : '••••••••'}
                            </span>
                            <button
                              onClick={() => setShowInvestorPassword(!showInvestorPassword)}
                              className="p-1 hover:bg-gray-700 rounded transition-colors"
                              title={showInvestorPassword ? 'Ocultar' : 'Mostrar'}
                            >
                              {showInvestorPassword ? (
                                <EyeOff className="w-4 h-4 text-gray-400 hover:text-white" />
                              ) : (
                                <Eye className="w-4 h-4 text-gray-400 hover:text-white" />
                              )}
                            </button>
                            <button
                              onClick={() => handleCopy(mt5Credentials.investor_password, 'investorPassword')}
                              className="p-1 hover:bg-gray-700 rounded transition-colors"
                              title="Copiar"
                            >
                              {copiedField === 'investorPassword' ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">{t('accounts.creation.serverLabel')}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white">{mt5Credentials.server || 'AlphaGlobalMarket-Server'}</span>
                            <button
                              onClick={() => handleCopy(mt5Credentials.server || 'AlphaGlobalMarket-Server', 'server')}
                              className="p-1 hover:bg-gray-700 rounded transition-colors"
                              title="Copiar"
                            >
                              {copiedField === 'server' ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      <p className="text-yellow-400 text-xs mt-3">
                        {t('accounts.creation.credentialsWarning')}
                      </p>
                    </div>
                  )}
              </div>
              )}
              
              {error && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg">
                  <p className="text-red-400 text-sm md:text-base">{error}</p>
              </div>
              )}
              
              {/* Account Type Toggle (DEMO/Real) */}
              <div className="mb-6 md:mb-8">
                <div className="flex space-x-2 mb-4">
                <button 
                    className={`px-6 md:px-8 py-2 md:py-3 rounded-full text-sm md:text-base font-regular border focus:outline-none transition-colors ${
                      accountType === 'DEMO' 
                        ? 'border-cyan-500 bg-transparent text-white' 
                        : 'border-gray-700 bg-gradient-to-br from-[#232323] to-[#2d2d2d] text-gray-400'
                    }`}
                    onClick={() => setAccountType('DEMO')}
                    disabled={isLoading}
                  >
                    DEMO
                </button>
                <button 
                    className={`px-6 md:px-8 py-2 md:py-3 rounded-full text-sm md:text-base font-regular border focus:outline-none transition-colors ${
                      accountType === 'Real' 
                        ? 'border-cyan-500 bg-transparent text-white' 
                        : 'border-gray-700 bg-gradient-to-br from-[#232323] to-[#2d2d2d] text-gray-400'
                    }`}
                    onClick={() => setAccountType('Real')}
                    disabled={isLoading}
                  >
                    Real
                </button>
                </div>
              </div>
              
              {/* Account Name Input */}
              <div className="mb-6 md:mb-8">
                <h3 className="text-lg md:text-xl font-medium mb-3 md:mb-4">{t('accounts.fields.accountNameLabel')}</h3>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder={t('accounts.fields.namePlaceholder')}
                  disabled={isLoading}
                  className="w-full bg-transparent border border-gray-700 rounded-lg px-4 py-3 text-base md:text-lg focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50"
                />
              </div>
              
              {/* Account Type Selection */}
              <div className="mb-6 md:mb-8">
                <h3 className="text-lg md:text-xl font-medium mb-3 md:mb-4">{t('accounts.fields.accountTypeLabel')}</h3>
                <div className="flex space-x-3 md:space-x-4">
                  <button 
                    className={`px-6 md:px-8 py-2 md:py-3 rounded-full text-sm md:text-base font-regular border focus:outline-none transition-colors ${
                      accountTypeSelection === 'Institucional' 
                        ? 'border-cyan-500 bg-transparent text-white' 
                        : 'border-gray-700 bg-gradient-to-br from-[#232323] to-[#2d2d2d] text-gray-400'
                    }`}
                    onClick={() => setAccountTypeSelection('Institucional')}
                    disabled={isLoading}
                  >
                    {t('accounts.fields.institutional')}
                  </button>
                  <button 
                    className={`px-6 md:px-8 py-2 md:py-3 rounded-full text-sm md:text-base font-regular border focus:outline-none transition-colors ${
                      accountTypeSelection === 'Market Direct' 
                        ? 'border-cyan-500 bg-transparent text-white' 
                        : 'border-gray-700 bg-gradient-to-br from-[#232323] to-[#2d2d2d] text-gray-400'
                    }`}
                    onClick={() => setAccountTypeSelection('Market Direct')}
                    disabled={isLoading}
                  >
                    {t('accounts.fields.marketDirect')}
                  </button>
                </div>
                  </div>
                  
              {/* Initial Balance Input - Solo para cuentas DEMO */}
              {accountType === 'DEMO' && (
                <div className="mb-6 md:mb-8">
                  <h3 className="text-lg md:text-xl font-medium mb-3 md:mb-4">{t('accounts.fields.initialBalance')}</h3>
                  <input
                    type="number"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    placeholder="10000"
                    min="0"
                    step="100"
                    disabled={isLoading}
                    className="w-full bg-transparent border border-gray-700 rounded-lg px-4 py-3 text-base md:text-lg focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50"
                  />
                  <p className="text-gray-400 text-sm mt-2">
                    {t('accounts.creation.initialBalanceDescription')}
                  </p>
                </div>
              )}
              
              {/* Leverage Selection */}
              <div className="mb-8 md:mb-10">
                <h3 className="text-lg md:text-xl font-medium mb-3 md:mb-4">{t('accounts.fields.leverageLabel')}</h3>
                <div className="relative">
                  <button
                    onClick={() => !isLoading && setShowLeverageDropdown(!showLeverageDropdown)}
                    disabled={isLoading}
                    className="w-full md:w-auto min-w-[200px] flex items-center justify-between border border-gray-700 rounded-lg px-4 py-3 text-base md:text-lg focus:outline-none focus:border-cyan-500 transition-colors bg-gradient-to-br from-[#232323] to-[#2d2d2d] disabled:opacity-50"
                  >
                    <span className={leverage ? 'text-white' : 'text-gray-400'}>
                      {leverage || t('accounts.fields.leverageSelect')}
                    </span>
                    <ChevronDown size={20} className="text-gray-400" />
                  </button>
                  
                  {showLeverageDropdown && !isLoading && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-gray-700 rounded-lg shadow-lg z-10">
                      {leverageOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleLeverageSelect(option)}
                          className="w-full px-4 py-3 text-left text-base md:text-lg hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Create Account Button */}
              <div className="mt-8">
                <button 
                  onClick={handleCreateAccount}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-3 md:py-4 px-6 rounded-lg text-base md:text-lg font-medium transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      {t('accounts.creation.creating')}
                </div>
                  ) : (
                    t('accounts.creation.createButton')
                  )}
                </button>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}