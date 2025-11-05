import {
  Ban,
  Building2,
  Calendar,
  Clock,
  Database,
  Edit,
  Globe,
  HashIcon,
  Loader,
  Mail,
  Monitor,
  Phone,
  User,
  UserMinus,
  Users,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Terminal } from '../components/Terminal';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  twoFactorEnabled?: boolean;
  image?: string;
  createdAt: string;
  updatedAt: string;
  banned?: boolean;
  banReason?: string;
  banExpires?: string;
  phoneNumber?: string
  username?: string
  role?: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  image?: string;
  createdAt: string;
  role: string;
}

interface Team {
  id: string;
  name: string;
  organizationId: string;
  organizationName: string;
  role: string;
  createdAt: string;
}

interface OrganizationMembership {
  id: string;
  organization: Organization;
  role: string;
  joinedAt: string;
}

interface TeamMembership {
  id: string;
  team: Team;
  role: string;
  joinedAt: string;
}

interface Session {
  id: string;
  token: string;
  expiresAt: string;
  ipAddress: string;
  userAgent: string;
  activeOrganizationId?: string;
  activeTeamId?: string;
  createdAt: string;
  updatedAt: string;
}

interface LocationData {
  country: string;
  countryCode: string;
  city: string;
  region: string;
}

export default function UserDetails() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationMembership[]>([]);
  const [teams, setTeams] = useState<TeamMembership[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'organizations' | 'teams' | 'sessions'>(
    'details'
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [showSessionSeedModal, setShowSessionSeedModal] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [banExpiresIn, setBanExpiresIn] = useState<number | undefined>();
  const [adminPluginEnabled, setAdminPluginEnabled] = useState(false);
  const [seedingLogs, setSeedingLogs] = useState<
    Array<{
      id: string;
      type: 'info' | 'success' | 'error' | 'progress';
      message: string;
      timestamp: Date;
      status?: 'pending' | 'running' | 'completed' | 'failed';
    }>
  >([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const [sessionLocations, setSessionLocations] = useState<Record<string, LocationData>>({});

  const checkAdminPlugin = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/status');
      const data = await response.json();
      setAdminPluginEnabled(data.enabled);
    } catch (_error) {
      setAdminPluginEnabled(false);
    }
  }, []);

  const resolveIPLocation = async (ipAddress: string): Promise<LocationData | null> => {
    try {
      const response = await fetch('/api/geo/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ipAddress }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.location) {
          return data.location;
        }
      }
      return null;
    } catch (_error) {
      return null;
    }
  };

  const resolveSessionLocations = async (sessions: Session[]) => {
    const locationPromises = sessions.map(async (session) => {
      if (!sessionLocations[session.id]) {
        const location = await resolveIPLocation(session.ipAddress);
        if (location) {
          return { sessionId: session.id, location };
        }
      }
      return null;
    });

    const results = await Promise.all(locationPromises);
    const newLocations: Record<string, LocationData> = {};

    results.forEach((result) => {
      if (result) {
        newLocations[result.sessionId] = result.location;
      }
    });

    if (Object.keys(newLocations).length > 0) {
      setSessionLocations((prev) => ({ ...prev, ...newLocations }));
    }
  };

  const getCountryFlag = (countryCode: string): string => {
    if (!countryCode) return '🌍';

    // Convert country code to flag emoji
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const fetchUserDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        toast.error('Failed to fetch user details');
        navigate('/users');
      }
    } catch (_error) {
      toast.error('Failed to fetch user details');
      navigate('/users');
    } finally {
      setLoading(false);
    }
  }, [userId, navigate]);

  const fetchUserMemberships = useCallback(async () => {
    try {
      const [orgResponse, teamResponse, sessionResponse] = await Promise.all([
        fetch(`/api/users/${userId}/organizations`),
        fetch(`/api/users/${userId}/teams`),
        fetch(`/api/users/${userId}/sessions`),
      ]);

      if (orgResponse.ok) {
        const orgData = await orgResponse.json();
        setOrganizations(orgData.memberships || []);
      }

      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        setTeams(teamData.memberships || []);
      }

      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        const sessions = sessionData.sessions || [];
        setSessions(sessions);
        // Resolve locations for sessions
        resolveSessionLocations(sessions);
      }
    } catch (_error) { }
  }, [userId]);

  const handleEditUser = async () => {
    if (!user) return;

    const name = (document.getElementById('edit-name') as HTMLInputElement)?.value;
    const email = (document.getElementById('edit-email') as HTMLInputElement)?.value;

    if (!name || !email) {
      toast.error('Please fill in all fields');
      return;
    }

    const toastId = toast.loading('Updating user...');
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });

      const result = await response.json();

      if (result.success) {
        setUser({ ...user, name, email });
        setShowEditModal(false);
        toast.success('User updated successfully!', { id: toastId });
      } else {
        toast.error(`Error updating user: ${result.error || 'Unknown error'}`, { id: toastId });
      }
    } catch (_error) {
      toast.error('Error updating user', { id: toastId });
    }
  };

  const handleBanUser = async () => {
    if (!user) return;

    if (!adminPluginEnabled) {
      toast.error(
        'Admin plugin is not enabled. Please enable the admin plugin in your Better Auth configuration to use ban functionality.'
      );
      return;
    }

    const toastId = toast.loading('Banning user...');
    try {
      const response = await fetch('/api/admin/ban-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          banReason: banReason || 'No reason provided',
          banExpiresIn: banExpiresIn,
        }),
      });
      const result = await response.json();

      if (response.ok) {
        toast.success('User banned successfully!', { id: toastId });
        setShowBanModal(false);
        setBanReason('');
        setBanExpiresIn(undefined);
        fetchUserDetails();
      } else {
        if (response.status === 403) {
          toast.error('You do not have permission to ban users. Admin role required.', {
            id: toastId,
          });
        } else if (result.adminPluginEnabled && result.instructions) {
          toast.error(`${result.error}`, {
            id: toastId,
            duration: 6000,
            description: `Use: ${result.instructions.example}`,
          });
        } else {
          toast.error(`Error banning user: ${result.error || result.message || 'Unknown error'}`, {
            id: toastId,
          });
        }
      }
    } catch (_error) {
      toast.error('Error banning user', { id: toastId });
    }
  };

  const handleUnbanUser = async () => {
    if (!user) return;

    if (!adminPluginEnabled) {
      toast.error(
        'Admin plugin is not enabled. Please enable the admin plugin in your Better Auth configuration to use unban functionality.'
      );
      return;
    }

    const toastId = toast.loading('Unbanning user...');
    try {
      const response = await fetch('/api/admin/unban-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
        }),
      });
      const result = await response.json();

      if (response.ok) {
        toast.success('User unbanned successfully!', { id: toastId });
        setShowUnbanModal(false);
        fetchUserDetails();
      } else {
        if (response.status === 403) {
          toast.error('You do not have permission to unban users. Admin role required.', {
            id: toastId,
          });
        } else if (result.adminPluginEnabled && result.instructions) {
          toast.error(`${result.error}`, {
            id: toastId,
            duration: 6000,
            description: `Use: ${result.instructions.example}`,
          });
        } else {
          toast.error(
            `Error unbanning user: ${result.error || result.message || 'Unknown error'}`,
            { id: toastId }
          );
        }
      }
    } catch (_error) {
      toast.error('Error unbanning user', { id: toastId });
    }
  };

  const handleRemoveFromOrganization = async (membershipId: string) => {
    const toastId = toast.loading('Removing user from organization...');
    try {
      const response = await fetch(`/api/organizations/members/${membershipId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setOrganizations((prev) => prev.filter((m) => m.id !== membershipId));
        toast.success('User removed from organization!', { id: toastId });
      } else {
        toast.error(`Error removing user: ${result.error || 'Unknown error'}`, { id: toastId });
      }
    } catch (_error) {
      toast.error('Error removing user from organization', { id: toastId });
    }
  };

  const handleRemoveFromTeam = async (membershipId: string) => {
    const toastId = toast.loading('Removing user from team...');
    try {
      const response = await fetch(`/api/teams/members/${membershipId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setTeams((prev) => prev.filter((m) => m.id !== membershipId));
        toast.success('User removed from team!', { id: toastId });
      } else {
        toast.error(`Error removing user: ${result.error || 'Unknown error'}`, { id: toastId });
      }
    } catch (_error) {
      toast.error('Error removing user from team', { id: toastId });
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    const toastId = toast.loading('Deleting session...');
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        toast.success('Session deleted successfully!', { id: toastId });
      } else {
        toast.error(`Error deleting session: ${result.error || 'Unknown error'}`, { id: toastId });
      }
    } catch (_error) {
      toast.error('Error deleting session', { id: toastId });
    }
  };
  useEffect(() => {
    if (userId) {
      fetchUserDetails();
      fetchUserMemberships();
      checkAdminPlugin();
    }
  }, [userId, checkAdminPlugin, fetchUserDetails, fetchUserMemberships]);

  const handleSeedSessions = async (count: number = 3) => {
    if (!userId) return;

    setSeedingLogs([]);
    setIsSeeding(true);

    setSeedingLogs([
      {
        id: 'start',
        type: 'info',
        message: `Starting session seeding process for ${count} sessions...`,
        timestamp: new Date(),
      },
    ]);

    try {
      const response = await fetch(`/api/users/${userId}/seed-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      });

      const result = await response.json();

      if (result.success) {
        const progressLogs = result.results.map((r: any, index: number) => {
          if (r.success) {
            return {
              id: `session-${index}`,
              type: 'progress' as const,
              message: `Creating session ${index + 1}: ${r.session.token.substring(0, 20)}... from ${r.session.ipAddress}`,
              timestamp: new Date(),
              status: 'completed' as const,
            };
          } else {
            return {
              id: `session-${index}`,
              type: 'error' as const,
              message: `Failed to create session ${index + 1}: ${r.error}`,
              timestamp: new Date(),
            };
          }
        });

        setSeedingLogs((prev) => [...prev, ...progressLogs]);

        const successCount = result.results.filter((r: any) => r.success).length;
        setSeedingLogs((prev) => [
          ...prev,
          {
            id: 'complete',
            type: 'success',
            message: `✅ Session seeding completed! Created ${successCount}/${count} sessions successfully`,
            timestamp: new Date(),
          },
        ]);

        // Refresh sessions data
        fetchUserMemberships();
      } else {
        setSeedingLogs((prev) => [
          ...prev,
          {
            id: 'error',
            type: 'error',
            message: `❌ Session seeding failed: ${result.error || 'Unknown error'}`,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      setSeedingLogs((prev) => [
        ...prev,
        {
          id: 'error',
          type: 'error',
          message: `❌ Network error: ${error}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Loading user details...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">User not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black w-full">
      <div className="w-full flex flex-col px-6 py-8">
        <Button
          variant="outline"
          onClick={() => navigate('/users')}
          className="mb-4 ml-0 flex justify-start items-start text-left border-none text-white"
        >
          <span className='font-light'>
            <span className='uppercase text-white/80 font-mono text-sm'>users / </span>
            <span className='text-white font-mono text-sm'>{user.id}</span>
          </span>
        </Button>
        {/* {user.banned && (
          <div className="mb-6 border-l-4 border-red-500 bg-red-500/10 p-4">
            <div className="flex items-start space-x-3">
              <Ban className="w-5 h-5 text-red-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-red-400 font-semibold text-sm uppercase tracking-wide">
                  User Account Banned
                </h3>
                <p className="text-red-300 text-sm mt-1">
                  This user has been banned from accessing the system.
                </p>
                {user.banReason && (
                  <div className="mt-2 text-sm">
                    <span className="text-gray-400">Reason: </span>
                    <span className="text-red-300">{user.banReason}</span>
                  </div>
                )}
                {user.banExpires && (
                  <div className="mt-1 text-sm">
                    <span className="text-gray-400">Ban expires: </span>
                    <span className="text-yellow-400">
                      {new Date(user.banExpires).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )} */}

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-800 border border-dashed border-white/20 flex items-center justify-center">
                {user.image ? (
                  <img src={user.image} alt={user.name} className="w-16 h-16 object-cover" />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-light text-white inline-flex items-start">
                  {user.name}
                  <sup
                    className="text-xs text-gray-500 ml-2 mt-1 cursor-pointer hover:text-white transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(user.id);
                      toast.success('User ID copied to clipboard');
                    }}
                    title="Click to copy User ID"
                  >
                    <span className='mr-1'>[</span>
                    <span className='text-white/80 font-mono text-xs'>{user.id.slice(0, 8)}...</span>
                    <span className='ml-1'>]</span>
                  </sup>
                  {user.banned && (
                    <span className="ml-2 mt-1 px-2 py-0.5 text-[10px] font-mono uppercase border border-dashed border-red-500/30 bg-red-500/10 text-red-400/80 rounded-none">
                      Banned
                    </span>
                  )}
                </h1>
                <p className="text-gray-400 font-mono text-sm">{user.email}</p>
                <div className="flex items-center space-x-2 mt-2">
                  {user.role && (
                    <div className="flex items-center space-x-1 px-2 py-1 rounded-sm text-xs font-mono bg-purple-500/20 text-purple-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                      <span>{user.role}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(true)}
                className="border border-white/20 text-white hover:bg-white/10 rounded-none"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit User
              </Button>
              {user.banned ? (
                <Button
                  variant="outline"
                  onClick={() => setShowUnbanModal(true)}
                  className="border border-green-400/20 text-green-400 hover:bg-green-400/10 rounded-none"
                  disabled={!adminPluginEnabled}
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Unban User
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowBanModal(true)}
                  className="border border-red-400/20 text-red-400 hover:bg-red-400/10 rounded-none"
                  disabled={!adminPluginEnabled}
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Ban User
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="border border-dashed border-white/10 rounded-none">
          <div className="border-b border-dashed border-white/10">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'details', name: 'Details', icon: User },
                {
                  id: 'organizations',
                  name: 'Organizations',
                  icon: Building2,
                  count: organizations.length,
                },
                { id: 'teams', name: 'Teams', icon: Users, count: teams.length },
                { id: 'sessions', name: 'Sessions', icon: Clock, count: sessions.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${activeTab === tab.id
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-white/50'
                    }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="inline-flex items-start">
                    {tab.name}
                    {tab.count !== undefined && (
                      <sup className="text-xs text-gray-500 ml-1">
                        <span className='mr-0.5'>[</span>
                        <span className='text-white/80 font-mono text-xs'>{tab.count}</span>
                        <span className='ml-0.5'>]</span>
                      </sup>
                    )}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'details' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="overflow-x-hidden bg-white/[3%] border border-white/10 p-6 rounded-none">
                  <h3 className="text-sm uppercase font-mono text-gray-400 mb-4 tracking-wider">
                    BASIC INFORMATION
                  </h3>
                  <hr className="border-white/10 -mx-10 border-dashed my-4" />
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <User className="w-4 h-4 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <div className="text-xs uppercase font-mono text-gray-500 mb-1">Username</div>
                        <div className="text-white font-sans text-sm">{user.name.toLowerCase().replace(/\s+/g, '')}</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Mail className="w-4 h-4 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <div className="text-xs uppercase font-mono text-gray-500 mb-1">Email</div>
                        <div className="text-white font-mono text-sm">{user.email}</div>
                      </div>
                    </div>
                    {user.username && (
                      <div className="flex items-start space-x-3">
                        <HashIcon className="w-4 h-4 text-gray-400 mt-1" />
                        <div className="flex-1">
                          <div className="text-xs uppercase font-mono text-gray-500 mb-1">Username</div>
                          <div className="text-white font-mono text-sm">{user.username}</div>
                        </div>
                      </div>
                    )}
                    {user.phoneNumber && (
                      <div className="flex items-start space-x-3">
                        <Phone className="w-4 h-4 text-gray-400 mt-1" />
                        <div className="flex-1">
                          <div className="text-xs uppercase font-mono text-gray-500 mb-1">Phone</div>
                          <div className="text-white font-mono text-sm">+251 91 234 5678</div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start space-x-3">
                      <Calendar className="w-4 h-4 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <div className="text-xs uppercase font-mono text-gray-500 mb-1">Member Since</div>
                        <div className="text-white font-mono text-sm">
                          {new Date(user.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-hidden bg-white/[3%] border border-white/10 p-6 rounded-none">
                  <h3 className="text-sm uppercase font-mono text-gray-400 mb-4 tracking-wider">
                    SECURITY
                  </h3>
                  <hr className="border-white/10 -mx-10 border-dashed my-4" />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-black/30 border border-white/5 rounded-none">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-xs uppercase font-mono text-gray-500">Email Verification</div>
                        </div>
                      </div>
                      <div className={`px-2 rounded-none py-1 text-xs font-mono ${user.emailVerified ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {user.emailVerified ? 'Verified' : 'Unverified'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-black/30 border border-white/5 rounded-none">
                      <div className="flex items-center space-x-3">
                        <Database className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-xs uppercase font-mono text-gray-500">Two-Factor Authentication</div>

                        </div>
                      </div>
                      <div className={`px-2 rounded-none py-1 text-xs font-mono ${user.twoFactorEnabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'organizations' && (
              <div className="space-y-4">
                {organizations.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Organizations</h3>
                    <p className="text-gray-400">This user is not a member of any organizations.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {organizations.map((membership) => (
                      <div
                        key={membership.id}
                        className="border border-dashed border-white/10 rounded-none p-4 hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gray-800 border border-dashed border-white/20 flex items-center justify-center">
                              {membership.organization.image ? (
                                <img
                                  src={membership.organization.image}
                                  alt={membership.organization.name}
                                  className="w-12 h-12 object-cover"
                                />
                              ) : (
                                <Building2 className="w-6 h-6 text-white" />
                              )}
                            </div>
                            <div>
                              <h3 className="text-white font-medium">
                                {membership.organization.name}
                              </h3>
                              <p className="text-gray-400 text-sm">
                                @{membership.organization.slug}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="rounded-none text-xs">
                                  {membership.role}
                                </Badge>
                                <span className="text-gray-400 text-xs">
                                  Joined {new Date(membership.joinedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveFromOrganization(membership.id)}
                            className="border border-dashed border-red-400/50 text-red-400 hover:bg-red-400/10 rounded-none"
                          >
                            <UserMinus className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'teams' && (
              <div className="space-y-4">
                {teams.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Teams</h3>
                    <p className="text-gray-400">This user is not a member of any teams.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {teams.map((membership) => (
                      <div
                        key={membership.id}
                        className="border border-dashed border-white/10 rounded-none p-4 hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-black/80 border border-dashed border-white/20 flex items-center justify-center">
                              <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-white font-medium">{membership.team.name}</h3>
                              <p className="text-gray-400 text-sm">
                                in {membership.team.organizationName}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="rounded-none text-xs">
                                  {membership.role}
                                </Badge>
                                <span className="text-gray-400 text-xs">
                                  Joined {new Date(membership.joinedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveFromTeam(membership.id)}
                            className="border border-dashed border-red-400/50 text-red-400 hover:bg-red-400/10 rounded-none"
                          >
                            <UserMinus className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-white">Sessions</h3>
                    <p className="text-gray-400 text-sm">Manage user authentication sessions</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSeedingLogs([]);
                      setIsSeeding(false);
                      setShowSessionSeedModal(true);
                    }}
                    className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Seed Sessions
                  </Button>
                </div>

                {sessions.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Sessions</h3>
                    <p className="text-gray-400">This user has no active sessions.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="border border-dashed border-white/10 rounded-none p-4 hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="w-12 h-12 bg-black/80 border border-dashed border-white/20 flex items-center justify-center rounded-none">
                              <Monitor className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-white font-light inline-flex items-start">
                                Session {session.id.substring(0, 8)}...
                                <sup className="text-xs text-gray-500 ml-2 mt-0.5">
                                  <span className='mr-1'>[</span>
                                  <span className='text-white/80 font-mono text-xs'>{session.ipAddress}</span>
                                  <span className='ml-1'>]</span>
                                </sup>
                              </h3>
                              <div className="flex items-center space-x-2 mt-2">
                                <Globe className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-gray-400 font-mono text-xs">
                                  {sessionLocations[session.id]?.city || '...'},{' '}
                                  {sessionLocations[session.id]?.country || '...'}
                                </span>
                                {sessionLocations[session.id]?.countryCode && (
                                  <span className="text-xs ml-1">
                                    {getCountryFlag(sessionLocations[session.id]?.countryCode)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500 font-mono text-xs uppercase">Expires: </span>
                              <span className="text-white font-mono text-xs">
                                {new Date(session.expiresAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                                , {new Date(session.expiresAt).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true,
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteSession(session.id)}
                            className="border border-dashed border-red-400/20 text-red-400 hover:bg-red-400/10 rounded-none"
                          >
                            <Ban className="w-4 h-4 mr-1" />
                            Revoke
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/90 border border-dashed border-white/20 rounded-none p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light">Edit User</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white rounded-none"
              >
                ×
              </Button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 bg-black/80 border border-dashed border-white/20 flex items-center justify-center">
                  {user?.image ? (
                    <img src={user.image} alt={user.name} className="w-16 h-16 object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium">{user?.name}</h4>
                  <p className="text-gray-400 text-sm">{user?.email}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                <input
                  id="edit-name"
                  type="text"
                  defaultValue={user?.name || ''}
                  className="w-full px-3 py-2 bg-gray-800 border border-dashed border-white/20 rounded-none text-white placeholder-gray-400 focus:outline-none focus:border-white/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                <input
                  id="edit-email"
                  type="email"
                  defaultValue={user?.email || ''}
                  className="w-full px-3 py-2 bg-gray-800 border border-dashed border-white/20 rounded-none text-white placeholder-gray-400 focus:outline-none focus:border-white/50"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditUser}
                className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none"
              >
                Update
              </Button>
            </div>
          </div>
        </div>
      )}

      {showBanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black border border-red-400/20 rounded-none p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Ban User</h2>
            <p className="text-gray-400 mb-4">
              Ban <strong>{user.name}</strong> from accessing the system.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <Label htmlFor="banReason" className="text-white">
                  Ban Reason
                </Label>
                <Input
                  id="banReason"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Enter reason for ban (optional)"
                  className="bg-black border border-dashed border-white/20 text-white rounded-none"
                />
              </div>

              <div>
                <Label htmlFor="banExpires" className="text-white">
                  Ban Duration (seconds)
                </Label>
                <Input
                  id="banExpires"
                  type="number"
                  value={banExpiresIn || ''}
                  onChange={(e) =>
                    setBanExpiresIn(e.target.value ? Number(e.target.value) : undefined)
                  }
                  placeholder="Leave empty for permanent ban"
                  className="bg-black border border-dashed border-white/20 text-white rounded-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Examples: 3600 (1 hour), 86400 (1 day), 604800 (1 week)
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBanModal(false);
                  setBanReason('');
                  setBanExpiresIn(undefined);
                }}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBanUser}
                className="bg-red-600 text-white hover:bg-red-700 rounded-none"
              >
                Ban User
              </Button>
            </div>
          </div>
        </div>
      )}

      {showUnbanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black border border-green-400/20 rounded-none p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Unban User</h2>
            <p className="text-gray-400 mb-6">
              Are you sure you want to unban <strong>{user.name}</strong>? This will restore their
              access to the system.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowUnbanModal(false)}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUnbanUser}
                className="bg-green-400 text-white hover:bg-green-700 rounded-none"
              >
                Unban User
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Session Seed Modal */}
      {showSessionSeedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/90 border border-dashed border-white/20 p-6 w-full max-w-2xl rounded-none">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg text-white font-light">Seed Sessions</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSessionSeedModal(false)}
                className="text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-white" />
                  <h4 className="text-white font-light">Create Sessions for {user?.name}</h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="session-count" className="text-sm text-gray-400 font-light">
                      Number of sessions
                    </Label>
                    <Input
                      id="session-count"
                      type="number"
                      min="1"
                      max="50"
                      defaultValue="3"
                      className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Each session will have a unique token, IP address, and 7-day expiration.
                  </p>
                </div>
              </div>

              {seedingLogs.length > 0 && (
                <div className="mt-6">
                  <Terminal
                    title="Session Seeding Terminal"
                    lines={seedingLogs}
                    isRunning={isSeeding}
                    className="w-full"
                    defaultCollapsed={false}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2 mt-6 pt-6 border-t border-dashed border-white/10">
              <Button
                variant="outline"
                onClick={() => setShowSessionSeedModal(false)}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const count = parseInt(
                    (document.getElementById('session-count') as HTMLInputElement)?.value || '3',
                    10
                  );
                  handleSeedSessions(count);
                }}
                disabled={isSeeding}
                className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none disabled:opacity-50"
              >
                {isSeeding ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Seeding...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Seed Sessions
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
