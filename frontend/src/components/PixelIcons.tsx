import { Clock1, LucideLoader, LucideTrash, SendIcon } from 'lucide-react';
import type React from 'react';
import { cn } from '@/lib/utils';

interface IconProps {
  className?: string;
  size?: number;
}

export const Plus: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path d="M11 4h2v7h7v2h-7v7h-2v-7H4v-2h7V4z" fill="currentColor" />
  </svg>
);
export const Monitor: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path d="M20 3H2v14h8v2H8v2h8v-2h-2v-2h8V3h-2zm-6 12H4V5h16v10h-6z" fill="currentColor" />
  </svg>
);

export const Layout: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path
      d="M3 3h8v10H3V3zm2 2v6h4V5H5zm8-2h8v6h-8V3zm2 2v2h4V5h-4zm-2 6h8v10h-8V11zm2 2v6h4v-6h-4zM3 15h8v6H3v-6zm2 2v2h4v-2H5z"
      fill="currentColor"
    />
  </svg>
);

export const ChevronDown: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path
      d="M7 8H5v2h2v2h2v2h2v2h2v-2h2v-2h2v-2h2V8h-2v2h-2v2h-2v2h-2v-2H9v-2H7V8z"
      fill="currentColor"
    />
  </svg>
);

export const ChevronLeft: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path
      d="M16 5v2h-2V5h2zm-4 4V7h2v2h-2zm-2 2V9h2v2h-2zm0 2H8v-2h2v2zm2 2v-2h-2v2h2zm0 0h2v2h-2v-2zm4 4v-2h-2v2h2z"
      fill="currentColor"
    />
  </svg>
);

export const ChevronRight: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path
      d="M8 5v2h2V5H8zm4 4V7h-2v2h2zm2 2V9h-2v2h2zm0 2h2v-2h-2v2zm-2 2v-2h2v2h-2zm0 0h-2v2h2v-2zm-4 4v-2h2v2H8z"
      fill="currentColor"
    />
  </svg>
);

export const ChevronUp: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path
      d="M7 16H5v-2h2v-2h2v-2h2V8h2v2h2v2h2v2h2v2h-2v-2h-2v-2h-2v-2h-2v2H9v2H7v2z"
      fill="currentColor"
    />
  </svg>
);

export const Check: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path
      d="M18 6h2v2h-2V6zm-2 4V8h2v2h-2zm-2 2v-2h2v2h-2zm-2 2h2v-2h-2v2zm-2 2h2v-2h-2v2zm-2 0v2h2v-2H8zm-2-2h2v2H6v-2zm0 0H4v-2h2v2z"
      fill="currentColor"
    />
  </svg>
);

export const Calendar: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path
      d="M15 2h2v2h4v18H3V4h4V2h2v2h6V2zM9 6H5v2h14V6H9zm-4 4v10h14V10H5zm2 2h8v2H7v-2zm4 6v-2H7v2h4z"
      fill="currentColor"
    />
  </svg>
);

export const Building: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path
      d="M2 2h14v4h6v16H2V2zm18 6h-4v2h2v2h-2v2h2v2h-2v2h2v2h2V8zm-6-4H4v16h2v-2h6v2h2V4zM6 6h2v2H6V6zm6 0h-2v2h2V6zm-6 4h2v2H6v-2zm6 0h-2v2h2v-2zm-6 4h2v2H6v-2zm6 0h-2v2h2v-2z"
      fill="currentColor"
    />
  </svg>
);

export const ArrowDown: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path
      d="M11 4h2v12h2v2h-2v2h-2v-2H9v-2h2V4zM7 14v2h2v-2H7zm0 0v-2H5v2h2zm10 0v2h-2v-2h2zm0 0v-2h2v2h-2z"
      fill="currentColor"
    />
  </svg>
);

export const ArrowLeft: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path
      d="M20 11v2H8v2H6v-2H4v-2h2V9h2v2h12zM10 7H8v2h2V7zm0 0h2V5h-2v2zm0 10H8v-2h2v2zm0 0h2v2h-2v-2z"
      fill="currentColor"
    />
  </svg>
);

export const ArrowRight: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path
      d="M4 11v2h12v2h2v-2h2v-2h-2V9h-2v2H4zm10-4h2v2h-2V7zm0 0h-2V5h2v2zm0 10h2v-2h-2v2zm0 0h-2v2h2v-2z"
      fill="currentColor"
    />
  </svg>
);

export const Analytics: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path
      d="M3 3h18v18H3V3zm16 2H5v14h14V5zM7 12h2v5H7v-5zm10-5h-2v10h2V7zm-6 3h2v2h-2v-2zm2 4h-2v3h2v-3z"
      fill="currentColor"
    />
  </svg>
);

export const Command: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path
      d="M4 2H2v8h2V2zm16 0h2v8h-2V2zm-6 6h-4V2H4v2h4v4H4v2h4v4H4v2h4v4H4v2h6v-6h4v6h2v-6h4v-2h-4v-4h4V8h-4V2h-2v6zm-4 6v-4h4v4h-4zM20 2h-4v2h4V2zM2 14h2v8H2v-8zm14 6h4v2h-4v-2zm6-6h-2v8h2v-8z"
      fill="currentColor"
    />
  </svg>
);

export const Mail: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path
      d="M22 4H2v16h20V4zM4 18V6h16v12H4zM8 8H6v2h2v2h2v2h4v-2h2v-2h2V8h-2v2h-2v2h-4v-2H8V8z"
      fill="currentColor"
    />
  </svg>
);

export const Search: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path
      d="M6 2h8v2H6V2zM4 6V4h2v2H4zm0 8H2V6h2v8zm2 2H4v-2h2v2zm8 0v2H6v-2h8zm2-2h-2v2h2v2h2v2h2v2h2v-2h-2v-2h-2v-2h-2v-2zm0-8h2v8h-2V6zm0 0V4h-2v2h2z"
      fill="currentColor"
    />
  </svg>
);

export const Trending: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path
      d="M3 4h2v14h16v2H3V4zm6 10H7v2h2v-2zm2-2v2H9v-2h2zm2 0v-2h-2v2h2zm2 0h-2v2h2v-2zm2-2h-2v2h2v-2zm2-2v2h-2V8h2zm0 0V6h2v2h-2z"
      fill="currentColor"
    />
  </svg>
);

export const User: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path
      d="M15 2H9v2H7v6h2V4h6V2zm0 8H9v2h6v-2zm0-6h2v6h-2V4zM4 16h2v-2h12v2H6v4h12v-4h2v6H4v-6z"
      fill="currentColor"
    />
  </svg>
);

export const Users: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path
      d="M11 0H5v2H3v6h2v2h6V8H5V2h6V0zm0 2h2v6h-2V2zM0 14h2v4h12v2H0v-6zm2 0h12v-2H2v2zm14 0h-2v6h2v-6zM15 0h4v2h-4V0zm4 8h-4v2h4V8zm0-6h2v6h-2V2zm5 12h-2v4h-4v2h6v-6zm-6-2h4v2h-4v-2z"
      fill="currentColor"
    />
  </svg>
);

// Additional icons that might be needed
export const X: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path
      d="M5 5h2v2H5V5zm4 4H7V7h2v2zm2 2H9V9h2v2zm2 0h-2v2H9v2H7v2H5v2h2v-2h2v-2h2v-2h2v2h2v2h2v2h2v-2h-2v-2h-2v-2h-2v-2zm2-2v2h-2V9h2zm2-2v2h-2V7h2zm0 0V5h2v2h-2z"
      fill="currentColor"
    />
  </svg>
);

export const Edit: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path
      d="M18 2h-2v2h2v2h-2v2h-2v-2h-2V4h2V2H8v2H6v2H4v2H2v12h12v-2h2v-2h2v-2h2V8h-2V6h-2V4h-2V2zm0 8v2h-2v-2h2zm-2 4v2H4V8h2v2h2v2h2v2h2v2zm0-6V8h2v2h-2z"
      fill="currentColor"
    />
  </svg>
);

export const Clock: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <Clock1 size={size} className={cn(className)} />
);

export const Database: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path
      d="M2 4h20v4H2V4zm18 2v2H4V6h16zm0 6H2v4h18v-4zm-2 2v2H4v-2h14zM2 16h20v4H2v-4zm18 2v2H4v-2h16z"
      fill="currentColor"
    />
  </svg>
);

export const Globe: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 4c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 6c1.38 0 2.5-1.12 2.5-2.5S13.38 11.5 12 11.5 9.5 12.62 9.5 14 10.62 16.5 12 16.5z"
      fill="currentColor"
    />
  </svg>
);

export const UserMinus: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path
      d="M15 2H9v2H7v6h2V4h6V2zm0 8H9v2h6v-2zm0-6h2v6h-2V4zM4 16h2v-2h8v2H6v4h8v-4h2v6H4v-6zm10-4h-2v2h2v-2z"
      fill="currentColor"
    />
  </svg>
);

export const UserPlus: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path
      d="M15 2H9v2H7v6h2V4h6V2zm0 8H9v2h6v-2zm0-6h2v6h-2V4zM4 16h2v-2h8v2H6v4h8v-4h2v6H4v-6zm12-6h-2v2h2v2h2v-2h-2v-2z"
      fill="currentColor"
    />
  </svg>
);

export const Ban: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.57.46-3.03 1.24-4.26L16.26 18.76C15.03 19.54 13.57 20 12 20zm6.76-3.74L7.74 5.24C8.97 4.46 10.43 4 12 4c4.41 0 8 3.59 8 8 0 1.57-.46 3.03-1.24 4.26z"
      fill="currentColor"
    />
  </svg>
);

export const Loader: React.FC<IconProps> = (props) => (
  <LucideLoader {...props} className="w-4 h-4 animate-spin" />
);

export const Phone: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path d="M6 2h12v2H6V2zm0 2v16h12V4H6zm8 2H10v2h4V6zm-4 4h4v8h-4v-8z" fill="currentColor" />
  </svg>
);

export const HashIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path
      d="M8 4h2v4h4V4h2v4h4v2h-4v4h4v2h-4v4h-2v-4H8v4H6v-4H2v-2h4V8H2V6h4V4zm2 6v4h4v-4h-4z"
      fill="currentColor"
    />
  </svg>
);

export const Building2: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <Building className={className} size={size} />
);

export const ArrowUpRight: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path
      d="M18 4h2v2h-2v2h-2v-2h2V4zm-4 4h2v2h-2V8zm-2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm-2 2h2v2H6v-2zm0 0H4v-2h2v2z"
      fill="currentColor"
    />
  </svg>
);

export const BarChart3: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <Analytics className={className} size={size} />
);

export const Copy: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path d="M4 2h12v2H4v12H2V2h2zm4 4h12v16H8V6zm2 2v12h8V8h-8z" fill="currentColor" />
  </svg>
);

export const Settings: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path
      d="M12 2h2v2h-2V2zm-2 4H8v2H6v2h2v2h2v-2h2V8h-2V6zm6 0h-2v2h2V6zm2 0h2v2h-2V6zm-6 8h-2v-2h2v2zm-4 0H6v-2h2v2zm-4 0H2v-2h2v2zm8 4h-2v-2h2v2zm4 0h2v-2h-2v2zm-6 2h2v2h-2v-2zm4 0h2v2h-2v-2z"
      fill="currentColor"
    />
  </svg>
);

export const Shield: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path
      d="M12 2h2v2h-2V2zm-2 2H8v2H6v2H4v8h2v2h2v2h8v-2h2v-2h2v-8h-2V6h-2V4h-2V2h-2v2zm0 2v12h8V6h-8z"
      fill="currentColor"
    />
  </svg>
);

export const AlertTriangle: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path
      d="M12 2h2v2h-2V2zm-2 4h6v2h-2v6h-2V8H8V6zm-4 8h12v2H4v-2zm0 4h12v2H4v-2z"
      fill="currentColor"
    />
  </svg>
);

export const Trash2: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <LucideTrash className={cn(className, 'w-4 h-4')} size={size} />
);

export const Send: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <SendIcon className={cn(className, 'w-4 h-4')} size={size} />
);

export const CheckCircle: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-5l6-6-1.41-1.41L11 12.17l-2.59-2.58L7 10.59l4 4z"
      fill="currentColor"
    />
  </svg>
);

export const Zap: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path
      d="M12 1h2v8h8v4h-2v-2h-8V5h-2V1zM8 7V5h2v2H8zM6 9V7h2v2H6zm-2 2V9h2v2H4zm10 8v2h-2v2h-2v-8H2v-4h2v2h8v6h2zm2-2v2h-2v-2h2zm2-2v2h-2v-2h2zm0 0h2v-2h-2v2z"
      fill="currentColor"
    />
  </svg>
);

export const DollarSign: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    width={size}
    height={size}
  >
    <path d="M11 2h2v4h2v2h-2v2h4v2h-4v6h4v2h-6v-4h-2v-2h2V8H9V6h2V2z" fill="currentColor" />
  </svg>
);

export const StudioLogo: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 288 180"
    className={className}
    width={size}
    height={size}
    fill="currentColor"
  >
    <g transform="translate(0,180) scale(0.01,-0.01)">
      <path d="M12559 12056 c-115 -32 -220 -116 -276 -222 -24 -46 -118 -387 -424 -1554 l-393 -1495 0 -105 0 -105 443 -1175 c243 -646 453 -1194 466 -1216 67 -114 187 -197 325 -224 54 -11 3296 74 3412 89 45 6 102 22 135 37 70 33 161 122 196 190 53 105 1345 2921 1358 2959 19 58 17 208 -4 276 -9 32 -34 82 -54 112 -37 55 -1526 1837 -1612 1930 -45 49 -120 96 -181 116 -49 15 -3220 401 -3289 400 -31 0 -77 -7 -102 -13z m542 -726 c269 -447 336 -543 483 -700 68 -73 140 -160 160 -193 59 -100 140 -377 122 -422 -3 -9 -18 -15 -37 -15 -27 0 -46 14 -119 88 -158 159 -194 220 -279 480 -66 199 -128 329 -366 767 -252 463 -246 462 36 -5z m1104 204 c459 -80 783 -345 896 -735 l22 -75 76 -36 c87 -41 263 -157 368 -241 81 -66 156 -148 236 -259 l55 -77 35 52 c83 124 225 244 352 296 52 22 75 26 175 26 109 0 119 -2 182 -32 37 -17 87 -47 112 -65 l44 -35 -22 -65 c-28 -83 -61 -126 -139 -181 -125 -88 -356 -147 -578 -147 -72 0 -115 -5 -135 -14 -107 -54 -434 -36 -754 40 -405 96 -899 322 -1166 535 -63 50 -134 135 -134 160 0 8 -25 34 -56 59 -79 63 -235 228 -284 301 -86 125 -130 265 -116 362 l7 46 87 27 c82 25 237 58 312 67 95 11 341 6 425 -9z m-1594 -773 c121 -126 213 -348 280 -676 12 -60 28 -119 35 -130 18 -28 60 -200 81 -335 28 -178 25 -682 -5 -875 -38 -244 -103 -469 -159 -552 -14 -20 -38 -80 -53 -133 -107 -358 -254 -606 -408 -688 -33 -18 -67 -32 -75 -32 -19 0 -33 41 -48 140 -12 82 -6 183 17 260 16 55 93 174 151 234 53 55 183 137 281 176 81 32 82 33 67 54 -163 225 -246 535 -232 871 l7 151 -56 55 c-117 114 -204 269 -251 447 -23 85 -26 117 -26 257 0 129 4 178 21 251 42 180 107 327 218 497 35 53 69 97 76 97 7 0 42 -31 79 -69z m3224 -1602 c169 -23 332 -82 372 -133 10 -12 56 -40 103 -61 305 -138 490 -360 556 -670 43 -205 -6 -527 -112 -737 -38 -75 -165 -169 -293 -216 -129 -48 -302 -25 -420 54 -69 47 -168 148 -223 229 l-43 63 -82 -79 c-112 -107 -276 -227 -397 -290 -55 -28 -103 -54 -105 -55 -2 -2 9 -32 24 -66 47 -105 66 -178 72 -283 6 -112 -5 -167 -58 -283 -61 -135 -237 -277 -429 -346 -133 -48 -195 -57 -322 -45 -305 30 -560 139 -738 318 -128 128 -201 263 -241 442 -18 81 -20 117 -16 253 3 122 1 167 -9 192 -54 130 62 465 253 732 364 506 995 883 1635 976 115 17 370 20 473 5z m-2839 -1706 c-4 -16 -58 -197 -121 -403 -109 -360 -136 -454 -185 -640 -56 -214 -73 -250 -116 -250 -44 0 -42 74 7 185 45 104 177 465 335 913 72 204 96 265 80 195z m-148 -1455 c2 -12 -5 -19 -23 -24 -34 -8 -53 9 -35 31 17 20 54 16 58 -7z" />
    </g>
  </svg>
);
