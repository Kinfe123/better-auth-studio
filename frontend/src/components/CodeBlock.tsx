import { Check, Copy, FileCode } from "lucide-react";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight, vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "../contexts/ThemeContext";
import { Button } from "./ui/button";

interface CodeBlockProps {
  code: string;
  language?: string;
  fileName?: string;
  className?: string;
}

export function CodeBlock({
  code,
  language = "typescript",
  fileName = "auth.ts",
  className = "",
}: CodeBlockProps) {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_err) {}
  };

  const palette = theme === "light" ? oneLight : vscDarkPlus;
  const background = theme === "light" ? "#f8fafc" : "#0d1117";
  const borderColor = theme === "light" ? "#cbd5e1" : "#333333";

  const customStyle = {
    ...palette,
    'pre[class*="language-"]': {
      ...palette['pre[class*="language-"]'],
      background,
      padding: "1.25rem",
      margin: 0,
      borderRadius: 0,
    },
    'code[class*="language-"]': {
      ...palette['code[class*="language-"]'],
      background: "transparent",
      fontSize: "13px",
      lineHeight: "1.6",
      fontFamily:
        'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
    },
  };

  return (
    <div
      className={`bg-black border border-white/10 rounded-none overflow-hidden shadow-2xl ${className}`}
    >
      <div className="bg-black/50 border border-dashed border-white/20 flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center space-x-2.5">
          <FileCode className="w-4 h-4 text-white" />
          <span className="text-sm text-gray-200 font-mono font-medium">{fileName}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="text-gray-400 hover:text-white rounded-none p-1.5 h-auto hover:bg-white/5 transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-white/70" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>

      <div className="overflow-x-auto h-[500px] bg-black">
        <SyntaxHighlighter
          language={language}
          style={customStyle}
          customStyle={{
            margin: 0,
            padding: "1.25rem",
            background,
            border: `1px dashed ${borderColor}`,
          }}
          codeTagProps={{
            style: {
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
              fontSize: "13px",
              lineHeight: "1.6",
            },
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
