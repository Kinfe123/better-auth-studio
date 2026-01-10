'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import PixelCard from './PixelCard';

interface CodeBlockProps {
  code: string;
  language?: string;
  showCopy?: boolean;
  className?: string;
}

export default function CodeBlock({
  code,
  language = 'bash',
  showCopy = true,
  className = ''
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };
  const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className="w-4 h-4 text-white"
    {...props}
  >
    <path
      d="M18 6h2v2h-2V6zm-2 4V8h2v2h-2zm-2 2v-2h2v2h-2zm-2 2h2v-2h-2v2zm-2 2h2v-2h-2v2zm-2 0v2h2v-2H8zm-2-2h2v2H6v-2zm0 0H4v-2h2v2z"
      fill="currentColor"
    />
  </svg>
  return (
    <div className={`relative group ${className}`}>
      <PixelCard variant="code">
        <div className="flex items-center justify-between gap-3">
          <code className="text-sm font-mono text-white/90 flex-1 whitespace-pre leading-normal py-0.5">{code}</code>
          {showCopy && (
            <button
              onClick={copyToClipboard}
              className="shrink-0 p-1.5 rounded-none border border-white/20 bg-black/50 hover:bg-white/10 transition-colors duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
              title={copied ? 'Copied!' : 'Copy code'}
            >
              {copied ? (
                <CheckIcon />
              ) : (
                <Copy className="w-4 h-4 text-white/70" />
              )}
            </button>
          )}
        </div>
      </PixelCard>
    </div>
  );
}
