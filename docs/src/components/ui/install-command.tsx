"use client";

import { LoaderCircle, RefreshCw } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";

type SetupOption = {
  label: string;
  value: string;
  kind: "command" | "agent";
};

const setupOptions: readonly SetupOption[] = [
  {
    label: "CLI",
    value: "pnpx better-auth-studio@latest start",
    kind: "command",
  },
  {
    label: "Agent",
    value:
      "Set up the latest Better Auth Studio in this existing Better Auth project. Read the project and its Better Auth configuration first, detect the package manager, then follow the documented better-auth-studio CLI workflow. Preserve the framework, database adapter, environment, and authentication conventions; keep secrets server-only; avoid unrelated auth changes; verify the Studio starts and connects to the configured Better Auth data; run relevant type checks and a production build before finishing.",
    kind: "agent",
  },
];

function copyWithSelection(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } finally {
    textarea.remove();
  }
}

function InstallArrowIcon() {
  return (
    <svg
      aria-hidden
      className="mr-1 inline-flex size-3 rotate-180 text-white/50"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 5v2h-2V5h2zm-4 4V7h2v2h-2zm-2 2V9h2v2h-2zm0 2H8v-2h2v2zm2 2v-2h-2v2h2zm0 0h2v2h-2v-2zm4 4v-2h-2v2h2z"
        fill="currentColor"
      />
    </svg>
  );
}

function PixelCheckIcon() {
  return (
    <svg
      aria-hidden
      className="size-4"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18 6h2v2h-2V6zm-2 4V8h2v2h-2zm-2 2v-2h2v2h-2zm-2 2h2v-2h-2v2zm-2 2h2v-2h-2v2zm-2 0v2h2v-2H8zm-2-2h2v2H6v-2zm0 0H4v-2h2v2z"
        fill="currentColor"
      />
    </svg>
  );
}

function PixelCopyIcon() {
  return (
    <svg
      aria-hidden
      className="size-4"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4 2h12v2H4v12H2V2h2zm4 4h12v16H8V6zm2 2v12h8V8h-8z" fill="currentColor" />
    </svg>
  );
}

export function InstallCommand() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [copyState, setCopyState] = useState<"idle" | "copying" | "copied" | "failed">("idle");
  const componentId = useId();
  const resetTimer = useRef<number | undefined>(undefined);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeOption = setupOptions[activeIndex];
  const panelId = `${componentId}-panel`;
  const activeTabId = `${componentId}-tab-${activeOption.label.toLowerCase()}`;
  const copyTarget = activeOption.kind === "agent" ? "agent instruction" : "CLI command";
  const copyLabel =
    copyState === "copying"
      ? "Copying"
      : copyState === "copied"
        ? "Copied"
        : copyState === "failed"
          ? "Retry"
          : "Copy";
  useEffect(() => {
    return () => window.clearTimeout(resetTimer.current);
  }, []);

  function selectOption(index: number) {
    window.clearTimeout(resetTimer.current);
    setActiveIndex(index);
    setCopyState("idle");
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | undefined;

    if (event.key === "ArrowRight") nextIndex = (index + 1) % setupOptions.length;
    if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + setupOptions.length) % setupOptions.length;
    }
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = setupOptions.length - 1;
    if (nextIndex === undefined) return;

    event.preventDefault();
    selectOption(nextIndex);
    tabRefs.current[nextIndex]?.focus();
  }

  async function copyActiveOption() {
    let didCopy = false;
    let clipboardTimer: number | undefined;
    setCopyState("copying");

    let fallbackCopySucceeded = false;
    try {
      fallbackCopySucceeded = copyWithSelection(activeOption.value);
    } catch {
      fallbackCopySucceeded = false;
    }

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }

      await Promise.race([
        navigator.clipboard.writeText(activeOption.value),
        new Promise<never>((_, reject) => {
          clipboardTimer = window.setTimeout(
            () => reject(new Error("Clipboard permission timed out")),
            600,
          );
        }),
      ]);
      didCopy = true;
    } catch {
      didCopy = fallbackCopySucceeded;
    } finally {
      window.clearTimeout(clipboardTimer);
    }

    window.clearTimeout(resetTimer.current);
    setCopyState(didCopy ? "copied" : "failed");
    resetTimer.current = window.setTimeout(() => setCopyState("idle"), 1600);
  }

  return (
    <div className="overflow-hidden rounded-none border border-dashed border-white/15 bg-black/20 p-4 font-mono text-xs backdrop-blur-sm transition-all duration-300 hover:border-white/20">
      <div className="mb-2 flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center truncate text-[10px] uppercase text-white/70">
          <InstallArrowIcon />
          <span className="truncate">Install Better Auth Studio</span>
        </div>

        <div aria-label="Setup method" className="flex shrink-0 items-center gap-2" role="tablist">
          {setupOptions.map((option, index) => {
            const isActive = activeIndex === index;

            return (
              <button
                key={option.label}
                aria-controls={panelId}
                aria-selected={isActive}
                className={`border-b px-0.5 py-0.5 text-[9px] uppercase leading-none transition-colors duration-150 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white ${
                  isActive
                    ? "border-white/70 text-white"
                    : "border-transparent text-white/35 hover:text-white/70"
                }`}
                id={`${componentId}-tab-${option.label.toLowerCase()}`}
                onClick={() => selectOption(index)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                role="tab"
                tabIndex={isActive ? 0 : -1}
                type="button"
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        aria-labelledby={activeTabId}
        className="flex min-w-0 items-center gap-2 overflow-hidden"
        id={panelId}
        role="tabpanel"
      >
        <span className="shrink-0 text-white/80">{activeOption.kind === "agent" ? "AI" : "$"}</span>
        <code
          className="min-w-0 flex-1 truncate whitespace-nowrap text-xs text-white"
          title={activeOption.value}
        >
          {activeOption.value}
        </code>

        <button
          aria-label={`${copyLabel} ${copyTarget}`}
          className="ml-2 inline-flex size-4 shrink-0 items-center justify-center text-white/50 transition-colors hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white"
          onClick={copyActiveOption}
          title={`${copyLabel} ${copyTarget}`}
          type="button"
        >
          {copyState === "copying" ? (
            <LoaderCircle aria-hidden className="size-4 animate-spin" strokeWidth={1.5} />
          ) : copyState === "copied" ? (
            <PixelCheckIcon />
          ) : copyState === "failed" ? (
            <RefreshCw aria-hidden className="size-4" strokeWidth={1.5} />
          ) : (
            <PixelCopyIcon />
          )}
          <span aria-live="polite" className="sr-only">
            {copyLabel}
          </span>
        </button>
      </div>
    </div>
  );
}
