import { useState } from 'react'
import { 
  TrendingUp, 
  TrendingDown,
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

interface LogEntry {
  id: string
  timestamp: string
  type: 'info' | 'success' | 'error' | 'warning'
  message: string
  payload?: any
}

export default function Dashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('1Y')
  const [selectedPeriod, _ ] = useState('Daily')
  const [activeTab, setActiveTab] = useState('overview')
  const [seedingStatus, setSeedingStatus] = useState<'idle' | 'seeding' | 'success' | 'error'>('idle')
  const [showTerminal, setShowTerminal] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [seedCount, setSeedCount] = useState({
    users: 10,
    organizations: 5,
    sessions: 20,
    verifications: 15,
    accounts: 8
  })

  const timeRanges = ['ALL', '1M', '3M', '6M', '1Y']

  const newUsers = [
    {
      time: '10:12 AM',
      name: 'Bereket Engida',
      method: 'OAuth',
      device: 'Mobile/Safari'
    },
    {
      time: '10:12 AM',
      name: 'Jhon Doe',
      method: 'Email',
      device: 'Desktop/Chrome'
    },
    {
      time: '10:12 AM',
      name: 'Kinfe Tariky',
      method: 'Passkey',
      device: 'Mobile/Chrome'
    },
    {
      time: '10:12 AM',
      name: 'Bereket Engida',
      method: 'OAuth',
      device: 'Mobile/Safari'
    },
    {
      time: '10:12 AM',
      name: 'Jhon Doe',
      method: 'Email',
      device: 'Desktop/Chrome'
    }
  ]

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
    setSeedingStatus('seeding')
    
    const count = seedCount[type as keyof typeof seedCount] || 10
    
    if (type === 'users') {
      // Generate detailed user data
      const users = Array.from({ length: count }, (_, i) => ({
        id: `user_${Date.now()}_${i}`,
        email: `user${i + 1}@example.com`,
        name: `User ${i + 1}`,
        method: i % 3 === 0 ? 'email' : i % 3 === 1 ? 'github' : 'passkey',
        verified: i % 2 === 0,
        createdAt: new Date().toISOString(),
        lastLogin: new Date(Date.now() - Math.random() * 86400000).toISOString()
      }))
      
      const payload = {
        type,
        count,
        users,
        timestamp: new Date().toISOString()
      }
      
      addLog('info', `Starting ${type} seeding...`, payload)
      
      try {
        // Simulate API call with progress updates
        addLog('info', `Sending request to /api/seed/${type}`, payload)
        
        await new Promise(resolve => setTimeout(resolve, 1000))
        addLog('info', `Processing ${count} ${type}...`)
        
        // Log each user individually
        for (let i = 0; i < users.length; i++) {
          const user = users[i]
          addLog('info', `Created user ${i + 1}/${count}: ${user.name} (${user.email})`, {
            message: `user with this email registered`,
            email: user.email
          })
          await new Promise(resolve => setTimeout(resolve, 200)) // Small delay between users
        }
        
        addLog('success', `Successfully seeded ${count} ${type}`, {
          totalCreated: count,
          users: users.map(u => ({ id: u.id, email: u.email, name: u.name }))
        })
        
        setSeedingStatus('success')
        setTimeout(() => setSeedingStatus('idle'), 3000)
      } catch (error) {
        addLog('error', `Failed to seed ${type}: ${error}`)
        setSeedingStatus('error')
        setTimeout(() => setSeedingStatus('idle'), 3000)
      }
    } else if (type === 'organizations') {
      // Generate detailed organization data
      const organizations = Array.from({ length: count }, (_, i) => ({
        id: `org_${Date.now()}_${i}`,
        name: `Organization ${i + 1}`,
        slug: `org-${i + 1}`,
        members: Math.floor(Math.random() * 10) + 1,
        createdAt: new Date().toISOString(),
        plan: i % 3 === 0 ? 'free' : i % 3 === 1 ? 'pro' : 'enterprise'
      }))
      
      const payload = {
        type,
        count,
        organizations,
        timestamp: new Date().toISOString()
      }
      
      addLog('info', `Starting ${type} seeding...`, payload)
      
      try {
        addLog('info', `Sending request to /api/seed/${type}`, payload)
        
        await new Promise(resolve => setTimeout(resolve, 1000))
        addLog('info', `Processing ${count} ${type}...`)
        
        // Log each organization individually
        for (let i = 0; i < organizations.length; i++) {
          const org = organizations[i]
          addLog('info', `Created organization ${i + 1}/${count}: ${org.name} (${org.members} members)`, {
            organization: {
              id: org.id,
              name: org.name,
              slug: org.slug,
              members: org.members,
              plan: org.plan,
              createdAt: org.createdAt
            }
          })
          await new Promise(resolve => setTimeout(resolve, 200))
        }
        
        addLog('success', `Successfully seeded ${count} ${type}`, {
          totalCreated: count,
          organizations: organizations.map(o => ({ id: o.id, name: o.name, members: o.members }))
        })
        
        setSeedingStatus('success')
        setTimeout(() => setSeedingStatus('idle'), 3000)
      } catch (error) {
        addLog('error', `Failed to seed ${type}: ${error}`)
        setSeedingStatus('error')
        setTimeout(() => setSeedingStatus('idle'), 3000)
      }
    } else {
      // For other types, use the original simple approach
      const payload = {
        type,
        count,
        timestamp: new Date().toISOString()
      }
      
      addLog('info', `Starting ${type} seeding...`, payload)
      
      try {
        addLog('info', `Sending request to /api/seed/${type}`, payload)
        
        await new Promise(resolve => setTimeout(resolve, 1000))
        addLog('info', `Processing ${count} ${type}...`)
        
        await new Promise(resolve => setTimeout(resolve, 1000))
        addLog('success', `Successfully seeded ${count} ${type}`)
        
        setSeedingStatus('success')
        setTimeout(() => setSeedingStatus('idle'), 3000)
      } catch (error) {
        addLog('error', `Failed to seed ${type}: ${error}`)
        setSeedingStatus('error')
        setTimeout(() => setSeedingStatus('idle'), 3000)
      }
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
        <h1 className="text-xl text-white font-normal">Welcome Back, Bereket</h1>
        <p className="text-sm text-gray-400 mt-1 font-light">Mar 18 Tue, 12:57 AM</p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-6">
        {/* Total Users Card */}
        <Card className="border-white/10 bg-black/50 rounded-none">
          <CardHeader className="pb-6">
            <CardTitle className="text-white text-xl font-normal">10.2k</CardTitle>
            <CardDescription className="text-gray-300 text-xs font-light uppercase tracking-wide">Total User</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Time Range Selector */}
            <div className="flex space-x-1 mb-6">
              {timeRanges.map((range) => (
                <Button
                  key={range}
                  variant={selectedTimeRange === range ? "default" : "ghost"}
                  size="sm"
                  className={`text-xs px-3 py-1.5 h-7 font-light ${
                    selectedTimeRange === range 
                      ? 'bg-white/10 text-white border border-white/20' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  onClick={() => setSelectedTimeRange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>
            
            {/* Chart Placeholder */}
            <div className="h-28 bg-white/5 rounded-none flex items-end justify-between px-3 pb-3">
              {[23, 45, 32, 67, 89, 54].map((height, index) => (
                <div
                  key={index}
                  className="bg-white/20 w-6 rounded-none transition-all duration-300 hover:bg-white/30"
                  style={{ height: `${height}%` }}
                ></div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-3 font-light">
              <span>23 Oct</span>
              <span>28 Oct</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Subscription Card */}
        <Card className="border-white/10 bg-black/50 rounded-none">
          <CardHeader className="pb-6">
            <CardTitle className="text-white text-xl font-normal">$1243.22</CardTitle>
            <CardDescription className="text-gray-300 text-xs font-light uppercase tracking-wide">Total Subscription</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Time Range Selector */}
            <div className="flex space-x-1 mb-6">
              {timeRanges.map((range) => (
                <Button
                  key={range}
                  variant={selectedTimeRange === range ? "default" : "ghost"}
                  size="sm"
                  className={`text-xs px-3 py-1.5 h-7 font-light ${
                    selectedTimeRange === range 
                      ? 'bg-white/10 text-white border border-white/20' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  onClick={() => setSelectedTimeRange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>
            
            {/* Chart Placeholder */}
            <div className="h-28 bg-white/5 rounded-none flex items-center justify-center">
              <div className="w-full h-0.5 bg-white/30 rounded-full"></div>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-3 font-light">
              <span>23 Oct</span>
              <span>28 Oct</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-6 pb-8">
        {/* Left Column - Stats Cards */}
        <div className="space-y-6">
          {/* Active Users Card */}
          <Card className="border-white/10 bg-black/50 rounded-none">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-base font-normal">Active Users</CardTitle>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-0 h-auto font-light">
                  {selectedPeriod}
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </div>
              <CardDescription className="text-gray-400 text-xs font-light">
                Users with active session in the time frame
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl text-white mb-2 font-light">1,250</div>
              <div className="flex items-center text-green-400 text-xs font-light">
                <TrendingUp className="w-3 h-3 mr-1" />
                24% from yesterday
              </div>
            </CardContent>
          </Card>

          {/* New Users Card */}
          <Card className="border-white/10 bg-black/50 rounded-none">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-base font-normal">New Users</CardTitle>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-0 h-auto font-light">
                  {selectedPeriod}
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </div>
              <CardDescription className="text-gray-400 text-xs font-light">
                Newly registered Users in the time frame
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl text-white mb-2 font-light">10</div>
              <div className="flex items-center text-red-400 text-xs font-light">
                <TrendingDown className="w-3 h-3 mr-1" />
                18% from yesterday
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - New Users Table */}
        <Card className="border-white/10 col-span-2 bg-black/50 rounded-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-base font-normal">New Users</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {newUsers.map((user, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors duration-200 rounded-none px-2 -mx-2">
                  <div className="flex items-center space-x-3">
                    <div className="text-xs text-gray-400 w-14 font-light">{user.time}</div>
                    <div>
                      <div className="text-sm text-white font-light">{user.name}</div>
                      <div className="text-xs text-gray-400 font-light">{user.method}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 font-light">{user.device}</div>
                </div>
              ))}
            </div>
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
      <div className="space-y-6 grid grid-cols-2 gap-4">
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
              className="w-20 bg-white/10 flex justify-end border border-white/20 text-white text-sm px-2 py-1 rounded-none font-light"
              placeholder="Count"
              min="1"
              max="100"
            />
          </div>
          <div className="flex justify-end pr-3">
            <Button
              onClick={() => handleSeedData('users')}
              disabled={seedingStatus === 'seeding'}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-light text-sm px-4"
            >
              {seedingStatus === 'seeding' ? 'Seeding...' : 'Seed'}
            </Button>
          </div>
          <div className="bg-black border border-white/10 rounded-none p-3 font-mono text-xs">
            <div className="flex items-center justify-between mb-2">
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

        {/* Organizations */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4 items-center p-3 bg-white/5 rounded-none">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-white" />
              <span className="text-sm text-white font-light">Organizations</span>
            </div>
            <input
              type="number"
              value={seedCount.organizations}
              onChange={(e) => setSeedCount({...seedCount, organizations: parseInt(e.target.value) || 0})}
              className="w-20 bg-white/10 border border-white/20 text-white text-sm px-2 py-1 rounded-none font-light"
              placeholder="Count"
              min="1"
              max="100"
            />
            <Button
              onClick={() => handleSeedData('organizations')}
              disabled={seedingStatus === 'seeding'}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-light text-sm px-4 w-fit"
            >
              {seedingStatus === 'seeding' ? 'Seeding...' : 'Seed'}
            </Button>
          </div>
          <div className="bg-black border border-white/10 rounded-none p-3 font-mono text-xs ml-3">
            <div className="text-green-400 mb-2">$ seed organizations {seedCount.organizations}</div>
            {logs.filter(log => log.message.includes('organizations')).slice(-1).map((log) => (
              <div key={log.id} className="flex items-center space-x-2">
                <span className="text-gray-500">[{log.timestamp}]</span>
                {getLogIcon(log.type)}
                <span className={`font-light ${getLogColor(log.type)}`}>{log.message}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sessions */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4 items-center p-3 bg-white/5 rounded-none">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-white" />
              <span className="text-sm text-white font-light">Sessions</span>
            </div>
            <input
              type="number"
              value={seedCount.sessions}
              onChange={(e) => setSeedCount({...seedCount, sessions: parseInt(e.target.value) || 0})}
              className="w-20 bg-white/10 border border-white/20 text-white text-sm px-2 py-1 rounded-none font-light"
              placeholder="Count"
              min="1"
              max="100"
            />
            <Button
              onClick={() => handleSeedData('sessions')}
              disabled={seedingStatus === 'seeding'}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-light text-sm px-4 w-fit"
            >
              {seedingStatus === 'seeding' ? 'Seeding...' : 'Seed'}
            </Button>
          </div>
          <div className="bg-black border border-white/10 rounded-none p-3 font-mono text-xs ml-3">
            <div className="text-green-400 mb-2">$ seed sessions {seedCount.sessions}</div>
            {logs.filter(log => log.message.includes('sessions')).slice(-1).map((log) => (
              <div key={log.id} className="flex items-center space-x-2">
                <span className="text-gray-500">[{log.timestamp}]</span>
                {getLogIcon(log.type)}
                <span className={`font-light ${getLogColor(log.type)}`}>{log.message}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Verifications */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4 items-center p-3 bg-white/5 rounded-none">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-white" />
              <span className="text-sm text-white font-light">Verifications</span>
            </div>
            <input
              type="number"
              value={seedCount.verifications}
              onChange={(e) => setSeedCount({...seedCount, verifications: parseInt(e.target.value) || 0})}
              className="w-20 bg-white/10 border border-white/20 text-white text-sm px-2 py-1 rounded-none font-light"
              placeholder="Count"
              min="1"
              max="100"
            />
            <Button
              onClick={() => handleSeedData('verifications')}
              disabled={seedingStatus === 'seeding'}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-light text-sm px-4 w-fit"
            >
              {seedingStatus === 'seeding' ? 'Seeding...' : 'Seed'}
            </Button>
          </div>
          <div className="bg-black border border-white/10 rounded-none p-3 font-mono text-xs ml-3">
            <div className="text-green-400 mb-2">$ seed verifications {seedCount.verifications}</div>
            {logs.filter(log => log.message.includes('verifications')).slice(-1).map((log) => (
              <div key={log.id} className="flex items-center space-x-2">
                <span className="text-gray-500">[{log.timestamp}]</span>
                {getLogIcon(log.type)}
                <span className={`font-light ${getLogColor(log.type)}`}>{log.message}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Accounts */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4 items-center p-3 bg-white/5 rounded-none">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-white" />
              <span className="text-sm text-white font-light">Accounts</span>
            </div>
            <input
              type="number"
              value={seedCount.accounts}
              onChange={(e) => setSeedCount({...seedCount, accounts: parseInt(e.target.value) || 0})}
              className="w-20 bg-white/10 border border-white/20 text-white text-sm px-2 py-1 rounded-none font-light"
              placeholder="Count"
              min="1"
              max="100"
            />
            <Button
              onClick={() => handleSeedData('accounts')}
              disabled={seedingStatus === 'seeding'}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-light text-sm px-4 w-fit"
            >
              {seedingStatus === 'seeding' ? 'Seeding...' : 'Seed'}
            </Button>
          </div>
          <div className="bg-black border border-white/10 rounded-none p-3 font-mono text-xs ml-3">
            <div className="text-green-400 mb-2">$ seed accounts {seedCount.accounts}</div>
            {logs.filter(log => log.message.includes('accounts')).slice(-1).map((log) => (
              <div key={log.id} className="flex items-center space-x-2">
                <span className="text-gray-500">[{log.timestamp}]</span>
                {getLogIcon(log.type)}
                <span className={`font-light ${getLogColor(log.type)}`}>{log.message}</span>
              </div>
            ))}
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
      {activeTab === 'overview' ? renderOverview() : renderSeedData()}
    </div>
  )
}
