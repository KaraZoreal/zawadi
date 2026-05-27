import { EventEmitter } from 'events';

/**
 * Global event emitter for real-time updates
 * In production, this would be replaced with a proper message queue
 * (Redis pub/sub, AWS SQS, Google Cloud Pub/Sub, etc)
 */
class RealTimeEvents extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
    this.subscribers = new Map();
  }

  /**
   * Subscribe to an event type
   */
  subscribe(channel, callback) {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    this.subscribers.get(channel).add(callback);
    this.on(channel, callback);

    // Return unsubscribe function
    return () => {
      this.unsubscribe(channel, callback);
    };
  }

  /**
   * Unsubscribe from an event
   */
  unsubscribe(channel, callback) {
    if (this.subscribers.has(channel)) {
      this.subscribers.get(channel).delete(callback);
    }
    this.removeListener(channel, callback);
  }

  /**
   * Publish scholarship update
   */
  publishScholarshipUpdate(scholarshipId, action, data) {
    const event = {
      type: 'scholarship',
      action, // publish, unpublish, update, delete
      scholarshipId,
      data,
      timestamp: new Date().toISOString()
    };

    this.emit('scholarships:update', event);
    this.emit(`scholarship:${scholarshipId}`, event);
  }

  /**
   * Publish subscription update
   */
  publishSubscriptionUpdate(userId, action, data) {
    const event = {
      type: 'subscription',
      action, // created, renewed, cancelled, upgraded
      userId,
      data,
      timestamp: new Date().toISOString()
    };

    this.emit('subscriptions:update', event);
    this.emit(`subscription:${userId}`, event);
  }

  /**
   * Publish user status update
   */
  publishUserStatusUpdate(userId, status, data = {}) {
    const event = {
      type: 'user_status',
      userId,
      status, // online, offline, active, inactive
      data,
      timestamp: new Date().toISOString()
    };

    this.emit('users:status', event);
    this.emit(`user:${userId}:status`, event);
  }

  /**
   * Publish admin action for audit trail
   */
  publishAdminAction(adminId, action, resource, resourceId, changes) {
    const event = {
      type: 'admin_action',
      adminId,
      action,
      resource,
      resourceId,
      changes,
      timestamp: new Date().toISOString()
    };

    this.emit('admin:actions', event);
    this.emit(`admin:${adminId}:actions`, event);
  }

  /**
   * Publish payment event
   */
  publishPaymentEvent(userId, event_type, data) {
    const event = {
      type: 'payment',
      event_type,
      userId,
      data,
      timestamp: new Date().toISOString()
    };

    this.emit('payments:update', event);
    this.emit(`payment:${userId}`, event);
  }

  /**
   * Broadcast system notification
   */
  broadcastNotification(title, message, severity = 'info', metadata = {}) {
    const event = {
      type: 'notification',
      title,
      message,
      severity, // info, warning, error, success
      metadata,
      timestamp: new Date().toISOString()
    };

    this.emit('notifications:broadcast', event);
  }

  /**
   * Get subscriber count for monitoring
   */
  getSubscriberCount(channel = null) {
    if (!channel) {
      let total = 0;
      for (const subscribers of this.subscribers.values()) {
        total += subscribers.size;
      }
      return total;
    }
    return this.subscribers.get(channel)?.size || 0;
  }

  /**
   * Get all active channels
   */
  getActiveChannels() {
    return Array.from(this.subscribers.keys());
  }

  /**
   * Clear all subscribers (useful for cleanup)
   */
  clearAllSubscribers() {
    this.subscribers.clear();
    this.removeAllListeners();
  }
}

// Create singleton instance
export const eventEmitter = new RealTimeEvents();

export default eventEmitter;
