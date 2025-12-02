import { auth } from "$lib/auth"
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";

export async function handle({ event, resolve }) {
  console.log({event})
  return svelteKitHandler({ event, resolve, auth, building });
}