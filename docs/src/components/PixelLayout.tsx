import { ReactNode } from "react";
import Navigation from "./Navigation";

interface PixelLayoutProps {
  children: ReactNode;
  currentPage?: string;
  title: string;
  description: string;
}

export default function PixelLayout({
  children,
  currentPage,
  title,
  description,
}: PixelLayoutProps) {
  return (
    <div
      className="min-h-screen bg-black text-white"
      style={{ fontFamily: "var(--font-geist-mono)" }}
    >
      <Navigation currentPage={currentPage} />

      <div className="relative h-screen flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-200/[7%] to-black">
          <div className="absolute inset-0 opacity-5">
            <div
              className="h-full w-full"
              style={{
                backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
                backgroundSize: "20px 20px",
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-light tracking-tight mb-4 text-white">
              {title}
            </h1>
            <p className="text-sm uppercase md:text-base font-light tracking-tight text-white/50 max-w-2xl mx-auto">
              {description}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 -mt-20">
        <div className="max-w-6xl mx-auto px-6 pb-20">{children}</div>
      </div>
    </div>
  );
}
