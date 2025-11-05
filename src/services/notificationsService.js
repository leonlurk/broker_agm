import { supabase } from '../supabase/config';

/**
 * Obtener notificaciones del usuario
 */
export const getUserNotifications = async (userId, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notifications:', error);
      return { success: false, error: error.message };
    }

    return { success: true, notifications: data || [] };
  } catch (error) {
    console.error('Error in getUserNotifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Marcar notificación como leída
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Marcar todas las notificaciones como leídas
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in markAllNotificationsAsRead:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Eliminar notificación
 */
export const deleteNotification = async (notificationId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteNotification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Eliminar todas las notificaciones del usuario
 */
export const clearAllNotifications = async (userId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error clearing all notifications:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in clearAllNotifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Suscribirse a notificaciones en tiempo real
 */
export const subscribeToNotifications = (userId, callback) => {
  const subscription = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('[Notifications] New notification received:', payload.new);
        callback(payload.new);
      }
    )
    .subscribe();

  return subscription;
};
