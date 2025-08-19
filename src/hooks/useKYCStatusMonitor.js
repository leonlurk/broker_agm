import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';
import kycService from '../services/kycService';

const useKYCStatusMonitor = () => {
  const { currentUser } = useAuth();
  const { notifyKYCApproved, notifyKYCRejected } = useNotifications();
  const previousStatusRef = useRef(null);
  const intervalRef = useRef(null);
  
  useEffect(() => {
    if (!currentUser?.uid) return;
    
    const checkKYCStatus = async () => {
      try {
        const userId = currentUser.id || currentUser.uid;
        const status = await kycService.getKYCStatus(userId);
        
        // Check if status has changed
        if (previousStatusRef.current && previousStatusRef.current !== status.status) {
          // Status changed, send notification
          if (status.status === 'approved') {
            notifyKYCApproved();
          } else if (status.status === 'rejected') {
            notifyKYCRejected(status.details?.rejectionReason);
          }
        }
        
        previousStatusRef.current = status.status;
      } catch (error) {
        console.error('Error checking KYC status:', error);
      }
    };
    
    // Initial check
    checkKYCStatus();
    
    // Set up periodic checking (every 30 seconds)
    intervalRef.current = setInterval(checkKYCStatus, 30000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentUser, notifyKYCApproved, notifyKYCRejected]);
};

export default useKYCStatusMonitor;