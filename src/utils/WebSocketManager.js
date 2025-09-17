// Enhanced WebSocket connection utilities
export class WebSocketManager {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      maxReconnectAttempts: 5,
      reconnectInterval: 1000,
      heartbeatInterval: 30000,
      connectionTimeout: 10000,
      ...options
    };
    
    this.ws = null;
    this.reconnectAttempts = 0;
    this.isConnecting = false;
    this.shouldReconnect = true;
    this.heartbeatTimer = null;
    this.connectionTimer = null;
    
    this.eventHandlers = {
      open: [],
      close: [],
      error: [],
      message: []
    };
  }

  connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    console.log(`[WebSocket] Attempting to connect to ${this.url}`);

    try {
      this.ws = new WebSocket(this.url);
      
      // Set connection timeout
      this.connectionTimer = setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          console.error('[WebSocket] Connection timeout');
          this.ws.close();
          this.handleConnectionFailure();
        }
      }, this.options.connectionTimeout);

      this.ws.onopen = (event) => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        if (this.connectionTimer) {
          clearTimeout(this.connectionTimer);
          this.connectionTimer = null;
        }

        console.log('[WebSocket] Connected successfully');
        this.startHeartbeat();
        this.emit('open', event);
      };

      this.ws.onclose = (event) => {
        this.isConnecting = false;
        this.stopHeartbeat();
        
        if (this.connectionTimer) {
          clearTimeout(this.connectionTimer);
          this.connectionTimer = null;
        }

        console.log(`[WebSocket] Closed: ${event.code} ${event.reason}`);
        this.emit('close', event);

        // Handle reconnection
        if (this.shouldReconnect && this.reconnectAttempts < this.options.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (event) => {
        console.error('[WebSocket] Error:', event);
        this.emit('error', event);
      };

      this.ws.onmessage = (event) => {
        this.emit('message', event);
      };

    } catch (error) {
      this.isConnecting = false;
      console.error('[WebSocket] Connection error:', error);
      this.handleConnectionFailure();
    }
  }

  handleConnectionFailure() {
    if (this.shouldReconnect && this.reconnectAttempts < this.options.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else {
      console.error('[WebSocket] Max reconnection attempts reached');
      this.emit('error', new Error('Max reconnection attempts reached'));
    }
  }

  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(
      this.options.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect();
      }
    }, delay);
  }

  startHeartbeat() {
    if (this.options.heartbeatInterval <= 0) return;

    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.options.heartbeatInterval);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
      return true;
    }
    console.warn('[WebSocket] Cannot send message - connection not open');
    return false;
  }

  close() {
    this.shouldReconnect = false;
    this.stopHeartbeat();
    
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  on(event, handler) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].push(handler);
    }
  }

  off(event, handler) {
    if (this.eventHandlers[event]) {
      const index = this.eventHandlers[event].indexOf(handler);
      if (index > -1) {
        this.eventHandlers[event].splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[WebSocket] Error in ${event} handler:`, error);
        }
      });
    }
  }

  getReadyState() {
    return this.ws ? this.ws.readyState : WebSocket.CLOSED;
  }

  getConnectionInfo() {
    return {
      url: this.url,
      readyState: this.getReadyState(),
      reconnectAttempts: this.reconnectAttempts,
      isConnecting: this.isConnecting,
      shouldReconnect: this.shouldReconnect
    };
  }
}
