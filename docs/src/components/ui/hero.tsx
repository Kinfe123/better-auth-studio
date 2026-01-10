// @ts-nocheck
"use client";

import { Canvas, useFrame, ThreeEvent } from "@react-three/fiber";
import { Geometry, Base, Subtraction } from '@react-three/csg'
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Bloom, N8AO, SMAA, EffectComposer } from '@react-three/postprocessing'
import { OrbitControls } from '@react-three/drei';
import { useEffect, useRef, useState } from "react";
import { Mesh } from "three";
import { KernelSize } from "postprocessing";
import { LineShadowText } from "../LineShadow";
function Shape() {
  const meshRef = useRef<Mesh>(null);
  const innerSphereRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  useFrame((_, delta) => {
    if (autoRotate) {
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
    }
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setClicked(!clicked);
    setAutoRotate(!autoRotate);
  };

  return (
    <>
      <mesh 
        ref={meshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <meshPhysicalMaterial
          roughness={0}
          metalness={0.95}
          clearcoat={1}
          clearcoatRoughness={0.1}
          color={hovered ? "#1a1a1a" : "#000000"}
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

      <mesh 
        ref={innerSphereRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshPhysicalMaterial
          color="#ffffff"
          emissive={"white"}
          emissiveIntensity={clicked ? 1.5 : 1}
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

export function Scene() {
  return (
    <Canvas
      className="w-full h-full"
      camera={{ position: [4.5, 4.5, 4.5], fov: 46 }}
    >
      <Environment />
      <Shape />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        enableZoom={true}
        enablePan={false}
        minDistance={3}
        maxDistance={15}
        makeDefault
      />
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

export function ZoomedScene() {
  return (
    <Canvas
      className="w-full bg-black h-full"
      camera={{ position: [2.0, 2.0, 2.0], fov: 60 }}
    >
      <Environment />
      <Shape />
      <OrbitControls
        enableDamping={false}
        enableZoom={false}
        enableRotate={false}
        enablePan={false}
        makeDefault
      />
      <EffectComposer multisampling={0}>
        <N8AO halfRes color="black" aoRadius={2} intensity={1} aoSamples={6} denoiseSamples={4} />
        <Bloom
          kernelSize={3}
          luminanceThreshold={0}
          luminanceSmoothing={0.4}
          intensity={0.3}
        />
        <Bloom
          kernelSize={KernelSize.HUGE}
          luminanceThreshold={0}
          luminanceSmoothing={0}
          intensity={0.2}
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
  { text: "$ pnpx better-auth-studio@latest start", tone: "command" },
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
  { text: "$ running migration for clerk", tone: "command" },
  { text: "✔ migrated 182 entries in 213ms", tone: "success" },
  { text: "$ testing github oauth...", tone: "command" },
  { text: "⌁ redirecting to https://github.com/login/oauth", tone: "info" },
  { text: "✔ oauth succeeded — kinfishtech@gmail.com", tone: "success" },
  { text: "$ testing database connection...", tone: "command" },
  { text: "⌁ checking database connection with adapter.findMany()", tone: "info" },
  { text: "✔ connection established, found users", tone: "success" },
  { text: "$ testing health check..", tone: "command" },
  { text: "⌁ running system health check api...", tone: "info" },
  { text: "✔ health check passed! all systems operational", tone: "success" },
  { text: "$ Fetching OAuth credentials...", tone: "command" },
  { text: "✔ credentials fetched successfully for github and google", tone: "success" },
  { text: "$ validating your configuration..." , tone: "command" },
  { text: "⌁ checking BETTER_AUTH_SECRET...", tone: "info" },
  { text: "✔ BETTER_AUTH_SECRET found and valid", tone: "success" },
  { text: "⌁ checking database connection...", tone: "info" },
  { text: "✔ database connection established", tone: "success" },
  { text: "✔ configuration validated successfully", tone: "success" },
  { text: "$ exporting users to json..." , tone: "command" },
  { text: "✔ users exported to json successfully", tone: "success" },
  { text: "$ hashing passwords..." , tone: "command" },
  { text: "⌁ hashing passwords with bcrypt...", tone: "info" },
  { text: "✔ passwords hashed successfully", tone: "success" },
  { text: "$ decoding jwt..." , tone: "command" },
  { text: "⌁ decoding jwt with BETTER_AUTH_SECRET...", tone: "info" },
  { text: "✔ jwt decoded successfully", tone: "success" },
  { text: "$ generating uuid..." , tone: "command" },
  { text: "✔ uuid generated successfully", tone: "success" },
];

interface HeroProps {
  title: string;
  description: string;
  links: Array<{ name: string; href: string }>;
  version?: string | null;
}

export const Hero: React.FC<HeroProps> = ({ title, description, links, version }) => {
  const [copied, setCopied] = useState(false);
  const [typedTerminalCommand, setTypedTerminalCommand] = useState("");
  const [terminalLogs, setTerminalLogs] = useState<TerminalLine[]>([]);
  const [terminalHeight, setTerminalHeight] = useState<number>(110);
  const [showZoomHint, setShowZoomHint] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const terminalLogsRef = useRef<TerminalLine[]>([]);

  useEffect(() => {
    terminalLogsRef.current = terminalLogs;
    updateTerminalHeight(terminalLogs, typedTerminalCommand);
  }, [terminalLogs, typedTerminalCommand]);

  useEffect(() => {
    animateSequence();
    return () => cleanup();
  }, []);

  useEffect(() => {
    const handleWheel = () => {
      setShowZoomHint(false);
    };
    window.addEventListener('wheel', handleWheel, { once: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  const scrollToBottom = () => {
    const container = containerRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    });
  };

  const cleanup = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const animateSequence = () => {
    cleanup();
    setTypedTerminalCommand("");
    setTerminalLogs([]);
    setTerminalHeight(110);

    const firstLine = TERMINAL_SCRIPT[0];
    typeString(firstLine.text, setTypedTerminalCommand, 60, () => {
      setTypedTerminalCommand("");
      setTerminalLogs([firstLine]);
      scrollToBottom();

      TERMINAL_SCRIPT.slice(1).forEach((line, index) => {
        const timeout = setTimeout(() => {
          setTerminalLogs((prev) => [...prev, line]);
          updateTerminalHeight([...terminalLogsRef.current, line], "");
          scrollToBottom();
        }, index * 900);
        timeoutsRef.current.push(timeout);
      });
    });
  };

  const typeString = (
    content: string,
    setter: (value: string) => void,
    delay: number,
    onComplete?: () => void
  ) => {
    let index = 0;
    const interval = setInterval(() => {
      index += 1;
      setter(content.slice(0, index));
      if (setter === setTypedTerminalCommand) {
        updateTerminalHeight(terminalLogsRef.current, content.slice(0, index));
      }
      if (index >= content.length) {
        clearInterval(interval);
        const pause = setTimeout(() => {
          onComplete?.();
        }, 400);
        timeoutsRef.current.push(pause as unknown as NodeJS.Timeout);
      }
    }, delay);
    timeoutsRef.current.push(interval as unknown as NodeJS.Timeout);
  };

  const updateTerminalHeight = (logs: TerminalLine[], typing: string) => {
    const effectiveLineCount = logs.length + (typing ? 1 : 0);
    const targetHeight = Math.max(120, Math.min(260, 90 + effectiveLineCount * 20));
    setTerminalHeight((prev) => {
      if (Math.abs(prev - targetHeight) < 2) {
        return prev;
      }
      return prev < targetHeight ? targetHeight : Math.max(targetHeight, prev - 20);
    });
  };

  return (
    <>
      <div className="h-svh w-screen relative bg-[#0A0A0A]">
        <Navbar links={links} />
        <div className="absolute inset-0">
          <Scene />
          
          {showZoomHint && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 hidden md:flex flex-col items-center gap-3 pointer-events-none transition-opacity duration-500">
              <span className="text-[11px] uppercase tracking-[0.3em] text-white/40 font-mono">
               Zoom 
              </span>
              <div className="w-[1px] h-12 bg-white/30 animate-scroll-line"></div>
            </div>
          )}
        </div>
        <div className="absolute bottom-4 left-4 right-4 md:bottom-10 md:left-10 md:right-auto z-20 w-[calc(100vw-2rem)] md:w-auto max-w-full md:max-w-md">

          <h1 className="w-full md:w-[1000px] text-xl xs:text-2xl md:text-3xl flex flex-nowrap uppercase font-mono font-light tracking-tight mb-3 text-white whitespace-nowrap overflow-x-auto scrollbar-hide md:overflow-visible md:whitespace-normal">
            {title.split("Studio")[0]}{" "}
            <LineShadowText className="font-normal ml-2" shadowColor="white">
              Studio
            </LineShadowText>
            {version && (
              <div className="inline-flex group gap-x-1 text-[10px] md:text-[13px] ml-2 font-mono">
                <span className="text-white/50 group-hover:text-white transition-colors">[</span>
                <span className="text-white/70 text-[11px] md:text-[14px] lowercase">v {version}</span>
                <span className="text-white/50 group-hover:text-white transition-colors">]</span>
              </div>
            )}
            <div className="inline-flex group gap-x-1 text-[10px] md:text-[13px] ml-2 font-mono">
              <span className="text-white/50 group-hover:text-white transition-colors">[</span>
              <span className="text-white/70 text-[11px] md:text-[14px]">PUBLIC BETA</span>
              <span className="text-white/50 group-hover:text-white transition-colors">]</span>
            </div>
          </h1>

          <p className="font-mono uppercase text-[12.5px] text-white/50 mb-6">
            {description}
          </p>
          <div className="bg-black/20 backdrop-blur-sm border border-white/15 hover:border-white/20 transition-all duration-300 border-dashed rounded-none p-4 font-mono text-xs overflow-hidden">
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
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <span className="text-white/80">$</span>
              <code className="text-white text-xs whitespace-nowrap">pnpx better-auth-studio@latest start</code>
              <button
                onClick={() => {
                  setCopied(true)
                  navigator.clipboard.writeText('pnpx better-auth-studio@latest start')
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
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="w-4 h-4 text-white/50 hover:text-white transition-colors"
                    >
                      <path
                        d="M18 6h2v2h-2V6zm-2 4V8h2v2h-2zm-2 2V9h2v2h-2zm-2 2h2v-2h-2v2zm-2 2h2v-2h-2v2zm-2 0v2h2v-2H8zm-2-2h2v2H6v-2zm0 0H4v-2h2v2z"
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
                      <path d="M4 2h12v2H4v12H2V2h2zm4 4h12v16H8V6zm2 2v12h8V8h-8z" fill="currentColor" />
                    </svg>
                  )
                }

              </button>
            </div>
          </div>
        </div>

        <div className="hidden lg:block absolute bottom-6 right-6 lg:right-10 w-[420px] lg:w-[520px]">
          <div className="relative overflow-hidden border group hover:border-white/20 transition-all duration-300 border-white/15 border-dashed rounded-none bg-transparent backdrop-blur-2xl animate-[terminal-pop_0.6s_ease-out]">
            <div className="absolute inset-0 bg-linear-to-br from-transparent/20 via-transparent/5 to-transparent opacity-70 blur-3xl" />
            <div className="relative px-6 pt-4 pb-0 font-mono text-[12px] text-white">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.35em] text-white/60 mb-3">
                <span className="text-white/40 text-[10px]">
                  <span>[</span>
                  <span className="text-white/70 uppercase tracking-[0.25em] mx-1">Better Auth Studio</span>
                  <span>]</span>
                </span>
              </div>
              <div
                ref={containerRef}
                className="flex flex-col gap-1 overflow-y-auto pr-1 scrollbar-hide transition-all duration-500"
                style={{ height: terminalHeight }}
              >
                {typedTerminalCommand && (
                  <div className="flex items-start gap-2 whitespace-pre-wrap leading-relaxed text-white/80">
                    <span>{typedTerminalCommand}</span>
                    <span className="ml-1 inline-block h-4 w-[8px] bg-white/80 animate-cursor" />
                  </div>
                )}
                {terminalLogs.map((line, idx) => (
                  <div
                    key={`${line.text}-${idx}`}
                    className={`flex items-start gap-2 whitespace-pre-wrap leading-relaxed ${line.tone === "command"
                      ? "text-white/90"
                      : line.tone === "success"
                        ? "text-emerald-400"
                        : line.tone === "muted"
                          ? "text-white/40"
                          : "text-white/70"
                      }`}
                  >
                    <span>{line.text}</span>
                  </div>
                ))}
              </div>
              <div className="mx-auto mt-4 py-1 border-t border-dashed border-white/10 backdrop-blur-sm">
                <div className="flex items-center justify-between text-[9px] text-white/60 uppercase tracking-[0.22em]">
                  <div className="flex items-center space-x-3">
                    <span>Status: {terminalLogs.length === 0 ? "Idle" : "Live"}</span>
                    <span>Lines: {terminalLogs.length}</span>
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
      .animate-cursor {
        animation: cursor-blink 0.8s steps(1) infinite;
      }
      .animate-scroll-line {
        animation: scroll-line 2s ease-in-out infinite;
      }
      @keyframes scroll-line {
        0%, 100% {
          opacity: 0.3;
          transform: scaleY(1);
        }
        50% {
          opacity: 0.6;
          transform: scaleY(0.8);
          transform-origin: top;
        }
      }
    `}</style>
    </>
  );
}
