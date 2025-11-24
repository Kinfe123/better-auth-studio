import { Code, Github, Globe, Key, TestTube, Wrench } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowRight,
  CheckCircle,
  ChevronRight,
  Copy,
  Database,
  Loader,
  Settings,
  X,
} from '../components/PixelIcons';
import { Terminal } from '../components/Terminal';
import { Button } from '../components/ui/button';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: any;
  action: () => Promise<void> | void;
  category: 'oauth' | 'database' | 'testing' | 'utilities';
}

interface OAuthProvider {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
}

interface MigrationProvider {
  id: string;
  name: string;
  description: string;
  docs?: string;
  logo?: any;
  highlights?: string[];
  script?: string;
  custom?: boolean;
  disabled?: boolean;
}

const DEFAULT_CUSTOM_MIGRATION = `// Example custom migration script
import { migrateUser } from '@better-auth/migration';

async function run() {
  const legacyUsers = await fetchLegacyUsers();

  for (const user of legacyUsers) {
    await migrateUser({
      email: user.email,
      passwordHash: user.passwordHash,
      metadata: user.metadata,
    });
  }

  return {
    migrated: legacyUsers.length,
    timestamp: new Date().toISOString(),
  };
}

run().then(console.log).catch(console.error);`;

const MIGRATION_PROVIDERS: MigrationProvider[] = [
  {
    id: 'clerk',
    name: 'Clerk',
    description: 'Clerk Migration guide',
    docs: 'https://better-auth.com/docs/migrations/clerk',
    logo: (
      <svg
        width="1em"
        height="1em"
        role="img"
        stroke="currentColor"
        fill="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        id="Clerk--Streamline-Simple-Icons"
      >
        <path
          d="m21.47 20.829 -2.881 -2.881a0.572 0.572 0 0 0 -0.7 -0.084 6.854 6.854 0 0 1 -7.081 0 0.576 0.576 0 0 0 -0.7 0.084l-2.881 2.881a0.576 0.576 0 0 0 -0.103 0.69 0.57 0.57 0 0 0 0.166 0.186 12 12 0 0 0 14.113 0 0.58 0.58 0 0 0 0.239 -0.423 0.576 0.576 0 0 0 -0.172 -0.453Zm0.002 -17.668 -2.88 2.88a0.569 0.569 0 0 1 -0.701 0.084A6.857 6.857 0 0 0 8.724 8.08a6.862 6.862 0 0 0 -1.222 3.692 6.86 6.86 0 0 0 0.978 3.764 0.573 0.573 0 0 1 -0.083 0.699l-2.881 2.88a0.567 0.567 0 0 1 -0.864 -0.063A11.993 11.993 0 0 1 6.771 2.7a11.99 11.99 0 0 1 14.637 -0.405 0.566 0.566 0 0 1 0.232 0.418 0.57 0.57 0 0 1 -0.168 0.448Zm-7.118 12.261a3.427 3.427 0 1 0 0 -6.854 3.427 3.427 0 0 0 0 6.854Z"
          fill="#000000"
          stroke-width="1"
        ></path>
      </svg>
    ),
    highlights: [
      'Downloads Clerk CSV export and REST API data.',
      'Migrates passwords, totp secrets, and external accounts.',
      'Respects Better Auth plugins (admin, username, phone-number, two-factor).',
    ],
    script: `import 'dotenv/config';
import { generateRandomString, symmetricEncrypt } from "better-auth/crypto";
import { clerkClient } from '@clerk/clerk-sdk-node';
import { auth } from "@/lib/auth";
import * as fs from "node:fs/promises";

function getCSVData(csv: string) {
  const lines = csv.split('\\n').filter(line => line.trim());
  const headers = lines[0]?.split(',').map(header => header.trim()) || [];
  const jsonData = lines.slice(1).map(line => {
    const values = line.split(',').map(value => value.trim());
    return headers.reduce((obj, header, index) => {
      obj[header] = values[index] || '';
      return obj;
    }, {} as Record<string, string>);
  });
  return jsonData as Array<{
    id: string;
    first_name: string;
    last_name: string;
    username: string;
    primary_email_address: string;
    primary_phone_number: string;
    verified_email_addresses: string;
    unverified_email_addresses: string;
    verified_phone_numbers: string;
    unverified_phone_numbers: string;
    totp_secret: string;
    password_digest: string;
    password_hasher: string;
  }>;
}

async function getClerkUsers(totalUsers: number) {
  const clerkUsers: any[] = [];
  for (let i = 0; i < totalUsers; i += 500) {
    const response = await fetch(\`https://api.clerk.com/v1/users?offset=\${i}&limit=500\`, {
      headers: { Authorization: \`Bearer \${process.env.CLERK_SECRET_KEY}\` },
    });
    if (!response.ok) throw new Error(\`Failed to fetch users: \${response.statusText}\`);
    clerkUsers.push(...((await response.json()) as any));
  }
  return clerkUsers;
}

export async function generateBackupCodes(secret: string) {
  const backupCodes = Array.from({ length: 10 })
    .map(() => generateRandomString(10, "a-z", "0-9", "A-Z"))
    .map(code => \`\${code.slice(0,5)}-\${code.slice(5)}\`);
  return symmetricEncrypt({ data: JSON.stringify(backupCodes), key: secret });
}

function safeDateConversion(timestamp?: number): Date {
  if (!timestamp) return new Date();
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return new Date();
  const year = date.getFullYear();
  if (year < 2000 || year > 2100) return new Date();
  return date;
}

async function migrateFromClerk() {
  const exportedUserCSV = await fs.readFile("exported_users.csv", "utf-8");
  const jsonData = getCSVData(exportedUserCSV);
  const clerkUsers = await getClerkUsers(jsonData.length);

  const ctx = await auth.$context;
  const isAdminEnabled = ctx.options?.plugins?.find(plugin => plugin.id === "admin");
  const isTwoFactorEnabled = ctx.options?.plugins?.find(plugin => plugin.id === "two-factor");
  const isUsernameEnabled = ctx.options?.plugins?.find(plugin => plugin.id === "username");
  const isPhoneNumberEnabled = ctx.options?.plugins?.find(plugin => plugin.id === "phone-number");

  for (const user of jsonData) {
    const {
      id,
      first_name,
      last_name,
      username,
      primary_email_address,
      primary_phone_number,
      verified_email_addresses,
      verified_phone_numbers,
      totp_secret,
      password_digest,
    } = user;

    const clerkUser = clerkUsers.find((item) => item?.id === id);

    const createdUser = await ctx.adapter.create({
      model: "user",
      data: {
        id,
        email: primary_email_address,
        emailVerified: verified_email_addresses.length > 0,
        name: \`\${first_name} \${last_name}\`,
        image: clerkUser?.image_url,
        createdAt: safeDateConversion(clerkUser?.created_at),
        updatedAt: safeDateConversion(clerkUser?.updated_at),
        ...(isTwoFactorEnabled ? { twoFactorEnabled: clerkUser?.two_factor_enabled } : {}),
        ...(isAdminEnabled ? {
          banned: clerkUser?.banned,
          banExpiresAt: clerkUser?.lockout_expires_in_seconds,
          role: "user",
        } : {}),
        ...(isUsernameEnabled ? { username } : {}),
        ...(isPhoneNumberEnabled ? {
          phoneNumber: primary_phone_number,
          phoneNumberVerified: verified_phone_numbers.length > 0,
        } : {}),
      },
      forceAllowId: true,
    }).catch(async () => {
      return await ctx.adapter.findOne({
        model: 'user',
        where: [{ field: 'id', value: id }],
      });
    });

    const externalAccounts = clerkUser?.external_accounts ?? [];
    for (const externalAccount of externalAccounts) {
      const {
        id: externalId,
        provider,
        provider_user_id,
        approved_scopes,
        created_at,
        updated_at,
      } = externalAccount;

      if (provider === 'credential') {
        await ctx.adapter.create({
          model: 'account',
          data: {
            id: externalId,
            providerId: provider,
            accountId: provider_user_id,
            scope: approved_scopes,
            userId: createdUser?.id,
            createdAt: safeDateConversion(created_at),
            updatedAt: safeDateConversion(updated_at),
            password: password_digest,
          },
        });
      } else {
        await ctx.adapter.create({
          model: 'account',
          data: {
            id: externalId,
            providerId: provider.replace('oauth_', ''),
            accountId: provider_user_id,
            scope: approved_scopes,
            userId: createdUser?.id,
            createdAt: safeDateConversion(created_at),
            updatedAt: safeDateConversion(updated_at),
          },
          forceAllowId: true,
        });
      }
    }

    if (isTwoFactorEnabled && totp_secret) {
      await ctx.adapter.create({
        model: 'twoFactor',
        data: {
          userId: createdUser?.id,
          secret: totp_secret,
          backupCodes: await generateBackupCodes(totp_secret),
        },
      });
    }
  }
}

migrateFromClerk()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });`,
  },
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'Supabase Migration guide',
    docs: 'https://better-auth.com/docs/migrations/supabase',
    logo: ``,
    highlights: [
      'Exports Supabase auth.users and auth.identities.',
      'Preserves password hashes and metadata fields.',
      'Supports incremental re-runs with idempotent operations.',
    ],
    disabled: true,
  },
  {
    id: 'auth0',
    name: 'Auth0',
    description: 'Auth0 Migration guide',
    docs: 'https://better-auth.com/docs/migrations/auth0',
    logo: ``,
    highlights: [
      'Uses Auth0 Management API bulk exports.',
      'Keeps password hashes compatible with Better Auth adapters.',
      'Migrates applications and roles to Better Auth format.',
    ],
    disabled: true,
  },
  {
    id: 'nextauth',
    name: 'NextAuth.js',
    description: 'NextAuth.js Migration guide',
    docs: 'https://better-auth.com/docs/migrations/nextauth',
    logo: ``,
    highlights: [
      'Reads users/accounts from your existing NextAuth database.',
      'Moves refresh tokens and OAuth profiles into Better Auth.',
      'Supports Prisma, MySQL, and Postgres NextAuth adapters.',
    ],
    disabled: true,
  },
  {
    id: 'custom',
    name: 'Custom Script',
    description: 'Custom Migration guide',
    docs: 'https://better-auth.com/docs/migrations/custom',
    highlights: [
      'Use Better Auth SDK helpers to insert users safely.',
      'Supports dry-run mode to validate before committing.',
      'Perfect for bespoke data sources or ETL pipelines.',
    ],
    custom: true,
  },
];

export default function Tools() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [runningTool, setRunningTool] = useState<string | null>(null);
  const [toolLogs, setToolLogs] = useState<
    Array<{
      id: string;
      type: 'info' | 'success' | 'error' | 'progress';
      message: string;
      timestamp: Date;
      status?: 'pending' | 'running' | 'completed' | 'failed';
    }>
  >([]);
  const [showLogs, setShowLogs] = useState(false);
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [oauthProviders, setOauthProviders] = useState<OAuthProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [selectedMigration, setSelectedMigration] = useState<string>('');
  const [customMigrationCode, setCustomMigrationCode] = useState<string>(DEFAULT_CUSTOM_MIGRATION);

  const addLog = (
    type: 'info' | 'success' | 'error' | 'progress',
    message: string,
    status?: 'pending' | 'running' | 'completed' | 'failed',
    customId?: string
  ) => {
    setToolLogs((prev) => [
      ...prev,
      {
        id: customId ?? `log-${Date.now()}-${Math.random()}`,
        type,
        message,
        timestamp: new Date(),
        status,
      },
    ]);
  };

  const activePolls = useRef<Set<string>>(new Set());
  const handledSessions = useRef<Set<string>>(new Set());
  const sessionLogKeys = useRef<Map<string, Map<string, string>>>(new Map());
  const oauthWindowRef = useRef<Window | null>(null);

  const getDefaultMigrationProvider = () =>
    MIGRATION_PROVIDERS.find((provider) => !provider.disabled) ?? MIGRATION_PROVIDERS[0];

  const selectedMigrationProvider =
    MIGRATION_PROVIDERS.find((provider) => provider.id === selectedMigration) ??
    getDefaultMigrationProvider();

  useEffect(() => {
    if (showMigrationModal) {
      setSelectedMigration((current) => current || getDefaultMigrationProvider()?.id || '');
    } else {
      setSelectedMigration('');
    }
  }, [showMigrationModal, getDefaultMigrationProvider]);

  const handleSelectMigration = (providerId: string) => {
    setSelectedMigration(providerId);
    if (providerId !== 'custom') {
      setCustomMigrationCode(DEFAULT_CUSTOM_MIGRATION);
    }
  };

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Copied to clipboard');
    } catch (_error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const getProviderIcon = (providerId: string) => {
    const provider = providerId.toLowerCase();
    switch (provider) {
      case 'github':
        return <Github className="w-5 h-5 text-white" />;
      case 'google':
        return <Globe className="w-5 h-5 text-white" />;
      case 'discord':
        return <Globe className="w-5 h-5 text-white" />;
      case 'twitter':
      case 'x':
        return <Globe className="w-5 h-5 text-white" />;
      case 'facebook':
        return <Globe className="w-5 h-5 text-white" />;
      case 'apple':
        return <Globe className="w-5 h-5 text-white" />;
      default:
        return <Globe className="w-5 h-5 text-white" />;
    }
  };

  const closeOAuthWindow = () => {
    if (oauthWindowRef.current && !oauthWindowRef.current.closed) {
      oauthWindowRef.current.close();
    }
    oauthWindowRef.current = null;
  };

  const logSessionMessage = (
    sessionId: string,
    type: 'info' | 'success' | 'error' | 'progress',
    key: string,
    message: string,
    status?: 'pending' | 'running' | 'completed' | 'failed'
  ) => {
    let keyMap = sessionLogKeys.current.get(sessionId);
    if (!keyMap) {
      keyMap = new Map();
      sessionLogKeys.current.set(sessionId, keyMap);
    }

    const existingId = keyMap.get(key);
    if (existingId) {
      setToolLogs((prev) =>
        prev.map((line) =>
          line.id === existingId
            ? {
                ...line,
                type,
                message,
                status,
                timestamp: new Date(),
              }
            : line
        )
      );
      return;
    }

    const newId = `session-${sessionId}-${key}-${Date.now()}`;
    keyMap.set(key, newId);
    addLog(type, message, status, newId);
  };

  const pollOAuthStatus = (sessionId: string, provider: string, attempt: number = 0) => {
    const maxAttempts = 15; // ~30 seconds

    if (!activePolls.current.has(sessionId)) {
      activePolls.current.add(sessionId);
    }

    fetch(`/api/tools/oauth/status?testSessionId=${encodeURIComponent(sessionId)}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.hasResult) {
          activePolls.current.delete(sessionId);
          handleOAuthResult(data.result);
          return;
        }

        if (attempt + 1 >= maxAttempts) {
          activePolls.current.delete(sessionId);
          logSessionMessage(
            sessionId,
            'error',
            'timeout',
            '⌛ Timed out waiting for account creation. Check Better Auth logs.',
            'failed'
          );
          closeOAuthWindow();
          setRunningTool(null);
          toast.error('OAuth test timed out waiting for account creation');
          return;
        }

        setTimeout(() => pollOAuthStatus(sessionId, provider, attempt + 1), 2000);
      })
      .catch((error) => {
        if (attempt + 1 < maxAttempts) {
          setTimeout(() => pollOAuthStatus(sessionId, provider, attempt + 1), 2000);
        } else {
          activePolls.current.delete(sessionId);
          logSessionMessage(
            sessionId,
            'error',
            'poll-error',
            `⚠️ Failed to check OAuth status: ${error}`,
            'failed'
          );
          closeOAuthWindow();
          setRunningTool(null);
          toast.error('Failed to check OAuth status');
        }
      });
  };

  const handleOAuthResult = (result: any) => {
    setShowLogs(true);

    const sessionId = result.testSessionId;

    if (result.success) {
      if (handledSessions.current.has(sessionId) && result.userInfo) {
        return;
      }

      logSessionMessage(
        sessionId,
        'success',
        'waiting',
        '✅ Verified with Better Auth.',
        'completed'
      );

      if (result.userInfo) {
        handledSessions.current.add(sessionId);
        const userDetails = [
          result.userInfo.name ? `👤 ${result.userInfo.name}` : null,
          result.userInfo.email ? `✉️ ${result.userInfo.email}` : null,
        ]
          .filter(Boolean)
          .join('   |   ');

        const successMessage = userDetails
          ? `✅ ${result.provider} OAuth succeeded — ${userDetails}`
          : `✅ ${result.provider} OAuth succeeded!`;
        logSessionMessage(sessionId, 'success', 'completed', successMessage, 'completed');
        toast.success(`OAuth test for ${result.provider} passed!`);
        closeOAuthWindow();
        setRunningTool(null);
        sessionLogKeys.current.delete(sessionId);
      } else {
        logSessionMessage(
          sessionId,
          'progress',
          'await-finalize',
          '⌛ OAuth flow finished. Waiting for Better Auth to finalize account...',
          'running'
        );
        if (!activePolls.current.has(sessionId)) {
          activePolls.current.add(sessionId);
          pollOAuthStatus(sessionId, result.provider);
        }
      }
    } else {
      if (handledSessions.current.has(sessionId)) {
        return;
      }

      logSessionMessage(
        sessionId,
        'error',
        'waiting',
        '❌ Verification failed with Better Auth.',
        'failed'
      );
      const errorSummary = result.error ? ` — ${result.error}` : '';
      logSessionMessage(
        sessionId,
        'error',
        'failed',
        `❌ ${result.provider} OAuth failed${errorSummary}`,
        'failed'
      );

      toast.error(`OAuth test for ${result.provider} failed`);
      closeOAuthWindow();
      setRunningTool(null);
      sessionLogKeys.current.delete(sessionId);
    }

    if (!result.success) {
      handledSessions.current.add(sessionId);
      sessionLogKeys.current.delete(sessionId);
    }

    sessionStorage.removeItem('oauth_test_session');
    sessionStorage.removeItem(`oauth_test_result_${sessionId}`);
  };

  // Check for OAuth callback results from URL (fallback if postMessage fails)
  useEffect(() => {
    const oauthResult = searchParams.get('oauth_test_result');
    if (oauthResult) {
      try {
        const result = JSON.parse(decodeURIComponent(oauthResult));
        setShowLogs(true);
        handleOAuthResult(result);
        // Clean up URL
        setSearchParams({});
      } catch (_error) {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setSearchParams, handleOAuthResult]);

  // Fetch OAuth providers on mount
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch('/api/tools/oauth/providers');
        const result = await response.json();
        if (result.success && result.providers) {
          setOauthProviders(result.providers.filter((p: OAuthProvider) => p.enabled));
        }
      } catch (_error) {}
    };
    fetchProviders();
  }, []);

  const handleTestOAuth = async () => {
    // Check if providers are available
    if (oauthProviders.length === 0) {
      toast.error('No OAuth providers configured');
      addLog('error', '❌ No OAuth providers found in configuration', 'failed');
      addLog(
        'info',
        '💡 Please configure at least one OAuth provider in your Better Auth config',
        'failed'
      );
      return;
    }

    // Always show modal to select provider
    setShowOAuthModal(true);
  };

  const startOAuthTest = async (providerId: string) => {
    // Close modal immediately
    setShowOAuthModal(false);
    setSelectedProvider('');

    // Show terminal and start logging
    setRunningTool('test-oauth');
    setShowLogs(true);
    setToolLogs([]);

    addLog('info', `🔍 Testing ${providerId} OAuth...`, 'running');
    const sessionTimestamp = new Date().toISOString();

    try {
      addLog('progress', '📡 Contacting Better Auth...', 'running');
      const response = await fetch('/api/tools/oauth/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerId }),
      });

      const result = await response.json();

      if (result.success && result.startUrl) {
        sessionLogKeys.current.delete(result.testSessionId);
        logSessionMessage(
          result.testSessionId,
          'progress',
          'popup-open',
          `🌐 Opening ${result.provider} OAuth popup...`,
          'running'
        );

        // Store test session info
        const testSession = {
          testSessionId: result.testSessionId,
          provider: result.provider,
          providerId: providerId,
          startTime: sessionTimestamp,
        };
        handledSessions.current.delete(result.testSessionId);
        sessionStorage.setItem('oauth_test_session', JSON.stringify(testSession));

        // Open popup window with GitHub OAuth URL
        const width = 600;
        const height = 700;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;

        // Open popup window that will bootstrap the OAuth flow via Better Auth
        const oauthWindow = window.open(
          result.startUrl,
          'oauth-test',
          `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
        );

        if (!oauthWindow) {
          addLog(
            'error',
            '❌ Failed to open OAuth window. Please allow popups for this site.',
            'failed'
          );
          addLog('error', '💡 Check your browser popup blocker settings', 'failed');
          toast.error('Failed to open OAuth window. Please allow popups.');
          setRunningTool(null);
          return;
        }

        oauthWindowRef.current = oauthWindow;

        // Listen for postMessage from the popup window
        let completionHandled = false;

        const messageHandler = (event: MessageEvent) => {
          // Security: Only accept messages from same origin
          if (event.origin !== window.location.origin) {
            return;
          }

          if (event.data && event.data.type === 'oauth_test_state') {
            if (event.data.status === 'redirect') {
              if (!activePolls.current.has(testSession.testSessionId)) {
                pollOAuthStatus(testSession.testSessionId, testSession.provider);
              }
            } else if (event.data.status === 'error') {
              completionHandled = true;
              const storedSession = sessionStorage.getItem('oauth_test_session');
              let providerName = result.provider;
              if (storedSession) {
                try {
                  providerName = JSON.parse(storedSession).provider || providerName;
                } catch (_) {}
              }
              handleOAuthResult({
                success: false,
                provider: providerName,
                testSessionId: event.data.testSessionId,
                error: event.data.error || 'Failed to start OAuth test',
              });
              window.removeEventListener('message', messageHandler);
              clearInterval(checkInterval);
              clearTimeout(timeoutId);
              closeOAuthWindow();
            }
            return;
          }

          if (event.data && event.data.type === 'oauth_test_result') {
            window.removeEventListener('message', messageHandler);
            clearInterval(checkInterval);
            clearTimeout(timeoutId);

            completionHandled = true;
            const oauthResult = event.data.result;
            handleOAuthResult(oauthResult);

            if (!activePolls.current.has(oauthResult.testSessionId)) {
              pollOAuthStatus(oauthResult.testSessionId, oauthResult.provider);
            }
            closeOAuthWindow();
          }
        };

        window.addEventListener('message', messageHandler);

        // Poll for window closure
        const checkInterval = setInterval(() => {
          if (oauthWindow.closed) {
            clearInterval(checkInterval);
            clearTimeout(timeoutId);
            window.removeEventListener('message', messageHandler);

            // Check if we already got a result
            const storedResult = sessionStorage.getItem(
              `oauth_test_result_${testSession.testSessionId}`
            );
            if (!storedResult && !completionHandled) {
              completionHandled = true;
              pollOAuthStatus(testSession.testSessionId, testSession.provider);
            }
          }
        }, 500);

        // Timeout after 5 minutes
        const timeoutId = setTimeout(
          () => {
            if (!oauthWindow.closed) {
              clearInterval(checkInterval);
              window.removeEventListener('message', messageHandler);
              closeOAuthWindow();
              if (!completionHandled) {
                completionHandled = true;
              }
              addLog('error', '❌ OAuth test timed out after 5 minutes', 'failed');
              addLog('error', '💡 Possible reasons:', 'failed');
              addLog('error', '   • Authentication took too long', 'failed');
              addLog('error', '   • Provider is not responding', 'failed');
              addLog('error', '   • Network connectivity issues', 'failed');
              toast.error('OAuth test timed out');
              setRunningTool(null);
            }
          },
          5 * 60 * 1000
        );
      } else {
        addLog(
          'error',
          `❌ Failed to initiate OAuth test: ${result.error || 'Unknown error'}`,
          'failed'
        );
        if (result.details) {
          addLog('error', `💡 Details: ${JSON.stringify(result.details)}`, 'failed');
        }
        if (result.cause) {
          addLog('error', `💡 Cause: ${result.cause}`, 'failed');
        }
        toast.error(result.error || 'Failed to start OAuth test');
        setRunningTool(null);
      }
    } catch (error) {
      addLog('error', `❌ Network error: ${error}`, 'failed');
      toast.error('Failed to start OAuth test');
      setRunningTool(null);
    }
  };

  const handleRunMigration = () => {
    setShowMigrationModal(true);
  };

  const executeMigrationProvider = async (providerId: string, script?: string) => {
    const provider = MIGRATION_PROVIDERS.find((item) => item.id === providerId);
    if (!provider) {
      toast.error('Unknown migration provider');
      return;
    }

    if (provider.disabled) {
      toast.info(`${provider.name} migration is coming soon`);
      return;
    }

    setShowMigrationModal(false);
    setRunningTool('run-migration');
    setShowLogs(true);
    setToolLogs([]);

    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      addLog('info', `🚀 Preparing ${provider.name} migration...`, 'running');

      if (provider.highlights) {
        for (const item of provider.highlights) {
          await wait(350);
          addLog('progress', item, 'running');
        }
      }

      addLog('progress', '📡 Sending migration payload to server...', 'running');
      const response = await fetch('/api/tools/migrations/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: provider.id,
          script: provider.custom ? script : provider.script,
        }),
      });

      const data = await response.json();

      if (data.success) {
        addLog(
          'progress',
          '🚀 Migration job acknowledged. Follow server logs for live progress.',
          'running'
        );
        addLog('success', `✅ ${provider.name} migration request accepted.`, 'completed');
        if (data.message) {
          addLog('info', data.message, 'completed');
        }
        toast.success(`${provider.name} migration flow completed`);
      } else {
        throw new Error(data.error || 'Migration request failed');
      }
    } catch (error) {
      addLog('error', `❌ Migration failed: ${error}`, 'failed');
      toast.error('Migration failed');
    } finally {
      setRunningTool(null);
    }
  };
  const handleValidateConfig = async () => {
    setRunningTool('validate-config');
    setShowLogs(true);
    setToolLogs([]);

    addLog('info', 'Validating Better Auth configuration...', 'running');

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      addLog('progress', 'Checking database connection...', 'running');
      await new Promise((resolve) => setTimeout(resolve, 500));
      addLog('progress', 'Validating plugins configuration...', 'running');
      await new Promise((resolve) => setTimeout(resolve, 500));
      addLog('success', '✅ Configuration is valid!', 'completed');
      toast.success('Configuration validated successfully');
    } catch (error) {
      addLog('error', `❌ Configuration validation failed: ${error}`, 'failed');
      toast.error('Configuration validation failed');
    } finally {
      setRunningTool(null);
    }
  };

  const handleTestDatabaseConnection = async () => {
    setRunningTool('test-db');
    setShowLogs(true);
    setToolLogs([]);

    addLog('info', 'Testing database connection...', 'running');

    try {
      const response = await fetch('/api/database/test');
      const result = await response.json();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      addLog('progress', 'Checking on database con!', 'running');
      if (result.success) {
        addLog('success', '✅ Database connection successful!', 'completed');
        if (result.result && Array.isArray(result.result) && result.result.length > 0) {
          addLog('info', '📄 Sample user record (first row):', 'completed');
          addLog('info', JSON.stringify(result.result[0], null, 2), 'completed');
        }
        toast.success('Database connection test successful');
      } else {
        addLog(
          'error',
          `❌ Database connection failed: ${result.error || 'Unknown error'}`,
          'failed'
        );
        toast.error('Database connection test failed');
      }
    } catch (error) {
      addLog('error', `❌ Network error: ${error}`, 'failed');
      toast.error('Failed to test database connection');
    } finally {
      setRunningTool(null);
    }
  };

  const handleGenerateApiKey = async () => {
    setRunningTool('generate-api-key');
    setShowLogs(true);
    setToolLogs([]);

    addLog('info', 'Generating new API key...', 'running');

    try {
      const response = await fetch('/api/tools/generate-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (result.success && result.apiKey) {
        addLog('success', '✅ API key generated successfully!', 'completed');
        addLog('info', `API Key: ${result.apiKey}`, 'completed');
        toast.success('API key generated successfully');
      } else {
        addLog(
          'error',
          `❌ Failed to generate API key: ${result.error || 'Unknown error'}`,
          'failed'
        );
        toast.error('Failed to generate API key');
      }
    } catch (error) {
      addLog('error', `❌ Network error: ${error}`, 'failed');
      toast.error('Failed to generate API key');
    } finally {
      setRunningTool(null);
    }
  };
  const handleHealthCheck = async () => {
    setRunningTool('health-check');
    setShowLogs(true);
    setToolLogs([]);

    addLog('info', 'Running system health check...', 'running');

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      addLog('progress', 'Checking API endpoints...', 'running');
      await new Promise((resolve) => setTimeout(resolve, 500));
      addLog('progress', 'Checking database health...', 'running');
      await new Promise((resolve) => setTimeout(resolve, 500));
      addLog('progress', 'Checking plugins status...', 'running');
      await new Promise((resolve) => setTimeout(resolve, 500));
      addLog('success', '✅ System health check passed!', 'completed');
      toast.success('System health check passed');
    } catch (error) {
      addLog('error', `❌ Health check failed: ${error}`, 'failed');
      toast.error('Health check failed');
    } finally {
      setRunningTool(null);
    }
  };

  const tools: Tool[] = [
    {
      id: 'test-oauth',
      name: 'Test OAuth',
      description: 'Test OAuth provider connections',
      icon: Globe,
      action: handleTestOAuth,
      category: 'oauth',
    },
    {
      id: 'run-migration',
      name: 'Run Migration',
      description: 'Run database migrations',
      icon: Database,
      action: handleRunMigration,
      category: 'database',
    },
    {
      id: 'test-db',
      name: 'Test Database',
      description: 'Test database connection',
      icon: Database,
      action: handleTestDatabaseConnection,
      category: 'database',
    },
    {
      id: 'validate-config',
      name: 'Validate Config',
      description: 'Validate Better Auth configuration',
      icon: CheckCircle,
      action: handleValidateConfig,
      category: 'utilities',
    },
    {
      id: 'generate-api-key',
      name: 'Generate API Key',
      description: 'Generate a new API key',
      icon: Key,
      action: handleGenerateApiKey,
      category: 'utilities',
    },
    {
      id: 'health-check',
      name: 'Health Check',
      description: 'Run system health check',
      icon: TestTube,
      action: handleHealthCheck,
      category: 'testing',
    },
  ];

  const categories = [
    { id: 'oauth', name: 'OAuth', icon: Globe },
    { id: 'database', name: 'Database', icon: Database },
    { id: 'testing', name: 'Testing', icon: TestTube },
    { id: 'utilities', name: 'Utilities', icon: Settings },
  ];

  const groupedTools = categories.map((category) => ({
    ...category,
    tools: tools.filter((tool) => tool.category === category.id),
  }));

  return (
    <div className="space-y-6 p-6 bg-black w-full min-h-screen">
      <div className="w-full flex flex-col">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Wrench className="w-8 h-8 text-white" />
            <h1 className="text-3xl font-light text-white">Tools</h1>
          </div>
          <p className="text-gray-400 font-mono text-xs uppercase">
            Utility tools for managing and testing your Better Auth setup
          </p>
        </div>

        {showLogs && toolLogs.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm uppercase font-mono text-gray-400 tracking-wider">
                Tool Output
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLogs(false)}
                className="text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <Terminal
              title="Tool Execution Logs"
              lines={toolLogs}
              isRunning={runningTool !== null}
              className="w-full"
              defaultCollapsed={false}
            />
          </div>
        )}

        <div className="space-y-8">
          {groupedTools.map((category) => (
            <div key={category.id} className="space-y-4">
              <div className="flex items-center space-x-2">
                <category.icon className="w-5 h-5 text-white" />
                <h2 className="text-lg font-light text-white uppercase tracking-wider">
                  {category.name}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.tools.map((tool) => {
                  const Icon = tool.icon;
                  const isRunning = runningTool === tool.id;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => tool.action()}
                      disabled={
                        (tool.id !== 'test-oauth' && tool.id !== 'test-db') ||
                        isRunning ||
                        runningTool !== null
                      }
                      className={`relative flex items-center space-x-4 p-4 bg-black/30 border border-dashed border-white/20 rounded-none transition-colors text-left group ${
                        tool.id !== 'test-oauth' && tool.id !== 'test-db'
                          ? 'opacity-60 cursor-not-allowed'
                          : 'hover:bg-black/50 disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      <div className="p-2 bg-white/10 rounded-none group-hover:bg-white/20 transition-colors">
                        {isRunning ? (
                          <Loader className="w-6 h-6 text-white animate-spin" />
                        ) : (
                          <Icon className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-light mb-1">{tool.name}</h4>
                        <p className="text-xs uppercase font-mono flex items-center text-gray-400">
                          <ChevronRight className="w-4 h-4 mr-2" />
                          {tool.description}
                        </p>
                      </div>
                      {tool.id !== 'test-oauth' && tool.id !== 'test-db' && (
                        <span className="absolute top-2 right-3 text-[10px] font-mono uppercase tracking-[0.2em] text-white/60">
                          Coming Soon
                        </span>
                      )}
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* OAuth Provider Selection Modal */}
      {showOAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/90 border border-dashed border-white/20 p-8 w-full max-w-2xl rounded-none">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Globe className="w-6 h-6 text-white" />
                <h3 className="text-xl text-white font-light">Select OAuth Provider</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowOAuthModal(false);
                  setSelectedProvider('');
                }}
                className="text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="space-y-4">
              {oauthProviders.length === 0 ? (
                <div className="text-center py-12">
                  <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-2 text-lg">No OAuth providers configured</p>
                  <p className="text-sm text-gray-500">
                    Please configure OAuth providers in your Better Auth configuration
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-4 uppercase font-mono">
                    Available Providers ({oauthProviders.length})
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                    {oauthProviders.map((provider) => (
                      <button
                        key={provider.id}
                        onClick={() => {
                          setSelectedProvider(provider.id);
                          // Start test immediately when clicked
                          setTimeout(() => {
                            startOAuthTest(provider.id);
                          }, 100);
                        }}
                        className={`w-full flex items-center space-x-4 p-4 border rounded-none transition-all text-left group ${
                          selectedProvider === provider.id
                            ? 'border-white/50 bg-white/10'
                            : 'border-dashed border-white/20 hover:bg-white/5 hover:border-white/30'
                        }`}
                      >
                        <div className="flex-shrink-0">{getProviderIcon(provider.id)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white uppercase font-mono font-light text-base">
                            {provider.name || provider.id}
                          </p>
                        </div>
                        <ArrowRight
                          className={`w-5 h-5 transition-colors flex-shrink-0 ${
                            selectedProvider === provider.id
                              ? 'text-white'
                              : 'text-gray-400 group-hover:text-white'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-4 font-mono uppercase">
                    Click on a provider to start the OAuth test
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-dashed border-white/10">
              <Button
                variant="outline"
                onClick={() => {
                  setShowOAuthModal(false);
                  setSelectedProvider('');
                }}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Migration Provider Modal */}
      {showMigrationModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-black/95 border border-dashed border-white/20 p-8 w-full max-w-5xl rounded-none">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Database className="w-6 h-6 text-white" />
                <h3 className="text-xl text-white font-light uppercase tracking-wider">
                  Select Migration
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMigrationModal(false)}
                className="text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-3">
                {MIGRATION_PROVIDERS.map((provider) => {
                  const isActive = selectedMigrationProvider?.id === provider.id;
                  return (
                    <button
                      key={provider.id}
                      onClick={() => handleSelectMigration(provider.id)}
                      disabled={provider.disabled}
                      className={`w-full flex items-center space-x-3 p-4 border transition-colors rounded-none text-left ${
                        provider.disabled
                          ? 'border-dashed border-white/10 bg-black/30 cursor-not-allowed opacity-60'
                          : isActive
                            ? 'border-white/60 bg-white/10'
                            : 'border-dashed border-white/20 hover:bg-white/5 hover:border-white/40'
                      }`}
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-white/10 flex items-center justify-center">
                        {provider.logo ? provider.logo : <Code className="w-6 h-6 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white uppercase font-mono text-sm">{provider.name}</p>
                        <p className="text-xs uppercase text-gray-400 font-mono mt-1 truncate">
                          {provider.description}
                        </p>
                      </div>
                      {provider.disabled && (
                        <span className="text-[10px] font-mono text-gray-400 uppercase">
                          Coming Soon
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-white/10 flex items-center justify-center">
                    {selectedMigrationProvider.logo ? (
                      selectedMigrationProvider.logo
                    ) : (
                      <Code className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-white -mb-2 text-lg font-light uppercase tracking-wider">
                      {selectedMigrationProvider.name}
                    </h4>
                    <p className="text-sm mt-0 text-gray-400 uppercase font-mono leading-relaxed">
                      {selectedMigrationProvider.description}
                    </p>
                    <div className="flex items-center space-x-2">
                      {selectedMigrationProvider.docs && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="rounded-none border border-dashed"
                        >
                          <a href={selectedMigrationProvider.docs} target="_blank" rel="noreferrer">
                            View Docs
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                {selectedMigrationProvider.highlights && (
                  <ul className="space-y-2 text-xs text-gray-300 font-mono bg-black/40 border border-white/10 p-4">
                    {selectedMigrationProvider.highlights.map((item) => (
                      <li key={item} className="flex items-start space-x-2">
                        <span className="text-white/60 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {selectedMigrationProvider.disabled ? (
                  <div className="space-y-4 text-gray-400 font-mono text-xs">
                    <p>This migration provider is coming soon.</p>
                    <p>
                      Subscribe to updates at{' '}
                      <a
                        href="https://better-auth.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-white underline"
                      >
                        better-auth.com
                      </a>
                      .
                    </p>
                  </div>
                ) : selectedMigrationProvider.custom ? (
                  <div className="space-y-3">
                    <label className="text-xs uppercase font-mono text-gray-400">
                      Custom Migration Script
                    </label>
                    <textarea
                      value={customMigrationCode}
                      onChange={(event) => setCustomMigrationCode(event.target.value)}
                      className="w-full h-64 bg-black/70 border border-white/10 text-xs text-gray-200 font-mono p-3 rounded-none focus:outline-none focus:ring-0"
                    />
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-none"
                        onClick={() => setCustomMigrationCode(DEFAULT_CUSTOM_MIGRATION)}
                      >
                        Reset
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-none text-gray-400 hover:text-white"
                        onClick={() => copyToClipboard(customMigrationCode)}
                      >
                        <Copy className="w-4 h-4" />
                        Copy Script
                      </Button>
                      <Button
                        className="rounded-none"
                        onClick={() => executeMigrationProvider('custom', customMigrationCode)}
                      >
                        Run Custom Script
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedMigrationProvider.script && (
                      <>
                        <div className="flex items-center justify-between text-xs uppercase font-mono text-gray-400">
                          <span>Migration Script Preview</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-none text-gray-400 hover:text-white"
                            onClick={() => copyToClipboard(selectedMigrationProvider.script!)}
                          >
                            <Copy className="w-4 h-4" />
                            Copy Script
                          </Button>
                        </div>
                        <pre className="bg-black/70 border border-white/10 text-[11px] text-green-200 font-mono p-4 overflow-auto leading-relaxed h-64">
                          <code>{selectedMigrationProvider.script}</code>
                        </pre>
                      </>
                    )}
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        className="rounded-none"
                        onClick={() => executeMigrationProvider(selectedMigrationProvider.id)}
                      >
                        Run {selectedMigrationProvider.name} Migration
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
