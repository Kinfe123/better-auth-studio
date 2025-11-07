import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const Plus: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M11 4h2v7h7v2h-7v7h-2v-7H4v-2h7V4z" fill="currentColor"/>
  </svg>
);

export const Monitor: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M20 3H2v14h8v2H8v2h8v-2h-2v-2h8V3h-2zm-6 12H4V5h16v10h-6z" fill="currentColor"/>
  </svg>
);

export const Layout: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M3 3h8v10H3V3zm2 2v6h4V5H5zm8-2h8v6h-8V3zm2 2v2h4V5h-4zm-2 6h8v10h-8V11zm2 2v6h4v-6h-4zM3 15h8v6H3v-6zm2 2v2h4v-2H5z" fill="currentColor"/>
  </svg>
);

export const ChevronDown: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M7 8H5v2h2v2h2v2h2v2h2v-2h2v-2h2v-2h2V8h-2v2h-2v2h-2v2h-2v-2H9v-2H7V8z" fill="currentColor"/>
  </svg>
);

export const ChevronLeft: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M16 5v2h-2V5h2zm-4 4V7h2v2h-2zm-2 2V9h2v2h-2zm0 2H8v-2h2v2zm2 2v-2h-2v2h2zm0 0h2v2h-2v-2zm4 4v-2h-2v2h2z" fill="currentColor"/>
  </svg>
);

export const ChevronRight: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M8 5v2h2V5H8zm4 4V7h-2v2h2zm2 2V9h-2v2h2zm0 2h2v-2h-2v2zm-2 2v-2h2v2h-2zm0 0h-2v2h2v-2zm-4 4v-2h2v2H8z" fill="currentColor"/>
  </svg>
);

export const ChevronUp: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M7 16H5v-2h2v-2h2v-2h2V8h2v2h2v2h2v2h2v2h-2v-2h-2v-2h-2v-2h-2v2H9v2H7v2z" fill="currentColor"/>
  </svg>
);

export const Check: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M18 6h2v2h-2V6zm-2 4V8h2v2h-2zm-2 2v-2h2v2h-2zm-2 2h2v-2h-2v2zm-2 2h2v-2h-2v2zm-2 0v2h2v-2H8zm-2-2h2v2H6v-2zm0 0H4v-2h2v2z" fill="currentColor"/>
  </svg>
);

export const Calendar: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M15 2h2v2h4v18H3V4h4V2h2v2h6V2zM9 6H5v2h14V6H9zm-4 4v10h14V10H5zm2 2h8v2H7v-2zm4 6v-2H7v2h4z" fill="currentColor"/>
  </svg>
);

export const Building: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M2 2h14v4h6v16H2V2zm18 6h-4v2h2v2h-2v2h2v2h-2v2h2v2h2V8zm-6-4H4v16h2v-2h6v2h2V4zM6 6h2v2H6V6zm6 0h-2v2h2V6zm-6 4h2v2H6v-2zm6 0h-2v2h2v-2zm-6 4h2v2H6v-2zm6 0h-2v2h2v-2z" fill="currentColor"/>
  </svg>
);

export const ArrowDown: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M11 4h2v12h2v2h-2v2h-2v-2H9v-2h2V4zM7 14v2h2v-2H7zm0 0v-2H5v2h2zm10 0v2h-2v-2h2zm0 0v-2h2v2h-2z" fill="currentColor"/>
  </svg>
);

export const ArrowLeft: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M20 11v2H8v2H6v-2H4v-2h2V9h2v2h12zM10 7H8v2h2V7zm0 0h2V5h-2v2zm0 10H8v-2h2v2zm0 0h2v2h-2v-2z" fill="currentColor"/>
  </svg>
);

export const ArrowRight: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M4 11v2h12v2h2v-2h2v-2h-2V9h-2v2H4zm10-4h2v2h-2V7zm0 0h-2V5h2v2zm0 10h2v-2h-2v2zm0 0h-2v2h2v-2z" fill="currentColor"/>
  </svg>
);

export const Analytics: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M3 3h18v18H3V3zm16 2H5v14h14V5zM7 12h2v5H7v-5zm10-5h-2v10h2V7zm-6 3h2v2h-2v-2zm2 4h-2v3h2v-3z" fill="currentColor"/>
  </svg>
);

export const Command: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M4 2H2v8h2V2zm16 0h2v8h-2V2zm-6 6h-4V2H4v2h4v4H4v2h4v4H4v2h4v4H4v2h6v-6h4v6h2v-6h4v-2h-4v-4h4V8h-4V2h-2v6zm-4 6v-4h4v4h-4zM20 2h-4v2h4V2zM2 14h2v8H2v-8zm14 6h4v2h-4v-2zm6-6h-2v8h2v-8z" fill="currentColor"/>
  </svg>
);

export const Mail: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M22 4H2v16h20V4zM4 18V6h16v12H4zM8 8H6v2h2v2h2v2h4v-2h2v-2h2V8h-2v2h-2v2h-4v-2H8V8z" fill="currentColor"/>
  </svg>
);

export const Search: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M6 2h8v2H6V2zM4 6V4h2v2H4zm0 8H2V6h2v8zm2 2H4v-2h2v2zm8 0v2H6v-2h8zm2-2h-2v2h2v2h2v2h2v2h2v-2h-2v-2h-2v-2h-2v-2zm0-8h2v8h-2V6zm0 0V4h-2v2h2z" fill="currentColor"/>
  </svg>
);

export const Trending: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M3 4h2v14h16v2H3V4zm6 10H7v2h2v-2zm2-2v2H9v-2h2zm2 0v-2h-2v2h2zm2 0h-2v2h2v-2zm2-2h-2v2h2v-2zm2-2v2h-2V8h2zm0 0V6h2v2h-2z" fill="currentColor"/>
  </svg>
);

export const User: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M15 2H9v2H7v6h2V4h6V2zm0 8H9v2h6v-2zm0-6h2v6h-2V4zM4 16h2v-2h12v2H6v4h12v-4h2v6H4v-6z" fill="currentColor"/>
  </svg>
);

export const Users: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M11 0H5v2H3v6h2v2h6V8H5V2h6V0zm0 2h2v6h-2V2zM0 14h2v4h12v2H0v-6zm2 0h12v-2H2v2zm14 0h-2v6h2v-6zM15 0h4v2h-4V0zm4 8h-4v2h4V8zm0-6h2v6h-2V2zm5 12h-2v4h-4v2h6v-6zm-6-2h4v2h-4v-2z" fill="currentColor"/>
  </svg>
);

// Additional icons that might be needed
export const X: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M5 5h2v2H5V5zm4 4H7V7h2v2zm2 2H9V9h2v2zm2 0h-2v2H9v2H7v2H5v2h2v-2h2v-2h2v-2h2v2h2v2h2v2h2v-2h-2v-2h-2v-2h-2v-2zm2-2v2h-2V9h2zm2-2v2h-2V7h2zm0 0V5h2v2h-2z" fill="currentColor"/>
  </svg>
);

export const Edit: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M18 2h-2v2h2v2h-2v2h-2v-2h-2V4h2V2H8v2H6v2H4v2H2v12h12v-2h2v-2h2v-2h2V8h-2V6h-2V4h-2V2zm0 8v2h-2v-2h2zm-2 4v2H4V8h2v2h2v2h2v2h2v2zm0-6V8h2v2h-2z" fill="currentColor"/>
  </svg>
);

export const Clock: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M15 2h-2v2h2v2h-2v2h-2v2H9V8H7V6H5V4H3v2h2v2h2v2h2v2h2v2h2v-2h2v-2h2V8h2V6h2V4h-2v2h-2v2h-2v2h-2V6h2V4h2V2zm-2 12h2v2h-2v-2zm-2-2h2v2h-2v-2zm-2-2h2v2H9v-2zm-2-2h2v2H7v-2zm8 6h2v2h-2v-2zm2-2h2v2h-2v-2zm2-2h2v2h-2v-2zm2-2h-2v-2h2v2z" fill="currentColor"/>
  </svg>
);

export const Database: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M2 4h20v4H2V4zm18 2v2H4V6h16zm0 6H2v4h18v-4zm-2 2v2H4v-2h14zM2 16h20v4H2v-4zm18 2v2H4v-2h16z" fill="currentColor"/>
  </svg>
);

export const Globe: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 4c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 6c1.38 0 2.5-1.12 2.5-2.5S13.38 11.5 12 11.5 9.5 12.62 9.5 14 10.62 16.5 12 16.5z" fill="currentColor"/>
  </svg>
);

export const UserMinus: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M15 2H9v2H7v6h2V4h6V2zm0 8H9v2h6v-2zm0-6h2v6h-2V4zM4 16h2v-2h8v2H6v4h8v-4h2v6H4v-6zm10-4h-2v2h2v-2z" fill="currentColor"/>
  </svg>
);

export const UserPlus: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M15 2H9v2H7v6h2V4h6V2zm0 8H9v2h6v-2zm0-6h2v6h-2V4zM4 16h2v-2h8v2H6v4h8v-4h2v6H4v-6zm12-6h-2v2h2v2h2v-2h-2v-2z" fill="currentColor"/>
  </svg>
);

export const Ban: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.57.46-3.03 1.24-4.26L16.26 18.76C15.03 19.54 13.57 20 12 20zm6.76-3.74L7.74 5.24C8.97 4.46 10.43 4 12 4c4.41 0 8 3.59 8 8 0 1.57-.46 3.03-1.24 4.26z" fill="currentColor"/>
  </svg>
);

export const Loader: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M12 2v4h2V2h-2zm0 16v4h2v-4h-2zm8-8h4v2h-4v-2zM2 10h4v2H2v-2zm15.07-5.07l2.83 2.83-1.41 1.41-2.83-2.83 1.41-1.41zm-8.28 8.28l2.83 2.83-1.41 1.41-2.83-2.83 1.41-1.41zm8.28 8.28l1.41 1.41-2.83 2.83-1.41-1.41 2.83-2.83zm-8.28-8.28l1.41 1.41-2.83 2.83-1.41-1.41 2.83-2.83z" fill="currentColor"/>
  </svg>
);

export const Phone: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M6 2h12v2H6V2zm0 2v16h12V4H6zm8 2H10v2h4V6zm-4 4h4v8h-4v-8z" fill="currentColor"/>
  </svg>
);

export const HashIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M8 4h2v4h4V4h2v4h4v2h-4v4h4v2h-4v4h-2v-4H8v4H6v-4H2v-2h4V8H2V6h4V4zm2 6v4h4v-4h-4z" fill="currentColor"/>
  </svg>
);

export const Building2: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <Building className={className} size={size} />
);

export const ArrowUpRight: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M18 4h2v2h-2v2h-2v-2h2V4zm-4 4h2v2h-2V8zm-2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm-2 2h2v2H6v-2zm0 0H4v-2h2v2z" fill="currentColor"/>
  </svg>
);

export const BarChart3: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <Analytics className={className} size={size} />
);

export const Copy: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M4 2h12v2H4v12H2V2h2zm4 4h12v16H8V6zm2 2v12h8V8h-8z" fill="currentColor"/>
  </svg>
);

export const Settings: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M12 2h2v2h-2V2zm-2 4H8v2H6v2h2v2h2v-2h2V8h-2V6zm6 0h-2v2h2V6zm2 0h2v2h-2V6zm-6 8h-2v-2h2v2zm-4 0H6v-2h2v2zm-4 0H2v-2h2v2zm8 4h-2v-2h2v2zm4 0h2v-2h-2v2zm-6 2h2v2h-2v-2zm4 0h2v2h-2v-2z" fill="currentColor"/>
  </svg>
);

export const Shield: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M12 2h2v2h-2V2zm-2 2H8v2H6v2H4v8h2v2h2v2h8v-2h2v-2h2v-8h-2V6h-2V4h-2V2h-2v2zm0 2v12h8V6h-8z" fill="currentColor"/>
  </svg>
);

export const AlertTriangle: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M12 2h2v2h-2V2zm-2 4h6v2h-2v6h-2V8H8V6zm-4 8h12v2H4v-2zm0 4h12v2H4v-2z" fill="currentColor"/>
  </svg>
);

export const Trash2: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M10 2h4v2h6v2h-2v14H6V6H4V4h6V2zM8 6v14h8V6H8zm2 2h2v10h-2V8zm4 0h2v10h-2V8z" fill="currentColor"/>
  </svg>
);

export const Send: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M2 4h20v2H2V4zm0 4h18v2H2V8zm0 4h16v2H2v-2zm0 4h14v2H2v-2z" fill="currentColor"/>
  </svg>
);

export const CheckCircle: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-5l6-6-1.41-1.41L11 12.17l-2.59-2.58L7 10.59l4 4z" fill="currentColor"/>
  </svg>
);

export const Zap: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M12 1h2v8h8v4h-2v-2h-8V5h-2V1zM8 7V5h2v2H8zM6 9V7h2v2H6zm-2 2V9h2v2H4zm10 8v2h-2v2h-2v-8H2v-4h2v2h8v6h2zm2-2v2h-2v-2h2zm2-2v2h-2v-2h2zm0 0h2v-2h-2v2z" fill="currentColor"/>
  </svg>
);

export const DollarSign: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} width={size} height={size}>
    <path d="M11 2h2v4h2v2h-2v2h4v2h-4v6h4v2h-6v-4h-2v-2h2V8H9V6h2V2z" fill="currentColor"/>
  </svg>
);

