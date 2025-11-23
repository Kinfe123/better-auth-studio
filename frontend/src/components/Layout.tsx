import {
  Building2,
  Database,
  LayoutDashboard,
  Search,
  Settings,
  Users,
  Wrench,
} from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCounts } from '../contexts/CountsContext';
import CommandPalette from './CommandPalette';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { counts, loading } = useCounts();
  const navigate = useNavigate();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [studioVersion, setStudioVersion] = useState('v1.0.0');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await fetch('/api/config');
        const data = await response.json();
        if (data.studio?.version) {
          setStudioVersion(`v${data.studio.version}`);
        }
      } catch (_error) {}
    };

    fetchVersion();
  }, []);

  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    }
    return count.toString();
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    {
      name: 'Users',
      href: '/users',
      icon: Users,
      badge: loading ? '...' : formatCount(counts.users),
    },
    {
      name: 'Organizations',
      href: '/organizations',
      icon: Building2,
      badge: loading ? '...' : formatCount(counts.organizations),
    },
    { name: 'Database', href: '/database', icon: Database },
    { name: 'Tools', href: '/tools', icon: Wrench },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="bg-black/70 border-b border-white/15">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-end justify-end space-x-2">
              <div className="w-7 h-7 border border-dashed border-white/20 rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-md">⚡</span>
              </div>
              <div className="mb-0 cursor-pointer" onClick={() => navigate('/')}>
                <h1 className="text-md inline-flex mb-0 items-start font-light font-mono uppercase text-white">
                  Better-Auth Studio
                  <sup className="text-sm text-gray-500 ml-1 mt-0">
                    <span className="mr-1">[</span>
                    <span className="text-white/80 lowercase font-mono text-xs">
                      {studioVersion}
                    </span>
                    <span className="ml-1">]</span>
                  </sup>
                </h1>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                onClick={() => setIsCommandPaletteOpen(true)}
                className="pl-10 pr-4 py-2  bg-black border rounded-none border-gray-600 text-white border-dashed border-white/20 focus:ring-2 focus:ring-white focus:border-transparent transition-colors placeholder-gray-400 cursor-pointer"
                readOnly
              />
              <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 border border-dashed border-white/10 rounded-sm px-1.5 py-0.5">
                ⌘ K
              </kbd>
            </div>
            <a
              href="https://better-auth.com/docs"
              target="_blank"
              rel="noopener"
              className="group flex items-center"
            >
              <span className="text-white/70 text-xs mr-2 transition-colors duration-150 group-hover:text-white group-hover:bg-gray-500/20 rounded px-0.5">[</span>
              <span className="text-white/80 font-mono text-sm uppercase">Docs</span>
              <span className="text-white/70 text-xs ml-2 transition-colors duration-150 group-hover:text-white group-hover:bg-gray-500/20 rounded px-0.5">]</span>
            </a>
            <a
              href="https://better-auth.com/support"
              target="_blank"
              rel="noopener"
              className="group flex items-center"
            >
              <span className="text-white/70 text-xs mr-2 transition-colors duration-150 group-hover:text-white group-hover:bg-gray-500/20 rounded px-0.5">[</span>
              <span className="text-white/80 font-mono text-sm uppercase">Support</span>
              <span className="text-white/70 text-xs ml-2 transition-colors duration-150 group-hover:text-white group-hover:bg-gray-500/20 rounded px-0.5">]</span>
            </a>
          </div>
        </div>
      </div>

      <div className="bg-black/50 border-b border-white/10">
        <div className="px-6">
          <nav className="flex space-x-8">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${
                    isActive
                      ? 'border-white text-white'
                      : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="inline-flex items-start">
                    {item.name}
                    {item.badge && (
                      <sup className="text-xs text-gray-500 ml-1">
                        <span className="mr-0.5">[</span>
                        <span className="text-white/80 font-mono text-xs">{item.badge}</span>
                        <span className="ml-0.5">]</span>
                      </sup>
                    )}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-0">{children}</div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
}
