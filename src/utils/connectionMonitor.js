// Performance monitoring utilities for API and WebSocket connections
export class ConnectionMonitor {
  constructor() {
    this.metrics = {
      apiCalls: new Map(),
      websocketConnections: new Map(),
      errors: []
    };
  }

  // Track API call performance
  trackApiCall(endpoint, startTime, endTime, success = true, error = null) {
    const duration = endTime - startTime;
    const existing = this.metrics.apiCalls.get(endpoint) || {
      calls: 0,
      totalDuration: 0,
      successCount: 0,
      errorCount: 0,
      errors: []
    };

    existing.calls += 1;
    existing.totalDuration += duration;
    
    if (success) {
      existing.successCount += 1;
    } else {
      existing.errorCount += 1;
      if (error) {
        existing.errors.push({
          timestamp: endTime,
          error: error.message || error,
          duration
        });
      }
    }

    this.metrics.apiCalls.set(endpoint, existing);

    // Log slow API calls
    if (duration > 5000) { // 5 seconds
      console.warn(`[ConnectionMonitor] Slow API call detected: ${endpoint} took ${duration}ms`);
    }
  }

  // Track WebSocket connection events
  trackWebSocketEvent(url, event, metadata = {}) {
    const existing = this.metrics.websocketConnections.get(url) || {
      connections: 0,
      disconnections: 0,
      errors: 0,
      totalUptime: 0,
      lastConnected: null,
      events: []
    };

    existing.events.push({
      timestamp: Date.now(),
      event,
      metadata
    });

    switch (event) {
      case 'connected':
        existing.connections += 1;
        existing.lastConnected = Date.now();
        break;
      case 'disconnected':
        existing.disconnections += 1;
        if (existing.lastConnected) {
          existing.totalUptime += Date.now() - existing.lastConnected;
        }
        break;
      case 'error':
        existing.errors += 1;
        break;
    }

    this.metrics.websocketConnections.set(url, existing);
  }

  // Get performance summary
  getPerformanceSummary() {
    const apiSummary = {};
    for (const [endpoint, data] of this.metrics.apiCalls.entries()) {
      apiSummary[endpoint] = {
        avgDuration: data.totalDuration / data.calls,
        successRate: (data.successCount / data.calls) * 100,
        totalCalls: data.calls,
        recentErrors: data.errors.slice(-5) // Last 5 errors
      };
    }

    const websocketSummary = {};
    for (const [url, data] of this.metrics.websocketConnections.entries()) {
      websocketSummary[url] = {
        reliability: data.connections > 0 ? ((data.connections - data.errors) / data.connections) * 100 : 0,
        avgUptime: data.connections > 0 ? data.totalUptime / data.connections : 0,
        totalConnections: data.connections,
        totalErrors: data.errors
      };
    }

    return {
      api: apiSummary,
      websocket: websocketSummary,
      totalErrors: this.metrics.errors.length
    };
  }

  // Get connection health score (0-100)
  getHealthScore() {
    const summary = this.getPerformanceSummary();
    let score = 100;

    // Penalize for API errors
    Object.values(summary.api).forEach(api => {
      if (api.successRate < 95) score -= (95 - api.successRate);
      if (api.avgDuration > 2000) score -= Math.min(20, (api.avgDuration - 2000) / 100);
    });

    // Penalize for WebSocket issues
    Object.values(summary.websocket).forEach(ws => {
      if (ws.reliability < 90) score -= (90 - ws.reliability);
    });

    return Math.max(0, Math.round(score));
  }

  // Clear old metrics (keep last hour)
  cleanup() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    // Clean up API call errors
    for (const [, data] of this.metrics.apiCalls.entries()) {
      data.errors = data.errors.filter(error => error.timestamp > oneHourAgo);
    }

    // Clean up WebSocket events  
    for (const [, data] of this.metrics.websocketConnections.entries()) {
      data.events = data.events.filter(event => event.timestamp > oneHourAgo);
    }

    // Clean up general errors
    this.metrics.errors = this.metrics.errors.filter(error => error.timestamp > oneHourAgo);
  }

  // Export metrics for debugging
  exportMetrics() {
    return {
      timestamp: Date.now(),
      metrics: {
        api: Object.fromEntries(this.metrics.apiCalls),
        websocket: Object.fromEntries(this.metrics.websocketConnections),
        errors: this.metrics.errors
      },
      summary: this.getPerformanceSummary(),
      healthScore: this.getHealthScore()
    };
  }
}

// Global instance
export const connectionMonitor = new ConnectionMonitor();

// Auto-cleanup every 30 minutes
setInterval(() => {
  connectionMonitor.cleanup();
}, 30 * 60 * 1000);
