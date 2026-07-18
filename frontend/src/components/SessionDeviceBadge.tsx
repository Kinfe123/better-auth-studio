import { parseSessionDevice } from "../lib/session-device";
import { cn } from "../lib/utils";
import { SessionDeviceIcon } from "./SessionDeviceIcon";

interface SessionDeviceBadgeProps {
  userAgent?: string | null;
  showMeta?: boolean;
  className?: string;
}

export function SessionDeviceBadge({
  userAgent,
  showMeta = false,
  className,
}: SessionDeviceBadgeProps) {
  const deviceInfo = parseSessionDevice(userAgent);
  const osLabel =
    deviceInfo.os.label === "Unknown"
      ? null
      : [deviceInfo.os.label, deviceInfo.os.version].filter(Boolean).join(" ");
  const browserLabel =
    deviceInfo.browser.label === "Unknown"
      ? null
      : [deviceInfo.browser.label, deviceInfo.browser.version].filter(Boolean).join(" ");
  const meta = [
    deviceInfo.model !== deviceInfo.device.label ? deviceInfo.model : null,
    osLabel,
    browserLabel,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={cn("inline-flex min-w-0 items-center gap-2", className)}
      data-device-category={deviceInfo.category}
      title={deviceInfo.rawUserAgent || "No user agent recorded"}
    >
      <SessionDeviceIcon userAgent={userAgent} decorative />
      <span className="min-w-0 leading-tight">
        <span className="block truncate font-mono text-[10px] uppercase text-white/90">
          {deviceInfo.device.label}
        </span>
        {showMeta && meta && (
          <span className="mt-0.5 block truncate font-mono text-[9px] uppercase text-gray-500">
            {meta}
          </span>
        )}
      </span>
    </div>
  );
}
