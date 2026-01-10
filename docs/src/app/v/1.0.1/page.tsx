'use client';

import { useEffect } from 'react';
import { ZoomedScene } from '@/components/ui/hero';
import PixelCard from '@/components/PixelCard';
import CodeBlock from '@/components/CodeBlock';
import {
  NextJsIcon,
  ExpressIcon,
  HonoIcon,
  ElysiaIcon,
  SvelteKitIcon,
  SolidStartIcon,
  TanStackStartIcon,
  AstroIcon,
  RemixIcon,
  NuxtIcon,
  InstallIcon,
} from '@/components/icons';

export default function Version101Page() {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    document.documentElement.classList.add('dark');

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  const frameworks = [
    { name: 'Next.js', icon: NextJsIcon },
    { name: 'Express', icon: ExpressIcon },
    { name: 'Hono', icon: HonoIcon },
    { name: 'Elysia', icon: ElysiaIcon },
    { name: 'SvelteKit', icon: SvelteKitIcon },
    { name: 'SolidStart', icon: SolidStartIcon },
    { name: 'TanStack Start', icon: TanStackStartIcon },
    { name: 'Astro', icon: AstroIcon },
    { name: 'Remix', icon: RemixIcon },
    { name: 'Nuxt', icon: NuxtIcon },
  ];

  return (
    <div className="bg-[#0a0a0a] text-white h-screen overflow-hidden font-sans selection:bg-white selection:text-black relative">

      <header className="fixed top-0 right-0 p-8 z-50">
        <span className="font-mono text-sm tracking-widest uppercase text-white">Better Auth Studio 1.0.1</span>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 h-screen overflow-hidden">
        <section className="flex flex-col justify-between p-6 lg:p-10 border-r border-white/20 overflow-y-auto relative bg-black/50 backdrop-blur-sm">
          <div
            className="absolute inset-0 pointer-events-none opacity-100 mix-blend-overlay"
            style={{
              backgroundImage: 'url(/shades.png)',
              backgroundRepeat: 'repeat',
              backgroundSize: 'auto'
            }}
          />
          <div
            className="absolute top-40 mt-14 -left-6 lg:-left-10 right-0 w-[calc(100%+1.5rem)] lg:w-[calc(100%+2.5rem)] pointer-events-none z-20"
            style={{
              top: 'calc(1.5rem + 1.25rem + 0.75rem)'
            }}
          >
            <hr className="w-full border-white/10 h-px" />
            <div className="relative z-20 h-2 w-full bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-7" />
            <hr className="w-full border-white/10 h-px" />
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full scrollbar-hide">
            <div className="space-y-8">
              <div>
                <h1 className="text-lg lg:text-xl font-light tracking-tighter uppercase font-mono mb-3">
                  Release <br /> <span className="bg-white text-black px-1 py-0 rounded-none">Version 1.0.1</span>
                </h1>
                <div className="h-[3px] mb-4 mt-8" />
                <p className="text-base lg:text-xs font-light text-white/90 leading-relaxed font-mono uppercase mb-4">
                  <span>{"// "}</span>  Better Auth Studio now supports 10 major web frameworks with seamless integration for production deployments along with bunch of configuration options and features.
                </p>

                <div className="mb-4">
                  <div className="relative">
                    <div className="absolute left-3">
                      <h3 className="relative z-20 text-[11px] font-light uppercase tracking-tight text-white/90 border border-white/15 bg-[#0a0a0a] px-2 py-1 overflow-hidden">
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-7" />
                        <span className="relative inline-flex gap-1 items-center">
                          <InstallIcon className="w-3 h-3" />
                          Installation
                        </span>
                      </h3>
                    </div>
                  </div>
                  <div className="pt-4 space-y-2">
                    <CodeBlock code="pnpm add better-auth-studio@latest" className="border-white/15" />
                  </div>
                </div>
              </div>
              <div className="-mx-6 lg:-mx-10 w-[calc(100%+5rem)] lg:w-[calc(100%+5rem)] mb-4">
                <hr className="w-full border-white/10 h-px" />
                <div className="relative z-20 h-2 w-full bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-7" />
                <hr className="w-full border-white/10 h-px" />
              </div>

              <div className="space-y-4 mt-4">
                <h2 className="text-sm lg:text-sm font-medium font-mono uppercase tracking-wider text-white">What's New</h2>
                <div className="-mx-6 lg:-mx-10 w-[calc(100%+5rem)] lg:w-[calc(100%+5rem)] mb-4">
                  <hr className="w-full border-white/15 h-px" />
                </div>
                <div className="space-y-2.5 font-sans">
                  <div>
                    <p className="text-xs lg:text-sm leading-relaxed text-white/80 font-light">
                      <strong className="font-light font-mono uppercase text-white">Complete Framework Support:</strong> We've expanded Better Auth Studio to support 10 major web frameworks including Next.js, Express, Hono, Elysia, SvelteKit, SolidStart, TanStack Start, Astro, Remix, and Nuxt. Each framework adapter provides framework-specific route handlers, type-safe configuration, and seamless integration with Better Auth.
                    </p>
                  </div>
                  <div className="-mx-6 lg:-mx-10 w-[calc(100%+5rem)] lg:w-[calc(100%+5rem)] mb-4">
                    <hr className="w-full border-white/15 h-px" />
                  </div>
                  <div>
                    <p className="text-xs lg:text-sm leading-relaxed text-white/80 font-light">
                      <strong className="font-light font-mono uppercase text-white">Self-Hosting Features:</strong> Framework-agnostic self-hosting allows you to deploy Better Auth Studio alongside your application. Configure role-based access control and email allowlists for secure admin access. Use environment variables for basePath and admin emails to keep sensitive data out of your codebase.
                    </p>
                  </div>
                  <div className="-mx-6 lg:-mx-10 w-[calc(100%+5rem)] lg:w-[calc(100%+5rem)] mb-4">
                    <hr className="w-full border-white/15 h-px" />
                  </div>
                  <div>
                    <p className="text-xs lg:text-sm leading-relaxed text-white/80 font-light">
                      <strong className="font-light font-mono uppercase text-white">Custom Branding:</strong> Complete metadata support including custom titles, logos, favicons, company branding, theme customization, and custom CSS styles. Replace the default "Better Auth Studio" branding with your own company identity throughout the interface.
                    </p>
                  </div>
                  <div className="-mx-6 lg:-mx-10 w-[calc(100%+5rem)] lg:w-[calc(100%+5rem)] mb-4">
                    <hr className="w-full border-white/15 h-px" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs lg:text-sm font-semibold leading-snug font-mono uppercase text-white">
                Start using Better Auth <span className="bg-white text-black px-1 py-0 rounded-none">Studio</span> today. <br className="hidden md:block" />
                <div className='h-1'></div>
                <a
                  href="/installation"
                  className="text-white/70 cursor-pointer hover:text-white underline decoration-white/30 hover:decoration-white/70 transition-all duration-300 font-normal underline-offset-4 text-[11px]"
                >
                  Get started in minutes <svg
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-4 h-4 mb-[1px] inline-flex rotate-[42deg]"
                  >
                    <path
                      d="M11 20h2V8h2V6h-2V4h-2v2H9v2h2v12zM7 10V8h2v2H7zm0 0v2H5v-2h2zm10 0V8h-2v2h2zm0 0v2h2v-2h-2z"
                      fill="currentColor"
                    />
                  </svg>
                </a>
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-col justify-between relative bg-[#0A0A0A] overflow-hidden h-full">

          <div className="grow flex items-center justify-center shrink-0 relative z-10" style={{ height: '60%' }}>
            <div className="relative w-full h-full">
              <ZoomedScene />
            </div>
          </div>

          <div className="shrink-0 relative z-10">
            <div className="px-6 lg:px-10 py-3 border-t border-white/15">
              <p className="text-sm lg:text-base font-medium leading-tight max-w-xs font-mono uppercase tracking-tight text-white">
                Framework Support
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 border-t border-white/15 divide-x divide-y divide-white/15">
              {frameworks.map((framework) => {
                const Icon = framework.icon;
                return (
                  <div key={framework.name} className="p-3 lg:p-4 flex items-center justify-center gap-2 grayscale hover:grayscale-0 transition-all opacity-60 hover:opacity-100 cursor-default">
                    <Icon className="w-4 h-4 text-white" />
                    <span className="font-mono text-[10px] lg:text-xs font-medium uppercase tracking-tight text-center text-white">
                      {framework.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

