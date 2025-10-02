import { getPackageVersion } from "./package-json.js";
import type { DetectionInfo, DatabaseDetectionResult } from "../types";

const DATABASES: Record<string, string> = {
	"drizzle-orm": "drizzle",
	"@prisma/client": "prisma",
    mongoose: "mongodb",
	mongodb: "mongodb",
    pg: "postgresql",
	mysql: "mysql",
	mariadb: "mariadb",
	sqlite3: "sqlite",
	"better-sqlite3": "sqlite",
	
};

const DATABASE_DIALECTS: Record<string, string[]> = {
	postgresql: ["pg", "postgres"],
	mysql: ["mysql", "mysql2"],
	mariadb: ["mariadb"],
	sqlite: ["sqlite3", "better-sqlite3"],
	prisma: ["@prisma/client"],
	mongodb: ["mongoose", "mongodb"],
	drizzle: ["drizzle-orm"],
};

/**
 * Detect database type and version from installed packages
 * @param cwd - Current working directory to search in
 * @returns DetectionInfo with database name and version, or undefined if not found
 */
export async function detectDatabase(cwd?: string): Promise<DetectionInfo | undefined> {
	for (const [pkg, name] of Object.entries(DATABASES)) {
		const version = await getPackageVersion(pkg, cwd);
		if (version) return { name, version };
	}
	return undefined;
}

/**
 * Enhanced database detection with dialect information
 * @param cwd - Current working directory to search in
 * @returns DatabaseDetectionResult with database name, version, and dialect info
 */
export async function detectDatabaseWithDialect(cwd?: string): Promise<DatabaseDetectionResult | undefined> {
	const detection = await detectDatabase(cwd);
    console.log('detection', detection);
	if (!detection) return undefined;

	let dialect = detection.name;
	let adapter = detection.name;

	switch (detection.name) {
		case "postgresql":
			dialect = "postgresql";
			adapter = "pg";
			break;
		case "mysql":
			dialect = "mysql";
			adapter = "mysql2";
			break;
		case "sqlite":
			const sqlite3Version = await getPackageVersion("sqlite3", cwd);
			const betterSqlite3Version = await getPackageVersion("better-sqlite3", cwd);
			
			if (betterSqlite3Version) {
				adapter = "better-sqlite3";
			} else if (sqlite3Version) {
				adapter = "sqlite3";
			}
			break;
		case "prisma":
			const prismaDialect = await detectPrismaDialect(cwd);
			if (prismaDialect) {
				dialect = prismaDialect;
			}
			adapter = "prisma";
			break;
		case "drizzle":
			const drizzleDialect = await detectDrizzleDialect(cwd);
			if (drizzleDialect) {
				dialect = drizzleDialect;
			}
			adapter = "drizzle";
			break;
	}

	return {
		name: detection.name,
		version: detection.version,
		dialect,
		adapter,
	};
}

async function detectPrismaDialect(cwd?: string): Promise<string | undefined> {
	const drivers = [
		{ pkg: "pg", dialect: "postgresql" },
		{ pkg: "mysql2", dialect: "mysql" },
		{ pkg: "sqlite3", dialect: "sqlite" },
		{ pkg: "better-sqlite3", dialect: "sqlite" },
	];

	for (const { pkg, dialect } of drivers) {
		const version = await getPackageVersion(pkg, cwd);
		if (version) return dialect;
	}

	return undefined;
}

async function detectDrizzleDialect(cwd?: string): Promise<string | undefined> {
	const drizzleDrivers = [
		{ pkg: "drizzle-orm/postgres-js", dialect: "postgresql" },
		{ pkg: "drizzle-orm/node-postgres", dialect: "postgresql" },
		{ pkg: "drizzle-orm/mysql2", dialect: "mysql" },
		{ pkg: "drizzle-orm/better-sqlite3", dialect: "sqlite" },
		{ pkg: "drizzle-orm/libsql", dialect: "sqlite" },
		{ pkg: "postgres", dialect: "postgresql" },
		{ pkg: "mysql2", dialect: "mysql" },
		{ pkg: "better-sqlite3", dialect: "sqlite" },
	];

	for (const { pkg, dialect } of drizzleDrivers) {
        try {
        const version = await getPackageVersion(pkg, cwd);
		if (version) return dialect;
        } catch (error) {
        }
	}

	return undefined;
}

/**
 * Get all detected databases (useful for projects with multiple database connections)
 * @param cwd - Current working directory to search in
 * @returns Array of all detected databases
 */
export async function detectAllDatabases(cwd?: string): Promise<DatabaseDetectionResult[]> {
	const results: DatabaseDetectionResult[] = [];

	for (const [pkg, name] of Object.entries(DATABASES)) {
		const version = await getPackageVersion(pkg, cwd);
		if (version) {
			const detection = await detectDatabaseWithDialect(cwd);
			if (detection && detection.name === name) {
				results.push(detection);
			}
		}
	}

	return results;
}
