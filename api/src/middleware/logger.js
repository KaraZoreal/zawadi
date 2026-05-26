import fs from 'fs';
import path from 'path';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Logger middleware
 * Logs all incoming requests and responses
 */
export function requestLogger(req, res, next) {
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;

  // Store original res.json
  const originalJson = res.json;

  // Intercept responses
  res.json = function(data) {
    const duration = Date.now() - startTime;
    const memory = Math.round((process.memoryUsage().heapUsed - startMemory) / 1024);

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      memory: `${memory}kb`,
      userId: req.user?.id || 'anonymous',
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    // Log to file
    logToFile('access.log', logEntry);

    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${logEntry.statusCode}] ${req.method} ${req.path} (${duration}ms)`);
    }

    // Call original json
    return originalJson.call(this, data);
  };

  next();
}

/**
 * Error logger
 */
export function errorLogger(error, request, response, next) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'error',
    message: error.message,
    stack: error.stack,
    path: request.path,
    method: request.method,
    userId: request.user?.id || 'anonymous',
    ip: request.ip
  };

  logToFile('error.log', logEntry);
  console.error('[ERROR]', logEntry);

  next(error);
}

/**
 * Performance logger
 */
export function performanceLogger() {
  return (req, res, next) => {
    const startTime = performance.now();

    res.on('finish', () => {
      const duration = performance.now() - startTime;

      if (duration > 1000) {
        // Log slow requests (> 1 second)
        const logEntry = {
          timestamp: new Date().toISOString(),
          level: 'warn',
          message: 'Slow request detected',
          path: req.path,
          method: req.method,
          duration: `${duration.toFixed(2)}ms`,
          statusCode: res.statusCode
        };

        logToFile('slow-requests.log', logEntry);
        console.warn('[SLOW REQUEST]', logEntry);
      }
    });

    next();
  };
}

/**
 * Write log entry to file
 */
function logToFile(filename, data) {
  try {
    const logPath = path.join(logsDir, filename);
    const timestamp = new Date().toISOString().split('T')[0];
    const timestampedPath = path.join(logsDir, `${timestamp}-${filename}`);

    const logLine = `${JSON.stringify(data)}\n`;

    fs.appendFileSync(timestampedPath, logLine, 'utf8');
  } catch (error) {
    console.error('Error writing to log file:', error);
  }
}

/**
 * Get logs for admin dashboard
 */
export async function getAccessLogs(days = 1) {
  try {
    const logs = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const logPath = path.join(logsDir, `${dateStr}-access.log`);

      if (fs.existsSync(logPath)) {
        const content = fs.readFileSync(logPath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        logs.push(...lines.map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        }).filter(Boolean));
      }
    }

    return logs;
  } catch (error) {
    console.error('Error reading access logs:', error);
    return [];
  }
}

/**
 * Get error logs for admin dashboard
 */
export async function getErrorLogs(days = 1) {
  try {
    const logs = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const logPath = path.join(logsDir, `${dateStr}-error.log`);

      if (fs.existsSync(logPath)) {
        const content = fs.readFileSync(logPath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        logs.push(...lines.map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        }).filter(Boolean));
      }
    }

    return logs;
  } catch (error) {
    console.error('Error reading error logs:', error);
    return [];
  }
}
