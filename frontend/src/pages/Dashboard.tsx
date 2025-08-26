import { useState } from 'react'
import { 
  TrendingUp, 
  TrendingDown,
  ChevronDown
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('1Y')
  const [selectedTab, setSelectedTab] = useState('Active Users')
  const [selectedPeriod, _ ] = useState('Daily')

  const timeRanges = ['ALL', '1M', '3M', '6M', '1Y']
  const tabs = ['Active Users', 'Total Users', 'New Users', 'Returning Users']

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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Message */}
      <div className="px-5 pt-7">
        <h1 className="text-2xl font-bold text-white">Welcome Back, Bereket</h1>
        <p className="text-sm text-gray-400 mt-1">Mar 18 Tue, 12:57 AM</p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-5">
        {/* Total Users Card */}
        <Card className="border-white/15 bg-black/70 rounded-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-2xl font-bold">10.2k</CardTitle>
            <CardDescription className="text-white text-sm font-medium">TOTAL USER</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Time Range Selector */}
            <div className="flex space-x-1 mb-4">
              {timeRanges.map((range) => (
                <Button
                  key={range}
                  variant={selectedTimeRange === range ? "default" : "ghost"}
                  size="sm"
                  className={`text-xs px-3 py-1 h-6 ${
                    selectedTimeRange === range 
                      ? 'bg-gray-800 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-transparent'
                  }`}
                  onClick={() => setSelectedTimeRange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>
            
            {/* Chart Placeholder */}
            <div className="h-32 bg-gray-900/50 rounded-none flex items-end justify-between px-2 pb-2">
              {[23, 45, 32, 67, 89, 54].map((height, index) => (
                <div
                  key={index}
                  className="bg-gray-400 w-8 rounded-none"
                  style={{ height: `${height}%` }}
                ></div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>23 Oct</span>
              <span>28 Oct</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Subscription Card */}
        <Card className="border-white/15 bg-black/70 rounded-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-2xl font-bold">$1243.22</CardTitle>
            <CardDescription className="text-white text-sm font-medium">TOTAL SUBSCRIPTION</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Time Range Selector */}
            <div className="flex space-x-1 mb-4">
              {timeRanges.map((range) => (
                <Button
                  key={range}
                  variant={selectedTimeRange === range ? "default" : "ghost"}
                  size="sm"
                  className={`text-xs px-3 py-1 h-6 ${
                    selectedTimeRange === range 
                      ? 'bg-gray-800 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-transparent'
                  }`}
                  onClick={() => setSelectedTimeRange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>
            
            {/* Chart Placeholder */}
            <div className="h-32 bg-gray-900/50 rounded-none flex items-center justify-center">
              <div className="w-full h-1 bg-white rounded-full"></div>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>23 Oct</span>
              <span>28 Oct</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-5">
        {/* Left Column - Stats Cards */}
        <div className="space-y-6">
          {/* Active Users Card */}
          <Card className="border-white/15 bg-black/70 rounded-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">Active Users</CardTitle>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-0 h-auto">
                  {selectedPeriod}
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <CardDescription className="text-gray-400 text-sm">
                Users with active session in the time frame
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-white mb-2">1,250</div>
              <div className="flex items-center text-green-500 text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                24% from yesterday
              </div>
            </CardContent>
          </Card>

          {/* New Users Card */}
          <Card className="border-white/15 bg-black/70 rounded-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">New Users</CardTitle>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-0 h-auto">
                  {selectedPeriod}
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <CardDescription className="text-gray-400 text-sm">
                Newly registered Users in the time frame
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-white mb-2">10</div>
              <div className="flex items-center text-red-500 text-sm">
                <TrendingDown className="w-4 h-4 mr-1" />
                18% from yesterday
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - Chart */}
        <Card className="border-white/15 bg-black/70 rounded-none">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex space-x-1">
                {tabs.map((tab) => (
                  <Button
                    key={tab}
                    variant={selectedTab === tab ? "default" : "ghost"}
                    size="sm"
                    className={`text-xs px-3 py-1 h-6 ${
                      selectedTab === tab 
                        ? 'bg-gray-800 text-white' 
                        : 'text-gray-400 hover:text-white hover:bg-transparent'
                    }`}
                    onClick={() => setSelectedTab(tab)}
                  >
                    {tab}
                  </Button>
                ))}
              </div>
            </div>
            <CardDescription className="text-gray-400 text-sm">
              January - June 18
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Chart Placeholder */}
            <div className="h-48 bg-gray-900/50 rounded-none flex items-end justify-between px-4 pb-4">
              {[60, 80, 45, 90, 75, 85].map((height, index) => (
                <div
                  key={index}
                  className={`w-8 rounded-none ${
                    index % 2 === 0 ? 'bg-gray-400' : 'bg-gray-600'
                  }`}
                  style={{ height: `${height}%` }}
                ></div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-white mb-1">
                <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                Trending up by 5.2% this month
              </div>
              <p className="text-xs text-gray-400">
                Showing total visitors for the last 6 months
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - New Users Table */}
        <Card className="border-white/15 bg-black/70 rounded-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg">New Users</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {newUsers.map((user, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-white/15 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className="text-xs text-gray-400 w-16">{user.time}</div>
                    <div>
                      <div className="text-sm font-medium text-white">{user.name}</div>
                      <div className="text-xs text-gray-400">{user.method}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">{user.device}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
