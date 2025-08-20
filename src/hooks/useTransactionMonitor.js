/**
 * Hook for real-time transaction monitoring
 * Monitors deposits, withdrawals, and transfers status changes
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabase/config';
import { logger } from '../utils/logger';
import toast from 'react-hot-toast';

export const useTransactionMonitor = (userId, onStatusChange) => {
  const subscriptionsRef = useRef([]);

  const handleTransactionUpdate = useCallback((type, payload) => {
    logger.info(`[TransactionMonitor] ${type} update:`, payload);
    
    if (payload.eventType === 'UPDATE') {
      const oldStatus = payload.old?.status;
      const newStatus = payload.new?.status;
      
      if (oldStatus !== newStatus && newStatus) {
        // Notify user based on transaction type and status
        let message = '';
        let toastType = 'default';
        
        switch(type) {
          case 'deposit':
            if (newStatus === 'confirmed') {
              message = `✅ Depósito de $${payload.new.amount} confirmado`;
              toastType = 'success';
            } else if (newStatus === 'failed') {
              message = `❌ Depósito de $${payload.new.amount} rechazado`;
              toastType = 'error';
            } else if (newStatus === 'processing') {
              message = `⏳ Depósito de $${payload.new.amount} en proceso`;
            }
            break;
            
          case 'withdrawal':
            if (newStatus === 'approved') {
              message = `✅ Retiro de $${payload.new.amount} aprobado`;
              toastType = 'success';
            } else if (newStatus === 'completed') {
              message = `💰 Retiro de $${payload.new.amount} completado`;
              toastType = 'success';
            } else if (newStatus === 'rejected') {
              message = `❌ Retiro de $${payload.new.amount} rechazado`;
              if (payload.new.rejection_reason) {
                message += `: ${payload.new.rejection_reason}`;
              }
              toastType = 'error';
            } else if (newStatus === 'processing') {
              message = `⏳ Retiro de $${payload.new.amount} procesándose`;
            }
            break;
            
          case 'transfer':
            if (newStatus === 'approved') {
              message = `✅ Transferencia de $${payload.new.amount} aprobada`;
              toastType = 'success';
            } else if (newStatus === 'completed') {
              message = `💸 Transferencia de $${payload.new.amount} completada`;
              toastType = 'success';
            } else if (newStatus === 'rejected') {
              message = `❌ Transferencia de $${payload.new.amount} rechazada`;
              if (payload.new.rejection_reason) {
                message += `: ${payload.new.rejection_reason}`;
              }
              toastType = 'error';
            }
            break;
        }
        
        // Show toast notification
        if (message) {
          if (toastType === 'success') {
            toast.success(message, { duration: 5000 });
          } else if (toastType === 'error') {
            toast.error(message, { duration: 5000 });
          } else {
            toast(message, { duration: 4000 });
          }
        }
        
        // Call callback if provided
        if (onStatusChange) {
          onStatusChange({
            type,
            transactionId: payload.new.id,
            oldStatus,
            newStatus,
            data: payload.new
          });
        }
      }
    }
  }, [onStatusChange]);

  const setupSubscriptions = useCallback(() => {
    if (!userId) {
      logger.warn('[TransactionMonitor] No userId provided');
      return;
    }

    logger.info('[TransactionMonitor] Setting up subscriptions for user:', userId);
    
    // Clean up existing subscriptions
    cleanupSubscriptions();
    
    // Subscribe to deposits
    const depositsChannel = supabase
      .channel(`user-deposits-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deposits',
          filter: `user_id=eq.${userId}`
        },
        (payload) => handleTransactionUpdate('deposit', payload)
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('[TransactionMonitor] Subscribed to deposits');
        }
      });
    
    subscriptionsRef.current.push(depositsChannel);
    
    // Subscribe to withdrawals
    const withdrawalsChannel = supabase
      .channel(`user-withdrawals-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawals',
          filter: `user_id=eq.${userId}`
        },
        (payload) => handleTransactionUpdate('withdrawal', payload)
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('[TransactionMonitor] Subscribed to withdrawals');
        }
      });
    
    subscriptionsRef.current.push(withdrawalsChannel);
    
    // Subscribe to internal transfers
    const transfersChannel = supabase
      .channel(`user-transfers-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'internal_transfers',
          filter: `user_id=eq.${userId}`
        },
        (payload) => handleTransactionUpdate('transfer', payload)
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('[TransactionMonitor] Subscribed to transfers');
        }
      });
    
    subscriptionsRef.current.push(transfersChannel);
  }, [userId, handleTransactionUpdate]);

  const cleanupSubscriptions = useCallback(() => {
    subscriptionsRef.current.forEach(channel => {
      logger.info('[TransactionMonitor] Removing channel:', channel.topic);
      supabase.removeChannel(channel);
    });
    subscriptionsRef.current = [];
  }, []);

  // Setup subscriptions when userId changes
  useEffect(() => {
    setupSubscriptions();
    
    // Cleanup on unmount
    return () => {
      cleanupSubscriptions();
    };
  }, [setupSubscriptions, cleanupSubscriptions]);

  // Return functions for manual control if needed
  return {
    refresh: setupSubscriptions,
    cleanup: cleanupSubscriptions
  };
};

export default useTransactionMonitor;