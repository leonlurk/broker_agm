/**
 * Servicio para calcular métricas desde datos de Supabase
 * En lugar de depender del backend MT5, calculamos todo desde los datos persistidos
 */

import { supabase } from '../supabase/config';
import { logger } from '../utils/logger';

/**
 * Calcula métricas de la cuenta desde Supabase
 */
export const calculateAccountMetricsFromSupabase = async (accountNumber) => {
  try {
    // Obtener operaciones cerradas
    const { data: operations, error: opsError } = await supabase
      .from('trading_operations')
      .select('*')
      .eq('account_number', accountNumber)
      .eq('status', 'CLOSED')
      .order('close_time', { ascending: false });

    if (opsError) throw opsError;

    // Obtener balance actual de la cuenta
    const { data: account, error: accError } = await supabase
      .from('trading_accounts')
      .select('balance, equity, margin, free_margin')
      .eq('account_number', accountNumber)
      .single();

    if (accError) throw accError;

    // Obtener historial de balance para calcular drawdown
    const { data: balanceHistory, error: histError } = await supabase
      .from('account_balance_history')
      .select('balance')
      .eq('account_number', accountNumber)
      .order('timestamp', { ascending: true });

    if (histError) throw histError;

    // Calcular métricas
    const totalProfit = operations?.reduce((sum, op) => sum + (op.profit || 0), 0) || 0;
    const initialBalance = balanceHistory?.[0]?.balance || account?.balance || 10000;
    const currentBalance = account?.balance || 10500;
    
    // Calcular drawdown
    let maxDrawdown = 0;
    let currentDrawdown = 0;
    if (balanceHistory && balanceHistory.length > 0) {
      let peak = balanceHistory[0].balance;
      balanceHistory.forEach(point => {
        if (point.balance > peak) {
          peak = point.balance;
        }
        const dd = ((peak - point.balance) / peak) * 100;
        if (dd > maxDrawdown) {
          maxDrawdown = dd;
        }
      });
      // Current drawdown
      const lastPeak = Math.max(...balanceHistory.map(h => h.balance));
      currentDrawdown = ((lastPeak - currentBalance) / lastPeak) * 100;
    }

    // Contar días de trading
    const tradingDays = new Set(
      operations?.map(op => 
        new Date(op.close_time).toISOString().split('T')[0]
      ) || []
    ).size;

    return {
      balance: currentBalance,
      equity: account?.equity || currentBalance,
      margin: account?.margin || 0,
      free_margin: account?.free_margin || currentBalance,
      margin_level: account?.margin ? (account.equity / account.margin * 100) : 0,
      profit_loss: totalProfit,
      profit_loss_percentage: initialBalance > 0 ? (totalProfit / initialBalance * 100) : 0,
      current_drawdown: Math.max(0, currentDrawdown),
      max_drawdown: maxDrawdown,
      trading_days: tradingDays,
      initial_balance: initialBalance,
      peak_balance: Math.max(...(balanceHistory?.map(h => h.balance) || [currentBalance]))
    };
  } catch (error) {
    logger.error('[Supabase Metrics] Error calculating metrics', error);
    return null;
  }
};

/**
 * Calcula estadísticas de trading desde Supabase
 */
export const calculateAccountStatisticsFromSupabase = async (accountNumber) => {
  try {
    const { data: operations, error } = await supabase
      .from('trading_operations')
      .select('*')
      .eq('account_number', accountNumber)
      .eq('status', 'CLOSED');

    if (error) throw error;

    if (!operations || operations.length === 0) {
      return {
        total_trades: 0,
        winning_trades: 0,
        losing_trades: 0,
        win_rate: 0,
        average_win: 0,
        average_loss: 0,
        average_lot_size: 0,
        risk_reward_ratio: 0,
        total_deposits: 0,
        total_withdrawals: 0,
        net_pnl: 0,
        net_pnl_percentage: 0,
        best_trade: 0,
        worst_trade: 0,
        average_trade_duration: 0
      };
    }

    const winningTrades = operations.filter(op => op.profit > 0);
    const losingTrades = operations.filter(op => op.profit < 0);
    
    const totalWin = winningTrades.reduce((sum, op) => sum + op.profit, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, op) => sum + op.profit, 0));
    
    const averageWin = winningTrades.length > 0 ? totalWin / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;
    
    const totalVolume = operations.reduce((sum, op) => sum + (op.volume || 0), 0);
    const averageLotSize = operations.length > 0 ? totalVolume / operations.length : 0;
    
    // Calcular duración promedio
    let totalDuration = 0;
    operations.forEach(op => {
      if (op.open_time && op.close_time) {
        const duration = new Date(op.close_time) - new Date(op.open_time);
        totalDuration += duration;
      }
    });
    const averageDuration = operations.length > 0 ? totalDuration / operations.length : 0;
    
    // Formatear duración en horas:minutos:segundos
    const hours = Math.floor(averageDuration / 3600000);
    const minutes = Math.floor((averageDuration % 3600000) / 60000);
    const seconds = Math.floor((averageDuration % 60000) / 1000);
    const formattedDuration = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const netPnl = totalWin - totalLoss;
    const winRate = operations.length > 0 ? (winningTrades.length / operations.length * 100) : 0;
    const riskReward = averageLoss > 0 ? averageWin / averageLoss : 0;

    return {
      total_trades: operations.length,
      winning_trades: winningTrades.length,
      losing_trades: losingTrades.length,
      win_rate: winRate,
      average_win: averageWin,
      average_loss: averageLoss,
      average_lot_size: averageLotSize,
      risk_reward_ratio: riskReward,
      total_deposits: 10500, // Valor inicial hardcodeado por ahora
      total_withdrawals: 0,
      net_pnl: netPnl,
      net_pnl_percentage: 10500 > 0 ? (netPnl / 10500 * 100) : 0,
      best_trade: Math.max(...operations.map(op => op.profit || 0)),
      worst_trade: Math.min(...operations.map(op => op.profit || 0)),
      average_trade_duration: formattedDuration
    };
  } catch (error) {
    logger.error('[Supabase Metrics] Error calculating statistics', error);
    return null;
  }
};

/**
 * Calcula distribución de instrumentos desde Supabase
 */
export const calculateInstrumentsDistributionFromSupabase = async (accountNumber) => {
  try {
    const { data: operations, error } = await supabase
      .from('trading_operations')
      .select('symbol, profit')
      .eq('account_number', accountNumber)
      .eq('status', 'CLOSED');

    if (error) throw error;

    if (!operations || operations.length === 0) {
      return {
        distribution: [],
        total_instruments: 0,
        total_trades: 0
      };
    }

    // Agrupar por símbolo
    const instruments = {};
    operations.forEach(op => {
      const symbol = op.symbol || 'Unknown';
      if (!instruments[symbol]) {
        instruments[symbol] = {
          count: 0,
          profit: 0,
          volume: 0
        };
      }
      instruments[symbol].count++;
      instruments[symbol].profit += op.profit || 0;
    });

    // Calcular distribución
    const totalTrades = operations.length;
    const distribution = Object.entries(instruments)
      .map(([symbol, data], index) => ({
        name: symbol,
        value: (data.count / totalTrades * 100),
        count: data.count,
        profit: data.profit,
        color: ['#06b6d4', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6'][index % 5]
      }))
      .sort((a, b) => b.count - a.count);

    return {
      distribution,
      total_instruments: Object.keys(instruments).length,
      total_trades: totalTrades
    };
  } catch (error) {
    logger.error('[Supabase Metrics] Error calculating instruments', error);
    return {
      distribution: [],
      total_instruments: 0,
      total_trades: 0
    };
  }
};

/**
 * Obtiene el rendimiento histórico desde Supabase
 */
export const getPerformanceFromSupabase = async (accountNumber, period = 'monthly', year = new Date().getFullYear()) => {
  try {
    const { data: operations, error } = await supabase
      .from('trading_operations')
      .select('close_time, profit')
      .eq('account_number', accountNumber)
      .eq('status', 'CLOSED')
      .gte('close_time', `${year}-01-01`)
      .lte('close_time', `${year}-12-31`);

    if (error) throw error;

    // Obtener balance inicial del año
    const { data: firstSnapshot } = await supabase
      .from('account_balance_history')
      .select('balance')
      .eq('account_number', accountNumber)
      .lte('timestamp', `${year}-01-01`)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    const initialBalance = firstSnapshot?.balance || 10000;

    // Agrupar por período
    const performanceData = {};
    
    if (period === 'monthly') {
      // Inicializar todos los meses
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      months.forEach(month => {
        performanceData[month] = { profit: 0, trades: 0 };
      });

      // Agregar datos de operaciones
      operations?.forEach(op => {
        if (op.close_time) {
          const date = new Date(op.close_time);
          const monthIndex = date.getMonth();
          const monthName = months[monthIndex];
          if (performanceData[monthName]) {
            performanceData[monthName].profit += op.profit || 0;
            performanceData[monthName].trades++;
          }
        }
      });

      // Convertir a array con porcentajes
      return months.map(month => ({
        name: month,
        value: initialBalance > 0 ? (performanceData[month].profit / initialBalance * 100) : 0,
        profit: performanceData[month].profit,
        trades: performanceData[month].trades
      }));
    }

    // Para otros períodos (trimestral, etc.)
    return [];
  } catch (error) {
    logger.error('[Supabase Metrics] Error getting performance', error);
    return [];
  }
};

export default {
  calculateAccountMetricsFromSupabase,
  calculateAccountStatisticsFromSupabase,
  calculateInstrumentsDistributionFromSupabase,
  getPerformanceFromSupabase
};