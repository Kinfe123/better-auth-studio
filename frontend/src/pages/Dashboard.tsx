import { useState } from 'react'
import { 
  TrendingUp, 
  ChevronDown,
  Users,
  Building2,
  Database,
  Settings,
  CheckCircle,
  AlertCircle,
  ChevronUp,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import UsersPage from './Users'

interface LogEntry {
  id: string
  timestamp: string
  type: 'info' | 'success' | 'error' | 'warning'
  message: string
  payload?: any
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [seedingStatus, setSeedingStatus] = useState<Record<string, 'idle' | 'seeding' | 'success' | 'error'>>({
    users: 'idle',
    organizations: 'idle',
    sessions: 'idle',
    verifications: 'idle',
    accounts: 'idle'
  })
  const [showTerminal, setShowTerminal] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [seedCount, setSeedCount] = useState({
    users: 10,
    organizations: 5,
    sessions: 20,
    verifications: 15,
    accounts: 8
  })



  const addLog = (type: LogEntry['type'], message: string, payload?: any) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      payload
    }
    setLogs(prev => [...prev, newLog])
  }

  const handleSeedData = async (type: string) => {
    console.log({type})
    setSeedingStatus(prev => ({ ...prev, [type]: 'seeding' }))
    
    const count = seedCount[type as keyof typeof seedCount] || 10
    
    addLog('info', `Starting ${type} seeding...`, { type, count })
    
    try {
      addLog('info', `Sending request to /api/seed/${type}`, { type, count })
      
      const response = await fetch(`/api/seed/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        addLog('info', `Processing ${count} ${type}...`)
        
        // Log each created item individually
        if (result.results && Array.isArray(result.results)) {
          for (let i = 0; i < result.results.length; i++) {
            const item = result.results[i]
            if (item.success) {
              if (type === 'users' && item.user) {
                addLog('info', `Created user ${i + 1}/${count}: ${item.user.name} (${item.user.email})`, {
                  message: `user with this email registered`,
                  email: item.user.email,
                  name: item.user.name,
                  id: item.user.id
                })
              } else if (type === 'organizations' && item.organization) {
                addLog('info', `Created organization ${i + 1}/${count}: ${item.organization.name}`, {
                  organization: {
                    id: item.organization.id,
                    name: item.organization.name,
                    slug: item.organization.slug,
                    createdAt: item.organization.createdAt
                  }
                })
              } else if (type === 'sessions' && item.session) {
                addLog('info', `Created session ${i + 1}/${count}: ${item.session.sessionToken.substring(0, 8)}...`, {
                  session: {
                    id: item.session.id,
                    userId: item.session.userId,
                    expires: item.session.expires,
                    createdAt: item.session.createdAt
                  }
                })
              } else if (type === 'accounts' && item.account) {
                addLog('info', `Created account ${i + 1}/${count}: ${item.account.provider} (${item.account.providerAccountId})`, {
                  account: {
                    id: item.account.id,
                    userId: item.account.userId,
                    provider: item.account.provider,
                    type: item.account.type,
                    createdAt: item.account.createdAt
                  }
                })
              } else if (type === 'verifications' && item.verification) {
                addLog('info', `Created verification ${i + 1}/${count}: ${item.verification.identifier}`, {
                  verification: {
                    id: item.verification.id,
                    identifier: item.verification.identifier,
                    token: item.verification.token.substring(0, 8) + '...',
                    expires: item.verification.expires,
                    createdAt: item.verification.createdAt
                  }
                })
              }
            } else {
              addLog('error', `Failed to create ${type} ${i + 1}: ${item.error}`)
            }
            await new Promise(resolve => setTimeout(resolve, 100)) // Small delay between items
          }
        }
        
        addLog('success', `Successfully seeded ${result.results?.filter((r: any) => r.success).length || count} ${type}`, {
          totalCreated: result.results?.filter((r: any) => r.success).length || count,
          message: result.message
        })
        
        setSeedingStatus(prev => ({ ...prev, [type]: 'success' }))
        setTimeout(() => setSeedingStatus(prev => ({ ...prev, [type]: 'idle' })), 3000)
      } else {
        throw new Error(result.error || 'Unknown error')
      }
    } catch (error) {
      console.error(`Error seeding ${type}:`, error)
      addLog('error', `Failed to seed ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setSeedingStatus(prev => ({ ...prev, [type]: 'error' }))
      setTimeout(() => setSeedingStatus(prev => ({ ...prev, [type]: 'idle' })), 3000)
    }
  }

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-3 h-3 text-green-400" />
      case 'error': return <AlertCircle className="w-3 h-3 text-red-400" />
      case 'warning': return <AlertCircle className="w-3 h-3 text-yellow-400" />
      default: return <div className="w-3 h-3 bg-blue-400 rounded-full" />
    }
  }

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-green-400'
      case 'error': return 'text-red-400'
      case 'warning': return 'text-yellow-400'
      default: return 'text-blue-400'
    }
  }

  const renderOverview = () => (
    <>
      {/* Welcome Message */}
      <div className="px-6 pt-8">
        <h1 className="text-xl text-white font-normal">Better Auth Studio</h1>
        <p className="text-sm text-gray-400 mt-1 font-light">Manage your authentication data and configuration</p>
      </div>

      {/* Studio Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-6 py-8">
        {/* Users Management */}
        <Card className="border border-dashed border-white/20 bg-black/30 rounded-none hover:bg-black/50 transition-colors">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/10 rounded-none">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-base font-normal">Users</CardTitle>
                <CardDescription className="text-gray-400 text-xs font-light">Manage user accounts</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-xs text-gray-300 font-light">
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                <span>View all users</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                <span>Create new users</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                <span>Edit user details</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                <span>Delete users</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4 w-full border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
              onClick={() => setActiveTab('users')}
            >
              Manage Users
            </Button>
          </CardContent>
        </Card>

        {/* Sessions Management */}
        <Card className="border border-dashed border-white/20 bg-black/30 rounded-none hover:bg-black/50 transition-colors">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/10 rounded-none">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-base font-normal">Sessions</CardTitle>
                <CardDescription className="text-gray-400 text-xs font-light">Manage user sessions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-xs text-gray-300 font-light">
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                <span>View active sessions</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                <span>Revoke sessions</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                <span>Session analytics</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4 w-full border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
              onClick={() => setActiveTab('sessions')}
            >
              View Sessions
            </Button>
          </CardContent>
        </Card>

        {/* Data Seeding */}
        <Card className="border border-dashed border-white/20 bg-black/30 rounded-none hover:bg-black/50 transition-colors">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/10 rounded-none">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-base font-normal">Seed Data</CardTitle>
                <CardDescription className="text-gray-400 text-xs font-light">Generate test data</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-xs text-gray-300 font-light">
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                <span>Create mock users</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                <span>Generate sessions</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                <span>Add organizations</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                <span>Create verifications</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4 w-full border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
              onClick={() => setActiveTab('seed')}
            >
              Seed Data
            </Button>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card className="border border-dashed border-white/20 bg-black/30 rounded-none hover:bg-black/50 transition-colors">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/10 rounded-none">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-base font-normal">Configuration</CardTitle>
                <CardDescription className="text-gray-400 text-xs font-light">View auth settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-xs text-gray-300 font-light">
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                <span>Database settings</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                <span>Provider configuration</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                <span>Session settings</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                <span>Security options</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4 w-full border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
              onClick={() => setActiveTab('settings')}
            >
              View Config
            </Button>
          </CardContent>
        </Card>

        {/* Analytics */}
        <Card className="border border-dashed border-white/20 bg-black/30 rounded-none hover:bg-black/50 transition-colors">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/10 rounded-none">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-base font-normal">Analytics</CardTitle>
                <CardDescription className="text-gray-400 text-xs font-light">View usage statistics</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-xs text-gray-300 font-light">
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                <span>User growth</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                <span>Session activity</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                <span>Provider usage</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                <span>Performance metrics</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4 w-full border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
            >
              View Analytics
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border border-dashed border-white/20 bg-black/30 rounded-none hover:bg-black/50 transition-colors">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/10 rounded-none">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-base font-normal">Quick Actions</CardTitle>
                <CardDescription className="text-gray-400 text-xs font-light">Common tasks</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-xs text-gray-300 font-light">
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                <span>Health check</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                <span>Database backup</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                <span>Clear cache</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                <span>Export data</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4 w-full border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
            >
              Quick Actions
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  )

  const renderSeedData = () => (
    <div className="space-y-6 mx-10 py-2">
      {/* Configuration Status */}
      <Card className="rounded-none bg-transparent border border-dashed">
        <CardHeader>
          <CardTitle className="text-lg font-light">Configuration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border border-dashed rounded-none">
              <span className="text-sm text-white font-light">Database Connected</span>
              <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400 border-green-500/30 rounded-none">
                Connected
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border border-dashed rounded-none">
              <span className="text-sm text-white font-light">Config</span>
              <Badge variant="secondary" className="text-xs bg-white/10 text-white border-white/20 rounded-none">
               Approved 
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seed Options */}
      <div className="grid grid-cols-2 gap-4">

        {/* Users */}
        <div className="space-y-3 border border-dashed rounded-none">
          <div className="flex justify-between gap-4 items-center p-3 bg-white/5 rounded-none">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-white" />
              <span className="text-sm text-white font-light">Users</span>
            </div>
            <input
              type="number"
              value={seedCount.users}
              onChange={(e) => setSeedCount({...seedCount, users: parseInt(e.target.value) || 0})}
              className="w-20 bg-white/10 border border-white/20 text-white text-sm px-2 py-1 rounded-none font-light"
              placeholder="Count"
              min="1"
              max="100"
            />
          </div>
          <div className="flex justify-end pr-3">
            <Button
              onClick={() => handleSeedData('users')}
              disabled={seedingStatus.users === 'seeding'}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-light text-sm px-4"
            >
              {seedingStatus.users === 'seeding' ? 'Seeding...' : 'Seed'}
            </Button>
          </div>
          <div className="bg-black border border-white/10 rounded-none p-3 font-mono text-xs">
            <div className="flex items-center justify-between ">
              <div className="text-green-400">$ seed users {seedCount.users}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTerminal(!showTerminal)}
                className="text-gray-400 hover:text-white p-0 h-auto font-light"
              >
                {showTerminal ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
            {showTerminal && (
              <div>
                {logs.filter(log => log.message.includes('users')).slice(-1).map((log) => (
                  <div key={log.id} className="flex items-center space-x-2">
                    <span className="text-gray-500">[{log.timestamp}]</span>
                    {getLogIcon(log.type)}
                    <span className={`font-light ${getLogColor(log.type)}`}>{log.message}</span>
                    {log.payload && (
                      <span className="text-gray-400 ml-2">- {log.payload.message}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-3 border border-dashed rounded-none">
          <div className="flex justify-between gap-4 items-center p-3 bg-white/5 rounded-none">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-white" />
              <span className="text-sm text-white font-light">Organizations</span>
            </div>
            <input
              type="number"
              value={seedCount.organizations}
              onChange={(e) => setSeedCount({ ...seedCount, organizations: parseInt(e.target.value) || 0 })}
              className="w-20 bg-white/10 flex justify-end border border-white/20 text-white text-sm px-2 py-1 rounded-none font-light"
              placeholder="Count"
              min="1"
              max="100"
            />
          </div>
          <div className="flex justify-end pr-3">
            <Button
              onClick={() => handleSeedData('organizations')}
              disabled={seedingStatus.organizations === 'seeding'}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-light text-sm px-4"
            >
              {seedingStatus.organizations === 'seeding' ? 'Seeding...' : 'Seed'}
            </Button>
          </div>
          <div className="bg-black border border-white/10 rounded-none p-3 font-mono text-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="text-green-400">$ seed organizations {seedCount.organizations}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTerminal(!showTerminal)}
                className="text-gray-400 hover:text-white p-0 h-auto font-light"
              >
                {showTerminal ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
            {showTerminal && (
              <div>
                {logs.filter(log => log.message.includes('organizations')).slice(-1).map((log) => (
                  <div key={log.id} className="flex items-center space-x-2">
                    <span className="text-gray-500">[{log.timestamp}]</span>
                    {getLogIcon(log.type)}
                    <span className={`font-light ${getLogColor(log.type)}`}>{log.message}</span>
                    {log.payload && (
                      <span className="text-gray-400 ml-2">- {log.payload.message}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Organizations */}
        <div className="space-y-3 border border-dashed rounded-none">
          <div className="flex justify-between gap-4 items-center p-3 bg-white/5 rounded-none">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-white" />
              <span className="text-sm text-white font-light">Organizations</span>
            </div>
            <input
              type="number"
              value={seedCount.organizations}
              onChange={(e) => setSeedCount({...seedCount, organizations: parseInt(e.target.value) || 0})}
              className="w-20 bg-white/10 flex justify-end border border-white/20 text-white text-sm px-2 py-1 rounded-none font-light"
              placeholder="Count"
              min="1"
              max="100"
            />
          </div>
          <div className="flex justify-end pr-3">
            <Button
              onClick={() => handleSeedData('organizations')}
              disabled={seedingStatus.organizations === 'seeding'}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-light text-sm px-4"
            >
              {seedingStatus.organizations === 'seeding' ? 'Seeding...' : 'Seed'}
            </Button>
          </div>
          <div className="bg-black border border-white/10 rounded-none p-3 font-mono text-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="text-green-400">$ seed organizations {seedCount.organizations}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTerminal(!showTerminal)}
                className="text-gray-400 hover:text-white p-0 h-auto font-light"
              >
                {showTerminal ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
            {showTerminal && (
              <div>
                {logs.filter(log => log.message.includes('organizations')).slice(-1).map((log) => (
                  <div key={log.id} className="flex items-center space-x-2">
                    <span className="text-gray-500">[{log.timestamp}]</span>
                    {getLogIcon(log.type)}
                    <span className={`font-light ${getLogColor(log.type)}`}>{log.message}</span>
                    {log.payload && (
                      <span className="text-gray-400 ml-2">- {log.payload.message}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sessions */}
        <div className="space-y-3 border border-dashed rounded-none">
          <div className="flex justify-between gap-4 items-center p-3 bg-white/5 rounded-none">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-white" />
              <span className="text-sm text-white font-light">Sessions</span>
            </div>
            <input
              type="number"
              value={seedCount.sessions}
              onChange={(e) => setSeedCount({...seedCount, sessions: parseInt(e.target.value) || 0})}
              className="w-20 bg-white/10 flex justify-end border border-white/20 text-white text-sm px-2 py-1 rounded-none font-light"
              placeholder="Count"
              min="1"
              max="100"
            />
          </div>
          <div className="flex justify-end pr-3">
            <Button
              onClick={() => handleSeedData('sessions')}
              disabled={seedingStatus.sessions === 'seeding'}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-light text-sm px-4"
            >
              {seedingStatus.sessions === 'seeding' ? 'Seeding...' : 'Seed'}
            </Button>
          </div>
          <div className="bg-black border border-white/10 rounded-none p-3 font-mono text-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="text-green-400">$ seed sessions {seedCount.sessions}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTerminal(!showTerminal)}
                className="text-gray-400 hover:text-white p-0 h-auto font-light"
              >
                {showTerminal ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
            {showTerminal && (
              <div>
                {logs.filter(log => log.message.includes('sessions')).slice(-1).map((log) => (
                  <div key={log.id} className="flex items-center space-x-2">
                    <span className="text-gray-500">[{log.timestamp}]</span>
                    {getLogIcon(log.type)}
                    <span className={`font-light ${getLogColor(log.type)}`}>{log.message}</span>
                    {log.payload && (
                      <span className="text-gray-400 ml-2">- {log.payload.message}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Verifications */}
        <div className="space-y-3 border border-dashed rounded-none">
          <div className="flex justify-between gap-4 items-center p-3 bg-white/5 rounded-none">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-white" />
              <span className="text-sm text-white font-light">Verifications</span>
            </div>
            <input
              type="number"
              value={seedCount.verifications}
              onChange={(e) => setSeedCount({...seedCount, verifications: parseInt(e.target.value) || 0})}
              className="w-20 bg-white/10 flex justify-end border border-white/20 text-white text-sm px-2 py-1 rounded-none font-light"
              placeholder="Count"
              min="1"
              max="100"
            />
          </div>
          <div className="flex justify-end pr-3">
            <Button
              onClick={() => handleSeedData('verifications')}
              disabled={seedingStatus.verifications === 'seeding'}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-light text-sm px-4"
            >
              {seedingStatus.verifications === 'seeding' ? 'Seeding...' : 'Seed'}
            </Button>
          </div>
          <div className="bg-black border border-white/10 rounded-none p-3 font-mono text-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="text-green-400">$ seed verifications {seedCount.verifications}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTerminal(!showTerminal)}
                className="text-gray-400 hover:text-white p-0 h-auto font-light"
              >
                {showTerminal ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
            {showTerminal && (
              <div>
                {logs.filter(log => log.message.includes('verifications')).slice(-1).map((log) => (
                  <div key={log.id} className="flex items-center space-x-2">
                    <span className="text-gray-500">[{log.timestamp}]</span>
                    {getLogIcon(log.type)}
                    <span className={`font-light ${getLogColor(log.type)}`}>{log.message}</span>
                    {log.payload && (
                      <span className="text-gray-400 ml-2">- {log.payload.message}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Accounts */}
        <div className="space-y-3 border border-dashed rounded-none">
          <div className="flex justify-between gap-4 items-center p-3 bg-white/5 rounded-none">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-white" />
              <span className="text-sm text-white font-light">Accounts</span>
            </div>
            <input
              type="number"
              value={seedCount.accounts}
              onChange={(e) => setSeedCount({...seedCount, accounts: parseInt(e.target.value) || 0})}
              className="w-20 bg-white/10 flex justify-end border border-white/20 text-white text-sm px-2 py-1 rounded-none font-light"
              placeholder="Count"
              min="1"
              max="100"
            />
          </div>
          <div className="flex justify-end pr-3">
            <Button
              onClick={() => handleSeedData('accounts')}
              disabled={seedingStatus.accounts === 'seeding'}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-light text-sm px-4"
            >
              {seedingStatus.accounts === 'seeding' ? 'Seeding...' : 'Seed'}
            </Button>
          </div>
          <div className="bg-black border border-white/10 rounded-none p-3 font-mono text-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="text-green-400">$ seed accounts {seedCount.accounts}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTerminal(!showTerminal)}
                className="text-gray-400 hover:text-white p-0 h-auto font-light"
              >
                {showTerminal ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
            {showTerminal && (
              <div>
                {logs.filter(log => log.message.includes('accounts')).slice(-1).map((log) => (
                  <div key={log.id} className="flex items-center space-x-2">
                    <span className="text-gray-500">[{log.timestamp}]</span>
                    {getLogIcon(log.type)}
                    <span className={`font-light ${getLogColor(log.type)}`}>{log.message}</span>
                    {log.payload && (
                      <span className="text-gray-400 ml-2">- {log.payload.message}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-white/10 pt-3 px-4">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-1 border-b-2 font-light text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-white text-white'
                : 'border-transparent text-white/60 hover:text-white/80'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-1 border-b-2 font-light text-sm transition-colors ${
              activeTab === 'users'
                ? 'border-white text-white'
                : 'border-transparent text-white/60 hover:text-white/80'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('seed')}
            className={`pb-3 px-1 border-b-2 font-light text-sm transition-colors ${
              activeTab === 'seed'
                ? 'border-white text-white'
                : 'border-transparent text-white/60 hover:text-white/80'
            }`}
          >
            Seed Data
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' ? renderOverview() : 
       activeTab === 'users' ? <UsersPage /> : 
       renderSeedData()}
    </div>
  )
}
