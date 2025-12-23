import 'dotenv/config';
import express from 'express';
import { auth } from './auth.js';
import { toNodeHandler } from 'better-auth/node';
import { betterAuthStudio } from 'better-auth-studio/express';
import studioConfig from '../studio.config';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Better Auth Test Project Running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/studio', betterAuthStudio(studioConfig));

app.get('/', async (req, res) => {
  res.json({
    message: 'Better Auth Test Project',
    description: 'This is a test project for Better Auth Studio',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      studio: '/api/studio'
    }
  });
});

app.all('/api/auth/*', toNodeHandler(auth));

app.listen(PORT, () => {
  console.log(`🚀 Better Auth Test Project running on http://localhost:${PORT}`);
});
