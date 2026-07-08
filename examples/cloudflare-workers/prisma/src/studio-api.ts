import type { PrismaClient } from "./generated/prisma/client";
import type { Env } from "./env";
import { csv } from "./env";
import { createDatabaseSchema } from "./schema";

type HandlerOptions = {
  prisma: PrismaClient;
  env: Env;
};

type JsonData = Record<string, unknown> | Array<unknown>;

const PLUGINS = [
  {
    id: "organization",
    name: "Organization",
    description: "Organization and team management for Better Auth",
    enabled: true,
  },
  {
    id: "admin",
    name: "Admin",
    description: "Admin controls for Better Auth",
    enabled: true,
  },
];

export function createStudioApiHandler(options: HandlerOptions) {
  return async (request: Request, context: { path: string }) => {
    const url = new URL(request.url);
    const path = context.path;

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    if (request.method !== "GET") {
      return json({ error: "This Workers example implements read-only Studio APIs." }, 405);
    }

    try {
      if (path === "/api/config") return json(createConfigResponse(options.env, request));
      if (path === "/api/db") return json(createDbResponse());
      if (path === "/api/plugins") return json({ plugins: PLUGINS, totalPlugins: PLUGINS.length });
      if (path === "/api/plugins/teams/status") return json(pluginStatus(true));
      if (path === "/api/plugins/organization/status") return json(pluginStatus(true));
      if (path === "/api/admin/status") return json(adminStatus(options.env));
      if (path === "/api/events/status") return json(eventsStatus());
      if (path === "/api/events") return json({ success: true, events: [], total: 0 });
      if (path === "/api/events/count") return json({ count: 0 });
      if (path === "/api/analytics") return json(emptyAnalytics(url));
      if (path === "/api/counts") return json(await counts(options.prisma));
      if (path === "/api/stats") return json(await stats(options.prisma));
      if (path === "/api/database/schema") return json(await databaseSchema(options.prisma));
      if (path === "/api/users/all") return json(await usersAll(options.prisma));
      if (path === "/api/users") return json(await users(options.prisma, url));
      if (path === "/api/sessions") return json(await sessions(options.prisma, url));
      if (path === "/api/organizations") return json(await organizations(options.prisma));
      if (path === "/api/teams") return json(await teams(options.prisma));
      if (path === "/api/dashboard/recent-users") return json(await recentUsers(options.prisma));
      if (path === "/api/dashboard/recent-organizations") {
        return json(await recentOrganizations(options.prisma));
      }
      if (path === "/api/dashboard/recent-teams") return json(await recentTeams(options.prisma));
      if (path === "/api/dashboard/invitations") return json({ invitations: [] });
      if (path === "/api/dashboard/geo-distribution") return json({ countries: [] });
      if (path === "/api/geo/resolve") return json({ success: true, location: null });

      const userRoute = path.match(/^\/api\/users\/([^/]+)$/);
      if (userRoute) return json(await userById(options.prisma, userRoute[1]));

      const userSessionsRoute = path.match(/^\/api\/users\/([^/]+)\/sessions$/);
      if (userSessionsRoute)
        return json(await sessionsByUser(options.prisma, userSessionsRoute[1]));

      const userAccountsRoute = path.match(/^\/api\/users\/([^/]+)\/accounts$/);
      if (userAccountsRoute)
        return json(await accountsByUser(options.prisma, userAccountsRoute[1]));

      const userOrganizationsRoute = path.match(/^\/api\/users\/([^/]+)\/organizations$/);
      if (userOrganizationsRoute) return json({ organizations: [] });

      const userTeamsRoute = path.match(/^\/api\/users\/([^/]+)\/teams$/);
      if (userTeamsRoute) return json({ teams: [] });

      const userInvitationsRoute = path.match(/^\/api\/users\/([^/]+)\/invitations$/);
      if (userInvitationsRoute) return json({ invitations: [] });

      return null;
    } catch (error) {
      return json(
        {
          error: "Cloudflare Workers example API error",
          message: error instanceof Error ? error.message : String(error),
        },
        500,
      );
    }
  };
}

function json(data: JsonData, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function createConfigResponse(env: Env, request: Request) {
  const origin = new URL(request.url).origin;
  return {
    appName: "Better Auth Workers",
    baseURL: env.BETTER_AUTH_URL || origin,
    basePath: "/api/auth",
    secret: env.AUTH_SECRET ? "Configured" : "Using development fallback",
    database: {
      type: "Prisma",
      adapter: "prisma",
      version: "7",
      casing: "camel",
      debugLogs: false,
      dialect: "postgresql",
    },
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: [],
    trustedOrigins: [origin, env.BETTER_AUTH_URL].filter(Boolean),
    telemetry: {
      enabled: false,
    },
    studio: {
      version: "local",
      nodeVersion: "cloudflare-workers",
      platform: "cloudflare-workers",
      uptime: 0,
    },
  };
}

function createDbResponse() {
  return {
    success: true,
    name: "prisma",
    version: "7",
    dialect: "postgresql",
    adapter: "prisma",
    displayName: "Prisma",
    autoDetected: true,
  };
}

function pluginStatus(enabled: boolean) {
  return {
    enabled,
    availablePlugins: PLUGINS.map((plugin) => plugin.id),
    configPath: null,
  };
}

function adminStatus(env: Env) {
  return {
    enabled: true,
    configPath: null,
    adminPlugin: {
      id: "admin",
      adminUserIds: csv(env.ADMIN_USER_IDS),
    },
  };
}

function eventsStatus() {
  return {
    enabled: false,
    configured: false,
    initialized: false,
    hasProvider: false,
  };
}

function emptyAnalytics(url: URL) {
  const period = url.searchParams.get("period") || "ALL";
  const type = url.searchParams.get("type") || "users";
  return {
    type,
    period,
    labels: [],
    data: [],
    percentageChange: 0,
  };
}

async function safeCount(label: string, count: () => Promise<number>) {
  try {
    return await count();
  } catch (error) {
    console.warn(`Failed to count ${label}:`, error);
    return 0;
  }
}

async function countMap(prisma: PrismaClient) {
  const [user, session, account, organization, team] = await Promise.all([
    safeCount("users", () => prisma.user.count()),
    safeCount("sessions", () => prisma.session.count()),
    safeCount("accounts", () => prisma.account.count()),
    safeCount("organizations", () => prisma.organization.count()),
    safeCount("teams", () => prisma.team.count()),
  ]);

  return {
    user,
    session,
    account,
    organization,
    team,
  };
}

async function counts(prisma: PrismaClient) {
  const rowCounts = await countMap(prisma);
  return {
    users: rowCounts.user,
    sessions: rowCounts.session,
    organizations: rowCounts.organization,
    teams: rowCounts.team,
    events: 0,
  };
}

async function stats(prisma: PrismaClient) {
  const rowCounts = await countMap(prisma);
  const activeSessions = await safeCount("active sessions", () =>
    prisma.session.count({
      where: {
        expiresAt: {
          gt: new Date(),
        },
      },
    }),
  );

  return {
    totalUsers: rowCounts.user,
    totalSessions: rowCounts.session,
    activeSessions,
    activeUsers: activeSessions,
    totalOrganizations: rowCounts.organization,
    totalTeams: rowCounts.team,
  };
}

async function databaseSchema(prisma: PrismaClient) {
  const rowCounts = await countMap(prisma);
  return createDatabaseSchema(rowCounts);
}

function parsePagination(url: URL) {
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const limit = Math.min(10000, Math.max(1, Number(url.searchParams.get("limit") || "20")));
  return { page, limit, skip: (page - 1) * limit };
}

async function users(prisma: PrismaClient, url: URL) {
  const { limit, skip } = parsePagination(url);
  const search = url.searchParams.get("search")?.trim();
  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: "insensitive" as const } },
          { name: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const list = await prisma.user.findMany({
    where,
    take: limit,
    skip,
    orderBy: { createdAt: "desc" },
  });

  return { users: list };
}

async function usersAll(prisma: PrismaClient) {
  const list = await prisma.user.findMany({
    take: 100000,
    orderBy: { createdAt: "desc" },
  });
  return { success: true, users: list };
}

async function userById(prisma: PrismaClient, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  return user ? { user } : { error: "User not found" };
}

async function sessions(prisma: PrismaClient, url: URL) {
  const { limit, skip } = parsePagination(url);
  const list = await prisma.session.findMany({
    take: limit,
    skip,
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });
  return { sessions: list };
}

async function sessionsByUser(prisma: PrismaClient, userId: string) {
  const list = await prisma.session.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return { sessions: list };
}

async function accountsByUser(prisma: PrismaClient, userId: string) {
  const list = await prisma.account.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return { accounts: list };
}

async function organizations(prisma: PrismaClient) {
  const list = await prisma.organization.findMany({
    take: 1000,
    orderBy: { createdAt: "desc" },
  });
  return { organizations: list };
}

async function teams(prisma: PrismaClient) {
  const list = await prisma.team.findMany({
    take: 1000,
    orderBy: { createdAt: "desc" },
    include: { organization: true },
  });
  return { teams: list };
}

async function recentUsers(prisma: PrismaClient) {
  const users = await prisma.user.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
  });
  return { users };
}

async function recentOrganizations(prisma: PrismaClient) {
  const organizations = await prisma.organization.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
  });
  return { organizations };
}

async function recentTeams(prisma: PrismaClient) {
  const teams = await prisma.team.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
  });
  return { teams };
}
