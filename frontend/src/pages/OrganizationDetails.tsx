import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
    Building2,
    ArrowLeft,
    Edit,
    Users,
    Calendar,
    UserPlus,
    Trash2,
    Eye,
    Mail,
    X,
    Send,
    Clock,
    CheckCircle
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

interface Organization {
    id: string
    name: string
    slug: string
    metadata?: any
    createdAt: string
    updatedAt: string
}

interface Team {
    id: string
    name: string
    slug: string
    organizationId: string
    metadata?: any
    createdAt: string
    updatedAt: string
    memberCount?: number
}

interface Invitation {
    id: string
    email: string
    role: string
    status: 'pending' | 'accepted' | 'expired'
    organizationId: string
    teamId?: string
    invitedBy: string
    expiresAt: string
    createdAt: string
}

interface Member {
    id: string
    userId: string
    organizationId: string
    role: string
    joinedAt: string
    user: {
        id: string
        name: string
        email: string
        image?: string
        emailVerified: boolean
    }
}

// interface TeamMember {
//   id: string
//   userId: string
//   teamId: string
//   role: string
//   joinedAt: string
//   user: {
//     id: string
//     name: string
//     email: string
//     image?: string
//   }
// }

export default function OrganizationDetails() {
    const { orgId } = useParams<{ orgId: string }>()
    const [organization, setOrganization] = useState<Organization | null>(null)
    const [teams, setTeams] = useState<Team[]>([])
    const [invitations, setInvitations] = useState<Invitation[]>([])
    const [members, setMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'details' | 'members' | 'invitations' | 'teams'>('details')
    const [teamsEnabled, setTeamsEnabled] = useState(false)
    
    // Modal states
    const [showInviteModal, setShowInviteModal] = useState(false)
    const [showSeedMembersModal, setShowSeedMembersModal] = useState(false)
    const [showCreateTeamModal, setShowCreateTeamModal] = useState(false)
    const [showEditTeamModal, setShowEditTeamModal] = useState(false)
    const [showDeleteTeamModal, setShowDeleteTeamModal] = useState(false)
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
    
    // Form states
    const [inviteEmail, setInviteEmail] = useState('')
    const [teamFormData, setTeamFormData] = useState({ name: '', slug: '' })
    const [seedingLogs, setSeedingLogs] = useState<string[]>([])

    useEffect(() => {
        if (orgId) {
            fetchOrganization()
            checkTeamsEnabled()
            fetchInvitations()
            fetchMembers()
        }
    }, [orgId])

    // Utility function to generate slug from team name
    const generateSlug = (name: string): string => {
        return name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
    }

    // Handle team form name change with auto-slug generation
    const handleTeamNameChange = (name: string) => {
        const slug = generateSlug(name)
        setTeamFormData({ name, slug })
    }

    // Handle team form slug change (manual override)
    const handleTeamSlugChange = (slug: string) => {
        setTeamFormData(prev => ({ ...prev, slug: generateSlug(slug) }))
    }

    const fetchOrganization = async () => {
        try {
            const response = await fetch(`/api/organizations/${orgId}`)
            const data = await response.json()

            if (data.success) {
                setOrganization(data.organization)
                if (teamsEnabled) {
                    await fetchTeams()
                }
            } else {
                toast.error('Organization not found')
            }
        } catch (error) {
            console.error('Failed to fetch organization:', error)
            toast.error('Failed to load organization')
        } finally {
            setLoading(false)
        }
    }

    const checkTeamsEnabled = async () => {
        try {
            const response = await fetch('/api/plugins/teams/status')
            const data = await response.json()
            setTeamsEnabled(data.enabled)
        } catch (error) {
            console.error('Failed to check teams status:', error)
            setTeamsEnabled(false)
        }
    }

    const fetchTeams = async () => {
        try {
            const response = await fetch(`/api/organizations/${orgId}/teams`)
            const data = await response.json()

            if (data.success) {
                setTeams(data.teams || [])
            }
        } catch (error) {
            console.error('Failed to fetch teams:', error)
            toast.error('Failed to load teams')
        }
    }

    const fetchInvitations = async () => {
        try {
            const response = await fetch(`/api/organizations/${orgId}/invitations`)
            const data = await response.json()

            if (data.success) {
                setInvitations(data.invitations || [])
            }
        } catch (error) {
            console.error('Failed to fetch invitations:', error)
            toast.error('Failed to load invitations')
        }
    }

    const fetchMembers = async () => {
        try {
            const response = await fetch(`/api/organizations/${orgId}/members`)
            const data = await response.json()

            if (data.success) {
                setMembers(data.members || [])
            }
        } catch (error) {
            console.error('Failed to fetch members:', error)
            toast.error('Failed to load members')
        }
    }

    const handleSeedMembers = async (count: number) => {
        setSeedingLogs([])
        
        try {
            const response = await fetch(`/api/organizations/${orgId}/seed-members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ count })
            })
            
            const result = await response.json()
            
            if (result.success) {
                setSeedingLogs(result.results.map((r: any) =>
                    `✅ Added member: ${r.member.user.name} (${r.member.user.email})`
                ))
                // Refresh the members list
                await fetchMembers()
            } else {
                setSeedingLogs([`❌ Error: ${result.error || 'Failed to seed members'}`])
            }
        } catch (error) {
            setSeedingLogs([`❌ Error: ${error}`])
        }
    }

    // Invitation functions
    const handleInviteUser = async () => {
        if (!inviteEmail) {
            toast.error('Please enter an email address')
            return
        }

        const toastId = toast.loading('Sending invitation...')
        
        try {
            const response = await fetch(`/api/organizations/${orgId}/invitations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: inviteEmail,
                    role: 'member'
                })
            })

            const result = await response.json()

            if (result.success) {
                await fetchInvitations()
                setShowInviteModal(false)
                setInviteEmail('')
                toast.success('Invitation sent successfully!', { id: toastId })
            } else {
                toast.error(`Error sending invitation: ${result.error || 'Unknown error'}`, { id: toastId })
            }
        } catch (error) {
            console.error('Error sending invitation:', error)
            toast.error('Error sending invitation', { id: toastId })
        }
    }

    // Team functions
    const handleCreateTeam = async () => {
        if (!teamFormData.name) {
            toast.error('Please enter a team name')
            return
        }

        const toastId = toast.loading('Creating team...')
        
        try {
            const response = await fetch(`/api/organizations/${orgId}/teams`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: teamFormData.name,
                    slug: teamFormData.slug,
                    organizationId: orgId
                })
            })

            const result = await response.json()

            if (result.success) {
                await fetchTeams()
                setShowCreateTeamModal(false)
                setTeamFormData({ name: '', slug: '' })
                toast.success('Team created successfully!', { id: toastId })
            } else {
                toast.error(`Error creating team: ${result.error || 'Unknown error'}`, { id: toastId })
            }
        } catch (error) {
            console.error('Error creating team:', error)
            toast.error('Error creating team', { id: toastId })
        }
    }

    const handleUpdateTeam = async () => {
        if (!selectedTeam || !teamFormData.name) {
            toast.error('Please enter a team name')
            return
        }

        const toastId = toast.loading('Updating team...')
        
        try {
            const response = await fetch(`/api/teams/${selectedTeam.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: teamFormData.name,
                    slug: teamFormData.slug
                })
            })

            const result = await response.json()

            if (result.success) {
                await fetchTeams()
                setShowEditTeamModal(false)
                setSelectedTeam(null)
                setTeamFormData({ name: '', slug: '' })
                toast.success('Team updated successfully!', { id: toastId })
            } else {
                toast.error(`Error updating team: ${result.error || 'Unknown error'}`, { id: toastId })
            }
        } catch (error) {
            console.error('Error updating team:', error)
            toast.error('Error updating team', { id: toastId })
        }
    }

    const handleDeleteTeam = async () => {
        if (!selectedTeam) {
            toast.error('No team selected')
            return
        }

        const toastId = toast.loading('Deleting team...')
        
        try {
            const response = await fetch(`/api/teams/${selectedTeam.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            })

            const result = await response.json()

            if (result.success) {
                await fetchTeams()
                setShowDeleteTeamModal(false)
                setSelectedTeam(null)
                toast.success('Team deleted successfully!', { id: toastId })
            } else {
                toast.error(`Error deleting team: ${result.error || 'Unknown error'}`, { id: toastId })
            }
        } catch (error) {
            console.error('Error deleting team:', error)
            toast.error('Error deleting team', { id: toastId })
        }
    }

    // Modal handlers
    const openEditTeamModal = (team: Team) => {
        setSelectedTeam(team)
        setTeamFormData({ name: team.name, slug: team.slug })
        setShowEditTeamModal(true)
    }

    const openDeleteTeamModal = (team: Team) => {
        setSelectedTeam(team)
        setShowDeleteTeamModal(true)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-white">Loading organization details...</div>
            </div>
        )
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
        )
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link to="/organizations">
                        <Button variant="ghost" className="text-gray-400 hover:text-white rounded-none">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Organizations
                        </Button>
                    </Link>

                </div>

                <div className="flex items-center space-x-3">
                    <Button 
                        onClick={() => setShowSeedMembersModal(true)}
                        className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
                    >
                        <Users className="w-4 h-4 mr-2" />
                        Seed Members
                    </Button>
                    <Button 
                        onClick={() => setShowInviteModal(true)}
                        className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
                    >
                        <Mail className="w-4 h-4 mr-2" />
                        Invite User
                    </Button>
                    <Button className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none">
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
                    <h1 className="text-2xl text-white font-light">{organization.name}</h1>
                    <p className="text-gray-400">{organization.slug}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-white/10">
                <nav className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${activeTab === 'details'
                            ? 'border-white text-white'
                            : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
                            }`}
                    >
                        <Building2 className="w-4 h-4" />
                        <span>Details</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${activeTab === 'members'
                            ? 'border-white text-white'
                            : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        <span>Members</span>
                        {members.length > 0 && (
                            <Badge variant="secondary" className="text-xs bg-white/10 border border-white/20 rounded-sm">
                                {members.length}
                            </Badge>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('invitations')}
                        className={`flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${activeTab === 'invitations'
                            ? 'border-white text-white'
                            : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
                            }`}
                    >
                        <Mail className="w-4 h-4" />
                        <span>Invitations</span>
                        {invitations.length > 0 && (
                            <Badge variant="secondary" className="text-xs bg-white/10 border border-white/20 rounded-sm">
                                {invitations.length}
                            </Badge>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('teams')}
                        className={`flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${activeTab === 'teams'
                            ? 'border-white text-white'
                            : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        <span>Teams</span>
                        {teams.length > 0 && (
                            <Badge variant="secondary" className="text-xs bg-white/10 border border-white/20 rounded-sm">
                                {teams.length}
                            </Badge>
                        )}
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'details' && (
                <div className="space-y-6">
                    {/* Organization Information */}
                    <div className="bg-black/30 border border-dashed border-white/20 rounded-none p-6">
                        <h3 className="text-lg text-white font-light mb-4">Organization Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm text-gray-400 font-light">Name</label>
                                <p className="text-white mt-1">{organization.name}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 font-light">Slug</label>
                                <p className="text-white mt-1">{organization.slug}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 font-light">Created</label>
                                <p className="text-white mt-1">
                                    {new Date(organization.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 font-light">Last Updated</label>
                                <p className="text-white mt-1">
                                    {new Date(organization.updatedAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Organization Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-black/30 border border-dashed border-white/20 rounded-none p-6">
                            <div className="flex items-center space-x-3">
                                <Users className="w-8 h-8 text-white" />
                                <div>
                                    <p className="text-2xl text-white font-light">{members.length}</p>
                                    <p className="text-sm text-gray-400">Members</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-black/30 border border-dashed border-white/20 rounded-none p-6">
                            <div className="flex items-center space-x-3">
                                <Users className="w-8 h-8 text-white" />
                                <div>
                                    <p className="text-2xl text-white font-light">{teams.length}</p>
                                    <p className="text-sm text-gray-400">Teams</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-black/30 border border-dashed border-white/20 rounded-none p-6">
                            <div className="flex items-center space-x-3">
                                <Calendar className="w-8 h-8 text-white" />
                                <div>
                                    <p className="text-2xl text-white font-light">
                                        {Math.ceil((new Date().getTime() - new Date(organization.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                                    </p>
                                    <p className="text-sm text-gray-400">Days Active</p>
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
                            <h3 className="text-lg text-white font-light">Teams ({teams.length})</h3>
                            <p className="text-gray-400 mt-1">Manage teams within this organization</p>
                        </div>
                        <Button 
                            onClick={() => setShowCreateTeamModal(true)}
                            className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none"
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Create Team
                        </Button>
                    </div>

                    {/* Teams List */}
                    {teams.length > 0 ? (
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
                                            <tr key={team.id} className="border-b border-dashed border-white/5 hover:bg-white/5">
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-10 h-10 bg-white/10 border border-dashed border-white/20 rounded-none flex items-center justify-center">
                                                            <Users className="w-5 h-5 text-white" />
                                                        </div>
                                                        <div>
                                                            <div className="text-white font-light">{team.name}</div>
                                                            <div className="text-sm text-gray-400">{team.slug}</div>
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
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-gray-400 hover:text-white rounded-none"
                                                            onClick={() => {/* Navigate to team details */}}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-gray-400 hover:text-white rounded-none"
                                                            onClick={() => openEditTeamModal(team)}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-400 hover:text-red-300 rounded-none"
                                                            onClick={() => openDeleteTeamModal(team)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
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
                            <h3 className="text-lg text-white font-light">Members ({members.length})</h3>
                            <p className="text-gray-400 mt-1">Manage organization members and their roles</p>
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
                                            <tr key={member.id} className="border-b border-dashed border-white/5 hover:bg-white/5">
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center space-x-3">
                                                        <img
                                                            src={member.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user.id}`}
                                                            alt={member.user.name}
                                                            className="w-10 h-10 rounded-none border border-dashed border-white/20"
                                                        />
                                                        <div>
                                                            <div className="text-white font-light">{member.user.name}</div>
                                                            <div className="text-sm text-gray-400">ID: {member.user.id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-white">{member.user.email}</td>
                                                <td className="py-4 px-4">
                                                    <Badge variant="secondary" className="text-xs bg-blue-900/50 border border-blue-500/30 text-blue-400 rounded-sm capitalize">
                                                        {member.role}
                                                    </Badge>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-gray-400">
                                                    {new Date(member.joinedAt).toLocaleDateString()}
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-gray-400 hover:text-white rounded-none"
                                                            onClick={() => {/* Change role */}}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-400 hover:text-red-300 rounded-none"
                                                            onClick={() => {/* Remove member */}}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
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
                                        className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
                                    >
                                        <Users className="w-4 h-4 mr-2" />
                                        Seed Members
                                    </Button>
                                    <Button 
                                        onClick={() => setShowInviteModal(true)}
                                        className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none"
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
                            <h3 className="text-lg text-white font-light">Invitations ({invitations.length})</h3>
                            <p className="text-gray-400 mt-1">Manage pending invitations to this organization</p>
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
                                            <tr key={invitation.id} className="border-b border-dashed border-white/5 hover:bg-white/5">
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-10 h-10 bg-white/10 border border-dashed border-white/20 rounded-none flex items-center justify-center">
                                                            <Mail className="w-5 h-5 text-white" />
                                                        </div>
                                                        <div>
                                                            <div className="text-white font-light">{invitation.email}</div>
                                                            <div className="text-sm text-gray-400">Invited {new Date(invitation.createdAt).toLocaleDateString()}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-white capitalize">{invitation.role}</td>
                                                <td className="py-4 px-4">
                                                    <Badge 
                                                        variant="secondary" 
                                                        className={`text-xs rounded-sm flex items-center gap-1 w-fit ${
                                                            invitation.status === 'pending' 
                                                                ? 'bg-yellow-900/50 border border-yellow-500/30 text-yellow-400'
                                                                : invitation.status === 'accepted'
                                                                ? 'bg-green-900/50 border border-green-500/30 text-green-400'
                                                                : 'bg-red-900/50 border border-red-500/30 text-red-400'
                                                        }`}
                                                    >
                                                        {invitation.status === 'pending' && <Clock className="w-3 h-3" />}
                                                        {invitation.status === 'accepted' && <CheckCircle className="w-3 h-3" />}
                                                        {invitation.status === 'expired' && <X className="w-3 h-3" />}
                                                        {invitation.status}
                                                    </Badge>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-gray-400">
                                                    {new Date(invitation.expiresAt).toLocaleDateString()}
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-gray-400 hover:text-white rounded-none"
                                                            onClick={() => {/* Resend invitation */}}
                                                        >
                                                            <Send className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-400 hover:text-red-300 rounded-none"
                                                            onClick={() => {/* Cancel invitation */}}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
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
                                    onClick={() => setShowInviteModal(true)}
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

            {/* Invite User Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-black/90 border border-dashed border-white/20 p-6 w-full max-w-md rounded-none">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg text-white font-light">Invite User</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setShowInviteModal(false)
                                    setInviteEmail('')
                                }}
                                className="text-gray-400 hover:text-white rounded-none"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="invite-email" className="text-sm text-gray-400 font-light">Email Address</Label>
                                <Input
                                    id="invite-email"
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="user@example.com"
                                    className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowInviteModal(false)
                                    setInviteEmail('')
                                }}
                                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleInviteUser}
                                className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none"
                            >
                                <Send className="w-4 h-4 mr-2" />
                                Send Invitation
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Team Modal */}
            {showCreateTeamModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-black/90 border border-dashed border-white/20 p-6 w-full max-w-md rounded-none">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg text-white font-light">Create Team</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setShowCreateTeamModal(false)
                                    setTeamFormData({ name: '', slug: '' })
                                }}
                                className="text-gray-400 hover:text-white rounded-none"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="team-name" className="text-sm text-gray-400 font-light">Team Name</Label>
                                <Input
                                    id="team-name"
                                    value={teamFormData.name}
                                    onChange={(e) => handleTeamNameChange(e.target.value)}
                                    placeholder="e.g. Development Team"
                                    className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                                />
                            </div>
                            <div>
                                <Label htmlFor="team-slug" className="text-sm text-gray-400 font-light">Team Slug</Label>
                                <Input
                                    id="team-slug"
                                    value={teamFormData.slug}
                                    onChange={(e) => handleTeamSlugChange(e.target.value)}
                                    placeholder="e.g. development-team"
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
                                    setShowCreateTeamModal(false)
                                    setTeamFormData({ name: '', slug: '' })
                                }}
                                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateTeam}
                                className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none"
                            >
                                Create Team
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Team Modal */}
            {showEditTeamModal && selectedTeam && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-black/90 border border-dashed border-white/20 p-6 w-full max-w-md rounded-none">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg text-white font-light">Edit Team</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setShowEditTeamModal(false)
                                    setTeamFormData({ name: '', slug: '' })
                                }}
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
                                    <div className="text-white font-light">{selectedTeam.name}</div>
                                    <div className="text-sm text-gray-400">{selectedTeam.slug}</div>
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="edit-team-name" className="text-sm text-gray-400 font-light">Team Name</Label>
                                <Input
                                    id="edit-team-name"
                                    value={teamFormData.name}
                                    onChange={(e) => handleTeamNameChange(e.target.value)}
                                    placeholder="e.g. Development Team"
                                    className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-team-slug" className="text-sm text-gray-400 font-light">Team Slug</Label>
                                <Input
                                    id="edit-team-slug"
                                    value={teamFormData.slug}
                                    onChange={(e) => handleTeamSlugChange(e.target.value)}
                                    placeholder="e.g. development-team"
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
                                    setShowEditTeamModal(false)
                                    setTeamFormData({ name: '', slug: '' })
                                }}
                                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpdateTeam}
                                className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none"
                            >
                                Update Team
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Team Modal */}
            {showDeleteTeamModal && selectedTeam && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-black/90 border border-dashed border-white/20 p-6 w-full max-w-md rounded-none">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg text-white font-light">Delete Team</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowDeleteTeamModal(false)}
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
                                    <div className="text-white font-light">{selectedTeam.name}</div>
                                    <div className="text-sm text-gray-400">{selectedTeam.slug}</div>
                                </div>
                            </div>
                            <p className="text-gray-400">Are you sure you want to delete this team? This action cannot be undone.</p>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setShowDeleteTeamModal(false)}
                                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleDeleteTeam}
                                className="bg-red-600 hover:bg-red-700 text-white border border-red-600 rounded-none"
                            >
                                Delete Team
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Seed Members Modal */}
            {showSeedMembersModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-black/90 border border-dashed border-white/20 p-6 w-full max-w-lg rounded-none">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg text-white font-light">Seed Members</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowSeedMembersModal(false)}
                                className="text-gray-400 hover:text-white rounded-none"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Users className="w-5 h-5 text-white" />
                                    <h4 className="text-white font-light">Add Members from Existing Users</h4>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="flex-1">
                                        <Label htmlFor="member-count" className="text-sm text-gray-400 font-light">Number of members to add</Label>
                                        <Input
                                            id="member-count"
                                            type="number"
                                            min="1"
                                            max="50"
                                            defaultValue="5"
                                            className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                                        />
                                    </div>
                                    <Button
                                        onClick={() => {
                                            const count = parseInt((document.getElementById('member-count') as HTMLInputElement)?.value || '5')
                                            handleSeedMembers(count)
                                        }}
                                        className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none mt-6"
                                    >
                                        Seed Members
                                    </Button>
                                </div>
                            </div>

                            {/* Seeding Logs */}
                            {seedingLogs.length > 0 && (
                                <div className="mt-6">
                                    <h5 className="text-sm text-white font-light">Seeding Log</h5>
                                    <br />
                                    <div className="flex w-full mb-3">
                                        <details className="group w-full">
                                            <summary className="cursor-pointer text-sm text-gray-400 font-light hover:text-white">
                                                View Details ({seedingLogs.length} items)
                                            </summary>
                                            <div className="mt-3 p-4 bg-black/50 border border-dashed border-white/20 rounded-none">
                                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                                    {seedingLogs.map((log, index) => (
                                                        <div key={index} className="text-xs font-mono text-gray-300 flex items-start space-x-2">
                                                            <span className="text-green-400">✓</span>
                                                            <span>{log}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </details>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end mt-6 pt-6 border-t border-dashed border-white/10">
                            <Button
                                variant="outline"
                                onClick={() => setShowSeedMembersModal(false)}
                                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
