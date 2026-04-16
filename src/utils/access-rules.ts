import { isIP } from "node:net";
import type { StudioAccessConfig } from "../types/handler.js";

export type AccessEvaluationInput = {
  accessConfig?: StudioAccessConfig;
  path: string;
  method: string;
  headers: Record<string, string>;
  ip?: string | null;
};

export type AccessEvaluationResult =
  | {
      allowed: true;
      ipAddress: string | null;
    }
  | {
      allowed: false;
      ipAddress: string | null;
      reason: "ip_not_allowed" | "ip_blocked";
      message: string;
    };

const IP_HEADER_CANDIDATES = [
  "x-forwarded-for",
  "cf-connecting-ip",
  "x-real-ip",
  "x-client-ip",
  "true-client-ip",
] as const;

function normalizeIpToken(raw: string | undefined | null): string | null {
  if (!raw) return null;

  let value = raw.trim();
  if (!value || value.toLowerCase() === "unknown") {
    return null;
  }

  // RFC 7239 may include entries like: for="1.2.3.4:1234"
  if (value.toLowerCase().startsWith("for=")) {
    value = value.slice(4).trim();
  }

  value = value.replace(/^"+|"+$/g, "");

  // Strip IPv6 brackets when present.
  if (value.startsWith("[")) {
    const end = value.indexOf("]");
    if (end > 0) {
      value = value.slice(1, end);
    }
  }

  // Handle IPv4 with port.
  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(value)) {
    value = value.split(":")[0] || value;
  }

  // Normalize IPv6-mapped IPv4 (e.g. ::ffff:127.0.0.1)
  if (value.startsWith("::ffff:")) {
    value = value.slice(7);
  }

  return isIP(value) ? value : null;
}

function getHeaderValue(headers: Record<string, string>, headerName: string): string | undefined {
  const target = headerName.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === target) {
      return value;
    }
  }
  return undefined;
}

function getForwardedIp(headers: Record<string, string>): string | null {
  const forwarded = getHeaderValue(headers, "forwarded");
  if (!forwarded) return null;

  const entries = forwarded.split(",");
  for (const entry of entries) {
    const match = entry.match(/for=("?\[?[a-fA-F0-9:.]+\]?"?)/i);
    if (!match) continue;
    const ip = normalizeIpToken(match[1]);
    if (ip) return ip;
  }
  return null;
}

export function extractClientIp(
  headers: Record<string, string>,
  fallbackIp?: string | null,
): string | null {
  for (const header of IP_HEADER_CANDIDATES) {
    const value = getHeaderValue(headers, header);
    if (!value) continue;

    const firstValue = value.split(",")[0];
    const ip = normalizeIpToken(firstValue);
    if (ip) return ip;
  }

  const forwardedIp = getForwardedIp(headers);
  if (forwardedIp) return forwardedIp;

  return normalizeIpToken(fallbackIp);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ipMatchesRule(ipAddress: string, rule: string): boolean {
  const trimmedRule = rule.trim();
  if (!trimmedRule) return false;

  if (trimmedRule.includes("*")) {
    const pattern = `^${escapeRegExp(trimmedRule).replace(/\\\*/g, ".*")}$`;
    return new RegExp(pattern).test(ipAddress);
  }

  const normalizedRuleIp = normalizeIpToken(trimmedRule);
  if (!normalizedRuleIp) return false;
  return normalizedRuleIp === ipAddress;
}

function hasRules(values: string[] | undefined): values is string[] {
  return Array.isArray(values) && values.some((value) => value.trim().length > 0);
}

export function evaluateRequestAccess(input: AccessEvaluationInput): AccessEvaluationResult {
  const { accessConfig, headers, ip } = input;
  const ipAddress = extractClientIp(headers, ip);

  const allowIpAddresses = accessConfig?.allowIpAddresses?.filter(
    (value) => value.trim().length > 0,
  );
  if (hasRules(allowIpAddresses)) {
    if (!ipAddress || !allowIpAddresses.some((rule) => ipMatchesRule(ipAddress, rule))) {
      return {
        allowed: false,
        ipAddress,
        reason: "ip_not_allowed",
        message: "Access denied. This IP address is not in the allowed list.",
      };
    }
  }

  const blockIpAddresses = accessConfig?.blockIpAddresses?.filter(
    (value) => value.trim().length > 0,
  );
  if (hasRules(blockIpAddresses) && ipAddress) {
    const blocked = blockIpAddresses.some((rule) => ipMatchesRule(ipAddress, rule));
    if (blocked) {
      return {
        allowed: false,
        ipAddress,
        reason: "ip_blocked",
        message: "Access denied. This IP address is blocked.",
      };
    }
  }

  return {
    allowed: true,
    ipAddress,
  };
}
