/**
 * Account History Service
 * Maneja los datos históricos de las cuentas de trading
 */

import { supabase } from '../supabase/config';
import { logger } from '../utils/logger';

/**
 * Registra un snapshot del balance actual
 */
export const recordBalanceSnapshot = async (accountId, accountNumber, balanceData) => {
  try {
    const { data, error } = await supabase
      .from('account_balance_history')
      .insert({
        account_id: accountId,
        account_number: accountNumber,
        balance: balanceData.balance || 0,
        equity: balanceData.equity || balanceData.balance || 0,
        margin: balanceData.margin || 0,
        free_margin: balanceData.free_margin || balanceData.balance || 0,
        profit_loss: (balanceData.equity || 0) - (balanceData.balance || 0)
      })
      .select()
      .single();

    if (error) throw error;

    logger.info('[Account History] Balance snapshot recorded', { 
      accountId, 
      balance: balanceData.balance 
    });

    return { success: true, data };
  } catch (error) {
    logger.error('[Account History] Error recording balance snapshot', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtiene el historial de balance de una cuenta
 */
export const getBalanceHistory = async (accountNumber, days = 30) => {
  try {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const { data, error } = await supabase
      .from('account_balance_history')
      .select('*')
      .eq('account_number', accountNumber)
      .gte('timestamp', fromDate.toISOString())
      .order('timestamp', { ascending: true });

    if (error) throw error;

    // Si no hay suficientes datos históricos, agregar el balance actual
    if (!data || data.length === 0) {
      // Obtener el balance actual de la cuenta
      const { data: accountData, error: accountError } = await supabase
        .from('trading_accounts')
        .select('balance, equity, margin, free_margin')
        .eq('account_number', accountNumber)
        .single();

      if (!accountError && accountData) {
        // Crear un punto de datos con el balance actual
        return {
          success: true,
          data: [{
            balance: accountData.balance || 0,
            equity: accountData.equity || accountData.balance || 0,
            timestamp: new Date().toISOString(),
            profit_loss: 0
          }]
        };
      }
    }

    logger.info('[Account History] Balance history retrieved', { 
      accountNumber, 
      records: data.length 
    });

    return { success: true, data };
  } catch (error) {
    logger.error('[Account History] Error getting balance history', error);
    return { success: false, error: error.message };
  }
};

/**
 * Registra una operación de trading
 */
export const recordTradingOperation = async (accountId, accountNumber, operation) => {
  try {
    const { data, error } = await supabase
      .from('trading_operations')
      .insert({
        account_id: accountId,
        account_number: accountNumber,
        ticket: operation.ticket,
        symbol: operation.symbol,
        operation_type: operation.type === 0 ? 'BUY' : 'SELL',
        volume: operation.volume,
        open_price: operation.open_price,
        close_price: operation.close_price,
        open_time: operation.open_time,
        close_time: operation.close_time,
        stop_loss: operation.stop_loss,
        take_profit: operation.take_profit,
        profit: operation.profit,
        swap: operation.swap || 0,
        commission: operation.commission || 0,
        comment: operation.comment || '',
        status: operation.close_time ? 'CLOSED' : 'OPEN'
      })
      .select()
      .single();

    if (error) throw error;

    logger.info('[Account History] Trading operation recorded', { 
      ticket: operation.ticket 
    });

    return { success: true, data };
  } catch (error) {
    logger.error('[Account History] Error recording operation', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtiene las operaciones de una cuenta
 */
export const getTradingOperations = async (accountNumber, status = null, limit = 100) => {
  try {
    let query = supabase
      .from('trading_operations')
      .select('*')
      .eq('account_number', accountNumber)
      .order('open_time', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    logger.info('[Account History] Trading operations retrieved', { 
      accountNumber, 
      count: data.length 
    });

    return { success: true, data };
  } catch (error) {
    logger.error('[Account History] Error getting operations', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtiene métricas diarias agregadas
 */
export const getDailyMetrics = async (accountNumber, days = 30) => {
  try {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const { data, error } = await supabase
      .from('account_daily_metrics')
      .select('*')
      .eq('account_number', accountNumber)
      .gte('date', fromDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    logger.error('[Account History] Error getting daily metrics', error);
    return { success: false, error: error.message };
  }
};

/**
 * Calcula y guarda métricas diarias
 */
export const calculateDailyMetrics = async (accountId, accountNumber, date = new Date()) => {
  try {
    const dateStr = date.toISOString().split('T')[0];
    
    // Obtener todas las operaciones del día
    const { data: operations } = await supabase
      .from('trading_operations')
      .select('*')
      .eq('account_number', accountNumber)
      .gte('close_time', `${dateStr}T00:00:00Z`)
      .lte('close_time', `${dateStr}T23:59:59Z`)
      .eq('status', 'CLOSED');

    // Obtener snapshots de balance del día
    const { data: balanceHistory } = await supabase
      .from('account_balance_history')
      .select('*')
      .eq('account_number', accountNumber)
      .gte('timestamp', `${dateStr}T00:00:00Z`)
      .lte('timestamp', `${dateStr}T23:59:59Z`)
      .order('timestamp', { ascending: true });

    if (!balanceHistory || balanceHistory.length === 0) {
      return { success: false, error: 'No balance history for this date' };
    }

    // Calcular métricas
    const metrics = {
      account_id: accountId,
      account_number: accountNumber,
      date: dateStr,
      opening_balance: balanceHistory[0].balance,
      closing_balance: balanceHistory[balanceHistory.length - 1].balance,
      high_balance: Math.max(...balanceHistory.map(h => h.balance)),
      low_balance: Math.min(...balanceHistory.map(h => h.balance)),
      total_trades: operations?.length || 0,
      winning_trades: operations?.filter(op => op.profit > 0).length || 0,
      losing_trades: operations?.filter(op => op.profit < 0).length || 0,
      total_profit: operations?.filter(op => op.profit > 0)
        .reduce((sum, op) => sum + op.profit, 0) || 0,
      total_loss: Math.abs(operations?.filter(op => op.profit < 0)
        .reduce((sum, op) => sum + op.profit, 0) || 0),
      max_drawdown: calculateDrawdown(balanceHistory)
    };

    // Guardar o actualizar métricas
    const { data, error } = await supabase
      .from('account_daily_metrics')
      .upsert(metrics, { 
        onConflict: 'account_number,date' 
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    logger.error('[Account History] Error calculating daily metrics', error);
    return { success: false, error: error.message };
  }
};

/**
 * Calcula el drawdown máximo de una serie de balances
 */
const calculateDrawdown = (balanceHistory) => {
  if (!balanceHistory || balanceHistory.length === 0) return 0;

  let peak = balanceHistory[0].balance;
  let maxDrawdown = 0;

  for (const snapshot of balanceHistory) {
    if (snapshot.balance > peak) {
      peak = snapshot.balance;
    }
    const drawdown = ((peak - snapshot.balance) / peak) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown;
};

/**
 * Obtiene datos para el gráfico de rendimiento mensual/trimestral
 */
export const getPerformanceChartData = async (accountNumber, period = 'monthly', year = new Date().getFullYear()) => {
  try {
    // Obtener métricas diarias del año especificado
    const { data: dailyMetrics, error } = await supabase
      .from('account_daily_metrics')
      .select('*')
      .eq('account_number', accountNumber)
      .gte('date', `${year}-01-01`)
      .lte('date', `${year}-12-31`)
      .order('date', { ascending: true });

    if (error) throw error;

    // Si no hay datos, usar balance actual
    if (!dailyMetrics || dailyMetrics.length === 0) {
      const { data: account } = await supabase
        .from('trading_accounts')
        .select('balance')
        .eq('account_number', accountNumber)
        .single();
      
      const currentBalance = account?.balance || 0;
      
      // Retornar datos vacíos cuando no hay historial (0% de rendimiento)
      if (period === 'monthly') {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        return {
          success: true,
          data: months.map(month => ({
            name: month,
            value: 0  // Sin rendimiento si no hay operaciones
          }))
        };
      } else {
        // Trimestral
        return {
          success: true,
          data: [
            { name: '1er Trimestre', value: 0 },
            { name: '2do Trimestre', value: 0 },
            { name: '3er Trimestre', value: 0 },
            { name: '4to Trimestre', value: 0 }
          ]
        };
      }
    }

    // Agrupar datos por mes o trimestre
    let chartData = [];
    
    if (period === 'monthly') {
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      
      // Agrupar por mes
      for (let i = 0; i < 12; i++) {
        const monthData = dailyMetrics.filter(d => {
          const date = new Date(d.date);
          return date.getMonth() === i;
        });
        
        if (monthData.length > 0) {
          // Usar el último balance del mes
          const lastDay = monthData[monthData.length - 1];
          chartData.push({
            name: months[i],
            value: lastDay.closing_balance || 0
          });
        } else {
          chartData.push({
            name: months[i],
            value: 0
          });
        }
      }
    } else {
      // Trimestral
      const quarters = ['1er Trimestre', '2do Trimestre', '3er Trimestre', '4to Trimestre'];
      
      for (let q = 0; q < 4; q++) {
        const startMonth = q * 3;
        const endMonth = startMonth + 2;
        
        const quarterData = dailyMetrics.filter(d => {
          const date = new Date(d.date);
          const month = date.getMonth();
          return month >= startMonth && month <= endMonth;
        });
        
        if (quarterData.length > 0) {
          const lastDay = quarterData[quarterData.length - 1];
          chartData.push({
            name: quarters[q],
            value: lastDay.closing_balance || 0
          });
        } else {
          chartData.push({
            name: quarters[q],
            value: 0
          });
        }
      }
    }

    return { success: true, data: chartData };
  } catch (error) {
    logger.error('[Account History] Error getting performance chart data', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtiene datos para el gráfico de balance
 */
export const getBalanceChartData = async (accountNumber, period = 'month') => {
  try {
    let days = 30;
    if (period === 'week') days = 7;
    if (period === 'year') days = 365;
    if (period === 'all') days = 9999;

    const { data, error } = await getBalanceHistory(accountNumber, days);
    
    if (error || !data) {
      return { success: false, error: error || 'No data available' };
    }

    // Formatear datos para el gráfico
    const chartData = data.map(snapshot => ({
      date: new Date(snapshot.timestamp).toLocaleDateString(),
      time: new Date(snapshot.timestamp).toLocaleTimeString(),
      value: snapshot.balance,
      equity: snapshot.equity,
      profit: snapshot.profit_loss
    }));

    // Si hay pocos puntos, agregar puntos intermedios para suavizar el gráfico
    if (chartData.length === 1 && chartData[0].value > 0) {
      // Si solo hay un punto con balance, crear una línea desde 0 hasta ese punto
      const currentBalance = chartData[0].value;
      const now = new Date();
      
      chartData.unshift({
        date: new Date(now.getTime() - 86400000).toLocaleDateString(), // Ayer
        time: '00:00:00',
        value: 0,
        equity: 0,
        profit: 0
      });
    }

    return { success: true, data: chartData };
  } catch (error) {
    logger.error('[Account History] Error getting balance chart data', error);
    return { success: false, error: error.message };
  }
};

export default {
  recordBalanceSnapshot,
  getBalanceHistory,
  recordTradingOperation,
  getTradingOperations,
  getDailyMetrics,
  calculateDailyMetrics,
  getBalanceChartData,
  getPerformanceChartData
};