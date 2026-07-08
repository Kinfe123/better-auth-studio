"use client";

import { useEffect, useRef } from "react";

type Bounds = {
  height: number;
  width: number;
  x: number;
  y: number;
};

type Particle = {
  delay: number;
  homeX: number;
  homeY: number;
  size: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
};

type BetterAuthParticleLogoProps = {
  className?: string;
};

const BETTER_AUTH_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><path fill="#fff" d="M200 0h200v300H200V200h100V100H200zM0 0h100v100h100v100H100v100H0z"/></svg>`;
const BETTER_AUTH_SVG_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  BETTER_AUTH_SVG,
)}`;
const PARTICLE_COLOR = "rgb(232,232,232)";
const INTRO_DURATION = 3800;
const SPAWN_DELAY_RANGE = 1250;
const SPAWN_EDGE_PADDING_RATIO = 0.18;

function containRect(imageWidth: number, imageHeight: number, width: number, height: number) {
  const imageRatio = imageWidth / imageHeight;
  const boundsRatio = width / height;

  if (imageRatio > boundsRatio) {
    return {
      height: width / imageRatio,
      width,
      x: 0,
      y: (height - width / imageRatio) / 2,
    };
  }

  return {
    height,
    width: height * imageRatio,
    x: (width - height * imageRatio) / 2,
    y: 0,
  };
}

function shuffle<T>(items: T[]) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
}

function loadLogoImage() {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = BETTER_AUTH_SVG_URL;
  });
}

function getScreenEdgeSpawn(index: number, width: number, height: number) {
  const edge = index % 4;
  const padding = Math.max(56, Math.min(width, height) * SPAWN_EDGE_PADDING_RATIO);
  const drift = Math.random() * padding;

  if (edge === 0) {
    return { x: -padding - drift, y: Math.random() * height };
  }

  if (edge === 1) {
    return { x: width + padding + drift, y: Math.random() * height };
  }

  if (edge === 2) {
    return { x: Math.random() * width, y: -padding - drift };
  }

  return { x: Math.random() * width, y: height + padding + drift };
}

async function buildParticles(width: number, height: number, logoBounds: Bounds): Promise<Particle[]> {
  const image = await loadLogoImage();
  const offscreen = document.createElement("canvas");
  const context = offscreen.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return [];
  }

  offscreen.width = width;
  offscreen.height = height;
  context.clearRect(0, 0, width, height);

  const fit = containRect(
    image.naturalWidth || 400,
    image.naturalHeight || 300,
    logoBounds.width,
    logoBounds.height,
  );
  const scale = 0.8;
  const drawWidth = fit.width * scale;
  const drawHeight = fit.height * scale;
  const drawX = logoBounds.x + fit.x + (fit.width - drawWidth) / 2;
  const drawY = logoBounds.y + fit.y + (fit.height - drawHeight) / 2;

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);

  const pixels = context.getImageData(0, 0, width, height).data;
  const sampleGap = Math.max(4, Math.round(Math.min(logoBounds.width, logoBounds.height) / 38));
  const particleSize = Math.max(2.6, Math.min(6.4, sampleGap * 0.86));
  const points: Array<{ x: number; y: number }> = [];
  const sampleStartX = Math.max(0, Math.floor(logoBounds.x));
  const sampleStartY = Math.max(0, Math.floor(logoBounds.y));
  const sampleEndX = Math.min(width, Math.ceil(logoBounds.x + logoBounds.width));
  const sampleEndY = Math.min(height, Math.ceil(logoBounds.y + logoBounds.height));

  for (let y = sampleStartY; y < sampleEndY; y += sampleGap) {
    for (let x = sampleStartX; x < sampleEndX; x += sampleGap) {
      const alpha = pixels[(y * width + x) * 4 + 3];

      if (alpha > 28) {
        points.push({ x, y });
      }
    }
  }

  shuffle(points);

  return points.slice(0, 980).map((point, index) => {
    const spawn = getScreenEdgeSpawn(index, width, height);
    const dx = point.x - spawn.x;
    const dy = point.y - spawn.y;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
    const launchSpeed = 0.2 + Math.random() * 0.35;

    return {
      delay: Math.random() * SPAWN_DELAY_RANGE,
      homeX: point.x,
      homeY: point.y,
      size: particleSize,
      vx: (dx / distance) * launchSpeed,
      vy: (dy / distance) * launchSpeed,
      x: spawn.x,
      y: spawn.y,
    };
  });
}

export function BetterAuthParticleLogo({ className = "" }: BetterAuthParticleLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    let animationFrame = 0;
    let cancelled = false;
    let devicePixelRatio = 1;
    let introStartedAt = 0;
    let particles: Particle[] = [];
    let pointerRadius = 0;
    let version = 0;
    let viewHeight = 0;
    let viewWidth = 0;

    const pointer = {
      active: false,
      x: -10000,
      y: -10000,
    };

    const resize = async () => {
      const rect = container.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.round(window.innerWidth));
      const nextHeight = Math.max(1, Math.round(window.innerHeight));
      const logoBounds = {
        height: Math.max(1, Math.round(rect.height)),
        width: Math.max(1, Math.round(rect.width)),
        x: Math.round(rect.left),
        y: Math.round(rect.top),
      };

      viewWidth = nextWidth;
      viewHeight = nextHeight;
      pointerRadius = Math.min(logoBounds.width, logoBounds.height) * 0.32;
      devicePixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.round(nextWidth * devicePixelRatio);
      canvas.height = Math.round(nextHeight * devicePixelRatio);
      canvas.style.height = `${nextHeight}px`;
      canvas.style.left = `${Math.round(-rect.left)}px`;
      canvas.style.top = `${Math.round(-rect.top)}px`;
      canvas.style.width = `${nextWidth}px`;
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

      const currentVersion = version + 1;
      version = currentVersion;
      const nextParticles = await buildParticles(nextWidth, nextHeight, logoBounds);

      if (!cancelled && currentVersion === version) {
        introStartedAt = performance.now();
        particles = nextParticles;
      }
    };

    const draw = () => {
      const now = performance.now();

      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      context.clearRect(0, 0, viewWidth, viewHeight);
      context.globalCompositeOperation = "source-over";

      for (const particle of particles) {
        const introAge = now - introStartedAt - particle.delay;

        if (introAge <= 0) {
          continue;
        }

        const introProgress = Math.min(1, introAge / INTRO_DURATION);
        const easedIntro = introProgress * introProgress;
        const finishProgress = Math.max(0, (introProgress - 0.72) / 0.28);
        const finishEase = finishProgress * finishProgress;
        const visibility = Math.min(1, introAge / 1000);
        const homePull = 0.0012 + easedIntro * 0.01 + finishEase * 0.012;
        particle.vx += (particle.homeX - particle.x) * homePull;
        particle.vy += (particle.homeY - particle.y) * homePull;

        if (pointer.active) {
          const dx = particle.x - pointer.x;
          const dy = particle.y - pointer.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const radius = pointerRadius;

          if (distance > 0 && distance < radius) {
            const force = (1 - distance / radius) * 1.9;
            particle.vx += (dx / distance) * force;
            particle.vy += (dy / distance) * force;
          }
        }

        const damping = 0.93 - easedIntro * 0.065 - finishEase * 0.035;
        particle.vx *= damping;
        particle.vy *= damping;
        particle.x += particle.vx;
        particle.y += particle.vy;

        context.globalAlpha = visibility;
        context.fillStyle = PARTICLE_COLOR;
        context.beginPath();
        context.moveTo(particle.x, particle.y - particle.size / 2);
        context.lineTo(particle.x + particle.size / 2, particle.y + particle.size / 2);
        context.lineTo(particle.x - particle.size / 2, particle.y + particle.size / 2);
        context.closePath();
        context.fill();
      }

      context.globalAlpha = 1;

      animationFrame = requestAnimationFrame(draw);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.active = true;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    };

    const onPointerLeave = () => {
      pointer.active = false;
      pointer.x = -10000;
      pointer.y = -10000;
    };

    const resizeObserver = new ResizeObserver(() => {
      void resize();
    });

    resizeObserver.observe(container);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("resize", resize);
    void resize();
    animationFrame = requestAnimationFrame(draw);

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className={`relative h-full w-full ${className}`} ref={containerRef}>
      <canvas
        aria-label="Better Auth particle logo"
        className="pointer-events-none absolute block max-w-none"
        ref={canvasRef}
        role="img"
      />
    </div>
  );
}
