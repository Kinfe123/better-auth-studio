import { Command } from 'cmdk';
import {
  ArrowRight,
  BarChart3,
  Building2,
  Mail,
  Plus,
  Search,
  Settings,
  UserPlus,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface CommandItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  action: () => void;
  category: string;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const commands: CommandItem[] = [
    {
      id: 'users',
      title: 'Users',
      description: 'Manage users and their accounts',
      icon: Users,
      action: () => navigate('/users'),
      category: 'Navigation',
      keywords: ['user', 'account', 'profile'],
    },
    {
      id: 'organizations',
      title: 'Organizations',
      description: 'Manage organizations and teams',
      icon: Building2,
      action: () => navigate('/organizations'),
      category: 'Navigation',
      keywords: ['org', 'company', 'team'],
    },
    {
      id: 'sessions',
      title: 'Sessions',
      description: 'View active user sessions',
      icon: BarChart3,
      action: () => navigate('/sessions'),
      category: 'Navigation',
      keywords: ['session', 'login', 'active'],
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Configure Better Auth Studio',
      icon: Settings,
      action: () => navigate('/settings'),
      category: 'Navigation',
      keywords: ['config', 'setup', 'preferences'],
    },
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'View overview and statistics',
      icon: BarChart3,
      action: () => navigate('/'),
      category: 'Navigation',
      keywords: ['overview', 'stats', 'home'],
    },
    {
      id: 'create-user',
      title: 'Create User',
      description: 'Add a new user to the system',
      icon: UserPlus,
      action: () => navigate('/users'),
      category: 'Actions',
      keywords: ['add', 'new', 'register'],
    },
    {
      id: 'create-organization',
      title: 'Create Organization',
      description: 'Create a new organization',
      icon: Plus,
      action: () => navigate('/organizations'),
      category: 'Actions',
      keywords: ['add', 'new', 'org'],
    },
    {
      id: 'invite-user',
      title: 'Invite User',
      description: 'Send invitation to join organization',
      icon: Mail,
      action: () => navigate('/organizations'),
      category: 'Actions',
      keywords: ['invite', 'email', 'send'],
    },
  ];

  const filteredCommands = commands.filter((command) => {
    const searchLower = search.toLowerCase();
    return (
      command.title.toLowerCase().includes(searchLower) ||
      command.description.toLowerCase().includes(searchLower) ||
      command.keywords?.some((keyword) => keyword.toLowerCase().includes(searchLower))
    );
  });

  const groupedCommands = filteredCommands.reduce(
    (acc, command) => {
      if (!acc[command.category]) {
        acc[command.category] = [];
      }
      acc[command.category].push(command);
      return acc;
    },
    {} as Record<string, CommandItem[]>
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-[20vh] z-50">
      <div className="bg-black/90 border border-dashed border-white/20 rounded-none w-full max-w-2xl mx-4">
        <Command className="p-2">
          <div className="flex items-center border-b border-dashed border-white/10 px-3 pb-3">
            <Search className="w-4 h-4 text-gray-400 mr-3" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search for actions, pages, or commands..."
              className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs text-gray-400 border border-dashed border-white/20 rounded-sm">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-96 overflow-y-auto p-2">
            {Object.keys(groupedCommands).length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No results found</p>
                <p className="text-sm">Try a different search term</p>
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                <div key={category} className="mb-4">
                  <Command.Group
                    heading={category}
                    className="text-xs text-gray-400 font-medium mb-2 px-2"
                  >
                    {categoryCommands.map((command) => {
                      const Icon = command.icon;
                      return (
                        <Command.Item
                          key={command.id}
                          value={command.id}
                          onSelect={() => {
                            command.action();
                            onClose();
                          }}
                          className="flex items-center space-x-3 px-3 py-2 rounded-none hover:bg-white/5 cursor-pointer transition-colors"
                        >
                          <Icon className="w-4 h-4 text-white" />
                          <div className="flex-1">
                            <div className="text-white font-light">{command.title}</div>
                            <div className="text-sm text-gray-400">{command.description}</div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                </div>
              ))
            )}
          </Command.List>

          <div className="border-t border-dashed border-white/10 px-3 py-2 text-xs text-gray-400">
            <div className="flex items-center justify-between">
              <span>
                Press{' '}
                <kbd className="px-1 py-0.5 border border-dashed border-white/20 rounded-sm">
                  ↑↓
                </kbd>{' '}
                to navigate
              </span>
              <span>
                Press{' '}
                <kbd className="px-1 py-0.5 border border-dashed border-white/20 rounded-sm">
                  Enter
                </kbd>{' '}
                to select
              </span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}
