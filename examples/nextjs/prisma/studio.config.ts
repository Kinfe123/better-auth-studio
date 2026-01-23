import type { StudioConfig } from "better-auth-studio";
import { auth } from "./lib/auth";
import { createClient } from "@clickhouse/client";

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
    allowEmails: ["kinfetare83@gmail.com", "kinfishtechy@gmail.com"],
  },
  // events: {
  //   enabled: true,
  //   client: clickhouseClient,
  //   clientType: 'clickhouse',
  //   tableName: 'auth_events',
  //   liveMarquee: {
  //     enabled: true,
  //   }
  // }
};

export default config;
