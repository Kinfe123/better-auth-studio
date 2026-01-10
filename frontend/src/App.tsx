import { useEffect, useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import DatabaseSchemaNodeDemo from './components/DatabaseSchemaNodeDemo';
import Layout from './components/Layout';
import { CountsProvider } from './contexts/CountsContext';
import AccessDenied from './pages/AccessDenied';
import Dashboard from './pages/Dashboard';
import DatabaseVisualizer from './pages/DatabaseVisualizer';
import EmailEditor from './pages/EmailEditor';
import Login from './pages/Login';
import OrganizationDetails from './pages/OrganizationDetails';
import Organizations from './pages/Organizations';
import Sessions from './pages/Sessions';
import Settings from './pages/Settings';
import TeamDetails from './pages/TeamDetails';
import Teams from './pages/Teams';
import Tools from './pages/Tools';
import UserDetails from './pages/UserDetails';
import Users from './pages/Users';

const config = (window as any).__STUDIO_CONFIG__;
const basePath = config?.basePath !== undefined ? config.basePath : '';
const isSelfHosted = !!basePath;

interface AuthState {
  loading: boolean;
  authenticated: boolean;
  user: any;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ loading: true, authenticated: false, user: null });
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const studioAuthPath = basePath ? `${basePath}/auth` : '/api/auth';
        const response = await fetch(`${studioAuthPath}/session`, { credentials: 'include' });
        const data = await response.json();
        setAuth({ loading: false, authenticated: data.authenticated, user: data.user });
      } catch {
        setAuth({ loading: false, authenticated: false, user: null });
      }
    };
    checkAuth();
  }, [location.pathname]);

  if (auth.loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border border-dashed border-white/30 animate-spin" />
      </div>
    );
  }

  if (!auth.authenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return <>{children}</>;
}

function MainRoutes() {
  return (
    <CountsProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/users/:userId" element={<UserDetails />} />
          <Route path="/organizations" element={<Organizations />} />
          <Route path="/organizations/:orgId" element={<OrganizationDetails />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/teams/:teamId" element={<TeamDetails />} />
          <Route path="/organizations/:orgId/teams/:teamId" element={<TeamDetails />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/database" element={<DatabaseVisualizer />} />
          <Route path="/database/demo" element={<DatabaseSchemaNodeDemo />} />
          <Route path="/emails" element={<EmailEditor />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </CountsProvider>
  );
}

function App() {
  useEffect(() => {
    const title = config?.metadata?.title;
    if (title) {
      document.title = title;
    }
  }, []);

  return (
    <Router basename={basePath}>
      {isSelfHosted ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/access-denied" element={<AccessDenied />} />
          <Route
            path="/*"
            element={
              <AuthGuard>
                <MainRoutes />
              </AuthGuard>
            }
          />
        </Routes>
      ) : (
        <Routes>
          <Route path="/*" element={<MainRoutes />} />
        </Routes>
      )}
      <Toaster
        className="rounded-none border-dashed border-white/20"
        theme="dark"
        position="top-right"
        richColors
        toastOptions={{
          style: {
            border: 'dashed 1px #ffffff20',
            borderRadius: '0',
          },
          className: 'font-mono uppercase',
        }}
        closeButton
      />
    </Router>
  );
}

export default App;
