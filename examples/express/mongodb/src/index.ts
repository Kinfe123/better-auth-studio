import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { connectToDatabase, closeDatabase } from './db';
import { auth } from './auth';
import { toNodeHandler } from "better-auth/node";

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = new Set([
  'http://localhost:3002',
  'http://127.0.0.1:3002',
]);

// Connect to MongoDB before starting server
connectToDatabase().then(() => {
  console.log('✅ MongoDB connected, server ready');
}).catch((error) => {
  console.error('❌ Failed to connect to MongoDB:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await closeDatabase();
  process.exit(0);
});

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

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Better Auth MongoDB Example Running',
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
    res.json({
      message: 'Better Auth MongoDB Example',
      description: 'This is an example project for Better Auth Studio with MongoDB',
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
  console.log(`🚀 Better Auth MongoDB Example running on http://localhost:${PORT}`);
  console.log(`📊 MongoDB URI: ${process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017'}`);
});

