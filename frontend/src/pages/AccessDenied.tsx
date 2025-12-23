import { useNavigate } from 'react-router-dom';

export default function AccessDeniedPage() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const basePath = (window as any).__STUDIO_CONFIG__?.basePath || '';
      const studioAuthPath = basePath ? `${basePath}/auth` : '/api/auth';
      await fetch(`${studioAuthPath}/logout`, { credentials: 'include' });
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[3%]">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_8px)]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="border border-dashed border-white/20 bg-black p-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 border border-dashed border-red-500/40 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-red-400">
                  <path d="M4 4h2v2H4V4zm14 0h2v2h-2V4zM6 6h2v2H6V6zm10 0h2v2h-2V6zM8 8h2v2H8V8zm6 0h2v2h-2V8zm-4 4h4v2h-4v-2zm-2 4h2v2H8v-2zm6 0h2v2h-2v-2zm-4 2h4v2h-4v-2z" fill="currentColor" />
                </svg>
              </div>
              <span className="text-white/60 text-xs font-mono uppercase tracking-wider">access denied</span>
            </div>
            <div className="flex flex-col items-center justify-center mt-2">
              <hr className="w-[calc(100%+3rem)] border-white/10 h-px" />
              <div className="relative z-20 h-4 w-[calc(100%+3rem)] mx-auto -translate-x-1/2 left-1/2 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[7%]" />
              <hr className="w-[calc(100%+3rem)] border-white/10 h-px" />
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-white text-lg font-mono uppercase tracking-wide mb-2">
              Permission Denied
            </h1>
            <p className="text-white/40 text-xs font-mono leading-relaxed">
              Your account does not have the required role to access Better Auth Studio.
            </p>
          </div>

          <div className="p-3 border border-dashed border-white/10 bg-white/[2%] mb-6">
            <div className="flex items-start gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white/40 flex-shrink-0 mt-0.5">
                <path d="M11 7h2v2h-2V7zm0 4h2v6h-2v-6zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor" />
              </svg>
              <p className="text-white/40 text-[11px] font-mono">
                Required role: <span className="text-white/60">admin</span>
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleLogout}
              className="w-full h-10 bg-white text-black text-xs font-mono uppercase tracking-wider hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-black">
                <path d="M5 3h14v2H5V3zm0 16h14v2H5v-2zm0-8h8v2H5v-2zm10 0h2v2h-2v-2zm2 2h2v2h-2v-2zm0-4h2v2h-2V9zm-2 6h2v2h-2v-2z" fill="currentColor" />
              </svg>
              Sign Out
            </button>

            <button
              onClick={() => window.history.back()}
              className="w-full h-10 border border-dashed border-white/20 text-white text-xs font-mono uppercase tracking-wider hover:bg-white/5 hover:border-white/30 transition-colors flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M12 4h2v2h-2V4zm-2 2h2v2h-2V6zm-2 2h2v2H8V8zm-2 2h2v4H6v-4zm14 0h2v4h-2v-4zm-2 4h2v2h-2v-2zm-2 2h2v2h-2v-2zm-2 2h2v2h-2v-2z" fill="currentColor" />
              </svg>
              Go Back
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-dashed border-white/10">
            <p className="text-white/20 text-[10px] font-mono text-center">
              Contact your administrator for access
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
