// @ts-nocheck
"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Geometry, Base, Subtraction} from '@react-three/csg'
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Bloom, N8AO, SMAA, EffectComposer } from '@react-three/postprocessing'
import { useRef } from "react";
import { Mesh } from "three";
import { KernelSize } from "postprocessing";

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

interface HeroProps {
  title: string;
  description: string;
  links: Array<{ name: string; href: string }>;
}

export const Hero: React.FC<HeroProps> = ({ title, description, links }) => {
  return (
    <div className="h-svh w-screen relative bg-[#0A0A0A]">
      <Navbar links={links} />
      <div className="absolute inset-0">
        <Scene />
      </div>
      <div className="absolute bottom-4 left-4 md:bottom-10 md:left-10 z-20 max-w-md">
        <h1 className="text-2xl md:text-3xl font-light tracking-tight mb-3 text-white">
            {title}
        </h1>
        <p className="font-mono text-xs md:text-sm leading-relaxed font-light tracking-tight text-white/50 mb-6">
            {description}
        </p>
        <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-none p-4 font-mono text-xs">
          <div className="text-white/70 mb-2">Install Better Auth Studio</div>
          <div className="flex items-center gap-2">
            <span className="text-white/80">$</span>
            <code className="text-white text-xs">npx better-auth-studio@latest</code>
            <button 
              onClick={() => navigator.clipboard.writeText('npx better-auth-studio@latest')}
              className="ml-2 text-white/50 hover:text-white transition-colors"
              title="Copy to clipboard"
            >
              📋
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
