import { AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const basePath = (window as any).__STUDIO_CONFIG__?.basePath || '';
      const studioAuthPath = basePath ? `${basePath}/auth` : '/api/auth';

      const signInResponse = await fetch(`${studioAuthPath}/sign-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const result = await signInResponse.json();

      if (!signInResponse.ok) {
        if (signInResponse.status === 403) {
          navigate('/access-denied');
          return;
        }
        throw new Error(result.message || 'Invalid credentials');
      }

      if (result.success) {
        navigate(redirect);
      } else {
        throw new Error(result.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  //   const handleOAuthLogin = async (provider: string) => {
  //     const basePath = (window as any).__STUDIO_CONFIG__?.basePath || '';
  //     const studioAuthPath = basePath ? `${basePath}/auth` : '/api/auth';
  //     const callbackUrl = encodeURIComponent(
  //       window.location.origin + basePath + '/?oauth_callback=true'
  //     );
  //     window.location.href = `${studioAuthPath}/oauth/${provider}?callbackURL=${callbackUrl}`;
  //   };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[3%]">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_8px)]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="border border-dashed border-white/20 bg-black p-6">
          <div className="mb-6">
            <div className="flex relative justify-between items-center gap-2 mb-4">
              <span className="flex w-full text-left justify-start items-center text-white text-xs font-mono uppercase tracking-wider">
                better auth <span className="bg-white text-black px-1 ml-1 rounded-none">studio</span>
              </span>
            </div>
            <div className="flex flex-col items-center justify-center mt-2">
              <hr className="w-[calc(100%+3rem)] border-white/10 h-px" />
              <div className="relative z-20 h-4 w-[calc(100%+3rem)] mx-auto -translate-x-1/2 left-1/2 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[7%]" />
              <hr className="w-[calc(100%+3rem)] border-white/10 h-px" />
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-white text-lg font-mono uppercase tracking-wide mb-1">
              Admin Access
            </h1>
            <p className="text-white/40 text-xs font-mono">Sign in with your admin account</p>
          </div>

          {error && (
            <div className="mb-4 p-3 border border-dashed border-red-500/30 bg-red-500/5">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-xs font-mono">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-white/50 text-[10px] font-mono uppercase tracking-wider block mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full h-10 px-3 bg-black border border-dashed border-white/20 text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-white/40 transition-colors"
                required
              />
            </div>

            <div>
              <label className="text-white/50 text-[10px] font-mono uppercase tracking-wider block mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 px-3 bg-black border border-dashed border-white/20 text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-white/40 transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-white text-black text-xs font-mono uppercase tracking-wider hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Sign In'}
            </button>
          </form>

          <div className="mt-6">
            <div className="mt-4 grid grid-cols-2 gap-2">
              {/* <button
                                type="button"
                                onClick={() => handleOAuthLogin('github')}
                                className="h-10 border border-dashed border-white/20 text-white text-xs font-mono uppercase tracking-wider hover:bg-white/5 hover:border-white/30 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                                GitHub
                            </button>
                            <button
                                type="button"
                                onClick={() => handleOAuthLogin('google')}
                                className="h-10 border border-dashed border-white/20 text-white text-xs font-mono uppercase tracking-wider hover:bg-white/5 hover:border-white/30 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Google
                            </button> */}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-dashed border-white/10">
            <p className="text-white/30 uppercase tracking-wider text-[10px] font-mono text-center">
              admin role required for access
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
