import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Users as UsersIcon,
  Search,
  Filter,
  Edit,
  Trash2,
  UserPlus,
  Mail,
  Eye,
  X,
  Database,
  Check,
  Loader,
  Download
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Terminal } from '../components/Terminal'
import { useCounts } from '../contexts/CountsContext'
import { Pagination } from '../components/ui/pagination'

interface User {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image?: string
  createdAt: string
  updatedAt: string
}

export default function Users() {
  const navigate = useNavigate()
  const { refetchCounts } = useCounts()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [usersPerPage] = useState(20)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showSeedModal, setShowSeedModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [seedingLogs, setSeedingLogs] = useState<Array<{
    id: string
    type: 'info' | 'success' | 'error' | 'progress'
    message: string
    timestamp: Date
    status?: 'pending' | 'running' | 'completed' | 'failed'
  }>>([])
  const [isSeeding, setIsSeeding] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users?limit=10000')
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
    setIsSeeding(true)
    
    setSeedingLogs([{
      id: 'start',
      type: 'info',
      message: `Starting user seeding process for ${count} users...`,
      timestamp: new Date()
    }])
    
    try {
      const response = await fetch('/api/seed/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count })
      })
      
      const result = await response.json()
      
      if (result.success) {
        const progressLogs = result.results.map((r: any, index: number) => {
          if (r.success) {
            return {
              id: `user-${index}`,
              type: 'progress' as const,
              message: `Creating user: ${r.user.name} (${r.user.email})`,
              timestamp: new Date(),
              status: 'completed' as const
            }
          } else {
            return {
              id: `user-${index}`,
              type: 'error' as const,
              message: `Failed to create user ${index + 1}: ${r.error}`,
              timestamp: new Date()
            }
          }
        })
        
        setSeedingLogs(prev => [...prev, ...progressLogs])
        
        const successCount = result.results.filter((r: any) => r.success).length
        setSeedingLogs(prev => [...prev, {
          id: 'complete',
          type: 'success',
          message: `✅ Seeding completed! Created ${successCount}/${count} users successfully`,
          timestamp: new Date()
        }])
        
        await fetchUsers()
        await refetchCounts()
      } else {
        setSeedingLogs(prev => [...prev, {
          id: 'error',
          type: 'error',
          message: `❌ Seeding failed: ${result.error || 'Unknown error'}`,
          timestamp: new Date()
        }])
      }
    } catch (error) {
      setSeedingLogs(prev => [...prev, {
        id: 'error',
        type: 'error',
        message: `❌ Network error: ${error}`,
        timestamp: new Date()
      }])
    } finally {
      setIsSeeding(false)
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
      toast.error('Please fill in all fields')
      return
    }

    const toastId = toast.loading('Creating user...')
    
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })

      const result = await response.json()

      if (result.success) {
        await fetchUsers()
        setShowCreateModal(false)
        ;(document.getElementById('create-name') as HTMLInputElement).value = ''
        ;(document.getElementById('create-email') as HTMLInputElement).value = ''
        ;(document.getElementById('create-password') as HTMLInputElement).value = ''
        toast.success('User created successfully!', { id: toastId })
      } else {
        toast.error(`Error creating user: ${result.error || 'Unknown error'}`, { id: toastId })
      }
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error('Error creating user', { id: toastId })
    }
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) {
      toast.error('No user selected')
      return
    }

    const name = (document.getElementById('edit-name') as HTMLInputElement)?.value
    const email = (document.getElementById('edit-email') as HTMLInputElement)?.value

    if (!name || !email) {
      toast.error('Please fill in all fields')
      return
    }

    const toastId = toast.loading('Updating user...')
    
    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      })

      const result = await response.json()

      if (result.success) {
        await fetchUsers()
        setShowEditModal(false)
        setSelectedUser(null)
        toast.success('User updated successfully!', { id: toastId })
      } else {
        toast.error(`Error updating user: ${result.error || 'Unknown error'}`, { id: toastId })
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Error updating user', { id: toastId })
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) {
      toast.error('No user selected')
      return
    }

    const toastId = toast.loading('Deleting user...')
    
    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await response.json()

      if (result.success) {
        await fetchUsers()
        await refetchCounts()
        setShowDeleteModal(false)
        setSelectedUser(null)
        toast.success('User deleted successfully!', { id: toastId })
      } else {
        toast.error(`Error deleting user: ${result.error || 'Unknown error'}`, { id: toastId })
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Error deleting user', { id: toastId })
    }
  }

  const exportUsersToCSV = () => {
    if (users.length === 0) {
      toast.error('No users to export')
      return
    }

    const csvHeaders = ['ID', 'Name', 'Email', 'Email Verified', 'Created At', 'Updated At']
    const csvData = users.map(user => [
      user.id,
      user.name || '',
      user.email || '',
      user.emailVerified ? true : false,
      new Date(user.createdAt).toLocaleString(),
      new Date(user.updatedAt).toLocaleString()
    ])

    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `users-export-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success(`Exported ${users.length} users to CSV`)
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'all'
    return matchesSearch && matchesFilter
  })

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
  const startIndex = (currentPage - 1) * usersPerPage
  const endIndex = startIndex + usersPerPage
  const currentUsers = filteredUsers.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="flex flex-col items-center space-y-3">
          <Loader className="w-6 h-6 text-white animate-spin" />
          <div className="text-white text-sm">Loading users...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-white font-light">Users ({users.length})</h1>
          <p className="text-gray-400 mt-1">Manage your application users</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            className="border border-dashed border-white/20 text-white hover:bg-white/10 bg-transparent rounded-none"
            onClick={exportUsersToCSV}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            className="border border-dashed border-white/20 text-white hover:bg-white/10 bg-transparent rounded-none"
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
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
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
                <th className="text-left py-4 px-4 text-white font-light">Email Verified</th>
                <th className="text-left py-4 px-4 text-white font-light">Created</th>
                <th className="text-right py-4 px-4 text-white font-light">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 rounded-none border border-dashed border-white/20 bg-white/10 flex items-center justify-center">
                        <UsersIcon className="w-8 h-8 text-white/50" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium text-lg">No users found</h3>
                        <p className="text-gray-400 text-sm mt-1">
                          {searchTerm || filter !== 'all' 
                            ? 'Try adjusting your search or filter criteria'
                            : 'Get started by creating your first user or seeding some data'
                          }
                        </p>
                      </div>
                      {!searchTerm && filter === 'all' && (
                        <div className="flex items-center space-x-3">
                          <Button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-white text-black hover:bg-gray-200 rounded-none"
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Create User
                          </Button>
                          <Button
                            onClick={() => setShowSeedModal(true)}
                            className="border border-dashed border-white/20 text-white hover:bg-white/10 bg-transparent rounded-none"
                          >
                            <Database className="w-4 h-4 mr-2" />
                            Seed Data
                          </Button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                currentUsers.map((user) => (
                                        <tr 
                                            key={user.id} 
                                            className="border-b border-dashed border-white/5 hover:bg-white/5 cursor-pointer"
                                            onClick={() => navigate(`/users/${user.id}`)}
                                        >
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
                          <Check className="w-4 h-4 text-green-400" />
                         ) : (
                          <Mail className="w-4 h-4 text-yellow-400" />
                        )}
                        <span className="text-sm text-gray-400">
                          {user.emailVerified ? 'Verified' : 'Not Verified'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-400">
                     <div className='flex flex-col'>
                      {new Date(user.createdAt).toLocaleDateString()}
                      <p className='text-xs'>{new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div> 
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white rounded-none"
                          onClick={(e) => {
                            e.stopPropagation()
                            openViewModal(user)
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white rounded-none"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditModal(user)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 rounded-none"
                          onClick={(e) => {
                            e.stopPropagation()
                            openDeleteModal(user)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={filteredUsers.length}
          startIndex={startIndex}
          endIndex={endIndex}
        />
      </div>

      {/* Seed Modal */}
      {showSeedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/90 border border-dashed border-white/20 p-6 w-full max-w-2xl rounded-none">
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
                        Seed Users
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {seedingLogs.length > 0 && (
                <div className="mt-6">
                  <Terminal 
                    title="User Seeding Terminal"
                    lines={seedingLogs}
                    isRunning={isSeeding}
                    className="w-full"
                    defaultCollapsed={true}
                  />
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
                onClick={handleUpdateUser}
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
