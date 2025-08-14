import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { supabase } from '../supabase/config';
import { toast } from 'react-hot-toast';

const SyncButton = ({ accountNumber, size = 'small' }) => {
  const [syncing, setSyncing] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  
  useEffect(() => {
    // Check if there's a cooldown stored in localStorage
    const cooldownKey = `sync_cooldown_${accountNumber}`;
    const storedCooldown = localStorage.getItem(cooldownKey);
    
    if (storedCooldown) {
      const remainingTime = Math.max(0, parseInt(storedCooldown) - Date.now());
      if (remainingTime > 0) {
        setCooldown(Math.ceil(remainingTime / 1000));
        
        const interval = setInterval(() => {
          const remaining = Math.max(0, parseInt(storedCooldown) - Date.now());
          setCooldown(Math.ceil(remaining / 1000));
          
          if (remaining <= 0) {
            clearInterval(interval);
            localStorage.removeItem(cooldownKey);
          }
        }, 1000);
        
        return () => clearInterval(interval);
      }
    }
  }, [accountNumber]);
  
  const handleSync = async () => {
    if (syncing || cooldown > 0) return;
    
    setSyncing(true);
    
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please login to sync account');
        return;
      }
      
      // Call sync endpoint
      const response = await fetch(
        `https://apekapital.com:444/api/v1/sync/account/${accountNumber}/request`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Sync requested! Data will update within 30 seconds.');
        
        // Set 5 minute cooldown
        const cooldownTime = Date.now() + (5 * 60 * 1000);
        localStorage.setItem(`sync_cooldown_${accountNumber}`, cooldownTime.toString());
        setCooldown(300); // 5 minutes in seconds
        
        // Start countdown
        const interval = setInterval(() => {
          setCooldown(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              localStorage.removeItem(`sync_cooldown_${accountNumber}`);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
      } else if (response.status === 429) {
        // Rate limit exceeded
        toast.error(data.detail || 'Please wait before syncing again');
        
        // Set cooldown based on response
        setCooldown(60);
      } else {
        toast.error(data.detail || 'Failed to request sync');
      }
      
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to connect to sync service');
    } finally {
      setSyncing(false);
    }
  };
  
  const formatCooldown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  };
  
  const isDisabled = syncing || cooldown > 0;
  
  if (size === 'small') {
    return (
      <button
        onClick={handleSync}
        disabled={isDisabled}
        className={`
          inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md
          transition-all duration-200
          ${isDisabled 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-blue-50 text-blue-600 hover:bg-blue-100 active:scale-95'
          }
        `}
        title={cooldown > 0 ? `Wait ${formatCooldown(cooldown)}` : 'Sync account data'}
      >
        <RefreshCw 
          size={14} 
          className={syncing ? 'animate-spin' : ''} 
        />
        {cooldown > 0 ? formatCooldown(cooldown) : 'Sync'}
      </button>
    );
  }
  
  return (
    <button
      onClick={handleSync}
      disabled={isDisabled}
      className={`
        inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
        transition-all duration-200
        ${isDisabled 
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
          : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-sm'
        }
      `}
    >
      <RefreshCw 
        size={18} 
        className={syncing ? 'animate-spin' : ''} 
      />
      {cooldown > 0 ? `Sync available in ${formatCooldown(cooldown)}` : 'Sync Account'}
    </button>
  );
};

export default SyncButton;