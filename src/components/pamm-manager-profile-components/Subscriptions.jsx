import React from 'react';
import { RiPercentLine, RiMoneyDollarCircleLine, RiCalendarEventLine, RiLockPasswordLine, RiTimeLine, RiBankLine } from 'react-icons/ri';

const InfoRow = ({ icon, label, value }) => (
    <div className="flex justify-between items-center py-3 border-b border-[#2a2a2a]">
        <div className="flex items-center text-gray-400">
            {React.cloneElement(icon, { className: "mr-3" })}
            <span>{label}</span>
        </div>
        <span className="font-semibold text-white">{value}</span>
    </div>
);

const Subscriptions = ({ t }) => {
  return (
    <div className="bg-[#191919] p-6 rounded-lg border border-[#333] space-y-8">
      {/* Distribución de Beneficios */}
      <div>
        <h2 className="text-2xl font-semibold text-white mb-4">{t('pamm.profile.profitDistribution')}</h2>
        <div className="space-y-2">
            <InfoRow icon={<RiPercentLine />} label={t('pamm.profile.investorProfit')} value="70%" />
            <InfoRow icon={<RiMoneyDollarCircleLine />} label={t('pamm.profile.managerCommission')} value="30%" />
            <InfoRow icon={<RiCalendarEventLine />} label={t('pamm.profile.distributionFrequency')} value={t('pamm.manager.fundDetail.monthly')} />
            <InfoRow icon={<RiLockPasswordLine />} label={t('pamm.profile.withdrawalPenalty')} value={`5% ${t('pamm.profile.firstThreeMonths')}`} />
        </div>
      </div>
      
      {/* Condiciones para Invertir */}
      <div>
        <h2 className="text-2xl font-semibold text-white mb-4">{t('pamm.profile.investmentConditions')}</h2>
        <div className="space-y-2">
            <InfoRow icon={<RiMoneyDollarCircleLine />} label={t('pamm.profile.minimumAmount')} value="1,000 USD" />
            <InfoRow icon={<RiTimeLine />} label={t('pamm.profile.minimumTime')} value={`3 ${t('pamm.profile.months')}`} />
            <InfoRow icon={<RiBankLine />} label={t('pamm.profile.requiredBroker')} value="AGM Markets" />
        </div>
      </div>

    </div>
  );
};

export default Subscriptions; 