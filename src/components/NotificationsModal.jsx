import React, { useState } from 'react';
import { X, Trash2, Check, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationsContext';

const NotificationsModal = ({ onClose }) => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    deleteNotification, 
    clearAllNotifications, 
    markAllAsRead 
  } = useNotifications();

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deletingNotificationId, setDeletingNotificationId] = useState(null);

  const handleMarkAsRead = (notificationId) => {
    markAsRead(notificationId);
  };

  const handleDeleteNotification = (notificationId) => {
    setDeletingNotificationId(notificationId);
    setShowConfirmDelete(true);
  };

  const confirmDelete = () => {
    if (deletingNotificationId) {
      deleteNotification(deletingNotificationId);
    } else {
      // Eliminar todas
      clearAllNotifications();
    }
    setShowConfirmDelete(false);
    setDeletingNotificationId(null);
  };

  const cancelDelete = () => {
    setShowConfirmDelete(false);
    setDeletingNotificationId(null);
  };

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    setDeletingNotificationId(null); // null indica eliminar todas
    setShowConfirmDelete(true);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `hace ${diffInMinutes} min`;
    } else if (diffInHours < 24) {
      return `hace ${Math.floor(diffInHours)} h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
        onClick={showConfirmDelete ? null : onClose}
      ></div>
      
      {/* Modal content */}
      <div className="bg-[#232323] border border-[#333] rounded-3xl w-full max-w-xl max-h-[80vh] overflow-hidden z-10">
        <div className="p-4 flex justify-between items-center border-b border-[#333]">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl text-white font-medium">Notificaciones</h2>
            {unreadCount > 0 && (
              <span className="bg-cyan-500 text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors focus:outline-none text-sm flex items-center gap-1"
                    title="Marcar todas como leídas"
                  >
                    <Check size={16} />
                    Leídas
                  </button>
                )}
                <button
                  onClick={handleClearAll}
                  disabled={notifications.length === 0}
                  className="text-red-400 hover:text-red-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors focus:outline-none text-sm flex items-center gap-1"
                  title={notifications.length === 0 ? "No hay notificaciones" : "Eliminar todas"}
                >
                  <Trash2 size={16} />
                  Limpiar ({notifications.length})
                </button>
              </>
            )}
          <button 
            onClick={onClose}
            className="text-gray-400 bg-transparent hover:text-white transition-colors focus:outline-none"
          >
              <X size={24} />
          </button>
          </div>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
          {notifications.length === 0 ? (
            // Estado vacío
            <div className="p-8 flex flex-col items-center justify-center">
              <div className="rounded-full bg-[#2d2d2d] p-4 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <p className="text-gray-400 text-center">No tienes notificaciones</p>
              <p className="text-gray-500 text-center text-sm mt-1">Las notificaciones aparecerán aquí cuando realices acciones</p>
            </div>
          ) : (
            // Lista de notificaciones
            notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 border-b border-[#333] hover:bg-[#2a2a2a] transition-colors relative ${
                  !notification.read ? 'bg-[#2a2a2a]/50' : ''
                }`}
              >
                {/* Indicador de no leída */}
                {!notification.read && (
                  <div className="absolute top-4 left-2 w-2 h-2 bg-cyan-500 rounded-full"></div>
                )}
                
                <div className="flex items-start pl-4">
                  <div className="flex-shrink-0 mr-4">
                    <div className="bg-[#2d2d2d] p-2 rounded-full">
                      <img 
                        src={notification.icon} 
                        alt="Notification icon" 
                        className="w-8 h-8"
                        onError={(e) => {
                          e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24'%3E%3Cpath fill='%23888' d='M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 18C11.45 18 11 17.55 11 17S11.45 16 12 16S13 16.45 13 17S12.55 18 12 18ZM13 14H11V6H13V14Z'/%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white text-lg font-medium mb-1">{notification.title}</h3>
                        <p className="text-gray-400 text-sm mb-2 break-words">{notification.message}</p>
                        <p className="text-gray-500 text-xs">{formatTimestamp(notification.timestamp)}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-cyan-400 hover:text-cyan-300 transition-colors focus:outline-none"
                            title="Marcar como leída"
                          >
                            <Check size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="text-red-400 hover:text-red-300 transition-colors focus:outline-none"
                          title="Eliminar notificación"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black bg-opacity-70"></div>
          <div className="bg-[#1a1a1a] border border-red-500/20 rounded-2xl w-full max-w-md z-10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-500/20 p-2 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">
                {deletingNotificationId ? 'Eliminar Notificación' : 'Limpiar Todas'}
              </h3>
            </div>
            
            <p className="text-gray-300 mb-6">
              {deletingNotificationId 
                ? '¿Estás seguro de que quieres eliminar esta notificación? Esta acción no se puede deshacer.'
                : `¿Estás seguro de que quieres eliminar todas las notificaciones (${notifications.length})? Esta acción no se puede deshacer.`
              }
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-[#333] text-white rounded-xl hover:bg-[#404040] transition-colors focus:outline-none"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors focus:outline-none flex items-center gap-2"
              >
                <Trash2 size={16} />
                {deletingNotificationId ? 'Eliminar' : 'Limpiar Todo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsModal;