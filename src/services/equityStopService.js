/**
 * Equity Stop Service
 * Frontend service for managing equity stop events and notifications
 * Uses Python API proxy which forwards to Copy-PAMM service
 */

import { supabase } from '../supabase/config';

// Use main API URL (Python proxies to Copy-PAMM)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BROKER_API_URL || 'https://apekapital.com:444';

/**
 * Get the auth token from Supabase session
 */
const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
};

/**
 * Make authenticated API request
 */
const apiRequest = async (endpoint, options = {}) => {
    const token = await getAuthToken();
    if (!token) {
        throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/equity-stop${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'API request failed');
    }

    return response.json();
};

/**
 * Get all equity stop events for the current user
 */
export const getEquityStopEvents = async (status = null) => {
    const params = status ? `?status=${status}` : '';
    return apiRequest(`/events${params}`);
};

/**
 * Get triggered events (for alert banners)
 */
export const getTriggeredEvents = async () => {
    return apiRequest('/triggered');
};

/**
 * Resume a paused subscription
 */
export const resumeSubscription = async (eventId) => {
    return apiRequest(`/resume/${eventId}`, { method: 'POST' });
};

/**
 * Cancel a paused subscription
 */
export const cancelSubscription = async (eventId) => {
    return apiRequest(`/cancel/${eventId}`, { method: 'POST' });
};

/**
 * Get user notifications
 */
export const getNotifications = async (unreadOnly = false) => {
    const params = unreadOnly ? '?unread_only=true' : '';
    return apiRequest(`/notifications${params}`);
};

/**
 * Mark notification as read
 */
export const markNotificationRead = async (notificationId) => {
    return apiRequest(`/notifications/${notificationId}/read`, { method: 'PUT' });
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsRead = async () => {
    return apiRequest('/notifications/read-all', { method: 'PUT' });
};

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = async () => {
    const notifications = await getNotifications(true);
    return notifications.length;
};

export default {
    getEquityStopEvents,
    getTriggeredEvents,
    resumeSubscription,
    cancelSubscription,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    getUnreadNotificationCount
};
