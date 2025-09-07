import { useState, useEffect } from 'react'
import { 
  Database, 
  Shield, 
  Mail, 
  Globe, 
  Clock, 
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  RefreshCw,
  Lock,
  Key,
  Users,
  Settings as SettingsIcon,
  Bell,
  Eye,
  Puzzle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface AuthConfig {
  appName?: string
  baseURL?: string
  basePath?: string
  secret?: string
  database?: {
    type?: string
    url?: string
    dialect?: string
    casing?: string
    debugLogs?: boolean
  }
  secondaryStorage?: any
  emailVerification?: {
    sendOnSignUp?: boolean
    sendOnSignIn?: boolean
    autoSignInAfterVerification?: boolean
    expiresIn?: number
  }
  emailAndPassword?: {
    enabled: boolean
    disableSignUp?: boolean
    requireEmailVerification?: boolean
    maxPasswordLength?: number
    minPasswordLength?: number
    resetPasswordTokenExpiresIn?: number
    autoSignIn?: boolean
    revokeSessionsOnPasswordReset?: boolean
  }
  socialProviders?: Array<{
    type: string
    clientId?: string
    clientSecret?: string
    redirectUri?: string
  }>
  user?: {
    modelName?: string
    changeEmail?: {
      enabled: boolean
    }
    deleteUser?: {
      enabled?: boolean
      deleteTokenExpiresIn?: number
    }
  }
  session?: {
    modelName?: string
    expiresIn?: number
    updateAge?: number
    disableSessionRefresh?: boolean
    storeSessionInDatabase?: boolean
    preserveSessionInDatabase?: boolean
    cookieCache?: {
      enabled?: boolean
      maxAge?: number
    }
    freshAge?: number
  }
  account?: {
    modelName?: string
    updateAccountOnSignIn?: boolean
    accountLinking?: {
      enabled?: boolean
      trustedProviders?: string[]
      allowDifferentEmails?: boolean
      allowUnlinkingAll?: boolean
      updateUserInfoOnLink?: boolean
    }
    encryptOAuthTokens?: boolean
  }
  verification?: {
    modelName?: string
    disableCleanup?: boolean
  }
  trustedOrigins?: string[]
  rateLimit?: {
    enabled?: boolean
    window?: number
    max?: number
    storage?: string
    modelName?: string
  }
  advanced?: {
    ipAddress?: {
      ipAddressHeaders?: string[]
      disableIpTracking?: boolean
    }
    useSecureCookies?: boolean
    disableCSRFCheck?: boolean
    crossSubDomainCookies?: {
      enabled: boolean
      additionalCookies?: string[]
      domain?: string
    }
    cookies?: Record<string, any>
    defaultCookieAttributes?: any
    cookiePrefix?: string
    database?: {
      defaultFindManyLimit?: number
      useNumberId?: boolean
    }
  }
  logger?: any
  disabledPaths?: string[]
  telemetry?: {
    enabled?: boolean
    debug?: boolean
  }
}

interface SystemInfo {
  studioVersion: string
  nodeVersion: string
  platform: string
  uptime: string
}

interface Plugin {
  id: string
  name: string
  version: string
  description: string
  enabled: boolean
}

interface PluginsResponse {
  plugins: Plugin[]
  configPath: string | null
  totalPlugins: number
  error?: string
}

export default function Settings() {
  const [config, setConfig] = useState<AuthConfig | null>(null)
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [plugins, setPlugins] = useState<PluginsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConfig()
    fetchSystemInfo()
    fetchPlugins()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config')
      const data = await response.json()
      console.log('Config data:', data)
      setConfig(data)
    } catch (error) {
      console.error('Failed to fetch config:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSystemInfo = async () => {
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      setSystemInfo(data.system || {
        studioVersion: 'v1.0.0',
        nodeVersion: process.version,
        platform: navigator.platform,
        uptime: '2h 15m'
      })
    } catch (error) {
      console.error('Failed to fetch system info:', error)
      setSystemInfo({
        studioVersion: 'v1.0.0',
        nodeVersion: 'v18.0.0',
        platform: 'macOS',
        uptime: '2h 15m'
      })
    }
  }

  const fetchPlugins = async () => {
    try {
      const response = await fetch('/api/plugins')
      const data = await response.json()
      setPlugins(data)
    } catch (error) {
      console.error('Failed to fetch plugins:', error)
      setPlugins({
        plugins: [],
        configPath: null,
        totalPlugins: 0,
        error: 'Failed to fetch plugins'
      })
    }
  }

  const getConnectionStatus = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'postgresql':
      case 'postgres':
        return <Badge variant="secondary" className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1"><CheckCircle className="w-3 h-3" />Connected</Badge>
      case 'mysql':
        return <Badge variant="secondary" className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1"><CheckCircle className="w-3 h-3" />Connected</Badge>
      case 'sqlite':
        return <Badge variant="secondary" className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1"><Info className="w-3 h-3" />Local</Badge>
      default:
        return <Badge variant="secondary" className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Unknown</Badge>
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'google':
        return <Globe className="w-5 h-5 text-white" />
      case 'github':
        return <Shield className="w-5 h-5 text-white" />
      case 'discord':
        return <Globe className="w-5 h-5 text-white" />
      case 'twitter':
        return <Globe className="w-5 h-5 text-white" />
      default:
        return <Globe className="w-5 h-5 text-white" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between p-5 pt-7">
        <div>
          <h1 className="text-3xl font-normal text-white tracking-tight">Settings</h1>
          <p className="text-gray-300 mt-2">Configure your Better Auth application</p>
        </div>
        
      </div>
      <hr  className='w-full border-white/15 h-px'/>
      <hr  className='w-full border-white/15 h-px'/>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-5">
        {/* Application Configuration */}
        <Card className="border-white/15 bg-black/70 px-0 sm:px-0 md:px-0 lg:px-0 xl:px-0 rounded-none">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <SettingsIcon className="w-5 h-5 text-white" />
              <span>Application</span>
            </CardTitle>
            <CardDescription>Basic application configuration</CardDescription>
          </CardHeader>
          <hr  className='w-full border-white/15 h-px -mt-3 mb-1'/>
          <CardContent className="space-y-0 px-0 pb-0 border-b-none">
            <div className="flex items-center justify-between p-4 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-medium text-white">App Name</p>
                  <p className="text-xs text-gray-400">Application display name</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {config?.appName || 'Better Auth'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Key className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-medium text-white">Base URL</p>
                  <p className="text-xs text-gray-400">Application base URL</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {config?.baseURL || 'http://localhost:3000'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Lock className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-medium text-white">Base Path</p>
                  <p className="text-xs text-gray-400">Auth API base path</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {config?.basePath || '/api/auth'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-medium text-white">Secret</p>
                  <p className="text-xs text-gray-400">Encryption secret</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {config?.secret ? 'Configured' : 'Not set'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Configuration */}
        <Card className="border-white/15 bg-black/70 px-0 sm:px-0 md:px-0 lg:px-0 xl:px-0 rounded-none">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Database className="w-5 h-5 text-white" />
              <span>Database</span>
            </CardTitle>
            <CardDescription>Database connection and configuration</CardDescription>
          </CardHeader>
          <hr  className='w-full border-white/15 h-px -mt-3 mb-1'/>
          <CardContent className="space-y-0 px-0 pb-0 border-b-none">
            <div className="flex items-center justify-between p-4 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Database className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-medium text-white">
                    {config?.database?.type && config?.database?.type.charAt(0).toUpperCase() + config?.database?.type.slice(1) || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-400">Database Type</p>
                </div>
              </div>
              {config?.database?.type && getConnectionStatus(config.database.type)}
            </div>

            {config?.database?.dialect && (
              <div className="flex items-center justify-between p-4 px-5 border-b border-white/15">
                <div className="flex items-center space-x-3">
                  <Database className="w-5 h-5 text-white" />
                  <div>
                    <p className="text-sm font-medium text-white">Dialect</p>
                    <p className="text-xs text-gray-400">Database dialect</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    {config.database.dialect}
                  </p>
                </div>
              </div>
            )}

            {config?.database?.casing && (
              <div className="flex items-center justify-between p-4 px-5 border-b border-white/15">
                <div className="flex items-center space-x-3">
                  <SettingsIcon className="w-5 h-5 text-white" />
                  <div>
                    <p className="text-sm font-medium text-white">Casing</p>
                    <p className="text-xs text-gray-400">Table name casing</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white capitalize">
                    {config.database.casing}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between p-4 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <RefreshCw className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-medium text-white">Debug Logs</p>
                  <p className="text-xs text-gray-400">Database debug logging</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1">
                {config?.database?.debugLogs ? (
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

        {/* Authentication Providers */}
        <Card className="border-white/15 bg-black rounded-none">
          <CardHeader className="border-b border-white/15">
            <CardTitle className="text-white flex items-center space-x-2">
              <Shield className="w-5 h-5 text-white" />
              <span>Providers</span>
            </CardTitle>
            <CardDescription>Configured authentication providers</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {config?.socialProviders && config.socialProviders.length > 0 ? (
              config.socialProviders.map((provider, index) => (
                <div key={index} className="flex items-center justify-between p-4 px-5 border-b border-white/15 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    {getProviderIcon(provider.type)}
                    <div>
                      <p className="text-sm font-medium text-white capitalize">{provider.type}</p>
                      <p className="text-xs text-gray-400">
                        {provider.clientId ? 'Configured' : 'Not configured'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1">
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
        <Card className="border-white/15 bg-black rounded-none">
          <CardHeader className="border-b border-white/15">
            <CardTitle className="text-white flex items-center space-x-2">
              <Mail className="w-5 h-5 text-white" />
              <span>Email & Password</span>
            </CardTitle>
            <CardDescription>Email authentication settings</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-medium text-white">Email Authentication</p>
                  <p className="text-xs text-gray-400">Allow users to sign up with email</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1">
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
                <div className="flex items-center justify-between p-4 px-5 border-b border-white/15">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-white" />
                    <div>
                      <p className="text-sm font-medium text-white">Sign Up</p>
                      <p className="text-xs text-gray-400">Allow new user registration</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1">
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

                <div className="flex items-center justify-between p-4 px-5 border-b border-white/15">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-white" />
                    <div>
                      <p className="text-sm font-medium text-white">Email Verification</p>
                      <p className="text-xs text-gray-400">Require email verification</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1">
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

                <div className="flex items-center justify-between p-4 px-5 border-b border-white/15">
                  <div className="flex items-center space-x-3">
                    <Lock className="w-5 h-5 text-white" />
                    <div>
                      <p className="text-sm font-medium text-white">Password Length</p>
                      <p className="text-xs text-gray-400">Min/Max password length</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">
                      {config?.emailAndPassword?.minPasswordLength || 8} - {config?.emailAndPassword?.maxPasswordLength || 128}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 px-5 border-b border-white/15 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <Zap className="w-5 h-5 text-white" />
                    <div>
                      <p className="text-sm font-medium text-white">Auto Sign In</p>
                      <p className="text-xs text-gray-400">Auto sign in after registration</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1">
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
        <Card className="border-white/15 bg-black rounded-none">
          <CardHeader className="border-b border-white/15">
            <CardTitle className="text-white flex items-center space-x-2">
              <Clock className="w-5 h-5 text-white" />
              <span>Session</span>
            </CardTitle>
            <CardDescription>Session management settings</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-medium text-white">Session Duration</p>
                  <p className="text-xs text-gray-400">How long sessions last</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {config?.session?.expiresIn ? `${Math.floor(config.session.expiresIn / (60 * 60 * 24))} days` : '7 days'}
                </p>
                <p className="text-xs text-gray-400">Default</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <RefreshCw className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-medium text-white">Update Age</p>
                  <p className="text-xs text-gray-400">Session refresh interval</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {config?.session?.updateAge ? `${Math.floor(config.session.updateAge / (60 * 60))} hours` : '24 hours'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Zap className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-medium text-white">Session Refresh</p>
                  <p className="text-xs text-gray-400">Auto refresh sessions</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1">
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
                  <p className="text-sm font-medium text-white">Store in Database</p>
                  <p className="text-xs text-gray-400">Store sessions in database</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1">
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
        <Card className="border-white/15 bg-black rounded-none">
          <CardHeader className="border-b border-white/15">
            <CardTitle className="text-white flex items-center space-x-2">
              <Shield className="w-5 h-5 text-white" />
              <span>Rate Limiting</span>
            </CardTitle>
            <CardDescription>API rate limiting configuration</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-medium text-white">Rate Limiting</p>
                  <p className="text-xs text-gray-400">Enable rate limiting</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1">
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

            <div className="flex items-center justify-between p-4 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-sm font-medium text-white">Rate Limit Window</p>
                  <p className="text-xs text-gray-400">Time window for rate limiting</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {config?.rateLimit?.window ? `${config.rateLimit.window} seconds` : '10 seconds'}
                </p>
                <p className="text-xs text-gray-400">Window</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-medium text-white">Max Requests</p>
                  <p className="text-xs text-gray-400">Maximum requests per window</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {config?.rateLimit?.max || 100}
                </p>
                <p className="text-xs text-gray-400">Requests</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 px-5 border-b border-white/15 last:border-b-0">
              <div className="flex items-center space-x-3">
                <Database className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-medium text-white">Storage</p>
                  <p className="text-xs text-gray-400">Rate limit storage type</p>
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
        <Card className="border-white/15 bg-black rounded-none">
          <CardHeader className="border-b border-white/15">
            <CardTitle className="text-white flex items-center space-x-2">
              <SettingsIcon className="w-5 h-5 text-white" />
              <span>Advanced</span>
            </CardTitle>
            <CardDescription>Advanced configuration options</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Lock className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-medium text-white">Secure Cookies</p>
                  <p className="text-xs text-gray-400">Use secure cookies</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1">
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

            <div className="flex items-center justify-between p-4 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-medium text-white">CSRF Check</p>
                  <p className="text-xs text-gray-400">CSRF protection</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1">
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

            <div className="flex items-center justify-between p-4 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Eye className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-medium text-white">IP Tracking</p>
                  <p className="text-xs text-gray-400">Track IP addresses</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1">
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
                  <p className="text-sm font-medium text-white">Telemetry</p>
                  <p className="text-xs text-gray-400">Usage analytics</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs group-hover:bg-white group-hover:border-black group-hover:text-black bg-black/70 border border-white/15 rounded-none border-dashed flex items-center gap-1">
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
        <Card className="border-white/15 bg-black rounded-none">
          <CardHeader className="border-b border-white/15">
            <CardTitle className="text-white flex items-center space-x-2">
              <Info className="w-5 h-5 text-white" />
              <span>System Info</span>
            </CardTitle>
            <CardDescription>Better Auth Studio system information</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Zap className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-medium text-white">Studio Version</p>
                  <p className="text-xs text-gray-400">Better Auth Studio</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {systemInfo?.studioVersion || 'v1.0.0'}
                </p>
                <p className="text-xs text-gray-400">Latest</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Info className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-medium text-white">Node.js Version</p>
                  <p className="text-xs text-gray-400">Runtime environment</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {systemInfo?.nodeVersion || 'v18.0.0'}
                </p>
                <p className="text-xs text-gray-400">Current</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 px-5 border-b border-white/15">
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-medium text-white">Platform</p>
                  <p className="text-xs text-gray-400">Operating system</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {systemInfo?.platform || 'macOS'}
                </p>
                <p className="text-xs text-gray-400">System</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 px-5 border-b border-white/15 last:border-b-0">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm font-medium text-white">Uptime</p>
                  <p className="text-xs text-gray-400">Service uptime</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {systemInfo?.uptime || '2h 15m'}
                </p>
                <p className="text-xs text-gray-400">Running</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plugins Configuration */}
        <Card className="border-white/15 bg-black/70 px-0 sm:px-0 md:px-0 lg:px-0 xl:px-0 rounded-none lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Puzzle className="w-5 h-5 text-white" />
              <span>Plugins</span>
            </CardTitle>
            <CardDescription>Better Auth plugins enabled in your configuration</CardDescription>
          </CardHeader>
          <hr className='w-full border-white/15 h-px -mt-3 mb-1'/>
          <CardContent className="space-y-0 px-0 pb-0 border-b-none">
            {plugins?.plugins && plugins.plugins.length > 0 ? (
              <>
                <div className="flex items-center justify-between p-4 px-5 border-b border-white/15">
                  <div className="flex items-center space-x-3">
                    <Info className="w-5 h-5 text-white" />
                    <div>
                      <p className="text-sm font-medium text-white">Total Plugins</p>
                      <p className="text-xs text-gray-400">Currently enabled plugins</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{plugins.totalPlugins}</p>
                    <p className="text-xs text-gray-400">Active</p>
                  </div>
                </div>
                
                {plugins.plugins.map((plugin, index) => (
                  <div key={plugin.id} className={`flex items-center justify-between p-4 px-5 ${index < plugins.plugins.length - 1 ? 'border-b border-white/15' : ''}`}>
                    <div className="flex items-center space-x-3">
                      <Puzzle className="w-5 h-5 text-white" />
                      <div>
                        <p className="text-sm font-medium text-white">{plugin.name}</p>
                        <p className="text-xs text-gray-400">{plugin.description}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs bg-green-900/50 border border-dashed rounded-none border-green-500/30 text-green-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Enabled
                      </Badge>
                    </div>
                  </div>
                ))}
                
                {plugins.configPath && (
                  <div className="p-4 px-5 bg-black/30 border-t border-white/10">
                    <p className="text-xs text-gray-400">
                      Config file: <span className="text-white font-mono">{plugins.configPath}</span>
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
                      {plugins?.error || 'No plugins are currently configured in your Better Auth setup'}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs bg-yellow-900/50 border border-yellow-500/30 text-yellow-400 rounded-sm">
                  None
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
