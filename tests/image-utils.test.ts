import { afterEach, describe, expect, it, vi } from "vitest";
import { getImageSrc } from "../frontend/src/lib/utils";

describe("getImageSrc", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves same-origin relative image paths", () => {
    vi.stubGlobal("window", { location: { origin: "https://studio.example.com" } });

    expect(getImageSrc("/avatars/user.png")).toBe("https://studio.example.com/avatars/user.png");
    expect(getImageSrc("logos/organization.svg")).toBe(
      "https://studio.example.com/logos/organization.svg",
    );
  });

  it("keeps supported image sources and rejects unsafe protocols", () => {
    vi.stubGlobal("window", { location: { origin: "https://studio.example.com" } });

    expect(getImageSrc("data:image/png;base64,abc")).toBe("data:image/png;base64,abc");
    expect(getImageSrc("blob:https://studio.example.com/avatar")).toBe(
      "blob:https://studio.example.com/avatar",
    );
    expect(getImageSrc("javascript:alert(1)", "/fallback.png")).toBe("/fallback.png");
  });
});
