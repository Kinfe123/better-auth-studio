import { emitEvent } from './event-ingestion.js';
export function wrapDatabaseHooks(auth, eventsConfig) {
    if (!auth || !eventsConfig?.enabled) {
        return;
    }
    try {
        // Ensure auth.options exists
        if (!auth.options) {
            auth.options = {};
        }
        // Only proceed if auth.options is a valid object
        if (typeof auth.options !== 'object' || auth.options === null) {
            console.warn('[Database Hooks] auth.options is not a valid object');
            return;
        }
        const capturedConfig = eventsConfig;
        // Initialize databaseHooks if it doesn't exist
        if (!auth.options.databaseHooks) {
            auth.options.databaseHooks = {};
        }
        // Check if already wrapped
        if (auth.options.databaseHooks.__studio_wrapped) {
            return;
        }
        // Ensure databaseHooks is an object
        if (typeof auth.options.databaseHooks !== 'object' || auth.options.databaseHooks === null) {
            console.warn('[Database Hooks] databaseHooks is not a valid object');
            return;
        }
        try {
            const existingAccountHooks = auth.options.databaseHooks.account || {};
            const existingCreateHooks = existingAccountHooks.create || {};
            const existingAfter = existingCreateHooks.after;
            const oauthAccountAfter = async (account, context) => {
                // Validate context and internalAdapter exist
                if (!context || !context.internalAdapter) {
                    console.warn('[OAuth DB Hook] Context or internalAdapter is missing');
                    return;
                }
                // Validate account exists
                if (!account || !account.userId || !account.providerId) {
                    return;
                }
                console.log('OAuth account created', account);
                if (account.providerId !== 'credential') {
                    try {
                        // Ensure internalAdapter methods exist
                        if (typeof context.internalAdapter.findUserById !== 'function' ||
                            typeof context.internalAdapter.findAccounts !== 'function') {
                            console.warn('[OAuth DB Hook] internalAdapter methods are missing');
                            return;
                        }
                        const user = await context.internalAdapter.findUserById(account.userId);
                        if (user) {
                            const existingAccounts = await context.internalAdapter.findAccounts(account.userId);
                            const isLinking = existingAccounts && existingAccounts.length > 1; // More than just this new account
                            if (isLinking) {
                                await emitEvent('oauth.linked', {
                                    status: 'success',
                                    userId: account.userId,
                                    metadata: {
                                        provider: account.providerId,
                                        providerId: account.providerId,
                                        userEmail: user.email,
                                        email: user.email,
                                        name: user.name,
                                        accountId: account.accountId,
                                        linkedAt: new Date().toISOString(),
                                    },
                                }, capturedConfig).catch(() => { });
                            }
                            else {
                                await emitEvent('oauth.sign_in', {
                                    status: 'success',
                                    userId: account.userId,
                                    metadata: {
                                        provider: account.providerId,
                                        providerId: account.providerId,
                                        userEmail: user.email,
                                        email: user.email,
                                        name: user.name,
                                        emailVerified: user.emailVerified,
                                        accountId: account.accountId,
                                        createdAt: user.createdAt
                                            ? new Date(user.createdAt).toISOString()
                                            : new Date().toISOString(),
                                    },
                                }, capturedConfig).catch(() => { });
                            }
                        }
                    }
                    catch (error) {
                        console.error('[OAuth DB Hook] Error:', error);
                    }
                }
            };
            // Safely assign the hook - wrap in try-catch to prevent any Better Auth initialization errors
            try {
                auth.options.databaseHooks.account = {
                    ...existingAccountHooks,
                    create: {
                        ...existingCreateHooks,
                        before: existingCreateHooks.before,
                        after: async (account, context) => {
                            try {
                                // Call existing hook first if it exists
                                if (existingAfter && typeof existingAfter === 'function') {
                                    await existingAfter(account, context);
                                }
                                // Then call our OAuth tracking hook
                                await oauthAccountAfter(account, context);
                            }
                            catch (error) {
                                // Don't let hook errors break the flow
                                console.error('[Database Hook] Error in after hook:', error);
                                // Re-throw only if it's not a reloadNavigation error (Better Auth internal issue)
                                if (error instanceof Error && !error.message.includes('reloadNavigation')) {
                                    throw error;
                                }
                            }
                        },
                    },
                };
                auth.options.databaseHooks.__studio_wrapped = true;
            }
            catch (assignError) {
                // If assignment fails, log but don't crash
                console.error('[Database Hooks] Error assigning hooks:', assignError);
                // Don't mark as wrapped if assignment failed
            }
        }
        catch (hookError) {
            console.error('[Database Hooks] Error setting up hooks:', hookError);
            // Don't mark as wrapped if there was an error
        }
    }
    catch (error) {
        console.error('[Database Hooks] Failed to wrap:', error);
    }
}
//# sourceMappingURL=database-hook-injector.js.map