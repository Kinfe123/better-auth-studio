import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, writeFileSync, unlinkSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { findAuthConfig } from '../src/config';
import { getAuthAdapter } from '../src/auth-adapter';

describe('Config', () => {
  const testDir = join(process.cwd(), '.test-temp');
  const originalCwd = process.cwd();

  beforeEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    mkdirSync(testDir, { recursive: true });
    // Use absolute paths instead of chdir
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should find auth config in current directory', async () => {
    const authConfigContent = `
      import { betterAuth } from "better-auth";
      export const auth = betterAuth({
        secret: "test-secret",
      });
    `;
    const filePath = join(testDir, 'auth.ts');
    writeFileSync(filePath, authConfigContent);
    const configAdapter = await getAuthAdapter(filePath as string);
    expect(configAdapter).toBeDefined();
    expect(configAdapter).toHaveProperty('getSessions');

  });

  it('should return null for missing config file', async () => {
    const config = await findAuthConfig(join(testDir, 'non-existent-auth.js'));
    expect(config).toBeNull();
  });

  it('should handle invalid config file gracefully', async () => {
    writeFileSync(join(testDir, 'auth.js'), 'invalid syntax here');

    const config = await findAuthConfig(join(testDir, 'auth.js'));
    expect(config).toBeNull();
  });

  it.only('should find config in src directory', async () => {
    mkdirSync(join(testDir, 'src'), { recursive: true });

    const authConfigContent = `
      import { betterAuth } from "better-auth";
      export const auth = betterAuth({
        secret: "test-secret",
      });
    `;

    writeFileSync(join(testDir, 'src', 'auth.ts'), authConfigContent);

    const config = await findAuthConfig(join(testDir, 'src', 'auth.ts'));
    expect(typeof config === 'object').toBe(true);
    expect(config).toHaveProperty("emailAndPassword")
    expect(config?.emailAndPassword).toHaveProperty("enabled")
    expect(config?.emailAndPassword?.enabled).toBe(false)
  });

  it('should handle config with social providers', async () => {
    const authConfigContent = `
      import { betterAuth } from "better-auth";
      export const auth = betterAuth({
        secret: "test-secret",
        socialProviders: {
          github: {
            clientId: "test-id",
            clientSecret: "test-secret"
          }
        }
      });
    `;

    writeFileSync(join(testDir, 'auth.ts'), authConfigContent);

    const config = await findAuthConfig(join(testDir, 'auth.ts'));
    expect(typeof config === 'object').toBe(true);
    expect(config).toHaveProperty('socialProviders');
    expect(config?.socialProviders).toHaveLength(1);
  });
});
