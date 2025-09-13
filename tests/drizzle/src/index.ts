import express from 'express';
import { auth } from './auth.js';

const app = express();
const PORT = process.env.PORT || 3000;
// Middleware
app.use(express.json());
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
  const users = await (await auth.$context).adapter.findMany({
    model: "user",
  })
  console.log({users})
  res.json({
    message: 'Better Auth Test Project',
    description: 'This is a test project for Better Auth Studio',
    users: JSON.stringify(users, null, 2),
    endpoints: {
      health: '/health',
      auth: '/api/auth/*'
    }
  });
});

// Better Auth routes
app.use('/api/auth', auth.handler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Better Auth Test Project running on http://localhost:${PORT}`);
});
