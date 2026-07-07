import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { betterAuthStudio } from "../src/adapters/cloudflare-workers";

const indexHtml = `<!doctype html>
<html>
<head>
  <title>Studio</title>
  <script type="module" src="/assets/app.js"></script>
</head>
<body><div id="root"></div></body>
</html>`;

describe("Cloudflare Workers adapter", () => {
  it("serves configured index HTML with injected Studio config", async () => {
    const handler = betterAuthStudio({
      basePath: "/studio",
      indexHtml,
      metadata: {
        title: "Worker Studio",
        theme: "light",
      },
      tools: {
        exclude: ["run-migration"],
      },
    });

    const response = await handler(
      new Request("https://example.com/studio/users", {
        headers: { accept: "text/html" },
      }),
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("<title>Worker Studio</title>");
    expect(html).toContain('"basePath":"/studio"');
    expect(html).toContain('"exclude":["run-migration"]');
    expect(html).toContain('src="/studio/assets/app.js"');
  });

  it("delegates self-hosted JSON routes to the configured API handler", async () => {
    const handler = betterAuthStudio({
      basePath: "/studio",
      indexHtml,
      apiHandler: (request, context) => {
        const url = new URL(request.url);
        return new Response(
          JSON.stringify({
            path: url.pathname,
            contextPath: context.path,
            originalPath: context.originalPath,
          }),
          {
            headers: { "Content-Type": "application/json" },
          },
        );
      },
    });

    const response = await handler(
      new Request("https://example.com/studio/users?limit=10", {
        headers: { accept: "*/*" },
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      path: "/api/users",
      contextPath: "/api/users",
      originalPath: "/studio/users",
    });
  });

  it("handles the edge-safe health endpoint without an API handler", async () => {
    const handler = betterAuthStudio({
      basePath: "/studio",
      indexHtml,
    });

    const response = await handler(new Request("https://example.com/studio/api/health"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("ok");
    expect(data.environment).toBe("cloudflare-workers");
  });

  it("serves static assets from a Workers Assets binding using stripped base paths", async () => {
    let seenPath = "";
    const handler = betterAuthStudio({
      basePath: "/studio",
      assets: {
        fetch(request) {
          seenPath = new URL(request.url).pathname;
          return new Response("console.log('studio')", {
            headers: { "Content-Type": "application/javascript" },
          });
        },
      },
    });

    const response = await handler(new Request("https://example.com/studio/assets/app.js"));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(seenPath).toBe("/assets/app.js");
    expect(body).toBe("console.log('studio')");
  });

  it("auto-detects the default ASSETS binding from the Worker env", async () => {
    const handler = betterAuthStudio<{
      ASSETS: { fetch(request: Request): Response };
    }>({
      basePath: "/studio",
    });

    const response = await handler(new Request("https://example.com/studio/"), {
      ASSETS: {
        fetch() {
          return new Response(indexHtml, {
            headers: { "Content-Type": "text/html" },
          });
        },
      },
    });
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('"basePath":"/studio"');
  });

  it("returns a clear 501 for Studio API routes without an edge handler", async () => {
    const handler = betterAuthStudio({
      basePath: "/studio",
      indexHtml,
    });

    const response = await handler(
      new Request("https://example.com/studio/api/users", {
        headers: { accept: "application/json" },
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(501);
    expect(data.path).toBe("/api/users");
    expect(data.message).toContain("Provide apiHandler");
  });

  it("enforces Cloudflare IP block rules without node:net", async () => {
    const handler = betterAuthStudio({
      basePath: "/studio",
      indexHtml,
      access: {
        blockIpAddresses: ["203.0.113.*"],
      },
    });

    const response = await handler(
      new Request("https://example.com/studio/", {
        headers: {
          "cf-connecting-ip": "203.0.113.10",
        },
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.reason).toBe("ip_blocked");
  });

  it("does not import Node-only modules in the Worker adapter", () => {
    const source = readFileSync(
      new URL("../src/adapters/cloudflare-workers.ts", import.meta.url),
      "utf-8",
    );

    expect(source).not.toMatch(/from\s+["'](?:node:|fs|path|url|crypto|module|os)/);
  });
});
