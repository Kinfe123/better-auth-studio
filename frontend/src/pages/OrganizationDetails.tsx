import { ArrowUpRight, Edit } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { CopyableId } from '../components/CopyableId';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Database,
  Loader,
  Mail,
  Send,
  Trash2,
  UserPlus,
  Users,
  X,
} from '../components/PixelIcons';
import { Terminal } from '../components/Terminal';
import { Badge } from '../components/ui/badge';
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

interface Organization {
  id: string;
  name: string;
  slug: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

interface Team {
  id: string;
  name: string;
  organizationId: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired';
  organizationId: string;
  teamId?: string;
  inviterId: string;
  expiresAt: string;
  createdAt: string;
}

interface Member {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    emailVerified: boolean;
  };
}

export default function OrganizationDetails() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'members' | 'invitations' | 'teams'>(
    'details'
  );
  const [teamsEnabled, setTeamsEnabled] = useState(false);
  const [organizationEnabled, setOrganizationEnabled] = useState(false);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSeedMembersModal, setShowSeedMembersModal] = useState(false);
  const [showSeedTeamsModal, setShowSeedTeamsModal] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [showDeleteTeamModal, setShowDeleteTeamModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', slug: '' });

  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedInviterId, setSelectedInviterId] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [teamFormData, setTeamFormData] = useState({ name: '' });
  const [inviting, setInviting] = useState(false);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [isUpdatingTeam, setIsUpdatingTeam] = useState(false);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);
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
  const [teamSeedingLogs, setTeamSeedingLogs] = useState<
    Array<{
      id: string;
      type: 'info' | 'success' | 'error' | 'progress';
      message: string;
      timestamp: Date;
      status?: 'pending' | 'running' | 'completed' | 'failed';
    }>
  >([]);
  const [isTeamSeeding, setIsTeamSeeding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  interface User {
    id: string;
    name: string;
    email: string;
    image?: string;
    emailVerified: boolean;
  }

  useEffect(() => {
    if (orgId) {
      fetchOrganization();
      checkOrganizationEnabled();
      checkTeamsEnabled();
      fetchInvitations();
      fetchMembers();
      fetchTeams();
    }

    const interval = setInterval(() => {
      if (!organizationEnabled && orgId) {
        checkOrganizationEnabled();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [orgId, organizationEnabled]);

  useEffect(() => {
    if (teamsEnabled && orgId) {
      fetchTeams();
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'members' && orgId) {
      fetchMembers();
    }
  }, [activeTab, orgId]);

  useEffect(() => {
    if (activeTab === 'invitations' && orgId) {
      fetchInvitations();
    }
  }, [activeTab, orgId]);

  const handleTeamNameChange = (name: string) => {
    setTeamFormData({ name });
  };

  const fetchOrganization = async () => {
    try {
      const response = await fetch(`/api/organizations/${orgId}`);
      const data = await response.json();

      // Handle both response formats: { success: true, organization: ... } and { organization: ... }
      if (data.success && data.organization) {
        setOrganization(data.organization);
      } else if (data.organization) {
        setOrganization(data.organization);
      } else {
        toast.error('Organization not found');
      }
    } catch (error) {
      console.error('Failed to fetch organization:', error);
      toast.error('Failed to load organization');
    } finally {
      setLoading(false);
    }
  };

  const checkTeamsEnabled = async () => {
    try {
      const response = await fetch('/api/plugins/teams/status');
      const data = await response.json();
      setTeamsEnabled(data.enabled);
    } catch (error) {
      console.error('Failed to check teams status:', error);
      setTeamsEnabled(false);
    }
  };

  const checkOrganizationEnabled = async () => {
    try {
      const response = await fetch('/api/plugins/organization/status');
      const data = await response.json();
      setOrganizationEnabled(data.enabled);
    } catch (error) {
      console.error('Failed to check organization status:', error);
      setOrganizationEnabled(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch(`/api/organizations/${orgId}/teams`);
      const data = await response.json();

      if (data.success) {
        setTeams(data.teams || []);
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      toast.error('Failed to load teams');
    }
  };

  const fetchInvitations = async () => {
    try {
      const response = await fetch(`/api/organizations/${orgId}/invitations`);
      const data = await response.json();

      if (data.success) {
        setInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
      toast.error('Failed to load invitations');
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/organizations/${orgId}/members`);
      const data = await response.json();

      if (data.success) {
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
      toast.error('Failed to load members');
    }
  };

  const handleSeedMembers = async (count: number) => {
    setSeedingLogs([]);
    setIsSeeding(true);

    setSeedingLogs([
      {
        id: 'start',
        type: 'info',
        message: `Starting member seeding process for ${count} members...`,
        timestamp: new Date(),
      },
    ]);

    try {
      const response = await fetch(`/api/organizations/${orgId}/seed-members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      });

      const result = await response.json();

      if (result.success) {
        const progressLogs = result.results.map((r: any, index: number) => {
          if (r.success) {
            return {
              id: `member-${index}`,
              type: 'progress' as const,
              message: `Adding member: ${r.member.user.name} (${r.member.user.email})`,
              timestamp: new Date(),
              status: 'completed' as const,
            };
          } else {
            return {
              id: `member-${index}`,
              type: 'error' as const,
              message: `Failed to add member ${index + 1}: ${r.error}`,
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
            message: `✅ Seeding completed! Added ${successCount}/${count} members successfully`,
            timestamp: new Date(),
          },
        ]);

        await fetchMembers();
        toast.success(`Successfully added ${successCount} members!`);
      } else {
        setSeedingLogs((prev) => [
          ...prev,
          {
            id: 'error',
            type: 'error',
            message: `❌ Seeding failed: ${result.error || 'Unknown error'}`,
            timestamp: new Date(),
          },
        ]);
        toast.error(result.error || 'Failed to seed members');
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
      toast.error('Failed to seed members');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSeedTeams = async (count: number) => {
    setTeamSeedingLogs([]);
    setIsTeamSeeding(true);

    setTeamSeedingLogs([
      {
        id: 'start',
        type: 'info',
        message: `Starting team seeding process for ${count} teams...`,
        timestamp: new Date(),
      },
    ]);

    try {
      const response = await fetch(`/api/organizations/${orgId}/seed-teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      });

      const result = await response.json();

      if (result.success) {
        const progressLogs = result.results.map((r: any, index: number) => {
          if (r.success) {
            return {
              id: `team-${index}`,
              type: 'progress' as const,
              message: `Creating team: ${r.team.name}`,
              timestamp: new Date(),
              status: 'completed' as const,
            };
          } else {
            return {
              id: `team-${index}`,
              type: 'error' as const,
              message: `Failed to create team ${index + 1}: ${r.error}`,
              timestamp: new Date(),
            };
          }
        });

        setTeamSeedingLogs((prev) => [...prev, ...progressLogs]);

        const successCount = result.results.filter((r: any) => r.success).length;
        setTeamSeedingLogs((prev) => [
          ...prev,
          {
            id: 'complete',
            type: 'success',
            message: `✅ Seeding completed! Created ${successCount}/${count} teams successfully`,
            timestamp: new Date(),
          },
        ]);

        await fetchTeams();
        toast.success(`Successfully created ${successCount} teams!`);
      } else {
        setTeamSeedingLogs((prev) => [
          ...prev,
          {
            id: 'error',
            type: 'error',
            message: `❌ Seeding failed: ${result.error || 'Unknown error'}`,
            timestamp: new Date(),
          },
        ]);
        toast.error(result.error || 'Failed to seed teams');
      }
    } catch (error) {
      setTeamSeedingLogs((prev) => [
        ...prev,
        {
          id: 'error',
          type: 'error',
          message: `❌ Network error: ${error}`,
          timestamp: new Date(),
        },
      ]);
      toast.error('Failed to seed teams');
    } finally {
      setIsTeamSeeding(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('/api/users/all');
      const data = await response.json();

      if (data.success) {
        setAvailableUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^a-z0-9-]/g, '') // Remove special characters except hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  const openEditModal = () => {
    if (organization) {
      setEditFormData({ name: organization.name, slug: organization.slug });
      setShowEditModal(true);
    }
  };

  const handleEditNameChange = (name: string) => {
    const slug = generateSlug(name);
    setEditFormData({ name, slug });
  };

  const handleEditSlugChange = (slug: string) => {
    setEditFormData((prev) => ({ ...prev, slug: generateSlug(slug) }));
  };

  const handleUpdateOrganization = async () => {
    if (!organization) {
      toast.error('No organization selected');
      return;
    }

    if (!editFormData.name) {
      toast.error('Please fill in the organization name');
      return;
    }

    setIsUpdating(true);
    const toastId = toast.loading('Updating organization...');

    try {
      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFormData.name,
          slug: editFormData.slug,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchOrganization();
        setShowEditModal(false);
        setEditFormData({ name: '', slug: '' });
        toast.success('Organization updated successfully!', { id: toastId });
      } else {
        toast.error(`Error updating organization: ${result.error || 'Unknown error'}`, {
          id: toastId,
        });
      }
    } catch (error) {
      console.error('Error updating organization:', error);
      toast.error('Error updating organization', { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  };

  const openInviteModal = () => {
    fetchAvailableUsers();
    setShowInviteModal(true);
  };

  const handleInviteUser = async () => {
    if (!inviteEmail) {
      toast.error('Please enter an email address');
      return;
    }

    if (!selectedInviterId) {
      toast.error('Please select an inviter');
      return;
    }

    setInviting(true);
    const toastId = toast.loading('Sending invitation...');

    try {
      const response = await fetch(`/api/organizations/${orgId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: 'member',
          inviterId: selectedInviterId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchInvitations();
        setShowInviteModal(false);
        setInviteEmail('');
        setSelectedInviterId('');
        toast.success('Invitation sent successfully!', { id: toastId });
      } else {
        toast.error(`Error sending invitation: ${result.error || 'Unknown error'}`, {
          id: toastId,
        });
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Error sending invitation', { id: toastId });
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    const toastId = toast.loading('Cancelling invitation...');

    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (result.success) {
        await fetchInvitations();
        toast.success('Invitation cancelled successfully!', { id: toastId });
      } else {
        toast.error(`Error cancelling invitation: ${result.error || 'Unknown error'}`, {
          id: toastId,
        });
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error('Error cancelling invitation', { id: toastId });
    }
  };

  const handleResendInvitation = async (invitationId: string, email: string) => {
    const toastId = toast.loading('Resending invitation...');

    try {
      const response = await fetch(`/api/invitations/${invitationId}/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (result.success) {
        await fetchInvitations();
        toast.success(`Invitation resent to ${email}!`, { id: toastId });
      } else {
        toast.error(`Error resending invitation: ${result.error || 'Unknown error'}`, {
          id: toastId,
        });
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast.error('Error resending invitation', { id: toastId });
    }
  };

  const handleRemoveMember = async (memberId: string, userName: string) => {
    const toastId = toast.loading(`Removing ${userName}...`);

    try {
      const response = await fetch(`/api/members/${memberId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (result.success) {
        await fetchMembers();
        toast.success(`${userName} removed from organization!`, { id: toastId });
      } else {
        toast.error(`Error removing member: ${result.error || 'Unknown error'}`, { id: toastId });
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Error removing member', { id: toastId });
    }
  };

  const handleCreateTeam = async () => {
    if (!teamFormData.name) {
      toast.error('Please enter a team name');
      return;
    }

    setIsCreatingTeam(true);
    const toastId = toast.loading('Creating team...');

    try {
      const response = await fetch(`/api/organizations/${orgId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teamFormData.name,
          organizationId: orgId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchTeams();
        setShowCreateTeamModal(false);
        setTeamFormData({ name: '' });
        toast.success('Team created successfully!', { id: toastId });
      } else {
        toast.error(`Error creating team: ${result.error || 'Unknown error'}`, { id: toastId });
      }
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Error creating team', { id: toastId });
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleUpdateTeam = async () => {
    if (!selectedTeam || !teamFormData.name) {
      toast.error('Please enter a team name');
      return;
    }

    setIsUpdatingTeam(true);
    const toastId = toast.loading('Updating team...');

    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teamFormData.name,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchTeams();
        setShowEditTeamModal(false);
        setSelectedTeam(null);
        setTeamFormData({ name: '' });
        toast.success('Team updated successfully!', { id: toastId });
      } else {
        toast.error(`Error updating team: ${result.error || 'Unknown error'}`, { id: toastId });
      }
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error('Error updating team', { id: toastId });
    } finally {
      setIsUpdatingTeam(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeam) {
      toast.error('No team selected');
      return;
    }

    setIsDeletingTeam(true);
    const toastId = toast.loading('Deleting team...');

    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (result.success) {
        await fetchTeams();
        setShowDeleteTeamModal(false);
        setSelectedTeam(null);
        toast.success('Team deleted successfully!', { id: toastId });
      } else {
        toast.error(`Error deleting team: ${result.error || 'Unknown error'}`, { id: toastId });
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Error deleting team', { id: toastId });
    } finally {
      setIsDeletingTeam(false);
    }
  };

  const openEditTeamModal = (team: Team) => {
    setSelectedTeam(team);
    setTeamFormData({ name: team.name });
    setShowEditTeamModal(true);
  };

  const openDeleteTeamModal = (team: Team) => {
    setSelectedTeam(team);
    setShowDeleteTeamModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="flex flex-col items-center space-y-3">
          <Loader className="w-6 h-6 text-white animate-spin" />
          <div className="text-white text-sm">Loading organization details...</div>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center space-x-4">
          <Link to="/organizations">
            <Button variant="ghost" className="text-gray-400 hover:text-white rounded-none">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Organizations
            </Button>
          </Link>
        </div>
        <br />
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl text-white font-light mb-2">Organization Not Found</h2>
          <p className="text-gray-400">The organization you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="mb-4 ml-0 flex justify-start items-start text-left border-none text-white">
            <span className="font-light">
              <span
                onClick={() => navigate('/organizations')}
                className="uppercase cursor-pointer text-white/80 font-mono text-sm"
              >
                orgs /{' '}
              </span>
              <span className="text-white font-mono text-sm">{orgId}</span>
            </span>
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setShowSeedMembersModal(true)}
            className="border border-dashed border-white/20 text-white bg-transparent hover:bg-white/10 rounded-none"
          >
            <Users className="w-4 h-4 mr-2" />
            Seed Members
          </Button>
          <Button
            onClick={openInviteModal}
            className="border border-dashed border-white/20 text-white bg-transparent hover:bg-white/10 rounded-none"
          >
            <Mail className="w-4 h-4 mr-2" />
            Invite User
          </Button>
          <Button
            onClick={openEditModal}
            className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Organization
          </Button>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-white/10 border border-dashed border-white/20 rounded-none flex items-center justify-center">
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl text-white font-light inline-flex items-center">
            {organization.name}
            <CopyableId id={organization.slug} nonSliced={true} variant="subscript" />
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="border border-dashed border-white/20 rounded-none">
        <div className="border-b border-dashed border-white/20">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-white text-white'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-white/50'
              }`}
            >
              <Building2 className="w-4 h-4 text-white/90" />
              <span className="inline-flex items-start font-mono uppercase text-xs font-normal">
                Details
                <sup className="text-xs text-gray-500 ml-1 inline-flex items-baseline">
                  <AnimatedNumber
                    value={0}
                    className="text-white/80 font-mono text-xs"
                    prefix={<span className="mr-0.5 text-gray-500">[</span>}
                    suffix={<span className="ml-0.5 text-gray-500">]</span>}
                    format={{ notation: 'standard', maximumFractionDigits: 0 }}
                  />
                </sup>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'members'
                  ? 'border-white text-white'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-white/50'
              }`}
            >
              <Users className="w-4 h-4 text-white/90" />
              <span className="inline-flex items-start font-mono uppercase text-xs font-normal">
                Members
                <sup className="text-xs text-gray-500 ml-1 inline-flex items-baseline">
                  <AnimatedNumber
                    value={members.length}
                    className="text-white/80 font-mono text-xs"
                    prefix={<span className="mr-0.5 text-gray-500">[</span>}
                    suffix={<span className="ml-0.5 text-gray-500">]</span>}
                    format={{ notation: 'standard', maximumFractionDigits: 0 }}
                  />
                </sup>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('invitations')}
              className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'invitations'
                  ? 'border-white text-white'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-white/50'
              }`}
            >
              <Mail className="w-4 h-4 text-white/90" />
              <span className="inline-flex items-start font-mono uppercase text-xs font-normal">
                Invitations
                <sup className="text-xs text-gray-500 ml-1 inline-flex items-baseline">
                  <AnimatedNumber
                    value={invitations.length}
                    className="text-white/80 font-mono text-xs"
                    prefix={<span className="mr-0.5 text-gray-500">[</span>}
                    suffix={<span className="ml-0.5 text-gray-500">]</span>}
                    format={{ notation: 'standard', maximumFractionDigits: 0 }}
                  />
                </sup>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'teams'
                  ? 'border-white text-white'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-white/50'
              }`}
            >
              <Users className="w-4 h-4 text-white/90" />
              <span className="inline-flex items-start font-mono uppercase text-xs font-normal">
                Teams
                <sup className="text-xs text-gray-500 ml-1 inline-flex items-baseline">
                  <AnimatedNumber
                    value={teams.length}
                    className="text-white/80 font-mono text-xs"
                    prefix={<span className="mr-0.5 text-gray-500">[</span>}
                    suffix={<span className="ml-0.5 text-gray-500">]</span>}
                    format={{ notation: 'standard', maximumFractionDigits: 0 }}
                  />
                </sup>
              </span>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Tab Content */}
          {activeTab === 'details' && (
            <div className="space-y-6 overflow-x-hidden">
              <div className="bg-black/30 border border-dashed border-white/20 rounded-none p-6">
                <h3 className="text-sm uppercase font-mono text-gray-400 mb-4 tracking-wider">
                  ORGANIZATION INFORMATION
                </h3>
                <hr className="border-white/15 -mx-10 border-dashed my-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-gray-400 font-mono uppercase">Name</label>
                    <p className="text-white font-sans mt-1">{organization.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 font-mono uppercase">Slug</label>
                    <p className="text-white font-mono mt-1">{organization.slug}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 font-mono uppercase">Created</label>
                    <p className="text-white font-sans mt-1">
                      {new Date(organization.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-black/30 border border-dashed border-white/20 rounded-none p-6">
                  <div className="flex items-center space-x-3">
                    <Users className="w-8 h-8 text-white" />
                    <div>
                      <p className="text-2xl text-white font-sans font-light">
                        <AnimatedNumber
                          value={members.length}
                          format={{ notation: 'standard', maximumFractionDigits: 0 }}
                        />
                      </p>
                      <p className="text-sm text-gray-400 font-mono uppercase">Members</p>
                    </div>
                  </div>
                </div>
                <div className="bg-black/30 border border-dashed border-white/20 rounded-none p-6">
                  <div className="flex items-center space-x-3">
                    <Users className="w-8 h-8 text-white" />
                    <div>
                      <p className="text-2xl text-white font-sans font-light">
                        <AnimatedNumber
                          value={teams.length}
                          format={{ notation: 'standard', maximumFractionDigits: 0 }}
                        />
                      </p>
                      <p className="text-sm text-gray-400 font-mono uppercase">Teams</p>
                    </div>
                  </div>
                </div>
                <div className="bg-black/30 border border-dashed border-white/20 rounded-none p-6">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-8 h-8 text-white" />
                    <div>
                      <p className="text-2xl text-white font-sans font-light">
                        <AnimatedNumber
                          value={invitations.length}
                          format={{ notation: 'standard', maximumFractionDigits: 0 }}
                        />
                      </p>
                      <p className="text-sm text-gray-400 font-mono uppercase">Invitations</p>
                    </div>
                  </div>
                </div>
                <div className="bg-black/30 border border-dashed border-white/20 rounded-none p-6">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-8 h-8 text-white" />
                    <div>
                      <p className="text-2xl text-white font-sans font-light">
                        <AnimatedNumber
                          value={Math.ceil(
                            (new Date().getTime() - new Date(organization.createdAt).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )}
                          format={{ notation: 'standard', maximumFractionDigits: 0 }}
                        />
                      </p>
                      <p className="text-sm text-gray-400 font-mono uppercase">Days Active</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'teams' && (
            <div className="space-y-6">
              {/* Teams Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg relative text-white font-light inline-flex items-start">
                    Teams
                    <sup className="text-xs text-gray-500 ml-1 mt-0">
                      <span className="mr-1">[</span>
                      <span className="text-white font-mono text-xs">{teams.length}</span>
                      <span className="ml-1">]</span>
                    </sup>
                  </h3>
                  <p className="text-gray-400 mt-1 uppercase font-mono text-xs font-light">
                    Manage teams within this organization
                  </p>
                </div>
                {teamsEnabled && (
                  <div className="flex items-center space-x-3">
                    <Button
                      onClick={() => setShowSeedTeamsModal(true)}
                      className="border border-dashed border-white/20 text-white hover:bg-white/10 bg-transparent rounded-none"
                    >
                      <Database className="w-4 h-4 mr-2" />
                      Seed Teams
                    </Button>
                    <Button
                      onClick={() => setShowCreateTeamModal(true)}
                      className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create Team
                    </Button>
                  </div>
                )}
              </div>
              {!teamsEnabled ? (
                <div className="bg-black/30 border border-dashed border-white/20 rounded-none p-8">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-md text-white tracking-tight font-light font-mono uppercase mb-1">
                        Teams Feature Required
                      </h3>
                      <p className="text-gray-300 mb-6 text-sm">
                        To use Teams in Better Auth Studio, you need to enable the teams feature in
                        your organization plugin configuration.
                      </p>

                      <div className="bg-black/50 border border-dashed border-white/20 rounded-none p-4 mb-6">
                        <h4 className="text-white font-light mb-3">Follow these steps:</h4>
                        <ol className="text-gray-300 space-y-2 text-sm list-decimal list-inside">
                          <li>Update your auth configuration file to enable teams:</li>
                        </ol>

                        <div className="mt-4 bg-black/70 border border-dashed border-white/10 rounded-none p-3 overflow-x-auto">
                          <pre className="text-sm text-gray-300">
                            <span className="text-blue-400">import</span> {`{ betterAuth }`}{' '}
                            <span className="text-blue-400">from</span>{' '}
                            <span className="text-green-400">"better-auth"</span> <br />
                            <span className="text-blue-400">import</span> {`{ organization }`}{' '}
                            <span className="text-blue-400">from</span>{' '}
                            <span className="text-green-400">"better-auth/plugins"</span> <br />
                            <span className="text-blue-400">export const</span>{' '}
                            <span className="text-yellow-300">auth</span> ={' '}
                            <span className="text-yellow-300">betterAuth</span>({`{`} <br />
                            <span className="text-gray-500 pl-10">
                              // ... your existing configuration
                            </span>{' '}
                            <br />
                            <span className="text-red-300 pl-10">plugins</span>: [ <br />
                            <span className="text-yellow-300 pl-12">organization</span>({`{`} <br />
                            <span className="text-red-300 pl-16">teams</span>: {`{`} <br />
                            <span className="text-yellow-300 pl-20">enabled</span>:{' '}
                            <span className="text-blue-400">true</span> <br />
                            <span className="pl-16">{`}`}</span> <br />
                            <span className="pl-12">{`})`}</span> <br />
                            <span className="pl-10">]</span> <br />
                            {`}`}) <br />
                          </pre>
                        </div>

                        <div className="mt-4">
                          <p className="text-gray-400 text-sm">
                            2. Run migrations to create the teams table
                          </p>
                        </div>
                        <div className="mt-2">
                          <p className="text-gray-400 text-sm">
                            3. Restart your application to apply the changes
                          </p>
                        </div>
                      </div>

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
              ) : teams.length > 0 ? (
                <div className="bg-black/30 border border-dashed border-white/20 rounded-none">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-dashed border-white/10">
                          <th className="text-left py-4 px-4 text-white font-light">Team</th>
                          <th className="text-left py-4 px-4 text-white font-light">Members</th>
                          <th className="text-left py-4 px-4 text-white font-light">Created</th>
                          <th className="text-right py-4 px-4 text-white font-light">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teams.map((team) => (
                          <tr
                            key={team.id}
                            className="border-b border-dashed border-white/5 hover:bg-white/5 cursor-pointer"
                            onClick={() => navigate(`/organizations/${orgId}/teams/${team.id}`)}
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-white/10 border border-dashed border-white/20 rounded-none flex items-center justify-center">
                                  <Users className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <div className="text-white font-light">{team.name}</div>
                                  <CopyableId id={team.id} label="Team ID" />
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-white">{team.memberCount || 0}</td>
                            <td className="py-4 px-4 text-sm text-gray-400">
                              {new Date(team.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditTeamModal(team);
                                  }}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border border-dashed border-red-400/50 text-red-400 hover:bg-red-400/10 rounded-none"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDeleteTeamModal(team);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-black/30 border border-dashed border-white/20 rounded-none p-12">
                  <div className="text-center">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl text-white font-light mb-2">No Teams Yet</h3>
                    <p className="text-gray-400 mb-6">
                      Create your first team to start organizing members within this organization.
                    </p>
                    <Button
                      onClick={() => setShowCreateTeamModal(true)}
                      className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create First Team
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-6">
              {/* Members Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg relative text-white font-light inline-flex items-start">
                    Members
                    <sup className="text-xs text-gray-500 ml-1 mt-0">
                      <span className="mr-1">[</span>
                      <span className="text-white font-mono text-xs">{members.length}</span>
                      <span className="ml-1">]</span>
                    </sup>
                  </h3>
                  <p className="text-gray-400 font-light font-mono text-xs uppercase mt-1">
                    Manage organization members and their roles
                  </p>
                </div>
              </div>

              {/* Members List */}
              {members.length > 0 ? (
                <div className="bg-black/30 border border-dashed border-white/20 rounded-none">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-dashed border-white/10">
                          <th className="text-left py-4 px-4 text-white font-light">User</th>
                          <th className="text-left py-4 px-4 text-white font-light">Email</th>
                          <th className="text-left py-4 px-4 text-white font-light">Role</th>
                          <th className="text-left py-4 px-4 text-white font-light">Joined</th>
                          <th className="text-right py-4 px-4 text-white font-light">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((member) => (
                          <tr
                            key={member.id}
                            className="border-b border-dashed border-white/5 hover:bg-white/5 group"
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <img
                                  src={
                                    member.user.image ||
                                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user.id}`
                                  }
                                  alt={member.user.name}
                                  className="w-10 h-10 rounded-none border border-dashed border-white/20"
                                />
                                <div>
                                  <div className="text-white font-light inline-flex items-center gap-2">
                                    <span>{member.user.name}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/users/${member.user.id}`);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 text-white/60 hover:text-white transition-all"
                                      title="View user details"
                                    >
                                      <ArrowUpRight className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <CopyableId id={member.user.id} />
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-white">{member.user.email}</td>
                            <td className="py-4 px-4">
                              <Badge
                                variant="secondary"
                                className="text-xs bg-blue-900/10 border border-dashed rounded-none border-blue-500/30 text-blue-400/70 capitalize"
                              >
                                {member.role}
                              </Badge>
                            </td>
                            <td className="py-4 px-4 text-sm text-gray-400">
                              {new Date(member.joinedAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border border-dashed border-red-400/50 text-red-400 hover:bg-red-400/10 rounded-none"
                                  onClick={() => handleRemoveMember(member.id, member.user.name)}
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Remove
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-black/30 border border-dashed border-white/20 rounded-none p-12">
                  <div className="text-center">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl text-white font-light mb-2">No Members Yet</h3>
                    <p className="text-gray-400 mb-6">
                      Invite users or seed members from existing users to get started.
                    </p>
                    <div className="flex items-center justify-center space-x-3">
                      <Button
                        onClick={() => setShowSeedMembersModal(true)}
                        className="border border-dashed border-white/20 text-white hover:bg-white/10 bg-transparent rounded-none"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Seed Members
                      </Button>
                      <Button
                        onClick={openInviteModal}
                        className="bg-white text-black hover:bg-white/90 border border-white/20 rounded-none"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Invite User
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'invitations' && (
            <div className="space-y-6">
              {/* Invitations Header */}
              <div className="flex items-center justify-between">
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
                    Manage pending invitations to this organization
                  </p>
                </div>
              </div>

              {/* Invitations List */}
              {invitations.length > 0 ? (
                <div className="bg-black/30 border border-dashed border-white/20 rounded-none">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-dashed border-white/10">
                          <th className="text-left py-4 px-4 text-white font-light">Email</th>
                          <th className="text-left py-4 px-4 text-white font-light">Role</th>
                          <th className="text-left py-4 px-4 text-white font-light">Status</th>
                          <th className="text-left py-4 px-4 text-white font-light">Expires</th>
                          <th className="text-right py-4 px-4 text-white font-light">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invitations.map((invitation) => (
                          <tr
                            key={invitation.id}
                            className="border-b border-dashed border-white/5 hover:bg-white/5"
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-white/10 border border-dashed border-white/20 rounded-none flex items-center justify-center">
                                  <Mail className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <div className="text-white font-light">{invitation.email}</div>
                                  <div className="text-sm text-gray-400">
                                    Expires on{' '}
                                    {new Date(invitation.expiresAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      year: 'numeric',
                                      day: 'numeric',
                                    })}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-white capitalize">{invitation.role}</td>
                            <td className="py-4 px-4">
                              <Badge
                                variant="secondary"
                                className={`text-xs font-normal font-mono uppercase rounded-none border-dashed flex items-center gap-1 w-fit ${
                                  invitation.status === 'pending'
                                    ? 'bg-yellow-900/10 border border-yellow-500/30 text-yellow-400/70'
                                    : invitation.status === 'accepted'
                                      ? 'bg-green-900/10 border border-green-500/30 text-green-400/70'
                                      : 'bg-red-900/10 border border-red-500/30 text-red-400/70'
                                }`}
                              >
                                {invitation.status === 'pending' && <Clock className="w-2 h-2" />}
                                {invitation.status === 'accepted' && (
                                  <CheckCircle className="w-3 h-3" />
                                )}
                                {invitation.status === 'expired' && <X className="w-2 h-2" />}
                                {invitation.status}
                              </Badge>
                            </td>
                            <td className="py-4 px-4 text-sm text-gray-400">
                              {new Date(invitation.expiresAt).toLocaleDateString()}
                              <br />
                              <span className="text-xs text-gray-400">
                                {new Date(invitation.expiresAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
                                  onClick={() =>
                                    handleResendInvitation(invitation.id, invitation.email)
                                  }
                                >
                                  <Send className="w-4 h-4 mr-1" />
                                  Resend
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border border-dashed border-red-400/50 text-red-400 hover:bg-red-400/10 rounded-none"
                                  onClick={() => handleCancelInvitation(invitation.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-black/30 border border-dashed border-white/20 rounded-none p-12">
                  <div className="text-center">
                    <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl text-white font-light mb-2">No Invitations</h3>
                    <p className="text-gray-400 mb-6">
                      Start inviting users to join this organization.
                    </p>
                    <Button
                      onClick={openInviteModal}
                      className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Send First Invitation
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Invite User Modal */}
      {showInviteModal && organization && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-black border border-white/15 rounded-none p-6 w-full max-w-xl shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light uppercase font-mono">Invite User</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail('');
                  setSelectedInviterId('');
                }}
                disabled={inviting}
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
                <div className="w-14 h-14 rounded-none border border-dashed border-white/15 bg-white/10 flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div className="space-y-1">
                  <div className="text-white font-medium leading-tight flex items-center gap-2">
                    <span>{organization.name}</span>
                    <CopyableId id={organization.id} variant="subscript" nonSliced={true} />
                  </div>
                  <div className="text-sm text-gray-400">{organization.slug}</div>
                </div>
              </div>
              <div>
                <Label htmlFor="invite-email" className="text-xs text-white/80 font-mono uppercase">
                  Email Address
                </Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  disabled={inviting}
                  className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                />
              </div>
              <div>
                <Label htmlFor="inviter-select" className="text-xs text-white/80 font-mono uppercase">
                  Inviter
                </Label>
                <Select value={selectedInviterId} onValueChange={setSelectedInviterId}>
                  <SelectTrigger 
                    className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                    disabled={inviting}
                  >
                    <SelectValue placeholder="Select an inviter..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center space-x-2">
                          <img
                            src={
                              user.image ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
                            }
                            alt={user.name}
                            className="w-6 h-6 rounded-none border border-dashed border-white/20"
                          />
                          <span>
                            {user.name} ({user.email})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail('');
                  setSelectedInviterId('');
                }}
                disabled={inviting}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none font-mono uppercase text-xs tracking-tight"
              >
                Cancel
              </Button>
              <Button
                onClick={handleInviteUser}
                disabled={inviting}
                className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none disabled:opacity-50 font-mono uppercase text-xs tracking-tight"
              >
                {inviting ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-black border border-white/15 rounded-none p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light uppercase font-mono">Create Team</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCreateTeamModal(false);
                  setTeamFormData({ name: '' });
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
              <div>
                <Label htmlFor="team-name" className="text-xs text-white/80 font-mono uppercase">
                  Team Name
                </Label>
                <Input
                  id="team-name"
                  value={teamFormData.name}
                  onChange={(e) => handleTeamNameChange(e.target.value)}
                  placeholder="e.g. Development Team"
                  className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateTeamModal(false);
                  setTeamFormData({ name: '' });
                }}
                disabled={isCreatingTeam}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none font-mono uppercase text-xs tracking-tight"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTeam}
                disabled={isCreatingTeam}
                className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none disabled:opacity-50 font-mono uppercase text-xs tracking-tight"
              >
                {isCreatingTeam ? 'Creating...' : 'Create Team'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {showEditTeamModal && selectedTeam && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-black border border-white/15 rounded-none p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light uppercase font-mono">Edit Team</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowEditTeamModal(false);
                  setTeamFormData({ name: '' });
                }}
                disabled={isUpdatingTeam}
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
                <div className="w-14 h-14 rounded-none border border-dashed border-white/15 bg-white/10 flex items-center justify-center">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div className="space-y-1">
                  <div className="text-white font-medium leading-tight flex items-center gap-2">
                    <span>{selectedTeam.name}</span>
                    <CopyableId id={selectedTeam.id} variant="subscript" nonSliced={true} />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-team-name" className="text-xs text-white/80 font-mono uppercase">
                  Team Name
                </Label>
                <Input
                  id="edit-team-name"
                  value={teamFormData.name}
                  onChange={(e) => handleTeamNameChange(e.target.value)}
                  placeholder="e.g. Development Team"
                  disabled={isUpdatingTeam}
                  className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditTeamModal(false);
                  setTeamFormData({ name: '' });
                }}
                disabled={isUpdatingTeam}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none font-mono uppercase text-xs tracking-tight"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateTeam}
                disabled={isUpdatingTeam}
                className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none disabled:opacity-50 font-mono uppercase text-xs tracking-tight"
              >
                {isUpdatingTeam ? 'Updating...' : 'Update Team'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Team Modal */}
      {showDeleteTeamModal && selectedTeam && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-black border border-white/15 rounded-none p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light uppercase font-mono">Delete Team</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteTeamModal(false)}
                disabled={isDeletingTeam}
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
                <div className="w-14 h-14 rounded-none border border-dashed border-white/15 bg-white/10 flex items-center justify-center">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div className="space-y-1">
                  <div className="text-white font-medium leading-tight flex items-center gap-2">
                    <span>{selectedTeam.name}</span>
                    <CopyableId id={selectedTeam.id} variant="subscript" nonSliced={true} />
                  </div>
                </div>
              </div>
              <p className="text-gray-400">
                Are you sure you want to delete this team? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowDeleteTeamModal(false)}
                disabled={isDeletingTeam}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none font-mono uppercase text-xs tracking-tight"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteTeam}
                disabled={isDeletingTeam}
                className="bg-red-600 hover:bg-red-700 text-white border border-red-600 rounded-none disabled:opacity-50 font-mono uppercase text-xs tracking-tight"
              >
                {isDeletingTeam ? 'Deleting...' : 'Delete Team'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Seed Members Modal */}
      {showSeedMembersModal && organization && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-black border border-white/15 rounded-none p-6 w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light uppercase font-mono">Seed Members</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSeedMembersModal(false)}
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

            <div className="space-y-6 mt-4">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 rounded-none border border-dashed border-white/15 bg-white/10 flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div className="space-y-1">
                  <div className="text-white font-medium leading-tight flex items-center gap-2">
                    <span>{organization.name}</span>
                    <CopyableId id={organization.id} variant="subscript" nonSliced={true} />
                  </div>
                  <div className="text-sm text-gray-400">{organization.slug}</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-white" />
                  <h4 className="text-white font-light font-mono uppercase text-xs">Add Members from Existing Users</h4>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <Label htmlFor="member-count" className="text-xs text-white/80 font-mono uppercase">
                      Number of members to add
                    </Label>
                    <Input
                      id="member-count"
                      type="number"
                      min="1"
                      max="50"
                      defaultValue="5"
                      disabled={isSeeding}
                      className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      const count = parseInt(
                        (document.getElementById('member-count') as HTMLInputElement)?.value || '5'
                      );
                      handleSeedMembers(count);
                    }}
                    disabled={isSeeding}
                    className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none mt-6 disabled:opacity-50 font-mono uppercase text-xs tracking-tight"
                  >
                    {isSeeding ? (
                      <>
                        <Loader className="w-3 h-3 mr-2 animate-spin" />
                        Seeding...
                      </>
                    ) : (
                      <>
                        <Users className="w-3 h-3 mr-2" />
                        Seed Members
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Seeding Logs */}
              {seedingLogs.length > 0 && (
                <div className="mt-6">
                  <Terminal
                    title="Member Seeding Terminal"
                    lines={seedingLogs}
                    isRunning={isSeeding}
                    className="w-full"
                    defaultCollapsed={true}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => setShowSeedMembersModal(false)}
                disabled={isSeeding}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none font-mono uppercase text-xs tracking-tight"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Seed Teams Modal */}
      {showSeedTeamsModal && organization && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-black border border-white/15 rounded-none p-6 w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light uppercase font-mono">Seed Teams</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSeedTeamsModal(false)}
                disabled={isTeamSeeding}
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

            <div className="space-y-6 mt-4">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 rounded-none border border-dashed border-white/15 bg-white/10 flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div className="space-y-1">
                  <div className="text-white font-medium leading-tight flex items-center gap-2">
                    <span>{organization.name}</span>
                    <CopyableId id={organization.id} variant="subscript" nonSliced={true} />
                  </div>
                  <div className="text-sm text-gray-400">{organization.slug}</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-white" />
                  <h4 className="text-white font-light font-mono uppercase text-xs">Create Teams</h4>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <Label htmlFor="team-count" className="text-xs text-white/80 font-mono uppercase">
                      Number of teams to create
                    </Label>
                    <Input
                      id="team-count"
                      type="number"
                      min="1"
                      max="20"
                      defaultValue="3"
                      disabled={isTeamSeeding}
                      className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      const count = parseInt(
                        (document.getElementById('team-count') as HTMLInputElement)?.value || '3'
                      );
                      handleSeedTeams(count);
                    }}
                    disabled={isTeamSeeding}
                    className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none mt-6 disabled:opacity-50 font-mono uppercase text-xs tracking-tight"
                  >
                    {isTeamSeeding ? (
                      <>
                        <Loader className="w-3 h-3 mr-2 animate-spin" />
                        Seeding...
                      </>
                    ) : (
                      <>
                        <Building2 className="w-3 h-3 mr-2" />
                        Seed Teams
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Team Seeding Logs */}
              {teamSeedingLogs.length > 0 && (
                <div className="mt-6">
                  <Terminal
                    title="Team Seeding Terminal"
                    lines={teamSeedingLogs}
                    isRunning={isTeamSeeding}
                    className="w-full"
                    defaultCollapsed={true}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end mt-6 pt-6 border-t border-dashed border-white/10">
              <Button
                variant="outline"
                onClick={() => setShowSeedTeamsModal(false)}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Organization Modal */}
      {showEditModal && organization && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditModal(false);
              setEditFormData({ name: '', slug: '' });
            }
          }}
        >
          <div
            className="bg-black border border-white/15 p-6 w-full max-w-xl rounded-none shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light uppercase font-mono">
                Edit Organization
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowEditModal(false);
                  setEditFormData({ name: '', slug: '' });
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
                <div className="w-14 h-14 rounded-none border border-dashed border-white/15 bg-white/10 flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div className="space-y-1">
                  <div className="text-white font-medium leading-tight flex items-center gap-2">
                    <span>{organization.name}</span>
                    <CopyableId id={organization.id} variant="subscript" nonSliced={true} />
                  </div>
                  <div className="text-sm text-gray-400">{organization.slug}</div>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-name" className="text-xs text-white/80 font-mono uppercase">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => handleEditNameChange(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                />
              </div>
              <div>
                <Label htmlFor="edit-slug" className="text-xs text-white/80 font-mono uppercase">
                  Slug
                </Label>
                <Input
                  id="edit-slug"
                  value={editFormData.slug}
                  onChange={(e) => handleEditSlugChange(e.target.value)}
                  placeholder="e.g. acme-corp"
                  className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-generated from name. You can edit it manually.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditFormData({ name: '', slug: '' });
                }}
                disabled={isUpdating}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateOrganization}
                disabled={isUpdating}
                className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none disabled:opacity-50"
              >
                {isUpdating ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
