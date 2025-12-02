import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../../auth-schema";
const DATABASE = "postgresql://neondb_owner:npg_87iPmKpxjtbd@ep-shiny-scene-ah5bwfbl-pooler.c-3.us-east-1.aws.neon.tech/mac?sslmode=require&channel_binding=require"
const client = postgres(DATABASE);
export const db = drizzle(client, { schema: {
    user: schema.user,
    account: schema.account,
    session: schema.session,
    verification: schema.verification,
    invitation: schema.invitation,
    organization: schema.organization,
} });

