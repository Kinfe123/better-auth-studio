// @ts-nocheck
"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Geometry, Base, Subtraction } from '@react-three/csg'
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Bloom, N8AO, SMAA, EffectComposer } from '@react-three/postprocessing'
import { useEffect, useRef, useState } from "react";
import { Mesh } from "three";
import { KernelSize } from "postprocessing";
import { LineShadowText } from "../LineShadow";

function Shape() {
  const meshRef = useRef<Mesh>(null);
  const innerSphereRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 0.3;
      meshRef.current.rotation.z += delta * 0.2;
    }
    if (innerSphereRef.current) {
      innerSphereRef.current.rotation.x += delta * 0.3;
      innerSphereRef.current.rotation.y += delta * 0.5;
      innerSphereRef.current.rotation.z += delta * 0.1;
    }
  });

  return (
    <>
      <mesh ref={meshRef}>
        <meshPhysicalMaterial
          roughness={0}
          metalness={0.95}
          clearcoat={1}
          clearcoatRoughness={0.1}
          color="#000000"
        />

        <Geometry>
          <Base>
            <primitive
              object={new RoundedBoxGeometry(2, 2, 2, 7, 0.2)}
            />
          </Base>

          <Subtraction>
            <sphereGeometry args={[1.25, 64, 64]} />
          </Subtraction>
        </Geometry>
      </mesh>

      <mesh ref={innerSphereRef}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshPhysicalMaterial
          color="#ffffff"
          emissive={"white"}
          emissiveIntensity={1}
        />
      </mesh>
    </>
  );
}

function Environment() {
  return (
    <>

      <directionalLight
        position={[-5, 5, -5]}
        intensity={0.3}
        color="#ffffff"
      />

      <directionalLight
        position={[0, -5, 10]}
        intensity={0.5}
        color="#ffffff"
      />

      <ambientLight intensity={0.6} color="#ffffff" />

      <pointLight
        position={[8, 3, 8]}
        intensity={0.3}
        color="#ffffff"
        distance={20}
      />

      <pointLight
        position={[-8, 3, -8]}
        intensity={0.3}
        color="#ffffff"
        distance={20}
      />

      <directionalLight
        position={[0, -10, 0]}
        intensity={0.3}
        color="#ffffff"
      />
    </>
  );
}

function Scene() {
  return (
    <Canvas
      className="w-full h-full"
      camera={{ position: [5, 5, 5], fov: 50 }}
    >
      <Environment />
      <Shape />
      <EffectComposer multisampling={0}>
        <N8AO halfRes color="black" aoRadius={2} intensity={1} aoSamples={6} denoiseSamples={4} />
        <Bloom
          kernelSize={3}
          luminanceThreshold={0}
          luminanceSmoothing={0.4}
          intensity={0.8}
        />
        <Bloom
          kernelSize={KernelSize.HUGE}
          luminanceThreshold={0}
          luminanceSmoothing={0}
          intensity={0.7}
        />
        <SMAA />
      </EffectComposer>
    </Canvas>
  );
}

function Navbar({ links }: { links: Array<{ name: string; href: string }> }) {
  return (
    <nav className="absolute font-mono top-4 left-4 right-4 md:top-10 md:left-10 md:right-10 z-30">
      <ul className="hidden md:flex gap-8 lg:gap-12">
        {links.map((link) => (
          <li key={link.name}>
            <a
              href={link.href}
              className="text-sm font-light tracking-[0.2em] mix-blend-difference text-white hover:opacity-70 transition-opacity duration-300"
            >
              {link.name}
            </a>
          </li>
        ))}
      </ul>

      <ul className="md:hidden flex flex-col gap-3 items-end">
        {links.map((link) => (
          <li key={link.name}>
            <a
              href={link.href}
              className="text-xs font-light tracking-[0.15em] mix-blend-difference text-white hover:opacity-70 transition-opacity duration-300"
            >
              {link.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

type TerminalTone = "command" | "info" | "success" | "muted";

interface TerminalLine {
  text: string;
  tone: TerminalTone;
}

const TERMINAL_SCRIPT: TerminalLine[] = [
  { text: "$ npx better-auth-studio@latest", tone: "command" },
  { text: "Starting Better Auth Studio…", tone: "info" },
  { text: "✔ Found Better Auth configuration", tone: "success" },
  { text: "Database: Prisma (sqlite) v6.15.0", tone: "info" },
  { text: "✔ Better Auth Studio is running!", tone: "success" },
  { text: "🌐 Open your browser and navigate to: http://localhost:3002", tone: "info" },
  { text: "📊 Dashboard available at: http://localhost:3002", tone: "info" },
  { text: "🔧 API endpoints available at: http://localhost:3002/api", tone: "info" },
  { text: "Press Ctrl+C to stop the studio", tone: "info" },
  { text: "$ Seeding 10 mock users...", tone: "command" },
  { text: "⌁ inserting mock records with hashed credentials", tone: "info" },
  { text: "✔ seeding completed in 43ms", tone: "success" },
  { text: "$ running migration --provider clerk", tone: "command" },
  { text: "✔ migrated 182 entries in 213ms", tone: "success" },
  { text: "$ testing github oauth...", tone: "command" },
  { text: "⌁ redirecting to https://github.com/login/oauth", tone: "info" },
  { text: "✔ oauth succeeded — kinfishtech@gmail.com", tone: "success" },
  { text: "$ testing database connection...", tone: "command" },
  { text: "⌁ checking database connection with adapter.findMany()", tone: "info" },
  { text: "✔ connection established → first user email: kinfishtech@gmail.com", tone: "success" },
  { text: "$ testing health check..", tone: "command" },
  { text: "⌁ running system health check api...", tone: "info" },
  { text: "✔ health check passed! all systems operational", tone: "success" },
];

const toneClassName = (tone: TerminalTone) => {
  switch (tone) {
    case "command":
      return "text-white";
    case "info":
      return "text-white/70";
    case "success":
      return "text-emerald-400";
    case "muted":
      return "text-white/40";
    default:
      return "text-white/70";
  }
};

interface HeroProps {
  title: string;
  description: string;
  links: Array<{ name: string; href: string }>;
  version?: string | null;
}

export const Hero: React.FC<HeroProps> = ({ title, description, links, version }) => {
  const [copied, setCopied] = useState(false);
  const [visibleTerminalLines, setVisibleTerminalLines] = useState<TerminalLine[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let index = 0;
    setVisibleTerminalLines([]);

    const timeouts: NodeJS.Timeout[] = [];

    TERMINAL_SCRIPT.forEach((line, lineIndex) => {
      const timeout = setTimeout(() => {
        setVisibleTerminalLines((prev) => [...prev, line]);
        const container = containerRef.current;
        if (container) {
          requestAnimationFrame(() => {
            container.scrollTo({
              top: container.scrollHeight,
              behavior: "smooth",
            });
          });
        }
      }, lineIndex * 1400);
      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return (
    <>
    <div className="h-svh w-screen relative bg-[#0A0A0A]">
      <Navbar links={links} />
      <div className="absolute inset-0">
        <Scene />
      </div>
      <div className="absolute bottom-4 left-4 md:bottom-10 md:left-10 z-20 max-w-md">

        <h1 className="text-2xl flex uppercase font-mono md:text-3xl font-light tracking-tight mb-3 text-white">
          {title.split("Studio")[0]}{" "}
          <LineShadowText className="font-normal ml-2" shadowColor="white">
            Studio
          </LineShadowText>
          {version && (
            <div className="inline-flex group gap-x-1 text-[13px] ml-2 font-mono">
              <span className="text-white/50 group-hover:text-white transition-colors">[</span>
              <span className="text-white/70 text-[14px] lowercase">v {version}</span>
              <span className="text-white/50 group-hover:text-white transition-colors">]</span>
            </div>
          )}
        </h1>
        <p className="font-mono uppercase text-[12.5px] text-white/50 mb-6">
          {description}
        </p>
        <div className="bg-black/20 backdrop-blur-sm border border-white/20 border-dashed rounded-none p-4 font-mono text-xs">
          <div className="text-white/70 flex items-center text-[10px] uppercase font-mono mb-2">
            <svg
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="w-3 rotate-180 h-3 inline-flex mr-1 text-white/50 hover:text-white transition-colors"
            >
              <path
                d="M16 5v2h-2V5h2zm-4 4V7h2v2h-2zm-2 2V9h2v2h-2zm0 2H8v-2h2v2zm2 2v-2h-2v2h2zm0 0h2v2h-2v-2zm4 4v-2h-2v2h2z"
                fill="currentColor"
              />
            </svg>
            Install Better Auth Studio</div>
          <div className="flex items-center gap-2">
            <span className="text-white/80">$</span>
            <code className="text-white text-xs">npx better-auth-studio@latest</code>
            <button
              onClick={() => {
                setCopied(true)
                navigator.clipboard.writeText('npx better-auth-studio@latest')
                setTimeout(() => {
                  setCopied(false)
                }, 3000)
              }}
              className="ml-2 text-white/50 hover:text-white transition-colors"
              title="Copy to clipboard"
            >
              {
                copied ? (

                  <svg
                    fill="none"
                    className="w-4 h-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M18 6h2v2h-2V6zm-2 4V8h2v2h-2zm-2 2v-2h2v2h-2zm-2 2h2v-2h-2v2zm-2 2h2v-2h-2v2zm-2 0v2h2v-2H8zm-2-2h2v2H6v-2zm0 0H4v-2h2v2z"
                      fill="currentColor"
                    />

                  </svg>

                ) : (
                  <svg
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-4 h-4 text-white/50 hover:text-white transition-colors"
                  >
                    <path
                      d="M18 6h2v2h-2V6zm-2 4V8h2v2h-2zm-2 2v-2h2v2h-2zm-2 2h2v-2h-2v2zm-2 2h2v-2h-2v2zm-2 0v2h2v-2H8zm-2-2h2v2H6v-2zm0 0H4v-2h2v2z"
                      fill="currentColor"
                    />
                  </svg>
                )
              }

            </button>
          </div>
        </div>
      </div>

      <div className="hidden md:block absolute top-6 right-6 lg:right-12 w-[420px] lg:w-[520px]">
        <div className="relative overflow-hidden border border-white/20 border-dashed rounded-none bg-transparent backdrop-blur-2xl animate-[terminal-pop_0.6s_ease-out]">
          <div className="absolute inset-0 bg-linear-to-br from-transparent/20 via-transparent/5 to-transparent opacity-70 blur-3xl" />
          <div className="relative px-6 pt-4 pb-0 font-mono text-[12px] text-white">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.35em] text-white/60 mb-3">
              <span className="text-white/40 text-[10px]">
             <span>[</span> 
              <span className="text-white/70 uppercase tracking-[0.25em] mx-1">Better Auth Studio</span>
              <span>]</span>
              </span>
            </div>
            <div ref={containerRef} className="space-y-1.5 min-h-[350px] max-h-[350px] overflow-y-auto pr-1 custom-scroll">
              {visibleTerminalLines.map((line, idx) => (
                <div
                  key={`${line.text}-${idx}`}
                  className={`flex items-start gap-2 whitespace-pre-wrap leading-relaxed ${toneClassName(line.tone)} opacity-0`}
                  style={{
                    animation: `line-enter 0.45s ease-out forwards`,
                    animationDelay: `${idx * 0.04}s`,
                  }}
                >
                  <span>{line.text}</span>
                </div>
              ))}
              {/* <div
                className={`flex items-start gap-2 whitespace-pre-wrap leading-relaxed text-white/50 ${
                  visibleTerminalLines.length === TERMINAL_SCRIPT.length ? "opacity-100" : "opacity-0"
                } transition-opacity duration-300`}
              >
                <span className="inline-flex w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse mt-1" />
                <span className="uppercase tracking-[0.25em]">end of replay</span>
              </div> */}
            </div>
            <div className="mx-auto mt-4 py-1  border-t border-dashed border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between text-[10px] text-white/60 uppercase tracking-[0.22em]">
                <div className="flex items-center space-x-3">
                  <span>Status: {visibleTerminalLines.length === 0 ? "Idle" : "Live"}</span>
                  <span>Lines: {visibleTerminalLines.length}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 mr-1 bg-emerald-400 rounded-full animate-pulse" />
                  <span>better auth studio</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <style jsx global>{`
      @keyframes terminal-pop {
        0% {
          transform: translateY(40px) scale(0.98);
          opacity: 0;
        }
        100% {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
      }
      @keyframes line-enter {
        0% {
          transform: translateY(8px);
          opacity: 0;
        }
        100% {
          transform: translateY(0);
          opacity: 1;
        }
      }
    `}</style>
    </>
  );
}
