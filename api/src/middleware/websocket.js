import { eventEmitter } from '../services/events.js';
import { verifyToken } from './auth.js';

/**
 * WebSocket connection handler
 * This middleware processes WebSocket upgrade requests and manages connections
 */
export function setupWebSocketHandler(server) {
  if (!server.ws) {
    console.warn('WebSocket support not available in this environment');
    return null;
  }

  const connections = new Map();

  server.ws('/api/realtime', {
    async open(ws) {
      try {
        // Get user from initial message
        console.log('[WebSocket] New connection');
        // Store connection
        const connectionId = Math.random().toString(36).substr(2, 9);
        connections.set(connectionId, { ws, userId: null, channels: new Set() });

        ws.send(JSON.stringify({
          type: 'connection',
          message: 'Connected to real-time events',
          connectionId
        }));
      } catch (error) {
        console.error('[WebSocket] Open error:', error);
      }
    },

    async message(ws, message) {
      try {
        const data = JSON.parse(message.toString());
        const connectionId = Array.from(connections.entries()).find(([id, conn]) => conn.ws === ws)?.[0];

        if (!connectionId) return;

        const connection = connections.get(connectionId);

        switch (data.type) {
          case 'auth':
            // Authenticate connection
            try {
              const decoded = verifyToken(data.token);
              connection.userId = decoded.sub;
              ws.send(JSON.stringify({
                type: 'auth_success',
                userId: decoded.sub
              }));
            } catch (error) {
              ws.send(JSON.stringify({
                type: 'auth_error',
                error: 'Invalid token'
              }));
              ws.close(1008, 'Authentication failed');
            }
            break;

          case 'subscribe':
            // Subscribe to channel
            const channel = data.channel;
            connection.channels.add(channel);
            ws.send(JSON.stringify({
              type: 'subscribed',
              channel
            }));

            // Listen to this channel
            const unsubscribe = eventEmitter.subscribe(channel, (event) => {
              ws.send(JSON.stringify({
                type: 'event',
                channel,
                data: event
              }));
            });

            // Store unsubscribe function for cleanup
            if (!connection.unsubscribers) {
              connection.unsubscribers = [];
            }
            connection.unsubscribers.push(unsubscribe);
            break;

          case 'unsubscribe':
            // Unsubscribe from channel
            connection.channels.delete(data.channel);
            ws.send(JSON.stringify({
              type: 'unsubscribed',
              channel: data.channel
            }));
            break;

          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;

          default:
            console.warn('[WebSocket] Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('[WebSocket] Message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          error: 'Failed to process message'
        }));
      }
    },

    async close(ws) {
      try {
        const connectionId = Array.from(connections.entries()).find(([id, conn]) => conn.ws === ws)?.[0];
        if (connectionId) {
          const connection = connections.get(connectionId);
          // Clean up subscriptions
          if (connection.unsubscribers) {
            connection.unsubscribers.forEach(unsub => unsub());
          }
          connections.delete(connectionId);
          console.log('[WebSocket] Connection closed:', connectionId);
        }
      } catch (error) {
        console.error('[WebSocket] Close error:', error);
      }
    },

    error(ws, error) {
      console.error('[WebSocket] Error:', error);
    }
  });

  return {
    broadcast: (channel, event) => {
      connections.forEach((connection) => {
        if (connection.channels.has(channel)) {
          connection.ws.send(JSON.stringify({
            type: 'event',
            channel,
            data: event
          }));
        }
      });
    },
    getConnectionCount: () => connections.size,
    getConnections: () => Array.from(connections.values())
  };
}

export default setupWebSocketHandler;
