<script lang="ts">
  import { authClient } from "$lib/auth-client";
  import { onMount } from "svelte";

  let session = $state<any>(null);
  let loading = $state(true);

  onMount(async () => {
    session = await authClient.getSession();
    loading = false;
  });
</script>

<div class="container mx-auto p-8">
  <h1 class="text-4xl font-bold mb-6">Better Auth Studio - SvelteKit MongoDB Example</h1>

  <div class="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg mb-6">
    <h2 class="text-2xl font-semibold mb-4">Welcome</h2>
    <p class="text-gray-700 dark:text-gray-300 mb-4">
      This is a SvelteKit example project using Better Auth with MongoDB.
    </p>
    <div class="space-y-2">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        • <a href="/auth" class="text-blue-500 hover:underline">View Auth Page</a>
      </p>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        • Run <code class="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">pnpm studio</code> to
        open Better Auth Studio
      </p>
    </div>
  </div>

  {#if loading}
    <p>Loading session...</p>
  {:else if session?.user}
    <div class="bg-green-100 dark:bg-green-900 p-4 rounded-lg">
      <p class="text-green-800 dark:text-green-200">
        ✓ Signed in as: {session.user.email}
      </p>
    </div>
  {:else}
    <div class="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg">
      <p class="text-yellow-800 dark:text-yellow-200">Not signed in</p>
    </div>
  {/if}
</div>

