"use client";

import Link from "next/link";
import { useState } from "react";

interface NavigationProps {
  currentPage?: string;
}

const ChevronUpRight = () => (
  <svg 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24"
    className="w-4 h-4 mb-[1px] inline-flex rotate-[42deg]"
  >
    <path 
      d="M11 20h2V8h2V6h-2V4h-2v2H9v2h2v12zM7 10V8h2v2H7zm0 0v2H5v-2h2zm10 0V8h-2v2h2zm0 0v2h2v-2h-2z" 
      fill="currentColor"
    />
  </svg>
);

export default function Navigation({ currentPage }: NavigationProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const navItems = [
    { name: 'HOME', href: '/' },
    { name: 'INSTALLATION', href: '/installation' },
    { name: 'SELF-HOSTING', href: '/self-hosting' },
    { name: 'CHANGELOG', href: '/changelog' },
    { name: 'RELEASE', href: '/v/1.0.1' },
    { name: 'GITHUB', href: 'https://github.com/Kinfe123/better-auth-studio' }
  ];

  return (
    <nav className="absolute font-mono top-4 left-4 right-4 md:top-10 md:left-10 md:right-10 z-30">
      <ul className="hidden md:flex gap-4 lg:gap-6">
        {navItems.map((item) => (
          <li key={item.name}>
            <Link
              href={item.href}
              onMouseEnter={() => setHoveredItem(item.name)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`inline-flex items-center text-sm font-light tracking-[0.2em] mix-blend-difference text-white hover:opacity-100 transition-all duration-300 ${
                currentPage === item.name.toLowerCase() || (currentPage === 'home' && item.name === 'HOME') ? 'opacity-100' : 'opacity-70'
              }`}
            >
              {item.name}
              <span className={`${hoveredItem === item.name ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1'}`}>
                <ChevronUpRight />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      
      <ul className="md:hidden flex flex-col gap-2 items-end">
        {navItems.map((item) => (
          <li key={item.name}>
            <Link
              href={item.href}
              onMouseEnter={() => setHoveredItem(item.name)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`inline-flex items-center text-xs font-light tracking-[0.15em] mix-blend-difference text-white hover:opacity-100 transition-all duration-300 ${
                currentPage === item.name.toLowerCase() || (currentPage === 'home' && item.name === 'HOME') ? 'opacity-100' : 'opacity-70'
              }`}
            >
              {item.name}
              <span className={`transition-all duration-300 ${hoveredItem === item.name ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                <ChevronUpRight />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
