import React from 'react';
import { SVGProps } from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// Changelog Icons
export const ZapIcon = ({ className = "w-4 h-4 mr-2 text-white/70" }: IconProps) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="currentColor" />
  </svg>
);

export const MailIcon = ({ className = "w-4 h-4 mr-2 text-white/70" }: IconProps) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path d="M22 6v12H2V6h20zm-2 2H4v8h16V8zm-2 2v2H6v-2h12z" fill="currentColor" />
  </svg>
);

export const DatabaseIcon = ({ className = "w-4 h-4 mr-2 text-white/70" }: IconProps) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path d="M6 2h12v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2H6v-2H4v-2h2v-2H4v-2h2v-2H4V8h2V6H4V4h2V2zm2 2v2h8V4H8zm8 4H8v2h8V8zm-8 4v2h8v-2H8zm0 4v2h8v-2H8z" fill="currentColor" />
  </svg>
);

export const ShieldIcon = ({ className = "w-4 h-4 mr-2 text-white/70" }: IconProps) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path d="M12 2l-8 3v7c0 5 3.5 9.2 8 10 4.5-.8 8-5 8-10V5l-8-3zm0 2.2L18 6v5c0 3.8-2.6 7.2-6 7.9-3.4-.7-6-4.1-6-7.9V6l6-1.8z" fill="currentColor" />
  </svg>
);

export const AnalyticsIcon = ({ className = "w-4 h-4 mr-2 text-white/70" }: IconProps) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path d="M3 3h2v18H3V3zm6 6h2v12H9V9zm6-4h2v16h-2V5zm6 8h2v8h-2v-8z" fill="currentColor" />
  </svg>
);

export const CommandIcon = ({ className = "w-4 h-4 mr-2 text-white/70" }: IconProps) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path d="M6 2h4v4H6V2zm0 6h4v4H6V8zm0 6h4v4H6v-4zm0 6h4v4H6v-4zm8-18h4v4h-4V2zm0 6h4v4h-4V8zm0 6h4v4h-4v-4zm0 6h4v4h-4v-4z" fill="currentColor" />
  </svg>
);

export const LayoutIcon = ({ className = "w-4 h-4 mr-2 text-white/70" }: IconProps) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v4H7V7zm0 6h4v4H7v-4zm6 0h4v4h-4v-4z" fill="currentColor" />
  </svg>
);

export const SearchIcon = ({ className = "w-4 h-4 mr-2 text-white/70" }: IconProps) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path d="M10 2a8 8 0 015.3 14l5.4 5.3-1.4 1.4-5.3-5.4A8 8 0 1110 2zm0 2a6 6 0 100 12 6 6 0 000-12z" fill="currentColor" />
  </svg>
);

export const GlobeIcon = ({ className = "w-4 h-4 mr-2 text-white/70" }: IconProps) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 2c1.8 0 3.4.6 4.7 1.6l-1.4 1.4c-1-.6-2.1-1-3.3-1s-2.3.4-3.3 1L7.3 5.6C8.6 4.6 10.2 4 12 4zm0 16c-1.8 0-3.4-.6-4.7-1.6l1.4-1.4c1 .6 2.1 1 3.3 1s2.3-.4 3.3-1l1.4 1.4c-1.3 1-2.9 1.6-4.7 1.6z" fill="currentColor" />
  </svg>
);

export const SettingsIcon = ({ className = "w-4 h-4 mr-2 text-white/70" }: IconProps) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path d="M12 8a4 4 0 100 8 4 4 0 000-8zm0 2a2 2 0 110 4 2 2 0 010-4z" fill="currentColor" />
    <path d="M11 2h2v3h-2V2zm0 17h2v3h-2v-3zM3 11h3v2H3v-2zm15 0h3v2h-3v-2zM5.6 5.6l2.1 2.1-1.4 1.4-2.1-2.1 1.4-1.4zm11.3 9.7l2.1 2.1-1.4 1.4-2.1-2.1 1.4-1.4zM7.7 16.9l-2.1 2.1-1.4-1.4 2.1-2.1 1.4 1.4zM17.6 7.1l-2.1 2.1-1.4-1.4 2.1-2.1 1.4 1.4z" fill="currentColor" />
  </svg>
);

export const TrendingIcon = ({ className = "w-4 h-4 mr-2 text-white/70" }: IconProps) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path d="M16 6h6v6h-2V9.4l-4.3 4.3-4-4-5.4 5.4-1.4-1.4 6.7-6.7 4 4L19.6 8H16V6z" fill="currentColor" />
  </svg>
);

export const RocketIcon = ({ className = "w-4 h-4 mr-2 text-white/70" }: IconProps) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path d="M16 5v2h-2V5h2zm-4 4V7h2v2h-2zm-2 2V9h2v2h-2zm0 2H8v-2h2v2zm2 2v-2h-2v2h2zm0 0h2v2h-2v-2zm4 4v-2h-2v2h2z" fill="currentColor" />
  </svg>
);

export const ArrowRightIcon = ({ className = "w-4 h-4 mr-3 text-white/50" }: IconProps) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path d="M8 4h2v2H8V4zm2 2h2v2h-2V6zm2 2h2v2h-2V8zm2 2h2v2h-2v-2zm0 2v2h-2v-2h2zm-2 2v2h-2v-2h2zm-2 2v2H8v-2h2zm-2-2H6v-2h2v2zm2-2H8v-2h2v2zm2-2h-2V8h2v2z" fill="currentColor" />
  </svg>
);

export const ChevronIcon = ({ className = "w-3 h-3 mr-2 text-white/50" }: IconProps) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path d="M8 5v2h2V5H8zm4 4V7h-2v2h2zm2 2V9h-2v2h2zm0 2h2v-2h-2v2zm-2 2v-2h2v2h-2zm0 0h-2v2h2v-2zm-4 4v-2h2v2H8z" fill="currentColor" />
  </svg>
);

// Installation Page Icons
export const HostedIcon = ({ className = "w-3 h-3 inline-flex" }: IconProps) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 4c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 6c1.38 0 2.5-1.12 2.5-2.5S13.38 11.5 12 11.5 9.5 12.62 9.5 14 10.62 16.5 12 16.5z" fill="currentColor" />
  </svg>
);

export const BetaIcon = ({ className = "w-3 h-3 inline-flex" }: IconProps) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path d="M12 2h2v2h-2V2zm-2 4h6v2h-2v6h-2V8H8V6zm-4 8h12v2H4v-2zm0 4h12v2H4v-2z" fill="currentColor" />
  </svg>
);

export const DownloadIcon = ({ className = "w-3 rotate-180 h-3 inline-flex hover:text-white transition-colors" }: IconProps) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path d="M16 5v2h-2V5h2zm-4 4V7h2v2h-2zm-2 2V9h2v2h-2zm0 2H8v-2h2v2zm2 2v-2h-2v2h2zm0 0h2v2h-2v-2zm4 4v-2h-2v2h2z" fill="currentColor" />
  </svg>
);

export const InstallIcon = ({ className = "w-3 h-3 inline-flex" }: IconProps) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path d="M11 4h2v12h2v2h-2v2h-2v-2H9v-2h2V4zM7 14v2h2v-2H7zm0 0v-2H5v2h2zm10 0v2h-2v-2h2zm0 0v-2h2v2h-2z" fill="currentColor" />
  </svg>
);

export const BasicUsageIcon = ({ className = "w-3 h-3 inline-flex" }: IconProps) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path d="M4 2H2v8h2V2zm16 0h2v8h-2V2zm-6 6h-4V2H4v2h4v4H4v2h4v4H4v2h4v4H4v2h6v-6h4v6h2v-6h4v-2h-4v-4h4V8h-4V2h-2v6zm-4 6v-4h4v4h-4zM20 2h-4v2h4V2zM2 14h2v8H2v-8zm14 6h4v2h-4v-2zm6-6h-2v8h2v-8z" fill="currentColor" />
  </svg>
);

export const PrerequisitesIcon = ({ className = "w-3 h-3 inline-flex" }: IconProps) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path d="M18 6h2v2h-2V6zm-2 4V8h2v2h-2zm-2 2v-2h2v2h-2zm-2 2h2v-2h-2v2zm-2 2h2v-2h-2v2zm-2 0v2h2v-2H8zm-2-2h2v2H6v-2zm0 0H4v-2h2v2z" fill="currentColor" />
  </svg>
);

export const DataLayersIcon = ({ className = "w-3 h-3 inline-flex" }: IconProps) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path d="M2 4h20v4H2V4zm18 2v2H4V6h16zm0 6H2v4h18v-4zm-2 2v2H4v-2h14zM2 16h20v4H2v-4zm18 2v2H4v-2h16z" fill="currentColor" />
  </svg>
);

export const DocumentIcon = ({ className = "w-3 h-3 inline-flex" }: IconProps) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path d="M3 3h14v2h2v2h2v14H3V3zm2 2v14h14V7h-2V5H5zm2 2h8v2H7V7zm0 4h10v2H7v-2zm0 4h10v2H7v-2z" fill="currentColor" />
  </svg>
);

export const CalendarIcon = ({ className = "w-3 h-3 inline-flex mr-1 text-white/70" }: IconProps) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path d="M19 3h-1V1h-2v2H8V1H6v2H5C3.89 3 3 3.89 3 5v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.11-.9-2-2-2zm0 16H5V8h14v11z" fill="currentColor" />
  </svg>
);

export const ServerIcon = ({ className = "w-3 h-3 inline-flex" }: IconProps) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path d="M2 3h20v6H2V3zm18 2H4v2h16V5zM2 11h20v6H2v-6zm18 2H4v2h16v-2zM2 19h20v2H2v-2z" fill="currentColor" />
  </svg>
);

export const NextJsIcon = ({ className = "w-3 h-3 inline-flex" }: IconProps) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="1.2em"
    height="1.2em"
    viewBox="0 0 24 24"
  >
    <path
      fill="currentColor"
      d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10m4-14h-1.35v4H16zM9.346 9.71l6.059 7.828l1.054-.809L9.683 8H8v7.997h1.346z"
    ></path>
  </svg>
);

export const ExpressIcon = ({ className = "w-3 h-3 inline-flex" }: IconProps) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 256 256"
  >
    <g>
      <rect
        width="256"
        height="256"
        fill="currentColor"
        rx="60"
        className="fill-foreground"

      ></rect>
      <path
        className="fill-background"
        d="M228 182.937a12.73 12.73 0 0 1-15.791-6.005c-9.063-13.567-19.071-26.522-28.69-39.755l-4.171-5.56c-11.454 15.346-22.908 30.08-33.361 45.371a12.23 12.23 0 0 1-15.012 5.894l42.98-57.659l-39.978-52.1a13.29 13.29 0 0 1 15.847 5.56c9.285 13.568 19.572 26.523 29.802 40.257c10.287-13.623 20.462-26.634 29.97-40.09a11.95 11.95 0 0 1 14.901-5.56l-15.513 20.573c-6.95 9.174-13.789 18.404-21.017 27.356a5.56 5.56 0 0 0 0 8.285c13.289 17.626 26.466 35.307 40.033 53.433M28 124.5c1.168-5.56 1.89-11.621 3.503-17.292c9.619-34.195 48.818-48.43 75.785-27.245c15.791 12.4 19.739 29.97 18.961 49.764H37.286c-1.446 35.363 24.075 56.714 56.713 45.816a33.86 33.86 0 0 0 21.518-23.965c1.724-5.56 4.504-6.505 9.786-4.893a45.15 45.15 0 0 1-21.573 32.972a52.26 52.26 0 0 1-60.884-7.784a54.77 54.77 0 0 1-13.678-32.138c0-1.89-.723-3.781-1.112-5.56A861 861 0 0 1 28 124.5m9.397-2.391h80.456c-.501-25.632-16.681-43.814-38.254-43.98c-24.02-.334-41.201 17.458-42.258 43.869z"
      ></path>
    </g>
  </svg>
);

export const HonoIcon = ({ className = "w-3 h-3 inline-flex" }: IconProps) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="1.2em"
    height="1.2em"
    viewBox="0 0 256 330"
  >
    <path
      fill='currentColor'
      className="fill-foreground"
      d="M134.129.029q1.315-.17 2.319.662a1256 1256 0 0 1 69.573 93.427q24.141 36.346 41.082 76.862q27.055 72.162-28.16 125.564q-48.313 40.83-111.318 31.805q-75.312-15.355-102.373-87.133Q-1.796 217.85.614 193.51q4.014-41.896 19.878-80.838q6.61-15.888 17.228-29.154a382 382 0 0 1 16.565 21.203q3.66 3.825 7.62 7.289Q92.138 52.013 134.13.029"
      opacity=".993"
    ></path>
    <path
      className="fill-muted-foreground"
      d="M129.49 53.7q36.47 42.3 65.93 90.114a187.3 187.3 0 0 1 15.24 33.13q12.507 49.206-26.836 81.169q-38.05 26.774-83.488 15.902q-48.999-15.205-56.653-65.929q-1.857-15.993 3.314-31.142a225.4 225.4 0 0 1 17.89-35.78l19.878-29.155a5510 5510 0 0 0 44.726-58.31"
    ></path>
  </svg>
);

export const ConfigIcon = ({ className = "w-3 h-3 inline-flex" }: IconProps) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path d="M3 3h18v2H3V3zm0 4h14v2H3V7zm0 4h18v2H3v-2zm0 4h14v2H3v-2zm0 4h18v2H3v-2z" fill="currentColor" />
  </svg>
);

export const WarningIcon = ({ className = "w-3 h-3 inline-flex" }: IconProps) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path d="M12 2L1 21h22L12 2zm0 4l7.5 13h-15L12 6zm-1 5v4h2v-4h-2zm0 6v2h2v-2h-2z" fill="currentColor" />
  </svg>
);

