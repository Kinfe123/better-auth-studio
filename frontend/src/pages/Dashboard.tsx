import { format } from 'date-fns';
import { ArrowUpRight, Shield } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCounts } from '@/contexts/CountsContext';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  Calendar as CalendarIcon,
  CheckCircle,
  ChevronDown,
  Clock,
  Copy,
  Database,
  Search,
  Settings,
  Users,
  X,
  Zap,
} from '../components/PixelIcons';
import OrganizationsPage from './Organizations';
import UsersPage from './Users';

const ACTIVITY_STREAMS = [
  {
    id: 'signups',
    label: 'Signups',
    analyticsKey: 'newUsers',
    barClass: 'bg-white/25 border border-white/10',
    dotClass: 'bg-white/25',
  },
  {
    id: 'logins',
    label: 'Logins',
    analyticsKey: 'activeUsers',
    barClass: 'bg-white/20 border border-white/10',
    dotClass: 'bg-white/20',
  },
  {
    id: 'organizations',
    label: 'Organizations',
    analyticsKey: 'organizations',
    barClass: 'bg-white/15 border border-white/10',
    dotClass: 'bg-white/15',
  },
  {
    id: 'teams',
    label: 'Teams',
    analyticsKey: 'teams',
    barClass: 'bg-white/10 border border-white/10',
    dotClass: 'bg-white/10',
  },
  {
    id: 'sessions',
    label: 'Sessions',
    analyticsKey: 'sessions',
    barClass: 'bg-white/5 border border-white/10',
    dotClass: 'bg-white/5',
  },
] as const;

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
  const [selectedUserPeriod, setSelectedUserPeriod] = useState('1D');
  const [activityPeriod, setActivityPeriod] = useState('1D');
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
  const [hoveredUsersAreaIndex, setHoveredUsersAreaIndex] = useState<number | null>(null);
  const [hoveredUsersAreaPosition, setHoveredUsersAreaPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [hoveredAreaIndex, setHoveredAreaIndex] = useState<number | null>(null);
  const [hoveredAreaPosition, setHoveredAreaPosition] = useState<{ x: number; y: number } | null>(
    null
  );

  // Custom date range states
  const [activeUsersDateFrom, setActiveUsersDateFrom] = useState<Date | undefined>(undefined);
  const [activeUsersDateTo, setActiveUsersDateTo] = useState<Date | undefined>(undefined);
  const [newUsersDateFrom, setNewUsersDateFrom] = useState<Date | undefined>(undefined);
  const [newUsersDateTo, setNewUsersDateTo] = useState<Date | undefined>(undefined);
  const [organizationsDateFrom, setOrganizationsDateFrom] = useState<Date | undefined>(undefined);
  const [organizationsDateTo, setOrganizationsDateTo] = useState<Date | undefined>(undefined);
  const [teamsDateFrom, setTeamsDateFrom] = useState<Date | undefined>(undefined);
  const [teamsDateTo, setTeamsDateTo] = useState<Date | undefined>(undefined);

  // Analytics data and percentages
  const [totalUsersData, setTotalUsersData] = useState<number[]>([]);
  const [totalUsersLabels, setTotalUsersLabels] = useState<string[]>([]);
  const [totalUsersPercentage, setTotalUsersPercentage] = useState(0);
  const [newUsersData, setNewUsersData] = useState<number[]>([]);
  const [newUsersLabels, setNewUsersLabels] = useState<string[]>([]);
  const [activeUsersPercentage, setActiveUsersPercentage] = useState(0);
  const [organizationsPercentage, setOrganizationsPercentage] = useState(0);
  const [teamsPercentage, setTeamsPercentage] = useState(0);
  const [organizationsCount, setOrganizationsCount] = useState(0);
  const [teamsCount, setTeamsCount] = useState(0);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [activitySeries, setActivitySeries] = useState<Record<string, number[]>>({
    signups: [],
    logins: [],
    organizations: [],
    teams: [],
    sessions: [],
  });
  const [activityLabels, setActivityLabels] = useState<string[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Daily percentages for stats bar
  const [usersDailyPercentage, setUsersDailyPercentage] = useState(0);
  const [organizationsDailyPercentage, setOrganizationsDailyPercentage] = useState(0);
  const [sessionsDailyPercentage, setSessionsDailyPercentage] = useState(0);
  const [activityHitsDailyPercentage, setActivityHitsDailyPercentage] = useState(0);
  const [activityHitsDailyTotal, setActivityHitsDailyTotal] = useState(0);

  // Store all users for client-side filtering
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [_newUsersCount, setNewUsersCount] = useState(0);
  const [newUsersCountPercentage, setNewUsersCountPercentage] = useState(0);

  const { counts, loading } = useCounts();
  const navigate = useNavigate();

  const periodOptions = ['Daily', 'Weekly', 'Monthly', 'Yearly', 'Custom'];
  const analyticsPeriodMap: Record<string, string> = {
    Daily: '1D',
    Weekly: '1W',
    Monthly: '1M',
    Yearly: '1Y',
    Custom: 'Custom',
  };

  const compactNumberFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }),
    []
  );

  const formatCompactNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return '...';
    }
    return compactNumberFormatter.format(Number(value));
  };

  const formatFullNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return '...';
    }
    return Number(value).toLocaleString();
  };

  const activityTotals = useMemo(() => {
    return ACTIVITY_STREAMS.reduce<Record<string, number>>((acc, stream) => {
      acc[stream.id] = (activitySeries[stream.id] || []).reduce((sum, value) => sum + value, 0);
      return acc;
    }, {});
  }, [activitySeries]);

  const activityGrandTotal = useMemo(
    () => Object.values(activityTotals).reduce((sum, val) => sum + val, 0),
    [activityTotals]
  );

  const handleActivityHover = (event: MouseEvent<HTMLDivElement>, index: number) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredAreaIndex(index);
    setHoveredAreaPosition({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  // Security insights data - better-auth specific
  const getSecurityPatches = (): SecurityPatch[] => {
    const patches: SecurityPatch[] = [];

    if (betterAuthVersion?.isOutdated) {
      patches.push({
        id: 'version-check',
        title: `Update Better-Auth to v${betterAuthVersion.latest}`,
        severity: 'high',
        date: new Date().toISOString().split('T')[0],
        description: `Your current version is outdated. Update to the latest version to get the latest security fixes, features, and improvements. Run: \`npm install better-auth@latest\``,
        affectedComponents: ['All Components'],
        status: 'pending',
        cve: '',
      });
    } else if (betterAuthVersion) {
      patches.push({
        id: 'version-check',
        title: `Better-Auth is Up to date`,
        severity: 'low',
        date: new Date().toISOString().split('T')[0],
        description: `You are running the latest version of better-auth. Great job keeping your dependencies up to date!`,
        affectedComponents: ['All Components'],
        status: 'applied',
        cve: '',
      });
    }

    // Add other security recommendations
    patches.push(
    //   {
    //   id: '1',
    //   title: 'Session Token Rotation',
    //   severity: 'high',
    //   date: '2024-01-15',
    //   description:
    //     'Ensure session tokens are rotated regularly to prevent session fixation attacks. Better-auth supports automatic token rotation on security-sensitive operations.',
    //   affectedComponents: ['Session Management', 'Auth Core'],
    //   status: 'applied',
    //   cve: '',
    // }
    );

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

  const fetchAnalytics = useCallback(async (type: string, period: string, from?: Date, to?: Date) => {
    try {
      const params = new URLSearchParams({ type, period });
      if (from) params.append('from', from.toISOString());
      if (to) params.append('to', to.toISOString());

      const response = await fetch(`/api/analytics?${params.toString()}`);
      return await response.json();
    } catch (_error) {
      return null;
    }
  }, []);

  // Fetch all users once for client-side filtering
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const response = await fetch('/api/users/all');
        const data = await response.json();
        if (data?.success && data.users) {
          setAllUsers(data.users);
        }
      } catch (_error) {
        setAllUsers([]);
      }
    };
    fetchAllUsers();
  }, []);

  useEffect(() => {
    // Fetch additional stats
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        if (data) {
          setActiveUsersDaily(data.activeUsers || 0);
          setNewUsersDaily(data.totalUsers || 0);
        }
      } catch (_error) {
        // Set to 0 if API fails
        setActiveUsersDaily(0);
        setNewUsersDaily(0);
      }
    };
    fetchStats();
  }, []);

  // Fetch total users chart analytics
  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchAnalytics(
        'users',
        selectedUserPeriod,
        activeUsersDateFrom,
        activeUsersDateTo
      );
      if (data) {
        setTotalUsersData(data.data || []);
        setTotalUsersLabels(data.labels || []);
        setTotalUsersPercentage(data.percentageChange || 0);
      }
    };
    fetchData();
  }, [selectedUserPeriod, activeUsersDateFrom, activeUsersDateTo, fetchAnalytics]);

  // Calculate new users count and percentage from fetched users
  useEffect(() => {
    if (allUsers.length === 0) {
      setNewUsersCount(0);
      setNewUsersCountPercentage(0);
      return;
    }

    const now = new Date();
    let currentPeriodStart: Date;
    let currentPeriodEnd: Date = now;
    let previousPeriodStart: Date;
    let previousPeriodEnd: Date;

    // Determine date ranges based on period
    if (newUsersPeriod === 'Custom') {
      if (!newUsersDateFrom || !newUsersDateTo) {
        setNewUsersCount(0);
        setNewUsersCountPercentage(0);
        return;
      }
      currentPeriodStart = new Date(newUsersDateFrom);
      currentPeriodEnd = new Date(newUsersDateTo);
      currentPeriodEnd.setHours(23, 59, 59, 999);

      // Previous period is the same duration before current period
      const periodDuration = currentPeriodEnd.getTime() - currentPeriodStart.getTime();
      previousPeriodEnd = new Date(currentPeriodStart.getTime() - 1);
      previousPeriodStart = new Date(previousPeriodEnd.getTime() - periodDuration);
    } else {
      // Calculate current period
      switch (newUsersPeriod) {
        case 'Daily':
          currentPeriodStart = new Date(now);
          currentPeriodStart.setHours(0, 0, 0, 0);
          previousPeriodEnd = new Date(currentPeriodStart.getTime() - 1);
          previousPeriodStart = new Date(previousPeriodEnd.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'Weekly':
          currentPeriodStart = new Date(now);
          currentPeriodStart.setDate(now.getDate() - now.getDay());
          currentPeriodStart.setHours(0, 0, 0, 0);
          previousPeriodEnd = new Date(currentPeriodStart.getTime() - 1);
          previousPeriodStart = new Date(previousPeriodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'Monthly':
          currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
          currentPeriodStart.setHours(0, 0, 0, 0);
          previousPeriodEnd = new Date(currentPeriodStart.getTime() - 1);
          previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          previousPeriodStart.setHours(0, 0, 0, 0);
          break;
        case 'Yearly':
          currentPeriodStart = new Date(now.getFullYear(), 0, 1);
          currentPeriodStart.setHours(0, 0, 0, 0);
          previousPeriodEnd = new Date(currentPeriodStart.getTime() - 1);
          previousPeriodStart = new Date(now.getFullYear() - 1, 0, 1);
          previousPeriodStart.setHours(0, 0, 0, 0);
          break;
        default:
          setNewUsersCount(0);
          setNewUsersCountPercentage(0);
          return;
      }
    }

    // Filter users for current period
    const currentPeriodUsers = allUsers.filter((user: any) => {
      if (!user.createdAt) return false;
      const createdAt = new Date(user.createdAt);
      return createdAt >= currentPeriodStart && createdAt <= currentPeriodEnd;
    });

    // Filter users for previous period
    const previousPeriodUsers = allUsers.filter((user: any) => {
      if (!user.createdAt) return false;
      const createdAt = new Date(user.createdAt);
      return createdAt >= previousPeriodStart && createdAt <= previousPeriodEnd;
    });

    const currentCount = currentPeriodUsers.length;
    const previousCount = previousPeriodUsers.length;

    // Calculate percentage change
    let percentageChange = 0;
    if (previousCount > 0) {
      percentageChange = ((currentCount - previousCount) / previousCount) * 100;
    } else if (currentCount > 0) {
      percentageChange = 100; // 100% increase if no previous data
    }

    setNewUsersCount(currentCount);
    setNewUsersCountPercentage(percentageChange);
  }, [allUsers, newUsersPeriod, newUsersDateFrom, newUsersDateTo]);

  // Fetch activity analytics (signups, logins, organizations, teams, sessions)
  useEffect(() => {
    const fetchData = async () => {
      if (activityPeriod === 'Custom' && (!newUsersDateFrom || !newUsersDateTo)) {
        return;
      }
      setActivityLoading(true);
      try {
        const [signups, logins, orgs, teamsMetrics, sessionsMetrics] = await Promise.all([
          fetchAnalytics('newUsers', activityPeriod, newUsersDateFrom, newUsersDateTo),
          fetchAnalytics('activeUsers', activityPeriod, newUsersDateFrom, newUsersDateTo),
          fetchAnalytics('organizations', activityPeriod, newUsersDateFrom, newUsersDateTo),
          fetchAnalytics('teams', activityPeriod, newUsersDateFrom, newUsersDateTo),
          fetchAnalytics('sessions', activityPeriod, newUsersDateFrom, newUsersDateTo),
        ]);

        if (signups) {
          setNewUsersData(signups.data || []);
          setNewUsersLabels(signups.labels || []);
        }

        setActivitySeries({
          signups: signups?.data || [],
          logins: logins?.data || [],
          organizations: orgs?.data || [],
          teams: teamsMetrics?.data || [],
          sessions: sessionsMetrics?.data || [],
        });

        setActivityLabels(
          signups?.labels ||
            logins?.labels ||
            orgs?.labels ||
            teamsMetrics?.labels ||
            sessionsMetrics?.labels ||
            []
        );
      } finally {
        setActivityLoading(false);
      }
    };
    fetchData();
  }, [activityPeriod, newUsersDateFrom, newUsersDateTo, fetchAnalytics]);

  // Fetch active users card analytics
  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchAnalytics('activeUsers', '1D');
      if (data) setActiveUsersPercentage(data.percentageChange || 0);
    };
    fetchData();
  }, [fetchAnalytics]);

  useEffect(() => {
    // if (!loading) {
    //   setOrganizationsCount(counts.organizations || 0);
    //   setTeamsCount(counts.teams || 0);
    // }
  }, [counts.organizations, counts.teams, loading]);

  useEffect(() => {
    const fetchOrganizationMetrics = async () => {
      const mappedPeriod = analyticsPeriodMap[organizationsPeriod] || '1D';
      const isCustom = mappedPeriod === 'Custom';
      if (isCustom && (!organizationsDateFrom || !organizationsDateTo)) {
        return;
      }

      setOrganizationsLoading(true);
      try {
        const data = await fetchAnalytics(
          'organizations',
          mappedPeriod,
          isCustom ? organizationsDateFrom : undefined,
          isCustom ? organizationsDateTo : undefined
        );

        if (data) {
          setOrganizationsCount(data.total || 0);
          setOrganizationsPercentage(data.percentageChange || 0);
        }
      } catch {
        setOrganizationsCount(0);
        setOrganizationsPercentage(0);
      } finally {
        setOrganizationsLoading(false);
      }
    };

    fetchOrganizationMetrics();
  }, [organizationsPeriod, organizationsDateFrom, organizationsDateTo, fetchAnalytics]);

  useEffect(() => {
    const fetchTeamMetrics = async () => {
      const mappedPeriod = analyticsPeriodMap[teamsPeriod] || '1D';
      const isCustom = mappedPeriod === 'Custom';
      if (isCustom && (!teamsDateFrom || !teamsDateTo)) {
        return;
      }

      setTeamsLoading(true);
      try {
        const data = await fetchAnalytics(
          'teams',
          mappedPeriod,
          isCustom ? teamsDateFrom : undefined,
          isCustom ? teamsDateTo : undefined
        );

        if (data) {
          setTeamsCount(data.total || 0);
          setTeamsPercentage(data.percentageChange || 0);
        }
      } catch {
        setTeamsCount(0);
        setTeamsPercentage(0);
      } finally {
        setTeamsLoading(false);
      }
    };

    fetchTeamMetrics();
  }, [teamsPeriod, teamsDateFrom, teamsDateTo, fetchAnalytics]);

  // Fetch daily percentages for stats bar
  useEffect(() => {
    const fetchDailyPercentages = async () => {
      // Fetch Users daily percentage
      const usersData = await fetchAnalytics('users', '1D');
      if (usersData) setUsersDailyPercentage(usersData.percentageChange || 0);

      // Fetch Organizations daily percentage
      const orgsData = await fetchAnalytics('organizations', '1D');
      if (orgsData) setOrganizationsDailyPercentage(orgsData.percentageChange || 0);

      // Fetch Sessions daily percentage (using activeUsers as proxy for sessions)
      const sessionsData = await fetchAnalytics('activeUsers', '1D');
      if (sessionsData) setSessionsDailyPercentage(sessionsData.percentageChange || 0);

      // Fetch Activity Hits daily percentage and total (sum of all activity types)
      const [signupsData, loginsData, orgsDataForActivity, teamsData, sessionsMetricsData] = await Promise.all([
        fetchAnalytics('newUsers', '1D'),
        fetchAnalytics('activeUsers', '1D'),
        fetchAnalytics('organizations', '1D'),
        fetchAnalytics('teams', '1D'),
        fetchAnalytics('sessions', '1D'),
      ]);

      const dailyTotals = [
        signupsData?.total || 0,
        loginsData?.total || 0,
        orgsDataForActivity?.total || 0,
        teamsData?.total || 0,
        sessionsMetricsData?.total || 0,
      ];
      const activityHitsTotal = dailyTotals.reduce((sum, val) => sum + val, 0);
      setActivityHitsDailyTotal(activityHitsTotal);

      // Calculate percentage change by comparing with previous day
      const previousDayTotals = [
        signupsData?.previousTotal || 0,
        loginsData?.previousTotal || 0,
        orgsDataForActivity?.previousTotal || 0,
        teamsData?.previousTotal || 0,
        sessionsMetricsData?.previousTotal || 0,
      ];
      const previousDayTotal = previousDayTotals.reduce((sum, val) => sum + val, 0);

      if (previousDayTotal > 0) {
        const percentageChange = ((activityHitsTotal - previousDayTotal) / previousDayTotal) * 100;
        setActivityHitsDailyPercentage(percentageChange);
      } else if (activityHitsTotal > 0) {
        setActivityHitsDailyPercentage(100);
      } else {
        setActivityHitsDailyPercentage(0);
      }
    };
    fetchDailyPercentages();
  }, [fetchAnalytics]);

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
  const getChartLabels = (period: string, dataSource: 'users' | 'newUsers' = 'users') => {
    const labels = dataSource === 'users' ? totalUsersLabels : newUsersLabels;
    const lengths: Record<string, number> = {
      '1D': 24,
      '1W': 7,
      '1M': 30,
      '3M': 3,
      '6M': 6,
      '1Y': 12,
      ALL: 7,
    };
    const expectedLength = lengths[period] || 7;

    // If we have labels from API, use them (but simplify for x-axis)
    if (labels && labels.length > 0 && labels.length === expectedLength) {
      if (period === '1D') {
        // For 1D, show every 4 hours
        return labels
          .filter((_, i) => i % 4 === 0)
          .map((label) => {
            // Convert hour format to am/pm
            const hour = parseInt(label.replace('h', ''), 10);
            if (hour === 0) return '12am';
            if (hour < 12) return `${hour}am`;
            if (hour === 12) return '12pm';
            return `${hour - 12}pm`;
          });
      }
      if (period === '1W') {
        // For 1W, use day names directly (Mon, Tue, Wed, etc.)
        return labels.map((label) => {
          return label.length > 3 ? label.substring(0, 3) : label;
        });
      }
      if (period === '1M') {
        // For 1M, show day numbers only for x-axis (labels are like "Nov 5")
        return labels.map((label) => {
          const parts = label.split(' ');
          if (parts.length >= 2) {
            return parts[1]; // Just the day number
          }
          return label;
        });
      }
      if (period === '1Y' || period === '3M' || period === '6M') {
        // For months, use short month names (Jan, Feb, Mar, etc.)
        return labels.map((label) => {
          // Labels should already be month names like "Nov", "Dec", etc.
          return label.length > 3 ? label.substring(0, 3) : label;
        });
      }
      // For other periods, use labels directly but shorten them
      return labels.map((label) => {
        if (label.length > 3) return label.substring(0, 3);
        return label;
      });
    }

    // Fallback: generate labels dynamically based on current date
    const now = new Date();
    switch (period) {
      case '1D':
        return ['12am', '4am', '8am', '12pm', '4pm', '8pm'];
      case '1W':
        return Array.from({ length: 7 }, (_, i) => {
          const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
          return date.toLocaleDateString('en-US', { weekday: 'short' });
        });
      case '1M':
        return Array.from({ length: 30 }, (_, i) => {
          const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
          return date.getDate().toString();
        });
      case '3M':
        return Array.from({ length: 3 }, (_, i) => {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - (2 - i), 1);
          return monthDate.toLocaleDateString('en-US', { month: 'short' });
        });
      case '6M':
        return Array.from({ length: 6 }, (_, i) => {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
          return monthDate.toLocaleDateString('en-US', { month: 'short' });
        });
      case '1Y':
        // Last 12 months starting from current month
        return Array.from({ length: 12 }, (_, i) => {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
          return monthDate.toLocaleDateString('en-US', { month: 'short' });
        });
      case 'ALL':
        return Array.from({ length: 7 }, (_, i) => {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - (6 - i), 1);
          return monthDate.toLocaleDateString('en-US', { month: 'short' });
        });
      default:
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    }
  };

  // Generate detailed labels for tooltips
  const getDetailedLabels = (period: string, dataSource: 'users' | 'newUsers' = 'users') => {
    const labels = dataSource === 'users' ? totalUsersLabels : newUsersLabels;
    const lengths: Record<string, number> = {
      '1D': 24,
      '1W': 7,
      '1M': 30,
      '3M': 3,
      '6M': 6,
      '1Y': 12,
      ALL: 7,
    };
    const expectedLength = lengths[period] || 7;

    // If we have labels from API, use them
    if (labels && labels.length > 0 && labels.length === expectedLength) {
      if (period === '1D') {
        // Convert hour format to am/pm for tooltips
        return labels.map((label) => {
          const hour = parseInt(label.replace('h', ''), 10);
          if (hour === 0) return '12am';
          if (hour < 12) return `${hour}am`;
          if (hour === 12) return '12pm';
          return `${hour - 12}pm`;
        });
      }
      if (period === '1Y' || period === '3M' || period === '6M') {
        // For months, convert short names to full names
        return labels.map((label) => {
          const monthNames = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
          ];
          const shortNames = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
          ];
          const index = shortNames.indexOf(label);
          if (index !== -1) return monthNames[index];
          return label;
        });
      }
      return labels;
    }

    // Fallback: generate labels dynamically based on current date
    const now = new Date();
    switch (period) {
      case '1D':
        return Array.from({ length: 24 }, (_, i) => {
          const hour = new Date();
          hour.setHours(i, 0, 0, 0);
          return hour.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
        });
      case '1W':
        return Array.from({ length: 7 }, (_, i) => {
          const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
          return date.toLocaleDateString('en-US', { weekday: 'long' });
        });
      case '1M':
        return Array.from({ length: 30 }, (_, i) => {
          const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
          const monthName = date.toLocaleDateString('en-US', { month: 'short' });
          const dayNum = date.getDate();
          return `${monthName} ${dayNum}`;
        });
      case '3M':
        return Array.from({ length: 3 }, (_, i) => {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - (2 - i), 1);
          return monthDate.toLocaleDateString('en-US', { month: 'long' });
        });
      case '6M':
        return Array.from({ length: 6 }, (_, i) => {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
          return monthDate.toLocaleDateString('en-US', { month: 'long' });
        });
      case '1Y':
        // Last 12 months starting from current month
        return Array.from({ length: 12 }, (_, i) => {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
          return monthDate.toLocaleDateString('en-US', { month: 'long' });
        });
      case 'ALL':
        return Array.from({ length: 7 }, (_, i) => {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - (6 - i), 1);
          return monthDate.toLocaleDateString('en-US', { month: 'long' });
        });
      default:
        return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    }
  };

  // Generate chart data points based on selected period
  const getChartData = (period: string, dataSource: 'users' | 'newUsers' = 'users') => {
    const data = dataSource === 'users' ? totalUsersData : newUsersData;
    const lengths: Record<string, number> = {
      '1D': 24,
      '1W': 7,
      '1M': 30,
      '3M': 3,
      '6M': 6,
      '1Y': 12,
      ALL: 7,
    };
    const expectedLength = lengths[period] || 7;

    // If no data yet, return placeholder
    if (!data || data.length === 0) {
      return Array(expectedLength).fill(0);
    }

    const paddedData = [...data];
    while (paddedData.length < expectedLength) {
      paddedData.push(0);
    }
    const trimmedData = paddedData.slice(0, expectedLength);

    const maxValue = Math.max(...trimmedData, 1);
    return trimmedData.map((val) => (val / maxValue) * 100);
  };

  const renderOverview = () => {
    const resolvedActivityLabels =
      activityLabels.length > 0 ? activityLabels : getChartLabels(activityPeriod, 'users');
    const activityBuckets = resolvedActivityLabels.map((_, index) =>
      ACTIVITY_STREAMS.reduce(
        (sum, stream) => sum + (activitySeries[stream.id]?.[index] ?? 0),
        0
      )
    );
    const maxActivityValue = Math.max(...activityBuckets, 1);

    return (
      <div className="space-y-6 min-h-screen h-full mt-5 flex-1 overflow-y-hidden overflow-x-hidden px-0">
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
      <div className="px-6 overflow-hidden">
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

          <div className="flex items-center gap-3 min-w-fit">
            <div className="w-10 h-10 rounded-none bg-white/5 border border-dashed border-white/10 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm uppercase tracking-wide">Users</span>
              <span className="text-white text-lg font-medium">
                {loading ? '...' : formatCompactNumber(counts.users)}
              </span>
              <div
                className={`flex items-center gap-1 ${usersDailyPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}
              >
                <svg
                  className={`w-3 h-3 ${usersDailyPercentage < 0 ? 'rotate-180' : ''}`}
                  viewBox="0 0 12 12"
                  fill="currentColor"
                >
                  <path d="M6 0 L12 12 L0 12 Z" />
                </svg>
                <span className="text-sm font-medium">
                  {Math.abs(usersDailyPercentage).toFixed(1)}%
                </span>
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
                {loading ? '...' : formatCompactNumber(counts.organizations)}
              </span>
              <div
                className={`flex items-center gap-1 ${organizationsDailyPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}
              >
                <svg
                  className={`w-3 h-3 ${organizationsDailyPercentage < 0 ? 'rotate-180' : ''}`}
                  viewBox="0 0 12 12"
                  fill="currentColor"
                >
                  <path d="M6 0 L12 12 L0 12 Z" />
                </svg>
                <span className="text-sm font-medium">
                  {Math.abs(organizationsDailyPercentage).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-white/10" />

          <div className="flex items-center gap-3 min-w-fit">
            <div className="w-10 h-10 rounded-none bg-white/5 border border-dashed border-white/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm uppercase tracking-wide">Sessions</span>
              <span className="text-white text-lg font-medium">
                {loading ? '...' : formatCompactNumber(counts.sessions)}
              </span>
              <div
                className={`flex items-center gap-1 ${sessionsDailyPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}
              >
                <svg
                  className={`w-3 h-3 ${sessionsDailyPercentage < 0 ? 'rotate-180' : ''}`}
                  viewBox="0 0 12 12"
                  fill="currentColor"
                >
                  <path d="M6 0 L12 12 L0 12 Z" />
                </svg>
                <span className="text-sm font-medium">
                  {Math.abs(sessionsDailyPercentage).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-8 w-[1px] bg-white/10" />

          {/* Activity Hits Stat */}
          <div className="flex items-center gap-3 min-w-fit">
            <div className="w-10 h-10 rounded-none bg-white/5 border border-dashed border-white/10 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm uppercase tracking-wide">Activity Hits</span>
              <span className="text-white text-lg font-medium">
                {loading ? '...' : formatCompactNumber(activityHitsDailyTotal ?? 0)}
              </span>
              <div
                className={`flex items-center gap-1 ${activityHitsDailyPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}
              >
                <svg
                  className={`w-3 h-3 ${activityHitsDailyPercentage < 0 ? 'rotate-180' : ''}`}
                  viewBox="0 0 12 12"
                  fill="currentColor"
                >
                  <path d="M6 0 L12 12 L0 12 Z" />
                </svg>
                <span className="text-sm font-medium">
                  {Math.abs(activityHitsDailyPercentage).toFixed(1)}%
                </span>
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
                {loading ? '...' : formatCompactNumber(newUsersDaily ?? 0)}
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

      <div className="px-6 pb-10 space-y-6">
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
                {['1D', '1W', '6M', '1Y'].map((period) => (
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
            <div className="flex justify-between items-end mb-6">
              <p className="text-4xl text-white font-light">
                {loading ? '...' : formatCompactNumber(counts.users)}
              </p>
              <div className="flex items-center gap-1 px-2 py-1">
                <svg
                  className={`w-3 h-3 ${totalUsersPercentage >= 0 ? 'text-green-500' : 'text-red-500 rotate-180'}`}
                  viewBox="0 0 12 12"
                  fill="currentColor"
                >
                  <path d="M6 0 L12 12 L0 12 Z" />
                </svg>
                <span
                  className={`text-xs font-medium ${totalUsersPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}
                >
                  {Math.abs(totalUsersPercentage).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="space-y-2 relative">
              <div className="h-32 relative">
                <svg
                  className="w-full h-full absolute inset-0"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="usersBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop
                        offset="0%"
                        style={{ stopColor: 'rgba(255, 255, 255, 0.3)', stopOpacity: 1 }}
                      />
                      <stop
                        offset="100%"
                        style={{ stopColor: 'rgba(255, 255, 255, 0.05)', stopOpacity: 1 }}
                      />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="h-32 flex items-end justify-between space-x-1 relative z-10">
                  {getChartData(selectedUserPeriod, 'users').map((height, i) => {
                    const isHovered = hoveredUsersAreaIndex === i;

                    return (
                      <div
                        key={i}
                        className="flex-1 transition-all duration-200 ease-out relative cursor-pointer group"
                        style={{
                          height: `${height}%`,
                          background: 'url(#usersBarGradient)',
                        }}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = rect.left + rect.width / 2;
                          const y = rect.top;
                          // Constrain tooltip within viewport
                          const tooltipWidth = 150; // Approximate tooltip width
                          const tooltipHeight = 60; // Approximate tooltip height
                          const constrainedX = Math.max(
                            tooltipWidth / 2,
                            Math.min(window.innerWidth - tooltipWidth / 2, x)
                          );
                          const constrainedY = Math.max(
                            tooltipHeight + 10,
                            Math.min(window.innerHeight - 10, y)
                          );
                          setHoveredUsersAreaIndex(i);
                          setHoveredUsersAreaPosition({ x: constrainedX, y: constrainedY });
                        }}
                        onMouseLeave={() => {
                          setHoveredUsersAreaIndex(null);
                          setHoveredUsersAreaPosition(null);
                        }}
                      >
                        <div
                          className="w-full h-full"
                          style={{
                            background:
                              'linear-gradient(to bottom, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.05))',
                            opacity: isHovered ? 1 : 0.8,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Tooltip */}
                {hoveredUsersAreaIndex !== null && hoveredUsersAreaPosition && (
                  <div
                    className="fixed z-50 pointer-events-none transition-all duration-200 ease-out animate-in fade-in"
                    style={{
                      left: `${hoveredUsersAreaPosition.x}px`,
                      top: `${hoveredUsersAreaPosition.y}px`,
                      transform: 'translate(-50%, -100%)',
                      maxWidth: 'calc(100vw - 20px)',
                    }}
                  >
                    <div className="bg-black border border-white/20 rounded-sm px-3 py-2 shadow-lg whitespace-nowrap">
                      <div className="text-xs text-gray-400 mb-1 font-mono uppercase">
                        {getDetailedLabels(selectedUserPeriod, 'users')[hoveredUsersAreaIndex]}
                      </div>
                      <div className="text-sm text-white font-sans font-medium">
                        {totalUsersData[hoveredUsersAreaIndex] !== undefined
                          ? totalUsersData[hoveredUsersAreaIndex].toLocaleString()
                          : '0'}{' '}
                        <span className="font-mono text-xs text-gray-400">users</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* X-axis labels */}
              <div
                className={`flex justify-between ${selectedUserPeriod === '1M' ? 'text-[10px]' : 'text-xs'} text-gray-500 font-mono`}
              >
                {getChartLabels(selectedUserPeriod, 'users').map((label, i) => (
                  <span key={i} className="flex-1 text-center truncate">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Activity Hit Card */}
          <div className="bg-white/5 border border-white/10 p-6 relative">
            <div className="absolute top-0 left-0 w-[12px] h-[0.5px] bg-white/30" />
            <div className="absolute top-0 left-0 w-[0.5px] h-[12px] bg-white/30" />
            <div className="absolute top-0 right-0 w-[12px] h-[0.5px] bg-white/30" />
            <div className="absolute top-0 right-0 w-[0.5px] h-[12px] bg-white/30" />
            <div className="absolute bottom-0 left-0 w-[12px] h-[0.5px] bg-white/30" />
            <div className="absolute bottom-0 left-0 w-[0.5px] h-[12px] bg-white/30" />
            <div className="absolute bottom-0 right-0 w-[12px] h-[0.5px] bg-white/30" />
            <div className="absolute bottom-0 right-0 w-[0.5px] h-[12px] bg-white/30" />
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm text-white uppercase font-light">Activity Hits</h3>
                <p className="text-4xl text-white font-light mt-1">
                  {activityLoading ? '...' : formatFullNumber(activityGrandTotal)}
                </p>
                <p className="text-xs text-gray-400">Tracked events in selected period</p>
              </div>
              <div className="flex items-center space-x-1 overflow-x-auto">
                {['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setActivityPeriod(period)}
                    className={`px-2 py-1 text-xs font-light transition-colors whitespace-nowrap ${activityPeriod === period ? 'bg-white/20 text-white border border-white/30' : 'text-gray-500 hover:text-white'
                      }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2 relative">
              <div className="h-40 flex items-end gap-1">
                {resolvedActivityLabels.map((label, index) => {
                  const bucketTotal = activityBuckets[index] || 0;
                  return (
                    <div
                      key={`${label}-${index}`}
                      className="flex-1 flex flex-col justify-end gap-[1px] h-full cursor-pointer"
                      onMouseEnter={(event) => handleActivityHover(event, index)}
                      onMouseLeave={() => {
                        setHoveredAreaIndex(null);
                        setHoveredAreaPosition(null);
                      }}
                    >
                      {ACTIVITY_STREAMS.map((stream) => {
                        const value = activitySeries[stream.id]?.[index] ?? 0;
                        const heightPercent =
                          bucketTotal === 0 || maxActivityValue === 0
                            ? 0
                            : Math.max((value / maxActivityValue) * 100, value > 0 ? 4 : 0);
                        return (
                          <div
                            key={`${stream.id}-${index}`}
                            className={`w-full ${stream.barClass}`}
                            style={{ height: `${heightPercent}%` }}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
              {activityLoading && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center text-xs uppercase text-gray-400 pointer-events-none">
                  Loading activity...
                </div>
              )}
              {hoveredAreaIndex !== null && hoveredAreaPosition && (
                <div
                  className="fixed z-50 pointer-events-none transition-all duration-200 ease-out animate-in fade-in"
                  style={{
                    left: `${hoveredAreaPosition.x}px`,
                    top: `${hoveredAreaPosition.y}px`,
                    transform: 'translate(-50%, -100%)',
                    maxWidth: 'calc(100vw - 20px)',
                  }}
                >
                  <div className="bg-black border border-white/20 rounded-sm px-3 py-2 shadow-lg min-w-[180px]">
                    <div className="text-xs text-gray-400 mb-2 font-mono uppercase">
                      {resolvedActivityLabels[hoveredAreaIndex] || `Bucket ${hoveredAreaIndex + 1}`}
                    </div>
                    <div className="space-y-1">
                      {ACTIVITY_STREAMS.map((stream) => (
                        <div key={stream.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-gray-300">
                            <span className={`w-2 h-2 rounded-sm ${stream.dotClass}`} />
                            {stream.label}
                          </div>
                          <span className="text-white font-medium">
                            {activitySeries[stream.id]?.[hoveredAreaIndex] ?? 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div
                className={`flex justify-between ${activityPeriod === '1M' ? 'text-[10px]' : 'text-xs'} text-gray-500 font-mono`}
              >
                {resolvedActivityLabels.map((label, i) => (
                  <span key={i} className="flex-1 text-center truncate">
                    {label}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-4 pt-4 border-t border-white/10">
                {ACTIVITY_STREAMS.map((stream) => (
                  <div key={stream.id} className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-sm ${stream.dotClass}`} />
                      {stream.label}
                    </div>
                    <span className="text-white font-medium">
                      {activityLoading ? '...' : formatFullNumber(activityTotals[stream.id] || 0)}
                    </span>
                  </div>
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
              <div className="flex items-center justify-between mb-2 relative -mt-2 pb-1">
                <div className="relative">
                  <button
                    onClick={() => setShowActiveUsersDropdown(!showActiveUsersDropdown)}
                    className="text-xs h-full font-mono uppercase text-gray-400 flex items-center space-x-1 hover:text-white transition-colors"
                  >
                    <ChevronDown className="w-3 h-3" />
                    <span>{activeUsersPeriod}</span>
                  </button>
                  {showActiveUsersDropdown && (
                    <div className="absolute top-6 left-0 w-[150px]  z-10 bg-black border border-white/10 rounded-none shadow-lg">
                      {periodOptions.map((period) => (
                        <button
                          key={period}
                          onClick={() => {
                            setActiveUsersPeriod(period);
                            setShowActiveUsersDropdown(false);
                          }}
                          className="block border-b border-dashed border-white/5 w-full text-left px-4 py-2 text-xs text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {activeUsersPeriod === 'Custom' && (
                  <div className="h-0 flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-6 px-2 text-xs font-mono uppercase text-gray-400 hover:text-white bg-transparent border-white/10 hover:bg-white/5"
                        >
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {activeUsersDateFrom
                            ? format(activeUsersDateFrom, 'MMM dd yyyy')
                            : 'From'}
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
                          {activeUsersDateTo ? format(activeUsersDateTo, 'MMM dd yyyy') : 'To'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-black border-white/10">
                        <Calendar
                          mode="single"
                          selected={activeUsersDateTo}
                          onSelect={setActiveUsersDateTo}
                          initialFocus
                          disabled={(date) =>
                            activeUsersDateFrom ? date < activeUsersDateFrom : false
                          }
                          className="rounded-none"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
              <hr className="mb-2 -mx-10 border-white/10" />
              <h4 className="text-md text-white/80 uppercase font-mono font-light mb-1">
                Active Users
              </h4>
              <p className="text-xs text-gray-400 mb-3">
                Users with active session in the time frame
              </p>
              <div className="flex pt-4 justify-between items-end">
                <p className="text-3xl text-white font-light">
                  {formatFullNumber(activeUsersDaily)}
                </p>
                <div className="mt-2 mb-1 flex items-center gap-2">
                  <div className="flex items-center -mr-5 gap-1 px-2 py-1 border-white/5 rounded-none">
                    <svg
                      className={`w-3 h-3 ${activeUsersPercentage >= 0 ? 'text-green-500' : 'text-red-500 rotate-180'}`}
                      viewBox="0 0 12 12"
                      fill="currentColor"
                    >
                      <path d="M6 0 L12 12 L0 12 Z" />
                    </svg>
                    <span
                      className={`text-xs font-medium ${activeUsersPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}
                    >
                      {Math.abs(activeUsersPercentage).toFixed(1)}%
                    </span>
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
              <div className="flex items-center justify-between mb-2 relative -mt-2 pb-1">
                <div className="relative">
                  <button
                    onClick={() => setShowNewUsersDropdown(!showNewUsersDropdown)}
                    className="text-xs h-full font-mono uppercase text-gray-400 flex items-center space-x-1 hover:text-white transition-colors"
                  >
                    <ChevronDown className="w-3 h-3" />
                    <span>{newUsersPeriod}</span>
                  </button>
                  {showNewUsersDropdown && (
                    <div className="absolute top-6 left-0 w-[150px]  z-10 bg-black border border-white/10 rounded-none shadow-lg">
                      {periodOptions.map((period) => (
                        <button
                          key={period}
                          onClick={() => {
                            setNewUsersPeriod(period);
                            setShowNewUsersDropdown(false);
                          }}
                          className="block border-b border-dashed border-white/5 w-full text-left px-4 py-2 text-xs text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {newUsersPeriod === 'Custom' && (
                  <div className="h-0 flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-6 px-2 text-xs font-mono uppercase text-gray-400 hover:text-white bg-transparent border-white/10 hover:bg-white/5"
                        >
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {newUsersDateFrom ? format(newUsersDateFrom, 'MMM dd yyyy') : 'From'}
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
                          {newUsersDateTo ? format(newUsersDateTo, 'MMM dd yyyy') : 'To'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-black border-white/10">
                        <Calendar
                          mode="single"
                          selected={newUsersDateTo}
                          onSelect={setNewUsersDateTo}
                          initialFocus
                          disabled={(date) => (newUsersDateFrom ? date < newUsersDateFrom : false)}
                          className="rounded-none"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
              <hr className="mb-2 -mx-10 border-white/10" />
              <h4 className="text-md text-white/80 uppercase font-mono font-light mb-1">
                New Users
              </h4>
              <p className="text-xs text-gray-400 mb-3">Newly registered Users in the time frame</p>
              <div className="flex pt-4 justify-between items-end">
                <p className="text-3xl text-white font-light">
                  {formatFullNumber(_newUsersCount)}
                </p>
                <div className="mt-2 mb-1 flex items-center gap-2">
                  <div className="flex items-center -mr-5 gap-1 px-2 py-1 rounded-none">
                    <svg
                      className={`w-3 h-3 ${newUsersCountPercentage >= 0 ? 'text-green-500' : 'text-red-500 rotate-180'}`}
                      viewBox="0 0 12 12"
                      fill="currentColor"
                      style={newUsersCountPercentage < 0 ? { transform: 'rotate(180deg)' } : {}}
                    >
                      <path d="M6 0 L12 12 L0 12 Z" />
                    </svg>
                    <span
                      className={`text-xs font-medium ${newUsersCountPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}
                    >
                      {Math.abs(newUsersCountPercentage).toFixed(1)}%
                    </span>
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
              <div className="flex items-center justify-between mb-2 relative -mt-2 pb-1">
                <div className="relative">
                  <button
                    onClick={() => setShowOrganizationsDropdown(!showOrganizationsDropdown)}
                    className="text-xs h-full font-mono uppercase text-gray-400 flex items-center space-x-1 hover:text-white transition-colors"
                  >
                    <ChevronDown className="w-3 h-3" />
                    <span>{organizationsPeriod}</span>
                  </button>
                  {showOrganizationsDropdown && (
                    <div className="absolute top-6 left-0 w-[150px]  z-10 bg-black border border-white/10 rounded-none shadow-lg">
                      {periodOptions.map((period) => (
                        <button
                          key={period}
                          onClick={() => {
                            setOrganizationsPeriod(period);
                            setShowOrganizationsDropdown(false);
                          }}
                          className="block border-b border-dashed border-white/5 w-full text-left px-4 py-2 text-xs text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {organizationsPeriod === 'Custom' && (
                  <div className="h-0 flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-6 px-2 text-xs font-mono uppercase text-gray-400 hover:text-white bg-transparent border-white/10 hover:bg-white/5"
                        >
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {organizationsDateFrom
                            ? format(organizationsDateFrom, 'MMM dd yyyy')
                            : 'From'}
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
                          {organizationsDateTo ? format(organizationsDateTo, 'MMM dd yyyy') : 'To'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-black border-white/10">
                        <Calendar
                          mode="single"
                          selected={organizationsDateTo}
                          onSelect={setOrganizationsDateTo}
                          initialFocus
                          disabled={(date) =>
                            organizationsDateFrom ? date < organizationsDateFrom : false
                          }
                          className="rounded-none"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
              <hr className="mb-2 -mx-10 border-white/10" />
              <h4 className="text-md text-white/80 uppercase font-mono font-light mb-1">
                Organizations
              </h4>
              <p className="text-xs text-gray-400 mb-3">Total organizations in the time frame</p>
              <div className="flex pt-4 justify-between items-end">
                <p className="text-3xl text-white font-light">
                  {organizationsLoading ? '...' : formatFullNumber(organizationsCount)}
                </p>
                <div className="mt-2 mb-1 flex items-center gap-2">
                  <div className="flex items-center -mr-5 gap-1 px-2 py-1 rounded-none">
                    <svg
                      className={`w-3 h-3 ${organizationsPercentage >= 0 ? 'text-green-500' : 'text-red-500 rotate-180'}`}
                      viewBox="0 0 12 12"
                      fill="currentColor"
                    >
                      <path d="M6 0 L12 12 L0 12 Z" />
                    </svg>
                    <span
                      className={`text-xs font-medium ${organizationsPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}
                    >
                      {Math.abs(organizationsPercentage).toFixed(1)}%
                    </span>
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
              <div className="flex items-center justify-between mb-2 relative -mt-2 pb-1">
                <div className="relative">
                  <button
                    onClick={() => setShowTeamsDropdown(!showTeamsDropdown)}
                    className="text-xs h-full font-mono uppercase text-gray-400 flex items-center space-x-1 hover:text-white transition-colors"
                  >
                    <ChevronDown className="w-3 h-3" />
                    <span>{teamsPeriod}</span>
                  </button>
                  {showTeamsDropdown && (
                    <div className="absolute top-6 left-0 w-[150px]  z-10 bg-black border border-white/10 rounded-none shadow-lg">
                      {periodOptions.map((period) => (
                        <button
                          key={period}
                          onClick={() => {
                            setTeamsPeriod(period);
                            setShowTeamsDropdown(false);
                          }}
                          className="block border-b border-dashed border-white/5 w-full text-left px-4 py-2 text-xs text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {teamsPeriod === 'Custom' && (
                  <div className="h-0 flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-6 px-2 text-xs font-mono uppercase text-gray-400 hover:text-white bg-transparent border-white/10 hover:bg-white/5"
                        >
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {teamsDateFrom ? format(teamsDateFrom, 'MMM dd yyyy') : 'From'}
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
                          {teamsDateTo ? format(teamsDateTo, 'MMM dd yyyy') : 'To'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-black border-white/10">
                        <Calendar
                          mode="single"
                          selected={teamsDateTo}
                          onSelect={setTeamsDateTo}
                          initialFocus
                          disabled={(date) => (teamsDateFrom ? date < teamsDateFrom : false)}
                          className="rounded-none"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
              <hr className="mb-2 -mx-10 border-white/10" />
              <h4 className="text-md text-white/80 uppercase font-mono font-light mb-1">Teams</h4>
              <p className="text-xs text-gray-400 mb-3">Total teams in the time frame</p>
              <div className="flex pt-4 justify-between items-end">
                <p className="text-3xl text-white font-light">
                  {teamsLoading ? '...' : formatFullNumber(teamsCount)}
                </p>
                <div className="mt-2 mb-1 flex items-center gap-2">
                  <div className="flex items-center -mr-5 gap-1 px-2 py-1 rounded-none">
                    <svg
                      className={`w-3 h-3 ${teamsPercentage >= 0 ? 'text-green-500' : 'text-red-500 rotate-180'}`}
                      viewBox="0 0 12 12"
                      fill="currentColor"
                    >
                      <path d="M6 0 L12 12 L0 12 Z" />
                    </svg>
                    <span
                      className={`text-xs font-medium ${teamsPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}
                    >
                      {Math.abs(teamsPercentage).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Security Insights */}
          <div className="bg-white/5 border border-white/10 p-6 pt-4 overflow-hidden relative rounded-none flex flex-col">
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
                <Shield className="w-4 h-4 text-white/60" />
                <h4 className="text-xs text-gray-400 uppercase font-mono font-light">
                  Security Insights
                </h4>
              </div>
            </div>
            <hr className="-mx-10 -mt-1 border-white/10" />
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
                        <span className="text-sm text-white/90 font-light truncate group-hover:text-white transition-colors">
                          {patch.title}
                        </span>
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
  };

  return (
    <div
      className="h-screen bg-black text-white overflow-hidden flex flex-col"
      style={{ overflowX: 'hidden' }}
    >
      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
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
      </div>

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
                {selectedPatch.description.includes('npm install') ? (
                  <div>
                    <p className="text-white leading-relaxed mb-3">
                      {selectedPatch.description.split('Run:')[0]}
                    </p>
                    <div className="relative group">
                      <div className="bg-black border border-white/20 rounded-none p-3 font-mono text-sm">
                        <div className="flex items-center justify-between">
                          <code>
                            <span className="text-green-400">$</span>{' '}
                            <span className="text-cyan-400">npm</span>{' '}
                            <span className="text-yellow-400">install</span>{' '}
                            <span className="text-white">better-auth@latest</span>
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText('npm install better-auth@latest');
                              toast.success('Command copied to clipboard');
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
                            title="Copy command"
                          >
                            <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-white leading-relaxed">{selectedPatch.description}</p>
                )}
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
                          This patch is pending review and requires manual approval before
                          deployment.
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
