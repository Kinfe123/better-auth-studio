"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";

interface SyntaxHighlighterProps {
  code: string;
  language?: string;
  className?: string;
  showCopy?: boolean;
}

export default function CodeHighlighter({
  code,
  language = "typescript",
  className = "",
  showCopy = true,
}: SyntaxHighlighterProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className={`relative group w-full max-w-full overflow-x-auto thin-scrollbar ${className}`}>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          background: "transparent",
          padding: "0",
          margin: "0",
          fontSize: "0.875rem",
          fontFamily: "var(--font-geist-mono)",
          lineHeight: "1.5",
          maxHeight: "100%",
          maxWidth: "100%",
          overflowX: "auto",
          overflowY: "hidden",
        }}
        codeTagProps={{
          style: {
            fontFamily: "var(--font-geist-mono)",
            color: "rgba(255, 255, 255, 0.9)",
            display: "block",
          },
        }}
        PreTag={({ children, ...props }) => (
          <pre {...props} style={{ margin: 0, padding: 0, background: "transparent" }}>
            {children}
          </pre>
        )}
      >
        {code}
      </SyntaxHighlighter>
      {showCopy && (
        <button
          onClick={copyToClipboard}
          className="absolute top-2 right-2 p-1.5 rounded-none border border-white/20 bg-black/50 hover:bg-white/10 transition-colors duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
          title={copied ? "Copied!" : "Copy code"}
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-white/70" />
          )}
        </button>
      )}
    </div>
  );
}
