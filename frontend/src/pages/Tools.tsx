import { createHash } from '@better-auth/utils/hash';
import {
  AlertCircle,
  Code,
  Download,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Info,
  Key,
  Lock,
  Shield,
  TestTube,
  XCircle,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CodeBlock } from '../components/CodeBlock';
import { CodeEditor } from '../components/CodeEditor';
import {
  ArrowRight,
  Check,
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
import { Checkbox } from '../components/ui/checkbox';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { getProviderIcon } from '../lib/icons';

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
  clientId?: string;
  clientSecret?: string;
  redirectURI?: string;
  redirectUri?: string;
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
  const [showPasswordHasher, setShowPasswordHasher] = useState(false);
  const [hashInput, setHashInput] = useState('');
  const [hashSalt, setHashSalt] = useState('');
  const [hashAlgorithm, setHashAlgorithm] = useState<'SHA-256' | 'SHA-384' | 'SHA-512'>('SHA-256');
  const [hashEncoding, setHashEncoding] = useState<'hex' | 'base64' | 'base64url'>('hex');
  const [hashOutput, setHashOutput] = useState<string | null>(null);
  const [hashingPassword, setHashingPassword] = useState(false);
  const [showPlainPassword, setShowPlainPassword] = useState(false);
  const [showConfigValidator, setShowConfigValidator] = useState(false);
  const [configValidationResults, setConfigValidationResults] = useState<{
    success: boolean;
    summary: {
      total: number;
      passes: number;
      errors: number;
      warnings: number;
      infos: number;
    };
    results: Array<{
      category: string;
      check: string;
      status: 'pass' | 'fail' | 'warning';
      message: string;
      suggestion?: string;
      severity: 'error' | 'warning' | 'info';
    }>;
  } | null>(null);
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set());
  const [showExportModal, setShowExportModal] = useState(false);
  const [availableTables, setAvailableTables] = useState<
    Array<{ name: string; displayName: string }>
  >([]);
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [exportLimit, setExportLimit] = useState<string>('1000');
  const [isExporting, setIsExporting] = useState(false);
  const [showJwtModal, setShowJwtModal] = useState(false);
  const [jwtInput, setJwtInput] = useState('');
  const [jwtSecret, setJwtSecret] = useState('');
  const [jwtResult, setJwtResult] = useState<any>(null);
  const [isDecodingJwt, setIsDecodingJwt] = useState(false);
  const [jwtError, setJwtError] = useState<string | null>(null);
  const [showTokenGeneratorModal, setShowTokenGeneratorModal] = useState(false);
  const [tokenType, setTokenType] = useState<'api_key' | 'jwt'>('api_key');
  const [tokenSubject, setTokenSubject] = useState('');
  const [tokenAudience, setTokenAudience] = useState('');
  const [tokenExpiresIn, setTokenExpiresIn] = useState('15');
  const [tokenSecret, setTokenSecret] = useState('');
  const [tokenCustomClaims, setTokenCustomClaims] = useState('{\n  \n}');
  const [tokenResult, setTokenResult] = useState<any>(null);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [showUuidModal, setShowUuidModal] = useState(false);
  const [uuidCount, setUuidCount] = useState<string>('1');
  const [uuidResults, setUuidResults] = useState<string[]>([]);
  const [uuidInput, setUuidInput] = useState('');
  const [uuidValidation, setUuidValidation] = useState<{
    isValid: boolean;
    version?: string;
    variant?: string;
  } | null>(null);
  const [showPasswordStrengthModal, setShowPasswordStrengthModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    strength: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
    checks: Array<{ name: string; passed: boolean; message: string }>;
    meetsConfig: boolean;
    configRequirements: {
      minLength: number;
      maxLength: number;
    };
  } | null>(null);
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showOAuthCredentialsModal, setShowOAuthCredentialsModal] = useState(false);
  const [oauthOrigin, setOauthOrigin] = useState('');
  const [baseUrl, setBaseUrl] = useState('localhost:3000');
  const [oauthCredentials, setOauthCredentials] = useState<{
    clientId: string;
    clientSecret: string;
  } | null>(null);
  const [isFetchingCredentials, setIsFetchingCredentials] = useState(false);
  const [showOAuthSecret, setShowOAuthSecret] = useState(false);
  const [isWritingToEnv, setIsWritingToEnv] = useState(false);
  const [envWriteResult, setEnvWriteResult] = useState<{
    success: boolean;
    message: string;
    path?: string;
  } | null>(null);
  const [showEnvConfirmModal, setShowEnvConfirmModal] = useState(false);
  const [existingEnvCredentials, setExistingEnvCredentials] = useState<{
    hasExisting: boolean;
    credentials: Record<string, string>;
    path?: string;
  } | null>(null);
  const [isCheckingEnv, setIsCheckingEnv] = useState(false);
  const [showSecretGeneratorModal, setShowSecretGeneratorModal] = useState(false);
  const [showSecretConfirmModal, setShowSecretConfirmModal] = useState(false);
  const [existingSecret, setExistingSecret] = useState<{
    hasExisting: boolean;
    secret?: string;
    path?: string;
  } | null>(null);
  const [isCheckingSecret, setIsCheckingSecret] = useState(false);
  const [isWritingSecret, setIsWritingSecret] = useState(false);
  const [secretResult, setSecretResult] = useState<{
    secret: string;
    format: string;
    length: number;
    entropy: number;
    envFormat: string;
  } | null>(null);
  const [isGeneratingSecret, setIsGeneratingSecret] = useState(false);
  const [secretLength, setSecretLength] = useState(32);
  const [secretFormat, setSecretFormat] = useState<'hex' | 'base64'>('hex');
  const [showPluginGeneratorModal, setShowPluginGeneratorModal] = useState(false);
  const [pluginName, setPluginName] = useState('');
  const [pluginDescription, setPluginDescription] = useState('');
  const [pluginTables, setPluginTables] = useState<
    Array<{
      name: string;
      isExtending: boolean;
      extendedTableName?: string;
      fields: Array<{ name: string; type: string; required: boolean; unique: boolean }>;
    }>
  >([]);
  const [availableTablesForExtension, setAvailableTablesForExtension] = useState<
    Array<{ name: string; displayName: string }>
  >([]);
  const [pluginHooks, setPluginHooks] = useState<
    Array<{
      name: string;
      timing: 'before' | 'after';
      action: 'sign-up' | 'sign-in' | 'custom';
      customPath?: string;
      customMatcher?: string;
      hookLogic: string;
      expanded?: boolean;
    }>
  >([]);
  const [pluginMiddleware, setPluginMiddleware] = useState<
    Array<{
      name: string;
      path: string;
      pathType: 'exact' | 'prefix' | 'regex';
      middlewareLogic: string;
      expanded?: boolean;
    }>
  >([]);
  const [pluginEndpoints, setPluginEndpoints] = useState<
    Array<{
      name: string;
      path: string;
      method: 'GET' | 'POST';
      handlerLogic: string;
      expanded?: boolean;
    }>
  >([]);
  const [pluginRateLimitEnabled, setPluginRateLimitEnabled] = useState(false);
  const [pluginRateLimit, setPluginRateLimit] = useState<{
    path: string;
    pathType: 'exact' | 'prefix' | 'regex';
    window: number;
    max: number;
  }>({
    path: '/my-plugin/*',
    pathType: 'prefix',
    window: 15 * 60 * 1000,
    max: 100,
  });
  const [pluginResult, setPluginResult] = useState<any>(null);
  const codeGenerationRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPlugin, setIsGeneratingPlugin] = useState(false);
  const [pluginError, setPluginError] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<
    'server' | 'client' | 'serverSetup' | 'clientSetup'
  >('server');
  const [clientFramework, setClientFramework] = useState<
    'react' | 'svelte' | 'solid' | 'vue' | 'client'
  >('client');
  useEffect(() => {
    if (showConfigValidator) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showConfigValidator]);
  useEffect(() => {
    if (showOAuthCredentialsModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showOAuthCredentialsModal]);
  useEffect(() => {
    if (showEnvConfirmModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showEnvConfirmModal]);
  useEffect(() => {
    if (showPasswordStrengthModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showPasswordStrengthModal]);

  useEffect(() => {
    if (showOAuthCredentialsModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showOAuthCredentialsModal]);

  useEffect(() => {
    if (showEnvConfirmModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showEnvConfirmModal]);

  useEffect(() => {
    if (showSecretGeneratorModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showSecretGeneratorModal]);

  useEffect(() => {
    if (showUuidModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showUuidModal]);
  useEffect(() => {
    if (showPluginGeneratorModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showPluginGeneratorModal]);

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

  const openPasswordHasher = () => {
    setHashInput('');
    setHashSalt('');
    setHashOutput(null);
    setHashAlgorithm('SHA-256');
    setHashEncoding('hex');
    setShowPasswordHasher(true);
  };

  const handleHashPassword = async () => {
    if (!hashInput.trim()) {
      toast.error('Enter a password to hash');
      return;
    }

    try {
      setHashingPassword(true);
      const payload = hashSalt ? `${hashSalt}:${hashInput}` : hashInput;
      const hasher = createHash(hashAlgorithm, hashEncoding);
      const hashedValue = (await hasher.digest(payload)) as string;
      setHashOutput(hashedValue);
      toast.success('Password hashed successfully');
    } catch (error) {
      toast.error('Failed to hash password');
      console.error(error);
    } finally {
      setHashingPassword(false);
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
    setShowOAuthModal(true);
  };

  const startOAuthTest = async (providerId: string) => {
    setShowOAuthModal(false);
    setSelectedProvider('');

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

            const storedResult = sessionStorage.getItem(
              `oauth_test_result_${testSession.testSessionId}`
            );
            if (!storedResult && !completionHandled) {
              completionHandled = true;
              pollOAuthStatus(testSession.testSessionId, testSession.provider);
            }
          }
        }, 500);

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
    setConfigValidationResults(null);
    setShowConfigValidator(true);

    addLog('info', 'Validating Better Auth configuration...', 'running');

    try {
      const response = await fetch('/api/tools/validate-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (result.success !== undefined) {
        setConfigValidationResults(result);

        addLog('info', `Found ${result.summary.total} validation checks`, 'completed');
        if (result.summary.errors > 0) {
          addLog('error', `❌ ${result.summary.errors} error(s) found`, 'failed');
        }
        if (result.summary.warnings > 0) {
          addLog('progress', `⚠️ ${result.summary.warnings} warning(s) found`, 'completed');
        }
        if (result.summary.passes > 0) {
          addLog('success', `✅ ${result.summary.passes} check(s) passed`, 'completed');
        }

        if (result.success) {
          toast.success('Configuration validation completed successfully');
        } else {
          toast.error(`Configuration validation found ${result.summary.errors} error(s)`);
        }
      } else {
        throw new Error(result.error || 'Failed to validate configuration');
      }
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
  const formatDateTime = (value?: string) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handleExportData = () => {
    setShowExportModal(true);
  };

  const handleOpenJwtDecoder = () => {
    setJwtInput('');
    setJwtSecret('');
    setJwtResult(null);
    setJwtError(null);
    setShowJwtModal(true);
  };

  const handleOpenUuidGenerator = () => {
    setUuidCount('1');
    setUuidResults([]);
    setUuidInput('');
    setUuidValidation(null);
    setShowUuidModal(true);
  };

  const handleOpenPasswordStrengthChecker = () => {
    setShowPasswordStrengthModal(true);
    setPasswordInput('');
    setPasswordStrength(null);
    setShowPassword(false);
  };

  const handleCheckPasswordStrength = async () => {
    if (!passwordInput.trim()) {
      toast.error('Please enter a password to check');
      return;
    }

    setIsCheckingPassword(true);
    setPasswordStrength(null);

    try {
      const response = await fetch('/api/tools/password-strength', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: passwordInput,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setPasswordStrength(result);
        toast.success('Password strength checked');
      } else {
        toast.error(result.error || 'Failed to check password strength');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to check password strength';
      toast.error(message);
    } finally {
      setIsCheckingPassword(false);
    }
  };

  const handleOpenSecretGenerator = () => {
    setShowSecretGeneratorModal(true);
    setSecretResult(null);
    setSecretLength(32);
    setSecretFormat('hex');
  };

  const handleGenerateSecret = async () => {
    setIsGeneratingSecret(true);
    setSecretResult(null);

    try {
      const response = await fetch('/api/tools/generate-secret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          length: secretLength,
          format: secretFormat,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate secret');
      }

      const data = await response.json();
      if (data.success) {
        setSecretResult(data);
        toast.success('Secret generated successfully');
      } else {
        throw new Error(data.message || 'Failed to generate secret');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate secret');
      console.error(error);
    } finally {
      setIsGeneratingSecret(false);
    }
  };

  const handleWriteSecretToEnv = async () => {
    if (!secretResult) {
      toast.error('Please generate a secret first');
      return;
    }

    setIsCheckingSecret(true);
    setExistingSecret(null);

    try {
      const checkResponse = await fetch('/api/tools/check-env-secret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const checkData = await checkResponse.json();

      if (checkData.success && checkData.hasExisting) {
        setExistingSecret({
          hasExisting: true,
          secret: checkData.existingSecret,
          path: checkData.path,
        });
        setShowSecretConfirmModal(true);
        setIsCheckingSecret(false);
        return;
      }

      await writeSecretToEnv('override');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to check secret';
      toast.error(message);
      setIsCheckingSecret(false);
    }
  };

  const writeSecretToEnv = async (action: 'override' | 'append') => {
    if (!secretResult) {
      return;
    }

    setIsWritingSecret(true);
    setShowSecretConfirmModal(false);

    try {
      const response = await fetch('/api/tools/write-env-secret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: secretResult.secret,
          action,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Secret written to ${data.path}`);
        setExistingSecret(null);
      } else {
        throw new Error(data.message || 'Failed to write secret');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to write secret to .env';
      toast.error(message);
    } finally {
      setIsWritingSecret(false);
      setIsCheckingSecret(false);
    }
  };

  const handleOpenOAuthCredentials = async () => {
    setShowOAuthCredentialsModal(true);
    setSelectedProvider('google');
    setOauthCredentials(null);
    setShowOAuthSecret(false);

    try {
      const response = await fetch('/api/config');
      const data = await response.json();
      if (data.baseURL) {
        const url = data.baseURL.replace(/^https?:\/\//, '');
        setBaseUrl(url);
        setOauthOrigin(url);
      } else {
        setBaseUrl('localhost:3000');
        setOauthOrigin('localhost:3000');
      }
    } catch (error) {
      setBaseUrl('localhost:3000');
      setOauthOrigin('localhost:3000');
    }
  };

  const handleFetchOAuthCredentials = async () => {
    if (!selectedProvider) {
      toast.error('Please select a provider');
      return;
    }

    const originToUse = oauthOrigin.trim() || baseUrl;
    if (!originToUse) {
      toast.error('Please enter an origin');
      return;
    }

    const cleanOrigin = originToUse.replace(/^https?:\/\//, '');

    setIsFetchingCredentials(true);
    setOauthCredentials(null);
    setEnvWriteResult(null);

    try {
      const response = await fetch(
        `https://studio-backend-0.vercel.app/oauth/${selectedProvider}?origin=${encodeURIComponent(cleanOrigin)}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch credentials: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.clientId && data.clientSecret) {
        setOauthCredentials({
          clientId: data.clientId,
          clientSecret: data.clientSecret,
        });
        toast.success('OAuth credentials fetched successfully');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch OAuth credentials';
      toast.error(message);
    } finally {
      setIsFetchingCredentials(false);
    }
  };

  const handleWriteToEnv = async () => {
    if (!selectedProvider || !oauthCredentials) {
      toast.error('Please fetch credentials first');
      return;
    }

    // First check if credentials already exist
    setIsCheckingEnv(true);
    setEnvWriteResult(null);

    try {
      const checkResponse = await fetch('/api/tools/check-env-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: selectedProvider,
        }),
      });

      const checkData = await checkResponse.json();

      if (checkData.success && checkData.hasExisting) {
        // Show confirmation modal
        setExistingEnvCredentials({
          hasExisting: true,
          credentials: checkData.existingCredentials,
          path: checkData.path,
        });
        setShowEnvConfirmModal(true);
        setIsCheckingEnv(false);
        return;
      }

      // No existing credentials, write directly
      await writeCredentialsToEnv('override');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to check credentials';
      toast.error(message);
      setIsCheckingEnv(false);
    }
  };

  const writeCredentialsToEnv = async (action: 'override' | 'append') => {
    if (!selectedProvider || !oauthCredentials) {
      return;
    }

    setIsWritingToEnv(true);
    setEnvWriteResult(null);
    setShowEnvConfirmModal(false);

    try {
      const response = await fetch('/api/tools/write-env-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: selectedProvider,
          clientId: oauthCredentials.clientId,
          clientSecret: oauthCredentials.clientSecret,
          action,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEnvWriteResult({
          success: true,
          message: data.message,
          path: data.path,
        });
        toast.success(`Credentials written to ${data.path}`);
        setExistingEnvCredentials(null);
      } else {
        throw new Error(data.message || 'Failed to write credentials');
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to write credentials to .env';
      setEnvWriteResult({
        success: false,
        message,
      });
      toast.error(message);
    } finally {
      setIsWritingToEnv(false);
      setIsCheckingEnv(false);
    }
  };

  const handleGenerateUuids = () => {
    const count = Math.min(Math.max(parseInt(uuidCount) || 1, 1), 100);
    const results: string[] = [];
    for (let i = 0; i < count; i++) {
      try {
        const uuid = crypto.randomUUID();
        results.push(uuid);
      } catch (error) {
        toast.error('Failed to generate UUID');
        return;
      }
    }
    setUuidResults(results);
    toast.success(`Generated ${results.length} UUID(s)`);
  };

  const handleValidateUuid = () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const trimmed = uuidInput.trim();

    if (!trimmed) {
      setUuidValidation(null);
      return;
    }

    const isValid = uuidRegex.test(trimmed);
    if (!isValid) {
      setUuidValidation({ isValid: false });
      return;
    }

    const parts = trimmed.split('-');
    const versionHex = parts[2]?.[0];
    const variantHex = parts[3]?.[0];

    let version: string | undefined;
    let variant: string | undefined;

    if (versionHex) {
      const versionNum = parseInt(versionHex, 16);
      if (versionNum >= 1 && versionNum <= 5) {
        version = `v${versionNum}`;
      } else if (versionNum === 0) {
        version = 'v1 (time-based)';
      }
    }

    if (variantHex) {
      const variantNum = parseInt(variantHex, 16);
      if (variantNum >= 8 && variantNum <= 11) {
        variant = 'RFC 4122';
      } else if (variantNum >= 12 && variantNum <= 15) {
        variant = 'Microsoft';
      } else if (variantNum >= 0 && variantNum <= 7) {
        variant = 'Reserved';
      }
    }

    setUuidValidation({ isValid: true, version, variant });
  };

  const handleOpenTokenGenerator = () => {
    setTokenType('api_key');
    setTokenSubject('');
    setTokenAudience('');
    setTokenExpiresIn('15');
    setTokenSecret('');
    setTokenCustomClaims('{\n  \n}');
    setTokenResult(null);
    setShowTokenGeneratorModal(true);
  };

  const fetchAvailableTablesForExtension = async () => {
    try {
      const response = await fetch('/api/database/schema');
      const result = await response.json();
      if (result.success && result.schema && result.schema.tables) {
        const tables = result.schema.tables.map((table: any) => ({
          name: table.name,
          displayName: table.displayName || table.name,
        }));
        setAvailableTablesForExtension(tables);
      }
    } catch (_error) {
      // Silently fail, tables just won't be available for extension
    }
  };

  const handleOpenPluginGenerator = () => {
    setPluginName('');
    setPluginDescription('');
    setClientFramework('react');
    setPluginTables([]);
    setPluginHooks([]);
    setPluginMiddleware([]);
    setPluginRateLimitEnabled(false);
    setPluginRateLimit({
      path: '/my-plugin/*',
      pathType: 'prefix',
      window: 15 * 60 * 1000,
      max: 100,
    });
    setPluginResult(null);
    setPluginError(null);
    setActiveCodeTab('server');
    fetchAvailableTablesForExtension();
    setShowPluginGeneratorModal(true);
  };

  const toggleHookExpanded = (index: number) => {
    const newHooks = [...pluginHooks];
    newHooks[index].expanded = !newHooks[index].expanded;
    setPluginHooks(newHooks);
  };

  const toggleMiddlewareExpanded = (index: number) => {
    const newMw = [...pluginMiddleware];
    newMw[index].expanded = !newMw[index].expanded;
    setPluginMiddleware(newMw);
  };

  const toggleEndpointExpanded = (index: number) => {
    const newEndpoints = [...pluginEndpoints];
    newEndpoints[index].expanded = !newEndpoints[index].expanded;
    setPluginEndpoints(newEndpoints);
  };

  const regenerateClientSetupCode = (framework: string) => {
    if (!pluginResult) return;

    const frameworkImportMap: Record<string, string> = {
      react: 'better-auth/react',
      svelte: 'better-auth/svelte',
      solid: 'better-auth/solid',
      vue: 'better-auth/vue',
    };
    const frameworkImport = frameworkImportMap[framework] || 'better-auth/react';

    const camelCaseName = pluginResult.name.charAt(0).toLowerCase() + pluginResult.name.slice(1);
    const baseURLMap: Record<string, string> = {
      react: 'process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000"',
      svelte: 'import.meta.env.PUBLIC_BETTER_AUTH_URL || "http://localhost:5173"',
      solid: 'import.meta.env.PUBLIC_BETTER_AUTH_URL || "http://localhost:5173"',
      vue: 'import.meta.env.PUBLIC_BETTER_AUTH_URL || "http://localhost:5173"',
    };
    const baseURL =
      baseURLMap[framework] || 'process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000"';

    const clientSetupCode = `import { createAuthClient } from "${frameworkImport}";
import { ${camelCaseName}Client } from "./plugin/${camelCaseName}/client";

export const authClient = createAuthClient({
  baseURL: ${baseURL},
  plugins: [
    ${camelCaseName}Client(),
  ],
});`;

    setPluginResult({
      ...pluginResult,
      clientSetup: clientSetupCode,
    });
  };

  const pathToCamelCase = (path: string): string => {
    if (!path) return '';
    const segments = path
      .replace(/^\/+|\/+$/g, '')
      .split('/')
      .filter(Boolean);
    if (segments.length === 0) return '';

    const camelSegments = segments.map((segment, index) => {
      const parts = segment.split('-');
      const camelParts = parts.map((part, partIndex) => {
        if (index === 0 && partIndex === 0) {
          return part.toLowerCase();
        }
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      });
      return camelParts.join('');
    });

    return camelSegments.join('');
  };

  const handleGeneratePlugin = async () => {
    if (!pluginName.trim()) {
      toast.error('Please enter a plugin name');
      return;
    }

    setIsGeneratingPlugin(true);
    setPluginError(null);
    setPluginResult(null);

    try {
      const validTables = pluginTables.filter(
        (table) => table.name.trim() && table.fields.some((f) => f.name.trim())
      );
      const validHooks = pluginHooks.filter((hook) => hook.name.trim() && hook.hookLogic.trim());
      const validMiddleware = pluginMiddleware.filter(
        (mw) => mw.name.trim() && mw.middlewareLogic.trim()
      );

      const response = await fetch('/api/tools/plugin-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pluginName: pluginName.trim(),
          description: pluginDescription.trim() || undefined,
          clientFramework: clientFramework,
          tables: validTables.map((table) => ({
            name: table.name.trim(),
            isExtending: table.isExtending || false,
            extendedTableName: table.extendedTableName?.trim(),
            fields: table.fields.filter((f) => f.name.trim()),
          })),
          hooks: validHooks.map((hook) => ({
            name: hook.name.trim(),
            timing: hook.timing,
            action: hook.action,
            customPath: hook.customPath?.trim(),
            customMatcher: hook.customMatcher?.trim(),
            hookLogic: hook.hookLogic.trim(),
          })),
          middleware: validMiddleware.map((mw) => ({
            name: mw.name.trim(),
            path: mw.path.trim(),
            pathType: mw.pathType,
            middlewareLogic: mw.middlewareLogic.trim(),
          })),
          endpoints: pluginEndpoints
            .filter((ep) => ep.name.trim() && ep.path.trim())
            .map((ep) => ({
              name: ep.name.trim(),
              path: ep.path.trim(),
              method: ep.method,
              handlerLogic: ep.handlerLogic.trim(),
            })),
          rateLimit: pluginRateLimitEnabled
            ? {
                path: pluginRateLimit.path.trim(),
                pathType: pluginRateLimit.pathType,
                window: pluginRateLimit.window,
                max: pluginRateLimit.max,
              }
            : undefined,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setPluginResult(result.plugin);
        toast.success('Plugin generated successfully');
        setTimeout(() => {
          codeGenerationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        const message = result.error || 'Failed to generate plugin';
        setPluginError(message);
        toast.error(message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate plugin';
      setPluginError(message);
      toast.error(message);
    } finally {
      setIsGeneratingPlugin(false);
    }
  };

  const fetchAvailableTables = async () => {
    try {
      const response = await fetch('/api/database/schema');
      const result = await response.json();
      if (result.success && result.schema && result.schema.tables) {
        const tables = result.schema.tables.map((table: any) => ({
          name: table.name,
          displayName: table.displayName || table.name,
        }));
        setAvailableTables(tables);
      }
    } catch (_error) {
      toast.error('Failed to fetch available tables');
    }
  };

  useEffect(() => {
    if (showExportModal) {
      fetchAvailableTables();
      setSelectedTables(new Set());
    }
  }, [showExportModal]);

  const toggleTableSelection = (tableName: string) => {
    setSelectedTables((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tableName)) {
        newSet.delete(tableName);
      } else {
        newSet.add(tableName);
      }
      return newSet;
    });
  };

  const selectAllTables = () => {
    setSelectedTables(new Set(availableTables.map((t) => t.name)));
  };

  const deselectAllTables = () => {
    setSelectedTables(new Set());
  };

  const handleDecodeJwt = async () => {
    if (!jwtInput.trim()) {
      toast.error('Please paste a JWT to decode');
      return;
    }

    setIsDecodingJwt(true);
    setJwtError(null);
    setJwtResult(null);

    try {
      const response = await fetch('/api/tools/jwt/decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: jwtInput.trim(),
          secret: jwtSecret.trim() || undefined,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setJwtResult(result);
        toast.success('JWT decoded successfully');
      } else {
        const message = result.error || 'Failed to decode JWT';
        setJwtError(message);
        toast.error(message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to decode JWT';
      setJwtError(message);
      toast.error(message);
    } finally {
      setIsDecodingJwt(false);
    }
  };

  const handleGenerateToken = async () => {
    const expires = parseInt(tokenExpiresIn, 10);
    if (isNaN(expires) || expires <= 0) {
      toast.error('Please provide a valid expiration (minutes)');
      return;
    }

    let parsedClaims: Record<string, any> | undefined;
    if (tokenType === 'jwt') {
      const trimmed = tokenCustomClaims.trim();
      if (trimmed.length > 0 && trimmed !== '{' && trimmed !== '}') {
        try {
          parsedClaims = JSON.parse(trimmed);
        } catch (_error) {
          toast.error('Custom claims must be valid JSON');
          return;
        }
      }
    }

    setIsGeneratingToken(true);
    setTokenResult(null);

    try {
      const response = await fetch('/api/tools/token-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: tokenType,
          subject: tokenSubject || undefined,
          audience: tokenAudience || undefined,
          expiresInMinutes: expires,
          customClaims: parsedClaims,
          secretOverride: tokenSecret || undefined,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setTokenResult(result);
        addLog('success', `✅ Generated ${tokenType.replace('_', ' ')} token`, 'completed');
        toast.success('Token generated successfully');
      } else {
        throw new Error(result.error || 'Failed to generate token');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate token';
      addLog('error', `❌ ${message}`, 'failed');
      toast.error(message);
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const handleExecuteExport = async () => {
    if (selectedTables.size === 0) {
      toast.error('Please select at least one table to export');
      return;
    }

    const limit = parseInt(exportLimit, 10);
    if (isNaN(limit) || limit <= 0) {
      toast.error('Please enter a valid limit (greater than 0)');
      return;
    }

    if (limit > 10000) {
      toast.error('Limit cannot exceed 10,000 rows per table');
      return;
    }

    setIsExporting(true);
    setRunningTool('export-data');
    setShowLogs(true);
    setToolLogs([]);

    try {
      addLog('info', `📦 Starting export of ${selectedTables.size} table(s)...`, 'running');
      addLog(
        'progress',
        `Format: ${exportFormat.toUpperCase()} | Limit: ${limit} rows per table`,
        'running'
      );

      const response = await fetch('/api/tools/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tables: Array.from(selectedTables),
          format: exportFormat,
          limit: limit,
        }),
      });

      const result = await response.json();

      if (result.success) {
        addLog('success', '✅ Export completed successfully!', 'completed');

        if (result.rowCounts) {
          Object.entries(result.rowCounts).forEach(([table, count]) => {
            addLog('info', `  • ${table}: ${count} rows`, 'completed');
          });
        }

        addLog('info', `Downloading ${result.filename}...`, 'completed');

        const blob = new Blob([result.data], {
          type: result.contentType || (exportFormat === 'json' ? 'application/json' : 'text/csv'),
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast.success('Export downloaded successfully');
        setShowExportModal(false);
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (error) {
      addLog(
        'error',
        `❌ Export failed: ${error instanceof Error ? error.message : error}`,
        'failed'
      );
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
      setRunningTool(null);
    }
  };

  const handleHealthCheck = async () => {
    setRunningTool('health-check');
    setShowLogs(true);
    setToolLogs([]);

    addLog('info', 'Running Better Auth health check...', 'running');

    try {
      addLog('progress', 'Testing Better Auth endpoints...', 'running');
      const response = await fetch('/api/tools/health-check', {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Health check failed');
      }

      if (data.success) {
        addLog('success', '✅ Better Auth health check passed', 'completed');
        toast.success('Health check passed');
      } else {
        addLog('error', '❌ Better Auth health check failed', 'failed');

        if (data.failedEndpoints && data.failedEndpoints.length > 0) {
          data.failedEndpoints.forEach(
            (failed: { endpoint: string; status?: number | null; error?: string }) => {
              const statusInfo = failed.status ? ` (Status: ${failed.status})` : '';
              const errorInfo = failed.error ? ` - ${failed.error}` : '';
              addLog(
                'error',
                `   • Endpoint ${failed.endpoint}${statusInfo}${errorInfo}`,
                'failed'
              );
            }
          );
        }

        toast.error('Health check failed');
      }
    } catch (error) {
      addLog(
        'error',
        `❌ Health check failed: ${error instanceof Error ? error.message : error}`,
        'failed'
      );
      toast.error('Health check failed');
    } finally {
      setRunningTool(null);
    }
  };

  const enabledToolIds = new Set([
    'test-oauth',
    'test-db',
    'hash-password',
    'health-check',
    'export-data',
    'jwt-decoder',
    'token-generator',
    'validate-config',
    'uuid-generator',
    'password-strength',
    'oauth-credentials',
    'secret-generator',
    'plugin-generator',
  ]);

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
      id: 'hash-password',
      name: 'Hash Password',
      description: 'Generate SHA hashes',
      icon: Key,
      action: openPasswordHasher,
      category: 'utilities',
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
      id: 'health-check',
      name: 'Health Check',
      description: 'Run system health check',
      icon: TestTube,
      action: handleHealthCheck,
      category: 'testing',
    },
    {
      id: 'export-data',
      name: 'Export Data',
      description: 'Export database tables to JSON or CSV',
      icon: Download,
      action: handleExportData,
      category: 'database',
    },
    {
      id: 'jwt-decoder',
      name: 'JWT Decoder',
      description: 'Inspect tokens and verify claims',
      icon: Shield,
      action: handleOpenJwtDecoder,
      category: 'utilities',
    },
    {
      id: 'token-generator',
      name: 'Token Generator',
      description: 'Mint short-lived test tokens',
      icon: Zap,
      action: handleOpenTokenGenerator,
      category: 'utilities',
    },
    {
      id: 'plugin-generator',
      name: 'Plugin Generator',
      description: 'Generate Better Auth plugins',
      icon: Code,
      action: handleOpenPluginGenerator,
      category: 'utilities',
    },
    {
      id: 'uuid-generator',
      name: 'UUID Generator',
      description: 'Generate and validate UUIDs',
      icon: FileText,
      action: handleOpenUuidGenerator,
      category: 'utilities',
    },
    {
      id: 'password-strength',
      name: 'Password Strength Checker',
      description: 'Validate passwords against your config',
      icon: Lock,
      action: handleOpenPasswordStrengthChecker,
      category: 'utilities',
    },
    {
      id: 'oauth-credentials',
      name: 'OAuth Credentials',
      description: 'View and test OAuth provider credentials',
      icon: Globe,
      action: handleOpenOAuthCredentials,
      category: 'oauth',
    },
    {
      id: 'secret-generator',
      name: 'Secret Generator',
      description: 'Generate secure AUTH_SECRET for Better Auth',
      icon: Key,
      action: handleOpenSecretGenerator,
      category: 'utilities',
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
    <div className="space-y-8 bg-black w-full min-h-screen">
      <div className="w-full flex flex-col">
        <div className="flex items-center justify-between p-5 pt-7">
          <div className="pb-8">
            <h1 className="text-3xl font-normal text-white tracking-tight">Tools</h1>
            <p className="text-gray-300 mt-2 uppercase font-mono font-light text-xs">
              Utility tools for managing and testing your Better Auth setup
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center space-y-8">
          <hr className="w-full border-white/15 h-px" />
          <hr className="w-full border-white/15 h-px" />
        </div>
        {showLogs && toolLogs.length > 0 && (
          <div className="mb-6 p-6 gap-8">
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
        <div className="space-y-8 p-6 gap-8">
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
                  const isEnabled = enabledToolIds.has(tool.id);
                  const isDisabled =
                    !isEnabled || (runningTool !== null && runningTool !== tool.id) || isRunning;

                  return (
                    <button
                      key={tool.id}
                      onClick={() => tool.action()}
                      disabled={isDisabled}
                      className={`relative flex items-center space-x-4 p-4 bg-black/30 border border-dashed border-white/20 rounded-none transition-colors text-left group ${
                        isEnabled
                          ? 'hover:bg-black/50 disabled:opacity-50 disabled:cursor-not-allowed'
                          : 'opacity-60 cursor-not-allowed'
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
                      {!isEnabled && (
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
      {showPasswordHasher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/90 border border-dashed border-white/20 p-6 w-full max-w-2xl rounded-none">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-white" />
                <h3 className="text-xl text-white font-light uppercase tracking-wider">
                  Password Hasher
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPasswordHasher(false)}
                className="text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase font-mono text-gray-400">Algorithm</Label>
                  <select
                    value={hashAlgorithm}
                    onChange={(event) =>
                      setHashAlgorithm(event.target.value as 'SHA-256' | 'SHA-384' | 'SHA-512')
                    }
                    className="mt-2 w-full bg-black border border-dashed border-white/20 text-white px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="SHA-256">SHA-256</option>
                    <option value="SHA-384">SHA-384</option>
                    <option value="SHA-512">SHA-512</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs uppercase font-mono text-gray-400">Encoding</Label>
                  <select
                    value={hashEncoding}
                    onChange={(event) =>
                      setHashEncoding(event.target.value as 'hex' | 'base64' | 'base64url')
                    }
                    className="mt-2 w-full bg-black border border-dashed border-white/20 text-white px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="hex">Hex</option>
                    <option value="base64">Base64</option>
                    <option value="base64url">Base64 URL</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase font-mono text-gray-400">
                    Salt (optional)
                  </Label>
                  <Input
                    value={hashSalt}
                    onChange={(event) => setHashSalt(event.target.value)}
                    placeholder="e.g. project-specific-salt"
                    className="mt-2 bg-black border border-dashed border-white/20 text-white rounded-none"
                  />
                  <p className="text-[11px] text-gray-500 mt-1 font-mono">
                    Salt is prepended (<span className="text-white/80">salt:password</span>)
                  </p>
                </div>
                <div>
                  <Label className="text-xs uppercase font-mono text-gray-400">Password</Label>
                  <div className="relative mt-2">
                    <Input
                      type={showPlainPassword ? 'text' : 'password'}
                      value={hashInput}
                      onChange={(event) => setHashInput(event.target.value)}
                      placeholder="Enter password"
                      className="bg-black border border-dashed border-white/20 text-white rounded-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPlainPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white"
                      aria-label={showPlainPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPlainPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              {hashOutput && (
                <div>
                  <Label className="text-xs uppercase font-mono text-gray-400">Hash Result</Label>
                  <div className="mt-2 flex items-center space-x-2">
                    <Input
                      value={hashOutput}
                      readOnly
                      className="flex-1 bg-black border border-dashed border-white/20 text-white rounded-none"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => hashOutput && copyToClipboard(hashOutput)}
                      className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-8 border-t border-dashed border-white/10 pt-6">
              <Button
                variant="outline"
                onClick={() => setShowPasswordHasher(false)}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
              >
                Close
              </Button>
              <Button
                onClick={handleHashPassword}
                disabled={hashingPassword}
                className="rounded-none"
              >
                {hashingPassword ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Hashing...
                  </>
                ) : (
                  'Hash Password'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
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
      {showExportModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-black border border-dashed border-white/20 rounded-none p-6 w-full max-w-3xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Download className="w-5 h-5 text-white" />
                <h3 className="text-xl text-white font-light uppercase tracking-wider">
                  Export Data
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-3 block">
                  Export Format
                </Label>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setExportFormat('json')}
                    className={`px-4 py-2 border rounded-none transition-colors ${
                      exportFormat === 'json'
                        ? 'border-white/50 bg-white/10 text-white'
                        : 'border-dashed border-white/20 text-gray-400 hover:border-white/30'
                    }`}
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => setExportFormat('csv')}
                    className={`px-4 py-2 border rounded-none transition-colors ${
                      exportFormat === 'csv'
                        ? 'border-white/50 bg-white/10 text-white'
                        : 'border-dashed border-white/20 text-gray-400 hover:border-white/30'
                    }`}
                  >
                    CSV
                  </button>
                </div>
              </div>

              <div>
                <Label
                  htmlFor="export-limit"
                  className="text-xs uppercase font-mono text-gray-400 mb-2 block"
                >
                  Row Limit Per Table
                </Label>
                <Input
                  id="export-limit"
                  type="number"
                  value={exportLimit}
                  onChange={(e) => setExportLimit(e.target.value)}
                  min="1"
                  max="10000"
                  placeholder="1000"
                  className="bg-black border border-dashed border-white/20 text-white rounded-none"
                />
                <p className="text-[11px] text-gray-500 mt-1 font-mono">
                  Maximum 10,000 rows per table (default: 1000)
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-xs uppercase font-mono text-gray-400">
                    Select Tables ({selectedTables.size} selected)
                  </Label>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAllTables}
                      className="text-xs text-gray-400 hover:text-white rounded-none"
                    >
                      Select All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={deselectAllTables}
                      className="text-xs text-gray-400 hover:text-white rounded-none"
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>
                <div className="border border-dashed border-white/20 rounded-none max-h-64 overflow-y-auto">
                  {availableTables.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 text-sm">Loading tables...</div>
                  ) : (
                    <div className="space-y-0">
                      {availableTables.map((table) => {
                        const isSelected = selectedTables.has(table.name);
                        return (
                          <button
                            key={table.name}
                            onClick={() => toggleTableSelection(table.name)}
                            className={`w-full text-left p-3 border-b border-dashed border-white/10 last:border-b-0 transition-colors ${
                              isSelected ? 'bg-white/10 border-white/30' : 'hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-white text-sm font-mono">
                                  {table.displayName}
                                </span>
                                <span className="text-xs text-gray-400 ml-2 font-mono">
                                  ({table.name})
                                </span>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8 border-t border-dashed border-white/10 pt-6">
              <Button
                variant="outline"
                onClick={() => setShowExportModal(false)}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExecuteExport}
                disabled={isExporting || selectedTables.size === 0}
                className="rounded-none"
              >
                {isExporting ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      {showJwtModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
          <div className="bg-black border border-dashed border-white/20 rounded-none p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-white" />
                <h3 className="text-xl text-white font-light uppercase tracking-wider">
                  JWT Decoder
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowJwtModal(false)}
                className="text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  JWT Token
                </Label>
                <textarea
                  value={jwtInput}
                  onChange={(event) => setJwtInput(event.target.value)}
                  placeholder="Paste JWT here"
                  className="w-full min-h-[120px] bg-black border border-dashed border-white/20 text-white font-mono text-xs p-3 rounded-none focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                    HMAC Secret (optional)
                  </Label>
                  <Input
                    value={jwtSecret}
                    onChange={(event) => setJwtSecret(event.target.value)}
                    placeholder="Defaults to Better Auth secret if omitted"
                    className="bg-black border border-dashed border-white/20 text-white rounded-none"
                  />
                </div>
                <div className="flex items-end justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setJwtInput('');
                      setJwtSecret('');
                      setJwtResult(null);
                      setJwtError(null);
                    }}
                    className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={handleDecodeJwt}
                    disabled={isDecodingJwt}
                    className="rounded-none"
                  >
                    {isDecodingJwt ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Decoding...
                      </>
                    ) : (
                      'Decode JWT'
                    )}
                  </Button>
                </div>
              </div>
              {jwtError && (
                <div className="border border-dashed border-red-500/30 bg-red-500/10 text-red-300 text-xs font-mono p-3 rounded-none">
                  {jwtError}
                </div>
              )}
              {jwtResult && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                    <div className="border border-dashed border-white/10 p-3 space-y-2">
                      <div className="text-gray-400 uppercase tracking-wider">Signature</div>
                      <p
                        className={`text-sm ${jwtResult.verified ? 'text-green-400' : 'text-yellow-300'}`}
                      >
                        {jwtResult.verified ? 'Verified (HS256)' : 'Not verified'}
                      </p>
                      <p className="text-gray-400 break-all">{jwtResult.signature || 'None'}</p>
                    </div>
                    <div className="border border-dashed border-white/10 p-3 space-y-2">
                      <div className="text-gray-400 uppercase tracking-wider">Issued</div>
                      <p className="text-white">{jwtResult.issuedAtFormatted || 'Unknown'}</p>
                      <p className="text-gray-500">{jwtResult.issuedAgo || ''}</p>
                    </div>
                    <div className="border border-dashed border-white/10 p-3 space-y-2">
                      <div className="text-gray-400 uppercase tracking-wider">Expires</div>
                      <p className={`text-white ${jwtResult.expired ? 'text-red-300' : ''}`}>
                        {jwtResult.expiresAtFormatted || 'No expiry'}
                      </p>
                      <p className="text-gray-500">{jwtResult.expiresIn || ''}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-dashed border-white/10 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase font-mono text-gray-400">Header</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(JSON.stringify(jwtResult.header, null, 2))}
                          className="text-gray-400 hover:text-white rounded-none"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <pre className="text-[11px] text-gray-100 font-mono bg-black/40 p-3 overflow-x-auto max-h-64">
                        {JSON.stringify(jwtResult.header, null, 2)}
                      </pre>
                    </div>
                    <div className="border border-dashed border-white/10 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase font-mono text-gray-400">Payload</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(JSON.stringify(jwtResult.payload, null, 2))
                          }
                          className="text-gray-400 hover:text-white rounded-none"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <pre className="text-[11px] text-gray-100 font-mono bg-black/40 p-3 overflow-x-auto max-h-64">
                        {JSON.stringify(jwtResult.payload, null, 2)}
                      </pre>
                    </div>
                  </div>
                  {jwtResult.customClaims && Object.keys(jwtResult.customClaims).length > 0 && (
                    <div className="border border-dashed border-white/10 p-3">
                      <div className="text-xs uppercase font-mono text-gray-400 mb-2">
                        Custom Claims
                      </div>
                      <pre className="text-[11px] text-gray-100 font-mono bg-black/40 p-3 overflow-x-auto max-h-64">
                        {JSON.stringify(jwtResult.customClaims, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {showTokenGeneratorModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
          <div className="bg-black border border-dashed border-white/20 rounded-none p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-white" />
                <h3 className="text-xl text-white font-light uppercase tracking-wider">
                  Token Generator
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTokenGeneratorModal(false)}
                className="text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-3 block">
                  Token Type
                </Label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: 'api_key', label: 'API Key' },
                    { id: 'jwt', label: 'JWT' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setTokenType(option.id as 'api_key' | 'jwt')}
                      className={`px-4 py-2 border rounded-none text-sm uppercase font-mono transition-colors ${
                        tokenType === option.id
                          ? 'border-white/60 bg-white/10 text-white'
                          : 'border-dashed border-white/20 text-gray-400 hover:border-white/40'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                    Subject / User ID (optional)
                  </Label>
                  <Input
                    value={tokenSubject}
                    onChange={(event) => setTokenSubject(event.target.value)}
                    placeholder="User identifier or email"
                    className="bg-black border border-dashed border-white/20 text-white rounded-none"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                    Audience (optional)
                  </Label>
                  <Input
                    value={tokenAudience}
                    onChange={(event) => setTokenAudience(event.target.value)}
                    placeholder="Audience / app id"
                    className="bg-black border border-dashed border-white/20 text-white rounded-none"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                    Expires In (minutes)
                  </Label>
                  <Input
                    type="number"
                    value={tokenExpiresIn}
                    onChange={(event) => setTokenExpiresIn(event.target.value)}
                    min="1"
                    max="1440"
                    className="bg-black border border-dashed border-white/20 text-white rounded-none"
                  />
                </div>
                {tokenType === 'jwt' && (
                  <div>
                    <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                      Override Secret (optional)
                    </Label>
                    <Input
                      value={tokenSecret}
                      onChange={(event) => setTokenSecret(event.target.value)}
                      placeholder="Defaults to Better Auth secret"
                      className="bg-black border border-dashed border-white/20 text-white rounded-none"
                    />
                  </div>
                )}
              </div>

              {tokenType === 'jwt' && (
                <div>
                  <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                    Custom Claims (JSON)
                  </Label>
                  <textarea
                    value={tokenCustomClaims}
                    onChange={(event) => setTokenCustomClaims(event.target.value)}
                    placeholder='{"role":"admin"}'
                    className="w-full min-h-[120px] bg-black border border-dashed border-white/20 text-white font-mono text-xs p-3 rounded-none focus:outline-none"
                  />
                  <p className="text-[11px] text-gray-500 mt-1 font-mono">
                    Leave empty to include only default claims (iss, sub, aud, exp, iat, jti).
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setTokenResult(null);
                    setTokenSubject('');
                    setTokenAudience('');
                    setTokenCustomClaims('{\n  \n}');
                  }}
                  className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
                >
                  Reset
                </Button>
                <Button
                  onClick={handleGenerateToken}
                  disabled={isGeneratingToken}
                  className="rounded-none"
                >
                  {isGeneratingToken ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Token'
                  )}
                </Button>
              </div>

              {tokenResult && (
                <div className="space-y-4 border border-dashed border-white/15 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase font-mono text-gray-400">Generated Token</p>
                      <p className="text-white font-mono text-sm break-all mt-1">
                        {tokenResult.token}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(tokenResult.token)}
                      className="text-gray-400 hover:text-white rounded-none"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                    <div>
                      <p className="text-gray-400 uppercase tracking-wider">Type</p>
                      <p className="text-white mt-1 capitalize">
                        {tokenResult.type.replace('_', ' ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 uppercase tracking-wider">Expires</p>
                      <p className="text-white mt-1">{formatDateTime(tokenResult.expiresAt)}</p>
                    </div>
                    {tokenResult.url && (
                      <div className="col-span-1">
                        <p className="text-gray-400 uppercase tracking-wider">URL</p>
                        <p className="text-white mt-1 break-all">{tokenResult.url}</p>
                      </div>
                    )}
                  </div>
                  {tokenResult.metadata && (
                    <div className="border border-dashed border-white/10 p-3">
                      <p className="text-xs uppercase font-mono text-gray-400 mb-2">Metadata</p>
                      <pre className="text-[11px] text-gray-100 font-mono bg-black/40 p-3 overflow-x-auto">
                        {JSON.stringify(tokenResult.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Plugin Generator Modal */}
      {showPluginGeneratorModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
          <div className="bg-black border border-dashed border-white/20 rounded-none p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Code className="w-5 h-5 text-white" />
                <h3 className="text-xl text-white font-light uppercase tracking-wider">
                  Plugin Generator
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPluginGeneratorModal(false)}
                className="text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                    Plugin Name *
                  </Label>
                  <Input
                    value={pluginName}
                    onChange={(event) => setPluginName(event.target.value)}
                    placeholder="myPlugin"
                    className="bg-black border border-dashed border-white/20 text-white rounded-none"
                  />
                  <p className="text-[11px] text-gray-500 mt-1 font-mono">Must to be filled</p>
                </div>
                <div>
                  <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                    Description (optional)
                  </Label>
                  <Input
                    value={pluginDescription}
                    onChange={(event) => setPluginDescription(event.target.value)}
                    placeholder="Plugin description"
                    className="bg-black border border-dashed border-white/20 text-white rounded-none"
                  />
                  <p className="text-[11px] text-gray-500 mt-1 font-mono">
                    Leave empty to use the default description
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-xs uppercase font-mono text-gray-400">
                    Tables (optional)
                  </Label>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setPluginTables([
                          ...pluginTables,
                          {
                            name: '',
                            isExtending: false,
                            fields: [{ name: '', type: 'string', required: false, unique: false }],
                          },
                        ])
                      }
                      className="text-xs uppercase font-mono text-gray-400 hover:text-white rounded-none"
                    >
                      + Add Table
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setPluginTables([
                          ...pluginTables,
                          {
                            name: '',
                            isExtending: true,
                            extendedTableName: '',
                            fields: [{ name: '', type: 'string', required: false, unique: false }],
                          },
                        ])
                      }
                      className="text-xs uppercase font-mono text-gray-400 hover:text-white rounded-none"
                    >
                      + Extend Table
                    </Button>
                  </div>
                </div>
                {pluginTables.length === 0 ? (
                  <p className="text-xs text-gray-500 font-mono">No tables added</p>
                ) : (
                  <div className="space-y-2">
                    {pluginTables.map((table, tableIndex) => (
                      <div
                        key={tableIndex}
                        className="border px-5 border-dashed border-white/15 p-3 relative"
                      >
                        <div className="flex items-center space-x-2 relative">
                          {table.isExtending ? (
                            <>
                              <Select
                                className='w-full'
                                value={table.extendedTableName || ''}
                                onValueChange={(value) => {
                                  const newTables = [...pluginTables];
                                  newTables[tableIndex].extendedTableName = value;
                                  newTables[tableIndex].name = value;
                                  setPluginTables(newTables);
                                }}
                              >
                                <SelectTrigger className="bg-black sm:w-48 border border-dashed border-white/20 text-white text-xs rounded-none flex-1">
                                  <SelectValue
                                    className="sm:text-[11px text-white/90 font-mono uppercase"
                                    placeholder="Select table to extend"
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableTablesForExtension.map((t) => (
                                    <SelectItem
                                      className="sm:text-[11px] uppercase font-mono text-white/90 border-b border-dashed last:border-b-0"
                                      key={t.name}
                                      value={t.name}
                                    >
                                      {t.displayName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <span className="text-xs text-gray-400 font-mono uppercase whitespace-nowrap">
                                (Extending)
                              </span>
                            </>
                          ) : (
                            <Input
                              value={table.name}
                              onChange={(e) => {
                                const newTables = [...pluginTables];
                                newTables[tableIndex].name = e.target.value;
                                setPluginTables(newTables);
                              }}
                              placeholder="Table name"
                              className="bg-black border border-dashed border-white/20 text-white text-xs rounded-none flex-1"
                            />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPluginTables(pluginTables.filter((_, i) => i !== tableIndex));
                            }}
                            className="text-red-400 hover:text-red-300 rounded-none"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        {table.fields.length > 0 && (
                          <>
                            <div
                              className="absolute border border-dashed w-px border-white/30"
                              style={{
                                left: '7px',
                                top: '31px',
                                bottom: '12px',
                              }}
                            />
                            <div
                              className="absolute border border-dashed h-px w-[11px] border-white/30"
                              style={{ left: '9px', top: '31px', bottom: '12px' }}
                            />

                            <div className="mt-3 relative">
                              <div className="space-y-0 pl-6">
                                {table.fields.map((field, fieldIndex) => {
                                  // const isLast = fieldIndex === table.fields.length - 1;
                                  return (
                                    <div key={fieldIndex} className="relative">
                                      <div
                                        className="absolute border border-dashed h-px border-white/30 top-1/2 -translate-y-1/2"
                                        style={{
                                          left: '-36px',
                                          width: '36px',
                                        }}
                                      />
                                      <div className="flex items-center space-x-2 py-1">
                                        <Input
                                          value={field.name}
                                          onChange={(e) => {
                                            const newTables = [...pluginTables];
                                            newTables[tableIndex].fields[fieldIndex].name =
                                              e.target.value;
                                            setPluginTables(newTables);
                                          }}
                                          placeholder="Field name"
                                          className="bg-black border border-dashed border-white/20 text-white text-xs rounded-none flex-1"
                                        />
                                        <Select
                                          value={field.type}
                                          onValueChange={(value: string) => {
                                            const newTables = [...pluginTables];
                                            newTables[tableIndex].fields[fieldIndex].type = value;
                                            setPluginTables(newTables);
                                          }}
                                        >
                                          <SelectTrigger className="sm:h-10 sm:w-56 border px-0 border-dashed border-white/20 text-white/90 text-xs rounded-none py-1">
                                            <SelectValue className="font-mono uppercase text-[10px] px-0 text-white/90" />
                                          </SelectTrigger>
                                          <SelectContent className="font-mono uppercase text-[10px]">
                                            <SelectItem
                                              className="sm:text-[11px] text-white/90 border-b border-dashed last:border-b-0"
                                              value="string"
                                            >
                                              string
                                            </SelectItem>
                                            <SelectItem
                                              className="sm:text-[11px] text-white/90 border-b border-dashed last:border-b-0"
                                              value="number"
                                            >
                                              number
                                            </SelectItem>
                                            <SelectItem
                                              className="sm:text-[11px] text-white/90 border-b border-dashed last:border-b-0"
                                              value="boolean"
                                            >
                                              boolean
                                            </SelectItem>
                                            <SelectItem
                                              className="sm:text-[11px] text-white/90 border-b border-dashed last:border-b-0"
                                              value="date"
                                            >
                                              date
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <div className="h-8 flex items-end space-x-2">
                                          <Checkbox
                                            id={`required-${tableIndex}-${fieldIndex}`}
                                            checked={field.required}
                                            onCheckedChange={(checked) => {
                                              const newTables = [...pluginTables];
                                              newTables[tableIndex].fields[fieldIndex].required =
                                                checked === true;
                                              setPluginTables(newTables);
                                            }}
                                          />
                                          <Label
                                            htmlFor={`required-${tableIndex}-${fieldIndex}`}
                                            className="text-xs text-gray-400 font-mono uppercase cursor-pointer"
                                          >
                                            Required
                                          </Label>
                                        </div>
                                        <div className="flex h-8 items-end space-x-2">
                                          <Checkbox
                                            id={`unique-${tableIndex}-${fieldIndex}`}
                                            checked={field.unique}
                                            onCheckedChange={(checked) => {
                                              const newTables = [...pluginTables];
                                              newTables[tableIndex].fields[fieldIndex].unique =
                                                checked === true;
                                              setPluginTables(newTables);
                                            }}
                                          />
                                          <Label
                                            htmlFor={`unique-${tableIndex}-${fieldIndex}`}
                                            className="text-xs text-gray-400 font-mono uppercase cursor-pointer"
                                          >
                                            Unique
                                          </Label>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            const newTables = [...pluginTables];
                                            newTables[tableIndex].fields = newTables[
                                              tableIndex
                                            ].fields.filter((_, i) => i !== fieldIndex);
                                            setPluginTables(newTables);
                                          }}
                                          className="text-red-400 hover:text-red-300 rounded-none"
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                                <div className="relative pt-2">
                                  <div
                                    className="absolute border border-dashed h-px border-white/30"
                                    style={{
                                      left: '-35px',
                                      width: '36px',
                                      top: '25px',
                                    }}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const newTables = [...pluginTables];
                                      newTables[tableIndex].fields.push({
                                        name: '',
                                        type: 'string',
                                        required: false,
                                        unique: false,
                                      });
                                      setPluginTables(newTables);
                                    }}
                                    className="text-xs uppercase font-mono text-gray-400 hover:text-white rounded-none"
                                  >
                                    + Add Field
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {table.fields.length === 0 && (
                          <div className="mt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newTables = [...pluginTables];
                                newTables[tableIndex].fields.push({
                                  name: '',
                                  type: 'string',
                                  required: false,
                                  unique: false,
                                });
                                setPluginTables(newTables);
                              }}
                              className="text-xs text-gray-400 hover:text-white rounded-none"
                            >
                              + Add Field
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-white" />
                    <Label className="text-xs uppercase font-mono text-gray-400">Hooks</Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setPluginHooks([
                        ...pluginHooks,
                        {
                          name: '',
                          timing: 'before',
                          action: 'sign-up',
                          hookLogic: 'const context = ctx;',
                          expanded: true,
                        },
                      ])
                    }
                    className="text-xs uppercase font-mono text-gray-400 hover:text-white rounded-none"
                  >
                    + Add Hook
                  </Button>
                </div>
                {pluginHooks.length === 0 ? (
                  <p className="text-xs text-gray-500 font-mono">No hooks added</p>
                ) : (
                  <div className="space-y-2">
                    {pluginHooks.map((hook, index) => {
                      const hookLabel = `${hook.timing} ${hook.action === 'custom' ? 'custom' : hook.action}: ${hook.name || `Hook ${index + 1}`}`;
                      return (
                        <div key={index} className="border border-dashed border-white/10">
                          <button
                            onClick={() => toggleHookExpanded(index)}
                            className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors text-left"
                          >
                            <span className="text-xs font-mono text-white px-2 py-1 bg-black/40 border border-dashed border-white/20 rounded-none">
                              {hookLabel}
                            </span>
                            <ChevronRight
                              className={`w-4 h-4 text-white/60 transition-transform ${
                                hook.expanded ? 'rotate-90' : ''
                              }`}
                            />
                          </button>
                          {hook.expanded && (
                            <div className="border-t border-dashed border-white/10 p-4 space-y-4">
                              <div>
                                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                                  Hook Name
                                </Label>
                                <Input
                                  value={hook.name}
                                  onChange={(e) => {
                                    const newHooks = [...pluginHooks];
                                    newHooks[index].name = e.target.value;
                                    setPluginHooks(newHooks);
                                  }}
                                  placeholder="e.g., Age Verification, TOS Check"
                                  className="bg-black border border-dashed border-white/20 text-white rounded-none"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                                    Timing
                                  </Label>
                                  <RadioGroup
                                    value={hook.timing}
                                    onValueChange={(value: 'before' | 'after') => {
                                      const newHooks = [...pluginHooks];
                                      newHooks[index].timing = value;
                                      setPluginHooks(newHooks);
                                    }}
                                    className="flex space-x-4"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem
                                        value="before"
                                        id={`hook-timing-before-${index}`}
                                      />
                                      <Label
                                        htmlFor={`hook-timing-before-${index}`}
                                        className="text-xs text-white font-mono cursor-pointer"
                                      >
                                        Before
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem
                                        value="after"
                                        id={`hook-timing-after-${index}`}
                                      />
                                      <Label
                                        htmlFor={`hook-timing-after-${index}`}
                                        className="text-xs text-white font-mono cursor-pointer"
                                      >
                                        After
                                      </Label>
                                    </div>
                                  </RadioGroup>
                                </div>
                                <div>
                                  <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                                    Action
                                  </Label>
                                  <RadioGroup
                                    value={hook.action}
                                    onValueChange={(value: 'sign-up' | 'sign-in' | 'custom') => {
                                      const newHooks = [...pluginHooks];
                                      newHooks[index].action = value;
                                      setPluginHooks(newHooks);
                                    }}
                                    className="flex space-x-4"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem
                                        value="sign-up"
                                        id={`hook-action-signup-${index}`}
                                      />
                                      <Label
                                        htmlFor={`hook-action-signup-${index}`}
                                        className="text-xs text-white font-mono cursor-pointer"
                                      >
                                        Sign-up
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem
                                        value="sign-in"
                                        id={`hook-action-signin-${index}`}
                                      />
                                      <Label
                                        htmlFor={`hook-action-signin-${index}`}
                                        className="text-xs text-white font-mono cursor-pointer"
                                      >
                                        Sign-in
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem
                                        value="custom"
                                        id={`hook-action-custom-${index}`}
                                      />
                                      <Label
                                        htmlFor={`hook-action-custom-${index}`}
                                        className="text-xs text-white font-mono cursor-pointer"
                                      >
                                        Custom
                                      </Label>
                                    </div>
                                  </RadioGroup>
                                </div>
                              </div>
                              {hook.action === 'custom' && (
                                <div>
                                  <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                                    Custom Path
                                  </Label>
                                  <Input
                                    value={hook.customPath || ''}
                                    onChange={(e) => {
                                      const newHooks = [...pluginHooks];
                                      newHooks[index].customPath = e.target.value;
                                      setPluginHooks(newHooks);
                                    }}
                                    placeholder="/my-plugin/custom-endpoint"
                                    className="bg-black border border-dashed border-white/20 text-white rounded-none"
                                  />
                                </div>
                              )}
                              <div>
                                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                                  Custom Matcher (optional)
                                </Label>
                                <Input
                                  value={hook.customMatcher || ''}
                                  onChange={(e) => {
                                    const newHooks = [...pluginHooks];
                                    newHooks[index].customMatcher = e.target.value;
                                    setPluginHooks(newHooks);
                                  }}
                                  placeholder="e.g., context.headers.get('x-custom') === 'value'"
                                  className="bg-black border border-dashed border-white/20 text-white rounded-none"
                                />
                                <p className="text-[11px] text-gray-500 mt-1 font-mono">
                                  Leave empty to use default path matching
                                </p>
                              </div>
                              <div>
                                <div className="flex items-center space-x-2 mb-2">
                                  <Code className="w-4 h-4 text-white" />
                                  <Label className="text-xs uppercase font-mono text-gray-400">
                                    Hook Logic (TypeScript)
                                  </Label>
                                </div>
                                <p className="text-xs text-gray-400 mb-2 font-mono">
                                  This is the TypeScript code that will be executed when the hook is
                                  triggered. This function has properties like ctx so you can access
                                  the request context, headers, body, etc. Here is a simple example
                                  of a hook logic:
                                </p>
                                <CodeEditor
                                  value={hook.hookLogic}
                                  onChange={(value) => {
                                    const newHooks = [...pluginHooks];
                                    newHooks[index].hookLogic = value;
                                    setPluginHooks(newHooks);
                                  }}
                                  language="typescript"
                                  placeholder="const context = ctx;"
                                  className="w-full"
                                />
                              </div>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setPluginHooks(pluginHooks.filter((_, i) => i !== index));
                                }}
                                className="w-full border border-dashed border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-none"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Remove Hook
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-white" />
                    <Label className="text-xs uppercase font-mono text-gray-400">Middleware</Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setPluginMiddleware([
                        ...pluginMiddleware,
                        {
                          name: '',
                          path: '/my-plugin/protected',
                          pathType: 'exact',
                          middlewareLogic: 'const context = ctx;',
                          expanded: true,
                        },
                      ])
                    }
                    className="text-xs uppercase font-mono text-gray-400 hover:text-white rounded-none"
                  >
                    + Add Middleware
                  </Button>
                </div>
                {pluginMiddleware.length === 0 ? (
                  <p className="text-xs text-gray-500 font-mono">No middleware added</p>
                ) : (
                  <div className="space-y-2">
                    {pluginMiddleware.map((mw, index) => {
                      const mwLabel = `${mw.path}: ${mw.name || `Middleware ${index + 1}`}`;
                      return (
                        <div key={index} className="border border-dashed border-white/10">
                          <button
                            onClick={() => toggleMiddlewareExpanded(index)}
                            className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors text-left"
                          >
                            <span className="text-xs font-mono text-white px-2 py-1 bg-black/40 border border-dashed border-white/20 rounded-none">
                              {mwLabel}
                            </span>
                            <ChevronRight
                              className={`w-4 h-4 text-white/60 transition-transform ${
                                mw.expanded ? 'rotate-90' : ''
                              }`}
                            />
                          </button>
                          {mw.expanded && (
                            <div className="border-t border-dashed border-white/10 p-4 space-y-4">
                              <div>
                                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                                  Middleware Name
                                </Label>
                                <Input
                                  value={mw.name}
                                  onChange={(e) => {
                                    const newMw = [...pluginMiddleware];
                                    newMw[index].name = e.target.value;
                                    setPluginMiddleware(newMw);
                                  }}
                                  placeholder="e.g., Auth Check, Rate Limiter"
                                  className="bg-black border border-dashed border-white/20 text-white rounded-none"
                                />
                              </div>
                              <div>
                                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                                  Path
                                </Label>
                                <Input
                                  value={mw.path}
                                  onChange={(e) => {
                                    const newMw = [...pluginMiddleware];
                                    newMw[index].path = e.target.value;
                                    setPluginMiddleware(newMw);
                                  }}
                                  placeholder="/my-plugin/protected"
                                  className="bg-black border border-dashed border-white/20 text-white rounded-none"
                                />
                              </div>
                              <div>
                                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                                  Path Type
                                </Label>
                                <Select
                                  value={mw.pathType}
                                  onValueChange={(value: string) => {
                                    const newMw = [...pluginMiddleware];
                                    newMw[index].pathType = value as 'exact' | 'prefix' | 'regex';
                                    setPluginMiddleware(newMw);
                                  }}
                                >
                                  <SelectTrigger className="bg-black border border-dashed border-white/20 text-white rounded-none">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="exact">Exact Match</SelectItem>
                                    <SelectItem value="prefix">Prefix Match</SelectItem>
                                    <SelectItem value="regex">Regex Match</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <div className="flex items-center space-x-2 mb-2">
                                  <Code className="w-4 h-4 text-white" />
                                  <Label className="text-xs uppercase font-mono text-gray-400">
                                    Middleware Logic (TypeScript)
                                  </Label>
                                </div>
                                <p className="text-xs text-gray-400 mb-2 font-mono">
                                  This is the TypeScript code that will be executed when the
                                  middleware is triggered. You can access the request context,
                                  headers, body, etc.
                                </p>
                                <CodeEditor
                                  value={mw.middlewareLogic}
                                  onChange={(value) => {
                                    const newMw = [...pluginMiddleware];
                                    newMw[index].middlewareLogic = value;
                                    setPluginMiddleware(newMw);
                                  }}
                                  language="typescript"
                                  placeholder="const context = ctx;"
                                  className="w-full"
                                />
                              </div>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setPluginMiddleware(
                                    pluginMiddleware.filter((_, i) => i !== index)
                                  );
                                }}
                                className="w-full border border-dashed border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-none"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Remove Middleware
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-white" />
                    <Label className="text-xs uppercase font-mono text-gray-400">Endpoints</Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const defaultPath = '/my-plugin/endpoint';
                      const defaultName = pathToCamelCase(defaultPath);
                      setPluginEndpoints([
                        ...pluginEndpoints,
                        {
                          name: defaultName,
                          path: defaultPath,
                          method: 'POST',
                          handlerLogic:
                            '// Endpoint handler logic here\nreturn ctx.json({ success: true });',
                          expanded: true,
                        },
                      ]);
                    }}
                    className="text-xs uppercase font-mono text-gray-400 hover:text-white rounded-none"
                  >
                    + Add Endpoint
                  </Button>
                </div>
                {pluginEndpoints.length === 0 ? (
                  <p className="text-xs text-gray-500 font-mono">No endpoints added</p>
                ) : (
                  <div className="space-y-2">
                    {pluginEndpoints.map((endpoint, index) => {
                      const endpointLabel = `${endpoint.method} ${endpoint.path}: ${endpoint.name || pathToCamelCase(endpoint.path) || `Endpoint ${index + 1}`}`;
                      return (
                        <div key={index} className="border border-dashed border-white/10">
                          <button
                            onClick={() => toggleEndpointExpanded(index)}
                            className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors text-left"
                          >
                            <span className="text-xs font-mono text-white px-2 py-1 bg-black/40 border border-dashed border-white/20 rounded-none">
                              {endpointLabel}
                            </span>
                            <ChevronRight
                              className={`w-4 h-4 text-white/60 transition-transform ${endpoint.expanded ? 'rotate-90' : ''}`}
                            />
                          </button>
                          {endpoint.expanded && (
                            <div className="border-t border-dashed border-white/10 p-4 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                                    Path
                                  </Label>
                                  <Input
                                    value={endpoint.path}
                                    onChange={(e) => {
                                      const newPath = e.target.value;
                                      const newName = pathToCamelCase(newPath);
                                      const newEndpoints = [...pluginEndpoints];
                                      newEndpoints[index].path = newPath;
                                      newEndpoints[index].name = newName;
                                      setPluginEndpoints(newEndpoints);
                                    }}
                                    placeholder="/sign-in/anonymous"
                                    className="bg-black border border-dashed border-white/20 text-white rounded-none"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                                    Endpoint Name (Auto-generated)
                                  </Label>
                                  <Input
                                    value={endpoint.name}
                                    readOnly
                                    className="bg-black/50 border border-dashed border-white/10 text-white/70 rounded-none cursor-not-allowed"
                                  />
                                  <p className="text-[11px] text-gray-500 mt-1 font-mono">
                                    Generated from path
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                                    Method
                                  </Label>
                                  <Select
                                    value={endpoint.method}
                                    onValueChange={(value: string) => {
                                      const newEndpoints = [...pluginEndpoints];
                                      newEndpoints[index].method = value as 'GET' | 'POST';
                                      setPluginEndpoints(newEndpoints);
                                    }}
                                  >
                                    <SelectTrigger className="bg-black border border-dashed border-white/20 text-white rounded-none">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="GET">GET</SelectItem>
                                      <SelectItem value="POST">POST</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center space-x-2 mb-2">
                                  <Code className="w-4 h-4 text-white" />
                                  <Label className="text-xs uppercase font-mono text-gray-400">
                                    Handler Logic (TypeScript)
                                  </Label>
                                </div>
                                <p className="text-xs text-gray-400 mb-2 font-mono">
                                  This is the TypeScript code that will be executed when the
                                  endpoint is called. You can access the context via ctx parameter.
                                </p>
                                <CodeEditor
                                  value={endpoint.handlerLogic}
                                  onChange={(value) => {
                                    const newEndpoints = [...pluginEndpoints];
                                    newEndpoints[index].handlerLogic = value;
                                    setPluginEndpoints(newEndpoints);
                                  }}
                                  language="typescript"
                                  placeholder="// Endpoint handler logic here\nreturn ctx.json({ success: true });"
                                  className="w-full"
                                />
                              </div>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setPluginEndpoints(pluginEndpoints.filter((_, i) => i !== index));
                                }}
                                className="w-full border border-dashed border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-none"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Remove Endpoint
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Checkbox
                    id="rate-limit"
                    checked={pluginRateLimitEnabled}
                    onCheckedChange={(checked) => setPluginRateLimitEnabled(checked === true)}
                  />
                  <Label
                    htmlFor="rate-limit"
                    className="text-xs uppercase font-mono text-gray-400 cursor-pointer"
                  >
                    Enable Rate Limiting
                  </Label>
                </div>
                {pluginRateLimitEnabled && (
                  <div className="border border-dashed border-white/10 p-4 space-y-4 mt-3">
                    <div>
                      <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                        Path
                      </Label>
                      <Input
                        value={pluginRateLimit.path}
                        onChange={(e) => {
                          setPluginRateLimit({
                            ...pluginRateLimit,
                            path: e.target.value,
                          });
                        }}
                        placeholder="/my-plugin/*"
                        className="bg-black border border-dashed border-white/20 text-white rounded-none"
                      />
                    </div>
                    <div>
                      <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                        Path Type
                      </Label>
                      <Select
                        value={pluginRateLimit.pathType}
                        onValueChange={(value: string) => {
                          setPluginRateLimit({
                            ...pluginRateLimit,
                            pathType: value as 'exact' | 'prefix' | 'regex',
                          });
                        }}
                      >
                        <SelectTrigger className="bg-black border border-dashed border-white/20 text-white rounded-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="exact">Exact Match</SelectItem>
                          <SelectItem value="prefix">Prefix Match</SelectItem>
                          <SelectItem value="regex">Regex Match</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                          Window (ms)
                        </Label>
                        <Input
                          type="number"
                          value={pluginRateLimit.window || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setPluginRateLimit({
                              ...pluginRateLimit,
                              window: value === '' ? 0 : parseInt(value, 10) || 0,
                            });
                          }}
                          onBlur={(e) => {
                            if (!e.target.value || parseInt(e.target.value, 10) <= 0) {
                              setPluginRateLimit({
                                ...pluginRateLimit,
                                window: 15 * 60 * 1000,
                              });
                            }
                          }}
                          placeholder="900000"
                          className="bg-black border border-dashed border-white/20 text-white rounded-none"
                        />
                        <p className="text-[11px] text-gray-500 mt-1 font-mono">
                          Time window in milliseconds (e.g., 900000 = 15 minutes)
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                          Max Requests
                        </Label>
                        <Input
                          type="number"
                          value={pluginRateLimit.max || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setPluginRateLimit({
                              ...pluginRateLimit,
                              max: value === '' ? 0 : parseInt(value, 10) || 0,
                            });
                          }}
                          onBlur={(e) => {
                            if (!e.target.value || parseInt(e.target.value, 10) <= 0) {
                              setPluginRateLimit({
                                ...pluginRateLimit,
                                max: 100,
                              });
                            }
                          }}
                          placeholder="100"
                          className="bg-black border border-dashed border-white/20 text-white rounded-none"
                        />
                        <p className="text-[11px] text-gray-500 mt-1 font-mono">
                          Maximum requests per window
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPluginName('');
                    setPluginDescription('');
                    setClientFramework('react');
                    setPluginTables([]);
                    setPluginHooks([]);
                    setPluginMiddleware([]);
                    setPluginEndpoints([]);
                    setPluginRateLimitEnabled(false);
                    setPluginRateLimit({
                      path: '/my-plugin/*',
                      pathType: 'prefix',
                      window: 15 * 60 * 1000,
                      max: 100,
                    });
                    setPluginResult(null);
                    setPluginError(null);
                  }}
                  className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
                >
                  Reset
                </Button>
                <Button
                  onClick={handleGeneratePlugin}
                  disabled={isGeneratingPlugin || !pluginName.trim()}
                  className="rounded-none"
                >
                  {isGeneratingPlugin ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Plugin'
                  )}
                </Button>
              </div>

              {pluginError && (
                <div className="border border-dashed border-red-500/30 bg-red-500/10 text-red-300 text-xs font-mono p-3 rounded-none">
                  {pluginError}
                </div>
              )}

              {pluginResult && (
                <div
                  ref={codeGenerationRef}
                  className="space-y-4 border border-dashed border-white/15 p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs uppercase font-mono text-gray-400">Generated Code</p>
                    <div className="flex items-center space-x-2">
                      {activeCodeTab === 'clientSetup' && (
                        <div className="flex items-center space-x-2 mr-2">
                          <Label className="text-xs uppercase font-mono text-gray-400 whitespace-nowrap">
                            Framework:
                          </Label>
                          <Select
                            value={clientFramework}
                            onValueChange={(value: any) => {
                              setClientFramework(value);
                              regenerateClientSetupCode(value);
                            }}
                          >
                            <SelectTrigger className="bg-black sm:w-56 border border-dashed border-white/20 text-white rounded-none w-[220px] h-10 text-xs font-mono uppercase px-4 py-2">
                              <SelectValue className="font-mono uppercase text-xs text-white" />
                            </SelectTrigger>
                            <SelectContent className="font-mono uppercase text-[10px] bg-black border border-dashed border-white/20">
                              <SelectItem
                                value="react"
                                className="sm:text-[11px] text-white/90 border-b border-dashed last:border-b-0"
                              >
                                {' '}
                                React
                              </SelectItem>
                              <SelectItem
                                value="svelte"
                                className="sm:text-[11px] text-white/90 border-b border-dashed last:border-b-0"
                              >
                                {' '}
                                Svelte
                              </SelectItem>
                              <SelectItem
                                value="solid"
                                className="sm:text-[11px] text-white/90 border-b border-dashed last:border-b-0"
                              >
                                {' '}
                                Solid
                              </SelectItem>
                              <SelectItem
                                value="vue"
                                className="sm:text-[11px] text-white/90 border-b border-dashed last:border-b-0"
                              >
                                {' '}
                                Vue
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const code = pluginResult[activeCodeTab];
                          const filePath =
                            [
                              {
                                id: 'server',
                                path:
                                  pluginResult.filePaths?.server ||
                                  `plugin/${pluginResult.name}/index.ts`,
                              },
                              {
                                id: 'client',
                                path:
                                  pluginResult.filePaths?.client ||
                                  `plugin/${pluginResult.name}/client/index.ts`,
                              },
                              {
                                id: 'serverSetup',
                                path: pluginResult.filePaths?.serverSetup || 'auth.ts',
                              },
                              {
                                id: 'clientSetup',
                                path: pluginResult.filePaths?.clientSetup || 'auth-client.ts',
                              },
                            ].find((t) => t.id === activeCodeTab)?.path ||
                            `${pluginResult.name}-${activeCodeTab}.ts`;
                          const blob = new Blob([code], { type: 'text/plain' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          const fileName = filePath.split('/').pop() || filePath;
                          a.download = fileName;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          window.URL.revokeObjectURL(url);
                        }}
                        className="text-gray-400 hover:text-white rounded-none"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>

                  <div className="flex space-x-2 border-b border-dashed border-white/10">
                    {[
                      {
                        id: 'server',
                        label: 'Server Plugin',
                        path:
                          pluginResult.filePaths?.server || `plugin/${pluginResult.name}/index.ts`,
                      },
                      {
                        id: 'client',
                        label: 'Client Plugin',
                        path:
                          pluginResult.filePaths?.client ||
                          `plugin/${pluginResult.name}/client/index.ts`,
                      },
                      {
                        id: 'serverSetup',
                        label: 'Server Setup',
                        path: pluginResult.filePaths?.serverSetup || 'auth.ts',
                      },
                      {
                        id: 'clientSetup',
                        label: 'Client Setup',
                        path: pluginResult.filePaths?.clientSetup || 'auth-client.ts',
                      },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveCodeTab(tab.id as any)}
                        className={`px-3 py-2 text-xs uppercase font-mono border-b-2 transition-colors ${
                          activeCodeTab === tab.id
                            ? 'border-white text-white'
                            : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                        title={tab.path}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="border border-dashed border-white/10">
                    <CodeBlock
                      code={pluginResult[activeCodeTab]}
                      language="typescript"
                      fileName={
                        [
                          {
                            id: 'server',
                            path:
                              pluginResult.filePaths?.server ||
                              `plugin/${pluginResult.name}/index.ts`,
                          },
                          {
                            id: 'client',
                            path:
                              pluginResult.filePaths?.client ||
                              `plugin/${pluginResult.name}/client/index.ts`,
                          },
                          {
                            id: 'serverSetup',
                            path: pluginResult.filePaths?.serverSetup || 'auth.ts',
                          },
                          {
                            id: 'clientSetup',
                            path: pluginResult.filePaths?.clientSetup || 'auth-client.ts',
                          },
                        ].find((t) => t.id === activeCodeTab)?.path ||
                        `${pluginResult.name}-${activeCodeTab}.ts`
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Config Validator Modal */}
      {showConfigValidator && configValidationResults && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowConfigValidator(false);
              setConfigValidationResults(null);
            }
          }}
        >
          <div
            className="bg-black border border-dashed border-white/20 rounded-none p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-white" />
                <h3 className="text-xl text-white font-light uppercase tracking-wider">
                  Configuration Validator
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowConfigValidator(false);
                  setConfigValidationResults(null);
                }}
                className="text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Summary */}
            <div className="mb-6 p-4 border border-dashed border-white/10">
              <div className="text-xs uppercase font-mono text-gray-400 mb-3">Summary</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-left border-r border-dashed border-white/10 pr-4 last:border-r-0">
                  <div className="text-2xl font-mono text-white">
                    {configValidationResults.summary.total}
                  </div>
                  <div className="text-xs text-gray-400 uppercase mt-1 font-mono">Total Checks</div>
                </div>
                <div className="text-left border-r border-dashed border-white/10 pr-4 last:border-r-0">
                  <div className="text-2xl font-mono text-white">
                    {configValidationResults.summary.passes}
                  </div>
                  <div className="text-xs text-gray-400 uppercase mt-1 font-mono">Passed</div>
                </div>
                <div className="text-left border-r border-dashed border-white/10 pr-4 last:border-r-0">
                  <div className="text-2xl font-mono text-white">
                    {configValidationResults.summary.errors}
                  </div>
                  <div className="text-xs text-gray-400 uppercase mt-1 font-mono">Errors</div>
                </div>
                <div className="text-left">
                  <div className="text-2xl font-mono text-white">
                    {configValidationResults.summary.warnings}
                  </div>
                  <div className="text-xs text-gray-400 uppercase mt-1 font-mono">Warnings</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {Object.entries(
                configValidationResults.results.reduce(
                  (acc, result) => {
                    if (!acc[result.category]) {
                      acc[result.category] = [];
                    }
                    acc[result.category].push(result);
                    return acc;
                  },
                  {} as Record<string, typeof configValidationResults.results>
                )
              ).map(([category, results]) => {
                if (category === 'OAuth Providers') {
                  const providerGroups = results.reduce(
                    (acc, result) => {
                      const match = result.check.match(/^(.+?)\s*-\s*(.+)$/);
                      if (match) {
                        const providerName = match[1];
                        const checkType = match[2];
                        if (!acc[providerName]) {
                          acc[providerName] = [];
                        }
                        acc[providerName].push({ ...result, check: checkType });
                      } else {
                        if (!acc['General']) {
                          acc['General'] = [];
                        }
                        acc['General'].push(result);
                      }
                      return acc;
                    },
                    {} as Record<string, typeof results>
                  );

                  return (
                    <div key={category} className="border border-dashed border-white/10 p-4">
                      <h4 className="text-white font-mono uppercase text-xs mb-4 text-left">
                        {category}
                        <span className="text-gray-500 font-normal ml-2">
                          ({results.length} check{results.length !== 1 ? 's' : ''})
                        </span>
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(providerGroups).map(([providerName, providerResults]) => {
                          const isExpanded = expandedProviders.has(providerName);
                          const hasErrors = providerResults.some((r) => r.severity === 'error');
                          const hasWarnings = providerResults.some((r) => r.severity === 'warning');
                          const allPassed = providerResults.every((r) => r.status === 'pass');

                          return (
                            <div
                              key={providerName}
                              className="border border-dashed border-white/10"
                            >
                              <button
                                onClick={() => {
                                  setExpandedProviders((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(providerName)) {
                                      next.delete(providerName);
                                    } else {
                                      next.add(providerName);
                                    }
                                    return next;
                                  });
                                }}
                                className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors text-left"
                              >
                                <div className="flex items-center space-x-2">
                                  <ChevronRight
                                    className={`w-4 h-4 text-white/60 transition-transform ${
                                      isExpanded ? 'rotate-90' : ''
                                    }`}
                                  />
                                  <span className="text-white font-mono text-sm">
                                    {providerName}
                                  </span>
                                  <span className="text-xs text-gray-500 font-mono">
                                    ({providerResults.length} check
                                    {providerResults.length !== 1 ? 's' : ''})
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {hasErrors && (
                                    <span className="text-xs text-white/60 font-mono">Error</span>
                                  )}
                                  {hasWarnings && !hasErrors && (
                                    <span className="text-xs text-white/60 font-mono">Warning</span>
                                  )}
                                  {allPassed && !hasErrors && !hasWarnings && (
                                    <Check className="w-4 h-4 text-white/60" />
                                  )}
                                </div>
                              </button>
                              {isExpanded && (
                                <div className="border-t border-dashed border-white/10 space-y-2 p-2">
                                  {providerResults.map((result, index) => (
                                    <div
                                      key={`${providerName}-${result.check}-${index}`}
                                      className={`p-3 border-l border-dashed border-white/15 ${
                                        result.status === 'pass'
                                          ? 'bg-green-600/[8%]'
                                          : 'bg-red-600/[8%]'
                                      }`}
                                    >
                                      <div className="flex items-start space-x-3">
                                        <div className="mt-0.5">
                                          {result.severity === 'error' ? (
                                            <XCircle className="w-4 h-4 text-white/60" />
                                          ) : result.severity === 'warning' ? (
                                            <AlertCircle className="w-4 h-4 text-white/60" />
                                          ) : result.status === 'pass' ? (
                                            <Check className="w-4 h-4 text-white/60" />
                                          ) : (
                                            <Info className="w-4 h-4 text-white/40" />
                                          )}
                                        </div>
                                        <div className="flex-1 text-left">
                                          <div className="flex items-center space-x-2 mb-1">
                                            <span className="text-white font-mono text-sm">
                                              {result.check}
                                            </span>
                                            <span className="text-xs px-2 py-0.5 border border-dashed border-white/20 text-white/60 font-mono">
                                              {result.status.toUpperCase()}
                                            </span>
                                          </div>
                                          <p className="text-gray-300 text-sm">{result.message}</p>
                                          {result.suggestion && (
                                            <div className="mt-2 p-2 bg-black/40 border border-dashed border-white/10">
                                              <p className="text-xs text-gray-400 uppercase mb-1 font-mono">
                                                Suggestion
                                              </p>
                                              <p className="text-xs text-gray-300">
                                                {result.suggestion}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={category} className="border border-dashed border-white/10 p-4">
                    <h4 className="text-white font-mono uppercase text-xs mb-4 text-left">
                      {category}
                      <span className="text-gray-500 font-normal ml-2">
                        ({results.length} check{results.length !== 1 ? 's' : ''})
                      </span>
                    </h4>
                    <div className="space-y-3">
                      {results.map((result, index) => (
                        <div
                          key={`${result.category}-${result.check}-${index}`}
                          className={`p-3 border-l border-dashed border-white/15 ${
                            result.status === 'pass' ? 'bg-green-600/[8%]' : 'bg-red-600/[8%]'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="mt-0.5">
                              {result.severity === 'error' ? (
                                <XCircle className="w-4 h-4 text-white/60" />
                              ) : result.severity === 'warning' ? (
                                <AlertCircle className="w-4 h-4 text-white/60" />
                              ) : result.status === 'pass' ? (
                                <Check className="w-4 h-4 text-white/60" />
                              ) : (
                                <Info className="w-4 h-4 text-white/40" />
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-white font-mono text-sm">{result.check}</span>
                                <span className="text-xs px-2 py-0.5 border border-dashed border-white/20 text-white/60 font-mono">
                                  {result.status.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-gray-300 text-sm">{result.message}</p>
                              {result.suggestion && (
                                <div className="mt-2 p-2 bg-black/40 border border-dashed border-white/10">
                                  <p className="text-xs text-gray-400 uppercase mb-1 font-mono">
                                    Suggestion
                                  </p>
                                  <p className="text-xs text-gray-300">{result.suggestion}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfigValidator(false);
                  setConfigValidationResults(null);
                }}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* UUID Generator Modal */}
      {showUuidModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowUuidModal(false);
            }
          }}
        >
          <div
            className="bg-black border border-dashed border-white/20 rounded-none p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-white" />
                <h3 className="text-xl text-white font-light uppercase tracking-wider">
                  UUID Generator
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUuidModal(false)}
                className="text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Generate UUIDs Section */}
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Generate UUIDs
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                      Count (1-100)
                    </Label>
                    <Input
                      type="number"
                      value={uuidCount}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (value === '') {
                          setUuidCount('');
                          return;
                        }
                        const num = parseInt(value);
                        if (!isNaN(num)) {
                          setUuidCount(value);
                        }
                      }}
                      onBlur={(event) => {
                        const value = event.target.value;
                        const num = parseInt(value);
                        if (isNaN(num) || num < 1) {
                          setUuidCount('1');
                        } else if (num > 100) {
                          setUuidCount('100');
                        } else {
                          setUuidCount(String(num));
                        }
                      }}
                      min="1"
                      max="100"
                      className="bg-black border border-dashed border-white/20 text-white rounded-none"
                    />
                  </div>
                  <div className="flex items-end justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setUuidCount('1');
                        setUuidResults([]);
                      }}
                      className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
                    >
                      Clear
                    </Button>
                    <Button onClick={handleGenerateUuids} className="rounded-none">
                      Generate UUIDs
                    </Button>
                  </div>
                </div>
              </div>

              {/* Validate UUID Section */}
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Validate UUID
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      value={uuidInput}
                      onChange={(event) => {
                        setUuidInput(event.target.value);
                      }}
                      onBlur={handleValidateUuid}
                      placeholder="Paste UUID to validate"
                      className="bg-black border border-dashed border-white/20 text-white font-mono text-xs rounded-none"
                    />
                  </div>
                  <div className="flex items-end justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setUuidInput('');
                        setUuidValidation(null);
                      }}
                      className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                {uuidValidation && (
                  <div
                    className={`mt-2 border border-dashed p-3 rounded-none ${
                      uuidValidation.isValid
                        ? 'border-white/10 bg-black/40'
                        : 'border-red-500/30 bg-red-500/10'
                    }`}
                  >
                    <div className="text-xs font-mono space-y-1">
                      <div
                        className={`${uuidValidation.isValid ? 'text-green-400' : 'text-red-300'}`}
                      >
                        {uuidValidation.isValid ? '✓ Valid UUID' : '✗ Invalid UUID'}
                      </div>
                      {uuidValidation.isValid && uuidValidation.version && (
                        <div className="text-gray-400">Version: {uuidValidation.version}</div>
                      )}
                      {uuidValidation.isValid && uuidValidation.variant && (
                        <div className="text-gray-400">Variant: {uuidValidation.variant}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Generated UUIDs Results */}
              {uuidResults.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs uppercase font-mono text-gray-400">
                      Generated UUIDs
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(uuidResults.join('\n'))}
                      className="text-gray-400 hover:text-white rounded-none"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy All
                    </Button>
                  </div>
                  <div className="border border-dashed border-white/10 p-3">
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {uuidResults.map((uuid, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-black/40 border border-dashed border-white/10"
                        >
                          <span className="text-white font-mono text-xs break-all">{uuid}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(uuid)}
                            className="text-gray-400 hover:text-white rounded-none ml-2"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* UUID Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                <div className="border border-dashed border-white/10 p-3 space-y-2">
                  <div className="text-gray-400 uppercase tracking-wider">Version</div>
                  <p className="text-white text-sm">v4 (Random)</p>
                  <p className="text-gray-500 text-xs">Cryptographically random</p>
                </div>
                <div className="border border-dashed border-white/10 p-3 space-y-2">
                  <div className="text-gray-400 uppercase tracking-wider">Format</div>
                  <p className="text-white text-sm">8-4-4-4-12</p>
                  <p className="text-gray-500 text-xs">36 characters</p>
                </div>
                <div className="border border-dashed border-white/10 p-3 space-y-2">
                  <div className="text-gray-400 uppercase tracking-wider">Standard</div>
                  <p className="text-white text-sm">RFC 4122</p>
                  <p className="text-gray-500 text-xs">Universally unique</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPasswordStrengthModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] overflow-hidden">
          <div className="bg-black border border-dashed border-white/20 rounded-none p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-white" />
                <h3 className="text-xl text-white font-light uppercase tracking-wider">
                  Password Strength Checker
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPasswordStrengthModal(false)}
                className="text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(event) => setPasswordInput(event.target.value)}
                    placeholder="Enter password to check"
                    className="w-full bg-black border border-dashed border-white/20 text-white font-mono text-xs pr-10 rounded-none"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white rounded-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex items-end justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPasswordInput('');
                    setPasswordStrength(null);
                    setShowPassword(false);
                  }}
                  className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
                >
                  Clear
                </Button>
                <Button
                  onClick={handleCheckPasswordStrength}
                  disabled={isCheckingPassword || !passwordInput.trim()}
                  className="rounded-none"
                >
                  {isCheckingPassword ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    'Check Strength'
                  )}
                </Button>
              </div>

              {passwordStrength && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                    <div className="border border-dashed border-white/10 p-3 space-y-2">
                      <div className="text-gray-400 uppercase tracking-wider">Strength</div>
                      <p
                        className={`text-sm font-medium ${
                          passwordStrength.strength === 'very-strong'
                            ? 'text-green-400'
                            : passwordStrength.strength === 'strong'
                              ? 'text-green-300'
                              : passwordStrength.strength === 'good'
                                ? 'text-yellow-300'
                                : passwordStrength.strength === 'fair'
                                  ? 'text-orange-300'
                                  : 'text-red-300'
                        }`}
                      >
                        {passwordStrength.strength
                          .split('-')
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ')}
                      </p>
                      <div className="w-full bg-black/40 h-2 rounded-none">
                        <div
                          className={`h-full transition-all ${
                            passwordStrength.strength === 'very-strong'
                              ? 'bg-green-400 w-full'
                              : passwordStrength.strength === 'strong'
                                ? 'bg-green-300 w-4/5'
                                : passwordStrength.strength === 'good'
                                  ? 'bg-yellow-300 w-3/5'
                                  : passwordStrength.strength === 'fair'
                                    ? 'bg-orange-300 w-2/5'
                                    : 'bg-red-300 w-1/5'
                          }`}
                        />
                      </div>
                    </div>
                    <div className="border border-dashed border-white/10 p-3 space-y-2">
                      <div className="text-gray-400 uppercase tracking-wider">Score</div>
                      <p className="text-white text-sm">{passwordStrength.score} / 5</p>
                      <p className="text-gray-500 text-xs">
                        {passwordStrength.score === 5
                          ? 'Excellent'
                          : passwordStrength.score === 4
                            ? 'Very Good'
                            : passwordStrength.score === 3
                              ? 'Good'
                              : passwordStrength.score === 2
                                ? 'Fair'
                                : 'Weak'}
                      </p>
                    </div>
                    <div className="border border-dashed border-white/10 p-3 space-y-2">
                      <div className="text-gray-400 uppercase tracking-wider">Config Match</div>
                      <p
                        className={`text-sm ${
                          passwordStrength.meetsConfig ? 'text-green-400' : 'text-red-300'
                        }`}
                      >
                        {passwordStrength.meetsConfig
                          ? '✓ Meets Requirements'
                          : '✗ Fails Requirements'}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {passwordStrength.configRequirements.minLength} -{' '}
                        {passwordStrength.configRequirements.maxLength} chars
                      </p>
                    </div>
                  </div>

                  <div className="border border-dashed border-white/10 p-3">
                    <div className="text-xs uppercase font-mono text-gray-400 mb-3">Checks</div>
                    <div className="space-y-2">
                      {passwordStrength.checks.map((check, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-black/40 border border-dashed border-white/10"
                        >
                          <span className="text-white font-mono text-xs">{check.name}</span>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-xs font-mono ${
                                check.passed ? 'text-green-400' : 'text-red-300'
                              }`}
                            >
                              {check.passed ? '✓' : '✗'}
                            </span>
                            <span className="text-xs text-gray-400 font-mono">{check.message}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showOAuthCredentialsModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] overflow-hidden">
          <div className="bg-black border border-dashed border-white/20 rounded-none p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-white" />
                <h3 className="text-xl text-white font-light uppercase tracking-wider">
                  OAuth Credentials
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOAuthCredentialsModal(false)}
                className="text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Select Provider
                </Label>
                <div className="flex flex-wrap gap-3">
                  {['google', 'github'].map((providerId) => {
                    const isSelected = selectedProvider === providerId;
                    return (
                      <button
                        key={providerId}
                        onClick={() => setSelectedProvider(providerId)}
                        className={`px-4 py-2 border rounded-none text-sm uppercase font-mono transition-colors ${
                          isSelected
                            ? 'border-white/60 bg-white/10 text-white'
                            : 'border-dashed border-white/20 text-gray-400 hover:border-white/40'
                        }`}
                      >
                        {providerId.charAt(0).toUpperCase() + providerId.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                  Origin
                </Label>
                <Input
                  value={oauthOrigin}
                  onChange={(e) => setOauthOrigin(e.target.value)}
                  placeholder={`http://${baseUrl}`}
                  className="bg-black border border-dashed border-white/20 text-white font-mono text-xs rounded-none"
                />
                <p className="text-[11px] text-gray-500 font-mono mt-1">
                  The default will be http://{baseUrl}
                </p>
              </div>

              <div className="flex items-end justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setOauthCredentials(null);
                    setOauthOrigin(baseUrl);
                  }}
                  className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
                >
                  Clear
                </Button>
                <Button
                  onClick={handleFetchOAuthCredentials}
                  disabled={
                    isFetchingCredentials || !selectedProvider || (!oauthOrigin.trim() && !baseUrl)
                  }
                  className="rounded-none"
                >
                  {isFetchingCredentials ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    'Fetch Credentials'
                  )}
                </Button>
              </div>

              {oauthCredentials && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                        Client ID
                      </Label>
                      <div className="relative">
                        <Input
                          value={oauthCredentials.clientId}
                          readOnly
                          className="bg-black border border-dashed border-white/20 text-white font-mono text-xs pr-10 rounded-none"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(oauthCredentials.clientId)}
                          className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white rounded-none"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                        Client Secret
                      </Label>
                      <div className="relative">
                        <Input
                          type={showOAuthSecret ? 'text' : 'password'}
                          value={oauthCredentials.clientSecret}
                          readOnly
                          className="bg-black border border-dashed border-white/20 text-white font-mono text-xs pr-20 rounded-none"
                        />
                        <div className="absolute right-0 top-0 h-full flex items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowOAuthSecret(!showOAuthSecret)}
                            className="px-2 text-gray-400 hover:text-white rounded-none"
                          >
                            {showOAuthSecret ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(oauthCredentials.clientSecret)}
                            className="px-2 text-gray-400 hover:text-white rounded-none"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-dashed border-white/10">
                    <div className="flex-1">
                      {envWriteResult && (
                        <div className="text-xs font-mono">
                          {envWriteResult.success ? (
                            <span className="text-green-400 uppercase">
                              ✓ {envWriteResult.message.toLowerCase()}
                              <span className="block normal-case text-gray-400">
                                <span className="text-gray-400 mr-1">{'>'}</span>{' '}
                                {envWriteResult.path}
                              </span>
                            </span>
                          ) : (
                            <span className="text-red-300">✗ {envWriteResult.message}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={handleWriteToEnv}
                      disabled={isWritingToEnv || isCheckingEnv}
                      className="rounded-none"
                    >
                      {isCheckingEnv ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Checking...
                        </>
                      ) : isWritingToEnv ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Writing...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          Write to .env
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {showSecretGeneratorModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] overflow-hidden">
          <div className="bg-black border border-dashed border-white/20 rounded-none p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-white" />
                <h3 className="text-xl text-white font-light uppercase tracking-wider">
                  Secret Generator
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSecretGeneratorModal(false)}
                className="text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                    Length (bytes)
                  </Label>
                  <Input
                    type="number"
                    value={secretLength === 0 ? '' : secretLength}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setSecretLength(0);
                        return;
                      }
                      const numVal = parseInt(val, 10);
                      if (!isNaN(numVal)) {
                        setSecretLength(numVal);
                      }
                    }}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (isNaN(val) || val < 16) {
                        setSecretLength(32);
                      } else if (val > 128) {
                        setSecretLength(128);
                      } else {
                        setSecretLength(val);
                      }
                    }}
                    min="16"
                    max="128"
                    className="bg-black border border-dashed border-white/20 text-white font-mono text-xs rounded-none"
                  />
                  <p className="text-[11px] text-gray-500 font-mono mt-1">
                    Recommended: 32 bytes (256 bits)
                  </p>
                </div>
                <div>
                  <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                    Format
                  </Label>
                  <div className="flex gap-3">
                    {[
                      { id: 'hex', label: 'Hex' },
                      { id: 'base64', label: 'Base64' },
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setSecretFormat(option.id as 'hex' | 'base64')}
                        className={`px-4 py-2 border rounded-none text-sm uppercase font-mono transition-colors flex-1 ${
                          secretFormat === option.id
                            ? 'border-white/60 bg-white/10 text-white'
                            : 'border-dashed border-white/20 text-gray-400 hover:border-white/40'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSecretResult(null);
                    setSecretLength(32);
                    setSecretFormat('hex');
                  }}
                  className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
                >
                  Clear
                </Button>
                <Button
                  onClick={handleGenerateSecret}
                  disabled={isGeneratingSecret}
                  className="rounded-none"
                >
                  {isGeneratingSecret ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Secret'
                  )}
                </Button>
              </div>

              {secretResult && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                    <div className="border border-dashed border-white/10 p-3 space-y-2">
                      <div className="text-gray-400 uppercase tracking-wider">Length</div>
                      <p className="text-white text-sm">{secretResult.length} bytes</p>
                    </div>
                    <div className="border border-dashed border-white/10 p-3 space-y-2">
                      <div className="text-gray-400 uppercase tracking-wider">Entropy</div>
                      <p className="text-white text-sm">{secretResult.entropy} bits</p>
                    </div>
                    <div className="border border-dashed border-white/10 p-3 space-y-2">
                      <div className="text-gray-400 uppercase tracking-wider">Format</div>
                      <p className="text-white text-sm uppercase">{secretResult.format}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                      Generated Secret
                    </Label>
                    <div className="relative">
                      <Input
                        value={secretResult.secret}
                        readOnly
                        className="bg-black border border-dashed border-white/20 text-white font-mono text-xs pr-10 rounded-none"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(secretResult.secret)}
                        className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white rounded-none"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs uppercase font-mono text-gray-400 mb-2 block">
                      Environment Variable Format
                    </Label>
                    <div className="relative">
                      <Input
                        value={secretResult.envFormat}
                        readOnly
                        className="bg-black border border-dashed border-white/20 text-white font-mono text-xs pr-10 rounded-none"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(secretResult.envFormat)}
                        className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white rounded-none"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-[11px] text-gray-500 font-mono mt-2">
                      Add this to your <code className="text-gray-400">.env</code> file. Keep it
                      secret and never commit it to version control.
                    </p>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={handleWriteSecretToEnv}
                      disabled={isCheckingSecret || isWritingSecret}
                      className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
                    >
                      {isCheckingSecret || isWritingSecret ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          {isWritingSecret ? 'Writing...' : 'Checking...'}
                        </>
                      ) : (
                        'Write to .env'
                      )}
                    </Button>
                  </div>

                  <div className="border border-dashed border-white/20 bg-black text-gray-300 text-xs font-mono p-3 rounded-none">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                      <div>
                        <div className="uppercase font-mono mb-2 text-gray-400 tracking-wider">
                          Security Best Practices
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-[11px] text-gray-300">
                          <li>Use a minimum of 32 bytes (256 bits) for production</li>
                          <li>Store secrets in environment variables, never in code</li>
                          <li>Use different secrets for development and production</li>
                          <li>Rotate secrets periodically for enhanced security</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {showEnvConfirmModal && existingEnvCredentials && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] overflow-hidden">
          <div className="bg-black border border-dashed border-white/20 rounded-none p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <h3 className="text-xl text-white font-light uppercase tracking-wider">
                  Overwrite Existing Credentials?
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowEnvConfirmModal(false);
                  setExistingEnvCredentials(null);
                  setIsCheckingEnv(false);
                }}
                className="text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="border border-dashed border-white/20 p-4">
                <p className="text-sm border-b border-dashed border-white/20 pb-5 text-gray-300 font-mono mb-3">
                  The following{' '}
                  <span className="text-white uppercase">
                    {selectedProvider?.charAt(0).toUpperCase() + selectedProvider?.slice(1)}
                  </span>{' '}
                  credentials already exist in{' '}
                  <span className="text-gray-400 normal-case">{existingEnvCredentials.path}</span>:
                </p>
                <div className="space-y-2 pt-2">
                  {Object.entries(existingEnvCredentials.credentials).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-xs font-mono">
                      <span className="text-gray-400 uppercase">{key}</span>
                      <span className="text-gray-500">
                        {value.length > 20 ? `${value.substring(0, 20)}...` : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-dashed border-white/10">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEnvConfirmModal(false);
                    setExistingEnvCredentials(null);
                    setIsCheckingEnv(false);
                  }}
                  className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
                >
                  No, Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => writeCredentialsToEnv('append')}
                  disabled={isWritingToEnv}
                  className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
                >
                  Append
                </Button>
                <Button
                  onClick={() => writeCredentialsToEnv('override')}
                  disabled={isWritingToEnv}
                  className="rounded-none"
                >
                  {isWritingToEnv ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Writing...
                    </>
                  ) : (
                    'Yes, Overwrite'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Secret Overwrite Confirmation Modal */}
      {showSecretConfirmModal && existingSecret && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] overflow-hidden">
          <div className="bg-black border border-dashed border-white/20 rounded-none p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <h3 className="text-xl text-white font-light uppercase tracking-wider">
                  Overwrite Existing Secret?
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowSecretConfirmModal(false);
                  setExistingSecret(null);
                  setIsCheckingSecret(false);
                }}
                className="text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="border border-dashed border-white/20 p-4">
                <p className="text-sm border-b border-dashed border-white/20 pb-5 text-gray-300 font-mono mb-3">
                  <span className="text-white uppercase">BETTER_AUTH_SECRET</span> already exists in{' '}
                  <span className="text-gray-400 normal-case">{existingSecret.path}</span>:
                </p>
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-gray-400 uppercase">BETTER_AUTH_SECRET</span>
                    <span className="text-gray-500">
                      {existingSecret.secret && existingSecret.secret.length > 20
                        ? `${existingSecret.secret.substring(0, 20)}...`
                        : existingSecret.secret || '***'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-dashed border-white/10">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSecretConfirmModal(false);
                    setExistingSecret(null);
                    setIsCheckingSecret(false);
                  }}
                  className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
                >
                  No, Cancel
                </Button>
                <Button
                  onClick={() => writeSecretToEnv('override')}
                  disabled={isWritingSecret}
                  className="rounded-none"
                >
                  {isWritingSecret ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Writing...
                    </>
                  ) : (
                    'Yes, Overwrite'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
