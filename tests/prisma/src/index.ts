import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { auth } from './auth.js';
import { toNodeHandler } from "better-auth/node";

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = new Set([
  'http://localhost:3002',
  'http://127.0.0.1:3002',
]);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

// Middleware
// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Better Auth Test Project Running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', async (req, res) => {
  try {
    const sessionResponse = await auth.api.getSession({ headers: req.headers });
    const recentAccounts = await (await auth.$context).adapter.findMany({
      model: 'account',
      where: [{ field: 'providerId', value: 'github' }],
      limit: 5,
    });
    const recentUsers = await (await auth.$context).adapter.findMany({
      model: 'user',
      limit: 5,
    });
    const sessions = await (await auth.$context).adapter.findMany({
      model: 'session',
      limit: 5,
    });
    console.log({recentAccounts, recentUsers, sessions})

    res.json({
      message: 'Better Auth Test Project',
      description: 'This is a test project for Better Auth Studio',
      sessions: JSON.stringify(sessions, null, 2),
      userCount: recentUsers.length,
      endpoints: {
        health: '/health',
        auth: '/api/auth/*'
      }
    });
  } catch (error) {
    console.error('Root route error:', error);
    res.status(500).json({ error: 'Failed to load data', details: error instanceof Error ? error.message : String(error) });
  }
});

// Better Auth routes
app.use('/api/auth/*', (req, res, next) => {
  console.log(`[AUTH] ${req.method} ${req.originalUrl} - ${req.ip}`);
  return toNodeHandler(auth)(req, res);
});
// Start server
app.listen(PORT, () => {
  console.log(`🚀 Better Auth Test Project running on http://localhost:${PORT}`);
});
