import { betterAuthStudio } from "better-auth-studio/cloudflare-workers";
import { createAuth } from "./auth";
import { createPrisma } from "./db";
import type { Env } from "./env";
import { createStudioApiHandler } from "./studio-api";

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/favicon.ico") {
      return new Response(null, { status: 404 });
    }

    const prisma = createPrisma(env);
    const auth = createAuth(prisma, env, request);
    const basePath = "";

    const studio = betterAuthStudio<Env, ExecutionContext>({
      auth,
      basePath,
      assets: (workerEnv) => workerEnv.ASSETS,
      apiHandler: createStudioApiHandler({ prisma, env }),
      metadata: {
        title: "Better Auth Studio Workers",
        theme: "dark",
        company: {
          name: "Cloudflare Workers Prisma Example",
        },
      },
      lastSeenAt: {
        enabled: true,
        columnName: "lastSeenAt",
      },
      tools: {
        exclude: ["run-migration", "test-db", "validate-config", "oauth-credentials"],
      },
    });

    const response = await studio(request, env, ctx);
    return addHeaders(response);
  },
} satisfies ExportedHandler<Env>;

function addHeaders(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("X-Example", "better-auth-studio-cloudflare-workers-prisma");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
