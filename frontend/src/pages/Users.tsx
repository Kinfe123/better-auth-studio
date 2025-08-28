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
  Calendar,
  Globe,
  ArrowUpDown,
  Eye,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface User {
  id: string
  name: string
  email: string
  provider: string
  status: 'active' | 'inactive' | 'pending'
  lastLogin: string
  createdAt: string
  image?: string
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [filter, setFilter] = useState('all')
  const usersPerPage = 10

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

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'all' || user.status === filter
    return matchesSearch && matchesFilter
  })

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  )

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="flex items-center gap-1 bg-white/10 text-white border border-dashed border-white/20 rounded-none"><CheckCircle className="w-3 h-3" />Active</Badge>
      case 'inactive':
        return <Badge className="flex items-center gap-1 bg-white/10 text-white border border-dashed border-white/20 rounded-none"><XCircle className="w-3 h-3" />Inactive</Badge>
      case 'pending':
        return <Badge className="flex items-center gap-1 bg-white/10 text-white border border-dashed border-white/20 rounded-none"><Clock className="w-3 h-3" />Pending</Badge>
      default:
        return <Badge className="bg-white/10 text-white border border-dashed border-white/20 rounded-none">{status}</Badge>
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'google':
        return <Globe className="w-4 h-4 text-white" />
      case 'github':
        return <Shield className="w-4 h-4 text-white" />
      case 'email':
        return <Mail className="w-4 h-4 text-white" />
      default:
        return <UsersIcon className="w-4 h-4 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-white font-normal">User Management</h1>
          <p className="text-gray-400 mt-1 font-light">Manage and monitor user accounts</p>
        </div>
        <Button className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none">
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border border-dashed border-white/20 bg-black/30 rounded-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 font-light">Total Users</p>
                <p className="text-2xl text-white font-light">{users.length}</p>
              </div>
              <div className="p-3 bg-white/10 rounded-none">
                <UsersIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-dashed border-white/20 bg-black/30 rounded-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 font-light">Active Users</p>
                <p className="text-2xl text-white font-light">
                  {users.filter(u => u.status === 'active').length}
                </p>
              </div>
              <div className="p-3 bg-white/10 rounded-none">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-dashed border-white/20 bg-black/30 rounded-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 font-light">New This Month</p>
                <p className="text-2xl text-white font-light">
                  {users.filter(u => {
                    const created = new Date(u.createdAt)
                    const now = new Date()
                    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
                  }).length}
                </p>
              </div>
              <div className="p-3 bg-white/10 rounded-none">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-dashed border-white/20 bg-black/30 rounded-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 font-light">Pending</p>
                <p className="text-2xl text-white font-light">
                  {users.filter(u => u.status === 'pending').length}
                </p>
              </div>
              <div className="p-3 bg-white/10 rounded-none">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border border-dashed border-white/20 bg-black/30 rounded-none">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-dashed border-white/20 bg-black/30 text-white rounded-none focus:ring-1 focus:ring-white focus:border-white/40 transition-colors placeholder-gray-400"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-dashed border-white/20 bg-black/30 text-white rounded-none focus:ring-1 focus:ring-white focus:border-white/40 transition-colors"
                >
                  <option value="all">All Users</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                Sort
              </Button>
              <Button variant="outline" size="sm" className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none">
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border border-dashed border-white/20 bg-black/30 rounded-none">
        <CardHeader>
          <CardTitle className="text-white font-normal">Users ({filteredUsers.length})</CardTitle>
          <CardDescription className="text-gray-400 font-light">Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dashed border-white/10">
                  <th className="text-left py-3 px-4 text-sm text-gray-400 font-light">User</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-400 font-light">Provider</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-400 font-light">Status</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-400 font-light">Last Login</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-400 font-light">Created</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-400 font-light">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-white/10">
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} 
                          alt={user.name}
                          className="w-10 h-10 rounded-none border border-dashed border-white/20"
                        />
                        <div>
                          <p className="text-sm text-white font-light">{user.name}</p>
                          <p className="text-xs text-gray-400 font-light">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        {getProviderIcon(user.provider)}
                        <span className="text-sm text-gray-300 font-light capitalize">{user.provider}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300 font-light">
                          {new Date(user.lastLogin).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300 font-light">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white rounded-none">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white rounded-none">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 rounded-none">
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
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-dashed border-white/10">
              <p className="text-sm text-gray-400 font-light">
                Showing {((currentPage - 1) * usersPerPage) + 1} to {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none disabled:opacity-50"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-400 font-light">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
