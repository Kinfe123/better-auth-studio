import { emitEvent } from './event-ingestion.js';
import type { StudioConfig } from '../types/handler.js';
import { createAuthMiddleware } from 'better-auth/plugins';
import { getSessionFromCtx } from "better-auth/api";

const INJECTED_HOOKS_MARKER = '__better_auth_studio_events_injected__';

/**
 * Create a Better Auth plugin for event ingestion
 */
let beforeSession: any = null
function createEventIngestionPlugin(eventsConfig: StudioConfig['events']): any {
    const capturedConfig = eventsConfig;
    
    const eventMiddleware = createAuthMiddleware(async (ctx: any) => {
        if (!capturedConfig?.enabled) {
            return ctx;
        }
        // Fire and forget event emission - don't await or block
        // Use setTimeout to ensure this runs after the response is sent
        setTimeout(() => {
            try {
                const path = ctx?.path || '';
                if (!path) return;

                console.log('[Event Hook] After hook triggered for path:', path);
                
                const returned = ctx?.context?.returned;
                if (!returned) return;

                const isError = returned.statusCode && returned.statusCode >= 400;
                const isSuccess = !isError && returned.statusCode === 200;

                let ip: string | null = null;
                let headersObj: Record<string, string> = {};

                try {
                    if (ctx.headers && typeof ctx.headers === 'object') {
                        if (typeof ctx.headers.get === 'function') {
                            try {
                                ip = ctx.headers.get('x-forwarded-for') || ctx.headers.get('x-real-ip') || null;
                            } catch (e) {
                            }
                        } else {
                            ip = ctx.headers['x-forwarded-for'] || ctx.headers['x-real-ip'] || null;
                        }
                    }
                } catch (e) {
                }

                if (path === '/sign-up' || path === '/sign-up/email') {
                    const body = ctx.body || {};
                    
                    if (!isError) {
                        emitEvent('user.joined', {
                            status: 'success',
                            userId: "",
                            sessionId: "",
                            metadata: {
                                email: body.email || "",
                                name: body.name || "",
                            },
                            request: {
                                headers: headersObj,
                                ip: ip || undefined,
                            },
                        }, capturedConfig).catch(() => {});
                    } else if (isError) {
                        emitEvent('user.joined', {
                            status: 'failed',
                            metadata: {
                                email: body.email,
                                name: body.name,
                                reason: returned.statusCode === 400 ? 'validation_failed' : 
                                        returned.statusCode === 409 ? 'user_already_exists' :
                                        returned.body?.code || returned.body?.message || 'unknown',
                            },
                            request: {
                                headers: headersObj,
                                ip: ip || undefined,
                            },
                        }, capturedConfig).catch(() => {});
                    }
                }

                if (path === '/sign-in' || path === '/sign-in/email') {
                    const body = ctx.body || {};
                    const user = returned.user || ctx.context?.returned;
                    const session = returned.newSession || ctx.context?.newSession;
                    if (!isError) {
                        emitEvent('user.logged_in', {
                            status: 'success',
                            userId: user.id,
                            sessionId: session?.id,
                            metadata: {
                                name: user.name,
                                email: body.email || user.email,
                            },
                            request: {
                                headers: headersObj,
                                ip: ip || undefined,
                            },
                        }, capturedConfig).catch(() => {});
                    } else if (isError) {
                        emitEvent('user.logged_in', {
                            status: 'failed',
                            metadata: {
                                email: body.email,
                                reason: returned.statusCode === 401 ? 'invalid_credentials' : returned.body?.code || 'unknown',
                            },
                            request: {
                                headers: headersObj,
                                ip: ip || undefined,
                            },
                        }, capturedConfig).catch(() => {});
                    }
                }

                if (path === '/sign-out') {
                    const session = beforeSession as any;
                    const { user, session: sessionData } = session;
                    if (!isError) {
                        emitEvent('user.logged_out', {
                            status: 'success',
                            userId: user.id,
                            sessionId: sessionData?.id,
                            metadata: {
                                email: user?.email,
                                name: user?.name,
                            },
                            request: {
                                headers: headersObj,
                                ip: ip || undefined,
                            },
                        }, capturedConfig).catch(() => {});
                    }
                }
                if (path === '/update-password') {
                    const body = ctx.body || {};
                    const user = returned.body?.user || ctx.context?.user;

                    if (!isError) {
                        emitEvent('user.password_changed', {
                            status: 'success',
                            userId: user.id,
                            metadata: {
                                email: user.email,
                                name: user.name,
                            },
                            request: {
                                headers: headersObj,
                                ip: ip || undefined,
                            },
                        }, capturedConfig).catch(() => {});
                    }
                }

                if (path === '/verify-email') {
                    const body = ctx.body || {};
                    const user = returned.body?.user || ctx.context?.user;

                    if (!isError) {
                        emitEvent('user.email_verified', {
                            status: 'success',
                            userId: user.id,
                            metadata: {
                                email: user.email,
                                name: user.name,
                                // Include token/identifier from body if available
                                token: body.token || body.code,
                            },
                            request: {
                                headers: headersObj,
                                ip: ip || undefined,
                            },
                        }, capturedConfig).catch(() => {});
                    }
                }

                if (path === '/forget-password') {
                    const body = ctx.body || {};

                    if (isSuccess) {
                        emitEvent('password.reset_requested', {
                            status: 'success',
                            metadata: {
                                email: body.email,
                            },
                            request: {
                                headers: headersObj,
                                ip: ip || undefined,
                            },
                        }, capturedConfig).catch(() => {});
                    }
                }

                if (path === '/reset-password') {
                    const body = ctx.body || {};
                    const user = returned.body?.user || ctx.context?.user;

                    if (!isError) {
                        emitEvent('password.reset_completed', {
                            status: 'success',
                            userId: user.id,
                            metadata: {
                                email: user.email,
                                name: user.name,
                                token: body.token || body.code,
                            },
                            request: {
                                headers: headersObj,
                                ip: ip || undefined,
                            },
                        }, capturedConfig).catch(() => {});
                    }
                }
            } catch (error: any) {
                console.error('[Event Hook] Error:', error?.message || 'Unknown error');
            }
        }, 0);

    });

    return {
        id: 'better-auth-studio-events',
        hooks: {
            before: [
                {
                    matcher: (context: any) => {
                        return context.path === '/sign-out';
                    },
                    handler: async (context: any) => {
                        const body = context.body || {};
                        beforeSession = await context.context.internalAdapter.findSession(body.token)
                    }
                }
            ],
            after: [
                {
                    matcher: (context: any) => {
                        const path = context?.path || '';
                        const shouldMatch = path === '/sign-up' || 
                                          path === '/sign-up/email' || 
                                          path === '/sign-in' || 
                                          path === '/sign-in/email' || 
                                          path === '/sign-out' || 
                                          path === '/update-password' || 
                                          path === '/verify-email' || 
                                          path === '/forget-password' || 
                                          path === '/reset-password';
                        if (shouldMatch) {
                            console.log('[Event Hook] Matcher matched path:', path);
                        }
                        return shouldMatch;
                    },
                    handler: eventMiddleware,
                },
            ],
        },
    };
}

/**
 * Inject middleware hooks into Better Auth using plugins
 * 
 * Better Auth processes plugins during initialization, so we add the plugin
 * to auth.options.plugins array
 */
export function injectEventHooks(auth: any, eventsConfig: StudioConfig['events']): void {
    if (!auth || !eventsConfig?.enabled) {
        return;
    }

    try {
        if (auth.options?.[INJECTED_HOOKS_MARKER]) {
            return;
        }

        const eventPlugin = createEventIngestionPlugin(eventsConfig);

        if (!auth.options) {
            auth.options = {};
        }

        if (!auth.options.plugins) {
            auth.options.plugins = [];
        }

        // Check if plugin already exists
        const existingPlugin = auth.options.plugins.find((p: any) => p?.id === 'better-auth-studio-events');
        if (!existingPlugin) {
            auth.options.plugins.push(eventPlugin);
        }

        auth.options[INJECTED_HOOKS_MARKER] = true;
    } catch (error) {
        console.error('[Event Hooks] Failed to inject:', error);
    }
}
