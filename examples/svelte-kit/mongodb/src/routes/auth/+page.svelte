<script lang="ts">
  import { authClient } from "$lib/auth-client";
  import { onMount } from "svelte";

  let session = $state<any>(null);
  let loading = $state(true);

  onMount(async () => {
    session = await authClient.getSession();
    loading = false;
  });

  async function handleSignIn() {
    await authClient.signIn.email({
      email: "test@example.com",
      password: "password123",
    });
    session = await authClient.getSession();
  }

  async function handleSignOut() {
    await authClient.signOut();
    session = null;
  }
</script>

<div class="container mx-auto p-8">
  <h1 class="text-3xl font-bold mb-6">Better Auth - SvelteKit MongoDB Example</h1>

  {#if loading}
    <p>Loading...</p>
  {:else if session?.user}
    <div class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
      <h2 class="text-xl font-semibold mb-2">Signed in as:</h2>
      <p class="text-gray-700 dark:text-gray-300">Email: {session.user.email}</p>
      <p class="text-gray-700 dark:text-gray-300">Name: {session.user.name}</p>
    </div>
    <button
      on:click={handleSignOut}
      class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
    >
      Sign Out
    </button>
  {:else}
    <p class="mb-4">Not signed in</p>
    <button
      on:click={handleSignIn}
      class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
    >
      Sign In
    </button>
  {/if}
</div>

