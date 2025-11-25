import React from 'react';
import { Users, TrendingUp, DollarSign, Award, Shield, FileText, ArrowRight, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const IBOnboardingScreen = ({ onBecomeIB }) => {
  const { t } = useTranslation('affiliates');

  return (
    <div className="min-h-screen bg-[#191919] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-6">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('ib.onboarding.title')}
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            {t('ib.onboarding.subtitle')}
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#232323] border border-[#333] rounded-2xl p-6 hover:border-blue-600/50 transition-all">
            <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {t('ib.onboarding.benefits.competitiveCommissions.title')}
            </h3>
            <p className="text-gray-400">
              {t('ib.onboarding.benefits.competitiveCommissions.description')}
            </p>
          </div>

          <div className="bg-[#232323] border border-[#333] rounded-2xl p-6 hover:border-purple-600/50 transition-all">
            <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {t('ib.onboarding.benefits.unlimitedGrowth.title')}
            </h3>
            <p className="text-gray-400">
              {t('ib.onboarding.benefits.unlimitedGrowth.description')}
            </p>
          </div>

          <div className="bg-[#232323] border border-[#333] rounded-2xl p-6 hover:border-green-600/50 transition-all">
            <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {t('ib.onboarding.benefits.dedicatedSupport.title')}
            </h3>
            <p className="text-gray-400">
              {t('ib.onboarding.benefits.dedicatedSupport.description')}
            </p>
          </div>
        </div>

        {/* Tier Structure */}
        <div className="bg-gradient-to-br from-[#232323] to-[#1a1a1a] border border-[#333] rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-400" />
            {t('ib.onboarding.tiers.title')}
          </h2>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            {[
              { tier: 1, name: t('ib.onboarding.tiers.tier1.name'), referrals: t('ib.onboarding.tiers.tier1.referrals'), commission: t('ib.onboarding.tiers.tier1.commission') },
              { tier: 2, name: t('ib.onboarding.tiers.tier2.name'), referrals: t('ib.onboarding.tiers.tier2.referrals'), commission: t('ib.onboarding.tiers.tier2.commission') },
              { tier: 3, name: t('ib.onboarding.tiers.tier3.name'), referrals: t('ib.onboarding.tiers.tier3.referrals'), commission: t('ib.onboarding.tiers.tier3.commission') }
            ].map((tier) => (
              <div
                key={tier.tier}
                className="bg-[#2d2d2d] border border-[#444] rounded-xl p-4 hover:border-blue-600/50 transition-all"
              >
                <div className="text-sm text-gray-500 mb-1">Tier {tier.tier}</div>
                <div className="text-lg font-bold text-white mb-2">{tier.name}</div>
                <div className="text-sm text-gray-400 mb-1">
                  {t('common.referrals', { defaultValue: 'Referidos' })}: <span className="text-blue-400">{tier.referrals}</span>
                </div>
                <div className="text-sm text-gray-400">
                  {t('common.commission', { defaultValue: 'Comisión' })}: <span className="text-green-400">{tier.commission}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 text-center mt-4">
            {t('ib.onboarding.tiersNote')}
          </p>
        </div>

        {/* Features */}
        <div className="bg-[#232323] border border-[#333] rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            {t('ib.onboarding.features.title')}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              t('ib.onboarding.features.customReferralLink'),
              t('ib.onboarding.features.realtimeDashboard'),
              t('ib.onboarding.features.automaticPayments'),
              t('ib.onboarding.features.commissionTracking'),
              t('ib.onboarding.features.marketingMaterials'),
              t('ib.onboarding.features.prioritySupport'),
              t('ib.onboarding.features.detailedReports'),
              t('ib.onboarding.features.noActivationFee')
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-gray-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <FileText className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-yellow-400 mb-2">
                {t('ib.onboarding.requirements.title')}
              </h3>
              <p className="text-gray-300 mb-3">
                {t('ib.onboarding.requirements.description')}
              </p>
              <p className="text-sm text-gray-400">
                {t('ib.onboarding.requirements.agreementInfo')}
              </p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <button
            onClick={onBecomeIB}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-lg font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            <FileText className="w-6 h-6" />
            {t('ib.onboarding.cta.button')}
            <ArrowRight className="w-6 h-6" />
          </button>
          <p className="text-sm text-gray-500 mt-4">
            {t('ib.onboarding.cta.disclaimer')}
          </p>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            {t('ib.onboarding.footer.questions')}{' '}
            <a href="#" className="text-blue-400 hover:text-blue-300">
              {t('ib.onboarding.footer.documentation')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default IBOnboardingScreen;
