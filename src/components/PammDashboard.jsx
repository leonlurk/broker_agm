import React, { useState } from 'react';
import { Search, ChevronLeft, BarChart2, Star, ArrowUpRight, CheckCircle, LineChart, BarChartHorizontal, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

const PammDashboard = () => {
    const [selectedTrader, setSelectedTrader] = useState(null);

    const handleSelectTrader = (trader) => {
        setSelectedTrader(trader);
    };

    const handleBackToList = () => {
        setSelectedTrader(null);
    };

    if (selectedTrader) {
        return <PammDetailView trader={selectedTrader} onBack={handleBackToList} />;
    }

    return <PammListView onSelectTrader={handleSelectTrader} />;
};

const PammListView = ({ onSelectTrader }) => {
    // Mock data based on Pamm.png
    const pammData = [
        {
            ranking: 1,
            nombre: 'Nombre trader',
            serverType: 'MT5',
            cuenta: '657237',
            pnl: '22,621.00',
            rendimiento: '42.13%',
            retraccionMax: '-42.4%',
            cuentaAbierta: '43 Días',
            depositoMinimo: '100.00 USD',
            balancePropio: '5,000.23',
            capitalAdministrado: '75,009.73',
            gananciasUltimoMes: '1,000.02',
            inversores: 1,
        },
        {
            ranking: 2,
            nombre: 'Nombre trader',
            serverType: 'MT5',
            cuenta: '657237',
            pnl: '22,621.00',
            rendimiento: '42.13%',
            retraccionMax: '-42.4%',
            cuentaAbierta: '43 Días',
            depositoMinimo: '100.00 USD',
            balancePropio: '5,000.23',
            capitalAdministrado: '75,009.73',
            gananciasUltimoMes: '1,000.02',
            inversores: 1,
        },
        {
            ranking: 3,
            nombre: 'Nombre trader',
            serverType: 'MT5',
            cuenta: '657237',
            pnl: '22,621.00',
            rendimiento: '42.13%',
            retraccionMax: '-42.4%',
            cuentaAbierta: '43 Días',
            depositoMinimo: '100.00 USD',
            balancePropio: '5,000.23',
            capitalAdministrado: '75,009.73',
            gananciasUltimoMes: '1,000.02',
            inversores: 1,
        },
    ];

    return (
        <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] text-white p-4 sm:p-6 md:p-8 rounded-3xl">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold">Pamm</h1>
                    <p className="text-gray-400 mt-1">Busca tu próxima cuenta Pamm</p>
                </div>
                <div className="relative mt-4 md:mt-0 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Buscar por nombre o número de cuenta"
                        className="bg-[#2D2D2D] border border-[#333] rounded-lg py-2 pl-10 pr-4 w-full md:w-80"
                    />
                    <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
            </div>

            {/* Filters */}
            <div className="space-y-6 mb-8">
                <div>
                    <h3 className="text-lg font-semibold mb-3">Filtrar por</h3>
                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" className="form-checkbox bg-transparent border-[#333] rounded" /><span>Mis favoritos</span></label>
                        <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" className="form-checkbox bg-transparent border-[#333] rounded" /><span>Tasa de rendimiento</span></label>
                        <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" className="form-checkbox bg-transparent border-[#333] rounded" /><span>Tasa de volúmen</span></label>
                        <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" className="form-checkbox bg-transparent border-[#333] rounded" /><span>Depósito</span></label>
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-3">Antiguedad</h3>
                    <div className="flex flex-wrap gap-3">
                        {['+1 semana', '+2 semanas', '+1 mes', '+3 meses', '+6 meses', '+1 año'].map(label => (
                            <button key={label} className="bg-[#2D2D2D] border border-[#333] px-4 py-1.5 rounded-lg text-sm hover:bg-[#3f3f3f]">{label}</button>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-3">Comisión</h3>
                    <div className="flex flex-wrap gap-3">
                        {['Trader sin comisión', '1%-5%', '5%-10%', '10%-20%', '20%-30%', '+30%'].map(label => (
                            <button key={label} className="bg-[#2D2D2D] border border-[#333] px-4 py-1.5 rounded-lg text-sm hover:bg-[#3f3f3f]">{label}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* PAMM Table */}
            <div className="overflow-x-auto">
                <div className="min-w-full inline-block align-middle">
                    {/* Header */}
                    <div className="grid grid-cols-[auto_2fr_repeat(10,1fr)] gap-4 px-4 py-3 text-sm text-gray-400 font-medium">
                        <div>Ranking</div>
                        <div>Trader</div>
                        <div className="text-right">PNL en USD</div>
                        <div className="text-right">Rendimiento</div>
                        <div className="text-right">Retracción Máxima</div>
                        <div className="text-center">Cuenta Abierta</div>
                        <div className="text-right">Depósito Mínimo</div>
                        <div className="text-right">Balance Propio</div>
                        <div className="text-right">Capital Administrado</div>
                        <div className="text-right">Ganancias del último mes</div>
                        <div className="text-center">Inversores</div>
                        <div className="text-center">Cartera</div>
                    </div>
                    {/* Body */}
                    <div className="space-y-3">
                        {pammData.map((trader) => (
                            <div key={trader.ranking} className="grid grid-cols-[auto_2fr_repeat(10,1fr)] gap-4 items-center p-4 rounded-xl bg-[#232323] border border-[#333] cursor-pointer hover:border-cyan-500" onClick={() => onSelectTrader(trader)}>
                                <div className="font-semibold text-lg">{trader.ranking}.</div>
                                <div className="flex items-center space-x-3">
                                    <img src="/Foto.svg" alt="Trader" className="w-12 h-12 rounded-lg bg-[#D9D9D9]" />
                                    <div>
                                        <div className="font-semibold">{trader.nombre}</div>
                                        <div className="text-xs text-gray-400">Server Type: {trader.serverType}</div>
                                        <div className="text-xs text-gray-400">Cuenta: {trader.cuenta}</div>
                                    </div>
                                </div>
                                <div className="text-right">{trader.pnl}</div>
                                <div className="text-right">{trader.rendimiento}</div>
                                <div className="text-right text-white">{trader.retraccionMax}</div>
                                <div className="text-center">{trader.cuentaAbierta}</div>
                                <div className="text-right">{trader.depositoMinimo}</div>
                                <div className="text-right">{trader.balancePropio}</div>
                                <div className="text-right">{trader.capitalAdministrado}</div>
                                <div className="text-right">{trader.gananciasUltimoMes}</div>
                                <div className="text-center">{trader.inversores}</div>
                                <div className="flex justify-center">
                                    <button className="p-2 rounded-lg bg-[#2D2D2D] hover:bg-[#3f3f3f]">
                                        <BarChart2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

const PammDetailView = ({ trader, onBack }) => {
    const [activeTab, setActiveTab] = useState('Rendimiento');

    const chartConfig = {
        'Rendimiento': { data: [ { name: 'Ene', value: 3.2 }, { name: 'Feb', value: 5.0 }, { name: 'Mar', value: 4.5 }, { name: 'Abr', value: 7.9 }, { name: 'May', value: 10.0 }, { name: 'Jun', value: 8.5 }, { name: 'Jul', value: 13.2 }, { name: 'Ago', value: 15.0 }, { name: 'Sep', value: 14.4 }, { name: 'Oct', value: 18.0 }, { name: 'Nov', value: 15.2 }, { name: 'Dic', value: 19.8 } ], max: 30, step: 5 },
        'Retracción': { data: [ { name: 'Ene', value: 2 }, { name: 'Feb', value: 3 }, { name: 'Mar', value: 2.5 }, { name: 'Abr', value: 4 }, { name: 'May', value: 5.5 }, { name: 'Jun', value: 4.2 }, { name: 'Jul', value: 6 }, { name: 'Ago', value: 7 }, { name: 'Sep', value: 6.5 }, { name: 'Oct', value: 8 }, { name: 'Nov', value: 7.2 }, { name: 'Dic', value: 9 } ], max: 15, step: 3 },
        'Balance': { data: [ { name: 'Ene', value: 10 }, { name: 'Feb', value: 12 }, { name: 'Mar', value: 11 }, { name: 'Abr', value: 15 }, { name: 'May', value: 18 }, { name: 'Jun', value: 16 }, { name: 'Jul', value: 22 }, { name: 'Ago', value: 25 }, { name: 'Sep', value: 24 }, { name: 'Oct', value: 28 }, { name: 'Nov', value: 26 }, { name: 'Dic', value: 30 } ], max: 40, step: 10 },
    };

    const getBarColor = (value, maxValue) => {
        const minLightness = 25; 
        const maxLightness = 75; 
        const lightness = minLightness + (value / maxValue) * (maxLightness - minLightness);
        return `hsl(191, 95%, ${lightness}%)`;
    };

    const renderChart = () => {
        const currentChart = chartConfig[activeTab];
        
        return (
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <BarChart data={currentChart.data} margin={{ top: 20, right: 0, left: -20, bottom: 5 }}>
                        <CartesianGrid vertical={false} stroke="#373737" />
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} domain={[0, currentChart.max]}/>
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                            {currentChart.data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getBarColor(entry.value, currentChart.max)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        )
    };

    return (
        <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] text-white p-4 sm:p-6 md:p-8 rounded-3xl space-y-8">
            {/* Header Section */}
            <div>
                <div className="flex items-center mb-6">
                    <button onClick={onBack} className="p-2 hover:bg-[#2a2a2a] rounded-full">
                        <ChevronLeft size={24} />
                    </button>
                </div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div className="flex items-center space-x-4">
                        <img src="/Foto.svg" alt="Trader" className="w-16 h-16 rounded-lg bg-[#D9D9D9]" />
                        <div>
                            <h2 className="text-2xl font-bold">Nombre Trader</h2>
                            <p className="text-sm text-gray-400 flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                Activo hace 51 días
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 mt-4 md:mt-0">
                        <button className="p-3 bg-[#2D2D2D] border border-[#333] rounded-full hover:bg-[#3f3f3f]">
                            <Star size={20} />
                        </button>
                        <button className="px-8 py-3 bg-cyan-500 text-white font-bold rounded-lg hover:bg-cyan-600 transition-colors">
                            Copiar
                        </button>
                    </div>
                </div>
            </div>

            {/* Informacion & Reglas Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#232323] p-6 rounded-2xl border border-[#333]">
                    <h3 className="text-xl font-semibold mb-4">Información</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-gray-400">Número de cuenta</span><span>657237</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Nombre del servidor</span><span>MT5</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Tipo de cuenta</span><span>CopyFX MT5 Prime</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Verificado</span><span className="text-green-500 font-semibold">Sí</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Saldo de la cuenta</span><span>5 000.23 USD</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Capital administrado</span><span>75 009.73 USD</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Apalancamiento</span><span>1:300</span></div>
                    </div>
                </div>
                <div className="bg-[#232323] p-6 rounded-2xl border border-[#333]">
                    <h3 className="text-xl font-semibold mb-4">Reglas</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-gray-400">Nombre de la estrategia</span><span>Nombre estrategia</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Depósito mínimo</span><span>100 USD</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Tipo de comisión</span><span>20%</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Frecuencia de pagos</span><span>1 semana</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Modo de copia</span><span>Proporcional</span></div>
                    </div>
                </div>
            </div>

            {/* 5 Cards Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-[#232323] p-6 rounded-2xl border border-[#333]"><h4 className="text-gray-400 text-sm">Comisión Por Rendimiento</h4><p className="font-bold text-2xl mt-1">35%</p></div>
                <div className="bg-[#232323] p-6 rounded-2xl border border-[#333]"><h4 className="text-gray-400 text-sm">Moneda De La Cuenta</h4><p className="font-bold text-2xl mt-1">USD</p></div>
                <div className="bg-[#232323] p-6 rounded-2xl border border-[#333]"><h4 className="text-gray-400 text-sm">Capital Propio Del Gestor</h4><p className="font-bold text-2xl mt-1">$1.572,98 USD</p></div>
                <div className="bg-[#232323] p-6 rounded-2xl border border-[#333] sm:col-span-1 lg:col-span-1"><h4 className="text-gray-400 text-sm">Saldo Del Gestor</h4><p className="font-bold text-2xl mt-1">$1.570,67 USD</p></div>
                <div className="bg-[#232323] p-6 rounded-2xl border border-[#333] sm:col-span-1 lg:col-span-2"><h4 className="text-gray-400 text-sm">Período De Operación</h4><p className="font-bold text-2xl mt-1">1 Mes</p></div>
            </div>

            {/* 8 Performance Cards Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#232323] p-4 rounded-2xl border border-[#333]"><h4 className="text-gray-400 text-sm mb-1">Rentabilidad total</h4><p className="font-bold text-lg">8.91%</p><p className="text-xs text-gray-400">6.298,99 USD</p></div>
                <div className="bg-[#232323] p-4 rounded-2xl border border-[#333]"><h4 className="text-gray-400 text-sm mb-1">Seguidores Actuales</h4><p className="font-bold text-lg flex items-center">20 <span className="text-xs text-green-500 flex items-center ml-2">(+24.7% <ArrowUpRight size={12} className="inline"/>)</span></p></div>
                <div className="bg-[#232323] p-4 rounded-2xl border border-[#333]"><h4 className="text-gray-400 text-sm mb-1">Operaciones</h4><p className="font-bold text-lg">7</p></div>
                <div className="bg-[#232323] p-4 rounded-2xl border border-[#333]">
                    <h4 className="text-gray-400 text-sm mb-1">Win Rate</h4>
                    <p className="text-xs text-gray-500">Operaciones Rentables</p>
                    <p className="font-bold text-lg mt-1">6 <span className="text-sm font-normal text-gray-400">(85.71%)</span></p>
                </div>
                <div className="bg-[#232323] p-4 rounded-2xl border border-[#333]"><h4 className="text-gray-400 text-sm mb-1">Retracción Máxima</h4><p className="font-bold text-lg text-red-500">-48.40%</p></div>
                <div className="bg-[#232323] p-4 rounded-2xl border border-[#333]"><h4 className="text-gray-400 text-sm mb-1">Promedio de Ganancia</h4><p className="font-bold text-lg">5%</p></div>
                <div className="bg-[#232323] p-4 rounded-2xl border border-[#333]"><h4 className="text-gray-400 text-sm mb-1">Beneficio</h4><p className="text-xs">Mayor <span className="font-bold text-sm block">1,915.17 USD</span></p><p className="text-xs">Menor <span className="font-bold text-sm block text-red-500">-124.75 USD</span></p></div>
                <div className="bg-[#232323] p-4 rounded-2xl border border-[#333]"><h4 className="text-gray-400 text-sm mb-1">Suscriptores Activos</h4><p className="font-bold text-lg">8</p></div>
            </div>

            {/* Chart Section */}
            <div className="bg-gradient-to-br from-[#232323] to-[#282828] p-6 rounded-2xl border border-[#333]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                    <div className="flex space-x-1 sm:space-x-2">
                        {['Rendimiento', 'Retracción', 'Balance'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab ? 'bg-[#2D2D2D] border border-cyan-500 text-white' : 'text-gray-400 hover:bg-[#2D2D2D]'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="relative mt-3 sm:mt-0">
                        <select className="bg-[#2D2D2D] border border-[#333] rounded-lg py-2 pl-4 pr-8 appearance-none focus:outline-none focus:ring-1 focus:ring-cyan-500">
                            <option>Filtrar por</option>
                        </select>
                    </div>
                </div>
                {renderChart()}
            </div>
        </div>
    );
};

export default PammDashboard; 