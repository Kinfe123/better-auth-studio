import type { BetterAuthOptions } from 'better-auth';
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Database,
  Eye,
  Globe,
  Info,
  Key,
  Loader,
  Lock,
  Mail,
  Puzzle,
  RefreshCw,
  Settings as SettingsIcon,
  Shield,
  Users,
  XCircle,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWebSocket } from '../hooks/useWebSocket';

interface AuthConfig {
  appName?: string;
  baseURL?: string;
  basePath?: string;
  secret?: string;
  database?: {
    type?: string;
    url?: string;
    dialect?: string;
    adapter?: string;
    version?: string;
    casing?: string;
    debugLogs?: boolean;
    adapterConfig?: BetterAuthOptions['database']['adapterConfig'];
  };
  secondaryStorage?: BetterAuthOptions['secondaryStorage'];
  emailVerification?: BetterAuthOptions['emailVerification'];
  emailAndPassword?: BetterAuthOptions['emailAndPassword'];
  socialProviders?: Array<{
    type: string;
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
  }>;
  user?: {
    modelName?: string;
    changeEmail?: {
      enabled: boolean;
    };
    deleteUser?: {
      enabled?: boolean;
      deleteTokenExpiresIn?: number;
    };
  };
  session?: BetterAuthOptions['session'];
  account?: BetterAuthOptions['account'];
  verification?: BetterAuthOptions['verification'];
  trustedOrigins?: BetterAuthOptions['trustedOrigins'];
  rateLimit?: BetterAuthOptions['rateLimit'];
  advanced?: BetterAuthOptions['advanced'];
  logger?: BetterAuthOptions['logger'];
  disabledPaths?: BetterAuthOptions['disabledPaths'];
  telemetry?: BetterAuthOptions['telemetry'];
}

interface SystemInfo {
  studioVersion: string;
  nodeVersion: string;
  platform: string;
  uptime: string;
}

interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
}

interface PluginsResponse {
  plugins: Plugin[];
  configPath: string | null;
  totalPlugins: number;
  error?: string;
}

interface DatabaseInfo {
  success: boolean;
  name: string;
  version: string;
  dialect: string;
  adapter: string;
  displayName: string;
  autoDetected: boolean;
  message?: string;
}

export default function Settings() {
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [plugins, setPlugins] = useState<PluginsResponse | null>(null);
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [studioVersion, setStudioVersion] = useState<string | null>(null);

  // WebSocket hook to listen for config changes
  useWebSocket((message) => {
    if (message.type === 'config_changed') {
      // Add a small delay to ensure the server is fully reloaded
      setTimeout(() => {
        fetchConfig();
        fetchSystemInfo();
        fetchPlugins();
        fetchDatabaseInfo();
      }, 500);
    } else if (message.type === 'connected') {
    }
  });

  const fetchConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/config');
      const data = await response.json();
      if (data.studio?.version) {
        setStudioVersion(`v${data.studio.version}`);
      }
      setConfig(data);
    } catch (_error) {
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSystemInfo = useCallback(async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setSystemInfo(
        data.system || {
          studioVersion: studioVersion || 'v1.0.0',
          nodeVersion: process.version,
          platform: navigator.platform,
          uptime: '2h 15m',
        }
      );
    } catch (_error) {
      setSystemInfo({
        studioVersion: studioVersion || 'v1.0.0',
        nodeVersion: 'v18.0.0',
        platform: 'macOS',
        uptime: '2h 15m',
      });
    }
  }, [studioVersion]);

  const fetchPlugins = useCallback(async () => {
    try {
      const response = await fetch('/api/plugins');
      const data = await response.json();
      setPlugins(data);
    } catch (_error) {
      setPlugins({
        plugins: [],
        configPath: null,
        totalPlugins: 0,
        error: 'Failed to fetch plugins',
      });
    }
  }, []);

  const fetchDatabaseInfo = useCallback(async () => {
    try {
      const response = await fetch('/api/db');
      const data = await response.json();
      setDatabaseInfo(data);
    } catch (_error) {
      setDatabaseInfo({
        success: false,
        name: 'unknown',
        version: 'unknown',
        dialect: 'unknown',
        adapter: 'unknown',
        displayName: 'Unknown',
        autoDetected: false,
        message: 'Failed to fetch database info',
      });
    }
  }, []);

  const getConnectionStatus = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'postgresql':
      case 'postgres':
        return (
          <Badge
            variant="secondary"
            className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1"
          >
            <CheckCircle className="w-3 h-3" />
            Connected
          </Badge>
        );
      case 'mysql':
        return (
          <Badge
            variant="secondary"
            className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1"
          >
            <CheckCircle className="w-3 h-3" />
            Connected
          </Badge>
        );
      case 'sqlite':
        return (
          <Badge
            variant="secondary"
            className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1"
          >
            <Info className="w-3 h-3" />
            Local
          </Badge>
        );
      default:
        return (
          <Badge
            variant="secondary"
            className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1"
          >
            <AlertTriangle className="w-3 h-3" />
            Unknown
          </Badge>
        );
    }
  };
  useEffect(() => {
    fetchConfig();
    fetchSystemInfo();
    fetchPlugins();
    fetchDatabaseInfo();
  }, [fetchConfig, fetchDatabaseInfo, fetchPlugins, fetchSystemInfo]);

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'google':
        return <Globe className="w-5 h-5 text-white" />;
      case 'github':
        return <Shield className="w-5 h-5 text-white" />;
      case 'discord':
        return <Globe className="w-5 h-5 text-white" />;
      case 'twitter':
        return <Globe className="w-5 h-5 text-white" />;
      default:
        return <Globe className="w-5 h-5 text-white" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-6 h-6 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between p-5 pt-7">
        <div>
          <h1 className="text-3xl font-normal text-white tracking-tight">Settings</h1>
          <p className="text-gray-300 mt-2 uppercase font-mono font-light text-xs">
            Configure your Better Auth application
          </p>
        </div>
      </div>
      <hr className="w-full border-white/15 h-px" />
      <hr className="w-full border-white/15 h-px" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-5">
        <Card className="border-white/15 bg-black/70 px-0 sm:px-0 md:px-0 lg:px-0 xl:px-0 rounded-none">
          <CardHeader className="space-y-0">
            <CardTitle className="text-white font-light uppercase text-lg flex items-center space-x-2">
              <SettingsIcon className="w-4 h-4 text-white" />
              <span>Application</span>
            </CardTitle>
            <CardDescription className="uppercase font-mono font-light flex items-center gap-2 text-gray-400 text-xs">
              <svg
                className="w-3 h-3 inline-flex text-gray-400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                {' '}
                <path
                  d="M8 5v2h2V5H8zm4 4V7h-2v2h2zm2 2V9h-2v2h2zm0 2h2v-2h-2v2zm-2 2v-2h2v2h-2zm0 0h-2v2h2v-2zm-4 4v-2h2v2H8z"
                  fill="currentColor"
                />{' '}
              </svg>
              Basic application configuration
            </CardDescription>
          </CardHeader>
          <hr className="w-full border-white/15 h-px -mt-3 mb-1" />
          <CardContent className="space-y-0 px-0 pb-0 border-b-none">
            <div className="flex items-center justify-between p-3 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-light uppercase text-white">App Name</p>
                  <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                    Application display name
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">{config?.appName || 'Better Auth'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Key className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-light uppercase text-white">Base URL</p>
                  <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                    Application base URL
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-medium text-white">
                  {config?.baseURL || 'http://localhost:3000'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Lock className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-light uppercase text-white">Base Path</p>
                  <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                    Auth API base path
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-medium text-white">
                  {config?.basePath || '/api/auth'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-light uppercase text-white">Secret</p>
                  <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                    Encryption secret
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {config?.secret === 'Configured' ? 'Configured' : 'Not set'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Database Configuration */}
        <Card className="border-white/15 bg-black/70 px-0 sm:px-0 md:px-0 lg:px-0 xl:px-0 rounded-none">
          <CardHeader className="space-y-0">
            <CardTitle className="text-white font-light uppercase text-lg flex items-center space-x-2">
              <Database className="w-4 h-4 text-white" />
              <span>Database</span>
            </CardTitle>
            <CardDescription className="uppercase font-mono font-light flex items-center gap-2 text-gray-400 text-xs">
              <svg
                className="w-3 h-3 inline-flex text-gray-400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                {' '}
                <path
                  d="M8 5v2h2V5H8zm4 4V7h-2v2h2zm2 2V9h-2v2h2zm0 2h2v-2h-2v2zm-2 2v-2h2v2h-2zm0 0h-2v2h2v-2zm-4 4v-2h2v2H8z"
                  fill="currentColor"
                />{' '}
              </svg>
              Database connection and configuration
            </CardDescription>
          </CardHeader>
          <hr className="w-full border-white/15 h-px -mt-3 mb-1" />
          <CardContent className="space-y-0 px-0 pb-0 border-b-none">
            {/* Database Type */}
            <div className="flex items-center justify-between p-3 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Database className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-light uppercase text-white">
                    {databaseInfo?.displayName ||
                      (config?.database?.type &&
                        config?.database?.type.charAt(0).toUpperCase() +
                          config?.database?.type.slice(1)) ||
                      'Unknown'}
                  </p>
                  <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                    Database Type
                  </p>
                </div>
              </div>
              {(databaseInfo?.name || config?.database?.type) &&
                getConnectionStatus(databaseInfo?.name || config?.database?.type || '')}
            </div>

            {(databaseInfo?.dialect || config?.database?.dialect) &&
              databaseInfo?.dialect !== 'unknown' && (
                <div className="flex items-center justify-between p-3 px-5 border-b border-white/15">
                  <div className="flex items-center space-x-3">
                    <Database className="w-5 h-5 text-white" />
                    <div>
                      <p className="text-sm font-light uppercase text-white">Dialect</p>
                      <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                        Database dialect
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">
                      {config?.database?.dialect || databaseInfo?.dialect}
                    </p>
                  </div>
                </div>
              )}

            {config?.database?.url && (
              <div className="flex items-center justify-between p-3 px-5 border-b border-white/15">
                <div className="flex items-center space-x-3">
                  <Key className="w-5 h-5 text-white" />
                  <div>
                    <p className="text-sm font-light uppercase text-white">Connection URL</p>
                    <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                      Database connection string
                    </p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" />
                  Configured
                </Badge>
              </div>
            )}

            {/* Casing (from config only) */}
            {config?.database?.casing && (
              <div className="flex items-center justify-between p-3 px-5 border-b border-white/15">
                <div className="flex items-center space-x-3">
                  <SettingsIcon className="w-5 h-5 text-white" />
                  <div>
                    <p className="text-sm font-light uppercase text-white">Casing</p>
                    <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                      Table name casing
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white capitalize">
                    {config.database.casing}
                  </p>
                </div>
              </div>
            )}

            {/* Debug Logs (from config only) */}
            {config?.database && (
              <div className="flex items-center justify-between p-3 px-5 border-b border-white/15">
                <div className="flex items-center space-x-3">
                  <RefreshCw className="w-5 h-5 text-white" />
                  <div>
                    <p className="text-sm font-light uppercase text-white">Debug Logs</p>
                    <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                      Database debug logging
                    </p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1"
                >
                  {config.database.debugLogs ? (
                    <>
                      <AlertTriangle className="w-3 h-3" />
                      Enabled
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      Disabled
                    </>
                  )}
                </Badge>
              </div>
            )}
            {!databaseInfo?.success && !config?.database && (
              <div className="flex items-center justify-between p-3 px-5">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-sm font-light uppercase text-white">No Database Detected</p>
                    <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                      {databaseInfo?.message || 'No supported database packages found'}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs bg-yellow-900/50 border border-yellow-500/30 text-yellow-400 rounded-sm"
                >
                  Unknown
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Authentication Providers */}
        <Card className="border-white/15 bg-black/70 px-0 sm:px-0 md:px-0 lg:px-0 xl:px-0 rounded-none">
          <CardHeader className="space-y-0">
            <CardTitle className="text-white font-light uppercase text-lg flex items-center space-x-2">
              <Shield className="w-4 h-4 text-white" />
              <span>Providers</span>
            </CardTitle>
            <CardDescription className="uppercase font-mono font-light flex items-center gap-2 text-gray-400 text-xs">
              <svg
                className="w-3 h-3 inline-flex text-gray-400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                {' '}
                <path
                  d="M8 5v2h2V5H8zm4 4V7h-2v2h2zm2 2V9h-2v2h2zm0 2h2v-2h-2v2zm-2 2v-2h2v2h-2zm0 0h-2v2h2v-2zm-4 4v-2h2v2H8z"
                  fill="currentColor"
                />{' '}
              </svg>
              Configured authentication providers
            </CardDescription>
          </CardHeader>
          <hr className="w-full border-white/15 h-px -mt-3 mb-1" />
          <CardContent className="p-0">
            {config?.socialProviders && config.socialProviders.length > 0 ? (
              config.socialProviders.map((provider, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 px-5 border-b border-white/15 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    {getProviderIcon(provider.type)}
                    <div>
                      <p className="text-sm font-light uppercase text-white capitalize">
                        {provider.type}
                      </p>
                      <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                        {provider.clientId ? 'Configured' : 'Not configured'}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1"
                  >
                    {provider.clientId ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Active
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3" />
                        Setup Required
                      </>
                    )}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Shield className="w-8 h-8 text-white mx-auto mb-2" />
                <p className="text-sm text-gray-400">No providers configured</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email & Password */}
        <Card className="border-white/15 bg-black/70 px-0 sm:px-0 md:px-0 lg:px-0 xl:px-0 rounded-none">
          <CardHeader className="space-y-0">
            <CardTitle className="text-white font-light uppercase text-lg flex items-center space-x-2">
              <Mail className="w-4 h-4 text-white" />
              <span>Email & Password</span>
            </CardTitle>
            <CardDescription className="uppercase font-mono font-light flex items-center gap-2 text-gray-400 text-xs">
              <svg
                className="w-3 h-3 inline-flex text-gray-400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                {' '}
                <path
                  d="M8 5v2h2V5H8zm4 4V7h-2v2h2zm2 2V9h-2v2h2zm0 2h2v-2h-2v2zm-2 2v-2h2v2h-2zm0 0h-2v2h2v-2zm-4 4v-2h2v2H8z"
                  fill="currentColor"
                />{' '}
              </svg>
              Email authentication settings
            </CardDescription>
          </CardHeader>
          <hr className="w-full border-white/15 h-px -mt-3 mb-1" />
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-3 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-light uppercase text-white">Email Authentication</p>
                  <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                    Allow users to sign up with email
                  </p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1"
              >
                {config?.emailAndPassword?.enabled ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Enabled
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3" />
                    Disabled
                  </>
                )}
              </Badge>
            </div>

            {config?.emailAndPassword?.enabled && (
              <>
                <div className="flex items-center justify-between p-3 px-5 border-b border-white/15">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-white" />
                    <div>
                      <p className="text-sm font-light uppercase text-white">Sign Up</p>
                      <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                        Allow new user registration
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1"
                  >
                    {config?.emailAndPassword?.disableSignUp ? (
                      <>
                        <XCircle className="w-3 h-3" />
                        Disabled
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Enabled
                      </>
                    )}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 px-5 border-b border-white/15">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-white" />
                    <div>
                      <p className="text-sm font-light uppercase text-white">Email Verification</p>
                      <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                        Require email verification
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1"
                  >
                    {config?.emailAndPassword?.requireEmailVerification ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Required
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3" />
                        Optional
                      </>
                    )}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 px-5 border-b border-white/15">
                  <div className="flex items-center space-x-3">
                    <Lock className="w-5 h-5 text-white" />
                    <div>
                      <p className="text-sm font-light uppercase text-white">Password Length</p>
                      <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                        Min/Max password length
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">
                      {config?.emailAndPassword?.minPasswordLength || 8} -{' '}
                      {config?.emailAndPassword?.maxPasswordLength || 128}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 px-5 border-b border-white/15 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <Zap className="w-5 h-5 text-white" />
                    <div>
                      <p className="text-sm font-light uppercase text-white">Auto Sign In</p>
                      <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                        Auto sign in after registration
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1"
                  >
                    {config?.emailAndPassword?.autoSignIn ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Enabled
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3" />
                        Disabled
                      </>
                    )}
                  </Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Session Configuration */}
        <Card className="border-white/15 bg-black/70 px-0 sm:px-0 md:px-0 lg:px-0 xl:px-0 rounded-none">
          <CardHeader className="space-y-0">
            <CardTitle className="text-white font-light uppercase text-lg flex items-center space-x-2">
              <Clock className="w-4 h-4 text-white" />
              <span>Session</span>
            </CardTitle>
            <CardDescription className="uppercase font-mono font-light flex items-center gap-2 text-gray-400 text-xs">
              <svg
                className="w-3 h-3 inline-flex text-gray-400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                {' '}
                <path
                  d="M8 5v2h2V5H8zm4 4V7h-2v2h2zm2 2V9h-2v2h2zm0 2h2v-2h-2v2zm-2 2v-2h2v2h-2zm0 0h-2v2h2v-2zm-4 4v-2h2v2H8z"
                  fill="currentColor"
                />{' '}
              </svg>
              Session management settings
            </CardDescription>
          </CardHeader>
          <hr className="w-full border-white/15 h-px -mt-3 mb-1" />
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-3 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-light uppercase text-white">Session Duration</p>
                  <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                    How long sessions last
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {config?.session?.expiresIn
                    ? `${Math.floor(config.session.expiresIn / (60 * 60 * 24))} days`
                    : '7 days'}
                </p>
                <p className="text-[10px] font-light uppercase font-mono text-gray-400">Default</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <RefreshCw className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-light uppercase text-white">Update Age</p>
                  <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                    Session refresh interval
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {config?.session?.updateAge
                    ? `${Math.floor(config.session.updateAge / (60 * 60))} hours`
                    : '24 hours'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Zap className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-light uppercase text-white">Session Refresh</p>
                  <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                    Auto refresh sessions
                  </p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1"
              >
                {config?.session?.disableSessionRefresh ? (
                  <>
                    <XCircle className="w-3 h-3" />
                    Disabled
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Enabled
                  </>
                )}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 px-5 border-b border-white/15 last:border-b-0">
              <div className="flex items-center space-x-3">
                <Database className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-light uppercase text-white">Store in Database</p>
                  <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                    Store sessions in database
                  </p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1"
              >
                {config?.session?.storeSessionInDatabase ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Enabled
                  </>
                ) : (
                  <>
                    <Info className="w-3 h-3" />
                    Secondary Storage
                  </>
                )}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Rate Limiting */}
        <Card className="border-white/15 bg-black/70 px-0 sm:px-0 md:px-0 lg:px-0 xl:px-0 rounded-none">
          <CardHeader className="space-y-0">
            <CardTitle className="text-white font-light uppercase text-lg flex items-center space-x-2">
              <Shield className="w-4 h-4 text-white" />
              <span>Rate Limiting</span>
            </CardTitle>
            <CardDescription className="uppercase font-mono font-light flex items-center gap-2 text-gray-400 text-xs">
              <svg
                className="w-3 h-3 inline-flex text-gray-400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                {' '}
                <path
                  d="M8 5v2h2V5H8zm4 4V7h-2v2h2zm2 2V9h-2v2h2zm0 2h2v-2h-2v2zm-2 2v-2h2v2h-2zm0 0h-2v2h2v-2zm-4 4v-2h2v2H8z"
                  fill="currentColor"
                />{' '}
              </svg>
              API rate limiting configuration
            </CardDescription>
          </CardHeader>
          <hr className="w-full border-white/15 h-px -mt-3 mb-1" />
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-3 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-light uppercase text-white">Rate Limiting</p>
                  <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                    Enable rate limiting
                  </p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1"
              >
                {config?.rateLimit?.enabled ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Enabled
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3" />
                    Disabled
                  </>
                )}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-sm font-light uppercase text-white">Rate Limit Window</p>
                  <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                    Time window for rate limiting
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {config?.rateLimit?.window ? `${config.rateLimit.window} seconds` : '10 seconds'}
                </p>
                <p className="text-[10px] font-light uppercase font-mono text-gray-400">Window</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-light uppercase text-white">Max Requests</p>
                  <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                    Maximum requests per window
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">{config?.rateLimit?.max || 100}</p>
                <p className="text-[10px] font-light uppercase font-mono text-gray-400">Requests</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 px-5 border-b border-white/15 last:border-b-0">
              <div className="flex items-center space-x-3">
                <Database className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-light uppercase text-white">Storage</p>
                  <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                    Rate limit storage type
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white capitalize">
                  {config?.rateLimit?.storage || 'memory'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Configuration */}
        <Card className="border-white/15 bg-black/70 px-0 sm:px-0 md:px-0 lg:px-0 xl:px-0 rounded-none">
          <CardHeader className="space-y-0">
            <CardTitle className="text-white font-light uppercase text-lg flex items-center space-x-2">
              <SettingsIcon className="w-4 h-4 text-white" />
              <span>Advanced</span>
            </CardTitle>
            <CardDescription className="uppercase font-mono font-light flex items-center gap-2 text-gray-400 text-xs">
              <svg
                className="w-3 h-3 inline-flex text-gray-400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                {' '}
                <path
                  d="M8 5v2h2V5H8zm4 4V7h-2v2h2zm2 2V9h-2v2h2zm0 2h2v-2h-2v2zm-2 2v-2h2v2h-2zm0 0h-2v2h2v-2zm-4 4v-2h2v2H8z"
                  fill="currentColor"
                />{' '}
              </svg>
              Advanced configuration options
            </CardDescription>
          </CardHeader>
          <hr className="w-full border-white/15 h-px -mt-3 mb-1" />
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-3 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Lock className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-light uppercase text-white">Secure Cookies</p>
                  <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                    Use secure cookies
                  </p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1"
              >
                {config?.advanced?.useSecureCookies ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Enabled
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3" />
                    Disabled
                  </>
                )}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-light uppercase text-white">CSRF Check</p>
                  <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                    CSRF protection
                  </p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1"
              >
                {config?.advanced?.disableCSRFCheck ? (
                  <>
                    <XCircle className="w-3 h-3" />
                    Disabled
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Enabled
                  </>
                )}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Eye className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-light uppercase text-white">IP Tracking</p>
                  <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                    Track IP addresses
                  </p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1"
              >
                {config?.advanced?.ipAddress?.disableIpTracking ? (
                  <>
                    <XCircle className="w-3 h-3" />
                    Disabled
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Enabled
                  </>
                )}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 px-5 border-b border-white/15 last:border-b-0">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-light uppercase text-white">Telemetry</p>
                  <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                    Usage analytics
                  </p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1"
              >
                {config?.telemetry?.enabled ? (
                  <>
                    <AlertTriangle className="w-3 h-3" />
                    Enabled
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Disabled
                  </>
                )}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card className="border-white/15 bg-black/70 px-0 sm:px-0 md:px-0 lg:px-0 xl:px-0 rounded-none">
          <CardHeader className="space-y-0">
            <CardTitle className="text-white font-light uppercase text-lg flex items-center space-x-2">
              <Info className="w-4 h-4 text-white" />
              <span>System Info</span>
            </CardTitle>
            <CardDescription className="uppercase font-mono font-light flex items-center gap-2 text-gray-400 text-xs">
              <svg
                className="w-3 h-3 inline-flex text-gray-400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                {' '}
                <path
                  d="M8 5v2h2V5H8zm4 4V7h-2v2h2zm2 2V9h-2v2h2zm0 2h2v-2h-2v2zm-2 2v-2h2v2h-2zm0 0h-2v2h2v-2zm-4 4v-2h2v2H8z"
                  fill="currentColor"
                />{' '}
              </svg>
              Better Auth Studio system information
            </CardDescription>
          </CardHeader>
          <hr className="w-full border-white/15 h-px -mt-3 mb-1" />
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-3 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Zap className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-light uppercase text-white">Studio Version</p>
                  <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                    Better Auth Studio
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">{studioVersion || 'v1.0.0'}</p>
                <p className="text-[10px] font-light uppercase font-mono text-gray-400">Latest</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Info className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-light uppercase text-white">Node.js Version</p>
                  <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                    Runtime environment
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {systemInfo?.nodeVersion || 'v18.0.0'}
                </p>
                <p className="text-[10px] font-light uppercase font-mono text-gray-400">Current</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-light uppercase text-white">Platform</p>
                  <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                    Operating system
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">{systemInfo?.platform || 'macOS'}</p>
                <p className="text-[10px] font-light uppercase font-mono text-gray-400">System</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 px-5 border-b border-white/15 last:border-b-0">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-light uppercase text-white">Uptime</p>
                  <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                    Service uptime
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">{systemInfo?.uptime || '2h 15m'}</p>
                <p className="text-[10px] font-light uppercase font-mono text-gray-400">Running</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/15 bg-black/70 px-0 sm:px-0 md:px-0 lg:px-0 xl:px-0 rounded-none lg:col-span-2">
          <div className="flex justify-between items-center">
            <CardHeader className="space-y-0">
              <CardTitle className="text-white font-light uppercase text-lg flex items-center space-x-2">
                <Puzzle className="w-4 h-4 text-white" />
                <span>Plugins</span>
              </CardTitle>
              <CardDescription className="uppercase font-mono font-light flex items-center gap-2 text-gray-400 text-xs">
                <svg
                  className="w-3 h-3 inline-flex text-gray-400"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  {' '}
                  <path
                    d="M8 5v2h2V5H8zm4 4V7h-2v2h2zm2 2V9h-2v2h2zm0 2h2v-2h-2v2zm-2 2v-2h2v2h-2zm0 0h-2v2h2v-2zm-4 4v-2h2v2H8z"
                    fill="currentColor"
                  />{' '}
                </svg>
                Better Auth plugins enabled in your configuration
              </CardDescription>
            </CardHeader>
            <div className="pr-6">
              <p className="text-sm font-medium text-white">{plugins?.totalPlugins || 0}</p>
              <p className="text-[10px] font-light uppercase font-mono text-gray-400">Active</p>
            </div>
          </div>
          <hr className="w-full border-white/15 h-px -mt-3 mb-1" />
          <CardContent className="space-y-0 px-0 pb-0 border-b-none">
            {plugins?.plugins && plugins.plugins.length > 0 ? (
              <>
                {plugins.plugins.map((plugin, index) => (
                  <div
                    key={plugin.id}
                    className={`flex items-center justify-between p-3 px-5 ${index < plugins.plugins.length - 1 ? 'border-b border-white/15' : ''}`}
                  >
                    <div className="flex items-center space-x-3">
                      <Puzzle className="w-5 h-5 text-white" />
                      <div>
                        <p className="text-sm font-light uppercase text-white">
                          {plugin.name.slice(0, 1).toUpperCase() +
                            plugin.name.slice(1).replace('-', ' ')}
                        </p>
                        <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                          {plugin.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex items-center space-x-2">
                      <Badge
                        variant="secondary"
                        className="text-xs bg-green-900/50 border border-dashed rounded-none border-green-500/30 text-green-400 flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Enabled
                      </Badge>
                    </div>
                  </div>
                ))}

                {plugins.configPath && (
                  <div className="p-4 px-5 bg-black/30 border-t border-white/10">
                    <p className="text-xs text-gray-400">
                      Config file:{' '}
                      <span className="text-white font-mono">{plugins.configPath}</span>
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between p-4 px-5">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-sm font-medium text-white">No Plugins Enabled</p>
                    <p className="text-xs text-gray-400">
                      {plugins?.error ||
                        'No plugins are currently configured in your Better Auth setup'}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs bg-yellow-900/50 border border-yellow-500/30 text-yellow-400 rounded-sm"
                >
                  None
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
