import React from 'react';

const RecentTrades = ({ t }) => {
  const trades = [
    { id: 1, pair: 'EUR/USD', openTime: '2023-10-26 10:00', closeTime: '2023-10-26 14:30', type: t('pamm.profile.buy'), result: '+150.75 USD', pips: '+30.5', sl: '1.05100', tp: '1.05800' },
    { id: 2, pair: 'GBP/JPY', openTime: '2023-10-26 09:15', closeTime: '2023-10-26 11:00', type: t('pamm.profile.sell'), result: '-75.20 USD', pips: '-25.1', sl: '182.500', tp: '181.800' },
    { id: 3, pair: 'AUD/CAD', openTime: '2023-10-25 15:00', closeTime: '2023-10-26 08:45', type: t('pamm.profile.buy'), result: '+210.00 USD', pips: '+45.0', sl: '0.88700', tp: '0.89500' },
    { id: 4, pair: 'USD/CHF', openTime: '2023-10-25 11:30', closeTime: '2023-10-25 18:00', type: t('pamm.profile.sell'), result: '+95.50 USD', pips: '+22.0', sl: '0.90150', tp: '0.89500' },
    { id: 5, pair: 'XAU/USD', openTime: '2023-10-24 20:00', closeTime: '2023-10-25 10:00', type: t('pamm.profile.buy'), result: '-110.00 USD', pips: '-5.5', sl: '1960.00', tp: '1985.00' },
  ];

  return (
    <div className="bg-[#191919] p-6 rounded-lg border border-[#333]">
      <h2 className="text-2xl font-semibold text-white mb-6">{t('pamm.profile.recentTrades')}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-gray-400 border-b border-[#333]">
            <tr>
              <th className="p-3">{t('pamm.profile.pair')}</th>
              <th className="p-3">{t('pamm.profile.type')}</th>
              <th className="p-3">{t('pamm.profile.openCloseTime')}</th>
              <th className="p-3">{t('pamm.profile.resultUSD')}</th>
              <th className="p-3">{t('pamm.profile.resultPips')}</th>
              <th className="p-3">{t('pamm.profile.slTp')}</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => (
              <tr key={trade.id} className="border-b border-[#2a2a2a] hover:bg-[#232323]">
                <td className="p-3 font-medium text-white">{trade.pair}</td>
                <td className={`p-3 font-semibold ${trade.type === t('pamm.profile.buy') ? 'text-green-400' : 'text-red-400'}`}>{trade.type}</td>
                <td className="p-3 text-gray-400">{trade.openTime} <br/> {trade.closeTime}</td>
                <td className={`p-3 font-medium ${trade.result.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{trade.result}</td>
                <td className="p-3 text-white">{trade.pips}</td>
                <td className="p-3 text-gray-400">{trade.sl} / {trade.tp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-center mt-6">
        <button className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
          {t('pamm.profile.viewCompleteHistory')}
        </button>
      </div>
    </div>
  );
};

export default RecentTrades; 