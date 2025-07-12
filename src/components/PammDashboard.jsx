import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, BarChart2, Star, ArrowUpRight, CheckCircle, LineChart, BarChartHorizontal, PieChart, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, CartesianGrid, Tooltip } from 'recharts';
import { getPammFunds } from '../services/pammService';
import InvertirPAMMModal from './InvertirPAMMModal';

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
    // Filter states
    const [filters, setFilters] = useState({
        misFavoritos: false,
        tasaRendimiento: false,
        deposito: false
    });
    const [selectedAge, setSelectedAge] = useState('');
    const [selectedCommission, setSelectedCommission] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Data states
    const [allPammData, setAllPammData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPammData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const funds = await getPammFunds();
                
                // Asegurarse de que funds sea un array antes de mapear
                if (!Array.isArray(funds)) {
                    console.warn("[PammDashboard] getPammFunds no devolvió un array. Se recibió:", funds);
                    setAllPammData([]); // Establecer como array vacío para evitar errores
                    return;
                }

                // El frontend espera campos como 'nombre', 'rendimiento', etc.
                // Mapeamos la respuesta de la API a la estructura que necesita el componente.
                const formattedFunds = funds.map((fund, index) => ({
                    ranking: index + 1,
                    id: fund.id, // ID del fondo PAMM
                    nombre: fund.name || 'Estrategia sin nombre',
                    serverType: 'MT5', // Asumimos MT5 o lo obtenemos de la API
                    cuenta: fund.masterMt5AccountId,
                    pnl: fund.performance?.total_pnl_usd?.toFixed(2) || '0.00',
                    rendimiento: `${fund.performance?.total_pnl_percentage?.toFixed(2) || 0}%`,
                    rendimientoNumerico: fund.performance?.total_pnl_percentage || 0,
                    retraccionMax: `-${fund.performance?.max_drawdown?.toFixed(2) || 0}%`,
                    cuentaAbierta: `${fund.performance?.age_days || 0} días`,
                    diasAbierta: fund.performance?.age_days || 0,
                    depositoMinimo: `${fund.min_investment?.toFixed(2) || '100.00'} USD`,
                    depositoNumerico: fund.min_investment || 100,
                    balancePropio: fund.performance?.balance?.toFixed(2) || '0.00',
                    capitalAdministrado: fund.performance?.managed_capital?.toFixed(2) || '0.00',
                    gananciasUltimoMes: '0.00', // Este dato podría necesitar un cálculo específico en el backend
                    inversores: fund.investors_count || 0,
                    comision: fund.performance_fee || 0,
                    esFavorito: false // La lógica de favoritos se implementará por separado
                }));
                setAllPammData(formattedFunds);
            } catch (err) {
                setError('No se pudieron cargar los fondos PAMM. El servicio puede no estar disponible.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPammData();
    }, []);

    // Filter logic
    const getFilteredData = () => {
        let filtered = [...allPammData];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(trader => 
                trader.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                trader.cuenta.includes(searchTerm)
            );
        }

        // Checkbox filters
        if (filters.misFavoritos) {
            filtered = filtered.filter(trader => trader.esFavorito);
        }

        if (filters.tasaRendimiento) {
            filtered = filtered.sort((a, b) => b.rendimientoNumerico - a.rendimientoNumerico);
        }

        if (filters.deposito) {
            filtered = filtered.sort((a, b) => a.depositoNumerico - b.depositoNumerico);
        }

        // Age filter
        if (selectedAge) {
            const ageFilters = {
                '1mes': (days) => days >= 30,
                '2meses': (days) => days >= 60,
                '3meses': (days) => days >= 90,
                '6meses': (days) => days >= 180,
                '1año': (days) => days >= 365
            };
            
            if (ageFilters[selectedAge]) {
                filtered = filtered.filter(trader => ageFilters[selectedAge](trader.diasAbierta));
            }
        }

        // Commission filter
        if (selectedCommission) {
            const commissionFilters = {
                'sinComision': (comision) => comision === 0,
                '1-5': (comision) => comision >= 1 && comision <= 5,
                '5-10': (comision) => comision >= 5 && comision <= 10,
                '10-20': (comision) => comision >= 10 && comision <= 20,
                '20-30': (comision) => comision >= 20 && comision <= 30,
                '30+': (comision) => comision > 30
            };
            
            if (commissionFilters[selectedCommission]) {
                filtered = filtered.filter(trader => commissionFilters[selectedCommission](trader.comision));
            }
        }

        return filtered;
    };

    const pammData = getFilteredData();

    const handleFilterChange = (filterName) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: !prev[filterName]
        }));
    };

    if (isLoading) {
        return (
            <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] text-white p-8 rounded-3xl text-center">
                <h1 className="text-2xl font-bold">Cargando fondos PAMM...</h1>
                <p className="text-gray-400 mt-2">Por favor, espere un momento.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] text-white p-8 rounded-3xl text-center">
                <h1 className="text-2xl font-bold text-red-500">Error</h1>
                <p className="text-gray-400 mt-2">{error}</p>
            </div>
        );
    }

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
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-[#2D2D2D] border border-[#333] rounded-lg py-2 pl-10 pr-4 w-full md:w-80 text-white"
                    />
                    <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
            </div>

            {/* Filters */}
            <div className="space-y-6 mb-8">
                <div>
                    <h3 className="text-lg font-semibold mb-3">Filtrar por</h3>
                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={filters.misFavoritos}
                                onChange={() => handleFilterChange('misFavoritos')}
                                className="form-checkbox bg-transparent border-[#333] rounded text-cyan-500 focus:ring-cyan-500" 
                            />
                            <span>Mis favoritos</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={filters.tasaRendimiento}
                                onChange={() => handleFilterChange('tasaRendimiento')}
                                className="form-checkbox bg-transparent border-[#333] rounded text-cyan-500 focus:ring-cyan-500" 
                            />
                            <span>Tasa de rendimiento</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={filters.deposito}
                                onChange={() => handleFilterChange('deposito')}
                                className="form-checkbox bg-transparent border-[#333] rounded text-cyan-500 focus:ring-cyan-500" 
                            />
                            <span>Depósito</span>
                        </label>
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-3">Antiguedad</h3>
                    <div className="flex flex-wrap gap-3">
                        {[
                            { key: '1mes', label: '+1 mes' },
                            { key: '2meses', label: '+2 meses' },
                            { key: '3meses', label: '+3 meses' },
                            { key: '6meses', label: '+6 meses' },
                            { key: '1año', label: '+1 año' }
                        ].map(age => (
                            <button 
                                key={age.key} 
                                onClick={() => setSelectedAge(selectedAge === age.key ? '' : age.key)}
                                className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
                                    selectedAge === age.key 
                                        ? 'bg-cyan-600 border border-cyan-500 text-white' 
                                        : 'bg-[#2D2D2D] border border-[#333] hover:bg-[#3f3f3f]'
                                }`}
                            >
                                {age.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-3">Comisión</h3>
                    <div className="flex flex-wrap gap-3">
                        {[
                            { key: 'sinComision', label: 'Trader sin comisión' },
                            { key: '1-5', label: '1%-5%' },
                            { key: '5-10', label: '5%-10%' },
                            { key: '10-20', label: '10%-20%' },
                            { key: '20-30', label: '20%-30%' },
                            { key: '30+', label: '+30%' }
                        ].map(commission => (
                            <button 
                                key={commission.key} 
                                onClick={() => setSelectedCommission(selectedCommission === commission.key ? '' : commission.key)}
                                className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
                                    selectedCommission === commission.key 
                                        ? 'bg-cyan-600 border border-cyan-500 text-white' 
                                        : 'bg-[#2D2D2D] border border-[#333] hover:bg-[#3f3f3f]'
                                }`}
                            >
                                {commission.label}
                            </button>
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
                        {pammData.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <p className="text-lg mb-2">No se encontraron traders</p>
                                <p className="text-sm">Intenta ajustar los filtros para ver más resultados</p>
                            </div>
                        ) : (
                            pammData.map((trader) => (
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
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const PammDetailView = ({ trader, onBack }) => {
    const [activeTab, setActiveTab] = useState('Rendimiento');
    const [timeFilter, setTimeFilter] = useState('mensual');
    const [showInvertirModal, setShowInvertirModal] = useState(false);

    const chartData = {
        'Rendimiento': {
            mensual: { data: [ { name: 'Ene', value: 3.2 }, { name: 'Feb', value: 5.0 }, { name: 'Mar', value: 4.5 }, { name: 'Abr', value: 7.9 }, { name: 'May', value: 10.0 }, { name: 'Jun', value: 8.5 }, { name: 'Jul', value: 13.2 }, { name: 'Ago', value: 15.0 }, { name: 'Sep', value: 14.4 }, { name: 'Oct', value: 18.0 }, { name: 'Nov', value: 15.2 }, { name: 'Dic', value: 19.8 } ], max: 30, step: 5 },
            trimestral: { data: [ { name: 'Q1', value: 12.7 }, { name: 'Q2', value: 26.4 }, { name: 'Q3', value: 42.6 }, { name: 'Q4', value: 53.0 } ], max: 60, step: 10 }
        },
        'Retracción': {
            mensual: { data: [ { name: 'Ene', value: 2 }, { name: 'Feb', value: 3 }, { name: 'Mar', value: 2.5 }, { name: 'Abr', value: 4 }, { name: 'May', value: 5.5 }, { name: 'Jun', value: 4.2 }, { name: 'Jul', value: 6 }, { name: 'Ago', value: 7 }, { name: 'Sep', value: 6.5 }, { name: 'Oct', value: 8 }, { name: 'Nov', value: 7.2 }, { name: 'Dic', value: 9 } ], max: 15, step: 3 },
            trimestral: { data: [ { name: 'Q1', value: 7.5 }, { name: 'Q2', value: 13.7 }, { name: 'Q3', value: 19.5 }, { name: 'Q4', value: 24.2 } ], max: 30, step: 5 }
        },
        'Balance': {
            mensual: { data: [ { name: 'Ene', value: 10 }, { name: 'Feb', value: 12 }, { name: 'Mar', value: 11 }, { name: 'Abr', value: 15 }, { name: 'May', value: 18 }, { name: 'Jun', value: 16 }, { name: 'Jul', value: 22 }, { name: 'Ago', value: 25 }, { name: 'Sep', value: 24 }, { name: 'Oct', value: 28 }, { name: 'Nov', value: 26 }, { name: 'Dic', value: 30 } ], max: 40, step: 10 },
            trimestral: { data: [ { name: 'Q1', value: 33 }, { name: 'Q2', value: 49 }, { name: 'Q3', value: 71 }, { name: 'Q4', value: 84 } ], max: 100, step: 20 }
        }
    };

    const getBarColor = (value, maxValue) => {
        const minLightness = 25; 
        const maxLightness = 75; 
        const lightness = minLightness + (value / maxValue) * (maxLightness - minLightness);
        return `hsl(191, 95%, ${lightness}%)`;
    };

    const renderChart = () => {
        const currentChart = chartData[activeTab][timeFilter];
        
        return (
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <BarChart data={currentChart.data} margin={{ top: 20, right: 0, left: -20, bottom: 5 }}>
                        <CartesianGrid vertical={false} stroke="#373737" />
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} domain={[0, currentChart.max]}/>
                        <Tooltip
                          cursor={false}
                          contentStyle={{
                            backgroundColor: '#232323',
                            border: '1px solid #333',
                            borderRadius: '8px',
                            fontSize: '14px',
                            color: '#ffffff',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          labelStyle={{ color: '#ffffff' }}
                          itemStyle={{ color: '#ffffff' }}
                          formatter={(value) => [`${value.toFixed(1)}%`, activeTab]}
                          labelFormatter={(label) => `${timeFilter === 'mensual' ? 'Mes' : 'Trimestre'}: ${label}`}
                        />
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
            <div className="mb-4">
              <img 
                src="/Back.svg" 
                alt="Back" 
                onClick={onBack}
                className="w-10 h-10 cursor-pointer hover:brightness-75 transition-all duration-300"
              />
                </div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center -mt-8">
                    <div className="flex items-center space-x-4">
                    <img src="/Foto.svg" alt={trader.nombre} className="w-16 h-16 rounded-full border-2 border-cyan-400" />
                        <div>
                        <h1 className="text-2xl font-bold">{trader.nombre}</h1>
                        <p className="text-gray-400">ID de la estrategia: {trader.cuenta}</p>
                    </div>
                </div>
                <button 
                    onClick={() => setShowInvertirModal(true)}
                    className="mt-4 md:mt-0 flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-full px-6 py-2 transition-colors font-medium"
                >
                    <TrendingUp size={18} />
                    Invertir en Fondo
                </button>
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
                        <select 
                            value={timeFilter}
                            onChange={(e) => setTimeFilter(e.target.value)}
                            className="bg-[#2D2D2D] border border-[#333] rounded-lg py-2 pl-4 pr-8 appearance-none focus:outline-none focus:ring-1 focus:ring-cyan-500 text-white"
                        >
                            <option value="mensual">Mensual</option>
                            <option value="trimestral">Trimestral</option>
                        </select>
                    </div>
                </div>
                {renderChart()}
            </div>

            {/* Modal de Invertir en PAMM */}
            <InvertirPAMMModal 
                isOpen={showInvertirModal}
                onClose={() => setShowInvertirModal(false)}
                gestor={trader}
                onConfirm={(formData) => {
                    console.log('Inversión PAMM confirmada:', formData);
                    // Aquí integrarías con tu API para procesar la inversión
                }}
            />
        </div>
    );
};

export default PammDashboard; 