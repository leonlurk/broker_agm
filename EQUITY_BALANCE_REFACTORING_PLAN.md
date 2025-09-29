# EQUITY VS BALANCE REFACTORING PLAN

## CRITICAL ISSUE IDENTIFIED
Backend correctly uses equity, but frontend has semantic confusion causing KPI/graph inaccuracies.

## ROOT CAUSE
1. Backend stores equity in "balance" column (confusing naming)
2. Frontend has defensive fallback patterns: `equity ?? balance ?? value`
3. Multiple data calculation paths create inconsistencies

## REFACTORING STRATEGY

### ✅ PHASE 1: DATABASE CONFIRMED
SQL Results: balance_equals_equity: 108, balance_differs_equity: 0
**CONFIRMED:** Backend stores identical equity data in both balance and equity columns.

### PHASE 2: FRONTEND STANDARDIZATION (CRITICAL - SIMPLIFIED)
Since balance=equity in database, the fix is to eliminate unnecessary fallback patterns.

#### 3.1 Create Single Source of Truth Service
```javascript
// src/services/equityDataService.js
export const getAccountEquity = (accountData) => {
  // ALWAYS prioritize equity field, fallback to balance only if equity is null
  return accountData.equity ?? accountData.balance ?? 0;
};

export const getAccountBalance = (accountData) => {
  // For true balance (deposits/withdrawals), use balance field
  // If balance contains equity (as per backend), use initial_balance or separate logic
  return accountData.balance ?? 0;
};
```

#### 3.2 Update TradingAccounts.jsx
- Replace all `equity ?? balance ?? value` patterns with standardized functions
- Use equity consistently for real-time P&L calculations
- Use balance only for deposit/withdrawal tracking

#### 3.3 Standardize Chart Data Processing
- All balance charts should use equity for real-time values
- All drawdown calculations should use equity as basis
- Remove fallback logic that causes inconsistencies

#### 3.4 Update KPI Calculations
- Ensure all profit/loss calculations use equity
- Standardize margin level calculations
- Remove duplicate calculation paths

### PHASE 4: TESTING & VALIDATION
1. Compare KPIs before/after refactoring
2. Verify graphs show consistent data
3. Test with accounts that have open positions
4. Validate real-time P&L updates

## FILES TO MODIFY

### High Priority:
- `src/components/TradingAccounts.jsx` (lines 695-696, 741-743, 3092-3109)
- `src/services/supabaseMetrics.js` (lines 74-86)
- `src/services/accountMetricsOptimized.js` (lines 255-267)

### Medium Priority:
- Chart rendering functions in TradingAccounts.jsx
- Balance history processing logic
- KPI display components

## EXPECTED OUTCOMES
1. ✅ Consistent KPI values across all calculation methods
2. ✅ Accurate real-time P&L tracking using equity
3. ✅ Correct graph rendering without fallback confusion
4. ✅ Eliminated semantic confusion in codebase
5. ✅ Improved maintainability and debugging

## RISK MITIGATION
- Test thoroughly with demo accounts first
- Keep backup of current calculation logic
- Implement gradual rollout with feature flags
- Monitor for any calculation discrepancies
