/**
 * WAVELENGTH Event Bus
 * 
 * Simple event system for decoupling components in the merchandise store.
 * Allows components to communicate without direct references.
 */

class WavelengthEventBus {
  constructor() {
    this.listeners = new Map();
    this.debugMode = false;
  }
  
  /**
   * Enable/disable debug logging
   * @param {boolean} enabled - Enable debug mode
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }
  
  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   * @param {Object} options - Subscription options
   * @returns {function} Unsubscribe function
   */
  on(event, callback, options = {}) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    const listener = {
      callback,
      once: options.once || false,
      priority: options.priority || 0,
      id: Math.random().toString(36).substr(2, 9)
    };
    
    this.listeners.get(event).push(listener);
    
    // Sort by priority (higher priority first)
    this.listeners.get(event).sort((a, b) => b.priority - a.priority);
    
    if (this.debugMode) {
      console.log(`📡 EventBus: Subscribed to '${event}' (id: ${listener.id})`);
    }
    
    // Return unsubscribe function
    return () => this.off(event, listener.id);
  }
  
  /**
   * Subscribe to an event once (auto-unsubscribe after first trigger)
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   * @returns {function} Unsubscribe function
   */
  once(event, callback) {
    return this.on(event, callback, { once: true });
  }
  
  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {string} listenerId - Listener ID
   */
  off(event, listenerId) {
    if (!this.listeners.has(event)) {
      return;
    }
    
    const listeners = this.listeners.get(event);
    const index = listeners.findIndex(l => l.id === listenerId);
    
    if (index >= 0) {
      listeners.splice(index, 1);
      
      // Clean up empty event arrays
      if (listeners.length === 0) {
        this.listeners.delete(event);
      }
      
      if (this.debugMode) {
        console.log(`📡 EventBus: Unsubscribed from '${event}' (id: ${listenerId})`);
      }
    }
  }
  
  /**
   * Emit an event to all subscribers
   * @param {string} event - Event name
   * @param {*} data - Event data
   * @param {Object} options - Emit options
   */
  emit(event, data, options = {}) {
    if (!this.listeners.has(event)) {
      if (this.debugMode) {
        console.log(`📡 EventBus: No listeners for '${event}'`);
      }
      return;
    }
    
    const listeners = this.listeners.get(event);
    const listenersToRemove = [];
    
    if (this.debugMode) {
      console.log(`📡 EventBus: Emitting '${event}' to ${listeners.length} listeners`, data);
    }
    
    // Execute callbacks
    for (const listener of listeners) {
      try {
        if (options.async) {
          // Async execution
          setTimeout(() => {
            listener.callback(data, event);
          }, 0);
        } else {
          // Sync execution
          listener.callback(data, event);
        }
        
        // Mark once listeners for removal
        if (listener.once) {
          listenersToRemove.push(listener.id);
        }
        
      } catch (error) {
        console.error(`📡 EventBus: Error in listener for '${event}':`, error);
      }
    }
    
    // Remove once listeners
    for (const listenerId of listenersToRemove) {
      this.off(event, listenerId);
    }
  }
  
  /**
   * Emit an event asynchronously
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emitAsync(event, data) {
    this.emit(event, data, { async: true });
  }
  
  /**
   * Clear all listeners for an event
   * @param {string} event - Event name (optional, clears all if not provided)
   */
  clear(event) {
    if (event) {
      this.listeners.delete(event);
      if (this.debugMode) {
        console.log(`📡 EventBus: Cleared all listeners for '${event}'`);
      }
    } else {
      this.listeners.clear();
      if (this.debugMode) {
        console.log('📡 EventBus: Cleared all listeners');
      }
    }
  }
  
  /**
   * Get list of active events
   * @returns {string[]} Array of event names
   */
  getEvents() {
    return Array.from(this.listeners.keys());
  }
  
  /**
   * Get listener count for an event
   * @param {string} event - Event name
   * @returns {number} Number of listeners
   */
  getListenerCount(event) {
    return this.listeners.has(event) ? this.listeners.get(event).length : 0;
  }
  
  /**
   * Get debug information
   * @returns {Object} Debug info
   */
  getDebugInfo() {
    const info = {
      totalEvents: this.listeners.size,
      events: {}
    };
    
    for (const [event, listeners] of this.listeners) {
      info.events[event] = {
        listenerCount: listeners.length,
        listeners: listeners.map(l => ({
          id: l.id,
          once: l.once,
          priority: l.priority
        }))
      };
    }
    
    return info;
  }
}

// Create singleton instance
const wavelengthEventBus = new WavelengthEventBus();

// Export both class and singleton
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WavelengthEventBus, wavelengthEventBus };
}

// Make available in browser global scope
if (typeof window !== 'undefined') {
  window.WavelengthEventBus = WavelengthEventBus;
  window.wavelengthEventBus = wavelengthEventBus;
}