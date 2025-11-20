import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Activity,
  DollarSign,
  Award,
  X,
  BarChart2,
  Percent,
  Calendar,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  PieChart
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import {
  formatTraderName,
  formatPnL,
  formatPnLPercentage,
  getMedalEmoji,
  formatBalanceHistoryForChart
} from '../services/leaderboardService';

// Circular progress indicator for win rate
const WinRateCircle = ({ percentage, size = 'lg' }) => {
  const radius = size === 'lg' ? 35 : 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const svgSize = size === 'lg' ? 80 : 48;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className={`transform -rotate-90 w-${svgSize/4} h-${svgSize/4}`} style={{ width: svgSize, height: svgSize }}>
        <circle
          cx={svgSize/2}
          cy={svgSize/2}
          r={radius}
          stroke="#333"
          strokeWidth="6"
          fill="transparent"
        />
        <circle
          cx={svgSize/2}
          cy={svgSize/2}
          r={radius}
          stroke={percentage >= 60 ? '#22c55e' : percentage >= 40 ? '#eab308' : '#ef4444'}
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className={`absolute font-bold ${
        size === 'lg' ? 'text-lg' : 'text-xs'
      } ${
        percentage >= 60 ? 'text-green-400' : percentage >= 40 ? 'text-yellow-400' : 'text-red-400'
      }`}>
        {percentage.toFixed(0)}%
      </span>
    </div>
  );
};

// KPI Card component with glassmorphism
const KpiCard = ({ icon: Icon, label, value, subValue, color = 'cyan', trend = null }) => {
  const colorClasses = {
    cyan: { text: 'text-cyan-400', bg: 'from-cyan-900/20 to-cyan-800/20', border: 'border-cyan-500/30' },
    blue: { text: 'text-blue-400', bg: 'from-blue-900/20 to-blue-800/20', border: 'border-blue-500/30' },
    green: { text: 'text-green-400', bg: 'from-green-900/20 to-green-800/20', border: 'border-green-500/30' },
    red: { text: 'text-red-400', bg: 'from-red-900/20 to-red-800/20', border: 'border-red-500/30' },
    yellow: { text: 'text-yellow-400', bg: 'from-yellow-900/20 to-yellow-800/20', border: 'border-yellow-500/30' },
    purple: { text: 'text-purple-400', bg: 'from-purple-900/20 to-purple-800/20', border: 'border-purple-500/30' },
    orange: { text: 'text-orange-400', bg: 'from-orange-900/20 to-orange-800/20', border: 'border-orange-500/30' },
    emerald: { text: 'text-emerald-400', bg: 'from-emerald-900/20 to-emerald-800/20', border: 'border-emerald-500/30' }
  };

  const colors = colorClasses[color] || colorClasses.cyan;

  return (
    <div className={`relative overflow-hidden rounded-xl p-4 bg-gradient-to-br ${colors.bg} border ${colors.border} backdrop-blur-sm transition-all duration-300 hover:scale-105`}>
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
      <div className={`flex items-center gap-2 ${colors.text} mb-2`}>
        <Icon size={16} />
        <span className="text-xs uppercase tracking-wider text-gray-400">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <span className={`text-2xl font-bold ${colors.text}`}>{value}</span>
          {subValue && (
            <span className="block text-xs text-gray-500 mt-1">{subValue}</span>
          )}
        </div>
        {trend !== null && (
          <div className={`flex items-center ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <span className="text-xs font-medium">{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

const EnhancedTraderProfileModal = ({ isOpen, onClose, trader }) => {
  if (!isOpen || !trader) return null;

  // Format balance history for chart
  const chartData = formatBalanceHistoryForChart(trader.balance_history);

  // Calculate derived stats
  const pnlFormatted = formatPnL(trader.pnl || 0);
  const pnlPercentage = formatPnLPercentage(trader.pnl_percentage || 0);

  const profitFactor = trader.average_win && trader.average_loss
    ? (trader.average_win / Math.abs(trader.average_loss)).toFixed(2)
    : 'N/A';

  const sharpeRatio = trader.total_trades > 10
    ? ((trader.pnl_percentage / 100) / Math.sqrt(trader.total_trades)).toFixed(2)
    : 'N/A';

  const avgTradeSize = trader.total_trades > 0
    ? `$${(trader.pnl / trader.total_trades).toFixed(2)}`
    : 'N/A';

  const winningTrades = trader.winning_trades || Math.round(trader.total_trades * (trader.win_rate / 100));
  const losingTrades = trader.losing_trades || (trader.total_trades - winningTrades);

  // Format currency helper
  const formatCurrency = (value) => {
    if (!value && value !== 0) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-auto">
        {/* Glassmorphism background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] rounded-2xl opacity-50" />
        <div className="absolute inset-0 backdrop-blur-xl bg-[#191919]/80 rounded-2xl" />

        {/* Animated border gradient */}
        <div className="absolute inset-0 rounded-2xl">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20" />
        </div>

        {/* Content */}
        <div className="relative p-6 border border-[#333]/50 rounded-2xl">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              {/* Rank badge */}
              <div className={`relative w-16 h-16 rounded-xl flex items-center justify-center ${
                trader.rank === 1 ? 'bg-gradient-to-br from-yellow-500/30 to-amber-600/30 border-2 border-yellow-500/50' :
                trader.rank === 2 ? 'bg-gradient-to-br from-gray-400/30 to-gray-500/30 border-2 border-gray-400/50' :
                trader.rank === 3 ? 'bg-gradient-to-br from-orange-500/30 to-orange-600/30 border-2 border-orange-500/50' :
                'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/30'
              }`}>
                {trader.rank <= 3 ? (
                  <span className="text-3xl">{getMedalEmoji(trader.rank)}</span>
                ) : (
                  <span className="text-xl font-bold text-cyan-400">#{trader.rank}</span>
                )}
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  {formatTraderName(trader.trader_name, trader.account_number)}
                  {trader.rank <= 3 && <Award size={20} className="text-cyan-400" />}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Account: {trader.account_number}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-all hover:rotate-90 duration-300 p-2 hover:bg-red-500/10 rounded-lg"
            >
              <X size={24} />
            </button>
          </div>

          {/* Main Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard
              icon={DollarSign}
              label="Balance"
              value={formatCurrency(trader.balance)}
              color="emerald"
            />
            <KpiCard
              icon={Target}
              label="Equity"
              value={formatCurrency(trader.equity || trader.balance)}
              color="cyan"
            />
            <KpiCard
              icon={TrendingUp}
              label="Total PnL"
              value={pnlFormatted.value}
              subValue={pnlPercentage.value}
              color={pnlFormatted.isPositive ? 'green' : 'red'}
            />
            <KpiCard
              icon={TrendingDown}
              label="Max Drawdown"
              value={`${(trader.max_drawdown || 0).toFixed(1)}%`}
              color="orange"
            />
          </div>

          {/* Performance Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Chart */}
            <div className="bg-[#232323]/50 rounded-xl p-4 border border-[#333]/50">
              <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                <Activity size={16} className="text-cyan-400" />
                Equity Curve
              </h3>
              <div className="h-48">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 10 }}
                      />
                      <YAxis
                        domain={['auto', 'auto']}
                        tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 10 }}
                        width={45}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          padding: '8px'
                        }}
                        formatter={(value) => [`$${value.toLocaleString()}`, 'Equity']}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#06b6d4"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorEquity)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No chart data available
                  </div>
                )}
              </div>
            </div>

            {/* Win Rate & Trade Summary */}
            <div className="bg-[#232323]/50 rounded-xl p-4 border border-[#333]/50">
              <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                <PieChart size={16} className="text-cyan-400" />
                Trade Summary
              </h3>
              <div className="flex items-center justify-center mb-4">
                <WinRateCircle percentage={trader.win_rate || 0} size="lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-400 mb-1">Winning Trades</div>
                  <div className="text-lg font-bold text-green-400">{winningTrades}</div>
                </div>
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-400 mb-1">Losing Trades</div>
                  <div className="text-lg font-bold text-red-400">{losingTrades}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed KPIs Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard
              icon={BarChart2}
              label="Total Trades"
              value={trader.total_trades || 0}
              color="blue"
            />
            <KpiCard
              icon={Zap}
              label="Profit Factor"
              value={profitFactor}
              color="purple"
            />
            <KpiCard
              icon={Target}
              label="Sharpe Ratio"
              value={sharpeRatio}
              color="cyan"
            />
            <KpiCard
              icon={DollarSign}
              label="Avg Trade"
              value={avgTradeSize}
              color="yellow"
            />
          </div>

          {/* Best/Worst Trade Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <ArrowUpRight size={18} className="text-green-400" />
                <span className="text-sm font-medium text-green-400">Best Trade</span>
              </div>
              <div className="text-2xl font-bold text-green-400">
                {formatCurrency(trader.best_trade || 0)}
              </div>
              {trader.average_win && (
                <div className="text-xs text-gray-400 mt-2">
                  Avg Win: {formatCurrency(trader.average_win)}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border border-red-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <ArrowDownRight size={18} className="text-red-400" />
                <span className="text-sm font-medium text-red-400">Worst Trade</span>
              </div>
              <div className="text-2xl font-bold text-red-400">
                {formatCurrency(trader.worst_trade || 0)}
              </div>
              {trader.average_loss && (
                <div className="text-xs text-gray-400 mt-2">
                  Avg Loss: {formatCurrency(trader.average_loss)}
                </div>
              )}
            </div>
          </div>

          {/* Live Trades indicator */}
          {trader.live_trades?.length > 0 && (
            <div className="mt-4 bg-cyan-900/20 border border-cyan-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-cyan-400">
                  {trader.live_trades.length} Live Trade{trader.live_trades.length > 1 ? 's' : ''} Active
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedTraderProfileModal;
