import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'better-auth';

if (!MONGODB_URI) {
  throw new Error('Missing MONGODB_URI or MONGO_URI in environment variables');
}

const mongodb = new MongoClient(MONGODB_URI).db(DB_NAME);

const client = mongodb.client;

export async function connectToDatabase() {
  try {
    if (!client.topology?.isConnected()) {
      await client.connect();
    }
    console.log(`✅ MongoDB Connected: ${mongodb.databaseName}`);
    return { client, db: mongodb };
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

connectToDatabase().catch((error: unknown) => {
  if (process.env.NODE_ENV !== 'test') {
    console.warn('⚠️  MongoDB connection will be established when first accessed.');
    console.warn('   Make sure MongoDB is running before using Better Auth Studio.');
  }
});

export async function closeDatabase() {
  if (client && client.topology?.isConnected()) {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

export default mongodb;

