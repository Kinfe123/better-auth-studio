import { useEffect, useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  placeholder?: string;
  className?: string;
}

export function CodeEditor({
  value,
  onChange,
  language = "typescript",
  placeholder = "",
  className = "",
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [highlightCode, setHighlightCode] = useState(value || placeholder);

  useEffect(() => {
    setHighlightCode(value || placeholder);
  }, [value, placeholder]);

  useEffect(() => {
    const textarea = textareaRef.current;
    const highlight = highlightRef.current;

    if (textarea && highlight) {
      const syncScroll = () => {
        if (highlight) {
          highlight.scrollTop = textarea.scrollTop;
          highlight.scrollLeft = textarea.scrollLeft;
        }
      };

      textarea.addEventListener("scroll", syncScroll);
      return () => textarea.removeEventListener("scroll", syncScroll);
    }
  }, []);

  const baseFontSize = "12px";
  const baseLineHeight = "1.5";
  const basePadding = "0.75rem";
  const baseFontFamily =
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

  // Custom style for syntax highlighter
  const customStyle = {
    ...vscDarkPlus,
    'pre[class*="language-"]': {
      ...vscDarkPlus['pre[class*="language-"]'],
      background: "transparent",
      padding: 0,
      margin: 0,
      borderRadius: 0,
      overflow: "visible",
    },
    'code[class*="language-"]': {
      ...vscDarkPlus['code[class*="language-"]'],
      background: "transparent",
      fontSize: baseFontSize,
      lineHeight: baseLineHeight,
      fontFamily: baseFontFamily,
    },
  };

  const textareaStyle = {
    fontFamily: baseFontFamily,
    fontSize: baseFontSize,
    lineHeight: baseLineHeight,
    padding: basePadding,
    margin: 0,
    border: "none",
    outline: "none",
    resize: "none" as const,
    color: "transparent",
    caretColor: "#fff",
    background: "transparent",
    width: "100%",
    minHeight: "200px",
    overflow: "auto",
    tabSize: 2,
  };

  return (
    <div
      className={`relative border border-dashed border-white/20 rounded-none focus-within:border-white/40 ${className}`}
    >
      {/* Syntax highlighted background */}
      <div
        ref={highlightRef}
        className="absolute inset-0 pointer-events-none overflow-auto"
        style={{
          padding: basePadding,
          boxSizing: "border-box",
        }}
      >
        <SyntaxHighlighter
          language={language}
          style={customStyle}
          customStyle={{
            margin: 0,
            padding: 0,
            background: "transparent",
            minHeight: "200px",
          }}
          codeTagProps={{
            style: {
              fontFamily: baseFontFamily,
              fontSize: baseFontSize,
              lineHeight: baseLineHeight,
              display: "block",
            },
          }}
          PreTag={({ children, ...props }) => (
            <pre
              {...props}
              style={{
                margin: 0,
                padding: 0,
                background: "transparent",
                fontSize: baseFontSize,
                lineHeight: baseLineHeight,
                fontFamily: baseFontFamily,
              }}
            >
              {children}
            </pre>
          )}
        >
          {highlightCode}
        </SyntaxHighlighter>
      </div>

      {/* Editable textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="relative w-full min-h-[200px] bg-transparent text-white font-mono text-xs rounded-none focus:outline-none resize-none"
        style={{
          ...textareaStyle,
          boxSizing: "border-box",
          position: "relative",
          zIndex: 1,
        }}
        spellCheck={false}
      />
    </div>
  );
}
