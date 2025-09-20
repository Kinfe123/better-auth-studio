import { Building2, Loader, Plus, Search, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

interface Team {
  id: string;
  name: string;
  organizationId: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  organization?: {
    id: string;
    name: string;
  };
}

interface PluginStatus {
  enabled: boolean;
  error?: string;
  configPath?: string | null;
  availablePlugins?: string[];
  teamsPlugin?: any;
}

export default function Teams() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [pluginStatus, setPluginStatus] = useState<PluginStatus | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [teamsPerPage] = useState(20);

  useEffect(() => {
    checkPluginStatus();
  }, []);

  const checkPluginStatus = async () => {
    try {
      const response = await fetch('/api/plugins');
      const pluginLists: any = await response.json();
      const teamsEnabled = (pluginLists?.plugins as any).find(
        (plugin: any) => plugin.id === 'teams'
      );
      setPluginStatus({
        enabled: !!teamsEnabled,
        availablePlugins: (pluginLists?.plugins as any).map((plugin: any) => plugin.id),
        configPath: (pluginLists as any).configPath,
        teamsPlugin: (pluginLists?.plugins as any).find((plugin: any) => plugin.id === 'teams'),
      });
      if (teamsEnabled) {
        await fetchTeams();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to check teams plugin status:', error);
      setPluginStatus({
        enabled: false,
        error: 'Failed to check plugin status',
      });
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      const data = await response.json();

      if (data.success) {
        setTeams(data.teams || []);
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  // const copyToClipboard = (text: string) => {
  //   navigator.clipboard.writeText(text);
  //   toast.success('Copied to clipboard');
  // };

  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.organization?.name.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === 'all') return matchesSearch;
    if (filter === 'recent') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return matchesSearch && new Date(team.createdAt) > weekAgo;
    }
    return matchesSearch;
  });

  const indexOfLastTeam = currentPage * teamsPerPage;
  const indexOfFirstTeam = indexOfLastTeam - teamsPerPage;
  const currentTeams = filteredTeams.slice(indexOfFirstTeam, indexOfLastTeam);
  const totalPages = Math.ceil(filteredTeams.length / teamsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!pluginStatus?.enabled) {
    return (
      <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-white font-light">Teams</h1>
          <p className="text-gray-400 mt-1">Manage your application organizations</p>
        </div>
      </div>

      <div className="bg-black/30 border border-dashed border-white/20 rounded-none p-8">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <Building2 className="w-12 h-12 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl text-white font-light mb-2">Organization Plugin Required</h3>
            <p className="text-gray-300 mb-6">
              To use Organizations in Better Auth Studio, you need to enable the organization
              plugin in your Better Auth configuration.
            </p>

            <div className="bg-black/50 border border-dashed border-white/20 rounded-none p-4 mb-6">
              <h4 className="text-white font-light mb-3">Follow these steps:</h4>
              <ol className="text-gray-300 space-y-2 text-sm list-decimal list-inside">
                <li>
                  Import the plugin in your auth configuration file
                  {pluginStatus?.configPath && (
                    <span className="text-gray-400"> ({pluginStatus.configPath})</span>
                  )}
                  :
                </li>
              </ol>

              <div className="mt-4 bg-black/70 border border-dashed border-white/10 rounded-none p-3 overflow-x-auto">
                <pre className="text-sm text-gray-300">
                  <span className="text-blue-400">import</span> {`{ betterAuth }`}{' '}
                  <span className="text-blue-400">from</span>{' '}
                  <span className="text-green-400">"better-auth"</span> <br />
                  <span className="text-blue-400">import</span> {`{ organization }`}{' '}
                  <span className="text-blue-400">from</span>{' '}
                  <span className="text-green-400">"better-auth/plugins/organization"</span>{' '}
                  <br />
                  <span className="text-blue-400">export const</span>{' '}
                  <span className="text-yellow-300">auth</span> ={' '}
                  <span className="text-yellow-300">betterAuth</span>({`{`} <br />
                  <span className="text-gray-500 pl-10">// ... your existing configuration</span>{' '}
                  <br />
                  <span className="text-red-300 pl-10">plugins</span>: [ <br />
                  <span className="text-yellow-300 pl-12">organization({})</span>
                  <br />
                  <span className="pl-10">]</span> <br />
                  {`}`}) <br />
                </pre>
              </div>

              <div className="mt-4">
                <p className="text-gray-400 text-sm">
                  2. Do migrations to create the organizations table
                </p>
              </div>
              <div className="mt-2">
                <p className="text-gray-400 text-sm">
                  3. Restart your application to apply the changes
                </p>
              </div>
            </div>

            {pluginStatus?.availablePlugins && pluginStatus.availablePlugins.length > 0 && (
              <div className="mb-4">
                <p className="text-gray-400 text-sm">
                  Currently enabled plugins: {pluginStatus.availablePlugins.join(', ')}
                </p>
              </div>
            )}

            <Button
              onClick={() => window.location.reload()}
              className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none"
            >
              Check Again
            </Button>

            <div className="mt-4 text-xs text-gray-500">
              Need help? Check the{' '}
              <a
                href="https://better-auth.com/docs/plugins/organization"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:underline"
              >
                Better Auth Organization Plugin Documentation
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-white">Teams</h1>
          <p className="text-gray-400 mt-1">
            {filteredTeams.length} team{filteredTeams.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => navigate('/teams/new')}
            className="bg-white text-black hover:bg-gray-200 border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Team
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-black border-dashed border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className={
              filter === 'all'
                ? 'bg-white text-black'
                : 'border-dashed border-white/20 text-white hover:bg-white/10'
            }
          >
            All
          </Button>
          <Button
            variant={filter === 'recent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('recent')}
            className={
              filter === 'recent'
                ? 'bg-white text-black'
                : 'border-dashed border-white/20 text-white hover:bg-white/10'
            }
          >
            Recent
          </Button>
        </div>
      </div>

      {/* Teams List */}
      {currentTeams.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-light text-white mb-2">No teams found</h3>
          <p className="text-gray-400 mb-6">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Get started by creating your first team'}
          </p>
          {!searchTerm && (
            <Button
              onClick={() => navigate('/teams/new')}
              className="bg-white text-black hover:bg-gray-200 border-dashed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Team
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {currentTeams.map((team) => (
            <div
              key={team.id}
              className="bg-black/30 border border-white/15 rounded-none p-4 hover:bg-black/40 transition-colors cursor-pointer"
              onClick={() => navigate(`/teams/${team.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-white/10 rounded-none flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{team.name}</h3>
                    <p className="text-gray-400 text-sm">
                      {team.organization?.name} • {team.memberCount || 0} members
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="secondary"
                    className="text-xs bg-green-900/50 border border-dashed rounded-none border-green-500/30 text-green-400"
                  >
                    Active
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="border-dashed border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
          >
            Previous
          </Button>
          <span className="text-gray-400 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="border-dashed border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
