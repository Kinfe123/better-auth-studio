import { Edit } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { CopyableId } from '../components/CopyableId';
import {
  Building2,
  Calendar,
  Loader,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from '../components/PixelIcons';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

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

interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
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

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  emailVerified: boolean;
}

export default function TeamDetails() {
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'members'>('details');

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [teamFormData, setTeamFormData] = useState({ name: '' });

  const fetchTeam = useCallback(async () => {
    if (!teamId) return;
    try {
      const response = await fetch(`/api/teams/${teamId}`);
      const data = await response.json();

      if (data.success && data.team) {
        setTeam(data.team);
        setTeamFormData({ name: data.team.name });
      } else if (data.team) {
        setTeam(data.team);
        setTeamFormData({ name: data.team.name });
      } else {
        toast.error('Team not found');
      }
    } catch (_error) {
      toast.error('Failed to load team');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  const fetchTeamMembers = useCallback(async () => {
    if (!teamId) return;
    try {
      const response = await fetch(`/api/teams/${teamId}/members`);
      const data = await response.json();

      if (data.success) {
        setMembers(data.members || []);
      }
    } catch (_error) {
      toast.error('Failed to load team members');
    }
  }, [teamId]);

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('/api/users?limit=10000');
      const data = await response.json();

      const memberUserIds = members.map((member) => member.userId);
      const available = (data.users || []).filter((user: User) => !memberUserIds.includes(user.id));

      setAvailableUsers(available);
    } catch (_error) {
      toast.error('Failed to load users');
    }
  };
  useEffect(() => {
    if (teamId) {
      fetchTeam();
      fetchTeamMembers();
    }
  }, [teamId, fetchTeam, fetchTeamMembers]);

  const handleUpdateTeam = async () => {
    if (!teamFormData.name) {
      toast.error('Please enter a team name');
      return;
    }

    const toastId = toast.loading('Updating team...');

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teamFormData.name }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchTeam();
        setShowEditTeamModal(false);
        toast.success('Team updated successfully!', { id: toastId });
      } else {
        toast.error(`Error updating team: ${result.error || 'Unknown error'}`, { id: toastId });
      }
    } catch (_error) {
      toast.error('Error updating team', { id: toastId });
    }
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    const toastId = toast.loading(`Adding ${selectedUsers.length} members...`);

    try {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUsers }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchTeamMembers();
        setShowAddMemberModal(false);
        setSelectedUsers([]);
        setSearchTerm('');
        toast.success(`Successfully added ${selectedUsers.length} members!`, { id: toastId });
      } else {
        toast.error(`Error adding members: ${result.error || 'Unknown error'}`, { id: toastId });
      }
    } catch (_error) {
      toast.error('Error adding members', { id: toastId });
    }
  };

  const handleRemoveTeamMember = async (memberId: string, userName: string) => {
    const toastId = toast.loading(`Removing ${userName}...`);

    try {
      const response = await fetch(`/api/team-members/${memberId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (result.success) {
        await fetchTeamMembers();
        toast.success(`${userName} removed from team!`, { id: toastId });
      } else {
        toast.error(`Error removing member: ${result.error || 'Unknown error'}`, { id: toastId });
      }
    } catch (_error) {
      toast.error('Error removing team member', { id: toastId });
    }
  };

  const openAddMemberModal = () => {
    fetchAvailableUsers();
    setShowAddMemberModal(true);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const filteredUsers = availableUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="flex flex-col items-center space-y-3">
          <Loader className="w-6 h-6 text-white animate-spin" />
          <div className="text-white text-sm">Loading team details...</div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center space-x-4">
          <span className="mb-4 ml-0 flex justify-start items-start text-left border-none text-white">
            <span className="font-light">
              <span
                onClick={() => navigate(`/organizations/${orgId}`)}
                className="uppercase cursor-pointer text-white/80 font-mono text-sm"
              >
                teams /{' '}
              </span>
              <span className="text-white font-mono text-sm">{teamId}</span>
            </span>
          </span>
        </div>
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl text-white font-light mb-2">Team Not Found</h2>
          <p className="text-gray-400">The team you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="mb-4 ml-0 flex justify-start items-start text-left border-none text-white">
            <span className="font-light">
              <span
                onClick={() => navigate(`/organizations/${team.organizationId}`)}
                className="uppercase cursor-pointer text-white/80 font-mono text-sm"
              >
                teams /{' '}
              </span>
              <span className="text-white font-mono text-sm">{teamId}</span>
            </span>
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            onClick={openAddMemberModal}
            className="border border-dashed border-white/20 text-white hover:bg-white/10 bg-transparent rounded-none"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Members
          </Button>
          <Button
            onClick={() => setShowEditTeamModal(true)}
            className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Team
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-white/10 border border-dashed border-white/20 rounded-none flex items-center justify-center">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl text-white font-light inline-flex items-center">
            {team.name}
            {teamId && <CopyableId id={teamId} variant="subscript" />}
          </h1>
          <div className="flex items-center space-x-2 mt-1">
            {team.organization && (
              <Link
                to={`/organizations/${team.organizationId}`}
                className="text-gray-400 hover:text-white text-sm font-sans"
              >
                <Building2 className="w-4 h-4 inline mr-1" />
                {team.organization.name}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${
              activeTab === 'details'
                ? 'border-white text-white'
                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Details</span>
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${
              activeTab === 'members'
                ? 'border-white text-white'
                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="inline-flex items-start">
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
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="space-y-6">
          {/* Team Information */}
          <div className="bg-black/30 border border-dashed border-white/20 rounded-none p-6">
            <h3 className="text-lg text-white font-light mb-4">Team Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-gray-400 font-mono uppercase">Name</label>
                <p className="text-white font-sans mt-1">{team.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400 font-mono uppercase">Organization</label>
                <p className="text-white font-sans mt-1">{team.organization?.name || 'Unknown'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400 font-mono uppercase">Created</label>
                <p className="text-white font-sans mt-1">
                  {new Date(team.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-400 font-mono uppercase">Last Updated</label>
                <p className="text-white font-sans mt-1">
                  {new Date(team.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Team Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-black/30 border border-dashed border-white/20 rounded-none p-6">
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 text-white" />
                <div>
                  <p className="text-2xl text-white font-sans font-light">{members.length}</p>
                  <p className="text-sm text-gray-400 font-mono uppercase">Members</p>
                </div>
              </div>
            </div>
            <div className="bg-black/30 border border-dashed border-white/20 rounded-none p-6">
              <div className="flex items-center space-x-3">
                <Calendar className="w-8 h-8 text-white" />
                <div>
                  <p className="text-2xl text-white font-sans font-light">
                    {Math.ceil(
                      (Date.now() - new Date(team.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                    )}
                  </p>
                  <p className="text-sm text-gray-400 font-mono uppercase">Days Active</p>
                </div>
              </div>
            </div>
            <div className="bg-black/30 border border-dashed border-white/20 rounded-none p-6">
              <div className="flex items-center space-x-3">
                <Building2 className="w-8 h-8 text-white" />
                <div>
                  <p className="text-2xl text-white font-sans font-light">1</p>
                  <p className="text-sm text-gray-400 font-mono uppercase">Organization</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg relative text-white font-light inline-flex items-start">
                Team Members
                <AnimatedNumber
                  value={members.length}
                  className="text-white/80 font-mono text-xs"
                  prefix={<span className="mr-0.5 text-gray-500">[</span>}
                  suffix={<span className="ml-0.5 text-gray-500">]</span>}
                  format={{ notation: 'standard', maximumFractionDigits: 0 }}
                />
              </h3>
              <p className="text-gray-400 font-light font-mono text-xs uppercase mt-1">
                Manage members of this team
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
                        className="border-b border-dashed border-white/5 hover:bg-white/5"
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
                              <div className="text-white font-light">{member.user.name}</div>
                              <CopyableId id={member.user.id} />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-white">{member.user.email}</td>
                        <td className="py-4 px-4">
                          <Badge
                            variant="secondary"
                            className="text-xs bg-blue-900/10 border border-dashed border-blue-500/30 text-blue-400/70 rounded-none capitalize"
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
                              onClick={() => handleRemoveTeamMember(member.id, member.user.name)}
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
                <p className="text-gray-400 mb-6">Add members to this team to get started.</p>
                <Button
                  onClick={openAddMemberModal}
                  className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add First Members
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Members Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/90 border border-dashed border-white/20 p-6 w-full max-w-2xl rounded-none">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg text-white font-light">Add Team Members</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddMemberModal(false);
                  setSelectedUsers([]);
                  setSearchTerm('');
                }}
                className="text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                />
              </div>

              {/* Selected Count */}
              {selectedUsers.length > 0 && (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-none p-3">
                  <p className="text-blue-400 text-sm">
                    {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              )}

              {/* User List */}
              <div className="bg-black/30 border border-dashed border-white/20 rounded-none max-h-96 overflow-y-auto">
                {filteredUsers.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className={`flex items-center space-x-3 p-4 cursor-pointer hover:bg-white/5 ${
                          selectedUsers.includes(user.id) ? 'bg-blue-900/20' : ''
                        }`}
                        onClick={() => toggleUserSelection(user.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="rounded border-gray-300"
                        />
                        <img
                          src={
                            user.image ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
                          }
                          alt={user.name}
                          className="w-10 h-10 rounded-none border border-dashed border-white/20"
                        />
                        <div className="flex-1">
                          <div className="text-white font-light">{user.name}</div>
                          <div className="text-sm text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-gray-400">No users found matching your search.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddMemberModal(false);
                  setSelectedUsers([]);
                  setSearchTerm('');
                }}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddMembers}
                disabled={selectedUsers.length === 0}
                className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add {selectedUsers.length} Member{selectedUsers.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {showEditTeamModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/90 border border-dashed border-white/20 p-6 w-full max-w-md rounded-none">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light">Edit Team</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditTeamModal(false)}
                className="text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 bg-white/10 border border-dashed border-white/20 rounded-none flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="text-white font-light">{team.name}</div>
                  <div className="text-sm text-gray-400">{team.organization?.name}</div>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-team-name" className="text-sm text-gray-400 font-light">
                  Team Name
                </Label>
                <Input
                  id="edit-team-name"
                  value={teamFormData.name}
                  onChange={(e) => setTeamFormData({ name: e.target.value })}
                  placeholder="e.g. Development Team"
                  className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowEditTeamModal(false)}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateTeam}
                disabled={teamFormData.name === team.name}
                className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none"
              >
                Update Team
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
