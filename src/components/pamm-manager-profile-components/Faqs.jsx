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

const Faqs = () => {
    const faqData = [
        { q: "¿Cuál es el riesgo de la estrategia?", a: "La estrategia está diseñada para un riesgo moderado. El drawdown máximo histórico es del 12.5% y cada operación tiene un stop loss que no excede el 2% del capital." },
        { q: "¿Cómo se calculan las comisiones?", a: "La comisión del gestor es del 30% sobre las ganancias netas, y se calcula y deduce mensualmente. No hay comisiones si no hay ganancias." },
        { q: "¿Puedo retirar mi dinero en cualquier momento?", a: "Sí, puedes solicitar un retiro en cualquier momento. Sin embargo, si se realiza dentro de los primeros 3 meses, se aplica una penalización del 5% sobre el monto retirado." },
        { q: "La conexión con la API es en tiempo real?", a: "Las estadísticas principales como balance y equidad se actualizan cada 60 segundos. El historial de operaciones se sincroniza al cierre de cada una." },
    ];

    return (
        <div className="bg-[#191919] p-6 rounded-lg border border-[#333]">
            <h2 className="text-2xl font-semibold text-white mb-4">Preguntas Frecuentes (FAQs)</h2>
            <div>
                {faqData.map((faq, index) => (
                    <FaqItem key={index} question={faq.q} answer={faq.a} />
                ))}
            </div>
        </div>
    );
};

export default Faqs; 