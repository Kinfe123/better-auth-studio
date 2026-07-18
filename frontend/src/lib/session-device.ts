import Bowser from "bowser";

export type SessionDeviceCategory = "desktop" | "mobile" | "tablet" | "tv" | "other" | "unknown";

export interface SessionDeviceSoftware {
  name: string | null;
  version: string | null;
  label: string;
}

export interface SessionDeviceHardware {
  label: string;
}

export interface SessionDeviceOS extends SessionDeviceSoftware {
  versionName: string | null;
}

export interface SessionDeviceInfo {
  category: SessionDeviceCategory;
  device: SessionDeviceHardware;
  os: SessionDeviceOS;
  browser: SessionDeviceSoftware;
  vendor: string | null;
  model: string | null;
  rawUserAgent: string | null;
}

interface ClientDetails {
  name: string;
  version: string | null;
}

const COMMAND_LINE_CLIENTS: ReadonlyArray<{
  pattern: RegExp;
  name: string;
}> = [
  { pattern: /^curl(?:\/([^\s]+))?/i, name: "curl" },
  { pattern: /^wget(?:\/([^\s]+))?/i, name: "Wget" },
  { pattern: /^(?:httpie|http)(?:\/([^\s]+))?/i, name: "HTTPie" },
  { pattern: /^python-requests(?:\/([^\s]+))?/i, name: "Python Requests" },
  { pattern: /^python-httpx(?:\/([^\s]+))?/i, name: "Python HTTPX" },
  { pattern: /^go-http-client(?:\/([^\s]+))?/i, name: "Go HTTP Client" },
  { pattern: /^postmanruntime(?:\/([^\s]+))?/i, name: "Postman" },
  { pattern: /^insomnia(?:\/([^\s]+))?/i, name: "Insomnia" },
];

const normalizeText = (value: string | undefined): string | null => {
  const normalized = value?.trim();
  return normalized || null;
};

const findCommandLineClient = (userAgent: string): ClientDetails | null => {
  for (const client of COMMAND_LINE_CLIENTS) {
    const match = userAgent.match(client.pattern);
    if (match) {
      return {
        name: client.name,
        version: normalizeText(match[1]),
      };
    }
  }

  return null;
};

const extractAndroidModel = (userAgent: string): string | null => {
  const androidSection = userAgent.match(/\(([^)]*\bAndroid\b[^)]*)\)/i)?.[1];
  if (!androidSection) return null;

  const buildSegment = androidSection
    .split(";")
    .map((segment) => segment.trim())
    .find((segment) => /\sBuild\//i.test(segment));

  const model = buildSegment?.replace(/\s+Build\/.*$/i, "").trim();
  if (!model || /^(?:k|wv|mobile|tablet)$/i.test(model)) return null;

  return model;
};

const inferAndroidVendor = (model: string | null): string | null => {
  if (!model) return null;
  if (/^(?:SM-|GT-|SCH-|SGH-|Samsung\b)/i.test(model)) return "Samsung";
  if (/^(?:Pixel\b|Nexus\b)/i.test(model)) return "Google";
  if (/^ONEPLUS\b/i.test(model)) return "OnePlus";
  if (/^Moto(?:rola)?\b/i.test(model)) return "Motorola";

  return null;
};

const isBotUserAgent = (userAgent: string, platformType: string | null): boolean =>
  platformType?.toLowerCase() === "bot" ||
  /(?:bot|crawler|spider|slurp|archiver)\b/i.test(userAgent);

const getCategory = (
  platformType: string | null,
  osName: string | null,
  userAgent: string,
  isBot: boolean,
  commandLineClient: ClientDetails | null,
): SessionDeviceCategory => {
  if (isBot || commandLineClient) return "other";

  switch (platformType?.toLowerCase()) {
    case "desktop":
    case "mobile":
    case "tablet":
    case "tv":
      return platformType.toLowerCase() as SessionDeviceCategory;
  }

  if (osName?.toLowerCase() === "android") {
    return /\bmobile\b/i.test(userAgent) ? "mobile" : "tablet";
  }

  if (osName && /^(?:windows|macos|linux|chrome os)$/i.test(osName)) {
    return "desktop";
  }

  return "unknown";
};

const getDeviceLabel = (
  category: SessionDeviceCategory,
  osName: string | null,
  vendor: string | null,
  model: string | null,
  isBot: boolean,
  commandLineClient: ClientDetails | null,
): string => {
  if (isBot) return "Bot";
  if (commandLineClient) return "Command-line client";

  if (/^iphone$/i.test(model || "")) return "iPhone";
  if (/^ipad$/i.test(model || "")) return "iPad";
  if (/^ipod$/i.test(model || "")) return "iPod";

  if (osName?.toLowerCase() === "android") {
    if (category === "mobile") return "Android phone";
    if (category === "tablet") return "Android tablet";
  }

  if (category === "desktop") {
    if (osName?.toLowerCase() === "macos") return "Mac";
    if (osName?.toLowerCase() === "windows") return "Windows desktop";
    if (osName?.toLowerCase() === "chrome os") return "Chromebook";
    if (osName?.toLowerCase() === "linux") return "Linux desktop";
    return vendor === "Apple" ? "Mac" : "Desktop";
  }

  if (category === "mobile") return model || (vendor ? `${vendor} phone` : "Mobile device");
  if (category === "tablet") return model || (vendor ? `${vendor} tablet` : "Tablet");
  if (category === "tv") return model || (vendor ? `${vendor} TV` : "Smart TV");
  if (category === "other") return model || "Other device";

  return "Unknown device";
};

const getSoftwareDetails = (
  name: string | null,
  version: string | null,
): SessionDeviceSoftware => ({
  name,
  version,
  label: name || "Unknown",
});

const getOSDetails = (
  name: string | null,
  rawVersion: string | null,
  versionName: string | null,
): SessionDeviceOS => {
  const version = name?.toLowerCase() === "windows" ? versionName || rawVersion : rawVersion;

  return {
    name,
    version,
    versionName,
    label: name || "Unknown",
  };
};

/**
 * Parses session user-agent metadata into stable labels for the Studio UI.
 * User agents are self-reported, so this information is descriptive only.
 */
export function parseSessionDevice(userAgent: string | null | undefined): SessionDeviceInfo {
  const rawUserAgent = typeof userAgent === "string" ? userAgent.trim() || null : null;

  if (!rawUserAgent) {
    return {
      category: "unknown",
      device: { label: "Unknown device" },
      os: getOSDetails(null, null, null),
      browser: getSoftwareDetails(null, null),
      vendor: null,
      model: null,
      rawUserAgent: null,
    };
  }

  try {
    const result = Bowser.parse(rawUserAgent);
    const isIPadOSDesktopUserAgent =
      /\bMacintosh\b/i.test(rawUserAgent) && /\bMobile\/[\w.]+\b/i.test(rawUserAgent);
    const osName = isIPadOSDesktopUserAgent ? "iPadOS" : normalizeText(result.os.name);
    const osVersion = isIPadOSDesktopUserAgent ? null : normalizeText(result.os.version);
    const osVersionName = isIPadOSDesktopUserAgent ? null : normalizeText(result.os.versionName);
    const platformType = isIPadOSDesktopUserAgent ? "tablet" : normalizeText(result.platform.type);
    const commandLineClient = findCommandLineClient(rawUserAgent);
    const isBot = isBotUserAgent(rawUserAgent, platformType);
    const androidModel =
      osName?.toLowerCase() === "android" ? extractAndroidModel(rawUserAgent) : null;
    const model = isIPadOSDesktopUserAgent
      ? "iPad"
      : normalizeText(result.platform.model) || androidModel;
    const vendor =
      (isIPadOSDesktopUserAgent ? "Apple" : normalizeText(result.platform.vendor)) ||
      (osName?.toLowerCase() === "android" ? inferAndroidVendor(model) : null);
    const category = getCategory(platformType, osName, rawUserAgent, isBot, commandLineClient);
    const browserName = commandLineClient?.name || normalizeText(result.browser.name);
    const browserVersion = commandLineClient?.version || normalizeText(result.browser.version);

    return {
      category,
      device: {
        label: getDeviceLabel(category, osName, vendor, model, isBot, commandLineClient),
      },
      os: getOSDetails(osName, osVersion, osVersionName),
      browser: getSoftwareDetails(browserName, browserVersion),
      vendor,
      model,
      rawUserAgent,
    };
  } catch {
    return {
      category: "unknown",
      device: { label: "Unknown device" },
      os: getOSDetails(null, null, null),
      browser: getSoftwareDetails(null, null),
      vendor: null,
      model: null,
      rawUserAgent,
    };
  }
}
