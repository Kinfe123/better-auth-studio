import { Database, Edit, Eye, Filter, Loader, Plus, Search, Trash2, User, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
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

interface Session {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
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

  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch('/api/sessions');
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (_error) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleSeedSessions = async (count: number) => {
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
      const response = await fetch('/api/seed/sessions', {
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
              message: `Creating session: ${r.session.id}`,
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
            message: `✅ Seeding completed! Created ${successCount}/${count} sessions successfully`,
            timestamp: new Date(),
          },
        ]);

        await fetchSessions();
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

  const handleSeedAccounts = async (count: number) => {
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
      const response = await fetch('/api/seed/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      });

      const result = await response.json();

      if (result.success) {
        const progressLogs = result.results.map((r: any, index: number) => {
          if (r.success) {
            return {
              id: `account-${index}`,
              type: 'progress' as const,
              message: `Creating account: ${r.account.provider}`,
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
            message: `✅ Seeding completed! Created ${successCount}/${count} accounts successfully`,
            timestamp: new Date(),
          },
        ]);

        await fetchSessions();
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

  const openViewModal = (session: Session) => {
    setSelectedSession(session);
    setShowViewModal(true);
  };

  const openEditModal = (session: Session) => {
    setSelectedSession(session);
    setShowEditModal(true);
  };

  const openDeleteModal = (session: Session) => {
    setSelectedSession(session);
    setShowDeleteModal(true);
  };

  const handleCreateSession = async (_sessionData: any) => {
    setShowCreateModal(false);
  };

  const handleUpdateSession = async (_sessionData: any) => {
    setShowEditModal(false);
  };

  const handleDeleteSession = async () => {
    setShowDeleteModal(false);
  };

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.userId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && new Date(session.expiresAt) > new Date()) ||
      (filter === 'expired' && new Date(session.expiresAt) <= new Date());
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="flex flex-col items-center space-y-3">
          <Loader className="w-6 h-6 text-white animate-spin" />
          <div className="text-white text-sm">Loading sessions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl relative text-white font-light inline-flex items-start">
            Sessions
            <sup className="text-xs text-gray-500 ml-1 mt-0">
              <span className='mr-1'>[</span>
              <span className='text-white font-mono text-sm'>{sessions.length}</span>
              <span className='ml-1'>]</span>
            </sup>
          </h1>
          <p className="text-gray-400 mt-1 uppercase font-mono text-sm font-light">Manage user sessions and accounts</p>
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
            <Plus className="w-4 h-4 mr-2" />
            Add Session
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search sessions..."
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
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-black/30 border border-dashed border-white/20 rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dashed border-white/10">
                <th className="text-left py-4 px-4 text-white font-light">Session</th>
                <th className="text-left py-4 px-4 text-white font-light">User ID</th>
                <th className="text-left py-4 px-4 text-white font-light">Status</th>
                <th className="text-left py-4 px-4 text-white font-light">Expires</th>
                <th className="text-right py-4 px-4 text-white font-light">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => (
                <tr
                  key={session.id}
                  className="border-b border-dashed border-white/5 hover:bg-white/5"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-none border border-dashed border-white/20 bg-white/10 flex items-center justify-center">
                        <Database className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-white font-light">
                          Session {session.id.slice(0, 8)}...
                        </div>
                        <div className="text-sm text-gray-400">ID: {session.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-white">{session.userId}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      {new Date(session.expiresAt) > new Date() ? (
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      ) : (
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      )}
                      <span className="text-sm text-gray-400">
                        {new Date(session.expiresAt) > new Date() ? 'Active' : 'Expired'}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-400">
                    {new Date(session.expiresAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white rounded-none"
                        onClick={() => openViewModal(session)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white rounded-none"
                        onClick={() => openEditModal(session)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 rounded-none"
                        onClick={() => openDeleteModal(session)}
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
              {/* Session Seeding */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-white" />
                  <h4 className="text-white font-light">Seed Sessions</h4>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <Label htmlFor="session-count" className="text-sm text-gray-400 font-light">
                      Number of sessions
                    </Label>
                    <Input
                      id="session-count"
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
                        (document.getElementById('session-count') as HTMLInputElement)?.value ||
                          '5',
                        10
                      );
                      handleSeedSessions(count);
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
                        Seed Sessions
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Account Seeding */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-white" />
                  <h4 className="text-white font-light">Seed Accounts</h4>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <Label htmlFor="account-count" className="text-sm text-gray-400 font-light">
                      Number of accounts
                    </Label>
                    <Input
                      id="account-count"
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
                        (document.getElementById('account-count') as HTMLInputElement)?.value ||
                          '5',
                        10
                      );
                      handleSeedAccounts(count);
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
                        <User className="w-3 h-3 mr-2" />
                        Seed Accounts
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Seeding Logs */}
              {seedingLogs.length > 0 && (
                <div className="mt-6">
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

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/90 border border-dashed border-white/20 p-6 w-full max-w-md rounded-none">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light">Create Session</h3>
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
                <Label htmlFor="create-user-id" className="text-sm text-gray-400 font-light">
                  User ID
                </Label>
                <Input
                  id="create-user-id"
                  className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                />
              </div>
              <div>
                <Label htmlFor="create-expires" className="text-sm text-gray-400 font-light">
                  Expires At
                </Label>
                <Input
                  id="create-expires"
                  type="datetime-local"
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
                onClick={() => handleCreateSession({})}
                className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none"
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Session Modal */}
      {showEditModal && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/90 border border-dashed border-white/20 p-6 w-full max-w-md rounded-none">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light">Edit Session</h3>
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
                  <Database className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="text-white font-light">
                    Session {selectedSession.id.slice(0, 8)}...
                  </div>
                  <div className="text-sm text-gray-400">{selectedSession.userId}</div>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-user-id" className="text-sm text-gray-400 font-light">
                  User ID
                </Label>
                <Input
                  id="edit-user-id"
                  defaultValue={selectedSession.userId}
                  className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                />
              </div>
              <div>
                <Label htmlFor="edit-expires" className="text-sm text-gray-400 font-light">
                  Expires At
                </Label>
                <Input
                  id="edit-expires"
                  type="datetime-local"
                  defaultValue={new Date(selectedSession.expiresAt).toISOString().slice(0, 16)}
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
                onClick={() => handleUpdateSession({})}
                className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none"
              >
                Update
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Session Modal */}
      {showDeleteModal && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/90 border border-dashed border-white/20 p-6 w-full max-w-md rounded-none">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light">Delete Session</h3>
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
                  <Database className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="text-white font-light">
                    Session {selectedSession.id.slice(0, 8)}...
                  </div>
                  <div className="text-sm text-gray-400">{selectedSession.userId}</div>
                </div>
              </div>
              <p className="text-gray-400">
                Are you sure you want to delete this session? This action cannot be undone.
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
                onClick={handleDeleteSession}
                className="bg-red-600 hover:bg-red-700 text-white border border-red-600 rounded-none"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Session Modal */}
      {showViewModal && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/90 border border-dashed border-white/20 p-6 w-full max-w-md rounded-none">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light">Session Details</h3>
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
                  <Database className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="text-white font-light">
                    Session {selectedSession.id.slice(0, 8)}...
                  </div>
                  <div className="text-sm text-gray-400">{selectedSession.userId}</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">ID:</span>
                  <span className="text-white text-sm">{selectedSession.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">User ID:</span>
                  <span className="text-white text-sm">{selectedSession.userId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-white text-sm">
                    {new Date(selectedSession.expiresAt) > new Date() ? 'Active' : 'Expired'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Expires:</span>
                  <span className="text-white text-sm">
                    {new Date(selectedSession.expiresAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Created:</span>
                  <span className="text-white text-sm">
                    {new Date(selectedSession.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Updated:</span>
                  <span className="text-white text-sm">
                    {new Date(selectedSession.updatedAt).toLocaleString()}
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
