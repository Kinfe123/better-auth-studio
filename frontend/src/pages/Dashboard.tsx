import { ArrowRight, BarChart3, Building2, Settings, Users, Zap } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import OrganizationsPage from './Organizations';
import UsersPage from './Users';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const renderOverview = () => (
    <div className="space-y-8 animate-fade-in px-6 py-8">
      <div>
        <h1 className="text-2xl text-white font-normal">Better Auth Studio</h1>
        <p className="text-gray-400 mt-1 font-light">Manage your authentication system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border border-dashed border-white/20 bg-black/30 rounded-none hover:bg-black/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/10 rounded-none">
                <Users className="w-6 h-6 text-white" />
              </div>
              <Badge className="bg-white/10 text-white border border-dashed border-white/20 rounded-none">
                Active
              </Badge>
            </div>
            <h3 className="text-lg text-white font-light mb-2">User Management</h3>
            <p className="text-gray-400 font-light mb-4">
              Manage user accounts, profiles, and permissions
            </p>
            <Button
              onClick={() => setActiveTab('users')}
              className="w-full bg-white hover:bg-white/90 text-black border border-white/20 rounded-none"
            >
              Manage Users
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Organizations Card */}
        <Card className="border border-dashed border-white/20 bg-black/30 rounded-none hover:bg-black/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/10 rounded-none">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <Badge className="bg-white/10 text-white border border-dashed border-white/20 rounded-none">
                Active
              </Badge>
            </div>
            <h3 className="text-lg text-white font-light mb-2">Organizations</h3>
            <p className="text-gray-400 font-light mb-4">
              Manage organizations, teams, and memberships
            </p>
            <Button
              onClick={() => setActiveTab('organizations')}
              className="w-full bg-white hover:bg-white/90 text-black border border-white/20 rounded-none"
            >
              Manage Organizations
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Sessions Card */}
        {/* <Card className="border border-dashed border-white/20 bg-black/30 rounded-none hover:bg-black/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/10 rounded-none">
                <Database className="w-6 h-6 text-white" />
              </div>
              <Badge className="bg-white/10 text-white border border-dashed border-white/20 rounded-none">
                Active
              </Badge>
            </div>
            <h3 className="text-lg text-white font-light mb-2">Session Management</h3>
            <p className="text-gray-400 font-light mb-4">Monitor and manage user sessions</p>
            <Button 
              onClick={() => setActiveTab('sessions')}
              className="w-full bg-white hover:bg-white/90 text-black border border-white/20 rounded-none"
            >
              Manage Sessions
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card> */}

        {/* Configuration Card */}
        <Card className="border border-dashed border-white/20 bg-black/30 rounded-none hover:bg-black/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/10 rounded-none">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <Badge className="bg-white/10 text-white border border-dashed border-white/20 rounded-none">
                Configured
              </Badge>
            </div>
            <h3 className="text-lg text-white font-light mb-2">Configuration</h3>
            <p className="text-gray-400 font-light mb-4">View and manage auth configuration</p>
            <Button
              variant="outline"
              className="w-full border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
            >
              View Config
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Analytics Card */}
        <Card className="border border-dashed border-white/20 bg-black/30 rounded-none hover:bg-black/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/10 rounded-none">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <Badge className="bg-white/10 text-white border border-dashed border-white/20 rounded-none">
                Coming Soon
              </Badge>
            </div>
            <h3 className="text-lg text-white font-light mb-2">Analytics</h3>
            <p className="text-gray-400 font-light mb-4">
              View authentication analytics and insights
            </p>
            <Button
              variant="outline"
              disabled
              className="w-full border border-dashed border-white/20 text-gray-400 rounded-none"
            >
              View Analytics
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="border border-dashed border-white/20 bg-black/30 rounded-none hover:bg-black/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/10 rounded-none">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <Badge className="bg-white/10 text-white border border-dashed border-white/20 rounded-none">
                Available
              </Badge>
            </div>
            <h3 className="text-lg text-white font-light mb-2">Quick Actions</h3>
            <p className="text-gray-400 font-light mb-4">Common tasks and shortcuts</p>
            <Button
              variant="outline"
              className="w-full border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
            >
              View Actions
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      {/* <div className="border-b border-dashed border-white/10">
        <div className="px-6 py-4">
          <div className="flex items-center space-x-8">
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
              onClick={() => setActiveTab('organizations')}
              className={`pb-3 px-1 border-b-2 font-light text-sm transition-colors ${
                activeTab === 'organizations'
                  ? 'border-white text-white'
                  : 'border-transparent text-white/60 hover:text-white/80'
              }`}
            >
              Organizations
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`pb-3 px-1 border-b-2 font-light text-sm transition-colors ${
                activeTab === 'sessions'
                  ? 'border-white text-white'
                  : 'border-transparent text-white/60 hover:text-white/80'
              }`}
            >
              Sessions
            </button>
          </div>
        </div>
      </div> */}

      {/* Tab Content */}
      {activeTab === 'overview' ? (
        renderOverview()
      ) : activeTab === 'users' ? (
        <UsersPage />
      ) : activeTab === 'organizations' ? (
        <OrganizationsPage />
      ) : (
        //  activeTab === 'sessions' ? <SessionsPage /> :
        renderOverview()
      )}
    </div>
  );
}
