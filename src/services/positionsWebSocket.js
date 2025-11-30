/**
 * WebSocket service for real-time position updates
 * Connects to Python backend and receives position changes from MT5
 */

import { getApiConfig } from './config';

class PositionsWebSocketService {
  constructor() {
    this.ws = null;
    this.login = null;
    this.listeners = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000; // Start with 2 seconds
    this.isConnecting = false;
    this.shouldReconnect = true;
    this.pingInterval = null;
  }

  /**
   * Get WebSocket URL based on API config
   */
  getWebSocketUrl(login) {
    const config = getApiConfig();
    // Convert http(s) to ws(s)
    const wsProtocol = config.baseUrl.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = config.baseUrl.replace(/^https?/, wsProtocol);
    return `${wsUrl}/ws/positions/${login}`;
  }

  /**
   * Connect to WebSocket for a specific login
   * @param {number|string} login - MT5 account login
   * @returns {Promise<boolean>} - Connection success
   */
  connect(login) {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN && this.login === login) {
        // Already connected to this login
        resolve(true);
        return;
      }

      // Disconnect from previous login if different
      if (this.ws && this.login !== login) {
        this.disconnect();
      }

      if (this.isConnecting) {
        resolve(false);
        return;
      }

      this.isConnecting = true;
      this.login = login;
      this.shouldReconnect = true;

      try {
        const wsUrl = this.getWebSocketUrl(login);
        console.log(`[WS] Connecting to ${wsUrl}`);

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log(`[WS] Connected for login ${login}`);
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 2000;
          this.startPingInterval();
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (e) {
            // Might be a pong or other non-JSON message
            if (event.data !== 'pong') {
              console.warn('[WS] Failed to parse message:', event.data);
            }
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WS] Error:', error);
          this.isConnecting = false;
        };

        this.ws.onclose = (event) => {
          console.log(`[WS] Closed for login ${login}. Code: ${event.code}`);
          this.isConnecting = false;
          this.stopPingInterval();

          if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        // Timeout for connection
        setTimeout(() => {
          if (this.isConnecting) {
            this.isConnecting = false;
            this.ws?.close();
            reject(new Error('Connection timeout'));
          }
        }, 10000);

      } catch (error) {
        this.isConnecting = false;
        console.error('[WS] Failed to create WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    this.shouldReconnect = false;
    this.stopPingInterval();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.login = null;
    this.reconnectAttempts = 0;
    console.log('[WS] Disconnected');
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(data) {
    const { type } = data;

    switch (type) {
      case 'connected':
        console.log('[WS] Server confirmed connection');
        break;

      case 'ping':
        // Server ping, respond with pong
        this.send('pong');
        break;

      case 'position_add':
      case 'position_update':
      case 'position_delete':
      case 'positions_clean':
      case 'initial':
        // Notify all listeners
        this.notifyListeners(data);
        break;

      default:
        console.log('[WS] Unknown message type:', type);
    }
  }

  /**
   * Add a listener for position updates
   * @param {Function} callback - Function to call with position data
   * @returns {Function} - Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.add(callback);

    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of a position update
   */
  notifyListeners(data) {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (e) {
        console.error('[WS] Error in listener:', e);
      }
    });
  }

  /**
   * Send a message to the WebSocket
   */
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof message === 'string' ? message : JSON.stringify(message));
    }
  }

  /**
   * Start ping interval to keep connection alive
   */
  startPingInterval() {
    this.stopPingInterval();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send('ping');
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop ping interval
   */
  stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Schedule a reconnection attempt
   */
  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);

    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (this.shouldReconnect && this.login) {
        this.connect(this.login).catch(e => {
          console.error('[WS] Reconnection failed:', e);
        });
      }
    }, delay);
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get current login
   */
  getCurrentLogin() {
    return this.login;
  }
}

// Export singleton instance
export const positionsWebSocket = new PositionsWebSocketService();

export default positionsWebSocket;
