/**
 * Test script for event ingestion with ClickHouse
 * 
 * Usage:
 * 1. Set up ClickHouse (Docker or cloud):
 *    docker run -d -p 8123:8123 -p 9000:9000 clickhouse/clickhouse-server
 * 
 * 2. Set environment variables:
 *    CLICKHOUSE_URL=http://localhost:8123
 *    CLICKHOUSE_USERNAME=default
 *    CLICKHOUSE_PASSWORD=
 * 
 * 3. Run this test:
 *    pnpm tsx test-events.ts
 */

import 'dotenv/config';
import { createClickHouseProvider, type AuthEvent } from 'better-auth-studio';

async function testClickHouseEvents() {
  console.log('🧪 Testing ClickHouse Event Ingestion...\n');

  // Check if ClickHouse URL is provided
  if (!process.env.CLICKHOUSE_URL) {
    console.error('❌ CLICKHOUSE_URL environment variable is not set');
    console.log('\n💡 To test with ClickHouse:');
    console.log('   1. Start ClickHouse: docker run -d -p 8123:8123 -p 9000:9000 clickhouse/clickhouse-server');
    console.log('   2. Set CLICKHOUSE_URL=http://localhost:8123');
    console.log('   3. Run this test again\n');
    process.exit(1);
  }

  try {
    // Import ClickHouse client
    const { createClient } = await import('@clickhouse/client');
    
    // Create ClickHouse client
    const client = createClient({
      url: process.env.CLICKHOUSE_URL,
      username: process.env.CLICKHOUSE_USERNAME || 'default',
      password: process.env.CLICKHOUSE_PASSWORD || '',
    });

    console.log('✅ ClickHouse client created');

    // The provider will automatically create the table if it doesn't exist
    // But we can also verify/create it manually for testing
    const tableName = 'auth_events';
    
    try {
      // Check if table exists
      await client.query({
        query: `EXISTS TABLE ${tableName}`,
        format: 'JSONEachRow',
      });
      console.log('✅ Events table already exists');
    } catch {
      // Table doesn't exist, create it
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
          id UUID,
          type String,
          timestamp DateTime,
          user_id Nullable(String),
          session_id Nullable(String),
          organization_id Nullable(String),
          metadata String,
          ip_address Nullable(String),
          user_agent Nullable(String),
          source String DEFAULT 'app',
          display_message Nullable(String),
          display_severity Nullable(String),
          created_at DateTime DEFAULT now()
        ) ENGINE = MergeTree()
        ORDER BY (timestamp, type)
        PARTITION BY toYYYYMM(timestamp);
      `;

      await client.exec({ query: createTableQuery });
      console.log('✅ Events table created');
    }

    // Create event provider
    const provider = createClickHouseProvider({
      client,
      table: tableName,
    });

    console.log('✅ Event provider created\n');

    // Test single event ingestion
    console.log('📤 Testing single event ingestion...');
    const testEvent: AuthEvent = {
      id: crypto.randomUUID(),
      type: 'user.joined',
      timestamp: new Date(),
      userId: 'test-user-123',
      metadata: {
        name: 'Test User',
        email: 'test@example.com',
      },
      source: 'app',
      display: {
        message: 'Test User joined!',
        severity: 'success',
      },
    };

    await provider.ingest(testEvent);
    console.log('✅ Single event ingested:', testEvent.display?.message);

    // Wait a bit for ClickHouse to process
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test batch event ingestion
    console.log('\n📤 Testing batch event ingestion...');
    const batchEvents: AuthEvent[] = [
      {
        id: crypto.randomUUID(),
        type: 'user.logged_in',
        timestamp: new Date(),
        userId: 'test-user-123',
        metadata: { name: 'Test User', email: 'test@example.com' },
        source: 'app',
        display: { message: 'Test User logged in', severity: 'success' },
      },
      {
        id: crypto.randomUUID(),
        type: 'user.logged_out',
        timestamp: new Date(),
        userId: 'test-user-123',
        metadata: { name: 'Test User', email: 'test@example.com' },
        source: 'app',
        display: { message: 'Test User logged out', severity: 'info' },
      },
      {
        id: crypto.randomUUID(),
        type: 'organization.created',
        timestamp: new Date(),
        userId: 'test-user-123',
        organizationId: 'org-123',
        metadata: { name: 'Test Org' },
        source: 'app',
        display: { message: 'New organization "Test Org" created', severity: 'success' },
      },
    ];

    if (provider.ingestBatch) {
      await provider.ingestBatch(batchEvents);
      console.log(`✅ Batch of ${batchEvents.length} events ingested`);
    } else {
      console.log('⚠️  Batch ingestion not supported, ingesting individually...');
      for (const event of batchEvents) {
        await provider.ingest(event);
      }
      console.log(`✅ ${batchEvents.length} events ingested individually`);
    }

    // Wait for ClickHouse to process
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Query events back
    console.log('\n📥 Querying events from ClickHouse...');
    const queryResult = await client.query({
      query: `SELECT * FROM ${tableName} ORDER BY timestamp DESC LIMIT 10`,
      format: 'JSONEachRow',
    });

    const events = await queryResult.json();
    console.log(`✅ Retrieved ${events.length} events:\n`);

    events.forEach((event: any, index: number) => {
      console.log(`${index + 1}. [${event.type}] ${event.display_message || 'N/A'}`);
      console.log(`   User: ${event.user_id || 'N/A'} | Time: ${new Date(event.timestamp).toLocaleString()}`);
    });

    // Test health check
    if (provider.healthCheck) {
      console.log('\n🏥 Testing health check...');
      const isHealthy = await provider.healthCheck();
      console.log(isHealthy ? '✅ Provider is healthy' : '❌ Provider health check failed');
    }

    // Cleanup (optional - comment out to keep test data)
    // console.log('\n🧹 Cleaning up test data...');
    // await client.exec({ query: `TRUNCATE TABLE ${tableName}` });
    // console.log('✅ Test data cleaned up');

    console.log('\n✅ All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testClickHouseEvents();

