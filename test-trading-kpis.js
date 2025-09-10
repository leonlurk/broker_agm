/**
 * 🧪 SCRIPT DE TESTING COMPLETO PARA KPIs Y MÉTRICAS DE TRADING
 * 
 * Ejecutar este script en la consola del navegador mientras estás en la vista de detalles
 * de una cuenta de trading para verificar que todos los KPIs funcionan correctamente.
 * 
 * INSTRUCCIONES:
 * 1. Navega a Cuentas de Trading
 * 2. Haz click en cualquier cuenta para ver sus detalles
 * 3. Abre la consola del navegador (F12)
 * 4. Copia y pega todo este script
 * 5. Presiona Enter para ejecutar
 */

console.log('%c🚀 INICIANDO TEST DE KPIs Y MÉTRICAS DE TRADING', 'color: #00ff00; font-size: 16px; font-weight: bold');
console.log('====================================================');

// Función helper para generar datos aleatorios realistas
const randomBetween = (min, max, decimals = 2) => 
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

// Función helper para generar fechas
const generateDateRange = (days) => {
  const dates = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString());
  }
  return dates;
};

// ============================================
// 1️⃣ TEST DE KPIs PRINCIPALES
// ============================================
const testKPIs = async () => {
  console.log('\n%c📊 TEST 1: KPIs PRINCIPALES', 'color: #3498db; font-size: 14px; font-weight: bold');
  
  // Datos simulados de KPIs
  const mockKPIs = {
    balance: 25000.00,
    equity: 24850.50,
    margin: 1200.00,
    free_margin: 23650.50,
    margin_level: 2070.88,
    profit_loss: -149.50,
    profit_loss_percentage: -0.60,
    current_drawdown: 2.5,
    max_drawdown: 8.3,
    trading_days: 45,
    initial_balance: 20000.00,
    peak_balance: 27500.00
  };

  console.log('📈 KPIs Simulados:', mockKPIs);
  
  // Verificar cálculos
  const marginLevelCalc = (mockKPIs.equity / mockKPIs.margin) * 100;
  const plPercentCalc = ((mockKPIs.balance - mockKPIs.initial_balance) / mockKPIs.initial_balance) * 100;
  const drawdownFromPeak = ((mockKPIs.peak_balance - mockKPIs.balance) / mockKPIs.peak_balance) * 100;
  
  console.log('\n✅ Verificación de Cálculos:');
  console.log(`  • Margin Level: ${marginLevelCalc.toFixed(2)}% (debe ser ~${mockKPIs.margin_level}%)`);
  console.log(`  • P&L %: ${plPercentCalc.toFixed(2)}% (desde balance inicial)`);
  console.log(`  • Drawdown desde pico: ${drawdownFromPeak.toFixed(2)}%`);
  
  return mockKPIs;
};

// ============================================
// 2️⃣ TEST DE ESTADÍSTICAS DE TRADING
// ============================================
const testStatistics = async () => {
  console.log('\n%c📊 TEST 2: ESTADÍSTICAS DE TRADING', 'color: #e74c3c; font-size: 14px; font-weight: bold');
  
  const mockStatistics = {
    total_trades: 156,
    winning_trades: 89,
    losing_trades: 67,
    win_rate: 57.05,
    average_win: 145.32,
    average_loss: -98.45,
    average_lot_size: 0.15,
    risk_reward_ratio: 1.48,
    total_deposits: 20000.00,
    total_withdrawals: 5000.00,
    net_pnl: 5000.00,
    net_pnl_percentage: 25.00,
    best_trade: 850.00,
    worst_trade: -420.00,
    average_trade_duration: '02:45:00'
  };

  console.log('📊 Estadísticas Simuladas:', mockStatistics);
  
  // Verificar cálculos estadísticos
  const winRateCalc = (mockStatistics.winning_trades / mockStatistics.total_trades) * 100;
  const rrRatioCalc = Math.abs(mockStatistics.average_win / mockStatistics.average_loss);
  const netFlow = mockStatistics.total_deposits - mockStatistics.total_withdrawals;
  
  console.log('\n✅ Verificación de Estadísticas:');
  console.log(`  • Win Rate calculado: ${winRateCalc.toFixed(2)}% (debe ser ${mockStatistics.win_rate}%)`);
  console.log(`  • Risk/Reward calculado: 1:${rrRatioCalc.toFixed(2)}`);
  console.log(`  • Flujo neto: $${netFlow.toFixed(2)}`);
  
  return mockStatistics;
};

// ============================================
// 3️⃣ TEST DE HISTORIAL DE BALANCE
// ============================================
const testBalanceHistory = async () => {
  console.log('\n%c📈 TEST 3: HISTORIAL DE BALANCE', 'color: #2ecc71; font-size: 14px; font-weight: bold');
  
  const dates = generateDateRange(30);
  let currentBalance = 20000;
  
  const balanceHistory = dates.map((date, index) => {
    // Simular variación diaria realista (-2% a +3%)
    const dailyChange = randomBetween(-2, 3, 2);
    currentBalance = currentBalance * (1 + dailyChange / 100);
    
    return {
      date: date,
      timestamp: date,
      value: parseFloat(currentBalance.toFixed(2)),
      balance: parseFloat(currentBalance.toFixed(2)),
      equity: parseFloat((currentBalance * randomBetween(0.98, 1.02)).toFixed(2)),
      margin_level: randomBetween(1500, 3000),
      daily_pnl: parseFloat((currentBalance * dailyChange / 100).toFixed(2)),
      daily_pnl_percentage: dailyChange
    };
  });

  console.log('📊 Historial de Balance (últimos 5 días):', balanceHistory.slice(-5));
  
  // Calcular métricas del período
  const startBalance = balanceHistory[0].value;
  const endBalance = balanceHistory[balanceHistory.length - 1].value;
  const totalReturn = ((endBalance - startBalance) / startBalance) * 100;
  const maxBalance = Math.max(...balanceHistory.map(h => h.value));
  const minBalance = Math.min(...balanceHistory.map(h => h.value));
  const maxDrawdown = ((maxBalance - minBalance) / maxBalance) * 100;
  
  console.log('\n📈 Métricas del Período:');
  console.log(`  • Balance Inicial: $${startBalance.toFixed(2)}`);
  console.log(`  • Balance Final: $${endBalance.toFixed(2)}`);
  console.log(`  • Retorno Total: ${totalReturn.toFixed(2)}%`);
  console.log(`  • Max Drawdown: ${maxDrawdown.toFixed(2)}%`);
  
  return balanceHistory;
};

// ============================================
// 4️⃣ TEST DE HISTORIAL DE OPERACIONES
// ============================================
const testOperationsHistory = async () => {
  console.log('\n%c💹 TEST 4: HISTORIAL DE OPERACIONES', 'color: #9b59b6; font-size: 14px; font-weight: bold');
  
  const instruments = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'GOLD', 'BTC/USD', 'US30'];
  const types = ['buy', 'sell'];
  const operations = [];
  
  // Generar 50 operaciones simuladas
  for (let i = 0; i < 50; i++) {
    const openTime = new Date();
    openTime.setHours(openTime.getHours() - randomBetween(1, 720, 0)); // Hasta 30 días atrás
    
    const closeTime = new Date(openTime);
    closeTime.setHours(closeTime.getHours() + randomBetween(1, 48, 0)); // 1-48 horas después
    
    const type = types[Math.floor(Math.random() * types.length)];
    const lots = randomBetween(0.01, 1.0);
    const openPrice = randomBetween(1.0000, 2.0000, 5);
    const isWin = Math.random() > 0.43; // 57% win rate
    const pips = isWin ? randomBetween(10, 100) : randomBetween(-80, -10);
    const closePrice = type === 'buy' 
      ? openPrice + (pips * 0.0001)
      : openPrice - (pips * 0.0001);
    
    const profit = lots * pips * 10; // Simplificado
    
    operations.push({
      ticket: 10000000 + i,
      symbol: instruments[Math.floor(Math.random() * instruments.length)],
      type: type,
      lots: lots,
      open_time: openTime.toISOString(),
      close_time: closeTime.toISOString(),
      open_price: openPrice,
      close_price: closePrice,
      commission: -lots * 2,
      swap: randomBetween(-5, 5),
      profit: profit,
      pips: Math.abs(pips),
      duration_hours: Math.floor((closeTime - openTime) / 3600000),
      status: profit > 0 ? 'win' : 'loss'
    });
  }
  
  // Ordenar por fecha de cierre descendente
  operations.sort((a, b) => new Date(b.close_time) - new Date(a.close_time));
  
  console.log('📋 Últimas 5 Operaciones:', operations.slice(0, 5));
  
  // Calcular estadísticas
  const wins = operations.filter(op => op.profit > 0);
  const losses = operations.filter(op => op.profit < 0);
  const totalProfit = operations.reduce((sum, op) => sum + op.profit, 0);
  const avgWin = wins.reduce((sum, op) => sum + op.profit, 0) / wins.length;
  const avgLoss = losses.reduce((sum, op) => sum + op.profit, 0) / losses.length;
  
  console.log('\n📊 Estadísticas de Operaciones:');
  console.log(`  • Total Operaciones: ${operations.length}`);
  console.log(`  • Ganadoras: ${wins.length} (${(wins.length/operations.length*100).toFixed(1)}%)`);
  console.log(`  • Perdedoras: ${losses.length} (${(losses.length/operations.length*100).toFixed(1)}%)`);
  console.log(`  • Profit Total: $${totalProfit.toFixed(2)}`);
  console.log(`  • Ganancia Promedio: $${avgWin.toFixed(2)}`);
  console.log(`  • Pérdida Promedio: $${avgLoss.toFixed(2)}`);
  
  return operations;
};

// ============================================
// 5️⃣ TEST DE DISTRIBUCIÓN DE INSTRUMENTOS
// ============================================
const testInstruments = async () => {
  console.log('\n%c🎯 TEST 5: DISTRIBUCIÓN DE INSTRUMENTOS', 'color: #f39c12; font-size: 14px; font-weight: bold');
  
  const mockInstruments = [
    { symbol: 'EUR/USD', count: 45, volume: 12.5, profit: 1250.00, percentage: 28.5 },
    { symbol: 'GBP/USD', count: 32, volume: 8.3, profit: -320.00, percentage: 20.5 },
    { symbol: 'GOLD', count: 28, volume: 5.2, profit: 890.00, percentage: 18.0 },
    { symbol: 'USD/JPY', count: 22, volume: 6.8, profit: 450.00, percentage: 14.1 },
    { symbol: 'BTC/USD', count: 18, volume: 3.5, profit: 2100.00, percentage: 11.5 },
    { symbol: 'US30', count: 11, volume: 2.1, profit: -180.00, percentage: 7.4 }
  ];
  
  console.log('🎯 Instrumentos Operados:', mockInstruments);
  
  const totalTrades = mockInstruments.reduce((sum, inst) => sum + inst.count, 0);
  const totalVolume = mockInstruments.reduce((sum, inst) => sum + inst.volume, 0);
  const totalProfit = mockInstruments.reduce((sum, inst) => sum + inst.profit, 0);
  
  console.log('\n📊 Resumen:');
  console.log(`  • Total Trades: ${totalTrades}`);
  console.log(`  • Volumen Total: ${totalVolume.toFixed(2)} lotes`);
  console.log(`  • Profit Total: $${totalProfit.toFixed(2)}`);
  console.log(`  • Instrumento más operado: ${mockInstruments[0].symbol}`);
  console.log(`  • Instrumento más rentable: ${mockInstruments.sort((a,b) => b.profit - a.profit)[0].symbol}`);
  
  return mockInstruments;
};

// ============================================
// 6️⃣ TEST DE RENDIMIENTO MENSUAL
// ============================================
const testMonthlyPerformance = async () => {
  console.log('\n%c📅 TEST 6: RENDIMIENTO MENSUAL', 'color: #1abc9c; font-size: 14px; font-weight: bold');
  
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const currentMonth = new Date().getMonth();
  
  const monthlyData = months.slice(0, currentMonth + 1).map((month, index) => {
    const isPositive = Math.random() > 0.35; // 65% meses positivos
    const monthReturn = isPositive ? randomBetween(0.5, 8.5) : randomBetween(-6.5, -0.5);
    
    return {
      month: month,
      month_number: index + 1,
      return_percentage: monthReturn,
      starting_balance: 20000 * (1 + index * 0.02),
      ending_balance: 20000 * (1 + index * 0.02) * (1 + monthReturn/100),
      trades: randomBetween(10, 40, 0),
      profit_loss: 20000 * (1 + index * 0.02) * (monthReturn/100)
    };
  });
  
  console.log('📅 Rendimiento Mensual:', monthlyData);
  
  const ytdReturn = monthlyData.reduce((sum, m) => sum + m.return_percentage, 0);
  const positiveMonths = monthlyData.filter(m => m.return_percentage > 0).length;
  const avgMonthlyReturn = ytdReturn / monthlyData.length;
  
  console.log('\n📊 Resumen Anual:');
  console.log(`  • YTD Return: ${ytdReturn.toFixed(2)}%`);
  console.log(`  • Meses Positivos: ${positiveMonths}/${monthlyData.length}`);
  console.log(`  • Retorno Mensual Promedio: ${avgMonthlyReturn.toFixed(2)}%`);
  console.log(`  • Mejor Mes: ${Math.max(...monthlyData.map(m => m.return_percentage)).toFixed(2)}%`);
  console.log(`  • Peor Mes: ${Math.min(...monthlyData.map(m => m.return_percentage)).toFixed(2)}%`);
  
  return monthlyData;
};

// ============================================
// 7️⃣ INYECTAR DATOS EN EL COMPONENTE
// ============================================
const injectDataToComponent = async (data) => {
  console.log('\n%c💉 INYECTANDO DATOS EN EL COMPONENTE', 'color: #e67e22; font-size: 14px; font-weight: bold');
  
  // Intentar acceder al servicio de métricas
  if (window.accountMetricsOptimized) {
    console.log('✅ Servicio de métricas encontrado');
    
    // Mockear la respuesta del servicio
    const originalGetDashboardData = window.accountMetricsOptimized.getDashboardData;
    window.accountMetricsOptimized.getDashboardData = async (accountNumber, period) => {
      console.log(`🔄 Interceptando llamada a getDashboardData(${accountNumber}, ${period})`);
      return {
        kpis: data.kpis,
        statistics: data.statistics,
        balance_history: data.balanceHistory,
        instruments: data.instruments,
        recent_operations: data.operations.slice(0, 10)
      };
    };
    
    console.log('✅ Datos mockeados inyectados al servicio');
    console.log('📌 Haz click en el botón de refresh para ver los datos simulados');
  } else {
    console.log('⚠️ Servicio no encontrado. Intentando método alternativo...');
    
    // Método alternativo: disparar evento personalizado
    const event = new CustomEvent('mock-trading-data', { 
      detail: data 
    });
    window.dispatchEvent(event);
    console.log('📨 Evento con datos simulados disparado');
  }
};

// ============================================
// 8️⃣ EJECUTAR TODOS LOS TESTS
// ============================================
const runAllTests = async () => {
  console.log('\n%c🏁 EJECUTANDO SUITE COMPLETA DE TESTS', 'color: #27ae60; font-size: 16px; font-weight: bold');
  console.log('=' .repeat(50));
  
  try {
    // Ejecutar todos los tests
    const kpis = await testKPIs();
    const statistics = await testStatistics();
    const balanceHistory = await testBalanceHistory();
    const operations = await testOperationsHistory();
    const instruments = await testInstruments();
    const monthlyPerformance = await testMonthlyPerformance();
    
    // Compilar todos los datos
    const allData = {
      kpis,
      statistics,
      balanceHistory,
      operations,
      instruments,
      monthlyPerformance
    };
    
    // Inyectar datos en el componente
    await injectDataToComponent(allData);
    
    console.log('\n' + '='.repeat(50));
    console.log('%c✅ TODOS LOS TESTS COMPLETADOS', 'color: #00ff00; font-size: 16px; font-weight: bold');
    console.log('\n📊 Resumen de Datos Generados:');
    console.log(`  • KPIs principales: ${Object.keys(kpis).length} métricas`);
    console.log(`  • Estadísticas: ${Object.keys(statistics).length} métricas`);
    console.log(`  • Historial de balance: ${balanceHistory.length} días`);
    console.log(`  • Operaciones: ${operations.length} trades`);
    console.log(`  • Instrumentos: ${instruments.length} símbolos`);
    console.log(`  • Rendimiento mensual: ${monthlyPerformance.length} meses`);
    
    console.log('\n%c💡 PRÓXIMOS PASOS:', 'color: #f1c40f; font-size: 14px; font-weight: bold');
    console.log('1. Verifica que los KPIs se muestren correctamente en la UI');
    console.log('2. Revisa que los gráficos se actualicen con los nuevos datos');
    console.log('3. Comprueba que los cálculos sean consistentes');
    console.log('4. Si necesitas refrescar, haz click en el botón de sincronización');
    
    // Guardar datos en window para inspección manual
    window.__TEST_DATA__ = allData;
    console.log('\n📦 Datos guardados en window.__TEST_DATA__ para inspección manual');
    
    return allData;
    
  } catch (error) {
    console.error('%c❌ ERROR EN LOS TESTS:', 'color: #ff0000; font-size: 14px; font-weight: bold', error);
    throw error;
  }
};

// ============================================
// 9️⃣ FUNCIÓN DE VERIFICACIÓN EN TIEMPO REAL
// ============================================
const verifyRealTimeData = () => {
  console.log('\n%c🔍 VERIFICANDO DATOS EN TIEMPO REAL', 'color: #3498db; font-size: 14px; font-weight: bold');
  
  // Intentar obtener el estado actual del componente React
  const reactRoot = document.querySelector('#root')._reactRootContainer;
  if (reactRoot) {
    console.log('✅ React Root encontrado');
    
    // Buscar elementos en el DOM con los valores
    const balanceElement = document.querySelector('[class*="text-3xl"][class*="font-bold"]');
    if (balanceElement) {
      console.log(`💰 Balance en UI: ${balanceElement.textContent}`);
    }
    
    // Verificar si hay gráficos renderizados
    const charts = document.querySelectorAll('[class*="recharts"]');
    console.log(`📊 Gráficos encontrados: ${charts.length}`);
    
    // Verificar métricas
    const metricCards = document.querySelectorAll('[class*="from-[#2a2a2a]"]');
    console.log(`📈 Cards de métricas: ${metricCards.length}`);
  }
  
  // Verificar llamadas a API en Network
  console.log('\n📡 Para verificar llamadas reales a API:');
  console.log('1. Abre la pestaña Network en DevTools');
  console.log('2. Filtra por "Fetch/XHR"');
  console.log('3. Busca llamadas a /dashboard, /kpis, /balance-history');
  console.log('4. Verifica los payloads y respuestas');
};

// ============================================
// 🚀 EJECUTAR TODO
// ============================================
(async () => {
  try {
    // Ejecutar tests
    const testResults = await runAllTests();
    
    // Verificar datos en tiempo real
    setTimeout(() => {
      verifyRealTimeData();
    }, 2000);
    
    // Configurar observador para cambios
    const observer = new MutationObserver((mutations) => {
      console.log('🔄 Cambio detectado en DOM - verificando actualización de datos...');
    });
    
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true
    });
    
    console.log('\n%c🎯 TEST COMPLETADO - OBSERVANDO CAMBIOS...', 'color: #00ff00; font-size: 16px; font-weight: bold');
    
  } catch (error) {
    console.error('Fatal error:', error);
  }
})();

// Exportar funciones para uso manual
window.TradingTests = {
  testKPIs,
  testStatistics,
  testBalanceHistory,
  testOperationsHistory,
  testInstruments,
  testMonthlyPerformance,
  runAllTests,
  verifyRealTimeData,
  getData: () => window.__TEST_DATA__
};