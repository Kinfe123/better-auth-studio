import {
  Ban,
  Calendar as CalendarIcon,
  Check,
  Database,
  Download,
  Edit,
  Eye,
  Filter,
  Loader,
  Mail,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users as UsersIcon,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Terminal } from '../components/Terminal';
import { Button } from '../components/ui/button';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Pagination } from '../components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger } from '../components/ui/select';
import { useCounts } from '../contexts/CountsContext';

interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  createdAt: string;
  updatedAt: string;
  banned?: boolean;
  banReason?: string;
  banExpires?: string;
  role?: string;
}

export default function Users() {
  const navigate = useNavigate();
  const { refetchCounts } = useCounts();
  interface FilterConfig {
    type: string;
    value?: any;
    dateRange?: DateRange;
  }

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterConfig[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(20);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
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

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users?limit=10000');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (_error) {
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAdminPlugin = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/status');
      const data = await response.json();
      setAdminPluginEnabled(data.enabled);
    } catch (_error) {
      setAdminPluginEnabled(false);
    }
  }, []);
  useEffect(() => {
    fetchUsers();
    checkAdminPlugin();

    const handleClickOutside = () => {
      if (actionMenuOpen) {
        setActionMenuOpen(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [actionMenuOpen, checkAdminPlugin, fetchUsers]);

  const handleSeedUsers = async (count: number) => {
    setSeedingLogs([]);
    setIsSeeding(true);

    setSeedingLogs([
      {
        id: 'start',
        type: 'info',
        message: `Starting user seeding process for ${count} users...`,
        timestamp: new Date(),
      },
    ]);

    try {
      const response = await fetch('/api/seed/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      });

      const result = await response.json();

      if (result.success) {
        const progressLogs = result.results.map((r: any, index: number) => {
          if (r.success) {
            return {
              id: `user-${index}`,
              type: 'progress' as const,
              message: `Creating user: ${r.user.name} (${r.user.email})`,
              timestamp: new Date(),
              status: 'completed' as const,
            };
          } else {
            return {
              id: `user-${index}`,
              type: 'error' as const,
              message: `Failed to create user ${index + 1}: ${r.error}`,
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
            message: `✅ Seeding completed! Created ${successCount}/${count} users successfully`,
            timestamp: new Date(),
          },
        ]);

        await fetchUsers();
        await refetchCounts();
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

  const openViewModal = (user: User) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleCreateUser = async () => {
    const name = (document.getElementById('create-name') as HTMLInputElement)?.value;
    const email = (document.getElementById('create-email') as HTMLInputElement)?.value;
    const password = (document.getElementById('create-password') as HTMLInputElement)?.value;

    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    const toastId = toast.loading('Creating user...');

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchUsers();
        setShowCreateModal(false);
        (document.getElementById('create-name') as HTMLInputElement).value = '';
        (document.getElementById('create-email') as HTMLInputElement).value = '';
        (document.getElementById('create-password') as HTMLInputElement).value = '';
        toast.success('User created successfully!', { id: toastId });
      } else {
        toast.error(`Error creating user: ${result.error || 'Unknown error'}`, { id: toastId });
      }
    } catch (_error) {
      toast.error('Error creating user', { id: toastId });
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) {
      toast.error('No user selected');
      return;
    }

    const name = (document.getElementById('edit-name') as HTMLInputElement)?.value;
    const email = (document.getElementById('edit-email') as HTMLInputElement)?.value;

    if (!name || !email) {
      toast.error('Please fill in all fields');
      return;
    }

    const toastId = toast.loading('Updating user...');

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchUsers();
        setShowEditModal(false);
        setSelectedUser(null);
        toast.success('User updated successfully!', { id: toastId });
      } else {
        toast.error(`Error updating user: ${result.error || 'Unknown error'}`, { id: toastId });
      }
    } catch (_error) {
      toast.error('Error updating user', { id: toastId });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) {
      toast.error('No user selected');
      return;
    }

    const toastId = toast.loading('Deleting user...');

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (result.success) {
        await fetchUsers();
        await refetchCounts();
        setShowDeleteModal(false);
        setSelectedUser(null);
        toast.success('User deleted successfully!', { id: toastId });
      } else {
        toast.error(`Error deleting user: ${result.error || 'Unknown error'}`, { id: toastId });
      }
    } catch (_error) {
      toast.error('Error deleting user', { id: toastId });
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;

    if (!adminPluginEnabled) {
      toast.error('Admin plugin is not enabled');
      return;
    }

    const toastId = toast.loading('Banning user...');
    try {
      const response = await fetch('/api/admin/ban-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
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
        setSelectedUser(null);
        setActionMenuOpen(null);
        fetchUsers();
      } else {
        toast.error(`Error banning user: ${result.error || result.message || 'Unknown error'}`, {
          id: toastId,
        });
      }
    } catch (_error) {
      toast.error('Error banning user', { id: toastId });
    }
  };

  const handleUnbanUser = async () => {
    if (!selectedUser) return;

    if (!adminPluginEnabled) {
      toast.error('Admin plugin is not enabled');
      return;
    }

    const toastId = toast.loading('Unbanning user...');
    try {
      const response = await fetch('/api/admin/unban-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
        }),
      });
      const result = await response.json();

      if (response.ok) {
        toast.success('User unbanned successfully!', { id: toastId });
        setShowUnbanModal(false);
        setSelectedUser(null);
        setActionMenuOpen(null);
        fetchUsers();
      } else {
        toast.error(`Error unbanning user: ${result.error || result.message || 'Unknown error'}`, {
          id: toastId,
        });
      }
    } catch (_error) {
      toast.error('Error unbanning user', { id: toastId });
    }
  };

  const exportUsersToCSV = () => {
    if (users.length === 0) {
      toast.error('No users to export');
      return;
    }

    const csvHeaders = ['ID', 'Name', 'Email', 'Email Verified', 'Created At', 'Updated At'];
    const csvData = users.map((user) => [
      user.id,
      user.name || '',
      user.email || '',
      !!user.emailVerified,
      new Date(user.createdAt).toLocaleString(),
      new Date(user.updatedAt).toLocaleString(),
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map((row) => row.map((field) => `"${field}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${users.length} users to CSV`);
  };

  const addFilter = (filterType: string) => {
    const exists = activeFilters.some((f) => f.type === filterType);
    if (!exists) {
      setActiveFilters((prev) => [...prev, { type: filterType }]);
      setCurrentPage(1);
    }
  };

  const removeFilter = (filterType: string) => {
    setActiveFilters((prev) => prev.filter((f) => f.type !== filterType));
    setCurrentPage(1);
  };

  const updateFilterValue = (filterType: string, value: any) => {
    setActiveFilters((prev) => prev.map((f) => (f.type === filterType ? { ...f, value } : f)));
  };

  const updateFilterDateRange = (filterType: string, dateRange?: DateRange) => {
    setActiveFilters((prev) => prev.map((f) => (f.type === filterType ? { ...f, dateRange } : f)));
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeFilters.length === 0) {
      return matchesSearch;
    }

    const matchesFilters = activeFilters.every((filter) => {
      switch (filter.type) {
        case 'emailVerified':
          if (filter.value === undefined) return true;
          return user.emailVerified === (filter.value === 'true');
        case 'banned':
          if (filter.value === undefined) return true;
          return user.banned === (filter.value === 'true');
        case 'active':
          return user.banned !== true;
        case 'createdAt': {
          if (!filter.dateRange?.from && !filter.dateRange?.to) return true;
          const userDate = new Date(user.createdAt);
          if (filter.dateRange?.from && filter.dateRange.from > userDate) return false;
          if (filter.dateRange?.to && filter.dateRange.to < userDate) return false;
          return true;
        }
        case 'role':
          if (!filter.value) return true;
          return user.role?.toLowerCase().includes(filter.value.toLowerCase());
        default:
          return true;
      }
    });

    return matchesSearch && matchesFilters;
  });

  const bannedCount = users.filter((u) => u.banned).length;

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center h-full">
        <div className="flex flex-col items-center space-y-3">
          <Loader className="w-6 h-6 text-white animate-spin" />
          <div className="text-white text-sm">Loading users...</div>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl relative text-white font-light inline-flex items-start">
            Users
            <sup className="text-xs text-gray-500 ml-1 mt-0">
              <span className='mr-1'>[</span>
              <span className='text-white font-mono text-sm'>{users.length}</span>
              <span className='ml-1'>]</span>
            </sup>
          </h1>
          <p className="text-gray-400 font-light text-sm mt-1 uppercase font-mono">Manage your application users</p>
          <div className="flex items-center space-x-4 mt-2">
            {bannedCount > 0 && (
              <span className="text-sm text-red-400 flex items-center space-x-1">
                <Ban className="w-3 h-3" />
                <span>{bannedCount} Banned</span>
              </span>
            )}
          </div>
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
      <div className="space-y-3">
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
            <Select value="" onValueChange={addFilter}>
              <SelectTrigger className="w-[180px]">
                <div className="flex mr-3 items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Add Filter</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {!activeFilters.some((f) => f.type === 'emailVerified') && (
                  <SelectItem value="emailVerified">Email Verified</SelectItem>
                )}
                {!activeFilters.some((f) => f.type === 'banned') && (
                  <SelectItem value="banned">Banned Status</SelectItem>
                )}
                {!activeFilters.some((f) => f.type === 'createdAt') && (
                  <SelectItem value="createdAt">Created Date</SelectItem>
                )}
                {!activeFilters.some((f) => f.type === 'role') && (
                  <SelectItem value="role">Role</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          {activeFilters.length > 0 && (
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setActiveFilters([])}
                className=""
              >
                Clear all
              </Button>
            </div>
            )}
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
              {activeFilters.map((filter) => (
                <div
                  key={filter.type}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-sm"
                >
                  <Filter className="w-3 h-3 text-white" />

                  {filter.type === 'emailVerified' && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white">Email Verified:</span>
                      <Select
                        value={filter.value || ''}
                        onValueChange={(val) => updateFilterValue('emailVerified', val)}
                      >
                        <SelectTrigger className="h-7 w-24 text-xs">
                          <span>
                            {filter.value === 'true'
                              ? 'True'
                              : filter.value === 'false'
                                ? 'False'
                                : 'Select'}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">True</SelectItem>
                          <SelectItem value="false">False</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {filter.type === 'banned' && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white">Banned:</span>
                      <Select
                        value={filter.value || ''}
                        onValueChange={(val) => updateFilterValue('banned', val)}
                      >
                        <SelectTrigger className="h-7 w-24 text-xs">
                          <span>
                            {filter.value === 'true'
                              ? 'Yes'
                              : filter.value === 'false'
                                ? 'No'
                                : 'Select'}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {filter.type === 'createdAt' && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white">Created:</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="h-8 px-3 text-xs font-mono uppercase text-gray-400 hover:text-white bg-transparent border-white/10 hover:bg-white/5"
                          >
                            <CalendarIcon className="mr-1 h-3 w-3" />
                            {filter.dateRange?.from ? format(filter.dateRange.from, 'MMM dd yyyy') : 'From'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-black border-white/10">
                          <Calendar
                            mode="single"
                            selected={filter.dateRange?.from}
                            onSelect={(date) => updateFilterDateRange('createdAt', { from: date, to: filter.dateRange?.to })}
                            initialFocus
                            className="rounded-none"
                          />
                        </PopoverContent>
                      </Popover>
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="h-8 px-3 text-xs font-mono uppercase text-gray-400 hover:text-white bg-transparent border-white/10 hover:bg-white/5"
                          >
                            <CalendarIcon className="mr-1 h-3 w-3" />
                            {filter.dateRange?.to ? format(filter.dateRange.to, 'MMM dd yyyy') : 'To'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-black border-white/10">
                          <Calendar
                            mode="single"
                            selected={filter.dateRange?.to}
                            onSelect={(date) => updateFilterDateRange('createdAt', { from: filter.dateRange?.from, to: date })}
                            initialFocus
                            disabled={(date) => filter.dateRange?.from ? date < filter.dateRange.from : false}
                            className="rounded-none"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}

                  {filter.type === 'role' && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white">Role:</span>
                      <Input
                        type="text"
                        value={filter.value || ''}
                        onChange={(e) => updateFilterValue('role', e.target.value)}
                        className="h-7 w-32 text-xs bg-black border-white/20 text-white"
                        placeholder="Enter role..."
                      />
                    </div>
                  )}

                  <button
                    onClick={() => removeFilter(filter.type)}
                    className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-black/30 border border-dashed border-white/20 rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dashed border-white/10">
                <th className="text-left py-4 px-4 text-white font-light">User</th>
                <th className="text-left py-4 px-4 text-white font-light">Email Status</th>
                <th className="text-left py-4 px-4 text-white font-light">Created</th>
                <th className="text-right py-4 px-4 text-white font-light">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 rounded-none border border-dashed border-white/20 bg-white/10 flex items-center justify-center">
                        <UsersIcon className="w-8 h-8 text-white/50" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium text-lg">No users found</h3>
                        <p className="text-gray-400 text-sm mt-1">
                          {searchTerm || activeFilters.length > 0
                            ? 'Try adjusting your search or filter criteria'
                            : 'Get started by creating your first user or seeding some data'}
                        </p>
                      </div>
                      {!searchTerm && activeFilters.length === 0 && (
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
                    className={`border-b border-dashed hover:bg-white/5 cursor-pointer ${
                      user.banned ? 'border-red-500/30 bg-red-500/5' : 'border-white/5'
                    }`}
                    onClick={() => navigate(`/users/${user.id}`)}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <img
                            src={
                              user.image ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
                            }
                            alt={user.name}
                            className={`w-10 h-10 rounded-none border border-dashed ${
                              user.banned ? 'border-red-400/50 opacity-60' : 'border-white/20'
                            }`}
                          />
                          {user.banned && (
                            <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5">
                              <Ban className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="text-white font-light">{user.name}</div>
                            {user.banned && (
                              <span className="px-2 py-0.5 text-[10px] font-semibold bg-red-500/20 border border-red-500/50 text-red-400 rounded-sm uppercase tracking-wide">
                                Banned
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-400 mt-0.5">{user.email}</div>
                        </div>
                      </div>
                    </td>
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
                      <div className="flex flex-col">
                        {new Date(user.createdAt).toLocaleDateString()}
                        <p className="text-xs">
                          {new Date(user.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="relative flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white rounded-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionMenuOpen(actionMenuOpen === user.id ? null : user.id);
                          }}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>

                        {actionMenuOpen === user.id && (
                          <div
                            className="absolute right-0 top-full mt-1 w-48 bg-black border border-white/20 rounded-none shadow-lg z-50"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center space-x-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionMenuOpen(null);
                                openViewModal(user);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                              <span>View Details</span>
                            </button>
                            <button
                              className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center space-x-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionMenuOpen(null);
                                openEditModal(user);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                              <span>Edit User</span>
                            </button>
                            {adminPluginEnabled &&
                              (user.banned ? (
                                <button
                                  className="w-full px-4 py-2 text-left text-sm text-green-400 hover:bg-white/10 flex items-center space-x-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedUser(user);
                                    setShowUnbanModal(true);
                                    setActionMenuOpen(null);
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
                                    setSelectedUser(user);
                                    setShowBanModal(true);
                                    setActionMenuOpen(null);
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
                                setActionMenuOpen(null);
                                openDeleteModal(user);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete User</span>
                            </button>
                          </div>
                        )}
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
                    <Label htmlFor="user-count" className="text-sm text-gray-400 font-light">
                      Number of users
                    </Label>
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
                      const count = parseInt(
                        (document.getElementById('user-count') as HTMLInputElement)?.value || '5',
                        10
                      );
                      handleSeedUsers(count);
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
                <Label htmlFor="create-name" className="text-sm text-gray-400 font-light">
                  Name
                </Label>
                <Input
                  id="create-name"
                  className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                />
              </div>
              <div>
                <Label htmlFor="create-email" className="text-sm text-gray-400 font-light">
                  Email
                </Label>
                <Input
                  id="create-email"
                  type="email"
                  className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                />
              </div>
              <div>
                <Label htmlFor="create-password" className="text-sm text-gray-400 font-light">
                  Password
                </Label>
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
                  src={
                    selectedUser.image ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.id}`
                  }
                  alt={selectedUser.name}
                  className="w-16 h-16 rounded-none border border-dashed border-white/20"
                />
                <div>
                  <div className="text-white font-light">{selectedUser.name}</div>
                  <div className="text-sm text-gray-400">{selectedUser.email}</div>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-name" className="text-sm text-gray-400 font-light">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  defaultValue={selectedUser.name}
                  className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                />
              </div>
              <div>
                <Label htmlFor="edit-email" className="text-sm text-gray-400 font-light">
                  Email
                </Label>
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
                  src={
                    selectedUser.image ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.id}`
                  }
                  alt={selectedUser.name}
                  className="w-16 h-16 rounded-none border border-dashed border-white/20"
                />
                <div>
                  <div className="text-white font-light">{selectedUser.name}</div>
                  <div className="text-sm text-gray-400">{selectedUser.email}</div>
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
                  src={
                    selectedUser.image ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.id}`
                  }
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
                  <span className="text-white text-sm">
                    {selectedUser.emailVerified ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Created:</span>
                  <span className="text-white text-sm">
                    {new Date(selectedUser.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Updated:</span>
                  <span className="text-white text-sm">
                    {new Date(selectedUser.updatedAt).toLocaleString()}
                  </span>
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

      {/* Ban User Modal */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black border border-red-400/20 rounded-none p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Ban User</h2>
            <p className="text-gray-400 mb-4">
              Ban <strong>{selectedUser.name}</strong> from accessing the system.
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
                  setSelectedUser(null);
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

      {/* Unban User Modal */}
      {showUnbanModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black border border-dashed border-green-400/50 rounded-none p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Unban User</h2>
            <p className="text-gray-400 mb-6">
              Are you sure you want to unban <strong>{selectedUser.name}</strong>? This will restore
              their access to the system.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUnbanModal(false);
                  setSelectedUser(null);
                }}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUnbanUser}
                className="bg-green-600 text-white hover:bg-green-700 rounded-none"
              >
                Unban User
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
