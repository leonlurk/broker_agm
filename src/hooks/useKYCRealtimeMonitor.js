/**
 * Hook para monitorear cambios de estado KYC en tiempo real usando Supabase
 */

import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { supabase } from '../supabase/config';
import { logger } from '../utils/logger';

const useKYCRealtimeMonitor = () => {
  const { currentUser } = useAuth();
  const { notifyKYCApproved, notifyKYCRejected } = useNotifications();
  const previousStatusRef = useRef(null);
  const subscriptionRef = useRef(null);
  
  useEffect(() => {
    if (!currentUser?.uid) return;
    
    const userId = currentUser.id || currentUser.uid;
    
    // Initial check to get current status
    const checkInitialStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('kyc_verifications')
          .select('status, rejection_reason')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (data && !error) {
          previousStatusRef.current = data.status;
          logger.info('[KYC Monitor] Initial status:', data.status);
        }
      } catch (error) {
        logger.error('[KYC Monitor] Error getting initial status:', error);
      }
    };
    
    // Set up realtime subscription for KYC verification changes
    const setupRealtimeSubscription = () => {
      subscriptionRef.current = supabase
        .channel(`kyc-status-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'kyc_verifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            logger.info('[KYC Monitor] Received update:', payload);
            handleKYCUpdate(payload.new);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            // Handle notifications from backend
            const notification = payload.new;
            if (notification.type === 'kyc_approved' || notification.type === 'kyc_rejected') {
              logger.info('[KYC Monitor] Received KYC notification:', notification);
              handleNotification(notification);
            }
          }
        )
        .subscribe((status) => {
          logger.info('[KYC Monitor] Subscription status:', status);
        });
    };
    
    // Handle KYC verification update
    const handleKYCUpdate = (newData) => {
      const newStatus = newData.status;
      const previousStatus = previousStatusRef.current;
      
      logger.info('[KYC Monitor] Status change:', { 
        previous: previousStatus, 
        new: newStatus 
      });
      
      // Only notify if status actually changed and is not the initial check
      if (previousStatus && previousStatus !== newStatus) {
        if (newStatus === 'approved') {
          notifyKYCApproved();
          logger.info('[KYC Monitor] KYC Approved - Notification sent');
        } else if (newStatus === 'rejected') {
          const reason = newData.rejection_reason || 'Por favor, revise los requisitos y vuelva a enviar sus documentos.';
          notifyKYCRejected(reason);
          logger.info('[KYC Monitor] KYC Rejected - Notification sent');
        }
      }
      
      previousStatusRef.current = newStatus;
    };
    
    // Handle notification from backend
    const handleNotification = (notification) => {
      // The notification from backend already contains the message
      // We can use it directly or trigger our local notification
      if (notification.type === 'kyc_approved' && !notification.read) {
        notifyKYCApproved();
      } else if (notification.type === 'kyc_rejected' && !notification.read) {
        const reason = notification.data?.rejection_reason || notification.message;
        notifyKYCRejected(reason);
      }
    };
    
    // Initialize
    checkInitialStatus();
    setupRealtimeSubscription();
    
    // Cleanup
    return () => {
      if (subscriptionRef.current) {
        logger.info('[KYC Monitor] Unsubscribing from realtime updates');
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [currentUser, notifyKYCApproved, notifyKYCRejected]);
  
  return null; // This hook doesn't return anything
};

export default useKYCRealtimeMonitor;