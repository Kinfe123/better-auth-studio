import {
  Bot,
  Box,
  HelpCircle,
  Laptop,
  Smartphone,
  Tablet,
  Terminal,
  Tv,
  type LucideIcon,
} from "lucide-react";
import { parseSessionDevice, type SessionDeviceCategory } from "../lib/session-device";
import { cn } from "../lib/utils";

interface SessionDeviceIconProps {
  userAgent?: string | null;
  className?: string;
  iconClassName?: string;
}

const categoryIcons: Record<SessionDeviceCategory, LucideIcon> = {
  desktop: Laptop,
  mobile: Smartphone,
  tablet: Tablet,
  tv: Tv,
  other: Box,
  unknown: HelpCircle,
};

export function SessionDeviceIcon({ userAgent, className, iconClassName }: SessionDeviceIconProps) {
  const deviceInfo = parseSessionDevice(userAgent);
  const DeviceIcon =
    deviceInfo.device.label === "Bot"
      ? Bot
      : deviceInfo.device.label === "Command-line client"
        ? Terminal
        : categoryIcons[deviceInfo.category];

  return (
    <span
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center border border-dashed border-white/15 bg-white/5 text-white/80",
        className,
      )}
      role="img"
      aria-label={deviceInfo.device.label}
      title={deviceInfo.device.label}
    >
      <DeviceIcon className={cn("h-3.5 w-3.5", iconClassName)} aria-hidden="true" />
    </span>
  );
}
