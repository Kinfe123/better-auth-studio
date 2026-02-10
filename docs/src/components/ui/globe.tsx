"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Color } from "three";
import ThreeGlobe from "three-globe";
import { useThree, Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

const RING_PROPAGATION_SPEED = 3;
const aspect = 1.2;
const cameraZ = 300;

type Position = {
  order: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  arcAlt: number;
  color: string;
};

export type GlobeConfig = {
  pointSize?: number;
  globeColor?: string;
  showAtmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereAltitude?: number;
  emissive?: string;
  emissiveIntensity?: number;
  shininess?: number;
  polygonColor?: string;
  ambientLight?: string;
  directionalLeftLight?: string;
  directionalTopLight?: string;
  pointLight?: string;
  arcTime?: number;
  arcLength?: number;
  rings?: number;
  maxRings?: number;
  initialPosition?: { lat: number; lng: number };
  autoRotate?: boolean;
  autoRotateSpeed?: number;
};

export type GlobeCountries = {
  type: string;
  features: Array<{
    type?: string;
    properties?: Record<string, unknown>;
    geometry?: { type: string; coordinates: unknown };
  }>;
};

interface WorldProps {
  globeConfig: GlobeConfig;
  data: Position[];
  countries: GlobeCountries | null;
}

const defaultProps = {
  pointSize: 1,
  atmosphereColor: "#ffffff",
  showAtmosphere: true,
  atmosphereAltitude: 0.1,
  polygonColor: "rgba(240,240,240,0.95)",
  globeColor: "#0a0a0a",
  emissive: "#000000",
  emissiveIntensity: 0.1,
  shininess: 0.9,
  arcTime: 2000,
  arcLength: 0.9,
  rings: 1,
  maxRings: 3,
};

function Globe({ globeConfig, data, countries }: WorldProps) {
  const globeRef = useRef<ThreeGlobe | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const props = { ...defaultProps, ...globeConfig };

  useEffect(() => {
    if (!globeRef.current && groupRef.current) {
      globeRef.current = new ThreeGlobe();
      groupRef.current.add(globeRef.current as unknown as THREE.Object3D);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!globeRef.current || !isInitialized) return;

    const globeMaterial = globeRef.current.globeMaterial() as unknown as {
      color: Color;
      emissive: Color;
      emissiveIntensity: number;
      shininess: number;
    };
    globeMaterial.color = new Color(globeConfig.globeColor ?? props.globeColor);
    globeMaterial.emissive = new Color(globeConfig.emissive ?? props.emissive);
    globeMaterial.emissiveIntensity = globeConfig.emissiveIntensity ?? 0.1;
    globeMaterial.shininess = globeConfig.shininess ?? 0.9;
  }, [
    isInitialized,
    globeConfig.globeColor,
    globeConfig.emissive,
    globeConfig.emissiveIntensity,
    globeConfig.shininess,
  ]);

  useEffect(() => {
    if (!globeRef.current || !isInitialized) return;

    const features = (countries?.features ?? []).filter((f) => f?.geometry);
    globeRef.current
      .hexPolygonsData(features)
      .hexPolygonResolution(3)
      .hexPolygonMargin(0.25)
      .hexPolygonAltitude(0.02)
      .hexPolygonColor(() => "#ffffff")
      .showAtmosphere(props.showAtmosphere)
      .atmosphereColor(props.atmosphereColor)
      .atmosphereAltitude(props.atmosphereAltitude);

    if (!data?.length) {
      globeRef.current.arcsData([]).pointsData([]).ringsData([]);
      return;
    }

    const arcs = data;
    const points: Array<{ size: number; order: number; color: string; lat: number; lng: number }> =
      [];
    for (let i = 0; i < arcs.length; i++) {
      const arc = arcs[i];
      points.push({
        size: props.pointSize,
        order: arc.order,
        color: arc.color,
        lat: arc.startLat,
        lng: arc.startLng,
      });
      points.push({
        size: props.pointSize,
        order: arc.order,
        color: arc.color,
        lat: arc.endLat,
        lng: arc.endLng,
      });
    }

    const filteredPoints = points.filter(
      (v, i, a) => a.findIndex((v2) => v2.lat === v.lat && v2.lng === v.lng) === i,
    );

    globeRef.current
      .arcsData(data)
      .arcStartLat((d) => (d as Position).startLat)
      .arcStartLng((d) => (d as Position).startLng)
      .arcEndLat((d) => (d as Position).endLat)
      .arcEndLng((d) => (d as Position).endLng)
      .arcColor((e: unknown) => (e as Position).color)
      .arcAltitude((e: unknown) => (e as Position).arcAlt)
      .arcStroke(() => 0.28)
      .arcDashLength(props.arcLength)
      .arcDashInitialGap((e) => (e as Position).order)
      .arcDashGap(15)
      .arcDashAnimateTime(() => props.arcTime);

    globeRef.current
      .pointsData(filteredPoints)
      .pointColor((e) => (e as { color: string }).color)
      .pointsMerge(true)
      .pointAltitude(0)
      .pointRadius(2);

    globeRef.current
      .ringsData([])
      .ringColor(() => props.polygonColor)
      .ringMaxRadius(props.maxRings)
      .ringPropagationSpeed(RING_PROPAGATION_SPEED)
      .ringRepeatPeriod((props.arcTime * props.arcLength) / props.rings);
  }, [isInitialized, data, countries]);

  useEffect(() => {
    if (!globeRef.current || !isInitialized || !data?.length) return;

    const interval = setInterval(() => {
      if (!globeRef.current) return;
      const count = Math.floor((data.length * 4) / 5);
      const indices = new Set<number>();
      while (indices.size < count) {
        indices.add(Math.floor(Math.random() * data.length));
      }
      const ringsData = data
        .filter((_, i) => indices.has(i))
        .map((d) => ({ lat: d.startLat, lng: d.startLng, color: d.color }));
      globeRef.current.ringsData(ringsData);
    }, 2000);

    return () => clearInterval(interval);
  }, [isInitialized, data]);

  return <group ref={groupRef} />;
}

function WebGLRendererConfig() {
  const { gl, size } = useThree();
  useEffect(() => {
    gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    gl.setSize(size.width, size.height);
    gl.setClearColor(0x0a0a0a, 1);
  }, [gl, size]);
  return null;
}

export function World(props: WorldProps) {
  const { globeConfig } = props;
  return (
    <Canvas
      className="bg-transparent"
      camera={{ position: [0, 0, cameraZ], fov: 50, near: 180, far: 1800 }}
      gl={{ alpha: true, antialias: true }}
    >
      <WebGLRendererConfig />
      <ambientLight color={globeConfig.ambientLight ?? "#ffffff"} intensity={0.85} />
      <directionalLight
        color={globeConfig.directionalLeftLight ?? "#ffffff"}
        position={[-400, 100, 400]}
        intensity={0.9}
      />
      <directionalLight
        color={globeConfig.directionalTopLight ?? "#ffffff"}
        position={[-200, 500, 200]}
        intensity={0.9}
      />
      <pointLight
        color={globeConfig.pointLight ?? "#ffffff"}
        position={[-200, 500, 200]}
        intensity={0.8}
      />
      <Globe {...props} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minDistance={cameraZ}
        maxDistance={cameraZ}
        autoRotateSpeed={globeConfig.autoRotateSpeed ?? 0.5}
        autoRotate={globeConfig.autoRotate !== false}
        minPolarAngle={Math.PI / 3.5}
        maxPolarAngle={Math.PI - Math.PI / 3}
      />
    </Canvas>
  );
}

export function genRandomNumbers(min: number, max: number, count: number): number[] {
  const arr: number[] = [];
  while (arr.length < count) {
    const r = Math.floor(Math.random() * (max - min)) + min;
    if (arr.indexOf(r) === -1) arr.push(r);
  }
  return arr;
}
