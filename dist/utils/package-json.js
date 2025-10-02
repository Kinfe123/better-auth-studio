import { existsSync, readFileSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { createRequire } from 'module';
/**
 * Find the project root by looking for package.json files up the directory tree
 * @param startDir - Directory to start searching from
 * @returns Path to the project root directory
 */
function findProjectRoot(startDir) {
    let currentDir = resolve(startDir);
    const root = resolve('/');
    while (currentDir !== root) {
        const packageJsonPath = join(currentDir, 'package.json');
        if (existsSync(packageJsonPath)) {
            return currentDir;
        }
        currentDir = dirname(currentDir);
    }
    return startDir;
}
/**
 * Get the version of a package from package.json
 * @param packageName - The name of the package to check
 * @param cwd - The current working directory to search from (defaults to process.cwd())
 * @returns The version string if found, undefined otherwise
 */
export async function getPackageVersion(packageName, cwd) {
    const searchDir = cwd || process.cwd();
    try {
        const projectRoot = findProjectRoot(searchDir);
        const packageJsonPath = join(searchDir, 'package.json');
        if (existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            if (packageJson.dependencies?.[packageName]) {
                return packageJson.dependencies[packageName].replace(/[\^~]/, '');
            }
            if (packageJson.devDependencies?.[packageName]) {
                return packageJson.devDependencies[packageName].replace(/[\^~]/, '');
            }
            if (packageJson.peerDependencies?.[packageName]) {
                return packageJson.peerDependencies[packageName].replace(/[\^~]/, '');
            }
        }
        try {
            const require = createRequire(import.meta.url);
            const packagePath = require.resolve(`${packageName}/package.json`, {
                paths: [projectRoot]
            });
            if (existsSync(packagePath)) {
                const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
                return packageJson.version;
            }
        }
        catch (resolveError) {
            // Only log unexpected errors, not MODULE_NOT_FOUND which is expected
            if (resolveError.code !== 'MODULE_NOT_FOUND') {
                console.warn(`Unexpected error resolving ${packageName}:`, resolveError.message);
            }
        }
        return undefined;
    }
    catch (error) {
        console.warn(`Failed to get version for package ${packageName}:`, error);
        return undefined;
    }
}
//# sourceMappingURL=package-json.js.map