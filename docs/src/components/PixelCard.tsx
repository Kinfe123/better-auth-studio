import { ReactNode } from "react";

interface PixelCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'code' | 'highlight';
}

export default function PixelCard({ children, className = '', variant = 'default' }: PixelCardProps) {
  const baseClasses = "border border-white/20 bg-black/50 backdrop-blur-sm relative";
  
  const variantClasses = {
    default: "p-6 rounded-none",
    code: "px-4 py-2.5 rounded-none bg-black border-white/15 overflow-hidden",
    highlight: "p-6 rounded-none border-white/20 bg-white/[2%] backdrop-blur-md"
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      <div 
        className="absolute inset-0 pointer-events-none opacity-50 mix-blend-overlay"
        style={{
          backgroundImage: 'url(/shades.png)',
          backgroundRepeat: 'repeat',
          backgroundSize: 'auto'
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
