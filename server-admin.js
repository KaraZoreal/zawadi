// Simple backend server for admin API endpoints
// Run with: node server-admin.js

import http from 'http';
import url from 'url';

const PORT = 5174;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@zawadi.app';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const adminSessions = new Map(); // Simple session storage

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  let body = '';
  req.on('data', chunk => body += chunk);

  req.on('end', () => {
    try {
      const payload = body ? JSON.parse(body) : {};

      // Admin login endpoint
      if (pathname === '/api/admin/login' && req.method === 'POST') {
        if (payload.email === ADMIN_EMAIL && payload.password === ADMIN_PASSWORD) {
          const token = btoa(`${payload.email}:${Date.now()}`);
          adminSessions.set(token, { email: payload.email, created: Date.now() });

          res.writeHead(200);
          res.end(JSON.stringify({
            user: {
              id: 'admin-1',
              email: payload.email,
              name: 'Admin',
              role: 'admin',
              is_paid: true,
              plan: 'admin'
            },
            token
          }));
        } else {
          res.writeHead(401);
          res.end(JSON.stringify({ error: 'Invalid admin credentials' }));
        }
        return;
      }

      // Check admin token for other endpoints
      const authHeader = req.headers.authorization || '';
      const token = authHeader.replace('Bearer ', '');
      const isAdmin = token && adminSessions.has(token);

      // Admin users endpoint
      if (pathname === '/api/admin/users' && req.method === 'GET') {
        if (!isAdmin) {
          res.writeHead(401);
          res.end(JSON.stringify({ error: 'Admin authentication required' }));
          return;
        }

        // Mock data - in production this would query Supabase
        res.writeHead(200);
        res.end(JSON.stringify({
          users: [],
          subscriptions: [],
          subscriptionStats: {},
          categories: [],
          sources: [],
          ingestion: { configured: false, endpoint: '/api/ingest', botInjected: 0, recent: [] },
          audit: { issues: [], summary: { total: 0, critical: 0, warning: 0, info: 0 } },
          plans: [],
          stats: { totalApplications: 0, totalDocuments: 0, missingLinks: 0 }
        }));
        return;
      }

      // Admin scholarships endpoint
      if (pathname === '/api/admin/scholarships' && req.method === 'GET') {
        if (!isAdmin) {
          res.writeHead(401);
          res.end(JSON.stringify({ error: 'Admin authentication required' }));
          return;
        }

        // Mock data - in production this would query Supabase
        res.writeHead(200);
        res.end(JSON.stringify({
          scholarships: [],
          stats: {
            totalScholarships: 0,
            verifiedScholarships: 0,
            unverifiedScholarships: 0
          }
        }));
        return;
      }

      // Default 404
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));

    } catch (error) {
      console.error('Error:', error);
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Invalid request' }));
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Admin API server running on http://127.0.0.1:${PORT}`);
  console.log(`Default credentials: admin@zawadi.app / admin123`);
});
