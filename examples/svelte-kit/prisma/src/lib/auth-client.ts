import { createAuthClient } from "better-auth/svelte";

export const authClient = createAuthClient({
  baseURL: import.meta.env.PUBLIC_BETTER_AUTH_URL || "http://localhost:5173",
  plugins: [
    // some client plugin
  ] 
});

