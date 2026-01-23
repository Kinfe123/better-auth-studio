import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBasePath(): string {
  return (window as any).__STUDIO_CONFIG__?.basePath || "";
}

export function assetPath(path: string): string {
  const basePath = getBasePath();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${cleanPath}`;
}

export function getImageSrc(image: string | null | undefined, fallback?: string): string {
  if (!image) {
    return fallback || "";
  }

  if (image.startsWith("data:image/")) {
    return image;
  }

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return fallback || "";
}
