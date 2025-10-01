import React from 'react';
import { Crown, Users, TrendingUp, CheckCircle, Clock, AlertCircle, Star, Shield, Target, Copy } from 'lucide-react';

// Master Account Status Badge
export const MasterAccountBadge = ({ type = 'pamm', isActive = true, followerCount = 0, className = '' }) => {
  const getConfig = () => {
    switch (type) {
      case 'pamm':
        return {
          icon: Crown,
          label: 'PAMM Manager',
          bgColor: isActive ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-gray-600',
          textColor: 'text-white',
          iconColor: 'text-yellow-300'
        };
      case 'copytrading':
        return {
          icon: Target,
          label: 'Master Trader',
          bgColor: isActive ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gray-600',
          textColor: 'text-white',
          iconColor: 'text-cyan-200'
        };
      default:
        return {
          icon: Shield,
          label: 'Master Account',
          bgColor: isActive ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gray-600',
          textColor: 'text-white',
          iconColor: 'text-green-200'
        };
    }
  };

  const config = getConfig();
  const IconComponent = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} ${className}`}>
      <IconComponent size={14} className={config.iconColor} />
      <span>{config.label}</span>
      {followerCount > 0 && (
        <div className="flex items-center gap-1 ml-1 px-2 py-0.5 bg-black bg-opacity-30 rounded-full">
          <Users size={10} />
          <span>{followerCount}</span>
        </div>
      )}
      <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
    </div>
  );
};

// Follow Status Indicator
export const FollowStatusIndicator = ({ status = 'not_following', traderName = '', className = '' }) => {
  const getConfig = () => {
    switch (status) {
      case 'following':
        return {
          icon: CheckCircle,
          label: 'Following',
          bgColor: 'bg-green-500 bg-opacity-20',
          textColor: 'text-green-400',
          borderColor: 'border-green-500'
        };
      case 'copying':
        return {
          icon: Copy,
          label: 'Copying',
          bgColor: 'bg-blue-500 bg-opacity-20',
          textColor: 'text-blue-400',
          borderColor: 'border-blue-500'
        };
      case 'pending':
        return {
          icon: Clock,
          label: 'Pending',
          bgColor: 'bg-yellow-500 bg-opacity-20',
          textColor: 'text-yellow-400',
          borderColor: 'border-yellow-500'
        };
      case 'paused':
        return {
          icon: AlertCircle,
          label: 'Paused',
          bgColor: 'bg-orange-500 bg-opacity-20',
          textColor: 'text-orange-400',
          borderColor: 'border-orange-500'
        };
      default:
        return null;
    }
  };

  const config = getConfig();
  if (!config) return null;

  const IconComponent = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.bgColor} ${config.borderColor} ${config.textColor} ${className}`}>
      <IconComponent size={14} />
      <span className="text-xs font-medium">{config.label}</span>
      {traderName && (
        <span className="text-xs opacity-75">• {traderName}</span>
      )}
    </div>
  );
};

// Account Type Badge
export const AccountTypeBadge = ({ accountType = 'regular', isMaster = false, className = '' }) => {
  if (isMaster) {
    return <MasterAccountBadge type="copytrading" className={className} />;
  }

  const getTypeConfig = () => {
    switch (accountType.toLowerCase()) {
      case 'real':
        return {
          label: 'Real',
          bgColor: 'bg-green-500 bg-opacity-20',
          textColor: 'text-green-400',
          borderColor: 'border-green-500'
        };
      case 'demo':
        return {
          label: 'Demo',
          bgColor: 'bg-blue-500 bg-opacity-20',
          textColor: 'text-blue-400',
          borderColor: 'border-blue-500'
        };
      case 'contest':
        return {
          label: 'Contest',
          bgColor: 'bg-purple-500 bg-opacity-20',
          textColor: 'text-purple-400',
          borderColor: 'border-purple-500'
        };
      default:
        return {
          label: accountType,
          bgColor: 'bg-gray-500 bg-opacity-20',
          textColor: 'text-gray-400',
          borderColor: 'border-gray-500'
        };
    }
  };

  const config = getTypeConfig();

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded border text-xs font-medium ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}>
      {config.label}
    </div>
  );
};

// Performance Status Indicator
export const PerformanceStatusIndicator = ({ profit = 0, winRate = 0, className = '' }) => {
  const getPerformanceLevel = () => {
    if (profit > 50 && winRate > 70) return 'excellent';
    if (profit > 20 && winRate > 60) return 'good';
    if (profit > 0 && winRate > 50) return 'average';
    return 'poor';
  };

  const level = getPerformanceLevel();

  const getConfig = () => {
    switch (level) {
      case 'excellent':
        return {
          icon: Star,
          label: 'Excellent',
          bgColor: 'bg-gradient-to-r from-yellow-400 to-orange-500',
          textColor: 'text-white'
        };
      case 'good':
        return {
          icon: TrendingUp,
          label: 'Good',
          bgColor: 'bg-gradient-to-r from-green-500 to-emerald-500',
          textColor: 'text-white'
        };
      case 'average':
        return {
          icon: TrendingUp,
          label: 'Average',
          bgColor: 'bg-gradient-to-r from-blue-500 to-cyan-500',
          textColor: 'text-white'
        };
      default:
        return {
          icon: AlertCircle,
          label: 'Needs Attention',
          bgColor: 'bg-gradient-to-r from-red-500 to-pink-500',
          textColor: 'text-white'
        };
    }
  };

  const config = getConfig();
  const IconComponent = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} ${className}`}>
      <IconComponent size={14} />
      <span>{config.label}</span>
      <div className="flex items-center gap-2 ml-2 px-2 py-0.5 bg-black bg-opacity-30 rounded-full">
        <span>{profit > 0 ? '+' : ''}{profit.toFixed(1)}%</span>
        <span>•</span>
        <span>{winRate.toFixed(0)}% WR</span>
      </div>
    </div>
  );
};

// Subscription Status Card
export const SubscriptionStatusCard = ({ 
  subscription, 
  onPause, 
  onResume, 
  onStop, 
  onModify,
  className = '' 
}) => {
  const { trader, status, profit, riskRatio, startDate } = subscription;

  return (
    <div className={`bg-[#232323] border border-[#333] rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <img 
            src={trader.avatar || '/default-avatar.png'} 
            alt={trader.name}
            className="w-10 h-10 rounded-full border-2 border-cyan-500"
            onError={(e) => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='12' fill='%23333'/%3E%3C/svg%3E"; }}
          />
          <div>
            <h4 className="font-semibold text-white">{trader.name}</h4>
            <p className="text-xs text-gray-400">Since {startDate}</p>
          </div>
        </div>
        <FollowStatusIndicator status={status} />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <p className="text-xs text-gray-400">Profit</p>
          <p className={`font-semibold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {profit >= 0 ? '+' : ''}{profit.toFixed(2)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400">Risk Ratio</p>
          <p className="font-semibold text-white">{riskRatio}x</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400">Status</p>
          <p className={`text-xs font-medium ${
            status === 'copying' ? 'text-blue-400' : 
            status === 'paused' ? 'text-yellow-400' : 'text-green-400'
          }`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {status === 'copying' && (
          <button
            onClick={() => onPause(subscription.id)}
            className="flex-1 px-3 py-2 bg-yellow-500 bg-opacity-20 text-yellow-400 border border-yellow-500 rounded-lg text-xs font-medium hover:bg-opacity-30 transition-colors"
          >
            Pause
          </button>
        )}
        {status === 'paused' && (
          <button
            onClick={() => onResume(subscription.id)}
            className="flex-1 px-3 py-2 bg-green-500 bg-opacity-20 text-green-400 border border-green-500 rounded-lg text-xs font-medium hover:bg-opacity-30 transition-colors"
          >
            Resume
          </button>
        )}
        <button
          onClick={() => onModify(subscription.id)}
          className="flex-1 px-3 py-2 bg-blue-500 bg-opacity-20 text-blue-400 border border-blue-500 rounded-lg text-xs font-medium hover:bg-opacity-30 transition-colors"
        >
          Modify
        </button>
        <button
          onClick={() => onStop(subscription.id)}
          className="flex-1 px-3 py-2 bg-red-500 bg-opacity-20 text-red-400 border border-red-500 rounded-lg text-xs font-medium hover:bg-opacity-30 transition-colors"
        >
          Stop
        </button>
      </div>
    </div>
  );
};

// Master Account Summary Card
export const MasterAccountSummaryCard = ({ 
  masterAccount, 
  onViewDetails, 
  onManageFollowers,
  className = '' 
}) => {
  const { accountName, accountNumber, type, followers, totalEarnings, performance, isActive } = masterAccount;

  return (
    <div className={`bg-[#232323] border border-[#333] rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white text-lg">{accountName}</h3>
          <p className="text-sm text-gray-400">#{accountNumber}</p>
        </div>
        <MasterAccountBadge 
          type={type} 
          isActive={isActive} 
          followerCount={followers} 
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-[#191919] p-3 rounded-lg border border-[#333]">
          <p className="text-xs text-gray-400 mb-1">Total Earnings</p>
          <p className="text-lg font-semibold text-green-400">
            ${totalEarnings.toLocaleString()}
          </p>
        </div>
        <div className="bg-[#191919] p-3 rounded-lg border border-[#333]">
          <p className="text-xs text-gray-400 mb-1">Performance</p>
          <p className={`text-lg font-semibold ${performance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {performance >= 0 ? '+' : ''}{performance.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onViewDetails(masterAccount.id)}
          className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          View Details
        </button>
        <button
          onClick={() => onManageFollowers(masterAccount.id)}
          className="flex-1 px-4 py-2 bg-[#333] hover:bg-[#444] text-white rounded-lg text-sm font-medium transition-colors"
        >
          Manage Followers
        </button>
      </div>
    </div>
  );
};

export default {
  MasterAccountBadge,
  FollowStatusIndicator,
  AccountTypeBadge,
  PerformanceStatusIndicator,
  SubscriptionStatusCard,
  MasterAccountSummaryCard
};
