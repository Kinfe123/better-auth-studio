import PixelLayout from "@/components/PixelLayout";
import PixelCard from "@/components/PixelCard";


const ZapIcon = () => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 mr-2 text-white/70">
    <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="currentColor" />
  </svg>
);

const MailIcon = () => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 mr-2 text-white/70">
    <path d="M22 6v12H2V6h20zm-2 2H4v8h16V8zm-2 2v2H6v-2h12z" fill="currentColor" />
  </svg>
);

const DatabaseIcon = () => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 mr-2 text-white/70">
    <path d="M6 2h12v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2H6v-2H4v-2h2v-2H4v-2h2v-2H4V8h2V6H4V4h2V2zm2 2v2h8V4H8zm8 4H8v2h8V8zm-8 4v2h8v-2H8zm0 4v2h8v-2H8z" fill="currentColor" />
  </svg>
);

const ShieldIcon = () => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 mr-2 text-white/70">
    <path d="M12 2l-8 3v7c0 5 3.5 9.2 8 10 4.5-.8 8-5 8-10V5l-8-3zm0 2.2L18 6v5c0 3.8-2.6 7.2-6 7.9-3.4-.7-6-4.1-6-7.9V6l6-1.8z" fill="currentColor" />
  </svg>
);

const AnalyticsIcon = () => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 mr-2 text-white/70">
    <path d="M3 3h2v18H3V3zm6 6h2v12H9V9zm6-4h2v16h-2V5zm6 8h2v8h-2v-8z" fill="currentColor" />
  </svg>
);

const CommandIcon = () => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 mr-2 text-white/70">
    <path d="M6 2h4v4H6V2zm0 6h4v4H6V8zm0 6h4v4H6v-4zm0 6h4v4H6v-4zm8-18h4v4h-4V2zm0 6h4v4h-4V8zm0 6h4v4h-4v-4zm0 6h4v4h-4v-4z" fill="currentColor" />
  </svg>
);

const LayoutIcon = () => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 mr-2 text-white/70">
    <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v4H7V7zm0 6h4v4H7v-4zm6 0h4v4h-4v-4z" fill="currentColor" />
  </svg>
);

const SearchIcon = () => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 mr-2 text-white/70">
    <path d="M10 2a8 8 0 015.3 14l5.4 5.3-1.4 1.4-5.3-5.4A8 8 0 1110 2zm0 2a6 6 0 100 12 6 6 0 000-12z" fill="currentColor" />
  </svg>
);

const GlobeIcon = () => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 mr-2 text-white/70">
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 2c1.8 0 3.4.6 4.7 1.6l-1.4 1.4c-1-.6-2.1-1-3.3-1s-2.3.4-3.3 1L7.3 5.6C8.6 4.6 10.2 4 12 4zm0 16c-1.8 0-3.4-.6-4.7-1.6l1.4-1.4c1 .6 2.1 1 3.3 1s2.3-.4 3.3-1l1.4 1.4c-1.3 1-2.9 1.6-4.7 1.6z" fill="currentColor" />
  </svg>
);

const SettingsIcon = () => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 mr-2 text-white/70">
    <path d="M12 8a4 4 0 100 8 4 4 0 000-8zm0 2a2 2 0 110 4 2 2 0 010-4z" fill="currentColor" />
    <path d="M11 2h2v3h-2V2zm0 17h2v3h-2v-3zM3 11h3v2H3v-2zm15 0h3v2h-3v-2zM5.6 5.6l2.1 2.1-1.4 1.4-2.1-2.1 1.4-1.4zm11.3 9.7l2.1 2.1-1.4 1.4-2.1-2.1 1.4-1.4zM7.7 16.9l-2.1 2.1-1.4-1.4 2.1-2.1 1.4 1.4zM17.6 7.1l-2.1 2.1-1.4-1.4 2.1-2.1 1.4 1.4z" fill="currentColor" />
  </svg>
);

const TrendingIcon = () => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 mr-2 text-white/70">
    <path d="M16 6h6v6h-2V9.4l-4.3 4.3-4-4-5.4 5.4-1.4-1.4 6.7-6.7 4 4L19.6 8H16V6z" fill="currentColor" />
  </svg>
);

const RocketIcon = () => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 mr-2 text-white/70">
    <path d="M16 5v2h-2V5h2zm-4 4V7h2v2h-2zm-2 2V9h2v2h-2zm0 2H8v-2h2v2zm2 2v-2h-2v2h2zm0 0h2v2h-2v-2zm4 4v-2h-2v2h2z" fill="currentColor" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 mr-3 text-white/50">
    <path d="M8 4h2v2H8V4zm2 2h2v2h-2V6zm2 2h2v2h-2V8zm2 2h2v2h-2v-2zm0 2v2h-2v-2h2zm-2 2v2h-2v-2h2zm-2 2v2H8v-2h2zm-2-2H6v-2h2v2zm2-2H8v-2h2v2zm2-2h-2V8h2v2z" fill="currentColor" />
  </svg>
);

const ChevronIcon = () => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className="w-3 h-3 mr-2 text-white/50"
  >
    <path
      d="M8 5v2h2V5H8zm4 4V7h-2v2h2zm2 2V9h-2v2h2zm0 2h2v-2h-2v2zm-2 2v-2h2v2h-2zm0 0h-2v2h2v-2zm-4 4v-2h2v2H8z"
      fill="currentColor"
    />
  </svg>
);

const versionHistory = [
  { version: "v1.0.31", date: "2025-01-31", description: "Enhanced email editor with code export, field simulator, and alignment icons. Added Password Strength Checker tool with comprehensive validation. Improved navigation with dynamic count badges." },
  { version: "v1.0.30", date: "2025-11-08", description: "Released the refreshed analytics dashboard, Tools workspace with OAuth testing/migration/database utilities, Geist typography polish, and widespread UI clean-up." },
  { version: "v1.0.26", date: "2025-01-09", description: "Major release with Shadcn UI components, admin functionality for user banning/unbanning, advanced filtering system with date range picker, and pure black & white theme overhaul." },
  { version: "v1.0.23", date: "2025-01-30", description: "Release with Database Schema Visualizer - an interactive ReactFlow-powered tool for visualizing Better Auth database schemas with plugin-based configuration." },
  { version: "v1.0.22", date: "2025-01-29", description: "Release with enhanced session management and improved user interface components." },
  { version: "v1.0.21", date: "2025-01-28", description: "Major beta release with advanced session management, IP geolocation, Biome integration, and comprehensive CI/CD pipeline." },
  { version: "v1.0.20-beta.5", date: "2025-01-27", description: "Beta release with CSV export functionality and enhanced user management interface." },
  { version: "v1.0.16", date: "2025-01-27", description: "Added CSV export functionality and enhanced user management interface with pixel-perfect design." },
  { version: "v1.0.15", date: "2025-01-25", description: "Enhanced user interface with improved navigation and performance optimizations." },
  { version: "v1.0.14", date: "2025-01-20", description: "Added comprehensive session management and organization features." },
  { version: "v1.0.13", date: "2025-01-15", description: "Initial stable release with core authentication management capabilities." }
];

export default function Changelog() {
  return (
    <PixelLayout
      currentPage="changelog"
      title="CHANGLOG"
      description="Track the Better Auth Studio development with detailed release updates."
    >
      <div className="space-y-8">
        <section>
          <PixelCard variant="highlight" className="relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <svg
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-3 h-3 inline-flex mr-1 text-white/50"
                  >
                    <path
                      d="M15 2h2v2h4v18H3V4h4V2h2v2h6V2zM9 6H5v2h14V6H9zm-4 4v10h14V10H5zm2 2h8v2H7v-2zm4 6v-2H7v2h4z"
                      fill="currentColor"
                    />
                  </svg>
                  v1.0.71 <span className="text-white/50 ml-2">/ 2025-12-17</span>
                </span>
              </h3>
            </div>
            <p className="text-sm font-light tracking-tight text-white/70 mb-4 pt-4">
              Enhanced email editor with code export, field simulator, and alignment icons. Added Password Strength Checker tool with comprehensive validation. Improved navigation with dynamic count badges.
            </p>
            <div className="space-y-3">
              <h4 className="font-light tracking-tight text-white flex items-center"><ZapIcon />New Features</h4>
              <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                <li className="flex items-center">
                  <ChevronIcon />
                  Email Editor with code export modal and syntax highlighting
                </li>
                <li className="flex items-center">
                  <ChevronIcon />
                Database Highlight Visualizer for interactive schema exploration and relationship mapping
                </li>
                <li className="flex items-center">
                  <ChevronIcon />
                Field Simulator for real-time preview of email templates with dynamic placeholders
                </li>
                <li className="flex items-center">
                  <ChevronIcon />
                Password Strength Checker tool with comprehensive validation and visual indicators
                </li>
              </ul>
            </div>
          </PixelCard>
        </section>

        <section>
          <h2 className="text-2xl font-light tracking-tight mb-6 text-white">RECENT UPDATES</h2>
          <PixelCard className="mb-6 relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <svg
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-3 h-3 inline-flex mr-1 text-white/50"
                  >
                    <path
                      d="M15 2h2v2h4v18H3V4h4V2h2v2h6V2zM9 6H5v2h14V6H9zm-4 4v10h14V10H5zm2 2h8v2H7v-2zm4 6v-2H7v2h4z"
                      fill="currentColor"
                    />
                  </svg>
                  Email Editor & Database Enhancements <span className="text-white/50 ml-2">/ 2025-02-12</span>
                </span>
              </h3>
            </div>
            <div className="space-y-4 pt-4">
              <div>
                <h4 className="font-light tracking-tight mb-2 text-white flex items-center"><MailIcon />Advanced Email Editor</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                <li className="flex items-center">
                  <ChevronIcon />
                    Visual drag-and-drop email builder with real-time preview and customization
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Template testing functionality with dynamic placeholder replacement and Resend integration
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Code export with syntax highlighting and one-click auth config application
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Field simulator for testing email templates with custom values before deployment along with Resend in
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Resend API key verification based on your api key
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-light tracking-tight mb-2 text-white flex items-center"><DatabaseIcon />Advanced Database Visualization</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                <li className="flex items-center">
                  <ChevronIcon />
                    Interactive schema visualizer with table highlighting and relationship mapping
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Focus mode for isolating table connections and exploring database relationships
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Dynamic schema loading from Better Auth context with plugin-aware table detection
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Collapsible field lists with preserved node positioning for optimal workflow
                  </li>
                </ul>
              </div>
            </div>
          </PixelCard>
          <PixelCard className="mb-6 relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <svg
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-3 h-3 inline-flex mr-1 text-white/50"
                  >
                    <path
                      d="M15 2h2v2h4v18H3V4h4V2h2v2h6V2zM9 6H5v2h14V6H9zm-4 4v10h14V10H5zm2 2h8v2H7v-2zm4 6v-2H7v2h4z"
                      fill="currentColor"
                    />
                  </svg>
                  Email Enhancements & Password Tool <span className="text-white/50 ml-2">/ 2025-01-31</span>
                </span>
              </h3>
            </div>
            <div className="space-y-4 pt-4">
              <div>
                <h4 className="font-light tracking-tight mb-2 text-white flex items-center"><MailIcon />Email Editor Improvements</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                <li className="flex items-center">
                  <ChevronIcon />
                    Code export modal with syntax highlighting.
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Field simulator for real-time preview of email templates with dynamic placeholders
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-light tracking-tight mb-2 text-white flex items-center"><ShieldIcon />Password Strength Checker</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                <li className="flex items-center">
                  <ChevronIcon />
                    New utility tool for validating passwords against Better Auth configuration
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Comprehensive strength scoring (1-5) with visual indicators
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Checks for length, uppercase, lowercase, numbers, special characters, and common patterns
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Validates against configured min/max password length requirements
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-light tracking-tight mb-2 text-white flex items-center"><TrendingIcon />Navigation Enhancements</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                <li className="flex items-center">
                  <ChevronIcon />
                    Dynamic count badges for Database (schema count), Emails (template count), and Tools (total tools)
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Real-time schema count fetching from database API
                  </li>
                </ul>
              </div>
            </div>
          </PixelCard>

          <PixelCard className="mb-6 relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <svg
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-3 h-3 inline-flex mr-1 text-white/50"
                  >
                    <path
                      d="M15 2h2v2h4v18H3V4h4V2h2v2h6V2zM9 6H5v2h14V6H9zm-4 4v10h14V10H5zm2 2h8v2H7v-2zm4 6v-2H7v2h4z"
                      fill="currentColor"
                    />
                  </svg>
                  Dashboard Overhaul & Tool Suite <span className="text-white/50 ml-2">/ 2025-11-08</span>
                </span>
              </h3>
            </div>
            <div className="space-y-4 pt-4">
              <div>
                <h4 className="font-light tracking-tight mb-2 text-white flex items-center"><AnalyticsIcon />Dashboard Enhancements</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                <li className="flex items-center">
                  <ChevronIcon />
                    Period controls wired to analytics endpoints for organizations, teams, and subscriptions with custom range support
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Refined stat cards with live percentages, hover tooltips, and constraint-aware chart tooltips
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-light tracking-tight mb-2 text-white flex items-center"><CommandIcon />Tools Command Center</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                <li className="flex items-center">
                  <ChevronIcon />
                    Test OAuth flow with provider selection modal, Better Auth state validation, popup orchestration, and account polling
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Run Migration dialog featuring Clerk blueprint, syntax-highlighted custom editor, and Coming Soon placeholders
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Test Database connectivity via `/api/database/test` with inline sample row preview and concise terminal logs
                  </li>
                </ul>
              </div>
            </div>
          </PixelCard>

          <PixelCard className="mb-6 relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <svg
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-3 h-3 inline-flex mr-1 text-white/50"
                  >
                    <path
                      d="M15 2h2v2h4v18H3V4h4V2h2v2h6V2zM9 6H5v2h14V6H9zm-4 4v10h14V10H5zm2 2h8v2H7v-2zm4 6v-2H7v2h4z"
                      fill="currentColor"
                    />
                  </svg>
                  Shadcn UI & Admin Functionality <span className="text-white/50 ml-2">/ 2025-01-09</span>
                </span>
              </h3>
            </div>
            <div className="space-y-4 pt-4">
              <div>
                <h4 className="font-light tracking-tight mb-2 text-white flex items-center"><LayoutIcon />Shadcn UI Components</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                <li className="flex items-center">
                  <ChevronIcon />
                    Calendar component with react-day-picker v9 integration and dual-month view
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    DateRangePicker component for advanced date filtering with auto-close functionality
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-light tracking-tight mb-2 text-white flex items-center"><ShieldIcon />Admin Functionality</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                <li className="flex items-center">
                  <ChevronIcon />
                    Comprehensive user banning/unbanning system with admin plugin detection
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Ban reason and expiration date support for temporary and permanent bans
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Visual ban indicators with warning banners and status badges
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    API endpoints for ban-user, unban-user, and admin status checking
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-light tracking-tight mb-2 text-white flex items-center"><SearchIcon />Advanced Filtering</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                <li className="flex items-center">
                  <ChevronIcon />
                    Dynamic filter system with Email Verified, Banned Status, Created Date, and Role filters
                  </li>
                </ul>
              </div>
            </div>
          </PixelCard>

          <PixelCard className="mb-6 relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <svg
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-3 h-3 inline-flex mr-1 text-white/50"
                  >
                    <path
                      d="M15 2h2v2h4v18H3V4h4V2h2v2h6V2zM9 6H5v2h14V6H9zm-4 4v10h14V10H5zm2 2h8v2H7v-2zm4 6v-2H7v2h4z"
                      fill="currentColor"
                    />
                  </svg>
                  Advanced Session Management <span className="text-white/50 ml-2">/ 2025-01-28</span>
                </span>
              </h3>
            </div>
            <div className="space-y-4 pt-4">
              <div>
                <h4 className="font-light tracking-tight mb-2 text-white flex items-center"><ShieldIcon />Session Seeding</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                <li className="flex items-center">
                  <ChevronIcon />
                    User-specific session seeding with customizable count (1-50 sessions)
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-light tracking-tight mb-2 text-white flex items-center"><AnalyticsIcon />Session Display</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                <li className="flex items-center">
                  <ChevronIcon />
                    Session ID, status, IP address, and expiration date display
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Individual session revocation functionality
                  </li>
                </ul>
              </div>
            </div>
          </PixelCard>

          <PixelCard className="mb-6 relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <svg
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-3 h-3 inline-flex mr-1 text-white/50"
                  >
                    <path
                      d="M15 2h2v2h4v18H3V4h4V2h2v2h6V2zM9 6H5v2h14V6H9zm-4 4v10h14V10H5zm2 2h8v2H7v-2zm4 6v-2H7v2h4z"
                      fill="currentColor"
                    />
                  </svg>
                  Database Schema Visualizer <span className="text-white/50 ml-2">/ 2025-01-30</span>
                </span>
              </h3>
            </div>
            <div className="space-y-4 pt-4">
              <div>
                <h4 className="font-light tracking-tight mb-2 text-white flex items-center"><DatabaseIcon />Interactive Schema Visualization</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                <li className="flex items-center">
                  <ChevronIcon />
                    ReactFlow-powered interactive database schema diagrams
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Drag-and-drop table positioning with zoom and pan controls
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Mini-map navigation for large schema overviews
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-light tracking-tight mb-2 text-white">🔌 Plugin-Based Configuration</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                <li className="flex items-center">
                  <ChevronIcon />
                    Dynamic plugin selection (Organization, Teams, Two Factor, API Key, Passkey)
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Schema statistics showing table count, relationships, and active plugins
                  </li>
                </ul>
              </div>
            </div>
          </PixelCard>

          <PixelCard className="mb-6 relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <svg
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-3 h-3 inline-flex mr-1 text-white/50"
                  >
                    <path
                      d="M15 2h2v2h4v18H3V4h4V2h2v2h6V2zM9 6H5v2h14V6H9zm-4 4v10h14V10H5zm2 2h8v2H7v-2zm4 6v-2H7v2h4z"
                      fill="currentColor"
                    />
                  </svg>
                  IP Geolocation & MaxMind <span className="text-white/50 ml-2">/ 2025-01-28</span>
                </span>
              </h3>
            </div>
            <div className="space-y-4 pt-4">
              <div>
                <h4 className="font-light tracking-tight mb-2 text-white flex items-center"><GlobeIcon />Geolocation Resolution</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                <li className="flex items-center">
                  <ChevronIcon />
                    MaxMind GeoLite2-City database integration for accurate IP geolocation
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Fallback to comprehensive default IP database covering 12 countries
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Country flag emoji display next to location information
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Real-time IP resolution with city, country, and region data
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-light tracking-tight mb-2 text-white flex items-center"><SettingsIcon />CLI Integration</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                <li className="flex items-center">
                  <ChevronIcon />
                    --geo-db CLI option for custom MaxMind database path
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Default MMDB file included in package distribution
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Backend API endpoint for IP geolocation resolution
                  </li>
                </ul>
              </div>
            </div>
          </PixelCard>

          <PixelCard className="mb-6 relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <svg
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-3 h-3 inline-flex mr-1 text-white/50"
                  >
                    <path
                      d="M15 2h2v2h4v18H3V4h4V2h2v2h6V2zM9 6H5v2h14V6H9zm-4 4v10h14V10H5zm2 2h8v2H7v-2zm4 6v-2H7v2h4z"
                      fill="currentColor"
                    />
                  </svg>
                  Biome Integration & CI/CD <span className="text-white/50 ml-2">/ 2025-01-28</span>
                </span>
              </h3>
            </div>
            <div className="space-y-4 pt-4">
              <div>
                <h4 className="font-light tracking-tight mb-2 text-white flex items-center"><SettingsIcon />Modern Tooling</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                <li className="flex items-center">
                  <ChevronIcon />
                    Biome integration for fast linting and formatting
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Comprehensive linting rules with appropriate warning levels
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Automatic code formatting with consistent style
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    TypeScript and JavaScript support with modern configurations
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-light tracking-tight mb-2 text-white flex items-center"><RocketIcon />CI/CD Pipeline</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                <li className="flex items-center">
                  <ChevronIcon />
                    GitHub Actions workflow for automated testing and building
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    pnpm package manager integration for consistent dependency management
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Automated security auditing and vulnerability scanning
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Build artifact verification and deployment readiness checks
                  </li>
                </ul>
              </div>
            </div>
          </PixelCard>
          <PixelCard className="mb-6 relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <svg
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-3 h-3 inline-flex mr-1 text-white/50"
                  >
                    <path
                      d="M15 2h2v2h4v18H3V4h4V2h2v2h6V2zM9 6H5v2h14V6H9zm-4 4v10h14V10H5zm2 2h8v2H7v-2zm4 6v-2H7v2h4z"
                      fill="currentColor"
                    />
                  </svg>
                  CSV Export Feature <span className="text-white/50 ml-2">/ 2025-01-27</span>
                </span>
              </h3>
            </div>
            <div className="space-y-4 pt-4">
              <div>
                <h4 className="font-light tracking-tight mb-2 text-white flex items-center"><DatabaseIcon />Data Export</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                <li className="flex items-center">
                  <ChevronIcon />
                    Added CSV export functionality for Users page with ID, name, email, verification status, and timestamps
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Added CSV export functionality for Organizations page with ID, name, slug, and timestamps
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Automatic timestamped filename generation (e.g., users-export-2025-01-27.csv)
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Proper CSV formatting with quoted fields and UTF-8 encoding for compatibility
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-light tracking-tight mb-2 text-white flex items-center"><TrendingIcon />User Experience</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                <li className="flex items-center">
                  <ChevronIcon />
                    Export buttons positioned next to "Add User" and "Add Organization" buttons
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Success toast notifications showing number of records exported
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Error handling for empty datasets with appropriate user feedback
                  </li>
                </ul>
              </div>
            </div>
          </PixelCard>

          <PixelCard className="mb-6 relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <svg
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-3 h-3 inline-flex mr-1 text-white/50"
                  >
                    <path
                      d="M15 2h2v2h4v18H3V4h4V2h2v2h6V2zM9 6H5v2h14V6H9zm-4 4v10h14V10H5zm2 2h8v2H7v-2zm4 6v-2H7v2h4z"
                      fill="currentColor"
                    />
                  </svg>
                  API Improvements <span className="text-white/50 ml-2">/ 2025-01-26</span>
                </span>
              </h3>
            </div>
            <div className="space-y-4 pt-4">
              <div>
                <h4 className="font-light tracking-tight mb-2 text-white flex items-center"><SettingsIcon />Fixed Issues</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                <li className="flex items-center">
                  <ChevronIcon />
                    Resolved "organization not found" errors with improved API response consistency
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Fixed "team not found" errors with better routing structure
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Improved database query performance with targeted WHERE clauses
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-light tracking-tight mb-2 text-white">⚡ Performance</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                <li className="flex items-center">
                  <ChevronIcon />
                    Optimized database queries to use limits instead of fetching all records
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Enhanced frontend routing for better organization structure
                  </li>
                </ul>
              </div>
            </div>
          </PixelCard>

          {/* UI/UX Enhancements */}
          <PixelCard className="mb-6 relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <svg
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-3 h-3 inline-flex mr-1 text-white/50"
                  >
                    <path
                      d="M15 2h2v2h4v18H3V4h4V2h2v2h6V2zM9 6H5v2h14V6H9zm-4 4v10h14V10H5zm2 2h8v2H7v-2zm4 6v-2H7v2h4z"
                      fill="currentColor"
                    />
                  </svg>
                  UI/UX Enhancements <span className="text-white/50 ml-2">/ 2025-01-25</span>
                </span>
              </h3>
            </div>
            <div className="space-y-4 pt-4">
              <div>
                <h4 className="font-light tracking-tight mb-2 text-white flex items-center"><LayoutIcon />Design System</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                <li className="flex items-center">
                  <ChevronIcon />
                    Unified black and white color scheme across all pages
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Integrated Geist Mono font for consistent typography
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-light tracking-tight mb-2 text-white">📱 Responsive Design</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                <li className="flex items-center">
                  <ChevronIcon />
                    Mobile-first responsive navigation system
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Optimized layouts for all screen sizes
                  </li>
                </ul>
              </div>
            </div>
          </PixelCard>

          {/* Documentation Updates */}
          <PixelCard className="relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <svg
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-3 h-3 inline-flex mr-1 text-white/50"
                  >
                    <path
                      d="M15 2h2v2h4v18H3V4h4V2h2v2h6V2zM9 6H5v2h14V6H9zm-4 4v10h14V10H5zm2 2h8v2H7v-2zm4 6v-2H7v2h4z"
                      fill="currentColor"
                    />
                  </svg>
                  Documentation <span className="text-white/50 ml-2">/ 2025-01-24</span>
                </span>
              </h3>
            </div>
            <div className="space-y-4 pt-4">
              <div>
                <h4 className="font-light tracking-tight mb-2 text-white">📚 Content</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                <li className="flex items-center">
                  <ChevronIcon />
                    Complete README.md integration for installation guide
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Added comprehensive changelog with version tracking
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Enhanced code examples with syntax highlighting
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-light tracking-tight mb-2 text-white flex items-center"><SettingsIcon />Developer Experience</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                <li className="flex items-center">
                  <ChevronIcon />
                    Added TypeScript syntax highlighting for code blocks
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
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
          <PixelCard variant="highlight" className="relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <RocketIcon />Roadmap
                </span>
              </h3>
            </div>
            <div className="space-y-4 pt-4">
              <div>
                <h4 className="font-light tracking-tight mb-2 text-white">v1.1.0 - Enhanced Analytics</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                <li className="flex items-center">
                  <ChevronIcon />
                    User activity dashboards with real-time metrics
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Session analytics and usage patterns
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Advanced export formats (JSON, Excel) and filtering options
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-light tracking-tight mb-2 text-white">v1.2.0 - Advanced Security</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                <li className="flex items-center">
                  <ChevronIcon />
                    Role-based access control (RBAC) management
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Security audit logs and monitoring
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Two-factor authentication management
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-light tracking-tight mb-2 text-white">v2.0.0 - Plugin System</h4>
                <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-4">
                <li className="flex items-center">
                  <ChevronIcon />
                    Extensible plugin architecture
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
                    Custom dashboard widgets
                  </li>
                <li className="flex items-center">
                  <ChevronIcon />
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
          <div className="space-y-8">
            {versionHistory.map((item) => (
              <PixelCard key={item.version} className="relative">
                <div className="absolute -top-10 left-0">
                  <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                    <span className="relative z-10 inline-flex gap-[2px] items-center">
                      <svg
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="w-3 h-3 inline-flex mr-1 text-white/50"
                      >
                        <path
                          d="M15 2h2v2h4v18H3V4h4V2h2v2h6V2zM9 6H5v2h14V6H9zm-4 4v10h14V10H5zm2 2h8v2H7v-2zm4 6v-2H7v2h4z"
                          fill="currentColor"
                        />
                      </svg>
                      {item.version} <span className="text-white/50 ml-2">/ {item.date}</span>
                    </span>
                  </h3>
                </div>
                <p className="text-sm font-light tracking-tight text-white/70 pt-4">
                  {item.description}
                </p>
              </PixelCard>
            ))}
          </div>
        </section>

        <section>
          <PixelCard className="relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <svg
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-3 h-3 inline-flex mr-1 text-white/50"
                  >
                    <path
                      d="M9 2h6v2H9V2zM7 6V4h2v2H7zm0 8H5V6h2v8zm2 2H7v-2h2v2zm6 0v2H9v-2h6zm2-2h-2v2h2v2h2v-6h-2v2zm0-8h2v8h-2V6zm0 0V4h-2v2h2zm-6 10v2h-2v-2h2zm0 0h2v-2h-2v2zm-2-4H7v2h2v-2zm8 0h-2v2h2v-2z"
                      fill="currentColor"
                    />
                  </svg>
                  Contributing
                </span>
              </h3>
            </div>
            <p className="text-sm font-light tracking-tight text-white/70 mb-4 pt-4">
              Better Auth Studio is open source and welcomes contributions from the community.
            </p>
            <div className="space-y-3">
              <div className="flex items-center text-sm font-light tracking-tight text-white/70">
                <ArrowRightIcon />
                Report bugs and request features on GitHub Issues
              </div>
              <div className="flex items-center text-sm font-light tracking-tight text-white/70">
                <ArrowRightIcon />
                Submit pull requests for bug fixes and enhancements
              </div>
              <div className="flex items-center text-sm font-light tracking-tight text-white/70">
                <ArrowRightIcon />
                Help improve documentation and examples
              </div>
              <div className="flex items-center text-sm font-light tracking-tight text-white/70">
                <ArrowRightIcon />
                Share feedback and suggestions with the community
              </div>
            </div>
          </PixelCard>
        </section>
      </div>
    </PixelLayout>
  );
}
