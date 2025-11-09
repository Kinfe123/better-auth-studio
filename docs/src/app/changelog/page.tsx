import PixelLayout from "@/components/PixelLayout";
import PixelCard from "@/components/PixelCard";

export default function Changelog() {
  return (
    <PixelLayout
      currentPage="changelog"
      title="CHANGLOG"
      description="Track the Better Auth Studio development with detailed release notes and updates."
    >
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-light tracking-tight mb-6 text-white">LATEST RELEASE</h2>
          <PixelCard variant="highlight">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-light tracking-tight text-white">v1.0.30</h3>
              <span className="text-sm font-light tracking-tight text-white/50">2025-11-08</span>
            </div>
            <p className="text-sm font-light tracking-tight text-white/70 mb-4">
              Massive studio refresh featuring a rebuilt analytics dashboard, refined black & white interface, and an all-new Tools command center with guided OAuth diagnostics, migration helpers, and database connectivity checks.
            </p>
            <div className="space-y-3">
              <h4 className="font-light tracking-tight text-white">✨ New Features</h4>
              <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                <li className="flex items-start">
                  <span className="text-white/50 mr-3">•</span>
                  <strong className="pr-2">Dashboard 2.0</strong> with configurable period chips, and live organization / team metrics synced to backend endpoints
                </li>
                <li className="flex items-start">
                  <span className="text-white/50 mr-3">•</span>
                  <strong className="pr-2">Tools Workspace</strong> with housing Test OAuth, Run Migration, and Test Database actions.
                </li>
                <li className="flex items-start">
                  <span className="text-white/50 mr-3">•</span>
                  Migration Blueprint for Clerk plus placeholders for Supabase, Auth0, and NextAuth with copy-ready scripts and custom playground
                </li>
                <li className="flex items-start">
                  <span className="text-white/50 mr-3">•</span>
                  <strong className="pr-2">Database Smoke Tests</strong> leveraging adapter introspection to preview sample records and confirm connectivity
                </li>
                <li className="flex items-start">
                  <span className="text-white/50 mr-3">•</span>
                  <strong className="pr-2">Geist Typography</strong> applied to OAuth bootstraps and modals for a cohesive type system across browser surfaces
                </li>
              </ul>
            </div>
          </PixelCard>
        </section>

        <section>
          <h2 className="text-2xl font-light tracking-tight mb-6 text-white">RECENT UPDATES</h2>

          <PixelCard className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-light tracking-tight text-white">Dashboard Overhaul & Tool Suite</h3>
              <span className="text-sm font-light tracking-tight text-white/50">2025-11-08</span>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-light tracking-tight mb-2 text-white">📊 Dashboard Enhancements</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Period controls wired to analytics endpoints for organizations, teams, and subscriptions with custom range support
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Refined stat cards with live percentages, hover tooltips, and constraint-aware chart tooltips
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Consistent Geist typography and black/white styling applied across modals, filters, and cards
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-light tracking-tight mb-2 text-white">🧰 Tools Command Center</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Test OAuth flow with provider selection modal, Better Auth state validation, popup orchestration, and account polling
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Run Migration dialog featuring Clerk blueprint, syntax-highlighted custom editor, and Coming Soon placeholders
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Test Database connectivity via `/api/database/test` with inline sample row preview and concise terminal logs
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Coming Soon badges applied to unfinished utilities while keeping OAuth and database tools interactive
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-light tracking-tight mb-2 text-white">🧼 Polish & Cleanup</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Seed dialogs aligned between Users and Organizations with bracketed headers and dashed dividers
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Removed stale console comments and deprecated navigation blocks across frontend and routes
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    OAuth bootstrap pages updated to Geist Sans/Mono with improved typography and status wording
                  </li>
                </ul>
              </div>
            </div>
          </PixelCard>

          <PixelCard className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-light tracking-tight text-white">Shadcn UI Integration & Admin Functionality</h3>
              <span className="text-sm font-light tracking-tight text-white/50">2025-01-09</span>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-light tracking-tight mb-2 text-white">🎨 Shadcn UI Components</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Calendar component with react-day-picker v9 integration and dual-month view
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    DateRangePicker component for advanced date filtering with auto-close functionality
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Popover component with proper positioning and accessibility features
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Pure black and white theme with CSS variables and consistent styling
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-light tracking-tight mb-2 text-white">🛡️ Admin Functionality</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Comprehensive user banning/unbanning system with admin plugin detection
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Ban reason and expiration date support for temporary and permanent bans
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Visual ban indicators with warning banners and status badges
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    API endpoints for ban-user, unban-user, and admin status checking
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-light tracking-tight mb-2 text-white">🔍 Advanced Filtering</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Dynamic filter system with Email Verified, Banned Status, Created Date, and Role filters
                  </li>
                </ul>
              </div>
            </div>
          </PixelCard>

          <PixelCard className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-light tracking-tight text-white">Advanced Session Management</h3>
              <span className="text-sm font-light tracking-tight text-white/50">2025-01-28</span>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-light tracking-tight mb-2 text-white">🔐 Session Seeding</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    User-specific session seeding with customizable count (1-50 sessions)
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-light tracking-tight mb-2 text-white">📊 Session Display</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Session ID, status, IP address, and expiration date display
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Individual session revocation functionality
                  </li>
                </ul>
              </div>
            </div>
          </PixelCard>

          <PixelCard className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-light tracking-tight text-white">Database Schema Visualizer</h3>
              <span className="text-sm font-light tracking-tight text-white/50">2025-01-30</span>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-light tracking-tight mb-2 text-white">🗄️ Interactive Schema Visualization</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    ReactFlow-powered interactive database schema diagrams
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Drag-and-drop table positioning with zoom and pan controls
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Mini-map navigation for large schema overviews
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-light tracking-tight mb-2 text-white">🔌 Plugin-Based Configuration</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Dynamic plugin selection (Organization, Teams, Two Factor, API Key, Passkey)
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Schema statistics showing table count, relationships, and active plugins
                  </li>
                </ul>
              </div>
            </div>
          </PixelCard>

          <PixelCard className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-light tracking-tight text-white">IP Geolocation & MaxMind Integration</h3>
              <span className="text-sm font-light tracking-tight text-white/50">2025-01-28</span>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-light tracking-tight mb-2 text-white">🌍 Geolocation Resolution</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    MaxMind GeoLite2-City database integration for accurate IP geolocation
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Fallback to comprehensive default IP database covering 12 countries
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Country flag emoji display next to location information
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Real-time IP resolution with city, country, and region data
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-light tracking-tight mb-2 text-white">⚙️ CLI Integration</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    --geo-db CLI option for custom MaxMind database path
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Default MMDB file included in package distribution
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Backend API endpoint for IP geolocation resolution
                  </li>
                </ul>
              </div>
            </div>
          </PixelCard>

          <PixelCard className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-light tracking-tight text-white">Biome Integration & CI/CD</h3>
              <span className="text-sm font-light tracking-tight text-white/50">2025-01-28</span>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-light tracking-tight mb-2 text-white">🔧 Modern Tooling</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Biome integration for fast linting and formatting
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Comprehensive linting rules with appropriate warning levels
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Automatic code formatting with consistent style
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    TypeScript and JavaScript support with modern configurations
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-light tracking-tight mb-2 text-white">🚀 CI/CD Pipeline</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    GitHub Actions workflow for automated testing and building
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    pnpm package manager integration for consistent dependency management
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Automated security auditing and vulnerability scanning
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Build artifact verification and deployment readiness checks
                  </li>
                </ul>
              </div>
            </div>
          </PixelCard>
          <PixelCard className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-light tracking-tight text-white">CSV Export Feature</h3>
              <span className="text-sm font-light tracking-tight text-white/50">2025-01-27</span>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-light tracking-tight mb-2 text-white">📊 Data Export</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Added CSV export functionality for Users page with ID, name, email, verification status, and timestamps
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Added CSV export functionality for Organizations page with ID, name, slug, and timestamps
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Automatic timestamped filename generation (e.g., users-export-2025-01-27.csv)
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Proper CSV formatting with quoted fields and UTF-8 encoding for compatibility
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-light tracking-tight mb-2 text-white">🎯 User Experience</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Export buttons positioned next to "Add User" and "Add Organization" buttons
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Success toast notifications showing number of records exported
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Error handling for empty datasets with appropriate user feedback
                  </li>
                </ul>
              </div>
            </div>
          </PixelCard>

          <PixelCard className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-light tracking-tight text-white">API Improvements</h3>
              <span className="text-sm font-light tracking-tight text-white/50">2025-01-26</span>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-light tracking-tight mb-2 text-white">🔧 Fixed Issues</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Resolved "organization not found" errors with improved API response consistency
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Fixed "team not found" errors with better routing structure
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Improved database query performance with targeted WHERE clauses
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-light tracking-tight mb-2 text-white">⚡ Performance</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Optimized database queries to use limits instead of fetching all records
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Enhanced frontend routing for better organization structure
                  </li>
                </ul>
              </div>
            </div>
          </PixelCard>

          {/* UI/UX Enhancements */}
          <PixelCard className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-light tracking-tight text-white">UI/UX Enhancements</h3>
              <span className="text-sm font-light tracking-tight text-white/50">2025-01-25</span>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-light tracking-tight mb-2 text-white">🎨 Design System</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Unified black and white color scheme across all pages
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Integrated Geist Mono font for consistent typography
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-light tracking-tight mb-2 text-white">📱 Responsive Design</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Mobile-first responsive navigation system
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Optimized layouts for all screen sizes
                  </li>
                </ul>
              </div>
            </div>
          </PixelCard>

          {/* Documentation Updates */}
          <PixelCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-light tracking-tight text-white">Documentation</h3>
              <span className="text-sm font-light tracking-tight text-white/50">2025-01-24</span>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-light tracking-tight mb-2 text-white">📚 Content</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Complete README.md integration for installation guide
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Added comprehensive changelog with version tracking
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Enhanced code examples with syntax highlighting
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-light tracking-tight mb-2 text-white">🛠️ Developer Experience</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Added TypeScript syntax highlighting for code blocks
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Improved code readability with proper formatting
                  </li>
                </ul>
              </div>
            </div>
          </PixelCard>
        </section>

        {/* Upcoming Features */}
        <section>
          <h2 className="text-2xl font-light tracking-tight mb-6 text-white">UPCOMING FEATURES</h2>
          <PixelCard variant="highlight">
            <h3 className="text-lg font-light tracking-tight mb-4 text-white">🚀 Roadmap</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-light tracking-tight mb-2 text-white">v1.1.0 - Enhanced Analytics</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    User activity dashboards with real-time metrics
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Session analytics and usage patterns
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Advanced export formats (JSON, Excel) and filtering options
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-light tracking-tight mb-2 text-white">v1.2.0 - Advanced Security</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Role-based access control (RBAC) management
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Security audit logs and monitoring
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Two-factor authentication management
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-light tracking-tight mb-2 text-white">v2.0.0 - Plugin System</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Extensible plugin architecture
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Custom dashboard widgets
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Third-party integrations marketplace
                  </li>
                </ul>
              </div>
            </div>
          </PixelCard>
        </section>

        {/* Version History */}
        <section>
          <h2 className="text-2xl font-light tracking-tight mb-6 text-white">VERSION HISTORY</h2>
          <div className="space-y-4">
            <PixelCard>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-light tracking-tight text-white">v1.0.30</h3>
                <span className="text-sm font-light tracking-tight text-white/50">2025-11-08</span>
              </div>
              <p className="text-sm font-light tracking-tight text-white/70">
                Released the refreshed analytics dashboard, Tools workspace with OAuth testing/migration/database utilities, Geist typography polish, and widespread UI clean-up.
              </p>
            </PixelCard>

            <PixelCard>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-light tracking-tight text-white">v1.0.26</h3>
                <span className="text-sm font-light tracking-tight text-white/50">2025-01-09</span>
              </div>
              <p className="text-sm font-light tracking-tight text-white/70">
                Major release with Shadcn UI components, admin functionality for user banning/unbanning, advanced filtering system with date range picker, and pure black & white theme overhaul.
              </p>
            </PixelCard>

            <PixelCard>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-light tracking-tight text-white">v1.0.23</h3>
                <span className="text-sm font-light tracking-tight text-white/50">2025-01-30</span>
              </div>
              <p className="text-sm font-light tracking-tight text-white/70">
                Release with Database Schema Visualizer - an interactive ReactFlow-powered tool for visualizing Better Auth database schemas with plugin-based configuration.
              </p>
            </PixelCard>

            <PixelCard>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-light tracking-tight text-white">v1.0.22</h3>
                <span className="text-sm font-light tracking-tight text-white/50">2025-01-29</span>
              </div>
              <p className="text-sm font-light tracking-tight text-white/70">
                Release with enhanced session management and improved user interface components.
              </p>
            </PixelCard>

            <PixelCard>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-light tracking-tight text-white">v1.0.21</h3>
                <span className="text-sm font-light tracking-tight text-white/50">2025-01-28</span>
              </div>
              <p className="text-sm font-light tracking-tight text-white/70">
                Major beta release with advanced session management, IP geolocation, Biome integration, and comprehensive CI/CD pipeline.
              </p>
            </PixelCard>

            <PixelCard>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-light tracking-tight text-white">v1.0.20-beta.5</h3>
                <span className="text-sm font-light tracking-tight text-white/50">2025-01-27</span>
              </div>
              <p className="text-sm font-light tracking-tight text-white/70">
                Beta release with CSV export functionality and enhanced user management interface.
              </p>
            </PixelCard>

            <PixelCard>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-light tracking-tight text-white">v1.0.16</h3>
                <span className="text-sm font-light tracking-tight text-white/50">2025-01-27</span>
              </div>
              <p className="text-sm font-light tracking-tight text-white/70">
                Added CSV export functionality and enhanced user management interface with pixel-perfect design.
              </p>
            </PixelCard>

            <PixelCard>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-light tracking-tight text-white">v1.0.15</h3>
                <span className="text-sm font-light tracking-tight text-white/50">2025-01-25</span>
              </div>
              <p className="text-sm font-light tracking-tight text-white/70">
                Enhanced user interface with improved navigation and performance optimizations.
              </p>
            </PixelCard>

            <PixelCard>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-light tracking-tight text-white">v1.0.14</h3>
                <span className="text-sm font-light tracking-tight text-white/50">2025-01-20</span>
              </div>
              <p className="text-sm font-light tracking-tight text-white/70">
                Added comprehensive session management and organization features.
              </p>
            </PixelCard>

            <PixelCard>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-light tracking-tight text-white">v1.0.13</h3>
                <span className="text-sm font-light tracking-tight text-white/50">2025-01-15</span>
              </div>
              <p className="text-sm font-light tracking-tight text-white/70">
                Initial stable release with core authentication management capabilities.
              </p>
            </PixelCard>
          </div>
        </section>

        {/* Contributing */}
        <section>
          <h2 className="text-2xl font-light tracking-tight mb-6 text-white">CONTRIBUTING</h2>
          <PixelCard>
            <p className="text-sm font-light tracking-tight text-white/70 mb-4">
              Better Auth Studio is open source and welcomes contributions from the community.
            </p>
            <div className="space-y-3">
              <div className="flex items-center text-sm font-light tracking-tight text-white/70">
                <span className="text-white/50 mr-3">→</span>
                Report bugs and request features on GitHub Issues
              </div>
              <div className="flex items-center text-sm font-light tracking-tight text-white/70">
                <span className="text-white/50 mr-3">→</span>
                Submit pull requests for bug fixes and enhancements
              </div>
              <div className="flex items-center text-sm font-light tracking-tight text-white/70">
                <span className="text-white/50 mr-3">→</span>
                Help improve documentation and examples
              </div>
              <div className="flex items-center text-sm font-light tracking-tight text-white/70">
                <span className="text-white/50 mr-3">→</span>
                Share feedback and suggestions with the community
              </div>
            </div>
          </PixelCard>
        </section>
      </div>
    </PixelLayout>
  );
}
