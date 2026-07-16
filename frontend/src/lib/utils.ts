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
  const normalizedImage = image?.trim();

  if (!normalizedImage) {
    return fallback || "";
  }

  if (normalizedImage.startsWith("data:image/") || normalizedImage.startsWith("blob:")) {
    return normalizedImage;
  }

  try {
    const imageUrl = new URL(normalizedImage, window.location.origin);
    if (imageUrl.protocol === "http:" || imageUrl.protocol === "https:") {
      return imageUrl.toString();
    }
  } catch {
    // Fall through to the provided fallback for malformed or unsupported URLs.
  }

  return fallback || "";
}
