import { type ReactNode } from "react";

interface OverviewSlotCardProps {
  children: ReactNode;
  className?: string;
}

export function OverviewSlotCard({ children, className = "" }: OverviewSlotCardProps) {
  return (
    <div
      className={`bg-gradient-to-b from-white/[4%] to-white/[2.5%] border border-white/10 rounded-none p-4 md:p-6 relative h-full flex flex-col overflow-hidden ${className}`}
    >
      <div className="absolute top-0 left-0 w-[12px] h-[0.5px] bg-white/20" />
      <div className="absolute top-0 left-0 w-[0.5px] h-[12px] bg-white/20" />
      <div className="absolute top-0 right-0 w-[12px] h-[0.5px] bg-white/20" />
      <div className="absolute top-0 right-0 w-[0.5px] h-[12px] bg-white/20" />
      <div className="absolute bottom-0 left-0 w-[12px] h-[0.5px] bg-white/20" />
      <div className="absolute bottom-0 left-0 w-[0.5px] h-[12px] bg-white/20" />
      <div className="absolute bottom-0 right-0 w-[12px] h-[0.5px] bg-white/20" />
      <div className="absolute bottom-0 right-0 w-[0.5px] h-[12px] bg-white/20" />
      <div className="flex-1 min-h-0 flex flex-col pt-4 overflow-hidden">{children}</div>
    </div>
  );
}
