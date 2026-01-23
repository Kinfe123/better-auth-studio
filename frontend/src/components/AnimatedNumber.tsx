"use client";

import NumberFlow from "@number-flow/react";
import clsx from "clsx";
import { type ComponentType, type ReactNode, useMemo } from "react";

interface AnimatedNumberProps {
  value: number | null | undefined;
  loading?: boolean;
  className?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  format?: Intl.NumberFormatOptions;
  trend?: number | boolean;
  fallback?: ReactNode;
}

const defaultFormat: Intl.NumberFormatOptions = {
  notation: "compact",
  maximumFractionDigits: 1,
};

export function AnimatedNumber({
  value,
  loading = false,
  className,
  prefix,
  suffix,
  format,
  trend,
  fallback = "…",
}: AnimatedNumberProps) {
  const numericValue = useMemo(() => {
    if (value === null || value === undefined) {
      return 0;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [value]);

  if (loading) {
    return (
      <span className={clsx("inline-flex items-baseline", className)}>
        {prefix}
        {fallback}
        {suffix}
      </span>
    );
  }

  const NumberFlowComponent = NumberFlow as unknown as ComponentType<{
    value: number;
    className?: string;
    format?: Intl.NumberFormatOptions;
    trend?: number | boolean;
  }>;

  const resolvedTrend = typeof trend === "boolean" ? (trend ? 1 : 0) : trend;

  return (
    <span className={clsx("inline-flex", className)}>
      {prefix}
      <NumberFlowComponent
        value={numericValue}
        format={format ?? defaultFormat}
        trend={resolvedTrend}
        className="inline-flex"
      />
      {suffix}
    </span>
  );
}
