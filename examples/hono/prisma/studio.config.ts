import type { StudioConfig } from "better-auth-studio";
import { auth } from "./src/auth";
import { createClient } from "@clickhouse/client";

import Database from "better-sqlite3";
const clickhouseClient = createClient({
  host: process.env.CLICKHOUSE_HOST,
  username: process.env.CLICKHOUSE_USERNAME || "default",
  password: process.env.CLICKHOUSE_PASSWORD || "",
});

const config: StudioConfig = {
  auth,
  basePath: "/api/studio",
  metadata: {
    title: "Better Auth Studio",
    theme: "dark",
  },
  access: {
    roles: ["admin"],
    allowEmails: ["kinfetare83@gmail.com"],
  },
  events: {
    enabled: true,
    client: new Database("./db.sqlite"),
    clientType: "sqlite",
    tableName: "auth_events",
    onEventIngest: (event) => {
      console.log("event ingested ", event);
    },
    liveMarquee: {
      enabled: true,
      pollInterval: 2000,
      speed: 1,
      sort: "desc",
      pauseOnHover: true,
      timeWindow: {
        since: "1h",
      },
      limit: 10,
      colors: {
        success: "#34d399",
        info: "#fcd34d",
        warning: "#facc15",
        error: "#f87171",
        failed: "#f87171",
      },
    },
  },
};

export default config;
