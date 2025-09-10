import { describe, it, expect } from 'vitest';

// Replica mínima de la lógica aplicada en TradingAccounts.jsx para calcular PnL
// Usar equity como valor actual preferido; fallback a balance
function computeProfit(initial_balance, { balance, equity }) {
  const initial = Number(initial_balance) || 0;
  const current = Number(equity ?? balance ?? 0) || 0;
  const profit = current - initial;
  const pct = initial > 0 ? (profit / initial) * 100 : 0;
  return { profit, pct };
}

describe('KPIs profit calculation prefers equity over balance', () => {
  it('uses equity when available (open P&L reflected)', () => {
    const kpis = { initial_balance: 1000, balance: 1000, equity: 950 };
    const { profit, pct } = computeProfit(kpis.initial_balance, kpis);
    expect(profit).toBe(-50);
    expect(Math.round(pct * 10) / 10).toBe(-5);
  });

  it('falls back to balance when equity is missing', () => {
    const kpis = { initial_balance: 1000, balance: 1120 };
    const { profit, pct } = computeProfit(kpis.initial_balance, kpis);
    expect(profit).toBe(120);
    expect(Math.round(pct * 10) / 10).toBe(12);
  });
});

