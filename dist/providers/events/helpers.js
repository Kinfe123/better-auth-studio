export function createPostgresProvider(options) {
    const { client, tableName = 'auth_events', schema = 'public', clientType } = options;
    // Validate client is provided
    if (!client) {
        throw new Error('Postgres client is required. Provide a pg Pool, Client, or Prisma client instance.');
    }
    let actualClient = client;
    if (clientType === 'drizzle') {
        if (client.$client) {
            actualClient = client.$client;
        }
        else if (client.client) {
            // Fallback for older Drizzle versions
            actualClient = client.client;
        }
    }
    const hasQuery = actualClient?.query || client?.query;
    const hasExecuteRaw = client?.$executeRaw;
    const hasExecute = client?.execute;
    const hasUnsafe = actualClient?.unsafe || client?.$client?.unsafe || client?.unsafe;
    if (!hasQuery && !hasExecuteRaw && !hasExecute && !hasUnsafe) {
        const errorMessage = clientType === 'prisma'
            ? 'Invalid Prisma client. Client must have a `$executeRaw` method.'
            : clientType === 'drizzle'
                ? 'Invalid Drizzle client. Drizzle instance must wrap a postgres-js (with `unsafe` method) or pg (with `query` method) client.'
                : 'Invalid Postgres client. Client must have either a `query` method (pg Pool/Client) or `$executeRaw` method (Prisma client).';
        throw new Error(errorMessage);
    }
    // Ensure table exists
    const ensureTable = async () => {
        if (!client)
            return;
        try {
            // Support Prisma client ($executeRaw), Drizzle instance ($client), or standard pg client (query)
            let executeQuery;
            if (clientType === 'prisma' || client.$executeRaw) {
                // Prisma client
                executeQuery = async (query) => {
                    return await client.$executeRawUnsafe(query);
                };
            }
            else if (clientType === 'drizzle') {
                // Drizzle client - use $client which exposes the underlying client
                if (actualClient?.unsafe) {
                    // postgres-js client via db.$client.unsafe()
                    executeQuery = async (query) => {
                        return await actualClient.unsafe(query);
                    };
                }
                else if (actualClient?.query) {
                    // pg Pool/Client via db.$client.query()
                    executeQuery = async (query) => {
                        return await actualClient.query(query);
                    };
                }
                else {
                    throw new Error(`Drizzle client.$client doesn't expose 'unsafe' (postgres-js) or 'query' (pg) method. Available methods: ${Object.keys(actualClient || {}).join(', ')}`);
                }
            }
            else if (actualClient?.query) {
                // Standard pg client (Pool or Client)
                executeQuery = async (query) => {
                    return await actualClient.query(query);
                };
            }
            else if (client.query) {
                executeQuery = async (query) => {
                    return await client.query(query);
                };
            }
            else {
                throw new Error(`Postgres client doesn't support $executeRaw or query method. Available properties: ${Object.keys(client).join(', ')}`);
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
                }
                catch (err) { }
            }
        }
        catch (error) {
            if (error?.message?.includes('already exists') || error?.code === '42P07') {
                return;
            }
            console.error(`Failed to ensure ${schema}.${tableName} table:`, error);
        }
    };
    let tableEnsured = false;
    let tableEnsuringPromise = null;
    const ensureTableSync = async () => {
        if (tableEnsured) {
            return;
        }
        if (tableEnsuringPromise) {
            return tableEnsuringPromise;
        }
        tableEnsuringPromise = (async () => {
            try {
                await ensureTable();
                tableEnsured = true;
            }
            catch (error) {
                console.error('Failed to ensure table:', error);
                tableEnsuringPromise = null;
                throw error;
            }
            finally {
                tableEnsuringPromise = null;
            }
        })();
        return tableEnsuringPromise;
    };
    ensureTableSync().catch(console.error);
    return {
        async ingest(event) {
            await ensureTableSync();
            if (clientType === 'prisma' || client.$executeRaw) {
                const query = `
          INSERT INTO ${schema}.${tableName} 
          (id, type, timestamp, status, user_id, session_id, organization_id, metadata, ip_address, user_agent, source, display_message, display_severity)
          VALUES ('${event.id}'::uuid, '${event.type}', '${event.timestamp.toISOString()}', '${event.status || 'success'}', ${event.userId ? `'${event.userId.replace(/'/g, "''")}'` : 'NULL'}, ${event.sessionId ? `'${event.sessionId.replace(/'/g, "''")}'` : 'NULL'}, ${event.organizationId ? `'${event.organizationId.replace(/'/g, "''")}'` : 'NULL'}, '${JSON.stringify(event.metadata || {}).replace(/'/g, "''")}'::jsonb, ${event.ipAddress ? `'${event.ipAddress.replace(/'/g, "''")}'` : 'NULL'}, ${event.userAgent ? `'${event.userAgent.replace(/'/g, "''")}'` : 'NULL'}, '${event.source}', ${event.display?.message ? `'${event.display.message.replace(/'/g, "''")}'` : 'NULL'}, ${event.display?.severity ? `'${event.display.severity}'` : 'NULL'})
        `;
                try {
                    await client.$executeRawUnsafe(query);
                }
                catch (error) {
                    console.error(`Failed to insert event (${event.type}) into ${schema}.${tableName}:`, error);
                    if (error.code === '42P01' || error.meta?.code === '42P01' || error.code === 'P2010') {
                        tableEnsured = false;
                        await ensureTableSync();
                        try {
                            await client.$executeRawUnsafe(query);
                            return;
                        }
                        catch (retryError) {
                            console.error(`Retry after table creation also failed:`, retryError);
                            throw retryError;
                        }
                    }
                    throw error;
                }
            }
            else if ((actualClient && (actualClient.query || actualClient.unsafe)) ||
                client.query ||
                client.unsafe) {
                // Standard pg client (Pool/Client with query) or postgres-js client (with unsafe) or Drizzle with underlying client
                const queryClient = actualClient || client;
                const useUnsafe = queryClient.unsafe && !queryClient.query; // Use unsafe if postgres-js (has unsafe but no query)
                if (useUnsafe) {
                    // postgres-js client - use unsafe() for raw SQL
                    const query = `
            INSERT INTO ${schema}.${tableName} 
            (id, type, timestamp, status, user_id, session_id, organization_id, metadata, ip_address, user_agent, source, display_message, display_severity)
            VALUES ('${event.id}'::uuid, '${event.type}', '${event.timestamp.toISOString()}', '${event.status || 'success'}', ${event.userId ? `'${event.userId.replace(/'/g, "''")}'` : 'NULL'}, ${event.sessionId ? `'${event.sessionId.replace(/'/g, "''")}'` : 'NULL'}, ${event.organizationId ? `'${event.organizationId.replace(/'/g, "''")}'` : 'NULL'}, '${JSON.stringify(event.metadata || {}).replace(/'/g, "''")}'::jsonb, ${event.ipAddress ? `'${event.ipAddress.replace(/'/g, "''")}'` : 'NULL'}, ${event.userAgent ? `'${event.userAgent.replace(/'/g, "''")}'` : 'NULL'}, '${event.source}', ${event.display?.message ? `'${event.display.message.replace(/'/g, "''")}'` : 'NULL'}, ${event.display?.severity ? `'${event.display.severity}'` : 'NULL'})
          `;
                    try {
                        await queryClient.unsafe(query);
                    }
                    catch (error) {
                        console.error(`Failed to insert event (${event.type}) into ${schema}.${tableName}:`, error);
                        if (error.code === '42P01') {
                            tableEnsured = false;
                            await ensureTableSync();
                            try {
                                await queryClient.unsafe(query);
                                return;
                            }
                            catch (retryError) {
                                console.error(`Retry after table creation also failed:`, retryError);
                                throw retryError;
                            }
                        }
                        throw error;
                    }
                }
                else {
                    // pg Pool/Client - use parameterized queries
                    try {
                        await queryClient.query(`INSERT INTO ${schema}.${tableName} 
               (id, type, timestamp, status, user_id, session_id, organization_id, metadata, ip_address, user_agent, source, display_message, display_severity)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`, [
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
                    }
                    catch (error) {
                        console.error(`Failed to insert event (${event.type}) into ${schema}.${tableName}:`, error);
                        if (error.code === '42P01') {
                            tableEnsured = false;
                            await ensureTableSync();
                            try {
                                await queryClient.query(`INSERT INTO ${schema}.${tableName} 
                   (id, type, timestamp, status, user_id, session_id, organization_id, metadata, ip_address, user_agent, source, display_message, display_severity)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`, [
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
                                return;
                            }
                            catch (retryError) {
                                console.error(`Retry after table creation also failed:`, retryError);
                                throw retryError;
                            }
                        }
                        if (error.code === 'ECONNREFUSED' ||
                            error.code === 'ETIMEDOUT' ||
                            error.message?.includes('Connection terminated')) {
                            if (client.end) {
                                console.warn(`⚠️  Connection error with pg Pool. The pool will retry automatically on next query.`);
                            }
                        }
                        throw error;
                    }
                }
            }
            else {
                throw new Error('Postgres client does not support $executeRaw, query, or unsafe method. Make sure you are passing a valid pg Pool, Client, Prisma client, or Drizzle instance.');
            }
        },
        async ingestBatch(events) {
            if (events.length === 0)
                return;
            await ensureTableSync();
            // Support Prisma client ($executeRaw), Drizzle instance, or standard pg client (query)
            if (clientType === 'prisma' || client.$executeRaw) {
                // Prisma client - use $executeRawUnsafe for batch inserts
                const CHUNK_SIZE = 500; // Reasonable chunk size for string-based queries
                for (let i = 0; i < events.length; i += CHUNK_SIZE) {
                    const chunk = events.slice(i, i + CHUNK_SIZE);
                    const values = chunk
                        .map((event) => `('${event.id}', '${event.type}', '${event.timestamp.toISOString()}', '${event.status || 'success'}', ${event.userId ? `'${event.userId.replace(/'/g, "''")}'` : 'NULL'}, ${event.sessionId ? `'${event.sessionId.replace(/'/g, "''")}'` : 'NULL'}, ${event.organizationId ? `'${event.organizationId.replace(/'/g, "''")}'` : 'NULL'}, '${JSON.stringify(event.metadata || {}).replace(/'/g, "''")}'::jsonb, ${event.ipAddress ? `'${event.ipAddress.replace(/'/g, "''")}'` : 'NULL'}, ${event.userAgent ? `'${event.userAgent.replace(/'/g, "''")}'` : 'NULL'}, '${event.source}', ${event.display?.message ? `'${event.display.message.replace(/'/g, "''")}'` : 'NULL'}, ${event.display?.severity ? `'${event.display.severity}'` : 'NULL'})`)
                        .join(', ');
                    const query = `
            INSERT INTO ${schema}.${tableName} 
            (id, type, timestamp, status, user_id, session_id, organization_id, metadata, ip_address, user_agent, source, display_message, display_severity)
            VALUES ${values}
          `;
                    try {
                        await client.$executeRawUnsafe(query);
                    }
                    catch (error) {
                        console.error(`Failed to insert batch chunk (${chunk.length} events):`, error);
                        throw error;
                    }
                }
            }
            else if ((actualClient && (actualClient.query || actualClient.unsafe)) ||
                client.query ||
                client.unsafe) {
                // Standard pg client (Pool/Client with query) or postgres-js client (with unsafe) or Drizzle with underlying client
                const batchQueryClient = actualClient || client;
                const useUnsafe = batchQueryClient.unsafe && !batchQueryClient.query; // Use unsafe if postgres-js
                if (useUnsafe) {
                    // postgres-js client - use unsafe() for raw SQL (similar to Prisma)
                    const CHUNK_SIZE = 500; // Reasonable chunk size for string-based queries
                    for (let i = 0; i < events.length; i += CHUNK_SIZE) {
                        const chunk = events.slice(i, i + CHUNK_SIZE);
                        const values = chunk
                            .map((event) => `('${event.id}', '${event.type}', '${event.timestamp.toISOString()}', '${event.status || 'success'}', ${event.userId ? `'${event.userId.replace(/'/g, "''")}'` : 'NULL'}, ${event.sessionId ? `'${event.sessionId.replace(/'/g, "''")}'` : 'NULL'}, ${event.organizationId ? `'${event.organizationId.replace(/'/g, "''")}'` : 'NULL'}, '${JSON.stringify(event.metadata || {}).replace(/'/g, "''")}'::jsonb, ${event.ipAddress ? `'${event.ipAddress.replace(/'/g, "''")}'` : 'NULL'}, ${event.userAgent ? `'${event.userAgent.replace(/'/g, "''")}'` : 'NULL'}, '${event.source}', ${event.display?.message ? `'${event.display.message.replace(/'/g, "''")}'` : 'NULL'}, ${event.display?.severity ? `'${event.display.severity}'` : 'NULL'})`)
                            .join(', ');
                        const query = `
              INSERT INTO ${schema}.${tableName} 
              (id, type, timestamp, status, user_id, session_id, organization_id, metadata, ip_address, user_agent, source, display_message, display_severity)
              VALUES ${values}
            `;
                        try {
                            await batchQueryClient.unsafe(query);
                        }
                        catch (error) {
                            console.error(`Failed to insert batch chunk (${chunk.length} events):`, error);
                            throw error;
                        }
                    }
                }
                else {
                    // pg Pool/Client - use parameterized queries
                    const PARAMS_PER_EVENT = 13;
                    const MAX_PARAMS = 65535;
                    const CHUNK_SIZE = Math.floor(MAX_PARAMS / PARAMS_PER_EVENT) - 1; // ~5000, but use 1000 for safety
                    for (let chunkStart = 0; chunkStart < events.length; chunkStart += CHUNK_SIZE) {
                        const chunk = events.slice(chunkStart, chunkStart + CHUNK_SIZE);
                        const values = chunk
                            .map((_, i) => {
                            const base = i * PARAMS_PER_EVENT;
                            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12}, $${base + 13})`;
                        })
                            .join(', ');
                        const query = `
              INSERT INTO ${schema}.${tableName} 
              (id, type, timestamp, status, user_id, session_id, organization_id, metadata, ip_address, user_agent, source, display_message, display_severity)
              VALUES ${values}
            `;
                        const params = chunk.flatMap((event) => [
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
                        try {
                            await batchQueryClient.query(query, params);
                        }
                        catch (error) {
                            console.error(`Failed to insert batch chunk (${chunk.length} events) into ${schema}.${tableName}:`, error);
                            if (error.code === 'ECONNREFUSED' ||
                                error.code === 'ETIMEDOUT' ||
                                error.message?.includes('Connection terminated')) {
                                if (client.end) {
                                    console.warn(`⚠️  Connection error with pg Pool. The pool will retry automatically on next query.`);
                                }
                            }
                            throw error;
                        }
                    }
                }
            }
            else {
                throw new Error('Postgres client does not support $executeRaw or query method. Make sure you are passing a valid pg Pool, Client, or Prisma client.');
            }
        },
        async query(options) {
            const { limit = 20, after, sort = 'desc', type, userId, since } = options;
            let queryFn;
            if (client.$executeRaw) {
                // Prisma client
                queryFn = async (query, params) => {
                    if (params && params.length > 0) {
                        let processedQuery = query;
                        params.forEach((param, index) => {
                            const placeholder = `$${index + 1}`;
                            const value = typeof param === 'string'
                                ? `'${param.replace(/'/g, "''")}'`
                                : param === null
                                    ? 'NULL'
                                    : param instanceof Date
                                        ? `'${param.toISOString()}'`
                                        : String(param);
                            processedQuery = processedQuery.replace(new RegExp(`\\${placeholder}(?![0-9])`, 'g'), value);
                        });
                        return await client.$queryRawUnsafe(processedQuery);
                    }
                    else {
                        return await client.$queryRawUnsafe(query);
                    }
                };
            }
            else if (client.query) {
                // Standard pg client (Pool or Client)
                queryFn = async (query, params) => {
                    const result = await client.query(query, params);
                    return result;
                };
            }
            else {
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
                let checkResult;
                if (client.$executeRaw) {
                    // Prisma client - replace $1, $2 with actual values
                    const prismaQuery = checkTableQuery
                        .replace('$1', `'${schema}'`)
                        .replace('$2', `'${tableName}'`);
                    checkResult = await client.$queryRawUnsafe(prismaQuery);
                }
                else {
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
            }
            catch (error) {
                console.warn(`Failed to check table existence:`, error);
            }
            const whereClauses = [];
            const params = [];
            let paramIndex = 1;
            // Cursor-based pagination
            if (after) {
                if (sort === 'desc') {
                    whereClauses.push(`id < $${paramIndex++}`);
                    params.push(after);
                }
                else {
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
            if (since) {
                whereClauses.push(`timestamp >= $${paramIndex++}`);
                params.push(since instanceof Date ? since.toISOString() : since);
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
                const events = rows.slice(0, limit).map((row) => ({
                    id: row.id,
                    type: row.type,
                    timestamp: new Date(row.timestamp),
                    status: row.status || 'success',
                    userId: row.user_id,
                    sessionId: row.session_id,
                    organizationId: row.organization_id,
                    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {},
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
            }
            catch (error) {
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
export function createSqliteProvider(options) {
    const { client, tableName = 'auth_events' } = options;
    // Validate client is provided
    if (!client) {
        throw new Error('SQLite client is required. Provide a better-sqlite3 Database instance.');
    }
    // Handle case where client might be a function (lazy initialization) or already initialized
    const actualClient = typeof client === 'function' ? client() : client;
    // If client initialization failed (native module not found), try to provide helpful error
    if (!actualClient) {
        throw new Error('SQLite client initialization failed. Make sure better-sqlite3 is properly installed and built. ' +
            'Run: pnpm rebuild better-sqlite3 or npm rebuild better-sqlite3');
    }
    // Validate client has required methods (better-sqlite3 Database)
    const hasExec = typeof actualClient.exec === 'function';
    const hasPrepare = typeof actualClient.prepare === 'function';
    if (!hasExec || !hasPrepare) {
        // If methods don't exist, it might be an initialization error - provide helpful message
        if (actualClient instanceof Error) {
            throw new Error(`SQLite client initialization error: ${actualClient.message}. ` +
                'Make sure better-sqlite3 native module is built. Run: pnpm rebuild better-sqlite3');
        }
        throw new Error('Invalid SQLite client. Client must have `exec` and `prepare` methods (better-sqlite3 Database instance). ' +
            'If using better-sqlite3, make sure the native module is built: pnpm rebuild better-sqlite3');
    }
    // Ensure table exists
    const ensureTable = async () => {
        if (!client)
            return;
        try {
            // Use CREATE TABLE IF NOT EXISTS (SQLite doesn't support schemas like Postgres)
            const createTableQuery = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          timestamp TEXT NOT NULL DEFAULT (datetime('now')),
          status TEXT NOT NULL DEFAULT 'success',
          user_id TEXT,
          session_id TEXT,
          organization_id TEXT,
          metadata TEXT DEFAULT '{}',
          ip_address TEXT,
          user_agent TEXT,
          source TEXT DEFAULT 'app',
          display_message TEXT,
          display_severity TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        );
      `;
            actualClient.exec(createTableQuery);
            const indexQueries = [
                `CREATE INDEX IF NOT EXISTS idx_${tableName}_user_id ON ${tableName}(user_id)`,
                `CREATE INDEX IF NOT EXISTS idx_${tableName}_type ON ${tableName}(type)`,
                `CREATE INDEX IF NOT EXISTS idx_${tableName}_timestamp ON ${tableName}(timestamp DESC)`,
                `CREATE INDEX IF NOT EXISTS idx_${tableName}_id_timestamp ON ${tableName}(id, timestamp DESC)`,
            ];
            for (const indexQuery of indexQueries) {
                try {
                    actualClient.exec(indexQuery);
                }
                catch (err) {
                    // Index might already exist, ignore
                }
            }
        }
        catch (error) {
            if (error?.message?.includes('already exists')) {
                return;
            }
            console.error(`Failed to ensure ${tableName} table:`, error);
        }
    };
    let tableEnsured = false;
    let tableEnsuringPromise = null;
    const ensureTableSync = async () => {
        if (tableEnsured) {
            return;
        }
        if (tableEnsuringPromise) {
            return tableEnsuringPromise;
        }
        tableEnsuringPromise = (async () => {
            try {
                await ensureTable();
                tableEnsured = true;
            }
            catch (error) {
                tableEnsuringPromise = null;
                throw error;
            }
            finally {
                tableEnsuringPromise = null;
            }
        })();
        return tableEnsuringPromise;
    };
    ensureTableSync().catch(console.error);
    return {
        async ingest(event) {
            await ensureTableSync();
            try {
                const stmt = actualClient.prepare(`
          INSERT INTO ${tableName} 
          (id, type, timestamp, status, user_id, session_id, organization_id, metadata, ip_address, user_agent, source, display_message, display_severity)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
                stmt.run(event.id, event.type, event.timestamp.toISOString(), event.status || 'success', event.userId || null, event.sessionId || null, event.organizationId || null, JSON.stringify(event.metadata || {}), event.ipAddress || null, event.userAgent || null, event.source, event.display?.message || null, event.display?.severity || null);
            }
            catch (error) {
                console.error(`Failed to insert event (${event.type}) into ${tableName}:`, error);
                // If table doesn't exist, try to create it and retry
                if (error.message?.includes('no such table')) {
                    tableEnsured = false;
                    await ensureTableSync();
                    try {
                        const stmt = actualClient.prepare(`
              INSERT INTO ${tableName} 
              (id, type, timestamp, status, user_id, session_id, organization_id, metadata, ip_address, user_agent, source, display_message, display_severity)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
                        stmt.run(event.id, event.type, event.timestamp.toISOString(), event.status || 'success', event.userId || null, event.sessionId || null, event.organizationId || null, JSON.stringify(event.metadata || {}), event.ipAddress || null, event.userAgent || null, event.source, event.display?.message || null, event.display?.severity || null);
                        return;
                    }
                    catch (retryError) {
                        console.error(`Retry after table creation also failed:`, retryError);
                        throw retryError;
                    }
                }
                throw error;
            }
        },
        async ingestBatch(events) {
            if (events.length === 0)
                return;
            await ensureTableSync();
            try {
                const transaction = actualClient.transaction((events) => {
                    const stmt = actualClient.prepare(`
            INSERT INTO ${tableName} 
            (id, type, timestamp, status, user_id, session_id, organization_id, metadata, ip_address, user_agent, source, display_message, display_severity)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
                    for (const event of events) {
                        stmt.run(event.id, event.type, event.timestamp.toISOString(), event.status || 'success', event.userId || null, event.sessionId || null, event.organizationId || null, JSON.stringify(event.metadata || {}), event.ipAddress || null, event.userAgent || null, event.source, event.display?.message || null, event.display?.severity || null);
                    }
                });
                transaction(events);
            }
            catch (error) {
                console.error(`Failed to insert batch (${events.length} events):`, error);
                if (error.message?.includes('no such table')) {
                    tableEnsured = false;
                    await ensureTableSync();
                    try {
                        const transaction = actualClient.transaction((events) => {
                            const stmt = actualClient.prepare(`
                INSERT INTO ${tableName} 
                (id, type, timestamp, status, user_id, session_id, organization_id, metadata, ip_address, user_agent, source, display_message, display_severity)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `);
                            for (const event of events) {
                                stmt.run(event.id, event.type, event.timestamp.toISOString(), event.status || 'success', event.userId || null, event.sessionId || null, event.organizationId || null, JSON.stringify(event.metadata || {}), event.ipAddress || null, event.userAgent || null, event.source, event.display?.message || null, event.display?.severity || null);
                            }
                        });
                        transaction(events);
                        return;
                    }
                    catch (retryError) {
                        console.error(`Retry after table creation also failed:`, retryError);
                        throw retryError;
                    }
                }
                throw error;
            }
        },
        async query(options) {
            const { limit = 20, after, sort = 'desc', type, userId, since } = options;
            await ensureTableSync();
            try {
                let query = `SELECT * FROM ${tableName} WHERE 1=1`;
                const params = [];
                if (type) {
                    query += ` AND type = ?`;
                    params.push(type);
                }
                if (userId) {
                    query += ` AND user_id = ?`;
                    params.push(userId);
                }
                if (since) {
                    query += ` AND timestamp >= ?`;
                    params.push(since instanceof Date ? since.toISOString() : since);
                }
                if (after) {
                    query += ` AND id > ?`;
                    params.push(after);
                }
                query += ` ORDER BY timestamp ${sort === 'desc' ? 'DESC' : 'ASC'}`;
                query += ` LIMIT ?`;
                params.push(limit + 1); // Fetch one extra to check if there are more
                const stmt = actualClient.prepare(query);
                const rows = stmt.all(...params);
                const hasMore = rows.length > limit;
                const events = (hasMore ? rows.slice(0, limit) : rows).map((row) => ({
                    id: row.id,
                    type: row.type,
                    timestamp: new Date(row.timestamp),
                    status: row.status,
                    userId: row.user_id || undefined,
                    sessionId: row.session_id || undefined,
                    organizationId: row.organization_id || undefined,
                    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {},
                    ipAddress: row.ip_address || undefined,
                    userAgent: row.user_agent || undefined,
                    source: row.source || 'app',
                    display: row.display_message || row.display_severity
                        ? {
                            message: row.display_message || undefined,
                            severity: row.display_severity || undefined,
                        }
                        : undefined,
                }));
                return {
                    events,
                    hasMore,
                    nextCursor: hasMore && events.length > 0 ? events[events.length - 1].id : null,
                };
            }
            catch (error) {
                if (error.message?.includes('no such table')) {
                    await ensureTableSync();
                    return { events: [], hasMore: false, nextCursor: null };
                }
                console.error(`Failed to query events from ${tableName}:`, error);
                throw error;
            }
        },
    };
}
export function createClickHouseProvider(options) {
    const { client, table = 'auth_events', database } = options;
    const ensureTable = async () => {
        if (!client)
            return;
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
            }
            else if (client.query) {
                await client.query({ query: createTableQuery });
                console.log(`✅ Ensured ${tableFullName} table exists in ClickHouse`);
            }
            else {
                console.warn(`⚠️  ClickHouse client doesn't support exec or query methods`);
            }
        }
        catch (error) {
            if (error?.message?.includes('already exists') || error?.code === 57) {
                return;
            }
            console.error(`Failed to ensure ${table} table in ClickHouse:`, error);
        }
    };
    let tableEnsured = false;
    let tableEnsuring = false;
    const ensureTableSync = async () => {
        if (tableEnsured || tableEnsuring)
            return;
        tableEnsuring = true;
        try {
            await ensureTable();
            tableEnsured = true;
        }
        catch (error) {
            console.error('Failed to ensure table:', error);
        }
        finally {
            tableEnsuring = false;
        }
    };
    ensureTableSync().catch(console.error);
    const ingestBatchFn = async (events) => {
        if (events.length === 0)
            return;
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
            }
            else {
                const values = rows
                    .map((row) => `('${row.id}', '${row.type}', '${new Date(row.timestamp).toISOString().replace('T', ' ').slice(0, 19)}', '${row.status || 'success'}', ${row.user_id ? `'${row.user_id.replace(/'/g, "''")}'` : 'NULL'}, ${row.session_id ? `'${row.session_id.replace(/'/g, "''")}'` : 'NULL'}, ${row.organization_id ? `'${row.organization_id.replace(/'/g, "''")}'` : 'NULL'}, '${row.metadata.replace(/'/g, "''")}', ${row.ip_address ? `'${row.ip_address.replace(/'/g, "''")}'` : 'NULL'}, ${row.user_agent ? `'${row.user_agent.replace(/'/g, "''")}'` : 'NULL'}, '${row.source}', ${row.display_message ? `'${row.display_message.replace(/'/g, "''")}'` : 'NULL'}, ${row.display_severity ? `'${row.display_severity}'` : 'NULL'})`)
                    .join(', ');
                const insertQuery = `
            INSERT INTO ${tableFullName} 
            (id, type, timestamp, status, user_id, session_id, organization_id, metadata, ip_address, user_agent, source, display_message, display_severity)
            VALUES ${values}
          `;
                if (client.exec) {
                    await client.exec({ query: insertQuery });
                }
                else if (client.query) {
                    await client.query({ query: insertQuery });
                }
                else {
                    throw new Error('ClickHouse client does not support insert, exec, or query methods');
                }
                console.log(`✅ Inserted ${rows.length} event(s) into ClickHouse ${tableFullName} via query`);
            }
        }
        catch (error) {
            console.error(`❌ Failed to insert events into ClickHouse ${tableFullName}:`, error);
            throw error;
        }
    };
    return {
        async ingest(event) {
            await ingestBatchFn([event]);
        },
        async ingestBatch(events) {
            await ingestBatchFn(events);
        },
        async query(options) {
            const { limit = 20, after, sort = 'desc', type, userId, since } = options;
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
                    }
                    catch {
                        tableExists = false;
                    }
                }
                else if (client.exec) {
                    try {
                        const checkResult = await client.exec({ query: checkTableQuery });
                        tableExists = checkResult === '1' || String(checkResult).includes('1');
                    }
                    catch {
                        tableExists = false;
                    }
                }
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
                    }
                    else if (client.query) {
                        await client.query({ query: createTableQuery });
                    }
                }
                else {
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
                            }
                            catch {
                                columnExists = false;
                            }
                        }
                        else if (client.exec) {
                            try {
                                const columnResult = await client.exec({ query: checkColumnQuery });
                                columnExists = String(columnResult).includes('1') || columnResult === '1';
                            }
                            catch {
                                columnExists = false;
                            }
                        }
                        if (!columnExists) {
                            const addColumnQuery = `ALTER TABLE ${tableFullName} ADD COLUMN IF NOT EXISTS status String DEFAULT 'success'`;
                            try {
                                if (client.exec) {
                                    await client.exec({ query: addColumnQuery });
                                }
                                else if (client.query) {
                                    await client.query({ query: addColumnQuery });
                                }
                                console.log(`✅ Added status column to ${tableFullName}`);
                            }
                            catch (alterError) {
                                console.warn(`Failed to add status column to ${tableFullName}:`, alterError);
                            }
                        }
                    }
                    catch (checkError) {
                        console.warn(`Failed to check for status column:`, checkError);
                    }
                }
            }
            catch (error) {
                if (!error?.message?.includes('already exists') && error?.code !== 57) {
                    console.warn(`Failed to ensure ClickHouse table ${tableFullName}:`, error);
                }
            }
            const whereClauses = [];
            if (after) {
                if (sort === 'desc') {
                    whereClauses.push(`id < '${String(after).replace(/'/g, "''")}'`);
                }
                else {
                    whereClauses.push(`id > '${String(after).replace(/'/g, "''")}'`);
                }
            }
            if (type) {
                whereClauses.push(`type = '${String(type).replace(/'/g, "''")}'`);
            }
            if (userId) {
                whereClauses.push(`user_id = '${String(userId).replace(/'/g, "''")}'`);
            }
            if (since) {
                const sinceDate = since instanceof Date ? since : new Date(since);
                whereClauses.push(`timestamp >= '${sinceDate.toISOString().replace(/'/g, "''")}'`);
            }
            const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
            const orderDirection = sort === 'desc' ? 'DESC' : 'ASC';
            let query = `
        SELECT id, type, timestamp, status, user_id, session_id, organization_id, 
               metadata, ip_address, user_agent, source, display_message, display_severity
        FROM ${tableFullName}
        ${whereClause}
        ORDER BY timestamp ${orderDirection}, id ${orderDirection}
        LIMIT ${limit + 1}
      `;
            let result;
            let hasStatusColumn = true;
            try {
                if (client.query) {
                    const queryResult = await client.query({ query, format: 'JSONEachRow' });
                    result = await queryResult.json();
                }
                else if (client.exec) {
                    const execResult = await client.exec({ query, format: 'JSONEachRow' });
                    result = typeof execResult === 'string' ? JSON.parse(execResult) : execResult;
                }
                else {
                    throw new Error('ClickHouse client does not support query or exec methods');
                }
            }
            catch (error) {
                if (error?.message?.includes('Unknown expression identifier') &&
                    error?.message?.includes('status')) {
                    console.warn(`Status column not found in ${tableFullName}, querying without it`);
                    hasStatusColumn = false;
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
                        }
                        else if (client.exec) {
                            const execResult = await client.exec({ query, format: 'JSONEachRow' });
                            result = typeof execResult === 'string' ? JSON.parse(execResult) : execResult;
                        }
                    }
                    catch (retryError) {
                        if (retryError?.message?.includes("doesn't exist") || retryError?.code === 60) {
                            return {
                                events: [],
                                hasMore: false,
                                nextCursor: null,
                            };
                        }
                        throw retryError;
                    }
                }
                else if (error?.message?.includes("doesn't exist") || error?.code === 60) {
                    return {
                        events: [],
                        hasMore: false,
                        nextCursor: null,
                    };
                }
                else {
                    throw error;
                }
            }
            const rows = Array.isArray(result) ? result : result?.data || [];
            const hasMore = rows.length > limit;
            const events = rows.slice(0, limit).map((row) => ({
                id: row.id,
                type: row.type,
                timestamp: new Date(row.timestamp),
                status: hasStatusColumn ? row.status || 'success' : 'success',
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
export function createHttpProvider(options) {
    const { url, client = fetch, headers = {}, transform } = options;
    return {
        async ingest(event) {
            const payload = transform ? transform(event) : event;
            await client(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify(payload),
            });
        },
        async ingestBatch(events) {
            const payload = events.map((event) => (transform ? transform(event) : event));
            await client(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify({ events: payload }),
            });
        },
    };
}
export function createStorageProvider(options) {
    const { adapter, tableName = 'auth_events' } = options;
    let tableEnsured = false;
    let tableEnsuringPromise = null;
    const ensureTable = async () => {
        if (!adapter)
            return;
        if (tableEnsured)
            return;
        if (tableEnsuringPromise)
            return tableEnsuringPromise;
        tableEnsuringPromise = (async () => {
            try {
                if (adapter.findMany) {
                    // Try to query the table to see if it exists
                    await adapter.findMany({
                        model: tableName,
                        limit: 1,
                    });
                    tableEnsured = true;
                    return;
                }
            }
            catch (error) {
                // Table doesn't exist - try to create it if adapter supports raw SQL
                if (error?.message?.includes('not found in schema') ||
                    error?.message?.includes('Model') ||
                    error?.code === 'P2025' ||
                    error?.code === '42P01') {
                    // Try to create table using raw SQL if adapter supports it
                    if (adapter.executeRaw || adapter.$executeRaw || adapter.queryRaw) {
                        try {
                            const executeRaw = adapter.executeRaw || adapter.$executeRaw || adapter.queryRaw;
                            const createTableQuery = `
                CREATE TABLE IF NOT EXISTS ${tableName} (
                  id TEXT PRIMARY KEY,
                  type TEXT NOT NULL,
                  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
                  status TEXT NOT NULL DEFAULT 'success',
                  user_id TEXT,
                  session_id TEXT,
                  organization_id TEXT,
                  metadata TEXT DEFAULT '{}',
                  ip_address TEXT,
                  user_agent TEXT,
                  source TEXT DEFAULT 'app',
                  display_message TEXT,
                  display_severity TEXT,
                  created_at TEXT DEFAULT (datetime('now'))
                );
              `;
                            await executeRaw(createTableQuery);
                            // Create indexes
                            const indexQueries = [
                                `CREATE INDEX IF NOT EXISTS idx_${tableName}_user_id ON ${tableName}(user_id)`,
                                `CREATE INDEX IF NOT EXISTS idx_${tableName}_type ON ${tableName}(type)`,
                                `CREATE INDEX IF NOT EXISTS idx_${tableName}_timestamp ON ${tableName}(timestamp DESC)`,
                            ];
                            for (const indexQuery of indexQueries) {
                                try {
                                    await executeRaw(indexQuery);
                                }
                                catch {
                                    // Index might already exist
                                }
                            }
                            tableEnsured = true;
                            return;
                        }
                        catch (createError) {
                            // If we can't create the table, that's okay - it might need to be created manually
                            console.warn(`Table ${tableName} may not exist. Please create it manually or run migrations.`);
                        }
                    }
                    else {
                        console.warn(`Table ${tableName} may not exist. Please create it manually or run migrations.`);
                    }
                }
            }
            finally {
                tableEnsuringPromise = null;
            }
        })();
        return tableEnsuringPromise;
    };
    return {
        async ingest(event) {
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
            }
            else if (adapter.insert) {
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
        async ingestBatch(events) {
            // Ensure table exists before ingesting
            await ensureTable();
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
            }
            else {
                await Promise.all(events.map((event) => this.ingest(event)));
            }
        },
        async query(options) {
            const { limit = 20, after, sort = 'desc', type, userId, since } = options;
            // Ensure table exists before querying
            await ensureTable();
            // First, try findMany (normal path)
            if (adapter && adapter.findMany) {
                try {
                    const where = [];
                    if (after) {
                        if (sort === 'desc') {
                            where.push({ field: 'id', operator: '<', value: after });
                        }
                        else {
                            where.push({ field: 'id', operator: '>', value: after });
                        }
                    }
                    if (type) {
                        where.push({ field: 'type', value: type });
                    }
                    if (userId) {
                        where.push({ field: 'userId', value: userId });
                    }
                    if (since) {
                        const sinceDate = since instanceof Date ? since : new Date(since);
                        where.push({ field: 'timestamp', operator: '>=', value: sinceDate });
                    }
                    const events = await adapter.findMany({
                        model: tableName,
                        where,
                        orderBy: [{ field: 'timestamp', direction: sort === 'desc' ? 'desc' : 'asc' }],
                        limit: limit + 1, // Get one extra to check hasMore
                    });
                    const hasMore = events.length > limit;
                    const paginatedEvents = events.slice(0, limit).map((event) => ({
                        id: event.id,
                        type: event.type,
                        timestamp: new Date(event.timestamp || event.createdAt),
                        status: event.status || 'success',
                        userId: event.userId || event.user_id,
                        sessionId: event.sessionId || event.session_id,
                        organizationId: event.organizationId || event.organization_id,
                        metadata: typeof event.metadata === 'string'
                            ? JSON.parse(event.metadata)
                            : event.metadata || {},
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
                }
                catch (findManyError) {
                    // If findMany fails with "model not found", try raw SQL
                    if (findManyError?.message?.includes('not found in schema') ||
                        findManyError?.message?.includes('Model') ||
                        findManyError?.code === 'P2025') {
                        // Fall through to raw SQL fallback
                    }
                    else {
                        // Re-throw other errors
                        throw findManyError;
                    }
                }
            }
            // Fallback to raw SQL if findMany failed or not available
            // Check both the adapter and potentially the underlying client (for Prisma)
            const underlyingAdapter = adapter?._client || adapter?.client || adapter;
            const useRawSQL = adapter.$queryRaw ||
                adapter.$queryRawUnsafe ||
                adapter.queryRaw ||
                adapter.executeRaw ||
                underlyingAdapter?.$queryRaw ||
                underlyingAdapter?.$queryRawUnsafe ||
                underlyingAdapter?.queryRaw ||
                underlyingAdapter?.executeRaw;
            if (useRawSQL) {
                // Use the adapter that has the raw SQL method
                const sqlAdapter = adapter.$queryRawUnsafe || adapter.$queryRawUnsafe
                    ? adapter
                    : underlyingAdapter?.$queryRawUnsafe || underlyingAdapter?.$queryRaw
                        ? underlyingAdapter
                        : adapter;
                try {
                    // Build WHERE clause
                    const whereConditions = [];
                    const params = [];
                    let paramIndex = 1;
                    if (after) {
                        if (sort === 'desc') {
                            whereConditions.push(`id < $${paramIndex}`);
                        }
                        else {
                            whereConditions.push(`id > $${paramIndex}`);
                        }
                        params.push(after);
                        paramIndex++;
                    }
                    if (type) {
                        whereConditions.push(`type = $${paramIndex}`);
                        params.push(type);
                        paramIndex++;
                    }
                    if (userId) {
                        whereConditions.push(`user_id = $${paramIndex}`);
                        params.push(userId);
                        paramIndex++;
                    }
                    if (since) {
                        whereConditions.push(`timestamp >= $${paramIndex}`);
                        params.push(since instanceof Date ? since : new Date(since));
                        paramIndex++;
                    }
                    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
                    const orderDirection = sort === 'desc' ? 'DESC' : 'ASC';
                    // Use appropriate raw SQL method
                    let queryFn;
                    if (sqlAdapter.$queryRawUnsafe || adapter.$queryRawUnsafe) {
                        // Prisma - build query with parameters embedded
                        let query = `SELECT * FROM ${tableName} ${whereClause} ORDER BY timestamp ${orderDirection}, id ${orderDirection} LIMIT ${limit + 1}`;
                        // Replace $1, $2, etc. with actual values for Prisma
                        params.forEach((param, index) => {
                            const placeholder = `$${index + 1}`;
                            const value = typeof param === 'string'
                                ? `'${param.replace(/'/g, "''")}'`
                                : param === null
                                    ? 'NULL'
                                    : param instanceof Date
                                        ? `'${param.toISOString()}'`
                                        : String(param);
                            query = query.replace(new RegExp(`\\${placeholder}(?![0-9])`, 'g'), value);
                        });
                        const queryMethod = sqlAdapter.$queryRawUnsafe || adapter.$queryRawUnsafe;
                        queryFn = async (q) => await queryMethod(q);
                        const result = await queryFn(query);
                        const hasMore = result.length > limit;
                        const paginatedEvents = result.slice(0, limit).map((event) => ({
                            id: event.id,
                            type: event.type,
                            timestamp: new Date(event.timestamp || event.created_at),
                            status: event.status || 'success',
                            userId: event.user_id || event.userId,
                            sessionId: event.session_id || event.sessionId,
                            organizationId: event.organization_id || event.organizationId,
                            metadata: typeof event.metadata === 'string'
                                ? JSON.parse(event.metadata)
                                : event.metadata || {},
                            ipAddress: event.ip_address || event.ipAddress,
                            userAgent: event.user_agent || event.userAgent,
                            source: event.source || 'app',
                            display: {
                                message: event.display_message || event.displayMessage || event.type,
                                severity: event.display_severity || event.displaySeverity || 'info',
                            },
                        }));
                        return {
                            events: paginatedEvents,
                            hasMore,
                            nextCursor: hasMore ? paginatedEvents[paginatedEvents.length - 1].id : null,
                        };
                    }
                    else {
                        // Other adapters - use parameterized query
                        const query = `SELECT * FROM ${tableName} ${whereClause} ORDER BY timestamp ${orderDirection}, id ${orderDirection} LIMIT $${paramIndex}`;
                        params.push(limit + 1);
                        if (sqlAdapter.$queryRaw || adapter.$queryRaw) {
                            const queryMethod = sqlAdapter.$queryRaw || adapter.$queryRaw;
                            queryFn = async (q) => await queryMethod(q, ...params);
                        }
                        else if (sqlAdapter.queryRaw || adapter.queryRaw) {
                            const queryMethod = sqlAdapter.queryRaw || adapter.queryRaw;
                            queryFn = async (q) => await queryMethod(q, params);
                        }
                        else {
                            throw new Error('Raw SQL not supported');
                        }
                        const result = await queryFn(query);
                        const hasMore = result.length > limit;
                        const paginatedEvents = result.slice(0, limit).map((event) => ({
                            id: event.id,
                            type: event.type,
                            timestamp: new Date(event.timestamp || event.created_at),
                            status: event.status || 'success',
                            userId: event.user_id || event.userId,
                            sessionId: event.session_id || event.sessionId,
                            organizationId: event.organization_id || event.organizationId,
                            metadata: typeof event.metadata === 'string'
                                ? JSON.parse(event.metadata)
                                : event.metadata || {},
                            ipAddress: event.ip_address || event.ipAddress,
                            userAgent: event.user_agent || event.userAgent,
                            source: event.source || 'app',
                            display: {
                                message: event.display_message || event.displayMessage || event.type,
                                severity: event.display_severity || event.displaySeverity || 'info',
                            },
                        }));
                        return {
                            events: paginatedEvents,
                            hasMore,
                            nextCursor: hasMore ? paginatedEvents[paginatedEvents.length - 1].id : null,
                        };
                    }
                }
                catch (rawError) {
                    // If raw SQL also fails, return empty result
                    console.warn('Raw SQL query failed:', rawError);
                    return {
                        events: [],
                        hasMore: false,
                        nextCursor: null,
                    };
                }
            }
            // If we get here, neither findMany nor raw SQL worked
            throw new Error('Adapter does not support findMany or raw SQL');
        },
    };
}
//# sourceMappingURL=helpers.js.map