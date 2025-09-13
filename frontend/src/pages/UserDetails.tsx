import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Building2, Users, Mail, Calendar, Edit, Ban, UserMinus, Clock, Monitor, Globe } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { toast } from 'sonner'

interface User {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image?: string
  createdAt: string
  updatedAt: string
}

interface Organization {
  id: string
  name: string
  slug: string
  image?: string
  createdAt: string
  role: string
}

interface Team {
  id: string
  name: string
  organizationId: string
  organizationName: string
  role: string
  createdAt: string
}

interface OrganizationMembership {
  id: string
  organization: Organization
  role: string
  joinedAt: string
}

interface TeamMembership {
  id: string
  team: Team
  role: string
  joinedAt: string
}

interface Session {
  id: string
  token: string
  expiresAt: string
  ipAddress: string
  userAgent: string
  activeOrganizationId?: string
  activeTeamId?: string
  createdAt: string
  updatedAt: string
}

export default function UserDetails() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [organizations, setOrganizations] = useState<OrganizationMembership[]>([])
  const [teams, setTeams] = useState<TeamMembership[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'details' | 'organizations' | 'teams' | 'sessions'>('details')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showBanModal, setShowBanModal] = useState(false)

  useEffect(() => {
    if (userId) {
      fetchUserDetails()
      fetchUserMemberships()
    }
  }, [userId])

  const fetchUserDetails = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        toast.error('Failed to fetch user details')
        navigate('/users')
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error)
      toast.error('Failed to fetch user details')
      navigate('/users')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserMemberships = async () => {
    try {
      const [orgResponse, teamResponse, sessionResponse] = await Promise.all([
        fetch(`/api/users/${userId}/organizations`),
        fetch(`/api/users/${userId}/teams`),
        fetch(`/api/users/${userId}/sessions`)
      ])

      if (orgResponse.ok) {
        const orgData = await orgResponse.json()
        setOrganizations(orgData.memberships || [])
      }

      if (teamResponse.ok) {
        const teamData = await teamResponse.json()
        setTeams(teamData.memberships || [])
      }

      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json()
        setSessions(sessionData.sessions || [])
      }
    } catch (error) {
      console.error('Failed to fetch user memberships:', error)
    }
  }

  const handleEditUser = async () => {
    if (!user) return

    const name = (document.getElementById('edit-name') as HTMLInputElement)?.value
    const email = (document.getElementById('edit-email') as HTMLInputElement)?.value

    if (!name || !email) {
      toast.error('Please fill in all fields')
      return
    }

    const toastId = toast.loading('Updating user...')
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      })

      const result = await response.json()

      if (result.success) {
        setUser({ ...user, name, email })
        setShowEditModal(false)
        toast.success('User updated successfully!', { id: toastId })
      } else {
        toast.error(`Error updating user: ${result.error || 'Unknown error'}`, { id: toastId })
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Error updating user', { id: toastId })
    }
  }

  const handleBanUser = async () => {
    if (!user) return

    const toastId = toast.loading('Banning user...')
    try {
      const response = await fetch(`/api/users/${userId}/ban`, {
        method: 'POST'
      })

      const result = await response.json()

      if (result.success) {
        toast.success('User banned successfully!', { id: toastId })
        navigate('/users')
      } else {
        toast.error(`Error banning user: ${result.error || 'Unknown error'}`, { id: toastId })
      }
    } catch (error) {
      console.error('Error banning user:', error)
      toast.error('Error banning user', { id: toastId })
    }
  }

  const handleRemoveFromOrganization = async (membershipId: string) => {
    const toastId = toast.loading('Removing user from organization...')
    try {
      const response = await fetch(`/api/organizations/members/${membershipId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        setOrganizations(prev => prev.filter(m => m.id !== membershipId))
        toast.success('User removed from organization!', { id: toastId })
      } else {
        toast.error(`Error removing user: ${result.error || 'Unknown error'}`, { id: toastId })
      }
    } catch (error) {
      console.error('Error removing user from organization:', error)
      toast.error('Error removing user from organization', { id: toastId })
    }
  }

  const handleRemoveFromTeam = async (membershipId: string) => {
    const toastId = toast.loading('Removing user from team...')
    try {
      const response = await fetch(`/api/teams/members/${membershipId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        setTeams(prev => prev.filter(m => m.id !== membershipId))
        toast.success('User removed from team!', { id: toastId })
      } else {
        toast.error(`Error removing user: ${result.error || 'Unknown error'}`, { id: toastId })
      }
    } catch (error) {
      console.error('Error removing user from team:', error)
      toast.error('Error removing user from team', { id: toastId })
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    const toastId = toast.loading('Deleting session...')
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        setSessions(prev => prev.filter(s => s.id !== sessionId))
        toast.success('Session deleted successfully!', { id: toastId })
      } else {
        toast.error(`Error deleting session: ${result.error || 'Unknown error'}`, { id: toastId })
      }
    } catch (error) {
      console.error('Error deleting session:', error)
      toast.error('Error deleting session', { id: toastId })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Loading user details...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">User not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black w-full">
      <div className="w-full px-6 py-8">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/users')}
            className="mb-4 border-none text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>

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
                <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                <p className="text-gray-400">{user.email}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant={user.emailVerified ? "default" : "destructive"} className="rounded-none">
                    {user.emailVerified ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(true)}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit User
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowBanModal(true)}
                className="border border-dashed border-red-400/50 text-red-400 hover:bg-red-400/10 rounded-none"
              >
                <Ban className="w-4 h-4 mr-2" />
                Ban User
              </Button>
            </div>
          </div>
        </div>

        <div className="border border-dashed border-white/10 rounded-none">
          <div className="border-b border-dashed border-white/10">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'details', name: 'Details', icon: User },
                { id: 'organizations', name: 'Organizations', icon: Building2, count: organizations.length },
                { id: 'teams', name: 'Teams', icon: Users, count: teams.length },
                { id: 'sessions', name: 'Sessions', icon: Clock, count: sessions.length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-white text-white'
                      : 'border-transparent text-gray-400 hover:text-white hover:border-white/50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                  {tab.count !== undefined && (
                    <Badge variant="outline" className="rounded-none text-xs">
                      {tab.count}
                    </Badge>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                      <div className="text-white">{user.name}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                      <div className="text-white flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>{user.email}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Email Status</label>
                      <Badge variant={user.emailVerified ? "default" : "destructive"} className="rounded-none">
                        {user.emailVerified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Created</label>
                      <div className="text-white flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Last Updated</label>
                      <div className="text-white flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(user.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">User ID</label>
                      <div className="text-white font-mono text-sm">{user.id}</div>
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
                              <h3 className="text-white font-medium">{membership.organization.name}</h3>
                              <p className="text-gray-400 text-sm">@{membership.organization.slug}</p>
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
                              <p className="text-gray-400 text-sm">in {membership.team.organizationName}</p>
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
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-black/80 border border-dashed border-white/20 flex items-center justify-center">
                              <Monitor className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-white font-medium">Session {session.id.substring(0, 8)}...</h3>
                              <p className="text-gray-400 text-sm">Token: {session.token.substring(0, 20)}...</p>
                              <div className="flex items-center space-x-4 mt-1">
                                <div className="flex items-center space-x-1 text-gray-400 text-xs">
                                  <Globe className="w-3 h-3" />
                                  <span>{session.ipAddress}</span>
                                </div>
                                <div className="flex items-center space-x-1 text-gray-400 text-xs">
                                  <Clock className="w-3 h-3" />
                                  <span>Expires {new Date(session.expiresAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="text-gray-400 text-xs mt-1">
                                Created: {new Date(session.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteSession(session.id)}
                            className="border border-dashed border-red-400/50 text-red-400 hover:bg-red-400/10 rounded-none"
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
          <div className="bg-black border border-dashed border-red-400/50 rounded-none p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Ban User</h2>
            <p className="text-gray-400 mb-6">
              Are you sure you want to ban <strong>{user.name}</strong>? This will prevent them from accessing the system.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowBanModal(false)}
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
    </div>
  )
}
