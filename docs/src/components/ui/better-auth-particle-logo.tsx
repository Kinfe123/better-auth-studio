"use client";

import { useEffect, useRef } from "react";

type Particle = {
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

async function buildParticles(width: number, height: number): Promise<Particle[]> {
  const image = await loadLogoImage();
  const offscreen = document.createElement("canvas");
  const context = offscreen.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return [];
  }

  offscreen.width = width;
  offscreen.height = height;
  context.clearRect(0, 0, width, height);

  const fit = containRect(image.naturalWidth || 400, image.naturalHeight || 300, width, height);
  const scale = 0.8;
  const drawWidth = fit.width * scale;
  const drawHeight = fit.height * scale;
  const drawX = fit.x + (fit.width - drawWidth) / 2;
  const drawY = fit.y + (fit.height - drawHeight) / 2;

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);

  const pixels = context.getImageData(0, 0, width, height).data;
  const sampleGap = Math.max(4, Math.round(Math.min(width, height) / 38));
  const particleSize = Math.max(2.6, Math.min(6.4, sampleGap * 0.86));
  const points: Array<{ x: number; y: number }> = [];

  for (let y = 0; y < height; y += sampleGap) {
    for (let x = 0; x < width; x += sampleGap) {
      const alpha = pixels[(y * width + x) * 4 + 3];

      if (alpha > 28) {
        points.push({ x, y });
      }
    }
  }

  shuffle(points);

  return points.slice(0, 980).map((point) => ({
    homeX: point.x,
    homeY: point.y,
    size: particleSize,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    x: width * (0.08 + Math.random() * 0.84),
    y: height * (0.12 + Math.random() * 0.76),
  }));
}

export function BetterAuthParticleLogo({ className = "" }: BetterAuthParticleLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    let animationFrame = 0;
    let cancelled = false;
    let devicePixelRatio = 1;
    let particles: Particle[] = [];
    let version = 0;
    let viewHeight = 0;
    let viewWidth = 0;

    const pointer = {
      active: false,
      x: -10000,
      y: -10000,
    };

    const resize = async () => {
      const rect = canvas.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.round(rect.width));
      const nextHeight = Math.max(1, Math.round(rect.height));

      viewWidth = nextWidth;
      viewHeight = nextHeight;
      devicePixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.round(nextWidth * devicePixelRatio);
      canvas.height = Math.round(nextHeight * devicePixelRatio);
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

      const currentVersion = version + 1;
      version = currentVersion;
      const nextParticles = await buildParticles(nextWidth, nextHeight);

      if (!cancelled && currentVersion === version) {
        particles = nextParticles;
      }
    };

    const draw = () => {
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      context.clearRect(0, 0, viewWidth, viewHeight);
      context.globalCompositeOperation = "source-over";

      for (const particle of particles) {
        const homePull = 0.014;
        particle.vx += (particle.homeX - particle.x) * homePull;
        particle.vy += (particle.homeY - particle.y) * homePull;

        if (pointer.active) {
          const dx = particle.x - pointer.x;
          const dy = particle.y - pointer.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const radius = Math.min(viewWidth, viewHeight) * 0.32;

          if (distance > 0 && distance < radius) {
            const force = (1 - distance / radius) * 1.9;
            particle.vx += (dx / distance) * force;
            particle.vy += (dy / distance) * force;
          }
        }

        particle.vx *= 0.86;
        particle.vy *= 0.86;
        particle.x += particle.vx;
        particle.y += particle.vy;

        context.fillStyle = PARTICLE_COLOR;
        context.beginPath();
        context.moveTo(particle.x, particle.y - particle.size / 2);
        context.lineTo(particle.x + particle.size / 2, particle.y + particle.size / 2);
        context.lineTo(particle.x - particle.size / 2, particle.y + particle.size / 2);
        context.closePath();
        context.fill();
      }

      animationFrame = requestAnimationFrame(draw);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.active = true;
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    };

    const onPointerLeave = () => {
      pointer.active = false;
      pointer.x = -10000;
      pointer.y = -10000;
    };

    const resizeObserver = new ResizeObserver(() => {
      void resize();
    });

    resizeObserver.observe(canvas);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    void resize();
    animationFrame = requestAnimationFrame(draw);

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <canvas
      aria-label="Better Auth particle logo"
      className={`block h-full w-full ${className}`}
      ref={canvasRef}
      role="img"
    />
  );
}
