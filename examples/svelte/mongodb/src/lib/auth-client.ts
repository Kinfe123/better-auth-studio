import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: import.meta.env.PUBLIC_BETTER_AUTH_URL || "http://localhost:5173",
});

