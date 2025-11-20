import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Play, StopCircle } from 'lucide-react';
import { getTriggeredEvents, resumeSubscription, cancelSubscription } from '../services/equityStopService';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

/**
 * EquityStopAlert Component
 * Shows alert banner when subscription/investment is paused due to 30% equity loss
 */
const EquityStopAlert = ({ subscriptionType, onActionComplete }) => {
    const { t } = useTranslation();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState({});

    // Load triggered events
    useEffect(() => {
        const loadEvents = async () => {
            try {
                const data = await getTriggeredEvents();
                // Filter by subscription type if provided
                const filtered = subscriptionType
                    ? data.filter(e => e.subscription_type === subscriptionType)
                    : data;
                setEvents(filtered);
            } catch (error) {
                console.error('[EquityStopAlert] Error loading events:', error);
            } finally {
                setLoading(false);
            }
        };

        loadEvents();
    }, [subscriptionType]);

    const handleResume = async (eventId) => {
        setActionLoading(prev => ({ ...prev, [eventId]: 'resume' }));
        try {
            await resumeSubscription(eventId);
            setEvents(prev => prev.filter(e => e.id !== eventId));
            toast.success('Suscripcion reactivada exitosamente');
            onActionComplete?.('resumed', eventId);
        } catch (error) {
            console.error('[EquityStopAlert] Error resuming:', error);
            toast.error(error.message || 'Error al reactivar');
        } finally {
            setActionLoading(prev => ({ ...prev, [eventId]: null }));
        }
    };

    const handleCancel = async (eventId) => {
        if (!window.confirm('Esta seguro de que desea cancelar esta suscripcion? Esta accion no se puede deshacer.')) {
            return;
        }

        setActionLoading(prev => ({ ...prev, [eventId]: 'cancel' }));
        try {
            await cancelSubscription(eventId);
            setEvents(prev => prev.filter(e => e.id !== eventId));
            toast.success('Suscripcion cancelada');
            onActionComplete?.('cancelled', eventId);
        } catch (error) {
            console.error('[EquityStopAlert] Error cancelling:', error);
            toast.error(error.message || 'Error al cancelar');
        } finally {
            setActionLoading(prev => ({ ...prev, [eventId]: null }));
        }
    };

    const handleDismiss = (eventId) => {
        setEvents(prev => prev.filter(e => e.id !== eventId));
    };

    if (loading || events.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3 mb-6">
            {events.map(event => (
                <div
                    key={event.id}
                    className="bg-gradient-to-r from-red-900/40 to-red-800/30 border border-red-600/50 rounded-xl p-4 animate-pulse-slow"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-red-500/20 rounded-lg flex-shrink-0">
                                <AlertTriangle size={24} className="text-red-500" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white mb-1">
                                    Proteccion de Capital Activada
                                </h3>
                                <p className="text-sm text-gray-300 mb-2">
                                    Tu {event.subscription_type === 'copy' ? 'Copy Trading con' : 'inversion en'}{' '}
                                    <span className="font-medium text-white">{event.subscription_name}</span>{' '}
                                    ha sido pausada por perdida del{' '}
                                    <span className="font-bold text-red-400">
                                        {event.loss_percentage.toFixed(1)}%
                                    </span>
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-400">
                                    <span>
                                        Equity inicial: ${event.initial_equity.toFixed(2)}
                                    </span>
                                    <span>
                                        Equity actual: ${event.current_equity.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => handleDismiss(event.id)}
                            className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-red-600/30">
                        <button
                            onClick={() => handleResume(event.id)}
                            disabled={actionLoading[event.id]}
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            {actionLoading[event.id] === 'resume' ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Reactivando...
                                </>
                            ) : (
                                <>
                                    <Play size={16} />
                                    Continuar
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => handleCancel(event.id)}
                            disabled={actionLoading[event.id]}
                            className="flex-1 bg-transparent hover:bg-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-red-600/50 flex items-center justify-center gap-2"
                        >
                            {actionLoading[event.id] === 'cancel' ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                                    Cancelando...
                                </>
                            ) : (
                                <>
                                    <StopCircle size={16} />
                                    Cancelar Suscripcion
                                </>
                            )}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default EquityStopAlert;
