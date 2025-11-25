import React from 'react';
import { Users, TrendingUp, DollarSign, Award, Shield, FileText, ArrowRight, CheckCircle } from 'lucide-react';

const IBOnboardingScreen = ({ onBecomeIB }) => {
  return (
    <div className="min-h-screen bg-[#191919] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-6">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Programa de Introducing Broker
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Conviértete en socio de AGM Broker y obtén comisiones recurrentes
            por cada cliente que refieraslas operaciones de tus referidos
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#232323] border border-[#333] rounded-2xl p-6 hover:border-blue-600/50 transition-all">
            <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Comisiones Competitivas
            </h3>
            <p className="text-gray-400">
              Gana hasta $8 USD por lote operado. Sistema de tiers que incrementa
              tus comisiones según el número de referidos activos.
            </p>
          </div>

          <div className="bg-[#232323] border border-[#333] rounded-2xl p-6 hover:border-purple-600/50 transition-all">
            <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Crecimiento Ilimitado
            </h3>
            <p className="text-gray-400">
              Sin límite de referidos. Mientras más clientes activos tengas,
              mayor será tu nivel y tus comisiones por lote.
            </p>
          </div>

          <div className="bg-[#232323] border border-[#333] rounded-2xl p-6 hover:border-green-600/50 transition-all">
            <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Soporte Dedicado
            </h3>
            <p className="text-gray-400">
              Acceso a materiales de marketing, dashboard en tiempo real,
              y soporte prioritario para IBs.
            </p>
          </div>
        </div>

        {/* Tier Structure */}
        <div className="bg-gradient-to-br from-[#232323] to-[#1a1a1a] border border-[#333] rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-400" />
            Estructura de Tiers
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { tier: 1, name: 'Bronce', referrals: '1-4', commission: '$3-4' },
              { tier: 2, name: 'Plata', referrals: '5-9', commission: '$4-5' },
              { tier: 3, name: 'Oro', referrals: '10-19', commission: '$5-6' },
              { tier: 4, name: 'Platino', referrals: '20+', commission: '$7-8' }
            ].map((tier) => (
              <div
                key={tier.tier}
                className="bg-[#2d2d2d] border border-[#444] rounded-xl p-4 hover:border-blue-600/50 transition-all"
              >
                <div className="text-sm text-gray-500 mb-1">Tier {tier.tier}</div>
                <div className="text-lg font-bold text-white mb-2">{tier.name}</div>
                <div className="text-sm text-gray-400 mb-1">
                  Referidos: <span className="text-blue-400">{tier.referrals}</span>
                </div>
                <div className="text-sm text-gray-400">
                  Comisión: <span className="text-green-400">{tier.commission}/lote</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="bg-[#232323] border border-[#333] rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            ¿Qué obtienes como IB?
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              'Enlace de referido personalizado',
              'Dashboard en tiempo real con estadísticas',
              'Pagos mensuales automáticos',
              'Rastreo de comisiones por operación',
              'Materiales de marketing profesionales',
              'Soporte técnico prioritario',
              'Informes detallados de actividad',
              'Sin costos de activación'
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
                Requisitos Regulatorios
              </h3>
              <p className="text-gray-300 mb-3">
                Para cumplir con las regulaciones financieras, todos los Introducing Brokers
                deben revisar y aceptar nuestro Acuerdo de IB antes de activar esta funcionalidad.
              </p>
              <p className="text-sm text-gray-400">
                El acuerdo establece tus derechos, obligaciones y la estructura de comisiones.
                Tu aceptación electrónica tendrá validez legal.
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
            Revisar Acuerdo y Activar IB
            <ArrowRight className="w-6 h-6" />
          </button>
          <p className="text-sm text-gray-500 mt-4">
            Al continuar, revisarás el Acuerdo de Introducing Broker completo
          </p>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            ¿Tienes preguntas? Contacta a nuestro equipo de soporte o consulta la
            <a href="#" className="text-blue-400 hover:text-blue-300 ml-1">
              documentación completa del programa IB
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default IBOnboardingScreen;
