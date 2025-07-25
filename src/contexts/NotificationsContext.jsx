import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationsContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

// Tipos de notificaciones
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  TRADING: 'trading',
  ACCOUNT: 'account',
  PAYMENT: 'payment'
};

// Iconos para cada tipo de notificación
export const NOTIFICATION_ICONS = {
  [NOTIFICATION_TYPES.SUCCESS]: '/trophy_competition.png',
  [NOTIFICATION_TYPES.INFO]: '/Bell.svg',
  [NOTIFICATION_TYPES.WARNING]: '/shield.png',
  [NOTIFICATION_TYPES.ERROR]: '/shield.png',
  [NOTIFICATION_TYPES.TRADING]: '/graph.png',
  [NOTIFICATION_TYPES.ACCOUNT]: '/coins.png',
  [NOTIFICATION_TYPES.PAYMENT]: '/Money.png'
};

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Cargar notificaciones del localStorage al inicializar
  useEffect(() => {
    const savedNotifications = localStorage.getItem('agm_notifications');
    if (savedNotifications) {
      const parsed = JSON.parse(savedNotifications);
      setNotifications(parsed);
      setUnreadCount(parsed.filter(n => !n.read).length);
    }
  }, []);

  // Guardar notificaciones en localStorage cuando cambien
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('agm_notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  // Función para agregar una nueva notificación
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    return newNotification.id;
  };

  // Función para marcar una notificación como leída
  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Función para marcar todas como leídas
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  // Función para eliminar una notificación
  const deleteNotification = (notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(current => Math.max(0, current - 1));
      }
      return prev.filter(n => n.id !== notificationId);
    });
  };

  // Función para limpiar todas las notificaciones
  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('agm_notifications');
  };

  // Funciones de conveniencia para diferentes tipos de notificaciones
  const notifyAccountCreated = (accountName, accountType) => {
    return addNotification({
      type: NOTIFICATION_TYPES.ACCOUNT,
      title: 'Cuenta Creada',
      message: `Tu cuenta "${accountName}" (${accountType}) ha sido creada exitosamente`,
      icon: NOTIFICATION_ICONS[NOTIFICATION_TYPES.ACCOUNT]
    });
  };

  const notifyDeposit = (amount, accountName) => {
    return addNotification({
      type: NOTIFICATION_TYPES.PAYMENT,
      title: 'Depósito Realizado',
      message: `Depósito de $${amount.toFixed(2)} realizado en ${accountName}`,
      icon: NOTIFICATION_ICONS[NOTIFICATION_TYPES.PAYMENT]
    });
  };

  const notifyWithdrawal = (amount, accountName) => {
    return addNotification({
      type: NOTIFICATION_TYPES.PAYMENT,
      title: 'Retiro Procesado',
      message: `Retiro de $${amount.toFixed(2)} procesado desde ${accountName}`,
      icon: NOTIFICATION_ICONS[NOTIFICATION_TYPES.PAYMENT]
    });
  };

  const notifyTransfer = (amount, fromAccount, toAccount) => {
    return addNotification({
      type: NOTIFICATION_TYPES.TRADING,
      title: 'Transferencia Completada',
      message: `$${amount.toFixed(2)} transferidos de ${fromAccount} a ${toAccount}`,
      icon: NOTIFICATION_ICONS[NOTIFICATION_TYPES.TRADING]
    });
  };

  const notifyTradingGoal = (goalType, amount, accountName) => {
    return addNotification({
      type: NOTIFICATION_TYPES.SUCCESS,
      title: 'Objetivo Alcanzado',
      message: `¡Has ${goalType} tu objetivo de $${amount.toFixed(2)} en ${accountName}!`,
      icon: NOTIFICATION_ICONS[NOTIFICATION_TYPES.SUCCESS]
    });
  };

  const notifyError = (title, message) => {
    return addNotification({
      type: NOTIFICATION_TYPES.ERROR,
      title: title || 'Error',
      message: message || 'Ha ocurrido un error inesperado',
      icon: NOTIFICATION_ICONS[NOTIFICATION_TYPES.ERROR]
    });
  };

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    // Funciones de conveniencia
    notifyAccountCreated,
    notifyDeposit,
    notifyWithdrawal,
    notifyTransfer,
    notifyTradingGoal,
    notifyError
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export default NotificationsContext; 