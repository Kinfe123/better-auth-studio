import {
  Building2,
  Calendar as CalendarIcon,
  Database,
  Download,
  Edit,
  Eye,
  Filter,
  Loader,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '../components/ui/select';
import { useCounts } from '../contexts/CountsContext';

interface Organization {
  id: string;
  name: string;
  slug: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

interface PluginStatus {
  enabled: boolean;
  error?: string;
  configPath?: string | null;
  availablePlugins?: string[];
  organizationPlugin?: any;
}

export default function Organizations() {
  const navigate = useNavigate();
  const { counts, refetchCounts } = useCounts();
  
  interface FilterConfig {
    type: string;
    value?: any;
    dateRange?: DateRange;
  }
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [pluginStatus, setPluginStatus] = useState<PluginStatus | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, _setFilter] = useState('all');
  const [activeFilters, setActiveFilters] = useState<FilterConfig[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [organizationsPerPage] = useState(20);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [_, _setShowCreateTeamModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
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
  const [createFormData, setCreateFormData] = useState({ name: '', slug: '' });
  const [editFormData, setEditFormData] = useState({ name: '', slug: '' });

  useEffect(() => {
    checkPluginStatus();
  }, []);

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^a-z0-9-]/g, '') // Remove special characters except hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  const handleCreateNameChange = (name: string) => {
    const slug = generateSlug(name);
    setCreateFormData({ name, slug });
  };

  const handleCreateSlugChange = (slug: string) => {
    setCreateFormData((prev) => ({ ...prev, slug: generateSlug(slug) }));
  };

  const handleEditNameChange = (name: string) => {
    const slug = generateSlug(name);
    setEditFormData({ name, slug });
  };

  const handleEditSlugChange = (slug: string) => {
    setEditFormData((prev) => ({ ...prev, slug: generateSlug(slug) }));
  };

  const checkPluginStatus = async () => {
    try {
      const response = await fetch('/api/plugins');
      const pluginLists: any = await response.json();
      const orgEnabled = (pluginLists?.plugins as any).find(
        (plugin: any) => plugin.id === 'organization'
      );
      setPluginStatus({
        enabled: !!orgEnabled,
        availablePlugins: (pluginLists?.plugins as any).map((plugin: any) => plugin.id),
        configPath: (pluginLists as any).configPath,
        organizationPlugin: (pluginLists?.plugins as any).find(
          (plugin: any) => plugin.id === 'organization'
        ),
      });
      if (orgEnabled) {
        await fetchOrganizations();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to check plugin status:', error);
      setPluginStatus({ enabled: false, error: 'Failed to check plugin status' });
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations?limit=10000');
      const data = await response.json();
      console.log({ lenght: data.organizations.length });
      setOrganizations(data.organizations || []);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      toast.error('Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedOrganizations = async (count: number) => {
    setSeedingLogs([]);
    setIsSeeding(true);

    setSeedingLogs([
      {
        id: 'start',
        type: 'info',
        message: `Starting organization seeding process for ${count} organizations...`,
        timestamp: new Date(),
      },
    ]);

    try {
      const response = await fetch('/api/seed/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      });

      const result = await response.json();

      if (result.success) {
        const progressLogs = result.results.map((r: any, index: number) => {
          if (r.success) {
            return {
              id: `org-${index}`,
              type: 'progress' as const,
              message: `Creating organization: ${r.organization.name} (${r.organization.slug})`,
              timestamp: new Date(),
              status: 'completed' as const,
            };
          } else {
            return {
              id: `org-${index}`,
              type: 'error' as const,
              message: `Failed to create organization ${index + 1}: ${r.error}`,
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
            message: `✅ Seeding completed! Created ${successCount}/${count} organizations successfully`,
            timestamp: new Date(),
          },
        ]);

        await fetchOrganizations();
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
  const openViewModal = (organization: Organization) => {
    setSelectedOrganization(organization);
    setShowViewModal(true);
  };

  const openEditModal = (organization: Organization) => {
    setSelectedOrganization(organization);
    setEditFormData({ name: organization.name, slug: organization.slug });
    setShowEditModal(true);
  };

  const openDeleteModal = (organization: Organization) => {
    setSelectedOrganization(organization);
    setShowDeleteModal(true);
  };

  const handleCreateOrganization = async () => {
    if (!createFormData.name) {
      toast.error('Please fill in the organization name');
      return;
    }

    const toastId = toast.loading('Creating organization...');

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createFormData.name,
          slug: createFormData.slug,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchOrganizations();
        setShowCreateModal(false);
        setCreateFormData({ name: '', slug: '' });
        toast.success('Organization created successfully!', { id: toastId });
      } else {
        toast.error(`Error creating organization: ${result.error || 'Unknown error'}`, {
          id: toastId,
        });
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error('Error creating organization', { id: toastId });
    }
  };
  const handleUpdateOrganization = async () => {
    if (!selectedOrganization) {
      toast.error('No organization selected');
      return;
    }

    if (!editFormData.name) {
      toast.error('Please fill in the organization name');
      return;
    }

    const toastId = toast.loading('Updating organization...');

    try {
      const response = await fetch(`/api/organizations/${selectedOrganization.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFormData.name,
          slug: editFormData.slug,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchOrganizations();
        setShowEditModal(false);
        setSelectedOrganization(null);
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
    }
  };

  const handleDeleteOrganization = async () => {
    if (!selectedOrganization) {
      toast.error('No organization selected');
      return;
    }

    const toastId = toast.loading('Deleting organization...');

    try {
      const response = await fetch(`/api/organizations/${selectedOrganization.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (result.success) {
        await fetchOrganizations();
        await refetchCounts();
        setShowDeleteModal(false);
        setSelectedOrganization(null);
        toast.success('Organization deleted successfully!', { id: toastId });
      } else {
        toast.error(`Error deleting organization: ${result.error || 'Unknown error'}`, {
          id: toastId,
        });
      }
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast.error('Error deleting organization', { id: toastId });
    }
  };

  const exportOrganizationsToCSV = () => {
    if (organizations.length === 0) {
      toast.error('No organizations to export');
      return;
    }

    const csvHeaders = ['ID', 'Name', 'Slug', 'Created At', 'Updated At'];
    const csvData = organizations.map((organization) => [
      organization.id,
      organization.name || '',
      organization.slug || '',
      new Date(organization.createdAt).toLocaleString(),
      new Date(organization.updatedAt).toLocaleString(),
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map((row) => row.map((field) => `"${field}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `organizations-export-${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${organizations.length} organizations to CSV`);
  };

  const addFilter = (filterType: string) => {
    if (activeFilters.some((f) => f.type === filterType)) return;
    setActiveFilters([...activeFilters, { type: filterType }]);
  };

  const removeFilter = (filterType: string) => {
    setActiveFilters(activeFilters.filter((f) => f.type !== filterType));
  };

  const clearFilters = () => {
    setActiveFilters([]);
  };

  const updateFilterDateRange = (filterType: string, dateRange: DateRange | undefined) => {
    setActiveFilters((prev) =>
      prev.map((f) => (f.type === filterType ? { ...f, dateRange } : f))
    );
  };

  const filteredOrganizations = organizations.filter((organization) => {
    const matchesSearch =
      organization.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      organization.slug.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeFilters.length === 0) {
      return matchesSearch;
    }

    const matchesFilters = activeFilters.every((filter) => {
      switch (filter.type) {
        case 'createdAt': {
          if (!filter.dateRange?.from && !filter.dateRange?.to) return true;
          const orgDate = new Date(organization.createdAt);
          if (filter.dateRange?.from && filter.dateRange.from > orgDate) return false;
          if (filter.dateRange?.to && filter.dateRange.to < orgDate) return false;
          return true;
        }
        default:
          return true;
      }
    });

    return matchesSearch && matchesFilters;
  });

  const totalPages = Math.ceil(filteredOrganizations.length / organizationsPerPage);
  const startIndex = (currentPage - 1) * organizationsPerPage;
  const endIndex = startIndex + organizationsPerPage;
  const currentOrganizations = filteredOrganizations.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center h-full">
        <div className="flex flex-col items-center space-y-3">
          <Loader className="w-6 h-6 text-white animate-spin" />
          <div className="text-white text-sm">Loading organizations...</div>
        </div>
      </div>
    );
  }

  if (pluginStatus && !pluginStatus.enabled) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-white font-light">Organizations</h1>
            <p className="text-gray-400 mt-1">Manage your application organizations</p>
          </div>
        </div>

        <div className="bg-black/30 border border-dashed border-white/20 rounded-none p-8">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <Building2 className="w-12 h-12 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl text-white font-light mb-2">Organization Plugin Required</h3>
              <p className="text-gray-300 mb-6">
                To use Organizations in Better Auth Studio, you need to enable the organization
                plugin in your Better Auth configuration.
              </p>

              <div className="bg-black/50 border border-dashed border-white/20 rounded-none p-4 mb-6">
                <h4 className="text-white font-light mb-3">Follow these steps:</h4>
                <ol className="text-gray-300 space-y-2 text-sm list-decimal list-inside">
                  <li>
                    Import the plugin in your auth configuration file
                    {pluginStatus.configPath && (
                      <span className="text-gray-400"> ({pluginStatus.configPath})</span>
                    )}
                    :
                  </li>
                </ol>

                <div className="mt-4 bg-black/70 border border-dashed border-white/10 rounded-none p-3 overflow-x-auto">
                  <pre className="text-sm text-gray-300">
                    <span className="text-blue-400">import</span> {`{ betterAuth }`}{' '}
                    <span className="text-blue-400">from</span>{' '}
                    <span className="text-green-400">"better-auth"</span> <br />
                    <span className="text-blue-400">import</span> {`{ organization }`}{' '}
                    <span className="text-blue-400">from</span>{' '}
                    <span className="text-green-400">"better-auth/plugins/organization"</span>{' '}
                    <br />
                    <span className="text-blue-400">export const</span>{' '}
                    <span className="text-yellow-300">auth</span> ={' '}
                    <span className="text-yellow-300">betterAuth</span>({`{`} <br />
                    <span className="text-gray-500 pl-10">// ... your existing configuration</span>{' '}
                    <br />
                    <span className="text-red-300 pl-10">plugins</span>: [ <br />
                    <span className="text-yellow-300 pl-12">organization({})</span>
                    <br />
                    <span className="pl-10">]</span> <br />
                    {`}`}) <br />
                  </pre>
                </div>

                <div className="mt-4">
                  <p className="text-gray-400 text-sm">
                    2. Do migrations to create the organizations table
                  </p>
                </div>
                <div className="mt-2">
                  <p className="text-gray-400 text-sm">
                    3. Restart your application to apply the changes
                  </p>
                </div>
              </div>

              {pluginStatus.availablePlugins && pluginStatus.availablePlugins.length > 0 && (
                <div className="mb-4">
                  <p className="text-gray-400 text-sm">
                    Currently enabled plugins: {pluginStatus.availablePlugins.join(', ')}
                  </p>
                </div>
              )}

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
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl relative text-white font-light inline-flex items-start">
            Organizations
            <sup className="text-xs text-gray-500 ml-1 mt-0">
              <span className='mr-1'>[</span>
              <span className='text-white font-mono text-sm'>{counts.organizations}</span>
              <span className='ml-1'>]</span>
            </sup>
          </h1>
          <p className="text-gray-400 font-light text-sm mt-1 uppercase font-mono">Manage your organizations and teams</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            className="border border-dashed border-white/20 text-white hover:bg-white/10 bg-transparent rounded-none"
            onClick={exportOrganizationsToCSV}
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
            <Plus className="w-4 h-4 mr-2" />
            Add Organization
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Select value="add-filter" onValueChange={addFilter}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span>Add Filter</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {!activeFilters.some((f) => f.type === 'createdAt') && (
                  <SelectItem value="createdAt">Created Date</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          {activeFilters.length > 0 && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-xs text-gray-400 hover:text-white"
              >
                Clear All
              </Button>
            </div>
          )}
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            {activeFilters.map((filter, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-none px-3 py-2"
              >
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

                <button
                  onClick={() => removeFilter(filter.type)}
                  className="text-gray-400 hover:text-white ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Organizations Table */}
      <div className="bg-black/30 border border-dashed border-white/20 rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dashed border-white/10">
                <th className="text-left py-4 px-4 text-white font-light">Organization</th>
                <th className="text-left py-4 px-4 text-white font-light">Slug</th>
                <th className="text-left py-4 px-4 text-white font-light">Created</th>
                <th className="text-right py-4 px-4 text-white font-light">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrganizations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 rounded-none border border-dashed border-white/20 bg-white/10 flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-white/50" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium text-lg">No organizations found</h3>
                        <p className="text-gray-400 text-sm mt-1">
                          {searchTerm || filter !== 'all'
                            ? 'Try adjusting your search or filter criteria'
                            : 'Get started by creating your first organization'}
                        </p>
                      </div>
                      {!searchTerm && filter === 'all' && (
                        <div className="flex items-center space-x-3">
                          <Button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-white text-black hover:bg-gray-200 rounded-none"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Organization
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
                currentOrganizations.map((organization) => (
                  <tr
                    key={organization.id}
                    className="border-b border-dashed border-white/5 hover:bg-white/5 cursor-pointer"
                    onClick={() => navigate(`/organizations/${organization.id}`)}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-none border border-dashed border-white/20 bg-white/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-white font-light">{organization.name}</div>
                          <div className="text-sm text-gray-400">ID: {organization.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-white">{organization.slug}</td>
                    <td className="py-4 px-4 text-sm text-gray-400">
                      <div className="flex flex-col">
                        {new Date(organization.createdAt).toLocaleDateString()}
                        <p className="text-xs">
                          {new Date(organization.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white rounded-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            openViewModal(organization);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white rounded-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(organization);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 rounded-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(organization);
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
          totalItems={filteredOrganizations.length}
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
              {/* Organization Seeding */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-white" />
                  <h4 className="text-white font-light">Seed Organizations</h4>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <Label
                      htmlFor="organization-count"
                      className="text-sm text-gray-400 font-light"
                    >
                      Number of organizations
                    </Label>
                    <Input
                      id="organization-count"
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
                        (document.getElementById('organization-count') as HTMLInputElement)
                          ?.value || '5'
                      );
                      handleSeedOrganizations(count);
                    }}
                    disabled={isSeeding}
                    className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none mt-6 disabled:opacity-50"
                  >
                    {isSeeding ? (
                      <>
                        <Loader className="w-3 h-3 mr-2 animate-spin" />
                        Seeding...
                      </>
                    ) : (
                      <>
                        <Database className="w-3 h-3 mr-2" />
                        Seed Organizations
                      </>
                    )}
                  </Button>
                </div>
              </div>
              {/* Seeding Logs */}
              {seedingLogs.length > 0 && (
                <div className="mt-6">
                  <Terminal
                    title="Organization Seeding Terminal"
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

      {/* Create Organization Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/90 border border-dashed border-white/20 p-6 w-full max-w-md rounded-none">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light">Create Organization</h3>
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
                  value={createFormData.name}
                  onChange={(e) => handleCreateNameChange(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                />
              </div>
              <div>
                <Label htmlFor="create-slug" className="text-sm text-gray-400 font-light">
                  Slug
                </Label>
                <Input
                  id="create-slug"
                  value={createFormData.slug}
                  onChange={(e) => handleCreateSlugChange(e.target.value)}
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
                  setShowCreateModal(false);
                  setCreateFormData({ name: '', slug: '' });
                }}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateOrganization}
                className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none"
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Organization Modal */}
      {showEditModal && selectedOrganization && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/90 border border-dashed border-white/20 p-6 w-full max-w-md rounded-none">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light">Edit Organization</h3>
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
                <div className="w-16 h-16 rounded-none border border-dashed border-white/20 bg-white/10 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="text-white font-light">{selectedOrganization.name}</div>
                  <div className="text-sm text-gray-400">{selectedOrganization.slug}</div>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-name" className="text-sm text-gray-400 font-light">
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
                <Label htmlFor="edit-slug" className="text-sm text-gray-400 font-light">
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
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateOrganization}
                className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none"
              >
                Update
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Organization Modal */}
      {showDeleteModal && selectedOrganization && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/90 border border-dashed border-white/20 p-6 w-full max-w-md rounded-none">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light">Delete Organization</h3>
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
                <div className="w-16 h-16 rounded-none border border-dashed border-white/20 bg-white/10 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="text-white font-light">{selectedOrganization.name}</div>
                  <div className="text-sm text-gray-400">{selectedOrganization.slug}</div>
                </div>
              </div>
              <p className="text-gray-400">
                Are you sure you want to delete this organization? This action cannot be undone.
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
                onClick={handleDeleteOrganization}
                className="bg-red-600 hover:bg-red-700 text-white border border-red-600 rounded-none"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Organization Modal */}
      {showViewModal && selectedOrganization && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/90 border border-dashed border-white/20 p-6 w-full max-w-md rounded-none">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light">Organization Details</h3>
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
                <div className="w-16 h-16 rounded-none border border-dashed border-white/20 bg-white/10 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="text-white font-light">{selectedOrganization.name}</div>
                  <div className="text-sm text-gray-400">{selectedOrganization.slug}</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">ID:</span>
                  <span className="text-white text-sm">{selectedOrganization.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Created:</span>
                  <span className="text-white text-sm">
                    {new Date(selectedOrganization.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Updated:</span>
                  <span className="text-white text-sm">
                    {new Date(selectedOrganization.updatedAt).toLocaleString()}
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
    </div>
  );
}
