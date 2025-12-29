import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface CopyableIdProps {
  id: string;
  label?: string;
  nonSliced?: boolean;
  className?: string;
  variant?: 'inline' | 'detail' | 'subscript';
}

export function CopyableId({
  id,
  label = 'ID',
  className = '',
  variant = 'inline',
  nonSliced = false,
}: CopyableIdProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (_error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  if (variant === 'detail') {
    return (
      <div className={`flex justify-between items-center ${className}`}>
        <span className="text-gray-400 font-mono uppercase text-xs">{label}:</span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 text-white text-sm hover:text-white/80 transition-colors group"
          title="Click to copy"
        >
          <span className="font-mono uppercase text-xs">{id}</span>
          {copied ? (
            <Check className="w-3 h-3 text-green-500" />
          ) : (
            <Copy className="w-3 h-3 text-gray-400 group-hover:text-white transition-colors" />
          )}
        </button>
      </div>
    );
  }

  if (variant === 'subscript') {
    return (
      <sup
        onClick={copyToClipboard}
        className={`text-xs text-gray-500 ml-2 cursor-pointer hover:text-white transition-colors inline-flex items-center gap-1 ${className}`}
        title="Click to copy User ID"
      >
        <span className="mr-1">[</span>
        <span className="text-white/80 font-mono text-xs">{nonSliced ? id : id.slice(0, 8)}</span>
        <span className="ml-1">]</span>
      </sup>
    );
  }

  return (
    <button
      onClick={copyToClipboard}
      className={`flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors group ${className}`}
      title="Click to copy"
    >
      <span>{label}:</span>
      <span className="font-mono">{id}</span>
      {copied ? (
        <Check className="w-3 h-3 text-green-500" />
      ) : (
        <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
}
