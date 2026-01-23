import type { DatabaseDetectionResult, DetectionInfo } from "../types";
/**
 * Detect database type and version from installed packages
 * @param cwd - Current working directory to search in
 * @returns DetectionInfo with database name and version, or undefined if not found
 */
export declare function detectDatabase(cwd?: string): Promise<DetectionInfo | undefined>;
/**
 * Enhanced database detection with dialect information
 * @param cwd - Current working directory to search in
 * @returns DatabaseDetectionResult with database name, version, and dialect info
 */
export declare function detectDatabaseWithDialect(cwd?: string): Promise<DatabaseDetectionResult | undefined>;
/**
 * Get all detected databases (useful for projects with multiple database connections)
 * @param cwd - Current working directory to search in
 * @returns Array of all detected databases
 */
export declare function detectAllDatabases(cwd?: string): Promise<DatabaseDetectionResult[]>;
//# sourceMappingURL=database-detection.d.ts.map