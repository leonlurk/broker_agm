import React, { useState } from 'react';
import { RiAddLine, RiSubtractLine } from 'react-icons/ri';

const FaqItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-[#2a2a2a]">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left py-4"
            >
                <span className="font-semibold text-white">{question}</span>
                <span className="text-cyan-400">
                    {isOpen ? <RiSubtractLine /> : <RiAddLine />}
                </span>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                <div className="pb-4 text-gray-400">
                    {answer}
                </div>
            </div>
        </div>
    );
};

const Faqs = ({ t }) => {
    const faqData = [
        { q: t('pamm.profile.strategyRiskQuestion'), a: t('pamm.profile.strategyRiskAnswer') },
        { q: t('pamm.profile.commissionsCalculationQuestion'), a: t('pamm.profile.commissionsCalculationAnswer') },
        { q: t('pamm.profile.withdrawalQuestion'), a: t('pamm.profile.withdrawalAnswer') },
        { q: t('pamm.profile.apiConnectionQuestion'), a: t('pamm.profile.apiConnectionAnswer') },
    ];

    return (
        <div className="bg-[#191919] p-6 rounded-lg border border-[#333]">
            <h2 className="text-2xl font-semibold text-white mb-4">{t('pamm.profile.faqs')}</h2>
            <div>
                {faqData.map((faq, index) => (
                    <FaqItem key={index} question={faq.q} answer={faq.a} />
                ))}
            </div>
        </div>
    );
};

export default Faqs; 