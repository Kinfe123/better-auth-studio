import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from './ui/button';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  className?: string;
}

export function CodeBlock({ code, language = 'typescript', title, className = '' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className={`bg-black/50 border border-dashed border-white/20 rounded-none ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-dashed border-white/10">
          <h4 className="text-white font-light text-sm">{title}</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-gray-400 hover:text-white rounded-none p-1 h-auto"
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      )}
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm text-gray-300 whitespace-pre">
          <code className={`language-${language}`}>{code}</code>
        </pre>
      </div>
    </div>
  );
}
