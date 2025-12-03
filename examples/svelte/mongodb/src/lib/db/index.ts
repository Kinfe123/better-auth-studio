import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'better-auth';

if (!MONGODB_URI) {
  throw new Error('Missing MONGODB_URI or MONGO_URI in environment variables');
}

// Create MongoDB client and database instance (simpler approach, like your example)
// The connection will be established automatically when first accessed
const mongodb = new MongoClient(MONGODB_URI).db(DB_NAME);

// Get the client for connection management (for SvelteKit SSR)
const client = mongodb.client;

// Connect to MongoDB if not already connected (for SvelteKit)
if (!client.topology?.isConnected()) {
  client.connect().catch((error) => {
    console.error('MongoDB connection error:', error);
  });
}

export default mongodb;
