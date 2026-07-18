import { describe, expect, it } from "vitest";
import { parseSessionDevice } from "../frontend/src/lib/session-device";

const IPHONE_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const IPAD_USER_AGENT =
  "Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";
const IPAD_DESKTOP_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const ANDROID_PHONE_USER_AGENT =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro Build/TQ3A.230805.001) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
const ANDROID_TABLET_USER_AGENT =
  "Mozilla/5.0 (Linux; Android 12; SM-X200 Build/SP1A.210812.016) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36";
const WINDOWS_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const MAC_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";

describe("parseSessionDevice", () => {
  it("identifies an iPhone and its browser and OS versions", () => {
    expect(parseSessionDevice(IPHONE_USER_AGENT)).toMatchObject({
      category: "mobile",
      device: { label: "iPhone" },
      os: { name: "iOS", version: "17.5", label: "iOS" },
      browser: { name: "Safari", version: "17.5", label: "Safari" },
      vendor: "Apple",
      model: "iPhone",
      rawUserAgent: IPHONE_USER_AGENT,
    });
  });

  it("distinguishes an iPad from an iPhone", () => {
    expect(parseSessionDevice(IPAD_USER_AGENT)).toMatchObject({
      category: "tablet",
      device: { label: "iPad" },
      os: { name: "iOS", version: "16.6" },
      browser: { name: "Safari", version: "16.6" },
      vendor: "Apple",
      model: "iPad",
    });
  });

  it("recognizes the desktop-class user agent used by modern iPads", () => {
    expect(parseSessionDevice(IPAD_DESKTOP_USER_AGENT)).toMatchObject({
      category: "tablet",
      device: { label: "iPad" },
      os: { name: "iPadOS", version: null, versionName: null, label: "iPadOS" },
      browser: { name: "Safari", version: "17.4" },
      vendor: "Apple",
      model: "iPad",
    });
  });

  it("identifies an Android phone and extracts its model", () => {
    expect(parseSessionDevice(ANDROID_PHONE_USER_AGENT)).toMatchObject({
      category: "mobile",
      device: { label: "Android phone" },
      os: { name: "Android", version: "13", label: "Android" },
      browser: { name: "Chrome", version: "120.0.0.0" },
      vendor: "Google",
      model: "Pixel 7 Pro",
    });
  });

  it("identifies an Android tablet without relying on a Mobile token", () => {
    expect(parseSessionDevice(ANDROID_TABLET_USER_AGENT)).toMatchObject({
      category: "tablet",
      device: { label: "Android tablet" },
      os: { name: "Android", version: "12" },
      browser: { name: "Chrome", version: "119.0.0.0" },
      vendor: "Samsung",
      model: "SM-X200",
    });
  });

  it("provides friendly Windows and macOS desktop labels", () => {
    expect(parseSessionDevice(WINDOWS_USER_AGENT)).toMatchObject({
      category: "desktop",
      device: { label: "Windows desktop" },
      os: { name: "Windows", version: "10", label: "Windows" },
      browser: { name: "Chrome", version: "126.0.0.0" },
    });

    expect(parseSessionDevice(MAC_USER_AGENT)).toMatchObject({
      category: "desktop",
      device: { label: "Mac" },
      os: {
        name: "macOS",
        version: "14.5",
        versionName: "Sonoma",
        label: "macOS",
      },
      browser: { name: "Safari", version: "17.5" },
      vendor: "Apple",
    });
  });

  it("treats bots and command-line clients as other devices", () => {
    expect(
      parseSessionDevice(
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      ),
    ).toMatchObject({
      category: "other",
      device: { label: "Bot" },
      browser: { name: "Googlebot", version: "2.1" },
      vendor: "Google",
    });

    expect(parseSessionDevice("curl/8.7.1")).toMatchObject({
      category: "other",
      device: { label: "Command-line client" },
      browser: { name: "curl", version: "8.7.1", label: "curl" },
    });
  });

  it.each([undefined, null, "", "   "])("handles a missing user agent (%s)", (userAgent) => {
    expect(parseSessionDevice(userAgent)).toEqual({
      category: "unknown",
      device: { label: "Unknown device" },
      os: { name: null, version: null, versionName: null, label: "Unknown" },
      browser: { name: null, version: null, label: "Unknown" },
      vendor: null,
      model: null,
      rawUserAgent: null,
    });
  });

  it("keeps an unrecognized raw user agent without pretending it is a browser", () => {
    expect(parseSessionDevice("not a real user agent")).toMatchObject({
      category: "unknown",
      device: { label: "Unknown device" },
      os: { label: "Unknown" },
      browser: { label: "Unknown" },
      rawUserAgent: "not a real user agent",
    });
  });
});
