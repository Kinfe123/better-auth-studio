import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  ChevronDown,
  Database,
  Settings,
  Users,
  Search,
  X,
  Zap,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCounts } from '@/contexts/CountsContext';
import OrganizationsPage from './Organizations';
import UsersPage from './Users';

interface SecurityPatch {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  date: string;
  description: string;
  affectedComponents: string[];
  status: 'pending' | 'applied' | 'scheduled';
  cve?: string;
}

export default function Dashboard() {
  const [activeTab] = useState('overview');
  const [showQuickActionsModal, setShowQuickActionsModal] = useState(false);
  const [activeUsersDaily, setActiveUsersDaily] = useState(0);
  const [newUsersDaily, setNewUsersDaily] = useState(0);
  const [selectedUserPeriod, setSelectedUserPeriod] = useState('ALL');
  const [selectedSubscriptionPeriod, setSelectedSubscriptionPeriod] = useState('ALL');
  const [totalSubscription, setTotalSubscription] = useState(1243.22);
  const [selectedPatch, setSelectedPatch] = useState<SecurityPatch | null>(null);
  const [showPatchModal, setShowPatchModal] = useState(false);
  const [activeUsersPeriod, setActiveUsersPeriod] = useState('Daily');
  const [newUsersPeriod, setNewUsersPeriod] = useState('Daily');
  const [organizationsPeriod, setOrganizationsPeriod] = useState('Daily');
  const [teamsPeriod, setTeamsPeriod] = useState('Daily');
  const [showActiveUsersDropdown, setShowActiveUsersDropdown] = useState(false);
  const [showNewUsersDropdown, setShowNewUsersDropdown] = useState(false);
  const [showOrganizationsDropdown, setShowOrganizationsDropdown] = useState(false);
  const [showTeamsDropdown, setShowTeamsDropdown] = useState(false);
  const [betterAuthVersion, setBetterAuthVersion] = useState<{
    current: string;
    latest: string;
    isOutdated: boolean;
  } | null>(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [hoveredBarPosition, setHoveredBarPosition] = useState<{ x: number; y: number } | null>(null);
  const [hoveredAreaIndex, setHoveredAreaIndex] = useState<number | null>(null);
  const [hoveredAreaPosition, setHoveredAreaPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Custom date range states
  const [activeUsersDateFrom, setActiveUsersDateFrom] = useState<Date | undefined>(undefined);
  const [activeUsersDateTo, setActiveUsersDateTo] = useState<Date | undefined>(undefined);
  const [newUsersDateFrom, setNewUsersDateFrom] = useState<Date | undefined>(undefined);
  const [newUsersDateTo, setNewUsersDateTo] = useState<Date | undefined>(undefined);
  const [organizationsDateFrom, setOrganizationsDateFrom] = useState<Date | undefined>(undefined);
  const [organizationsDateTo, setOrganizationsDateTo] = useState<Date | undefined>(undefined);
  const [teamsDateFrom, setTeamsDateFrom] = useState<Date | undefined>(undefined);
  const [teamsDateTo, setTeamsDateTo] = useState<Date | undefined>(undefined);
  
  const { counts, loading } = useCounts();
  const navigate = useNavigate();

  const periodOptions = ['Daily', 'Weekly', 'Monthly', 'Yearly', 'Custom'];

  // Security insights data - better-auth specific
  const getSecurityPatches = (): SecurityPatch[] => {
    const patches: SecurityPatch[] = [];

    if (betterAuthVersion?.isOutdated) {
      patches.push({
        id: 'version-check',
        title: `Update Better-Auth to v${betterAuthVersion.latest}`,
        severity: 'high',
        date: new Date().toISOString().split('T')[0],
        description: `Your current version (v${betterAuthVersion.current}) is outdated. Update to v${betterAuthVersion.latest} to get the latest security fixes, features, and improvements. Run: npm install better-auth@latest`,
        affectedComponents: ['All Components'],
        status: 'pending',
        cve: '',
      });
    } else if (betterAuthVersion) {
      patches.push({
        id: 'version-check',
        title: `Better-Auth v${betterAuthVersion.current} (Up to date)`,
        severity: 'low',
        date: new Date().toISOString().split('T')[0],
        description: `You are running the latest version of better-auth (v${betterAuthVersion.latest}). Great job keeping your dependencies up to date!`,
        affectedComponents: ['All Components'],
        status: 'applied',
        cve: '',
      });
    }

    // Add other security recommendations
    patches.push({
      id: '1',
      title: 'Session Token Rotation',
      severity: 'high',
      date: '2024-01-15',
      description:
        'Ensure session tokens are rotated regularly to prevent session fixation attacks. Better-auth supports automatic token rotation on security-sensitive operations.',
      affectedComponents: ['Session Management', 'Auth Core'],
      status: 'applied',
      cve: '',
    });

    // patches.push({
    //   id: '2',
    //   title: 'CSRF Protection Enabled',
    //   severity: 'critical',
    //   date: '2024-01-12',
    //   description:
    //     'Cross-Site Request Forgery protection is enabled by default in better-auth. Verify CSRF tokens are being validated on all state-changing requests.',
    //   affectedComponents: ['API Routes', 'Middleware'],
    //   status: 'applied',
    //   cve: '',
    // });

    // patches.push({
    //   id: '3',
    //   title: 'Rate Limiting Configuration',
    //   severity: 'medium',
    //   date: '2024-01-10',
    //   description:
    //     'Configure rate limiting for authentication endpoints to prevent brute force attacks. Better-auth provides built-in rate limiting middleware.',
    //   affectedComponents: ['Auth Endpoints'],
    //   status: 'pending',
    // });

    // patches.push({
    //   id: '4',
    //   title: 'Secure Cookie Settings',
    //   severity: 'high',
    //   date: '2024-01-08',
    //   description:
    //     'Ensure cookies are configured with secure, httpOnly, and sameSite flags. Better-auth sets secure defaults but verify your production configuration.',
    //   affectedComponents: ['Cookie Configuration'],
    //   status: 'applied',
    // });

    // patches.push({
    //   id: '5',
    //   title: 'Password Policy Enforcement',
    //   severity: 'medium',
    //   date: '2024-01-05',
    //   description:
    //     'Implement strong password policies using better-auth password validation hooks. Recommended: minimum 8 characters, mixed case, numbers, and symbols.',
    //   affectedComponents: ['User Registration', 'Password Reset'],
    //   status: 'pending',
    // });

    return patches;
  };

  const securityPatches = getSecurityPatches();

  useEffect(() => {
    // Fetch additional stats
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        if (data) {
          setActiveUsersDaily(data.activeUsersDaily || 1250);
          setNewUsersDaily(data.newUsersDaily || 10);
          setTotalSubscription(data.totalSubscription || 1243.22);
        }
      } catch (_error) {
        // Set defaults if API doesn't exist
        setActiveUsersDaily(1250);
        setNewUsersDaily(10);
        setTotalSubscription(1243.22);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    // Check better-auth version
    const checkBetterAuthVersion = async () => {
      try {
        const response = await fetch('/api/version-check');
        const data = await response.json();
        if (data) {
          setBetterAuthVersion({
            current: data.current || '1.0.0',
            latest: data.latest || '1.0.0',
            isOutdated: data.isOutdated || false,
          });
        }
      } catch (_error) {
        // Fallback: try to get from package.json endpoint
        try {
          const pkgResponse = await fetch('/api/package-info');
          const pkgData = await pkgResponse.json();
          const current = pkgData.betterAuthVersion || '1.0.0';
          // For now, set a mock latest version (in production, fetch from npm registry)
          const latest = '1.5.0'; // This should be fetched from npm registry
          setBetterAuthVersion({
            current,
            latest,
            isOutdated: current !== latest,
          });
        } catch {
          // Set default
          setBetterAuthVersion({
            current: '1.0.0',
            latest: '1.5.0',
            isOutdated: true,
          });
        }
      }
    };
    checkBetterAuthVersion();
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-white/10 text-white border-white/20';
      case 'high':
        return 'bg-white/10 text-white border-white/20';
      case 'medium':
        return 'bg-white/10 text-gray-300 border-white/20';
      case 'low':
        return 'bg-white/10 text-gray-400 border-white/20';
      default:
        return 'bg-white/10 text-gray-400 border-white/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-white/10 text-white border-white/20';
      case 'scheduled':
        return 'bg-white/10 text-gray-300 border-white/20';
      case 'pending':
        return 'bg-white/10 text-gray-400 border-white/20';
      default:
        return 'bg-white/10 text-gray-400 border-white/20';
    }
  };

  const handlePatchClick = (patch: SecurityPatch) => {
    setSelectedPatch(patch);
    setShowPatchModal(true);
  };

  const closePatchModal = () => {
    setShowPatchModal(false);
    setTimeout(() => setSelectedPatch(null), 300);
  };

  // Generate x-axis labels based on selected period
  const getChartLabels = (period: string) => {
    switch (period) {
      case '1D':
        // 24 hours - show every 4 hours
        return ['12am', '4am', '8am', '12pm', '4pm', '8pm'];
      case '1W':
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      case '1M':
        return ['W1', 'W2', 'W3', 'W4'];
      case '3M':
        return ['M1', 'M2', 'M3'];
      case '6M':
        return ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      case '1Y':
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      case 'ALL':
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
      default:
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    }
  };

  // Generate detailed labels for tooltips
  const getDetailedLabels = (period: string) => {
    switch (period) {
      case '1D':
        return Array.from({ length: 24 }, (_, i) => {
          const hour = i % 12 || 12;
          const ampm = i < 12 ? 'am' : 'pm';
          return `${hour}${ampm}`;
        });
      case '1W':
        return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      case '1M':
        return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      case '3M':
        return ['Month 1', 'Month 2', 'Month 3'];
      case '6M':
        return ['July', 'August', 'September', 'October', 'November', 'December'];
      case '1Y':
        return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      case 'ALL':
        return ['January', 'February', 'March', 'April', 'May', 'June', 'July'];
      default:
        return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    }
  };

  // Generate chart data points based on selected period
  const getChartData = (period: string) => {
    switch (period) {
      case '1D':
        // 24 hours - show every hour
        return [45, 42, 40, 38, 35, 33, 35, 40, 50, 60, 70, 75, 80, 85, 82, 78, 75, 70, 65, 60, 55, 52, 48, 46];
      case '1W':
        // 7 days
        return [60, 65, 70, 68, 75, 72, 55];
      case '1M':
        // 4 weeks
        return [65, 70, 85, 90];
      case '3M':
        // 3 months
        return [60, 75, 85];
      case '6M':
        // 6 months
        return [50, 55, 65, 70, 80, 90];
      case '1Y':
        // 12 months
        return [50, 55, 60, 65, 70, 75, 80, 85, 90, 85, 80, 95];
      case 'ALL':
        // Default view
        return [60, 45, 80, 55, 70, 90, 75];
      default:
        return [60, 65, 70, 68, 75, 72, 55];
    }
  };

  const renderOverview = () => (
    <div className="space-y-6 mt-5">
      {/* <div className="px-6 pt-8">
        <h1 className="text-3xl text-white font-light mb-2">Welcome Back</h1>
        <p className="text-gray-400 text-sm">
          {new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            weekday: 'short',
          })}
        </p>
      </div> */}

      <div className="px-6">
        <div className="flex items-center justify-between gap-8 py-4 px-6 bg-white/5 border border-white/10 rounded-none overflow-x-auto relative">
          {/* Top-left corner */}
          <div className="absolute top-0 left-0 w-[12px] h-[0.5px] bg-white/30" />
          <div className="absolute top-0 left-0 w-[0.5px] h-[12px] bg-white/30" />
          {/* Top-right corner */}
          <div className="absolute top-0 right-0 w-[12px] h-[0.5px] bg-white/30" />
          <div className="absolute top-0 right-0 w-[0.5px] h-[12px] bg-white/30" />
          {/* Bottom-left corner */}
          <div className="absolute bottom-0 left-0 w-[12px] h-[0.5px] bg-white/30" />
          <div className="absolute bottom-0 left-0 w-[0.5px] h-[12px] bg-white/30" />
          {/* Bottom-right corner */}
          <div className="absolute bottom-0 right-0 w-[12px] h-[0.5px] bg-white/30" />
          <div className="absolute bottom-0 right-0 w-[0.5px] h-[12px] bg-white/30" />

          {/* Total Users Stat */}
          <div className="flex items-center gap-3 min-w-fit">
            <div className="w-10 h-10 rounded-none bg-white/5 border border-dashed border-white/10 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-white" />
      </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm uppercase tracking-wide">Users</span>
              <span className="text-white text-lg font-medium">{loading ? '...' : formatNumber(counts.users)}</span>
              <div className="flex items-center gap-1 text-green-500">
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 0 L12 12 L0 12 Z" />
                </svg>
                <span className="text-sm font-medium">12%</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-8 w-[1px] bg-white/10" />

          {/* Total Organizations Stat */}
          <div className="flex items-center gap-3 min-w-fit">
            <div className="w-10 h-10 rounded-none bg-white/5 border border-dashed border-white/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm uppercase tracking-wide">Organizations</span>
              <span className="text-white text-lg font-medium">
                {loading ? '...' : formatNumber(counts.organizations)}
              </span>
              <div className="flex items-center gap-1 text-green-500">
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 0 L12 12 L0 12 Z" />
                </svg>
                <span className="text-sm font-medium">8%</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-8 w-[1px] bg-white/10" />

          {/* Total Sessions Stat */}
          <div className="flex items-center gap-3 min-w-fit">
            <div className="w-10 h-10 rounded-none bg-white/5 border border-dashed border-white/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm uppercase tracking-wide">Sessions</span>
              <span className="text-white text-lg font-medium">{loading ? '...' : formatNumber(counts.sessions)}</span>
              <div className="flex items-center gap-1 text-green-500">
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 0 L12 12 L0 12 Z" />
                </svg>
                <span className="text-sm font-medium">24%</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-8 w-[1px] bg-white/10" />

          {/* Revenue Stat */}
          <div className="flex items-center gap-3 min-w-fit">
            <div className="w-10 h-10 rounded-none bg-white/5 border border-dashed border-white/10 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm uppercase tracking-wide">Revenue</span>
              <span className="text-white text-lg font-medium">
                ${totalSubscription !== null ? formatNumber(totalSubscription) : '1.2k'}
              </span>
              <div className="flex items-center gap-1 text-red-500">
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor" style={{ transform: 'rotate(180deg)' }}>
                  <path d="M6 0 L12 12 L0 12 Z" />
                </svg>
                <span className="text-sm font-medium">2%</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-8 w-[1px] bg-white/10" />

          {/* New Users Daily */}
          <div className="flex items-center gap-3 min-w-fit">
            <div className="w-10 h-10 rounded-none bg-white/5 border border-dashed border-white/10 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm uppercase tracking-wide">New Users</span>
              <span className="text-white text-lg font-medium">
                {loading ? '...' : newUsersDaily !== null ? formatNumber(newUsersDaily) : '89'}
              </span>
              <div className="flex items-center gap-1 text-green-500">
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 0 L12 12 L0 12 Z" />
                </svg>
                <span className="text-sm font-medium">18%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Total Users Card */}
          <div className="bg-white/5 border border-white/10 p-6 relative">
            {/* Top-left corner */}
            <div className="absolute top-0 left-0 w-[12px] h-[0.5px] bg-white/30" />
            <div className="absolute top-0 left-0 w-[0.5px] h-[12px] bg-white/30" />
            {/* Top-right corner */}
            <div className="absolute top-0 right-0 w-[12px] h-[0.5px] bg-white/30" />
            <div className="absolute top-0 right-0 w-[0.5px] h-[12px] bg-white/30" />
            {/* Bottom-left corner */}
            <div className="absolute bottom-0 left-0 w-[12px] h-[0.5px] bg-white/30" />
            <div className="absolute bottom-0 left-0 w-[0.5px] h-[12px] bg-white/30" />
            {/* Bottom-right corner */}
            <div className="absolute bottom-0 right-0 w-[12px] h-[0.5px] bg-white/30" />
            <div className="absolute bottom-0 right-0 w-[0.5px] h-[12px] bg-white/30" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm text-white uppercase font-light">TOTAL USER</h3>
              <div className="flex items-center space-x-1 overflow-x-auto">
                {['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedUserPeriod(period)}
                    className={`px-2 py-1 text-xs font-light transition-colors whitespace-nowrap ${selectedUserPeriod === period
                        ? 'bg-white/20 text-white border border-white/30'
                        : 'text-gray-500 hover:text-white'
                      }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-4xl text-white font-light mb-6">
              {loading ? '...' : formatNumber(counts.users)}
            </p>
            <div className="space-y-2 relative">
              <div className="h-32 flex items-end justify-between space-x-1 relative">
                {getChartData(selectedUserPeriod).map((height, i) => {
                  // Vary opacity based on position and height for visual interest
                  const baseOpacity = 15 + (i % 3) * 5; // 15, 20, 25
                  const hoverOpacity = baseOpacity + 10;

                  return (
                    <div
                      key={i}
                      className={`flex-1 transition-colors relative cursor-pointer`}
                      style={{
                        height: `${height}%`,
                        backgroundColor: `rgba(255, 255, 255, ${baseOpacity / 100})`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `rgba(255, 255, 255, ${hoverOpacity / 100})`;
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredBarIndex(i);
                        setHoveredBarPosition({ x: rect.left + rect.width / 2, y: rect.top });
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = `rgba(255, 255, 255, ${baseOpacity / 100})`;
                        setHoveredBarIndex(null);
                        setHoveredBarPosition(null);
                      }}
                    />
                  );
                })}

                {hoveredBarIndex !== null && hoveredBarPosition && (
                  <div
                    className="fixed z-50 pointer-events-none transition-all duration-200 ease-out animate-in fade-in"
                    style={{
                      left: `${hoveredBarPosition.x}px`,
                      top: `${hoveredBarPosition.y - 10}px`,
                      transform: 'translate(-50%, -100%)',
                    }}
                  >
                    <div className="bg-black border border-white/20 rounded-sm px-3 py-2 shadow-lg">
                      <div className="text-xs text-gray-400 mb-1">{getDetailedLabels(selectedUserPeriod)[hoveredBarIndex]}</div>
                      <div className="text-sm text-white font-medium">
                        {Math.round((getChartData(selectedUserPeriod)[hoveredBarIndex] / 100) * counts.users).toLocaleString()} users
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* X-axis labels */}
              <div className="flex justify-between text-xs text-gray-500 font-mono">
                {getChartLabels(selectedUserPeriod).map((label, i) => (
                  <span key={i} className="flex-1 text-center">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Total Subscription Card */}
          <div className="bg-white/5 border border-white/10 p-6 relative">
            {/* Top-left corner */}
            <div className="absolute top-0 left-0 w-[12px] h-[0.5px] bg-white/30" />
            <div className="absolute top-0 left-0 w-[0.5px] h-[12px] bg-white/30" />
            {/* Top-right corner */}
            <div className="absolute top-0 right-0 w-[12px] h-[0.5px] bg-white/30" />
            <div className="absolute top-0 right-0 w-[0.5px] h-[12px] bg-white/30" />
            {/* Bottom-left corner */}
            <div className="absolute bottom-0 left-0 w-[12px] h-[0.5px] bg-white/30" />
            <div className="absolute bottom-0 left-0 w-[0.5px] h-[12px] bg-white/30" />
            {/* Bottom-right corner */}
            <div className="absolute bottom-0 right-0 w-[12px] h-[0.5px] bg-white/30" />
            <div className="absolute bottom-0 right-0 w-[0.5px] h-[12px] bg-white/30" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm text-white uppercase font-light">TOTAL SUBSCRIPTION</h3>
              <div className="flex items-center space-x-1 overflow-x-auto">
                {['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedSubscriptionPeriod(period)}
                    className={`px-2 py-1 text-xs font-light transition-colors whitespace-nowrap ${selectedSubscriptionPeriod === period
                        ? 'bg-white/20 text-white border border-white/30'
                        : 'text-gray-500 hover:text-white'
                      }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-4xl text-white font-light mb-6">
              ${totalSubscription.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            {/* Area Chart with X-axis labels and Tooltip */}
            <div className="space-y-2 relative">
              <div className="h-32 relative">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{ stopColor: 'rgba(255, 255, 255, 0.3)', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: 'rgba(255, 255, 255, 0.05)', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  {/* Area fill */}
                  <polygon
                    points={`0,100 ${getChartData(selectedSubscriptionPeriod)
                      .map((val, i, arr) => {
                        const x = (i / (arr.length - 1)) * 100;
                        const y = 100 - val;
                        return `${x},${y}`;
                      })
                      .join(' ')} 100,100`}
                    fill="url(#areaGradient)"
                  />
                  {/* Top line */}
                  <polyline
                    points={getChartData(selectedSubscriptionPeriod)
                      .map((val, i, arr) => {
                        const x = (i / (arr.length - 1)) * 100;
                        const y = 100 - val;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.3)"
                    strokeWidth="0.5"
                  />

                  {getChartData(selectedSubscriptionPeriod).map((val, i, arr) => {
                    const x = (i / (arr.length - 1)) * 100;
                    const y = 100 - val;
                    const isHovered = hoveredAreaIndex === i;

                    return (
                      <g key={`dot-${i}`}>
                        {/* Dot appears only on hover */}
                        <circle
                          cx={x}
                          cy={y}
                          r="3"
                          fill="white"
                          opacity={isHovered ? 1 : 0}
                          className="transition-all duration-200 ease-out"
                          style={{
                            filter: isHovered ? 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.6))' : 'none',
                            pointerEvents: 'none'
                          }}
                        />
                        {/* Invisible hover area */}
                        <circle
                          cx={x}
                          cy={y}
                          r="8"
                          fill="transparent"
                          className="cursor-pointer"
                          onMouseEnter={(e) => {
                            const svg = e.currentTarget.ownerSVGElement;
                            if (svg) {
                              const rect = svg.getBoundingClientRect();
                              const pointX = rect.left + (x / 100) * rect.width;
                              const pointY = rect.top + (y / 100) * rect.height;
                              setHoveredAreaIndex(i);
                              setHoveredAreaPosition({ x: pointX, y: pointY });
                            }
                          }}
                          onMouseLeave={() => {
                            setHoveredAreaIndex(null);
                            setHoveredAreaPosition(null);
                          }}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Tooltip */}
                {hoveredAreaIndex !== null && hoveredAreaPosition && (
                  <div
                    className="fixed z-50 pointer-events-none transition-all duration-200 ease-out animate-in fade-in"
                    style={{
                      left: `${hoveredAreaPosition.x}px`,
                      top: `${hoveredAreaPosition.y - 10}px`,
                      transform: 'translate(-50%, -100%)',
                    }}
                  >
                    <div className="bg-black border border-white/20 rounded-sm px-3 py-2 shadow-lg">
                      <div className="text-xs text-gray-400 mb-1">{getDetailedLabels(selectedSubscriptionPeriod)[hoveredAreaIndex]}</div>
                      <div className="text-sm text-white font-medium">
                        ${Math.round((getChartData(selectedSubscriptionPeriod)[hoveredAreaIndex] / 100) * totalSubscription).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
                  </div>
                )}
              </div>
              {/* X-axis labels */}
              <div className="flex justify-between text-xs text-gray-500 font-mono">
                {getChartLabels(selectedSubscriptionPeriod).map((label, i) => (
                  <span key={i} className="flex-1 text-center">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row - Three Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Two Small Cards */}
          <div className="space-y-4 overflow-x-hidden">
            {/* Active Users Daily */}
            <div className="bg-white/5 border border-white/10 p-6 pb-2 relative">
              {/* Top-left corner */}
              <div className="absolute top-0 left-0 w-[12px] h-[0.5px] bg-white/30" />
              <div className="absolute top-0 left-0 w-[0.5px] h-[12px] bg-white/30" />
              {/* Top-right corner */}
              <div className="absolute top-0 right-0 w-[12px] h-[0.5px] bg-white/30" />
              <div className="absolute top-0 right-0 w-[0.5px] h-[12px] bg-white/30" />
              {/* Bottom-left corner */}
              <div className="absolute bottom-0 left-0 w-[12px] h-[0.5px] bg-white/30" />
              <div className="absolute bottom-0 left-0 w-[0.5px] h-[12px] bg-white/30" />
              {/* Bottom-right corner */}
              <div className="absolute bottom-0 right-0 w-[12px] h-[0.5px] bg-white/30" />
              <div className="absolute bottom-0 right-0 w-[0.5px] h-[12px] bg-white/30" />
              <div className="flex items-center gap-2 mb-2 relative -mt-2 pb-1">
                <div className="relative">
                  <button
                    onClick={() => setShowActiveUsersDropdown(!showActiveUsersDropdown)}
                    className="text-xs h-full font-mono uppercase text-gray-400 flex items-center space-x-1 hover:text-white transition-colors"
                  >
                    <ChevronDown className="w-3 h-3" />
                    <span>{activeUsersPeriod}</span>
                  </button>
                  {showActiveUsersDropdown && (
                    <div className="absolute top-6 left-0 z-10 bg-black border border-white/10 rounded-none shadow-lg">
                      {periodOptions.map((period) => (
                        <button
                          key={period}
                          onClick={() => {
                            setActiveUsersPeriod(period);
                            setShowActiveUsersDropdown(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-xs text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                        >
                          {period}
                        </button>
                      ))}
              </div>
                  )}
            </div>
                
                {activeUsersPeriod === 'Custom' && (
                  <>
                    <Popover>
                      <PopoverTrigger asChild>
            <Button 
                          variant="outline"
                          className="h-6 px-2 text-xs font-mono uppercase text-gray-400 hover:text-white bg-transparent border-white/10 hover:bg-white/5"
            >
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {activeUsersDateFrom ? format(activeUsersDateFrom, 'MMM dd') : 'From'}
            </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-black border-white/10">
                        <Calendar
                          mode="single"
                          selected={activeUsersDateFrom}
                          onSelect={setActiveUsersDateFrom}
                          initialFocus
                          className="rounded-none"
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-6 px-2 text-xs font-mono uppercase text-gray-400 hover:text-white bg-transparent border-white/10 hover:bg-white/5"
                        >
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {activeUsersDateTo ? format(activeUsersDateTo, 'MMM dd') : 'To'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-black border-white/10">
                        <Calendar
                          mode="single"
                          selected={activeUsersDateTo}
                          onSelect={setActiveUsersDateTo}
                          initialFocus
                          disabled={(date) => activeUsersDateFrom ? date < activeUsersDateFrom : false}
                          className="rounded-none"
                        />
                      </PopoverContent>
                    </Popover>
                  </>
                )}
              </div>
              <hr className='mb-2 -mx-10 border-white/10' />
              <h4 className="text-md text-white/80 uppercase font-mono font-light mb-1">Active Users</h4>
              <p className="text-xs text-gray-400 mb-3">Users with active session in the time frame</p>
              <div className='flex pt-4 justify-between items-end'>
                <p className="text-3xl text-white font-light mb-2">{activeUsersDaily.toLocaleString()}</p>
                <div className="mt-2 mb-1 flex items-center gap-2">
                  <div className="flex items-center -mr-5 gap-1 px-2 py-1 border-white/5 rounded-none">
                    <svg className="w-3 h-3 text-green-500" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M6 0 L12 12 L0 12 Z" />
                    </svg>
                    <span className="text-xs text-green-500 font-medium">24%</span>
            </div>
                </div>

              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 pb-2 relative">
              {/* Top-left corner */}
              <div className="absolute top-0 left-0 w-[12px] h-[0.5px] bg-white/30" />
              <div className="absolute top-0 left-0 w-[0.5px] h-[12px] bg-white/30" />
              {/* Top-right corner */}
              <div className="absolute top-0 right-0 w-[12px] h-[0.5px] bg-white/30" />
              <div className="absolute top-0 right-0 w-[0.5px] h-[12px] bg-white/30" />
              {/* Bottom-left corner */}
              <div className="absolute bottom-0 left-0 w-[12px] h-[0.5px] bg-white/30" />
              <div className="absolute bottom-0 left-0 w-[0.5px] h-[12px] bg-white/30" />
              {/* Bottom-right corner */}
              <div className="absolute bottom-0 right-0 w-[12px] h-[0.5px] bg-white/30" />
              <div className="absolute bottom-0 right-0 w-[0.5px] h-[12px] bg-white/30" />
              <div className="flex items-center gap-2 mb-2 relative -mt-2 pb-1">
                <div className="relative">
                  <button
                    onClick={() => setShowNewUsersDropdown(!showNewUsersDropdown)}
                    className="text-xs h-full font-mono uppercase text-gray-400 flex items-center space-x-1 hover:text-white transition-colors"
                  >
                    <ChevronDown className="w-3 h-3" />
                    <span>{newUsersPeriod}</span>
                  </button>
                  {showNewUsersDropdown && (
                    <div className="absolute top-6 left-0 z-10 bg-black border border-white/10 rounded-none shadow-lg">
                      {periodOptions.map((period) => (
                        <button
                          key={period}
                          onClick={() => {
                            setNewUsersPeriod(period);
                            setShowNewUsersDropdown(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-xs text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {newUsersPeriod === 'Custom' && (
                  <>
                    <Popover>
                      <PopoverTrigger asChild>
            <Button
              variant="outline"
                          className="h-6 px-2 text-xs font-mono uppercase text-gray-400 hover:text-white bg-transparent border-white/10 hover:bg-white/5"
            >
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {newUsersDateFrom ? format(newUsersDateFrom, 'MMM dd') : 'From'}
            </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-black border-white/10">
                        <Calendar
                          mode="single"
                          selected={newUsersDateFrom}
                          onSelect={setNewUsersDateFrom}
                          initialFocus
                          className="rounded-none"
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-6 px-2 text-xs font-mono uppercase text-gray-400 hover:text-white bg-transparent border-white/10 hover:bg-white/5"
                        >
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {newUsersDateTo ? format(newUsersDateTo, 'MMM dd') : 'To'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-black border-white/10">
                        <Calendar
                          mode="single"
                          selected={newUsersDateTo}
                          onSelect={setNewUsersDateTo}
                          initialFocus
                          disabled={(date) => newUsersDateFrom ? date < newUsersDateFrom : false}
                          className="rounded-none"
                        />
                      </PopoverContent>
                    </Popover>
                  </>
                )}
              </div>
              <hr className='mb-2 -mx-10 border-white/10' />
              <h4 className="text-md text-white/80 uppercase font-mono font-light mb-1">New Users</h4>
              <p className="text-xs text-gray-400 mb-3">
                Newly registered Users in the time frame
              </p>
              <div className='flex pt-4 justify-between items-end'>
                <p className="text-3xl text-white font-light mb-2">{newUsersDaily}</p>
                <div className="mt-2 mb-1 flex items-center gap-2">
                  <div className="flex items-center -mr-5 gap-1 px-2 py-1 rounded-none">
                    <svg className="w-3 h-3 text-red-500" viewBox="0 0 12 12" fill="currentColor" style={{ transform: 'rotate(180deg)' }}>
                      <path d="M6 0 L12 12 L0 12 Z" />
                    </svg>
                    <span className="text-xs text-red-500 font-medium">18%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Organizations and Teams */}
          <div className="space-y-4 overflow-x-hidden">
            {/* Organizations */}
            <div className="bg-white/5 border border-white/10 p-6 pb-2 relative">
              {/* Top-left corner */}
              <div className="absolute top-0 left-0 w-[12px] h-[0.5px] bg-white/30" />
              <div className="absolute top-0 left-0 w-[0.5px] h-[12px] bg-white/30" />
              {/* Top-right corner */}
              <div className="absolute top-0 right-0 w-[12px] h-[0.5px] bg-white/30" />
              <div className="absolute top-0 right-0 w-[0.5px] h-[12px] bg-white/30" />
              {/* Bottom-left corner */}
              <div className="absolute bottom-0 left-0 w-[12px] h-[0.5px] bg-white/30" />
              <div className="absolute bottom-0 left-0 w-[0.5px] h-[12px] bg-white/30" />
              {/* Bottom-right corner */}
              <div className="absolute bottom-0 right-0 w-[12px] h-[0.5px] bg-white/30" />
              <div className="absolute bottom-0 right-0 w-[0.5px] h-[12px] bg-white/30" />
              <div className="flex items-center gap-2 mb-2 relative -mt-2 pb-1">
                <div className="relative">
                  <button
                    onClick={() => setShowOrganizationsDropdown(!showOrganizationsDropdown)}
                    className="text-xs h-full font-mono uppercase text-gray-400 flex items-center space-x-1 hover:text-white transition-colors"
                  >
                    <ChevronDown className="w-3 h-3" />
                    <span>{organizationsPeriod}</span>
                  </button>
                  {showOrganizationsDropdown && (
                    <div className="absolute top-6 left-0 z-10 bg-black border border-white/10 rounded-none shadow-lg">
                      {periodOptions.map((period) => (
                        <button
                          key={period}
                          onClick={() => {
                            setOrganizationsPeriod(period);
                            setShowOrganizationsDropdown(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-xs text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {organizationsPeriod === 'Custom' && (
                  <>
                    <Popover>
                      <PopoverTrigger asChild>
            <Button
              variant="outline"
                          className="h-6 px-2 text-xs font-mono uppercase text-gray-400 hover:text-white bg-transparent border-white/10 hover:bg-white/5"
            >
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {organizationsDateFrom ? format(organizationsDateFrom, 'MMM dd') : 'From'}
            </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-black border-white/10">
                        <Calendar
                          mode="single"
                          selected={organizationsDateFrom}
                          onSelect={setOrganizationsDateFrom}
                          initialFocus
                          className="rounded-none"
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-6 px-2 text-xs font-mono uppercase text-gray-400 hover:text-white bg-transparent border-white/10 hover:bg-white/5"
                        >
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {organizationsDateTo ? format(organizationsDateTo, 'MMM dd') : 'To'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-black border-white/10">
                        <Calendar
                          mode="single"
                          selected={organizationsDateTo}
                          onSelect={setOrganizationsDateTo}
                          initialFocus
                          disabled={(date) => organizationsDateFrom ? date < organizationsDateFrom : false}
                          className="rounded-none"
                        />
                      </PopoverContent>
                    </Popover>
                  </>
                )}
              </div>
              <hr className='mb-2 -mx-10 border-white/10' />
              <h4 className="text-md text-white/80 uppercase font-mono font-light mb-1">Organizations</h4>
              <p className="text-xs text-gray-400 mb-3">Total organizations in the time frame</p>
              <div className='flex pt-4 justify-between items-end'>
                <p className="text-3xl text-white font-light mb-2">{loading ? '...' : counts.organizations.toLocaleString()}</p>
                <div className="mt-2 mb-1 flex items-center gap-2">
                  <div className="flex items-center -mr-5 gap-1 px-2 py-1 rounded-none">
                    <svg className="w-3 h-3 text-green-500" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M6 0 L12 12 L0 12 Z" />
                    </svg>
                    <span className="text-xs text-green-500 font-medium">15%</span>
            </div>
                </div>
              </div>
            </div>

            {/* Teams */}
            <div className="bg-white/5 border border-white/10 p-6 pb-2 relative">
              {/* Top-left corner */}
              <div className="absolute top-0 left-0 w-[12px] h-[0.5px] bg-white/30" />
              <div className="absolute top-0 left-0 w-[0.5px] h-[12px] bg-white/30" />
              {/* Top-right corner */}
              <div className="absolute top-0 right-0 w-[12px] h-[0.5px] bg-white/30" />
              <div className="absolute top-0 right-0 w-[0.5px] h-[12px] bg-white/30" />
              {/* Bottom-left corner */}
              <div className="absolute bottom-0 left-0 w-[12px] h-[0.5px] bg-white/30" />
              <div className="absolute bottom-0 left-0 w-[0.5px] h-[12px] bg-white/30" />
              {/* Bottom-right corner */}
              <div className="absolute bottom-0 right-0 w-[12px] h-[0.5px] bg-white/30" />
              <div className="absolute bottom-0 right-0 w-[0.5px] h-[12px] bg-white/30" />
              <div className="flex items-center gap-2 mb-2 relative -mt-2 pb-1">
                <div className="relative">
                  <button
                    onClick={() => setShowTeamsDropdown(!showTeamsDropdown)}
                    className="text-xs h-full font-mono uppercase text-gray-400 flex items-center space-x-1 hover:text-white transition-colors"
                  >
                    <ChevronDown className="w-3 h-3" />
                    <span>{teamsPeriod}</span>
                  </button>
                  {showTeamsDropdown && (
                    <div className="absolute top-6 left-0 z-10 bg-black border border-white/10 rounded-none shadow-lg">
                      {periodOptions.map((period) => (
                        <button
                          key={period}
                          onClick={() => {
                            setTeamsPeriod(period);
                            setShowTeamsDropdown(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-xs text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {teamsPeriod === 'Custom' && (
                  <>
                    <Popover>
                      <PopoverTrigger asChild>
            <Button
              variant="outline"
                          className="h-6 px-2 text-xs font-mono uppercase text-gray-400 hover:text-white bg-transparent border-white/10 hover:bg-white/5"
            >
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {teamsDateFrom ? format(teamsDateFrom, 'MMM dd') : 'From'}
            </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-black border-white/10">
                        <Calendar
                          mode="single"
                          selected={teamsDateFrom}
                          onSelect={setTeamsDateFrom}
                          initialFocus
                          className="rounded-none"
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-6 px-2 text-xs font-mono uppercase text-gray-400 hover:text-white bg-transparent border-white/10 hover:bg-white/5"
                        >
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {teamsDateTo ? format(teamsDateTo, 'MMM dd') : 'To'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-black border-white/10">
                        <Calendar
                          mode="single"
                          selected={teamsDateTo}
                          onSelect={setTeamsDateTo}
                          initialFocus
                          disabled={(date) => teamsDateFrom ? date < teamsDateFrom : false}
                          className="rounded-none"
                        />
                      </PopoverContent>
                    </Popover>
                  </>
                )}
              </div>
              <hr className='mb-2 -mx-10 border-white/10' />
              <h4 className="text-md text-white/80 uppercase font-mono font-light mb-1">Teams</h4>
              <p className="text-xs text-gray-400 mb-3">Total teams in the time frame</p>
              <div className='flex pt-4 justify-between items-end'>
                <p className="text-3xl text-white font-light mb-2">{loading ? '...' : (counts.teams ?? 0).toLocaleString()}</p>
                <div className="mt-2 mb-1 flex items-center gap-2">
                  <div className="flex items-center -mr-5 gap-1 px-2 py-1 rounded-none">
                    <svg className="w-3 h-3 text-green-500" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M6 0 L12 12 L0 12 Z" />
                    </svg>
                    <span className="text-xs text-green-500 font-medium">22%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Security Insights */}
          <div className="bg-white/5 border border-white/10 p-6 relative rounded-none flex flex-col">
            {/* Top-left corner */}
            <div className="absolute top-0 left-0 w-[12px] h-[0.5px] bg-white/30" />
            <div className="absolute top-0 left-0 w-[0.5px] h-[12px] bg-white/30" />
            {/* Top-right corner */}
            <div className="absolute top-0 right-0 w-[12px] h-[0.5px] bg-white/30" />
            <div className="absolute top-0 right-0 w-[0.5px] h-[12px] bg-white/30" />
            {/* Bottom-left corner */}
            <div className="absolute bottom-0 left-0 w-[12px] h-[0.5px] bg-white/30" />
            <div className="absolute bottom-0 left-0 w-[0.5px] h-[12px] bg-white/30" />
            {/* Bottom-right corner */}
            <div className="absolute bottom-0 right-0 w-[12px] h-[0.5px] bg-white/30" />
            <div className="absolute bottom-0 right-0 w-[0.5px] h-[12px] bg-white/30" />
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-white" />
                <h4 className="text-lg text-white font-light">Security Insights</h4>
              </div>
            </div>
            <div className="space-y-3 overflow-y-auto custom-scrollbar max-h-[400px]">
              {securityPatches.map((patch, index) => (
                <div
                  key={patch.id}
                  onClick={() => handlePatchClick(patch)}
                  className="group py-2 border-b border-white/5 cursor-pointer transition-all duration-200 hover:border-white/20"
                  style={{
                    animation: `slideIn 0.3s ease-out ${index * 0.1}s both`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm text-white/90 font-light truncate group-hover:text-white transition-colors">{patch.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 border rounded-sm uppercase font-mono ${getSeverityColor(
                            patch.severity
                          )}`}
                        >
                          {patch.severity}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 border rounded-sm capitalize font-mono ${getStatusColor(patch.status)}`}
                        >
                          {patch.status}
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-all flex-shrink-0 mt-0.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      {/* <div className="border-b border-dashed border-white/10">
        <div className="px-6 py-4">
          <div className="flex items-center space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 px-1 border-b-2 font-light text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-white text-white'
                  : 'border-transparent text-white/60 hover:text-white/80'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-3 px-1 border-b-2 font-light text-sm transition-colors ${
                activeTab === 'users'
                  ? 'border-white text-white'
                  : 'border-transparent text-white/60 hover:text-white/80'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('organizations')}
              className={`pb-3 px-1 border-b-2 font-light text-sm transition-colors ${
                activeTab === 'organizations'
                  ? 'border-white text-white'
                  : 'border-transparent text-white/60 hover:text-white/80'
              }`}
            >
              Organizations
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`pb-3 px-1 border-b-2 font-light text-sm transition-colors ${
                activeTab === 'sessions'
                  ? 'border-white text-white'
                  : 'border-transparent text-white/60 hover:text-white/80'
              }`}
            >
              Sessions
            </button>
          </div>
        </div>
      </div> */}

      {/* Tab Content */}
      {activeTab === 'overview' ? (
        renderOverview()
      ) : activeTab === 'users' ? (
        <UsersPage />
      ) : activeTab === 'organizations' ? (
        <OrganizationsPage />
      ) : (
        //  activeTab === 'sessions' ? <SessionsPage /> :
        renderOverview()
      )}

      {/* Quick Actions Modal */}
      {showQuickActionsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/90 border border-dashed border-white/20 p-6 w-full max-w-3xl rounded-none">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Zap className="w-6 h-6 text-white" />
                <h3 className="text-lg text-white font-light">Quick Actions</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQuickActionsModal(false)}
                className="text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Navigate to Users */}
              <button
                onClick={() => {
                  setShowQuickActionsModal(false);
                  navigate('/users');
                }}
                className="flex items-center space-x-4 p-4 bg-black/30 border border-dashed border-white/20 rounded-none hover:bg-black/50 transition-colors text-left group"
              >
                <div className="p-2 bg-white/10 rounded-none group-hover:bg-white/20 transition-colors">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-light mb-1">View All Users</h4>
                  <p className="text-sm text-gray-400">Manage user accounts</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              </button>

              {/* Navigate to Organizations */}
              <button
                onClick={() => {
                  setShowQuickActionsModal(false);
                  navigate('/organizations');
                }}
                className="flex items-center space-x-4 p-4 bg-black/30 border border-dashed border-white/20 rounded-none hover:bg-black/50 transition-colors text-left group"
              >
                <div className="p-2 bg-white/10 rounded-none group-hover:bg-white/20 transition-colors">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-light mb-1">View Organizations</h4>
                  <p className="text-sm text-gray-400">Manage organizations</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              </button>

              {/* Navigate to Sessions */}
              <button
                onClick={() => {
                  setShowQuickActionsModal(false);
                  navigate('/sessions');
                }}
                className="flex items-center space-x-4 p-4 bg-black/30 border border-dashed border-white/20 rounded-none hover:bg-black/50 transition-colors text-left group"
              >
                <div className="p-2 bg-white/10 rounded-none group-hover:bg-white/20 transition-colors">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-light mb-1">View Sessions</h4>
                  <p className="text-sm text-gray-400">Monitor active sessions</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              </button>

              {/* Navigate to Database */}
              <button
                onClick={() => {
                  setShowQuickActionsModal(false);
                  navigate('/database');
                }}
                className="flex items-center space-x-4 p-4 bg-black/30 border border-dashed border-white/20 rounded-none hover:bg-black/50 transition-colors text-left group"
              >
                <div className="p-2 bg-white/10 rounded-none group-hover:bg-white/20 transition-colors">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-light mb-1">Database Schema</h4>
                  <p className="text-sm text-gray-400">View schema visualizer</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              </button>

              {/* Navigate to Settings */}
              <button
                onClick={() => {
                  setShowQuickActionsModal(false);
                  navigate('/settings');
                }}
                className="flex items-center space-x-4 p-4 bg-black/30 border border-dashed border-white/20 rounded-none hover:bg-black/50 transition-colors text-left group"
              >
                <div className="p-2 bg-white/10 rounded-none group-hover:bg-white/20 transition-colors">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-light mb-1">Settings</h4>
                  <p className="text-sm text-gray-400">Configure system</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              </button>

              {/* Search Users */}
              <button
                onClick={() => {
                  setShowQuickActionsModal(false);
                  navigate('/users');
                  // Could add search focus functionality here
                }}
                className="flex items-center space-x-4 p-4 bg-black/30 border border-dashed border-white/20 rounded-none hover:bg-black/50 transition-colors text-left group"
              >
                <div className="p-2 bg-white/10 rounded-none group-hover:bg-white/20 transition-colors">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-light mb-1">Search Users</h4>
                  <p className="text-sm text-gray-400">Find specific users</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-dashed border-white/10">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>Tip: Press Ctrl+K or Cmd+K for command palette</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQuickActionsModal(false)}
                  className="text-gray-400 hover:text-white rounded-none"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Patch Modal */}
      {showPatchModal && selectedPatch && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          style={{
            animation: 'fadeIn 0.3s ease-out',
          }}
          onClick={closePatchModal}
        >
          <div
            className="bg-black border border-white/20 rounded-none max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            style={{
              animation: 'slideUp 0.3s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-black border-b border-white/10 p-6 z-10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-6 h-6 text-white" />
                    <h3 className="text-xl text-white font-light">{selectedPatch.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs px-2 py-1 border rounded-none uppercase font-medium ${getSeverityColor(
                        selectedPatch.severity
                      )}`}
                    >
                      {selectedPatch.severity} Severity
                    </span>
                    <span
                      className={`text-xs px-2 py-1 border rounded-none capitalize ${getStatusColor(
                        selectedPatch.status
                      )}`}
                    >
                      {selectedPatch.status}
                    </span>
                    {selectedPatch.cve && (
                      <span className="text-xs text-gray-400 font-mono bg-white/5 px-2 py-1 border border-white/10 rounded-none">
                        {selectedPatch.cve}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={closePatchModal}
                  className="p-2 hover:bg-white/10 transition-colors rounded-none"
                >
                  <X className="w-5 h-5 text-gray-400 hover:text-white" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Date */}
              <div>
                <h4 className="text-sm text-gray-400 uppercase tracking-wide mb-2">Release Date</h4>
                <p className="text-white">
                  {new Date(selectedPatch.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-sm text-gray-400 uppercase tracking-wide mb-2">Description</h4>
                <p className="text-white leading-relaxed">{selectedPatch.description}</p>
              </div>

              {/* Affected Components */}
              <div>
                <h4 className="text-sm text-gray-400 uppercase tracking-wide mb-3">
                  Affected Components
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedPatch.affectedComponents.map((component, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-none"
                      style={{
                        animation: `slideIn 0.3s ease-out ${index * 0.1}s both`,
                      }}
                    >
                      <div className="w-2 h-2 bg-white rounded-none flex-shrink-0" />
                      <span className="text-sm text-white">{component}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Info */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-none">
                <div className="flex items-start gap-3">
                  {selectedPatch.status === 'applied' && (
                    <>
                      <CheckCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-sm text-white font-medium mb-1">Patch Applied</h5>
                        <p className="text-xs text-gray-400">
                          This security patch has been successfully applied to your system.
                        </p>
                      </div>
                    </>
                  )}
                  {selectedPatch.status === 'scheduled' && (
                    <>
                      <Clock className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-sm text-white font-medium mb-1">Scheduled</h5>
                        <p className="text-xs text-gray-400">
                          This patch is scheduled for deployment in the next maintenance window.
                        </p>
                      </div>
                    </>
                  )}
                  {selectedPatch.status === 'pending' && (
                    <>
                      <AlertTriangle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-sm text-white font-medium mb-1">Action Required</h5>
                        <p className="text-xs text-gray-400">
                          This patch is pending review and requires manual approval before deployment.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <Button
                  variant="ghost"
                  onClick={closePatchModal}
                  className="text-gray-400 hover:text-white rounded-none"
                >
                  Close
                </Button>
                {selectedPatch.status === 'pending' && (
                  <Button className="bg-white text-black hover:bg-gray-200 rounded-none">
                    Apply Patch
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}
