import { ArrowUpRight, Clock1, Edit, Link2, MoreVertical, Shield, Trash2, XCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { CopyableId } from '../components/CopyableId';
import {
  Ban,
  Building2,
  Calendar,
  Check,
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
import { Terminal } from '../components/Terminal';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { getProviderIcon } from '../lib/icons';

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
  accountId: string;
  email?: string | null;
  image?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'expired';
  organizationId: string;
  organizationName: string;
  teamId?: string;
  teamName?: string;
  inviterId: string;
  expiresAt: string;
  createdAt: string;
}

export default function UserDetails() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationMembership[]>([]);
  const [teams, setTeams] = useState<TeamMembership[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'details' | 'organizations' | 'teams' | 'sessions' | 'accounts' | 'invitations'
  >('details');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [showSessionSeedModal, setShowSessionSeedModal] = useState(false);
  const [showAccountSeedModal, setShowAccountSeedModal] = useState(false);
  const [accountSeedProvider, setAccountSeedProvider] = useState<string>('random');
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
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBanning, setIsBanning] = useState(false);
  const [isUnbanning, setIsUnbanning] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
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
    return providerId.replace(/[_-]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
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
        resolveSessionLocations(sessions);
      }
    } catch (_error) { }
  }, [userId, resolveSessionLocations]);

  const fetchUserAccounts = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${userId}/accounts`);
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      }
    } catch (_error) { }
  }, [userId]);

  const fetchUserInvitations = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${userId}/invitations`);
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations || []);
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

    setIsUpdating(true);
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
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;

    setIsDeleting(true);
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
    } finally {
      setIsDeleting(false);
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

    setIsBanning(true);
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
    } finally {
      setIsBanning(false);
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

    setIsUnbanning(true);
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
    } finally {
      setIsUnbanning(false);
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
      const data = await response.json();
      if (response.ok && data.success) {
        // Remove the account from the list immediately
        setAccounts((prev) => prev.filter((account) => account.id !== accountId));
        // Also refresh the accounts list to ensure consistency
        await fetchUserAccounts();
        toast.success('Account unlinked successfully', { id: toastId });
      } else {
        toast.error(data.error || 'Failed to unlink account', { id: toastId });
      }
    } catch (error) {
      toast.error('Failed to unlink account', { id: toastId });
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    if (!userId) return;
    const toastId = toast.loading('Accepting invitation...');
    try {
      const response = await fetch(`/api/invitations/${invitationId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        await fetchUserInvitations();
        await fetchUserMemberships(); // Refresh memberships
        toast.success('Invitation accepted successfully', { id: toastId });
      } else {
        toast.error(data.error || 'Failed to accept invitation', { id: toastId });
      }
    } catch (error) {
      toast.error('Failed to accept invitation', { id: toastId });
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    const toastId = toast.loading('Rejecting invitation...');
    try {
      const response = await fetch(`/api/invitations/${invitationId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        await fetchUserInvitations();
        toast.success('Invitation rejected successfully', { id: toastId });
      } else {
        toast.error(data.error || 'Failed to reject invitation', { id: toastId });
      }
    } catch (error) {
      toast.error('Failed to reject invitation', { id: toastId });
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    const toastId = toast.loading('Cancelling invitation...');
    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (response.ok && data.success) {
        await fetchUserInvitations();
        toast.success('Invitation cancelled successfully', { id: toastId });
      } else {
        toast.error(data.error || 'Failed to cancel invitation', { id: toastId });
      }
    } catch (error) {
      toast.error('Failed to cancel invitation', { id: toastId });
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
      fetchUserMemberships();
      fetchUserAccounts();
      fetchUserInvitations();
      checkAdminPlugin();
    }
  }, [userId, checkAdminPlugin, fetchUserDetails, fetchUserMemberships, fetchUserAccounts, fetchUserInvitations]);

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

  const handleSeedAccounts = async (count: number = 3, providerId: string = 'random') => {
    if (!userId) return;

    setSeedingLogs([]);
    setIsSeeding(true);

    setSeedingLogs([
      {
        id: 'start',
        type: 'info',
        message: `Starting account seeding process for ${count} accounts...`,
        timestamp: new Date(),
      },
    ]);

    try {
      const response = await fetch(`/api/users/${userId}/seed-accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count, providerId }),
      });

      const result = await response.json();

      if (result.success) {
        const progressLogs = result.results.map((r: any, index: number) => {
          if (r.success) {
            return {
              id: `account-${index}`,
              type: 'progress' as const,
              message: `Creating account ${index + 1}: ${r.account.providerId || r.account.provider} (${r.account.accountId?.substring(0, 20) || r.account.id.substring(0, 20)}...)`,
              timestamp: new Date(),
              status: 'completed' as const,
            };
          } else {
            return {
              id: `account-${index}`,
              type: 'error' as const,
              message: `Failed to create account ${index + 1}: ${r.error}`,
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
            message: `✅ Account seeding completed! Created ${successCount}/${count} accounts successfully`,
            timestamp: new Date(),
          },
        ]);

        // Refresh accounts data
        fetchUserAccounts();
      } else {
        setSeedingLogs((prev) => [
          ...prev,
          {
            id: 'error',
            type: 'error',
            message: `❌ Account seeding failed: ${result.error || 'Unknown error'}`,
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
                  <CopyableId id={user.id} nonSliced={true} variant="subscript" />
                  {user.role && (
                    <sup className="ml-2 px-2 pt-2 pb-2 -mt-1 py-0.5 text-[10px] font-mono uppercase border border-dashed border-white/15 bg-white/5 text-white/80 rounded-none">
                      {user.role}
                    </sup>
                  )}
                  {user.banned && (
                    <sup className="relative group inline-block ml-2 px-2 pt-2 pb-2 -mt-1 py-0.5 text-[10px] font-mono uppercase border border-dashed border-red-500/30 bg-red-500/10 text-red-400/80 rounded-none cursor-help">
                      Banned
                      {user.banReason && (
                        <span className="absolute lowercase left-1/2 -translate-x-1/2 bottom-full mb-3 px-2 py-2 text-[10px] font-mono text-gray-300 bg-black border border-dashed border-white/20 rounded-none whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none z-50">
                          <span className="text-gray-400 font-mono text-xs uppercase mr-1">
                            Banned Reason:
                          </span>

                          {user.banReason}
                          <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-transparent border-t-white/20"></span>
                        </span>
                      )}
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
                      className="w-full px-4 py-2 text-left text-[11px] text-white/70 hover:bg-white/10 flex items-center justify-between font-mono uppercase tracking-tight group"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionMenuOpen(false);
                        setShowEditModal(true);
                        setEditRole(user.role || '');
                      }}
                    >
                      <span>Edit User</span>
                      <Edit className="w-3 h-3 text-white/10 group-hover:text-white/70 transition-colors" />
                    </button>
                    <button
                      className="w-full px-4 py-2 text-left text-[11px] text-white/70 hover:bg-white/10 flex items-center justify-between font-mono uppercase tracking-tight group"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionMenuOpen(false);
                        setShowPasswordModal(true);
                      }}
                    >
                      <span>Update Password</span>
                      <Shield className="w-3 h-3 text-white/10 group-hover:text-white/70 transition-colors" />
                    </button>
                    {adminPluginEnabled &&
                      (user.banned ? (
                        <button
                          className="w-full px-4 py-2 text-left text-[11px] text-green-400 hover:bg-white/10 flex items-center justify-between font-mono uppercase tracking-tight group"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionMenuOpen(false);
                            setShowUnbanModal(true);
                          }}
                        >
                          <span>Unban User</span>
                          <Ban className="w-3 h-3 text-green-400/10 group-hover:text-green-400/70 transition-colors" />
                        </button>
                      ) : (
                        <button
                          className="w-full px-4 py-2 text-left text-[11px] text-yellow-400 hover:bg-white/10 flex items-center justify-between font-mono uppercase tracking-tight group"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionMenuOpen(false);
                            setShowBanModal(true);
                          }}
                        >
                          <span>Ban User</span>
                          <Ban className="w-3 h-3 text-yellow-400/10 group-hover:text-yellow-400/70 transition-colors" />
                        </button>
                      ))}
                    <div className="flex flex-col items-center justify-center">
                      <hr className="w-[calc(100%)] border-white/10 h-px" />
                      <div className="relative z-20 h-2 w-[calc(100%)] mx-auto -translate-x-1/2 left-1/2 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[7%]" />
                      <hr className="w-[calc(100%)] border-white/10 h-px" />
                    </div>
                    <button
                      className="w-full px-4 py-2 text-left text-[11px] text-red-400 hover:bg-white/10 flex items-center justify-between font-mono uppercase tracking-tight group"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionMenuOpen(false);
                        setShowDeleteModal(true);
                      }}
                    >
                      <span>Delete User</span>
                      <Trash2 className="w-3 h-3 text-red-400/10 group-hover:text-red-400/70 transition-colors" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border border-dashed border-white/20 rounded-none">
          <div className="border-b border-dashed border-white/20">
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
                { id: 'invitations', name: 'Invitations', icon: Mail, count: invitations.length },
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
                    <span className="font-mono uppercase text-xs font-normal">{tab.name}</span>
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
                        <div className="text-xs uppercase font-mono text-gray-500 mb-1">Name</div>
                        <div className="text-white font-sans text-sm">{user.name}</div>
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
                    <div className="flex items-center justify-between p-3 bg-black/30 border border-white/10 rounded-none">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-xs uppercase font-mono text-gray-500">
                            Email Verification
                          </div>
                        </div>
                      </div>
                      <div
                        className={`px-2 rounded-none border border-dashed border-white/20 uppercase py-1 text-xs font-mono ${user.emailVerified ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                      >
                        {user.emailVerified ? 'Verified' : 'Unverified'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-black/30 border border-white/10 rounded-none">
                      <div className="flex items-center space-x-3">
                        <Database className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-xs uppercase font-mono text-gray-500">
                            Two-Factor Authentication
                          </div>
                        </div>
                      </div>
                      <div
                        className={`px-2 rounded-none border border-dashed border-white/20 uppercase py-1 text-xs font-mono ${user.twoFactorEnabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
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
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg relative text-white font-light inline-flex items-start">
                      Organizations
                      <sup className="text-xs text-gray-500 ml-1 mt-0">
                        <span className="mr-1">[</span>
                        <span className="text-white font-mono text-xs">{organizations.length}</span>
                        <span className="ml-1">]</span>
                      </sup>
                    </h3>
                    <p className="text-gray-400 font-light font-mono text-xs uppercase mt-1">
                      Organizations this user belongs to
                    </p>
                  </div>
                </div>
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
                              <p className="text-gray-400 text-sm font-sans mt-1 flex items-center gap-2">
                                <span>in {membership.organization.slug}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/organizations/${membership.organization.id}`);
                                  }}
                                  className="text-white/60 hover:text-white transition-colors"
                                  title="View organization details"
                                >
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </button>
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
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg relative text-white font-light inline-flex items-start">
                      Teams
                      <sup className="text-xs text-gray-500 ml-1 mt-0">
                        <span className="mr-1">[</span>
                        <span className="text-white font-mono text-xs">{teams.length}</span>
                        <span className="ml-1">]</span>
                      </sup>
                    </h3>
                    <p className="text-gray-400 font-light font-mono text-xs uppercase mt-1">
                      Teams this user belongs to
                    </p>
                  </div>
                </div>
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
                                <CopyableId
                                  id={membership.team.id}
                                  variant="subscript"
                                  nonSliced={
                                    membership.team.organizationSlug ||
                                      membership.team.organizationName
                                      ? true
                                      : false
                                  }
                                />
                              </h3>
                              <p className="text-gray-400 text-sm font-sans mt-1 flex items-center gap-2">
                                <span>
                                  in{' '}
                                  {membership.team.organizationSlug ||
                                    membership.team.organizationName}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (membership.team.organizationId) {
                                      navigate(
                                        `/organizations/${membership.team.organizationId}/teams/${membership.team.id}`
                                      );
                                    } else {
                                      navigate(`/teams/${membership.team.id}`);
                                    }
                                  }}
                                  className="text-white/60 hover:text-white transition-colors"
                                  title="View team details"
                                >
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </button>
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
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg relative text-white font-light inline-flex items-start">
                      Linked Accounts
                      <sup className="text-xs text-gray-500 ml-1 mt-0">
                        <span className="mr-1">[</span>
                        <span className="text-white font-mono text-xs">{accounts.length}</span>
                        <span className="ml-1">]</span>
                      </sup>
                    </h3>
                    <p className="text-gray-400 font-light font-mono text-xs uppercase mt-1">
                      Manage user OAuth account connections
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSeedingLogs([]);
                      setIsSeeding(false);
                      setShowAccountSeedModal(true);
                    }}
                    className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
                  >
                    <Link2 className="w-4 h-4 mr-2" />
                    Seed Accounts
                  </Button>
                </div>
                {accounts.length === 0 ? (
                  <div className="text-center py-12">
                    <Link2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Linked Accounts</h3>
                    <p className="text-gray-400">This user has not connected any accounts yet.</p>
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
                              {getProviderIcon(account.providerId)}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-white font-light inline-flex items-start">
                                {formatProviderName(account.providerId)}
                                <CopyableId
                                  id={account.accountId}
                                  variant="subscript"
                                  nonSliced={account.email || user.email ? true : false}
                                />
                              </h3>
                              <p className="text-gray-400 tracking-tight uppercase text-xs font-mono mt-1">
                                {`ID: ${account.id}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2 text-right">
                            <div className="flex items-center space-x-2 text-xs font-mono text-gray-400">
                              <span className="uppercase">Linked:</span>
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
                    <h3 className="text-lg relative text-white font-light inline-flex items-start">
                      Sessions
                      <sup className="text-xs text-gray-500 ml-1 mt-0">
                        <span className="mr-1">[</span>
                        <span className="text-white font-mono text-xs">{sessions.length}</span>
                        <span className="ml-1">]</span>
                      </sup>
                    </h3>
                    <p className="text-gray-400 font-light font-mono text-xs uppercase mt-1">
                      Manage user authentication sessions
                    </p>
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
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-500 font-mono text-xs uppercase">
                                  Created:{' '}
                                </span>
                                <span className="text-white font-mono text-xs">
                                  {new Date(session.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                  ,{' '}
                                  {new Date(session.createdAt).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true,
                                  })}
                                </span>
                              </div>
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

            {activeTab === 'invitations' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg relative text-white font-light inline-flex items-start">
                      Invitations
                      <sup className="text-xs text-gray-500 ml-1 mt-0">
                        <span className="mr-1">[</span>
                        <span className="text-white font-mono text-xs">{invitations.length}</span>
                        <span className="ml-1">]</span>
                      </sup>
                    </h3>
                    <p className="text-gray-400 font-light font-mono text-xs uppercase mt-1">
                      Manage user invitations
                    </p>
                  </div>
                </div>

                {invitations.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-white/10 rounded-none">
                    <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 font-mono text-xs uppercase">No invitations found</p>
                  </div>
                ) : (
                  <div className="border border-white/10 rounded-none overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10 bg-black/50">
                          <th className="text-left py-4 px-4 text-white font-mono uppercase text-xs">
                            Organization
                          </th>
                          <th className="text-left py-4 px-4 text-white font-mono uppercase text-xs">
                            Team
                          </th>
                          <th className="text-left py-4 px-4 text-white font-mono uppercase text-xs">
                            Role
                          </th>
                          <th className="text-left py-4 px-4 text-white font-mono uppercase text-xs">
                            Status
                          </th>
                          <th className="text-left py-4 px-4 text-white font-mono uppercase text-xs">
                            Expires
                          </th>
                          <th className="text-right py-4 px-4 text-white font-mono uppercase text-xs">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {invitations.map((invitation) => (
                          <tr
                            key={invitation.id}
                            className="border-b border-white/10 hover:bg-white/5 transition-colors"
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-2">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                <span className="text-white text-sm">{invitation.organizationName}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              {invitation.teamName ? (
                                <div className="flex items-center space-x-2">
                                  <Users className="w-4 h-4 text-gray-400" />
                                  <span className="text-white text-sm">{invitation.teamName}</span>
                                </div>
                              ) : (
                                <span className="text-gray-500 text-sm">—</span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-white/80 text-sm font-mono uppercase">
                                {invitation.role}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span
                                className={`text-xs font-mono uppercase px-2 border-dashed py-1 rounded-none ${
                                  invitation.status === 'accepted'
                                    ? 'bg-green-900/50 text-green-400 border border-green-500/30'
                                    : invitation.status === 'rejected' || invitation.status === 'cancelled'
                                      ? 'bg-red-900/50 text-red-400 border border-red-500/30'
                                      : invitation.status === 'expired'
                                        ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-500/30'
                                        : 'bg-blue-900/50 text-blue-400 border border-blue-500/30'
                                }`}
                              >
                                {invitation.status}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-gray-400 text-sm font-mono">
                                {new Date(invitation.expiresAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-end space-x-2">
                                {invitation.status === 'pending' && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleAcceptInvitation(invitation.id)}
                                      className="border border-dashed border-green-400/20 text-white hover:bg-green-400/10 hover:text-green-400  rounded-none font-mono uppercase text-xs tracking-tight"
                                    >
                                      <Check className="w-3.5 h-3.5 mr-1" />
                                      Accept
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleRejectInvitation(invitation.id)}
                                      className="border border-dashed border-red-400/20 text-red-400 hover:text-red-400 hover:bg-red-400/10 rounded-none font-mono uppercase text-xs tracking-tight"
                                    >
                                      <XCircle className="w-3.5 h-3.5 mr-1" />
                                      Reject
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleCancelInvitation(invitation.id)}
                                      className="border border-dashed border-yellow-400/20 text-white hover:text-yellow-400 hover:bg-yellow-400/10 rounded-none font-mono uppercase text-xs tracking-tight"
                                    >
                                      <X className="w-3.5 h-3.5 mr-1" />
                                      Cancel
                                    </Button>
                                  </>
                                )}
                                {(invitation.status === 'accepted' ||
                                  invitation.status === 'rejected' ||
                                  invitation.status === 'cancelled' ||
                                  invitation.status === 'expired') && (
                                  <span className="text-gray-500 text-xs font-mono uppercase">
                                    No actions available
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-black border border-white/15 rounded-none p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light uppercase font-mono">Edit User</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowEditModal(false);
                  setEditRole('');
                }}
                className="text-gray-400 -mt-2 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-col items-center justify-center mt-2">
              <hr className="w-[calc(100%+3rem)] border-white/10 h-px" />
              <div className="relative z-20 h-4 w-[calc(100%+3rem)] mx-auto -translate-x-1/2 left-1/2 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[7%]" />
              <hr className="w-[calc(100%+3rem)] border-white/10 h-px" />
            </div>

            <div className="space-y-4 mt-4">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 rounded-none border border-dashed border-white/15 bg-white/10 flex items-center justify-center overflow-hidden">
                  {user?.image ? (
                    <img src={user.image} alt={user.name} className="w-14 h-14 object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-white" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="text-white font-medium leading-tight flex items-center gap-2">
                    <span>{user?.name}</span>
                    <CopyableId id={user?.id || ''} variant="subscript" nonSliced={true} />
                  </div>
                  <div className="text-sm text-gray-400">{user?.email}</div>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-name" className="text-xs text-white/80 font-mono uppercase">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  defaultValue={user?.name || ''}
                  placeholder="e.g. John Doe"
                  disabled={isUpdating}
                  className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                />
              </div>
              <div>
                <Label htmlFor="edit-email" className="text-xs text-white/80 font-mono uppercase">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  defaultValue={user?.email || ''}
                  placeholder="e.g. john@example.com"
                  disabled={isUpdating}
                  className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                />
              </div>
              <div>
                <Label htmlFor="edit-role" className="text-xs text-white/80 font-mono uppercase">
                  Role
                </Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger
                    id="edit-role"
                    className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                    disabled={isUpdating}
                  >
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
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditRole('');
                }}
                disabled={isUpdating}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none font-mono uppercase text-xs tracking-tight"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditUser}
                disabled={isUpdating}
                className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none disabled:opacity-50 font-mono uppercase text-xs tracking-tight"
              >
                {isUpdating ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showBanModal && user && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-black border border-white/15 rounded-none p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light uppercase font-mono">Ban User</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowBanModal(false);
                  setBanReason('');
                  setBanExpiresIn(undefined);
                }}
                disabled={isBanning}
                className="text-gray-400 -mt-2 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-col items-center justify-center mt-2">
              <hr className="w-[calc(100%+3rem)] border-white/10 h-px" />
              <div className="relative z-20 h-4 w-[calc(100%+3rem)] mx-auto -translate-x-1/2 left-1/2 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[7%]" />
              <hr className="w-[calc(100%+3rem)] border-white/10 h-px" />
            </div>

            <div className="space-y-4 mt-4">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 rounded-none border border-dashed border-white/15 bg-white/10 flex items-center justify-center overflow-hidden">
                  {user.image ? (
                    <img src={user.image} alt={user.name} className="w-14 h-14 object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-white" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="text-white font-medium leading-tight flex items-center gap-2">
                    <span>{user.name}</span>
                    <CopyableId id={user.id} variant="subscript" nonSliced={true} />
                  </div>
                  <div className="text-sm text-gray-400">{user.email}</div>
                </div>
              </div>
              <div>
                <Label htmlFor="banReason" className="text-xs text-white/80 font-mono uppercase">
                  Ban Reason
                </Label>
                <Input
                  id="banReason"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Enter reason for ban (optional)"
                  disabled={isBanning}
                  className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                />
              </div>
              <div>
                <Label htmlFor="banExpires" className="text-xs text-white/80 font-mono uppercase">
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
                  disabled={isBanning}
                  className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                />
                <p className="text-xs text-gray-400 mt-1 font-mono">
                  Examples: 3600 (1 hour), 86400 (1 day), 604800 (1 week)
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBanModal(false);
                  setBanReason('');
                  setBanExpiresIn(undefined);
                }}
                disabled={isBanning}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none font-mono uppercase text-xs tracking-tight"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBanUser}
                disabled={isBanning}
                className="bg-red-600 hover:bg-red-700 text-white border border-red-600 rounded-none disabled:opacity-50 font-mono uppercase text-xs tracking-tight"
              >
                {isBanning ? 'Banning...' : 'Ban User'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showUnbanModal && user && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-black border border-white/15 rounded-none p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light uppercase font-mono">Unban User</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUnbanModal(false)}
                disabled={isUnbanning}
                className="text-gray-400 -mt-2 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-col items-center justify-center mt-2">
              <hr className="w-[calc(100%+3rem)] border-white/10 h-px" />
              <div className="relative z-20 h-4 w-[calc(100%+3rem)] mx-auto -translate-x-1/2 left-1/2 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[7%]" />
              <hr className="w-[calc(100%+3rem)] border-white/10 h-px" />
            </div>

            <div className="space-y-4 mt-4">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 rounded-none border border-dashed border-white/15 bg-white/10 flex items-center justify-center overflow-hidden">
                  {user.image ? (
                    <img src={user.image} alt={user.name} className="w-14 h-14 object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-white" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="text-white font-medium leading-tight flex items-center gap-2">
                    <span>{user.name}</span>
                    <CopyableId id={user.id} variant="subscript" nonSliced={true} />
                  </div>
                  <div className="text-sm text-gray-400">{user.email}</div>
                </div>
              </div>
              <p className="text-gray-400">
                Are you sure you want to unban this user? This will restore their access to the
                system.
              </p>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowUnbanModal(false)}
                disabled={isUnbanning}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none font-mono uppercase text-xs tracking-tight"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUnbanUser}
                disabled={isUnbanning}
                className="bg-green-400 hover:bg-green-500 text-white border border-green-400 rounded-none disabled:opacity-50 font-mono uppercase text-xs tracking-tight"
              >
                {isUnbanning ? 'Unbanning...' : 'Unban User'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && user && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-black border border-white/15 rounded-none p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light uppercase font-mono">Delete User</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 -mt-2 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-col items-center justify-center mt-2">
              <hr className="w-[calc(100%+3rem)] border-white/10 h-px" />
              <div className="relative z-20 h-4 w-[calc(100%+3rem)] mx-auto -translate-x-1/2 left-1/2 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[7%]" />
              <hr className="w-[calc(100%+3rem)] border-white/10 h-px" />
            </div>

            <div className="space-y-4 mt-4">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 rounded-none border border-dashed border-white/15 bg-white/10 flex items-center justify-center overflow-hidden">
                  {user.image ? (
                    <img src={user.image} alt={user.name} className="w-14 h-14 object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-white" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="text-white font-medium leading-tight flex items-center gap-2">
                    <span>{user.name}</span>
                    <CopyableId id={user.id} variant="subscript" nonSliced={true} />
                  </div>
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
                disabled={isDeleting}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none font-mono uppercase text-xs tracking-tight"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white border border-red-600 rounded-none disabled:opacity-50 font-mono uppercase text-xs tracking-tight"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Password Update Modal */}
      {showPasswordModal && user && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-black border border-white/15 rounded-none p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light uppercase font-mono">Update Password</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPasswordModal(false)}
                disabled={isUpdatingPassword}
                className="text-gray-400 -mt-2 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-col items-center justify-center mt-2">
              <hr className="w-[calc(100%+3rem)] border-white/10 h-px" />
              <div className="relative z-20 h-4 w-[calc(100%+3rem)] mx-auto -translate-x-1/2 left-1/2 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[7%]" />
              <hr className="w-[calc(100%+3rem)] border-white/10 h-px" />
            </div>

            <div className="space-y-4 mt-4">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 rounded-none border border-dashed border-white/15 bg-white/10 flex items-center justify-center overflow-hidden">
                  {user.image ? (
                    <img src={user.image} alt={user.name} className="w-14 h-14 object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-white" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="text-white font-medium leading-tight flex items-center gap-2">
                    <span>{user.name}</span>
                    <CopyableId id={user.id} variant="subscript" nonSliced={true} />
                  </div>
                  <div className="text-sm text-gray-400">{user.email}</div>
                </div>
              </div>
              <div>
                <Label htmlFor="new-password" className="text-xs text-white/80 font-mono uppercase">
                  New Password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  disabled={isUpdatingPassword}
                  className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowPasswordModal(false)}
                disabled={isUpdatingPassword}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none font-mono uppercase text-xs tracking-tight"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  const password = (document.getElementById('new-password') as HTMLInputElement)
                    ?.value;
                  if (!password) {
                    toast.error('Please enter a password');
                    return;
                  }
                  setIsUpdatingPassword(true);
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
                      toast.error(`Error updating password: ${result.error || 'Unknown error'}`, {
                        id: toastId,
                      });
                    }
                  } catch (_error) {
                    toast.error('Error updating password', { id: toastId });
                  } finally {
                    setIsUpdatingPassword(false);
                  }
                }}
                disabled={isUpdatingPassword}
                className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none disabled:opacity-50 font-mono uppercase text-xs tracking-tight"
              >
                {isUpdatingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Session Seed Modal */}
      {showSessionSeedModal && user && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-black border border-white/15 rounded-none p-6 w-full max-w-xl shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light uppercase font-mono">Seed Sessions</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSessionSeedModal(false)}
                disabled={isSeeding}
                className="text-gray-400 -mt-2 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-col items-center justify-center mt-2">
              <hr className="w-[calc(100%+3rem)] border-white/10 h-px" />
              <div className="relative z-20 h-4 w-[calc(100%+3rem)] mx-auto -translate-x-1/2 left-1/2 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[7%]" />
              <hr className="w-[calc(100%+3rem)] border-white/10 h-px" />
            </div>

            <div className="space-y-4 mt-4">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 rounded-none border border-dashed border-white/15 bg-white/10 flex items-center justify-center overflow-hidden">
                  {user.image ? (
                    <img src={user.image} alt={user.name} className="w-14 h-14 object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-white" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="text-white font-medium leading-tight flex items-center gap-2">
                    <span>{user.name}</span>
                    <CopyableId id={user.id} variant="subscript" nonSliced={true} />
                  </div>
                  <div className="text-sm text-gray-400">{user.email}</div>
                </div>
              </div>
              <div>
                <Label
                  htmlFor="session-count"
                  className="text-xs text-white/80 font-mono uppercase"
                >
                  Number of Sessions
                </Label>
                <Input
                  id="session-count"
                  type="number"
                  min="1"
                  max="50"
                  defaultValue="3"
                  disabled={isSeeding}
                  className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                />
              </div>
              {seedingLogs.length > 0 && (
                <div className="mt-4">
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

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowSessionSeedModal(false)}
                disabled={isSeeding}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none font-mono uppercase text-xs tracking-tight"
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
                className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none disabled:opacity-50 font-mono uppercase text-xs tracking-tight"
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
        </div>
      )}
      {showAccountSeedModal && user && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-black border border-white/15 rounded-none p-6 w-full max-w-xl shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light uppercase font-mono">Seed Accounts</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAccountSeedModal(false)}
                disabled={isSeeding}
                className="text-gray-400 -mt-2 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-col items-center justify-center mt-2">
              <hr className="w-[calc(100%+3rem)] border-white/10 h-px" />
              <div className="relative z-20 h-4 w-[calc(100%+3rem)] mx-auto -translate-x-1/2 left-1/2 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[7%]" />
              <hr className="w-[calc(100%+3rem)] border-white/10 h-px" />
            </div>

            <div className="space-y-4 mt-4">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 rounded-none border border-dashed border-white/15 bg-white/10 flex items-center justify-center overflow-hidden">
                  {user.image ? (
                    <img src={user.image} alt={user.name} className="w-14 h-14 object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-white" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="text-white font-medium leading-tight flex items-center gap-2">
                    <span>{user.name}</span>
                    <CopyableId id={user.id} variant="subscript" nonSliced={true} />
                  </div>
                  <div className="text-sm text-gray-400">{user.email}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="account-count"
                    className="text-xs text-white/80 font-mono uppercase"
                  >
                    Number of Accounts
                  </Label>
                  <Input
                    id="account-count"
                    type="number"
                    min="1"
                    max="50"
                    defaultValue="3"
                    disabled={isSeeding}
                    className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="account-provider"
                    className="text-xs text-white/80 font-mono uppercase"
                  >
                    Provider
                  </Label>
                  <Select value={accountSeedProvider} onValueChange={setAccountSeedProvider}>
                    <SelectTrigger
                      id="account-provider"
                      disabled={isSeeding}
                      className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                    >
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border border-dashed border-white/20">
                      <SelectItem value="random">Mix (Random)</SelectItem>
                      <SelectItem value="github">GitHub</SelectItem>
                      <SelectItem value="google">Google</SelectItem>
                      <SelectItem value="discord">Discord</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="apple">Apple</SelectItem>
                      <SelectItem value="microsoft">Microsoft</SelectItem>
                      <SelectItem value="gitlab">GitLab</SelectItem>
                      <SelectItem value="bitbucket">Bitbucket</SelectItem>
                      <SelectItem value="spotify">Spotify</SelectItem>
                      <SelectItem value="twitch">Twitch</SelectItem>
                      <SelectItem value="reddit">Reddit</SelectItem>
                      <SelectItem value="slack">Slack</SelectItem>
                      <SelectItem value="notion">Notion</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {seedingLogs.length > 0 && (
                <div className="mt-4">
                  <Terminal
                    title="Account Seeding Terminal"
                    lines={seedingLogs}
                    isRunning={isSeeding}
                    className="w-full"
                    defaultCollapsed={true}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAccountSeedModal(false)}
                disabled={isSeeding}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none font-mono uppercase text-xs tracking-tight"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const count = parseInt(
                    (document.getElementById('account-count') as HTMLInputElement)?.value || '3',
                    10
                  );
                  handleSeedAccounts(count, accountSeedProvider);
                }}
                disabled={isSeeding}
                className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none disabled:opacity-50 font-mono uppercase text-xs tracking-tight"
              >
                {isSeeding ? (
                  <>
                    <Loader className="w-3 h-3 mr-2 animate-spin" />
                    Seeding...
                  </>
                ) : (
                  <>
                    <Link2 className="w-3 h-3 mr-2" />
                    Seed Accounts
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
