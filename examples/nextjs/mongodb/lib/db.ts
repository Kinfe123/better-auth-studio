import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'better-auth';

if (!MONGODB_URI) {
  throw new Error('Missing MONGODB_URI or MONGO_URI in environment variables');
}

const mongodb = new MongoClient(MONGODB_URI).db(DB_NAME);

const client = mongodb.client;
// @ts-ignore
if (!client.topology?.isConnected()) {
  client.connect().catch((error) => {
    console.error('MongoDB connection error:', error);
  });
}

export default mongodb;

