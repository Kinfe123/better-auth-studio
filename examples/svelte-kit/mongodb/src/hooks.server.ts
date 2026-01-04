import { auth } from "$lib/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";

export async function handle({ event, resolve }: { event: any; resolve: any }) {
  return svelteKitHandler({ event, resolve, auth, building });
}

