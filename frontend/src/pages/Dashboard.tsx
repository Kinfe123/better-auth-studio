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
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
  const [selectedPeriod, setSelectedPeriod] = useState('ALL');
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
  const { counts, loading } = useCounts();
  const navigate = useNavigate();

  const periodOptions = ['Daily', 'Weekly', 'Monthly', 'Yearly', 'Custom'];

  // Security patches data
  const securityPatches: SecurityPatch[] = [
    {
      id: '1',
      title: 'SQL Injection Vulnerability Fix',
      severity: 'critical',
      date: '2024-01-15',
      description:
        'Critical SQL injection vulnerability in user authentication module has been identified and patched. This vulnerability could allow attackers to bypass authentication and access sensitive user data.',
      affectedComponents: ['Auth Module', 'User Service', 'Database Layer'],
      status: 'applied',
      cve: 'CVE-2024-0001',
    },
    {
      id: '2',
      title: 'XSS Protection Enhancement',
      severity: 'high',
      date: '2024-01-12',
      description:
        'Enhanced cross-site scripting (XSS) protection across all input fields and user-generated content areas. Implements content security policies and input sanitization.',
      affectedComponents: ['Frontend Components', 'API Gateway'],
      status: 'applied',
      cve: 'CVE-2024-0002',
    },
    {
      id: '3',
      title: 'JWT Token Expiration Update',
      severity: 'medium',
      date: '2024-01-10',
      description:
        'Updated JWT token expiration policies to improve security. Tokens now expire after 1 hour of inactivity and require re-authentication for sensitive operations.',
      affectedComponents: ['Authentication Service', 'Session Manager'],
      status: 'scheduled',
    },
    {
      id: '4',
      title: 'Rate Limiting Implementation',
      severity: 'high',
      date: '2024-01-08',
      description:
        'Implemented rate limiting across all API endpoints to prevent brute force attacks and DDoS attempts. Default limit set to 100 requests per minute per IP.',
      affectedComponents: ['API Gateway', 'Load Balancer'],
      status: 'applied',
    },
    {
      id: '5',
      title: 'Dependency Security Updates',
      severity: 'medium',
      date: '2024-01-05',
      description:
        'Updated multiple npm dependencies with known security vulnerabilities. Includes updates to react, express, and authentication libraries.',
      affectedComponents: ['All Modules'],
      status: 'pending',
    },
  ];

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
      case 'ALL':
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
      case '1M':
        return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      case '3M':
        return ['Jan', 'Feb', 'Mar'];
      case '6M':
        return ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      case '1Y':
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      default:
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    }
  };

  // Generate chart data points based on selected period
  const getChartData = (period: string) => {
    switch (period) {
      case 'ALL':
        return [60, 45, 80, 55, 70, 90, 75];
      case '1M':
        return [65, 70, 85, 90];
      case '3M':
        return [60, 75, 85];
      case '6M':
        return [50, 55, 65, 70, 80, 90];
      case '1Y':
        return [50, 55, 60, 65, 70, 75, 80, 85, 90, 85, 80, 95];
      default:
        return [60, 45, 80, 55, 70, 90, 75];
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
            <div className="flex items-center space-x-1">
              {['ALL', '1M', '3M', '6M', '1Y'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-2 py-1 text-xs font-light transition-colors ${
                    selectedPeriod === period
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
          {/* Bar Chart with X-axis labels */}
          <div className="space-y-2">
            <div className="h-32 flex items-end justify-between space-x-1">
              {getChartData(selectedPeriod).map((height, i) => {
                // Vary opacity based on position and height for visual interest
                const baseOpacity = 15 + (i % 3) * 5; // 15, 20, 25
                const hoverOpacity = baseOpacity + 10;
                return (
                  <div
                    key={i}
                    className={`flex-1 transition-colors`}
                    style={{ 
                      height: `${height}%`,
                      backgroundColor: `rgba(255, 255, 255, ${baseOpacity / 100})`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `rgba(255, 255, 255, ${hoverOpacity / 100})`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = `rgba(255, 255, 255, ${baseOpacity / 100})`;
                    }}
                  />
                );
              })}
            </div>
            {/* X-axis labels */}
            <div className="flex justify-between text-xs text-gray-500 font-mono">
              {getChartLabels(selectedPeriod).map((label, i) => (
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
            <div className="flex items-center space-x-1">
              {['ALL', '1M', '3M', '6M', '1Y'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-2 py-1 text-xs font-light transition-colors ${
                    selectedPeriod === period
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
          {/* Line Chart with X-axis labels */}
          <div className="space-y-2">
            <div className="h-32 relative">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline
                  points={getChartData(selectedPeriod)
                    .map((val, i, arr) => {
                      const x = (i / (arr.length - 1)) * 100;
                      const y = 100 - val;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth="1"
                />
              </svg>
            </div>
            {/* X-axis labels */}
            <div className="flex justify-between text-xs text-gray-500 font-mono">
              {getChartLabels(selectedPeriod).map((label, i) => (
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
            <div className="flex items-center justify-between mb-2 relative">
              <button
                onClick={() => setShowActiveUsersDropdown(!showActiveUsersDropdown)}
                className="text-xs font-mono uppercase text-gray-400 flex items-center space-x-1 hover:text-white transition-colors"
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
                      className="block w-full text-left px-4 py-2 text-xs text-white hover:bg-white/10 transition-colors"
                    >
                      {period}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <hr className='mb-2 -mx-10 border-white/10' /> 
            <h4 className="text-md text-white/80 uppercase font-mono font-light mb-1">Active Users</h4>
            <p className="text-xs text-gray-400 mb-3">Users with active session in the time frame</p>
            <p className="text-3xl text-white font-light mb-2">{activeUsersDaily.toLocaleString()}</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 border border-dashed border-white/10 rounded-none">
                <svg className="w-3 h-3 text-green-500" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 0 L12 12 L0 12 Z" />
                </svg>
                <span className="text-xs text-green-500 font-medium">24%</span>
              </div>
              <span className="text-xs text-gray-400">from yesterday</span>
            </div>
          </div>

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
            <div className="flex items-center justify-between mb-2 relative">
              <button
                onClick={() => setShowNewUsersDropdown(!showNewUsersDropdown)}
                className="text-xs font-mono uppercase text-gray-400 flex items-center space-x-1 hover:text-white transition-colors"
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
                      className="block w-full text-left px-4 py-2 text-xs text-white hover:bg-white/10 transition-colors"
                    >
                      {period}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <hr className='mb-2 -mx-10 border-white/10' />
            <h4 className="text-md text-white/80 uppercase font-mono font-light mb-1">New Users</h4>
            <p className="text-xs text-gray-400 mb-3">
              Newly registered Users in the time frame
            </p>
            <p className="text-3xl text-white font-light mb-2">{newUsersDaily}</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 border border-dashed border-white/10 rounded-none">
                <svg className="w-3 h-3 text-red-500" viewBox="0 0 12 12" fill="currentColor" style={{ transform: 'rotate(180deg)' }}>
                  <path d="M6 0 L12 12 L0 12 Z" />
                </svg>
                <span className="text-xs text-red-500 font-medium">18%</span>
              </div>
              <span className="text-xs text-gray-400">from yesterday</span>
            </div>
          </div>
        </div>

        {/* Middle Column - Organizations and Teams */}
        <div className="space-y-4 overflow-x-hidden">
          {/* Organizations */}
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
            <div className="flex items-center justify-between mb-2 relative">
              <button
                onClick={() => setShowOrganizationsDropdown(!showOrganizationsDropdown)}
                className="text-xs font-mono uppercase text-gray-400 flex items-center space-x-1 hover:text-white transition-colors"
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
                      className="block w-full text-left px-4 py-2 text-xs text-white hover:bg-white/10 transition-colors"
                    >
                      {period}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <hr className='mb-2 -mx-10 border-white/10' />
            <h4 className="text-md text-white/80 uppercase font-mono font-light mb-1">Organizations</h4>
            <p className="text-xs text-gray-400 mb-3">Total organizations in the time frame</p>
            <p className="text-3xl text-white font-light mb-2">{loading ? '...' : counts.organizations.toLocaleString()}</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 border border-dashed border-white/10 rounded-none">
                <svg className="w-3 h-3 text-green-500" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 0 L12 12 L0 12 Z" />
                </svg>
                <span className="text-xs text-green-500 font-medium">15%</span>
              </div>
              <span className="text-xs text-gray-400">from last period</span>
            </div>
          </div>

          {/* Teams */}
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
            <div className="flex items-center justify-between mb-2 relative">
              <button
                onClick={() => setShowTeamsDropdown(!showTeamsDropdown)}
                className="text-xs font-mono uppercase text-gray-400 flex items-center space-x-1 hover:text-white transition-colors"
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
                      className="block w-full text-left px-4 py-2 text-xs text-white hover:bg-white/10 transition-colors"
                    >
                      {period}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <hr className='mb-2 -mx-10 border-white/10' />
            <h4 className="text-md text-white/80 uppercase font-mono font-light mb-1">Teams</h4>
            <p className="text-xs text-gray-400 mb-3">Total teams in the time frame</p>
            <p className="text-3xl text-white font-light mb-2">{loading ? '...' : (counts.teams ?? 0).toLocaleString()}</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 border border-dashed border-white/10 rounded-none">
                <svg className="w-3 h-3 text-green-500" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 0 L12 12 L0 12 Z" />
                </svg>
                <span className="text-xs text-green-500 font-medium">22%</span>
              </div>
              <span className="text-xs text-gray-400">from last period</span>
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
            <span className="text-xs text-gray-400">{securityPatches.length} items</span>
          </div>
          <div className="space-y-2 overflow-y-auto custom-scrollbar max-h-[400px]">
            {securityPatches.map((patch, index) => (
              <div
                key={patch.id}
                onClick={() => handlePatchClick(patch)}
                className="group p-3 bg-white/[0.02] hover:bg-white/5 border border-white/10 rounded-none cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                style={{
                  animation: `slideIn 0.3s ease-out ${index * 0.1}s both`,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-white font-medium truncate">{patch.title}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs px-2 py-0.5 border rounded-none uppercase font-medium ${getSeverityColor(
                          patch.severity
                        )}`}
                      >
                        {patch.severity}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 border rounded-none capitalize ${getStatusColor(patch.status)}`}
                      >
                        {patch.status}
                      </span>
                      {patch.cve && (
                        <span className="text-xs text-gray-400 font-mono">{patch.cve}</span>
                      )}
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-all flex-shrink-0" />
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
