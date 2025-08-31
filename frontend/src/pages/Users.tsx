import { useState, useEffect } from 'react'
import {
  Users as UsersIcon,
  Search,
  Filter,
  Edit,
  Trash2,
  UserPlus,
  Shield,
  Mail,
  Eye,
  X,
  Database
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectItem } from '../components/ui/select'

interface User {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image?: string
  createdAt: string
  updatedAt: string
  status?: string
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [usersPerPage] = useState(10)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showSeedModal, setShowSeedModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [seedingLogs, setSeedingLogs] = useState<string[]>([])

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSeedUsers = async (count: number) => {
    setSeedingLogs([])
    
    try {
      const response = await fetch('/api/seed/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setSeedingLogs(result.results.map((r: any) =>
          `✅ Created user: ${r.user.name} (${r.user.email})`
        ))
        // Refresh the users list to show updated count
        await fetchUsers()
      } else {
        setSeedingLogs([`❌ Error: ${result.error || 'Failed to seed users'}`])
      }
    } catch (error) {
      setSeedingLogs([`❌ Error: ${error}`])
    }
  }

  const handleSeedInvitations = async (count: number) => {
    setSeedingLogs([])
    
    try {
      // Mock implementation for now
      const mockResults = Array.from({ length: count }, (_, i) => ({
        invitation: {
          id: `inv_${Date.now()}_${i}`,
          email: `invited${i + 1}@example.com`,
          role: 'member'
        }
      }))
      
      setSeedingLogs(mockResults.map((r: any) =>
        `✅ Created invitation: ${r.invitation.email}`
      ))
    } catch (error) {
      setSeedingLogs([`❌ Error: ${error}`])
    }
  }

  const openViewModal = (user: User) => {
    setSelectedUser(user)
    setShowViewModal(true)
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const openDeleteModal = (user: User) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  const handleCreateUser = async () => {
    const name = (document.getElementById('create-name') as HTMLInputElement)?.value
    const email = (document.getElementById('create-email') as HTMLInputElement)?.value
    const password = (document.getElementById('create-password') as HTMLInputElement)?.value

    if (!name || !email || !password) {
      alert('Please fill in all fields')
      return
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })

      const result = await response.json()

      if (result.success) {
        // Refresh the users list to show the new user
        await fetchUsers()
        setShowCreateModal(false)
        // Clear the form
        ;(document.getElementById('create-name') as HTMLInputElement).value = ''
        ;(document.getElementById('create-email') as HTMLInputElement).value = ''
        ;(document.getElementById('create-password') as HTMLInputElement).value = ''
      } else {
        alert(`Error creating user: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Error creating user')
    }
  }

  const handleUpdateUser = async (userData: any) => {
    // Implementation for updating user
    console.log('Updating user:', userData)
    setShowEditModal(false)
  }

  const handleDeleteUser = async () => {
    // Implementation for deleting user
    console.log('Deleting user:', selectedUser?.id)
    setShowDeleteModal(false)
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'all' || user.status === filter
    return matchesSearch && matchesFilter
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
  const startIndex = (currentPage - 1) * usersPerPage
  const endIndex = startIndex + usersPerPage
  const currentUsers = filteredUsers.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-white font-light">Users ({users.length})</h1>
          <p className="text-gray-400 mt-1">Manage your application users</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
            onClick={() => setShowSeedModal(true)}
          >
            <Database className="w-4 h-4 mr-2" />
            Seed
          </Button>
          <Button
            className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none"
            onClick={() => setShowCreateModal(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </Select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-black/30 border border-dashed border-white/20 rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dashed border-white/10">
                <th className="text-left py-4 px-4 text-white font-light">User</th>
                <th className="text-left py-4 px-4 text-white font-light">Email</th>
                <th className="text-left py-4 px-4 text-white font-light">Status</th>
                <th className="text-left py-4 px-4 text-white font-light">Created</th>
                <th className="text-right py-4 px-4 text-white font-light">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((user) => (
                <tr key={user.id} className="border-b border-dashed border-white/5 hover:bg-white/5">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                        alt={user.name}
                        className="w-10 h-10 rounded-none border border-dashed border-white/20"
                      />
                      <div>
                        <div className="text-white font-light">{user.name}</div>
                        <div className="text-sm text-gray-400">ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-white">{user.email}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      {user.emailVerified ? (
                        <Shield className="w-4 h-4 text-green-400" />
                      ) : (
                        <Mail className="w-4 h-4 text-yellow-400" />
                      )}
                      <span className="text-sm text-gray-400">
                        {user.emailVerified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white rounded-none"
                        onClick={() => openViewModal(user)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white rounded-none"
                        onClick={() => openEditModal(user)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 rounded-none"
                        onClick={() => openDeleteModal(user)}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-400">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
              >
                Previous
              </Button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className={
                    currentPage === page
                      ? "bg-white text-black rounded-none"
                      : "border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
                  }
                >
                  {page}
                </Button>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Seed Modal */}
      {showSeedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/90 border border-dashed border-white/20 p-6 w-full max-w-lg rounded-none">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg text-white font-light">Seed Data</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSeedModal(false)}
                className="text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-6">
              {/* User Seeding */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <UsersIcon className="w-5 h-5 text-white" />
                  <h4 className="text-white font-light">Seed Users</h4>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <Label htmlFor="user-count" className="text-sm text-gray-400 font-light">Number of users</Label>
                    <Input
                      id="user-count"
                      type="number"
                      min="1"
                      max="100"
                      defaultValue="5"
                      className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      const count = parseInt((document.getElementById('user-count') as HTMLInputElement)?.value || '5')
                      handleSeedUsers(count)
                    }}
                    className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none mt-6"
                  >
                    Seed Users
                  </Button>
                </div>
              </div>
              
              {/* Invitation Seeding */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Mail className="w-5 h-5 text-white" />
                  <h4 className="text-white font-light">Seed Invitations</h4>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <Label htmlFor="invitation-count" className="text-sm text-gray-400 font-light">Number of invitations</Label>
                    <Input
                      id="invitation-count"
                      type="number"
                      min="1"
                      max="100"
                      defaultValue="5"
                      className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      const count = parseInt((document.getElementById('invitation-count') as HTMLInputElement)?.value || '5')
                      handleSeedInvitations(count)
                    }}
                    className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none mt-6"
                  >
                    Seed Invitations
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
                onClick={() => setShowSeedModal(false)}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/90 border border-dashed border-white/20 p-6 w-full max-w-md rounded-none">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light">Create User</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="create-name" className="text-sm text-gray-400 font-light">Name</Label>
                <Input
                  id="create-name"
                  className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                />
              </div>
              <div>
                <Label htmlFor="create-email" className="text-sm text-gray-400 font-light">Email</Label>
                <Input
                  id="create-email"
                  type="email"
                  className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                />
              </div>
              <div>
                <Label htmlFor="create-password" className="text-sm text-gray-400 font-light">Password</Label>
                <Input
                  id="create-password"
                  type="password"
                  className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateUser}
                className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none"
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/90 border border-dashed border-white/20 p-6 w-full max-w-md rounded-none">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light">Edit User</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedUser.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.id}`}
                  alt={selectedUser.name}
                  className="w-16 h-16 rounded-none border border-dashed border-white/20"
                />
                <div>
                  <div className="text-white font-light">{selectedUser.name}</div>
                  <div className="text-sm text-gray-400">{selectedUser.email}</div>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-name" className="text-sm text-gray-400 font-light">Name</Label>
                <Input
                  id="edit-name"
                  defaultValue={selectedUser.name}
                  className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                />
              </div>
              <div>
                <Label htmlFor="edit-email" className="text-sm text-gray-400 font-light">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  defaultValue={selectedUser.email}
                  className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleUpdateUser({})}
                className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none"
              >
                Update
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && selectedUser && (
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
                <img
                  src={selectedUser.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.id}`}
                  alt={selectedUser.name}
                  className="w-16 h-16 rounded-none border border-dashed border-white/20"
                />
                <div>
                  <div className="text-white font-light">{selectedUser.name}</div>
                  <div className="text-sm text-gray-400">{selectedUser.email}</div>
                </div>
              </div>
              <p className="text-gray-400">Are you sure you want to delete this user? This action cannot be undone.</p>
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
                className="bg-red-600 hover:bg-red-700 text-white border border-red-600 rounded-none"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/90 border border-dashed border-white/20 p-6 w-full max-w-md rounded-none">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light">User Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedUser.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.id}`}
                  alt={selectedUser.name}
                  className="w-16 h-16 rounded-none border border-dashed border-white/20"
                />
                <div>
                  <div className="text-white font-light">{selectedUser.name}</div>
                  <div className="text-sm text-gray-400">{selectedUser.email}</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">ID:</span>
                  <span className="text-white text-sm">{selectedUser.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Email Verified:</span>
                  <span className="text-white text-sm">{selectedUser.emailVerified ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Created:</span>
                  <span className="text-white text-sm">{new Date(selectedUser.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Updated:</span>
                  <span className="text-white text-sm">{new Date(selectedUser.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button
                onClick={() => setShowViewModal(false)}
                className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none"
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
