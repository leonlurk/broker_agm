import React from 'react';
import { RiUserStarLine, RiBriefcaseLine, RiCpuLine, RiShieldCheckLine, RiMapPinLine, RiAwardLine } from 'react-icons/ri';

const InfoRow = ({ icon, label, value }) => (
    <div className="flex items-start py-3 border-b border-[#2a2a2a]">
        <div className="text-cyan-400 mt-1 mr-4">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-400">{label}</p>
            <p className="font-semibold text-white">{value}</p>
        </div>
    </div>
);

const ManagerInfo = ({ t }) => {
  return (
    <div className="bg-[#191919] p-6 rounded-lg border border-[#333]">
      <h2 className="text-2xl font-semibold text-white mb-4">{t('pamm.profile.managerInformation')}</h2>
      <div className="space-y-2">
        <InfoRow icon={<RiUserStarLine size={20} />} label={t('pamm.profile.managerName')} value="Alex 'Momentum' Rodriguez" />
        <InfoRow icon={<RiBriefcaseLine size={20} />} label={t('pamm.profile.experience')} value={`12 ${t('pamm.profile.yearsInForexMarkets')}`} />
        <InfoRow icon={<RiCpuLine size={20} />} label={t('pamm.profile.usedStrategy')} value={t('pamm.profile.hybridSystem')} />
        <InfoRow icon={<RiShieldCheckLine size={20} />} label={t('pamm.profile.riskPhilosophy')} value={t('pamm.profile.maxRiskPerTrade')} />
        <InfoRow icon={<RiMapPinLine size={20} />} label={t('pamm.profile.usedBroker')} value={`AGM Markets ${t('pamm.profile.regulated')}`} />
        <InfoRow icon={<RiAwardLine size={20} />} label={t('pamm.profile.certifications')} value="CMT Nivel II" />
      </div>
    </div>
  );
};

export default ManagerInfo; 