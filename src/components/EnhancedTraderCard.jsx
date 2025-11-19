import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Activity,
  DollarSign,
  Award,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCircle,
  Eye,
  Zap,
  BarChart2,
  Percent,
  Calendar
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

// Mini sparkline chart component
const PerformanceSparkline = ({ data, color = '#22d3ee' }) => {
  // Generate sample data if not provided
  const chartData = data || generateSamplePerformanceData();

  return (
    <div className="h-16 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`sparklineGradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            contentStyle={{
              backgroundColor: '#191919',
              border: '1px solid #333',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            labelStyle={{ color: '#9ca3af' }}
            formatter={(value) => [`$${value.toLocaleString()}`, 'Equity']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#sparklineGradient-${color.replace('#', '')})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Generate sample performance data
const generateSamplePerformanceData = () => {
  const data = [];
  let value = 10000;
  for (let i = 0; i < 30; i++) {
    value = value + (Math.random() - 0.4) * 500;
    data.push({ day: i + 1, value: Math.max(value, 1000) });
  }
  return data;
};

// Circular progress indicator for win rate
const WinRateCircle = ({ percentage }) => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="transform -rotate-90 w-12 h-12">
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke="#333"
          strokeWidth="4"
          fill="transparent"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke="#22c55e"
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="absolute text-xs font-bold text-green-400">
        {percentage.toFixed(0)}%
      </span>
    </div>
  );
};

// KPI Badge component
const KpiBadge = ({ icon: Icon, label, value, color = 'cyan', trend = null }) => {
  const colorClasses = {
    cyan: 'text-cyan-400',
    blue: 'text-blue-400',
    green: 'text-green-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400',
    purple: 'text-purple-400'
  };
  const textColor = colorClasses[color] || colorClasses.cyan;

  return (
    <div className="flex flex-col items-center p-2 bg-[#232323]/50 rounded-lg backdrop-blur-sm border border-[#333]/50 hover:border-[#444] transition-all duration-300 hover:scale-105">
      <div className={`flex items-center gap-1 ${textColor} mb-1`}>
        <Icon size={12} />
        <span className="text-[10px] uppercase tracking-wider text-gray-500">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className={`text-sm font-bold ${textColor}`}>{value}</span>
        {trend && (
          trend > 0 ?
            <TrendingUp size={10} className="text-green-400" /> :
            <TrendingDown size={10} className="text-red-400" />
        )}
      </div>
    </div>
  );
};

// Risk indicator component
const RiskIndicator = ({ level }) => {
  const levels = {
    'Bajo': { bgColor: 'bg-green-500', textColor: 'text-green-400', bars: 1 },
    'Medio': { bgColor: 'bg-yellow-500', textColor: 'text-yellow-400', bars: 2 },
    'Medio-Alto': { bgColor: 'bg-orange-500', textColor: 'text-orange-400', bars: 3 },
    'Alto': { bgColor: 'bg-red-500', textColor: 'text-red-400', bars: 4 }
  };

  const config = levels[level] || levels['Medio'];

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`w-1 rounded-full transition-all duration-300 ${
              bar <= config.bars ? config.bgColor : 'bg-[#333]'
            }`}
            style={{ height: `${bar * 3 + 4}px` }}
          />
        ))}
      </div>
      <span className={`text-xs ${config.textColor}`}>{level}</span>
    </div>
  );
};

const EnhancedTraderCard = ({
  trader,
  onCopy,
  onUnfollow,
  onView,
  onExpand,
  isExpanded,
  isCopying,
  t = (key) => key
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Extract performance data
  const performance = trader.performance || {};
  const winRate = performance.win_rate || trader.winRate || 0;
  const monthlyROI = performance.monthly_pnl_percentage || 0;
  const totalTrades = performance.total_trades || trader.totalTrades || 0;
  const maxDrawdown = performance.max_drawdown || trader.maxDrawdown || 0;
  const balance = trader.balance || performance.balance || 0;
  const equity = trader.equity || performance.equity || balance;
  const avgProfit = performance.avg_profit || trader.avgProfit || 0;
  const sharpeRatio = performance.sharpe_ratio || trader.sharpeRatio || 0;

  // Determine chart color based on performance
  const chartColor = monthlyROI >= 0 ? '#22c55e' : '#ef4444';

  // Format currency
  const formatCurrency = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl transition-all duration-500 ${
        isHovered ? 'transform scale-[1.02] shadow-2xl shadow-cyan-500/10' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] opacity-50" />
      <div className="absolute inset-0 backdrop-blur-xl bg-[#191919]/80" />

      {/* Animated border gradient */}
      <div className={`absolute inset-0 rounded-2xl transition-opacity duration-500 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative p-5 border border-[#333]/50 rounded-2xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar with status */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-lg font-bold">
                {trader.name?.charAt(0)?.toUpperCase() || 'T'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#191919] animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white">{trader.name}</h3>
                {trader.type === 'Verificado' && (
                  <Award size={14} className="text-cyan-400" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Users size={12} className="text-gray-500" />
                <span className="text-xs text-gray-400">
                  {trader.followerCount || 0} seguidores
                </span>
              </div>
            </div>
          </div>

          {/* Balance badge */}
          <div className="text-right">
            <div className="px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-lg border border-emerald-500/30">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Balance</p>
              <p className="text-lg font-bold text-emerald-400">{formatCurrency(balance)}</p>
            </div>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="mb-4 bg-[#232323]/30 rounded-xl p-3 border border-[#333]/30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Activity size={10} />
              Rendimiento 30D
            </span>
            <span className={`text-sm font-bold ${monthlyROI >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {monthlyROI >= 0 ? '+' : ''}{monthlyROI.toFixed(1)}%
            </span>
          </div>
          <PerformanceSparkline data={trader.performanceHistory} color={chartColor} />
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="flex flex-col items-center p-2 bg-[#232323]/50 rounded-lg">
            <WinRateCircle percentage={winRate} />
            <span className="text-[10px] text-gray-500 mt-1">Win Rate</span>
          </div>

          <KpiBadge
            icon={BarChart2}
            label="Trades"
            value={totalTrades}
            color="blue"
          />

          <KpiBadge
            icon={TrendingDown}
            label="Drawdown"
            value={`${maxDrawdown.toFixed(1)}%`}
            color="red"
          />

          <KpiBadge
            icon={Zap}
            label="Sharpe"
            value={sharpeRatio.toFixed(2)}
            color="purple"
          />
        </div>

        {/* Additional info row */}
        <div className="flex justify-between items-center mb-4 px-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Calendar size={12} className="text-gray-500" />
              <span className="text-xs text-gray-400">{trader.since}</span>
            </div>
            <RiskIndicator level={trader.riesgo || 'Medio'} />
          </div>

          {trader.type && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              trader.type === 'Premium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
              trader.type === 'Verificado' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
              'bg-gray-500/20 text-gray-400 border border-gray-500/30'
            }`}>
              {trader.type}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {isCopying ? (
            <button
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700"
              onClick={() => onUnfollow && onUnfollow(trader)}
            >
              <CheckCircle size={16} />
              Dejar de seguir
            </button>
          ) : (
            <button
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 hover:shadow-lg hover:shadow-cyan-500/25"
              onClick={() => onCopy(trader)}
            >
              <Copy size={16} />
              Copiar
            </button>
          )}

          <button
            className="px-4 py-2.5 bg-[#333]/50 hover:bg-[#444]/50 rounded-xl text-sm transition-all duration-300 flex items-center gap-2 border border-[#444]/50 hover:border-[#555]"
            onClick={() => onView(trader)}
          >
            <Eye size={16} />
          </button>

          <button
            className="px-4 py-2.5 bg-[#333]/50 hover:bg-[#444]/50 rounded-xl text-sm transition-all duration-300 border border-[#444]/50 hover:border-[#555]"
            onClick={(e) => {
              e.stopPropagation();
              onExpand(trader.id);
            }}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Expanded section */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-[#333]/50">
            <div className="bg-[#232323]/30 p-4 rounded-xl border border-[#333]/30">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-[#191919]/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Rentabilidad Total</p>
                  <p className="text-lg font-bold text-green-400">{trader.rentabilidad}</p>
                </div>
                <div className="bg-[#191919]/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Beneficio Promedio</p>
                  <p className="text-lg font-bold text-cyan-400">
                    {avgProfit ? `$${avgProfit.toFixed(2)}` : 'N/A'}
                  </p>
                </div>
                <div className="bg-[#191919]/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Equity</p>
                  <p className="text-lg font-bold text-emerald-400">{formatCurrency(equity)}</p>
                </div>
                <div className="bg-[#191919]/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Comisión</p>
                  <p className="text-lg font-bold text-yellow-400">
                    {trader.fee_percentage || trader.commission_rate || 0}%
                  </p>
                </div>
              </div>

              <button
                className="w-full px-4 py-2.5 bg-gradient-to-r from-cyan-600/50 to-blue-600/50 hover:from-cyan-600 hover:to-blue-600 rounded-xl text-sm font-medium transition-all duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(trader);
                }}
              >
                Ver perfil completo →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedTraderCard;
