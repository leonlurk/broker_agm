import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  DollarSign,
  Award,
  ChevronDown,
  ChevronUp,
  Eye,
  Zap,
  BarChart2,
  Calendar,
  Percent,
  PiggyBank,
  Lock
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

// Mini sparkline chart component
const PerformanceSparkline = ({ data, color = '#22d3ee' }) => {
  const chartData = data || generateSamplePerformanceData();

  return (
    <div className="h-16 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`pammGradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
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
            formatter={(value) => [`${value.toFixed(1)}%`, 'Return']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#pammGradient-${color.replace('#', '')})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Generate sample performance data
const generateSamplePerformanceData = () => {
  const data = [];
  let value = 0;
  for (let i = 0; i < 30; i++) {
    value = value + (Math.random() - 0.4) * 3;
    data.push({ day: i + 1, value: value });
  }
  return data;
};

// Circular progress indicator for returns
const ReturnCircle = ({ percentage, size = 'normal' }) => {
  const isPositive = percentage >= 0;
  const radius = size === 'large' ? 24 : 20;
  const circumference = 2 * Math.PI * radius;
  const displayPercentage = Math.min(Math.abs(percentage), 100);
  const strokeDashoffset = circumference - (displayPercentage / 100) * circumference;
  const dimensions = size === 'large' ? 'w-14 h-14' : 'w-12 h-12';
  const cx = size === 'large' ? 28 : 24;
  const cy = size === 'large' ? 28 : 24;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className={`transform -rotate-90 ${dimensions}`}>
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke="#333"
          strokeWidth="4"
          fill="transparent"
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={isPositive ? '#22c55e' : '#ef4444'}
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className={`absolute text-xs font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? '+' : ''}{percentage.toFixed(0)}%
      </span>
    </div>
  );
};

// KPI Badge component
const KpiBadge = ({ icon: Icon, label, value, color = 'cyan' }) => {
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
      <span className={`text-sm font-bold ${textColor}`}>{value}</span>
    </div>
  );
};

// Risk indicator component
const RiskIndicator = ({ level }) => {
  const levels = {
    'Bajo': { bgColor: 'bg-green-500', textColor: 'text-green-400', bars: 1 },
    'Moderado': { bgColor: 'bg-yellow-500', textColor: 'text-yellow-400', bars: 2 },
    'Medio-Alto': { bgColor: 'bg-orange-500', textColor: 'text-orange-400', bars: 3 },
    'Alto': { bgColor: 'bg-red-500', textColor: 'text-red-400', bars: 4 }
  };

  const config = levels[level] || levels['Moderado'];

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

const EnhancedPAMMCard = ({
  fund,
  onInvest,
  onWithdraw,
  onView,
  onExpand,
  isExpanded,
  isInvested,
  formatAUM,
  formatCurrency,
  formatPercentage,
  t = (key) => key
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Extract fund data
  const monthlyReturn = fund.monthlyReturn || 0;
  const totalReturn = fund.totalReturn || 0;
  const aum = fund.aum || 0;
  const investors = fund.investors || 0;
  const winRate = fund.winRate || 0;
  const maxDrawdown = fund.maxDrawdown || 0;
  const sharpeRatio = fund.sharpeRatio || 0;
  const minInvestment = fund.minInvestment || 0;

  // Determine chart color based on performance
  const chartColor = monthlyReturn >= 0 ? '#22c55e' : '#ef4444';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl transition-all duration-500 ${
        isHovered ? 'transform scale-[1.02] shadow-2xl shadow-purple-500/10' : ''
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
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-purple-500/20 animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative p-5 border border-[#333]/50 rounded-2xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative">
              {fund.foto ? (
                <img
                  src={fund.foto}
                  alt={fund.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-purple-500"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-lg font-bold">
                  {(fund.name || 'F').charAt(0)}
                </div>
              )}
              {fund.type === 'Premium' && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-[#191919] flex items-center justify-center">
                  <Award size={8} className="text-black" />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white">{fund.name}</h3>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Users size={12} className="text-gray-500" />
                <span className="text-xs text-gray-400">
                  {investors} inversores
                </span>
              </div>
            </div>
          </div>

          {/* AUM badge */}
          <div className="text-right">
            <div className="px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-lg border border-purple-500/30">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">AUM</p>
              <p className="text-lg font-bold text-purple-400">{formatAUM ? formatAUM(aum) : `$${(aum/1000).toFixed(0)}K`}</p>
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
            <span className={`text-sm font-bold ${monthlyReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {monthlyReturn >= 0 ? '+' : ''}{monthlyReturn.toFixed(1)}%
            </span>
          </div>
          <PerformanceSparkline data={fund.performanceHistory} color={chartColor} />
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="flex flex-col items-center p-2 bg-[#232323]/50 rounded-lg">
            <ReturnCircle percentage={totalReturn} />
            <span className="text-[10px] text-gray-500 mt-1">Total</span>
          </div>

          <KpiBadge
            icon={Percent}
            label="Win Rate"
            value={`${winRate}%`}
            color="green"
          />

          <KpiBadge
            icon={TrendingDown}
            label="Drawdown"
            value={`${maxDrawdown}%`}
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
              <DollarSign size={12} className="text-gray-500" />
              <span className="text-xs text-gray-400">Min: {formatCurrency ? formatCurrency(minInvestment) : `$${minInvestment}`}</span>
            </div>
            <RiskIndicator level={fund.riskLevel || 'Moderado'} />
          </div>

          {fund.type && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              fund.type === 'Premium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
              fund.type === 'Agresivo' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              'bg-purple-500/20 text-purple-400 border border-purple-500/30'
            }`}>
              {fund.type}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {isInvested ? (
            <button
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700"
              onClick={() => onWithdraw && onWithdraw(fund)}
            >
              <PiggyBank size={16} />
              Retirar
            </button>
          ) : (
            <button
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-purple-500/25"
              onClick={() => onInvest(fund)}
            >
              <DollarSign size={16} />
              Invertir
            </button>
          )}

          <button
            className="px-4 py-2.5 bg-[#333]/50 hover:bg-[#444]/50 rounded-xl text-sm transition-all duration-300 flex items-center gap-2 border border-[#444]/50 hover:border-[#555]"
            onClick={() => onView(fund)}
          >
            <Eye size={16} />
          </button>

          <button
            className="px-4 py-2.5 bg-[#333]/50 hover:bg-[#444]/50 rounded-xl text-sm transition-all duration-300 border border-[#444]/50 hover:border-[#555]"
            onClick={(e) => {
              e.stopPropagation();
              onExpand(fund.id);
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
                  <p className="text-xs text-gray-500 mb-1">Manager</p>
                  <p className="text-sm font-bold text-white">
                    {typeof fund.manager === 'string' ? fund.manager : (fund.manager?.name || fund.manager?.display_name || 'Manager')}
                  </p>
                </div>
                <div className="bg-[#191919]/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Desde</p>
                  <p className="text-sm font-bold text-cyan-400">{fund.since}</p>
                </div>
                <div className="bg-[#191919]/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Lock-up</p>
                  <p className="text-sm font-bold text-yellow-400 flex items-center gap-1">
                    <Lock size={12} />
                    {fund.lockupPeriod || '30 días'}
                  </p>
                </div>
                <div className="bg-[#191919]/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Comisión</p>
                  <p className="text-sm font-bold text-purple-400">
                    {fund.performanceFee || fund.fee || 20}%
                  </p>
                </div>
              </div>

              <button
                className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600/50 to-indigo-600/50 hover:from-purple-600 hover:to-indigo-600 rounded-xl text-sm font-medium transition-all duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(fund);
                }}
              >
                Ver detalles completos →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedPAMMCard;
export { PerformanceSparkline, ReturnCircle, KpiBadge, RiskIndicator };
