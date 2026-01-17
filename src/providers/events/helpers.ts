import type {
  AuthEvent,
  EventIngestionProvider,
  EventQueryOptions,
  EventQueryResult,
} from '../../types/events.js';

export function createPostgresProvider(options: {
  client: any;
  tableName?: string;
  schema?: string;
}): EventIngestionProvider {
  const { client, tableName = 'auth_events', schema = 'public' } = options;

  // Ensure table exists
  const ensureTable = async () => {
    if (!client) return;

    try {
      // Support different Postgres client types (pg, postgres.js, etc.)
      const queryFn = client.query || (typeof client === 'function' ? client : null);
      if (!queryFn) {
        console.warn(
          `⚠️  Postgres client doesn't support query method. Table ${schema}.${tableName} must be created manually.`
        );
        return;
      }

      // Support Prisma client ($executeRaw) or standard pg client (query)
      let executeQuery: (query: string) => Promise<any>;

      if (client.$executeRaw) {
        // Prisma client
        executeQuery = async (query: string) => {
          return await client.$executeRawUnsafe(query);
        };
      } else if (client.query) {
        // Standard pg client
        executeQuery = async (query: string) => {
          return await client.query(query);
        };
      } else {
        console.warn(
          `⚠️  Postgres client doesn't support $executeRaw or query method. Table ${schema}.${tableName} must be created manually.`
        );
        return;
      }

      // Use CREATE TABLE IF NOT EXISTS (simpler and more reliable)
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS ${schema}.${tableName} (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          type VARCHAR(100) NOT NULL,
          timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          status VARCHAR(20) NOT NULL DEFAULT 'success',
          user_id VARCHAR(255),
          session_id VARCHAR(255),
          organization_id VARCHAR(255),
          metadata JSONB DEFAULT '{}',
          ip_address INET,
          user_agent TEXT,
          source VARCHAR(50) DEFAULT 'app',
          display_message TEXT,
          display_severity VARCHAR(20),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;

      await executeQuery(createTableQuery);

      // Create indexes separately (ignore errors if they already exist)
      const indexQueries = [
        `CREATE INDEX IF NOT EXISTS idx_${tableName}_user_id ON ${schema}.${tableName}(user_id)`,
        `CREATE INDEX IF NOT EXISTS idx_${tableName}_type ON ${schema}.${tableName}(type)`,
        `CREATE INDEX IF NOT EXISTS idx_${tableName}_timestamp ON ${schema}.${tableName}(timestamp DESC)`,
        `CREATE INDEX IF NOT EXISTS idx_${tableName}_id_timestamp ON ${schema}.${tableName}(id, timestamp DESC)`,
      ];

      for (const indexQuery of indexQueries) {
        try {
          await executeQuery(indexQuery);
        } catch (err) {
          // Index might already exist, ignore
        }
      }

      console.log(`✅ Ensured ${schema}.${tableName} table exists for events`);
    } catch (error: any) {
      // If table already exists, that's fine
      if (error?.message?.includes('already exists') || error?.code === '42P07') {
        return;
      }
      console.error(`Failed to ensure ${schema}.${tableName} table:`, error);
      // Don't throw - allow provider to work even if table creation fails
    }
  };

  // Track if table creation is in progress or completed
  let tableEnsured = false;
  let tableEnsuring = false;

  const ensureTableSync = async () => {
    if (tableEnsured || tableEnsuring) return;
    tableEnsuring = true;
    try {
      await ensureTable();
      tableEnsured = true;
    } catch (error) {
      console.error('Failed to ensure table:', error);
    } finally {
      tableEnsuring = false;
    }
  };

  // Call ensureTable asynchronously (don't block initialization)
  ensureTableSync().catch(console.error);

  return {
    async ingest(event: AuthEvent) {
      // Ensure table exists before ingesting
      if (!tableEnsured) {
        await ensureTableSync();
      }
      // Support Prisma client ($executeRaw) or standard pg client (query/Pool)
      if (client.$executeRaw) {
        // Prisma client - use $executeRawUnsafe for parameterized queries
        const query = `
          INSERT INTO ${schema}.${tableName} 
          (id, type, timestamp, status, user_id, session_id, organization_id, metadata, ip_address, user_agent, source, display_message, display_severity)
          VALUES ('${event.id}'::uuid, '${event.type}', '${event.timestamp.toISOString()}', '${event.status || 'success'}', ${event.userId ? `'${event.userId.replace(/'/g, "''")}'` : 'NULL'}, ${event.sessionId ? `'${event.sessionId.replace(/'/g, "''")}'` : 'NULL'}, ${event.organizationId ? `'${event.organizationId.replace(/'/g, "''")}'` : 'NULL'}, '${JSON.stringify(event.metadata || {}).replace(/'/g, "''")}'::jsonb, ${event.ipAddress ? `'${event.ipAddress.replace(/'/g, "''")}'` : 'NULL'}, ${event.userAgent ? `'${event.userAgent.replace(/'/g, "''")}'` : 'NULL'}, '${event.source}', ${event.display?.message ? `'${event.display.message.replace(/'/g, "''")}'` : 'NULL'}, ${event.display?.severity ? `'${event.display.severity}'` : 'NULL'})
        `;
        await client.$executeRawUnsafe(query);
      } else if (client.query) {
        // Standard pg client (Pool or Client) - use parameterized queries for safety
        await client.query(
          `INSERT INTO ${schema}.${tableName} 
           (id, type, timestamp, status, user_id, session_id, organization_id, metadata, ip_address, user_agent, source, display_message, display_severity)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            event.id,
            event.type,
            event.timestamp,
            event.status || 'success',
            event.userId || null,
            event.sessionId || null,
            event.organizationId || null,
            JSON.stringify(event.metadata || {}),
            event.ipAddress || null,
            event.userAgent || null,
            event.source,
            event.display?.message || null,
            event.display?.severity || null,
          ]
        );
      }
    },

    async ingestBatch(events: AuthEvent[]) {
      if (events.length === 0) return;

      // Support Prisma client ($executeRaw) or standard pg client (query)
      if (client.$executeRaw) {
        // Prisma client - use $executeRawUnsafe for batch inserts
        const values = events
          .map(
            (event) =>
              `('${event.id}', '${event.type}', '${event.timestamp.toISOString()}', '${event.status || 'success'}', ${event.userId ? `'${event.userId}'` : 'NULL'}, ${event.sessionId ? `'${event.sessionId}'` : 'NULL'}, ${event.organizationId ? `'${event.organizationId}'` : 'NULL'}, '${JSON.stringify(event.metadata || {}).replace(/'/g, "''")}'::jsonb, ${event.ipAddress ? `'${event.ipAddress}'` : 'NULL'}, ${event.userAgent ? `'${event.userAgent.replace(/'/g, "''")}'` : 'NULL'}, '${event.source}', ${event.display?.message ? `'${event.display.message.replace(/'/g, "''")}'` : 'NULL'}, ${event.display?.severity ? `'${event.display.severity}'` : 'NULL'})`
          )
          .join(', ');

        const query = `
          INSERT INTO ${schema}.${tableName} 
          (id, type, timestamp, status, user_id, session_id, organization_id, metadata, ip_address, user_agent, source, display_message, display_severity)
          VALUES ${values}
        `;

        await client.$executeRawUnsafe(query);
      } else if (client.query) {
        // Standard pg client
        const values = events
          .map((_, i) => {
            const base = i * 13;
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12}, $${base + 13})`;
          })
          .join(', ');

        const query = `
          INSERT INTO ${schema}.${tableName} 
          (id, type, timestamp, status, user_id, session_id, organization_id, metadata, ip_address, user_agent, source, display_message, display_severity)
          VALUES ${values}
        `;

        const params = events.flatMap((event) => [
          event.id,
          event.type,
          event.timestamp,
          event.status || 'success',
          event.userId || null,
          event.sessionId || null,
          event.organizationId || null,
          JSON.stringify(event.metadata || {}),
          event.ipAddress || null,
          event.userAgent || null,
          event.source,
          event.display?.message || null,
          event.display?.severity || null,
        ]);

        await client.query(query, params);
      }
    },

    async query(options: EventQueryOptions): Promise<EventQueryResult> {
      const { limit = 20, after, sort = 'desc', type, userId } = options;

      let queryFn: (query: string, params?: any[]) => Promise<any>;

      if (client.$executeRaw) {
        // Prisma client
        queryFn = async (query: string, params?: any[]) => {
          if (params && params.length > 0) {
            let processedQuery = query;
            params.forEach((param, index) => {
              const placeholder = `$${index + 1}`;
              const value =
                typeof param === 'string'
                  ? `'${param.replace(/'/g, "''")}'`
                  : param === null
                    ? 'NULL'
                    : param instanceof Date
                      ? `'${param.toISOString()}'`
                      : String(param);
              processedQuery = processedQuery.replace(
                new RegExp(`\\${placeholder}(?![0-9])`, 'g'),
                value
              );
            });
            return await client.$queryRawUnsafe(processedQuery);
          } else {
            return await client.$queryRawUnsafe(query);
          }
        };
      } else if (client.query) {
        // Standard pg client (Pool or Client)
        queryFn = async (query: string, params?: any[]) => {
          const result = await client.query(query, params);
          return result;
        };
      } else {
        throw new Error('Postgres client does not support $executeRaw or query method');
      }

      try {
        const checkTableQuery = `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = $1 
            AND table_name = $2
          );
        `;
        let checkResult: any;
        if (client.$executeRaw) {
          // Prisma client - replace $1, $2 with actual values
          const prismaQuery = checkTableQuery
            .replace('$1', `'${schema}'`)
            .replace('$2', `'${tableName}'`);
          checkResult = await client.$queryRawUnsafe(prismaQuery);
        } else {
          // Standard pg client
          checkResult = await queryFn(checkTableQuery, [schema, tableName]);
        }
        const exists = Array.isArray(checkResult)
          ? checkResult[0]?.exists || false
          : checkResult.rows?.[0]?.exists || checkResult?.[0]?.exists || false;

        if (!exists) {
          return {
            events: [],
            hasMore: false,
            nextCursor: null,
          };
        }
      } catch (error: any) {
        console.warn(`Failed to check table existence:`, error);
      }

      const whereClauses: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      // Cursor-based pagination
      if (after) {
        if (sort === 'desc') {
          whereClauses.push(`id < $${paramIndex++}`);
          params.push(after);
        } else {
          whereClauses.push(`id > $${paramIndex++}`);
          params.push(after);
        }
      }

      if (type) {
        whereClauses.push(`type = $${paramIndex++}`);
        params.push(type);
      }

      if (userId) {
        whereClauses.push(`user_id = $${paramIndex++}`);
        params.push(userId);
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      const orderDirection = sort === 'desc' ? 'DESC' : 'ASC';
      const query = `
        SELECT id, type, timestamp, status, user_id, session_id, organization_id, 
               metadata, ip_address, user_agent, source, display_message, display_severity
        FROM ${schema}.${tableName}
        ${whereClause}
        ORDER BY timestamp ${orderDirection}, id ${orderDirection}
        LIMIT $${paramIndex++}
      `;
      params.push(limit + 1); // Get one extra to check hasMore

      try {
        const result = await queryFn(query, params);
        const rows = result.rows || result || [];
        const hasMore = rows.length > limit;
        const events = rows.slice(0, limit).map((row: any) => ({
          id: row.id,
          type: row.type,
          timestamp: new Date(row.timestamp),
          status: row.status || 'success',
          userId: row.user_id,
          sessionId: row.session_id,
          organizationId: row.organization_id,
          metadata:
            typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {},
          ipAddress: row.ip_address,
          userAgent: row.user_agent,
          source: row.source || 'app',
          display: {
            message: row.display_message || row.type,
            severity: row.display_severity || 'info',
          },
        }));

        return {
          events,
          hasMore,
          nextCursor: hasMore ? events[events.length - 1].id : null,
        };
      } catch (error: any) {
        // If table doesn't exist, return empty result instead of throwing
        if (error?.message?.includes('does not exist') || error?.code === '42P01') {
          return {
            events: [],
            hasMore: false,
            nextCursor: null,
          };
        }
        throw error;
      }
    },
  };
}

export function createClickHouseProvider(options: {
  client: any;
  table?: string;
  database?: string;
}): EventIngestionProvider {
  const { client, table = 'auth_events', database } = options;

  const ensureTable = async () => {
    if (!client) return;

    try {
      const tableFullName = database ? `${database}.${table}` : table;

      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS ${tableFullName} (
          id UUID,
          type String,
          timestamp DateTime,
          status String DEFAULT 'success',
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

      if (client.exec) {
        const result = await client.exec({ query: createTableQuery });
        console.log(`✅ Ensured ${tableFullName} table exists in ClickHouse`);
      } else if (client.query) {
        await client.query({ query: createTableQuery });
        console.log(`✅ Ensured ${tableFullName} table exists in ClickHouse`);
      } else {
        console.warn(`⚠️  ClickHouse client doesn't support exec or query methods`);
      }
    } catch (error: any) {
      if (error?.message?.includes('already exists') || error?.code === 57) {
        return;
      }
      console.error(`Failed to ensure ${table} table in ClickHouse:`, error);
    }
  };

  let tableEnsured = false;
  let tableEnsuring = false;

  const ensureTableSync = async () => {
    if (tableEnsured || tableEnsuring) return;
    tableEnsuring = true;
    try {
      await ensureTable();
      tableEnsured = true;
    } catch (error) {
      console.error('Failed to ensure table:', error);
    } finally {
      tableEnsuring = false;
    }
  };

  // Call ensureTable asynchronously (don't block initialization)
  ensureTableSync().catch(console.error);

  const ingestBatchFn = async (events: AuthEvent[]) => {
    if (events.length === 0) return;

    if (!tableEnsured) {
      await ensureTableSync();
    }

    const tableFullName = database ? `${database}.${table}` : table;

    const rows = events.map((event) => ({
      id: event.id,
      type: event.type,
      timestamp: event.timestamp,
      status: event.status || 'success',
      user_id: event.userId || '',
      session_id: event.sessionId || '',
      organization_id: event.organizationId || '',
      metadata: JSON.stringify(event.metadata || {}),
      ip_address: event.ipAddress || '',
      user_agent: event.userAgent || '',
      source: event.source,
      display_message: event.display?.message || '',
      display_severity: event.display?.severity || '',
    }));

    try {
      if (client.insert) {
        await client.insert({
          table: tableFullName,
          values: rows,
          format: 'JSONEachRow',
        });
        console.log(`✅ Inserted ${rows.length} event(s) into ClickHouse ${tableFullName}`);
      } else {
        // Fallback: use INSERT query
        const values = rows
          .map(
            (row) =>
              `('${row.id}', '${row.type}', '${new Date(row.timestamp).toISOString().replace('T', ' ').slice(0, 19)}', '${row.status || 'success'}', ${row.user_id ? `'${row.user_id.replace(/'/g, "''")}'` : 'NULL'}, ${row.session_id ? `'${row.session_id.replace(/'/g, "''")}'` : 'NULL'}, ${row.organization_id ? `'${row.organization_id.replace(/'/g, "''")}'` : 'NULL'}, '${row.metadata.replace(/'/g, "''")}', ${row.ip_address ? `'${row.ip_address.replace(/'/g, "''")}'` : 'NULL'}, ${row.user_agent ? `'${row.user_agent.replace(/'/g, "''")}'` : 'NULL'}, '${row.source}', ${row.display_message ? `'${row.display_message.replace(/'/g, "''")}'` : 'NULL'}, ${row.display_severity ? `'${row.display_severity}'` : 'NULL'})`
          )
          .join(', ');

        const insertQuery = `
            INSERT INTO ${tableFullName} 
            (id, type, timestamp, status, user_id, session_id, organization_id, metadata, ip_address, user_agent, source, display_message, display_severity)
            VALUES ${values}
          `;

        if (client.exec) {
          await client.exec({ query: insertQuery });
        } else if (client.query) {
          await client.query({ query: insertQuery });
        } else {
          throw new Error('ClickHouse client does not support insert, exec, or query methods');
        }
        console.log(
          `✅ Inserted ${rows.length} event(s) into ClickHouse ${tableFullName} via query`
        );
      }
    } catch (error: any) {
      console.error(`❌ Failed to insert events into ClickHouse ${tableFullName}:`, error);
      throw error;
    }
  };

  return {
    async ingest(event: AuthEvent) {
      await ingestBatchFn([event]);
    },

    async ingestBatch(events: AuthEvent[]) {
      await ingestBatchFn(events);
    },

    async query(options: EventQueryOptions): Promise<EventQueryResult> {
      const { limit = 20, after, sort = 'desc', type, userId } = options;
      const tableFullName = database ? `${database}.${table}` : table;

      try {
        const checkTableQuery = `EXISTS TABLE ${tableFullName}`;
        let tableExists = false;

        if (client.query) {
          try {
            const checkResult = await client.query({
              query: checkTableQuery,
              format: 'JSONEachRow',
            });
            const rows = await checkResult.json();
            tableExists =
              rows && rows.length > 0 && (rows[0]?.result === 1 || rows[0]?.exists === 1);
          } catch {
            tableExists = false;
          }
        } else if (client.exec) {
          try {
            const checkResult = await client.exec({ query: checkTableQuery });
            tableExists = checkResult === '1' || String(checkResult).includes('1');
          } catch {
            tableExists = false;
          }
        }

        // If table doesn't exist, try to create it
        if (!tableExists) {
          const createTableQuery = `
            CREATE TABLE IF NOT EXISTS ${tableFullName} (
              id UUID,
              type String,
              timestamp DateTime,
              status String DEFAULT 'success',
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

          if (client.exec) {
            await client.exec({ query: createTableQuery });
          } else if (client.query) {
            await client.query({ query: createTableQuery });
          }
        } else {
          // Table exists, check if status column exists
          try {
            const checkColumnQuery = `
              SELECT count() as exists 
              FROM system.columns 
              WHERE database = currentDatabase() 
              AND table = '${table}' 
              AND name = 'status'
            `;

            let columnExists = false;
            if (client.query) {
              try {
                const columnResult = await client.query({
                  query: checkColumnQuery,
                  format: 'JSONEachRow',
                });
                const columnRows = await columnResult.json();
                columnExists = columnRows && columnRows.length > 0 && columnRows[0]?.exists > 0;
              } catch {
                columnExists = false;
              }
            } else if (client.exec) {
              try {
                const columnResult = await client.exec({ query: checkColumnQuery });
                columnExists = String(columnResult).includes('1') || columnResult === '1';
              } catch {
                columnExists = false;
              }
            }

            if (!columnExists) {
              const addColumnQuery = `ALTER TABLE ${tableFullName} ADD COLUMN IF NOT EXISTS status String DEFAULT 'success'`;
              try {
                if (client.exec) {
                  await client.exec({ query: addColumnQuery });
                } else if (client.query) {
                  await client.query({ query: addColumnQuery });
                }
                console.log(`✅ Added status column to ${tableFullName}`);
              } catch (alterError: any) {
                console.warn(`Failed to add status column to ${tableFullName}:`, alterError);
                // Continue anyway - we'll handle missing column in query
              }
            }
          } catch (checkError) {
            console.warn(`Failed to check for status column:`, checkError);
          }
        }
      } catch (error: any) {
        if (!error?.message?.includes('already exists') && error?.code !== 57) {
          console.warn(`Failed to ensure ClickHouse table ${tableFullName}:`, error);
        }
      }

      const whereClauses: string[] = [];
      if (after) {
        if (sort === 'desc') {
          whereClauses.push(`id < '${String(after).replace(/'/g, "''")}'`);
        } else {
          whereClauses.push(`id > '${String(after).replace(/'/g, "''")}'`);
        }
      }
      if (type) {
        whereClauses.push(`type = '${String(type).replace(/'/g, "''")}'`);
      }
      if (userId) {
        whereClauses.push(`user_id = '${String(userId).replace(/'/g, "''")}'`);
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      const orderDirection = sort === 'desc' ? 'DESC' : 'ASC';

      // Try to query with status column first, fallback if it doesn't exist
      let query = `
        SELECT id, type, timestamp, status, user_id, session_id, organization_id, 
               metadata, ip_address, user_agent, source, display_message, display_severity
        FROM ${tableFullName}
        ${whereClause}
        ORDER BY timestamp ${orderDirection}, id ${orderDirection}
        LIMIT ${limit + 1}
      `;

      let result: any;
      let hasStatusColumn = true;

      try {
        if (client.query) {
          const queryResult = await client.query({ query, format: 'JSONEachRow' });
          result = await queryResult.json();
        } else if (client.exec) {
          const execResult = await client.exec({ query, format: 'JSONEachRow' });
          result = typeof execResult === 'string' ? JSON.parse(execResult) : execResult;
        } else {
          throw new Error('ClickHouse client does not support query or exec methods');
        }
      } catch (error: any) {
        // If error is about missing status column, retry without it
        if (
          error?.message?.includes('Unknown expression identifier') &&
          error?.message?.includes('status')
        ) {
          console.warn(`Status column not found in ${tableFullName}, querying without it`);
          hasStatusColumn = false;

          // Retry query without status column
          query = `
            SELECT id, type, timestamp, user_id, session_id, organization_id, 
                   metadata, ip_address, user_agent, source, display_message, display_severity
            FROM ${tableFullName}
            ${whereClause}
            ORDER BY timestamp ${orderDirection}, id ${orderDirection}
            LIMIT ${limit + 1}
          `;

          try {
            if (client.query) {
              const queryResult = await client.query({ query, format: 'JSONEachRow' });
              result = await queryResult.json();
            } else if (client.exec) {
              const execResult = await client.exec({ query, format: 'JSONEachRow' });
              result = typeof execResult === 'string' ? JSON.parse(execResult) : execResult;
            }
          } catch (retryError: any) {
            if (retryError?.message?.includes("doesn't exist") || retryError?.code === 60) {
              return {
                events: [],
                hasMore: false,
                nextCursor: null,
              };
            }
            throw retryError;
          }
        } else if (error?.message?.includes("doesn't exist") || error?.code === 60) {
          return {
            events: [],
            hasMore: false,
            nextCursor: null,
          };
        } else {
          throw error;
        }
      }

      // Handle case where result might be an array or object
      const rows = Array.isArray(result) ? result : result?.data || [];
      const hasMore = rows.length > limit;
      const events = rows.slice(0, limit).map((row: any) => ({
        id: row.id,
        type: row.type,
        timestamp: new Date(row.timestamp),
        status: hasStatusColumn ? row.status || 'success' : 'success', // Default to 'success' if column doesn't exist
        userId: row.user_id || undefined,
        sessionId: row.session_id || undefined,
        organizationId: row.organization_id || undefined,
        metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {},
        ipAddress: row.ip_address || undefined,
        userAgent: row.user_agent || undefined,
        source: row.source || 'app',
        display: {
          message: row.display_message || row.type,
          severity: row.display_severity || 'info',
        },
      }));

      return {
        events,
        hasMore,
        nextCursor: hasMore ? events[events.length - 1].id : null,
      };
    },
  };
}

export function createHttpProvider(options: {
  url: string;
  client?: typeof fetch;
  headers?: Record<string, string>;
  transform?: (event: AuthEvent) => any;
}): EventIngestionProvider {
  const { url, client = fetch, headers = {}, transform } = options;

  return {
    async ingest(event: AuthEvent) {
      const payload = transform ? transform(event) : event;
      await client(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(payload),
      });
    },

    async ingestBatch(events: AuthEvent[]) {
      const payload = events.map((event) => (transform ? transform(event) : event));
      await client(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ events: payload }),
      });
    },
  };
}

export function createStorageProvider(options: {
  adapter: any;
  tableName?: string;
}): EventIngestionProvider {
  const { adapter, tableName = 'auth_events' } = options;

  // Ensure table exists (for Prisma/Drizzle adapters)
  const ensureTable = async () => {
    if (!adapter) return;

    try {
      if (adapter.findMany) {
        await adapter.findMany({
          model: tableName,
          limit: 1,
        });
        return;
      }
    } catch (error: any) {
      console.warn(
        `Table ${tableName} may not exist. Please create it manually or run migrations.`
      );
      console.warn('SQL schema for reference:');
      console.warn(`
CREATE TABLE IF NOT EXISTS ${tableName} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(100) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'success',
  user_id VARCHAR(255),
  session_id VARCHAR(255),
  organization_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  source VARCHAR(50) DEFAULT 'app',
  display_message TEXT,
  display_severity VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_${tableName}_user_id ON ${tableName}(user_id);
CREATE INDEX IF NOT EXISTS idx_${tableName}_type ON ${tableName}(type);
CREATE INDEX IF NOT EXISTS idx_${tableName}_timestamp ON ${tableName}(timestamp DESC);
      `);
    }
  };

  ensureTable().catch(console.error);

  return {
    async ingest(event: AuthEvent) {
      if (adapter.create) {
        await adapter.create({
          model: tableName,
          data: {
            id: event.id,
            type: event.type,
            timestamp: event.timestamp,
            status: event.status || 'success',
            userId: event.userId,
            sessionId: event.sessionId,
            organizationId: event.organizationId,
            metadata: event.metadata || {},
            ipAddress: event.ipAddress,
            userAgent: event.userAgent,
            source: event.source,
            displayMessage: event.display?.message,
            displaySeverity: event.display?.severity,
          },
        });
      } else if (adapter.insert) {
        await adapter.insert({
          table: tableName,
          values: {
            id: event.id,
            type: event.type,
            timestamp: event.timestamp,
            status: event.status || 'success',
            user_id: event.userId,
            session_id: event.sessionId,
            organization_id: event.organizationId,
            metadata: JSON.stringify(event.metadata || {}),
            ip_address: event.ipAddress,
            user_agent: event.userAgent,
            source: event.source,
            display_message: event.display?.message,
            display_severity: event.display?.severity,
          },
        });
      }
    },

    async ingestBatch(events: AuthEvent[]) {
      if (adapter.createMany) {
        await adapter.createMany({
          model: tableName,
          data: events.map((event) => ({
            id: event.id,
            type: event.type,
            timestamp: event.timestamp,
            status: event.status || 'success',
            userId: event.userId,
            sessionId: event.sessionId,
            organizationId: event.organizationId,
            metadata: event.metadata || {},
            ipAddress: event.ipAddress,
            userAgent: event.userAgent,
            source: event.source,
            displayMessage: event.display?.message,
            displaySeverity: event.display?.severity,
          })),
        });
      } else {
        await Promise.all(events.map((event) => this.ingest(event)));
      }
    },

    async query(options: EventQueryOptions): Promise<EventQueryResult> {
      const { limit = 20, after, sort = 'desc', type, userId } = options;

      if (!adapter || !adapter.findMany) {
        throw new Error('Adapter does not support findMany');
      }

      const where: any[] = [];

      if (after) {
        if (sort === 'desc') {
          where.push({ field: 'id', operator: '<', value: after });
        } else {
          where.push({ field: 'id', operator: '>', value: after });
        }
      }

      if (type) {
        where.push({ field: 'type', value: type });
      }

      if (userId) {
        where.push({ field: 'userId', value: userId });
      }

      const events = await adapter.findMany({
        model: tableName,
        where,
        orderBy: [{ field: 'timestamp', direction: sort === 'desc' ? 'desc' : 'asc' }],
        limit: limit + 1, // Get one extra to check hasMore
      });

      const hasMore = events.length > limit;
      const paginatedEvents = events.slice(0, limit).map((event: any) => ({
        id: event.id,
        type: event.type,
        timestamp: new Date(event.timestamp || event.createdAt),
        status: event.status || 'success',
        userId: event.userId || event.user_id,
        sessionId: event.sessionId || event.session_id,
        organizationId: event.organizationId || event.organization_id,
        metadata:
          typeof event.metadata === 'string' ? JSON.parse(event.metadata) : event.metadata || {},
        ipAddress: event.ipAddress || event.ip_address,
        userAgent: event.userAgent || event.user_agent,
        source: event.source || 'app',
        display: {
          message: event.displayMessage || event.display_message || event.type,
          severity: event.displaySeverity || event.display_severity || 'info',
        },
      }));

      return {
        events: paginatedEvents,
        hasMore,
        nextCursor: hasMore ? paginatedEvents[paginatedEvents.length - 1].id : null,
      };
    },
  };
}
