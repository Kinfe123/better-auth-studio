import { Clock1, Edit, Link2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { CopyableId } from '../components/CopyableId';
import {
  Ban,
  Building2,
  Calendar,
  Database,
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
} from '../components/PixelIcons';
import { MoreVertical, Shield, Trash2 } from 'lucide-react';
import { Terminal } from '../components/Terminal';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

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
  phoneNumber?: string;
  username?: string;
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
  organizationSlug?: string;
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

interface UserAccount {
  id: string;
  providerId: string;
  email?: string | null;
  image?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export default function UserDetails() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationMembership[]>([]);
  const [teams, setTeams] = useState<TeamMembership[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'details' | 'organizations' | 'teams' | 'sessions' | 'accounts'
  >('details');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [showSessionSeedModal, setShowSessionSeedModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [banExpiresIn, setBanExpiresIn] = useState<number | undefined>();
  const [adminPluginEnabled, setAdminPluginEnabled] = useState(false);
  const [editRole, setEditRole] = useState<string>('');
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
  const sessionLocationsRef = useRef<Record<string, LocationData>>({});

  const checkAdminPlugin = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/status');
      const data = await response.json();
      setAdminPluginEnabled(data.enabled);
    } catch (_error) {
      setAdminPluginEnabled(false);
    }
  }, []);

  const resolveIPLocation = useCallback(async (ipAddress: string): Promise<LocationData | null> => {
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
  }, []);

  const resolveSessionLocations = useCallback(
    async (sessions: Session[]) => {
      const pendingSessions = sessions.filter(
        (session) => !sessionLocationsRef.current[session.id]
      );
      if (pendingSessions.length === 0) {
        return;
      }

      const results = await Promise.all(
        pendingSessions.map(async (session) => {
          const location = await resolveIPLocation(session.ipAddress);
          if (location) {
            return { sessionId: session.id, location };
          }
          return null;
        })
      );

      const updates: Record<string, LocationData> = {};
      results.forEach((result) => {
        if (result) {
          updates[result.sessionId] = result.location;
        }
      });

      if (Object.keys(updates).length > 0) {
        sessionLocationsRef.current = { ...sessionLocationsRef.current, ...updates };
        setSessionLocations(sessionLocationsRef.current);
      }
    },
    [resolveIPLocation]
  );

  const getCountryFlag = (countryCode: string): string => {
    if (!countryCode) return '🌍';

    // Convert country code to flag emoji
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const formatProviderName = (providerId?: string) => {
    if (!providerId) return 'Unknown Provider';
    return providerId
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return 'Unknown';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
  }, [
    userId, // Resolve locations for sessions
    resolveSessionLocations,
  ]);

  const fetchUserAccounts = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${userId}/accounts`);
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
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
        body: JSON.stringify({ name, email, role: editRole || null }),
      });

      const result = await response.json();

      if (result.success) {
        setUser({ ...user, name, email, role: editRole || undefined });
        setShowEditModal(false);
        setEditRole('');
        toast.success('User updated successfully!', { id: toastId });
      } else {
        toast.error(`Error updating user: ${result.error || 'Unknown error'}`, { id: toastId });
      }
    } catch (_error) {
      toast.error('Error updating user', { id: toastId });
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;

    const toastId = toast.loading('Deleting user...');
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (result.success) {
        toast.success('User deleted successfully!', { id: toastId });
        navigate('/users');
      } else {
        toast.error(`Error deleting user: ${result.error || 'Unknown error'}`, { id: toastId });
      }
    } catch (_error) {
      toast.error('Error deleting user', { id: toastId });
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
        fetchUserMemberships();
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
        fetchUserMemberships();
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

  const handleUnlinkAccount = async (accountId: string) => {
    if (!userId) return;
    const toastId = toast.loading('Unlinking account...');
    try {
      const response = await fetch(`/api/users/${userId}/accounts/${accountId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setAccounts((prev) => prev.filter((account) => account.id !== accountId));
        toast.success('Account unlinked successfully', { id: toastId });
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to unlink account', { id: toastId });
      }
    } catch (_error) {
      toast.error('Failed to unlink account', { id: toastId });
    }
  };
  useEffect(() => {
    if (userId) {
      fetchUserDetails();
      fetchUserMemberships();
      fetchUserAccounts();
      checkAdminPlugin();
    }
  }, [userId, checkAdminPlugin, fetchUserDetails, fetchUserMemberships, fetchUserAccounts]);

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
    <div className="space-y-6 p-6 bg-black w-full">
      <div className="w-full flex flex-col">
        <span className="mb-4 ml-0 flex justify-start items-start text-left border-none text-white">
          <span className="font-light">
            <span
              onClick={() => navigate('/users')}
              className="uppercase cursor-pointer text-white/80 font-mono text-sm"
            >
              users /{' '}
            </span>
            <span className="text-white font-mono text-sm">{user.id}</span>
          </span>
        </span>
        <div className="mb-8 mt-4">
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
                <h1 className="text-3xl font-light text-white inline-flex items-center">
                  {user.name}
                  <CopyableId
                    id={user.id}
                    variant="subscript"
                  />
                  {user.role && (
                    <sup className="ml-2 px-2 pt-2 pb-2 -mt-1 py-0.5 text-[10px] font-mono uppercase border border-dashed border-white/15 bg-white/5 text-white/80 rounded-none">
                      {user.role}
                    </sup>
                  )}
                  {user.banned && (
                    <sup className="ml-2 px-2 pt-2 pb-2 -mt-1 py-0.5 text-[10px] font-mono uppercase border border-dashed border-red-500/30 bg-red-500/10 text-red-400/80 rounded-none">
                      Banned
                    </sup>
                  )}

                </h1>
                <p className="text-gray-400 font-mono text-sm">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white rounded-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActionMenuOpen(!actionMenuOpen);
                  }}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>

                {actionMenuOpen && (
                  <div
                    className="absolute z-[999] right-0 top-full mt-1 w-48 bg-black border border-white/20 rounded-none shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center space-x-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionMenuOpen(false);
                        setShowEditModal(true);
                        setEditRole(user.role || '');
                      }}
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit User</span>
                    </button>
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center space-x-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionMenuOpen(false);
                        setShowPasswordModal(true);
                      }}
                    >
                      <Shield className="w-4 h-4" />
                      <span>Update Password</span>
                    </button>
                    {adminPluginEnabled &&
                      (user.banned ? (
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-green-400 hover:bg-white/10 flex items-center space-x-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionMenuOpen(false);
                            setShowUnbanModal(true);
                          }}
                        >
                          <Ban className="w-4 h-4" />
                          <span>Unban User</span>
                        </button>
                      ) : (
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-yellow-400 hover:bg-white/10 flex items-center space-x-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionMenuOpen(false);
                            setShowBanModal(true);
                          }}
                        >
                          <Ban className="w-4 h-4" />
                          <span>Ban User</span>
                        </button>
                      ))}
                    <div className="border-t border-white/10 my-1"></div>
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/10 flex items-center space-x-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionMenuOpen(false);
                        setShowDeleteModal(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete User</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border border-dashed border-white/20 rounded-none">
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
                { id: 'accounts', name: 'Accounts', icon: Link2, count: accounts.length },
                { id: 'sessions', name: 'Sessions', icon: Clock1, count: sessions.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${activeTab === tab.id
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-white/50'
                    }`}
                >
                  <tab.icon className="w-4 h-4 text-white/90" />
                  <span className="inline-flex items-start">
                    <span className="">{tab.name}</span>
                    {tab.count !== undefined && (
                      <sup className="text-xs text-gray-500 ml-1 inline-flex items-baseline">
                        <AnimatedNumber
                          value={tab.count}
                          className="text-white/80 font-mono text-xs"
                          prefix={<span className="mr-0.5 text-gray-500">[</span>}
                          suffix={<span className="ml-0.5 text-gray-500">]</span>}
                          format={{ notation: 'standard', maximumFractionDigits: 0 }}
                        />
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
                        <div className="text-xs uppercase font-mono text-gray-500 mb-1">
                          Name
                        </div>
                        <div className="text-white font-sans text-sm">
                          {user.name}
                        </div>
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
                          <div className="text-xs uppercase font-mono text-gray-500 mb-1">
                            Username
                          </div>
                          <div className="text-white font-mono text-sm">{user.username}</div>
                        </div>
                      </div>
                    )}
                    {user.phoneNumber && (
                      <div className="flex items-start space-x-3">
                        <Phone className="w-4 h-4 text-gray-400 mt-1" />
                        <div className="flex-1">
                          <div className="text-xs uppercase font-mono text-gray-500 mb-1">
                            Phone
                          </div>
                          <div className="text-white font-mono text-sm">+251 91 234 5678</div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start space-x-3">
                      <Calendar className="w-4 h-4 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <div className="text-xs uppercase font-mono text-gray-500 mb-1">
                          Member Since
                        </div>
                        <div className="text-white font-mono text-sm">
                          {new Date(user.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
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
                          <div className="text-xs uppercase font-mono text-gray-500">
                            Email Verification
                          </div>
                        </div>
                      </div>
                      <div
                        className={`px-2 rounded-none py-1 text-xs font-mono ${user.emailVerified ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                      >
                        {user.emailVerified ? 'Verified' : 'Unverified'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-black/30 border border-white/5 rounded-none">
                      <div className="flex items-center space-x-3">
                        <Database className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-xs uppercase font-mono text-gray-500">
                            Two-Factor Authentication
                          </div>
                        </div>
                      </div>
                      <div
                        className={`px-2 rounded-none py-1 text-xs font-mono ${user.twoFactorEnabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                      >
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
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="w-12 h-12 bg-black/80 border border-dashed border-white/20 flex items-center justify-center rounded-none">
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
                            <div className="flex-1">
                              <h3 className="text-white font-light inline-flex items-start">
                                {membership.organization.name}
                                <sup className="text-xs text-gray-500 ml-2 mt-0.5">
                                  <span className="mr-1">[</span>
                                  <span className="text-white/80 font-mono text-xs">
                                    {membership.organization.slug}
                                  </span>
                                  <span className="ml-1">]</span>
                                </sup>
                              </h3>
                              <p className="text-gray-400 text-sm font-sans mt-1">
                                in {membership.organization.slug}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500 font-mono text-xs uppercase">
                                Joined:{' '}
                              </span>
                              <span className="text-white font-mono text-xs">
                                {new Date(membership.joinedAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                                ,{' '}
                                {new Date(membership.joinedAt).toLocaleTimeString('en-US', {
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
                            onClick={() => handleRemoveFromOrganization(membership.id)}
                            className="border border-dashed border-red-400/20 text-red-400 hover:bg-red-400/10 rounded-none"
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
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="w-12 h-12 bg-black/80 border border-dashed border-white/20 flex items-center justify-center rounded-none">
                              <Users className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-white font-light inline-flex items-start">
                                {membership.team.name}
                                <sup className="text-xs text-gray-500 ml-2 mt-0.5">
                                  <span className="mr-1">[</span>
                                  <span className="text-white/80 font-mono text-xs">
                                    {membership.team.organizationSlug ||
                                      membership.team.organizationName}
                                  </span>
                                  <span className="ml-1">]</span>
                                </sup>
                              </h3>
                              <p className="text-gray-400 text-sm font-sans mt-1">
                                in{' '}
                                {membership.team.organizationSlug ||
                                  membership.team.organizationName}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500 font-mono text-xs uppercase">
                                Joined:{' '}
                              </span>
                              <span className="text-white font-mono text-xs">
                                {new Date(membership.joinedAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                                ,{' '}
                                {new Date(membership.joinedAt).toLocaleTimeString('en-US', {
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
                            onClick={() => handleRemoveFromTeam(membership.id)}
                            className="border border-dashed border-red-400/20 text-red-400 hover:bg-red-400/10 rounded-none"
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

            {activeTab === 'accounts' && (
              <div className="space-y-4">
                {accounts.length === 0 ? (
                  <div className="text-center py-12">
                    <Link2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Linked Accounts</h3>
                    <p className="text-gray-400">
                      This user has not connected any accounts yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {accounts.map((account) => (
                      <div
                        key={account.id}
                        className="border border-dashed border-white/10 rounded-none p-4 hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="w-12 h-12 bg-black/80 border border-dashed border-white/20 flex items-center justify-center rounded-none">
                              <Link2 className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-white font-light inline-flex items-start">
                                {formatProviderName(account.providerId)}
                                <CopyableId id={account.email || user.email || `Account ID: ${account.id}`} variant="subscript" nonSliced={account.email || user.email ? true : false} />
                                {/* <sup className="text-xs text-gray-500 ml-2 mt-0.5">
                                  <span className="mr-1">[</span>
                                  <span className="text-white/80 font-mono text-xs">
                                    {account.email || user.email || `Account ID: ${account.id}`}
                                  </span>
                                  <span className="ml-1">]</span>
                                </sup> */}
                              </h3>
                              <p className="text-gray-400 tracking-tight uppercase text-xs font-mono mt-1">
                                {`ID: ${account.id}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2 text-right">
                            <div className="flex items-center space-x-2 text-xs font-mono text-gray-400">
                              <span>Linked:</span>
                              <span className="text-white">
                                {formatDateTime(account.createdAt || account.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnlinkAccount(account.id)}
                            className="border border-dashed border-red-400/20 text-red-400 hover:bg-red-400/10 rounded-none"
                          >
                            <UserMinus className="w-4 h-4 mr-1" />
                            Unlink
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
                    <Clock1 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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
                                  <span className="mr-1">[</span>
                                  <span className="text-white/80 font-mono text-xs">
                                    {session.ipAddress}
                                  </span>
                                  <span className="ml-1">]</span>
                                </sup>
                              </h3>
                              <div className="flex items-center space-x-2 mt-2">
                                <Globe className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-gray-400 uppercase font-mono text-xs">
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
                              <span className="text-gray-500 font-mono text-xs uppercase">
                                Expires:{' '}
                              </span>
                              <span className="text-white font-mono text-xs">
                                {new Date(session.expiresAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                                ,{' '}
                                {new Date(session.expiresAt).toLocaleTimeString('en-US', {
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
                onClick={() => {
                  setShowEditModal(false);
                  setEditRole('');
                }}
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
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Role</label>
                <Select className="bg-black text-white" value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger className="w-full border border-dashed border-white/20 bg-black text-white rounded-none">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditRole('');
                }}
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

      {/* Delete User Modal */}
      {showDeleteModal && user && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/90 border border-dashed border-white/20 p-6 w-full max-w-md rounded-none">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light">Delete User</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 bg-black/80 border border-dashed border-white/20 flex items-center justify-center">
                  {user.image ? (
                    <img src={user.image} alt={user.name} className="w-16 h-16 object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-white" />
                  )}
                </div>
                <div>
                  <div className="text-white font-light">{user.name}</div>
                  <div className="text-sm text-gray-400">{user.email}</div>
                </div>
              </div>
              <p className="text-gray-400">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteUser}
                className="bg-red-500 hover:bg-red-600 text-white border border-red-500 rounded-none"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Password Update Modal */}
      {showPasswordModal && user && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/90 border border-dashed border-white/20 p-6 w-full max-w-md rounded-none">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light">Update Password</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-password" className="text-sm text-gray-400 font-light">
                  New Password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowPasswordModal(false)}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  const password = (document.getElementById('new-password') as HTMLInputElement)?.value;
                  if (!password) {
                    toast.error('Please enter a password');
                    return;
                  }
                  const toastId = toast.loading('Updating password...');
                  try {
                    const response = await fetch(`/api/users/${userId}/password`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ password }),
                    });
                    const result = await response.json();
                    if (result.success) {
                      setShowPasswordModal(false);
                      (document.getElementById('new-password') as HTMLInputElement).value = '';
                      toast.success('Password updated successfully!', { id: toastId });
                    } else {
                      toast.error(`Error updating password: ${result.error || 'Unknown error'}`, { id: toastId });
                    }
                  } catch (_error) {
                    toast.error('Error updating password', { id: toastId });
                  }
                }}
                className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none"
              >
                Update
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Session Seed Modal */}
      {showSessionSeedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="overflow-x-hidden bg-black/90 border border-white/10 p-6 w-full pt-4 max-w-2xl rounded-none">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm text-white flex items-center justify-center font-light uppercase">
                <span className="text-white/50 mr-2">[</span>
                <Monitor className="inline mr-2 w-3 h-3 text-white" />
                <span className="font-mono text-white/70 uppercase">Seed Sessions</span>
                <span className="text-white/50 ml-2">]</span>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSessionSeedModal(false)}
                className="text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <hr className="border-white/10 -mx-10 border-dashed -mt-4 mb-4" />
            <div className="space-y-6">
              {/* Session Seeding */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
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
                  <Button
                    onClick={() => {
                      const count = parseInt(
                        (document.getElementById('session-count') as HTMLInputElement)?.value ||
                        '3',
                        10
                      );
                      handleSeedSessions(count);
                    }}
                    disabled={isSeeding}
                    className="bg-transparent hover:bg-white/90 bg-white text-black border border-white/20 rounded-none mt-6 disabled:opacity-50"
                  >
                    {isSeeding ? (
                      <>
                        <Loader className="w-3 h-3 mr-2 animate-spin" />
                        Seeding...
                      </>
                    ) : (
                      <>
                        <Database className="w-3 h-3 mr-2" />
                        Seed Sessions
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {seedingLogs.length > 0 && (
                <div className="mt-6">
                  <Terminal
                    title="Session Seeding Terminal"
                    lines={seedingLogs}
                    isRunning={isSeeding}
                    className="w-full"
                    defaultCollapsed={true}
                  />
                </div>
              )}
            </div>
            <hr className="border-white/10 -mx-10 border-dashed mt-10" />
            <div className="flex justify-end mt-6 pt-6">
              <Button
                variant="outline"
                onClick={() => setShowSessionSeedModal(false)}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
