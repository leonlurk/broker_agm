/**
 * Standardized service for equity/balance data access
 * Eliminates fallback pattern confusion since SQL confirms balance=equity in database
 */

/**
 * Gets the current equity value for an account
 * Since balance=equity in database, we can use either field consistently
 */
export const getAccountEquity = (accountData) => {
  if (!accountData) return 0;
  // Use equity field primarily, balance as fallback (both contain same data)
  return parseFloat(accountData.equity ?? accountData.balance ?? 0);
};

/**
 * Gets the balance value for an account
 * In our system, balance contains equity data, so this is identical to getAccountEquity
 */
export const getAccountBalance = (accountData) => {
  if (!accountData) return 0;
  return parseFloat(accountData.balance ?? accountData.equity ?? 0);
};

/**
 * Gets margin value for an account
 */
export const getAccountMargin = (accountData) => {
  if (!accountData) return 0;
  return parseFloat(accountData.margin ?? 0);
};

/**
 * Gets free margin value for an account
 */
export const getAccountFreeMargin = (accountData) => {
  if (!accountData) return 0;
  return parseFloat(accountData.free_margin ?? accountData.margin_free ?? 0);
};

/**
 * Calculates margin level percentage
 */
export const getMarginLevel = (accountData) => {
  if (!accountData) return 0;
  const equity = getAccountEquity(accountData);
  const margin = getAccountMargin(accountData);
  return margin > 0 ? (equity / margin) * 100 : 0;
};

/**
 * Gets profit/loss value
 * This should be calculated as current_equity - initial_balance
 */
export const getProfitLoss = (accountData, initialBalance = null) => {
  if (!accountData) return 0;
  const currentEquity = getAccountEquity(accountData);
  const initial = initialBalance ?? parseFloat(accountData.initial_balance ?? currentEquity);
  return currentEquity - initial;
};

/**
 * Gets profit/loss percentage
 */
export const getProfitLossPercentage = (accountData, initialBalance = null) => {
  if (!accountData) return 0;
  const profitLoss = getProfitLoss(accountData, initialBalance);
  const initial = initialBalance ?? parseFloat(accountData.initial_balance ?? getAccountEquity(accountData));
  return initial > 0 ? (profitLoss / initial) * 100 : 0;
};

/**
 * Standardized chart data value extraction
 * For balance history charts, always use equity as the primary value
 */
export const getChartValue = (dataPoint) => {
  if (!dataPoint) return 0;
  // Since balance=equity in database, prioritize equity field for clarity
  return parseFloat(dataPoint.equity ?? dataPoint.balance ?? dataPoint.value ?? 0);
};

/**
 * Validates if account data contains required fields
 */
export const validateAccountData = (accountData) => {
  if (!accountData) return false;
  return (accountData.equity !== undefined && accountData.equity !== null) ||
         (accountData.balance !== undefined && accountData.balance !== null);
};

export default {
  getAccountEquity,
  getAccountBalance,
  getAccountMargin,
  getAccountFreeMargin,
  getMarginLevel,
  getProfitLoss,
  getProfitLossPercentage,
  getChartValue,
  validateAccountData
};
