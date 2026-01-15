import { getSessionFromCtx } from 'better-auth/api';
import { createAuthMiddleware } from 'better-auth/plugins';
import type { StudioConfig } from '../types/handler.js';
import { emitEvent } from './event-ingestion.js';
import { wrapOrganizationPluginHooks } from './org-hooks-injector.js';
import { wrapAuthCallbacks } from './auth-callbacks-injector.js';

const INJECTED_HOOKS_MARKER = '__better_auth_studio_events_injected__';

/**
 * Create a Better Auth plugin for event ingestion
 */
let beforeSession: any = null;
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
        const headersObj: Record<string, string> = {};

        try {
          if (ctx.headers && typeof ctx.headers === 'object') {
            if (typeof ctx.headers.get === 'function') {
              try {
                ip = ctx.headers.get('x-forwarded-for') || ctx.headers.get('x-real-ip') || null;
              } catch (e) {}
            } else {
              ip = ctx.headers['x-forwarded-for'] || ctx.headers['x-real-ip'] || null;
            }
          }
        } catch (e) {}

        if (path === '/sign-up' || path === '/sign-up/email') {
          const body = ctx.body || {};

          if (!isError) {
            emitEvent(
              'user.joined',
              {
                status: 'success',
                userId: '',
                sessionId: '',
                metadata: {
                  email: body.email || '',
                  name: body.name || '',
                },
                request: {
                  headers: headersObj,
                  ip: ip || undefined,
                },
              },
              capturedConfig
            ).catch(() => {});
          } else if (isError) {
            emitEvent(
              'user.joined',
              {
                status: 'failed',
                metadata: {
                  email: body.email,
                  name: body.name,
                  reason:
                    returned.statusCode === 400
                      ? 'validation_failed'
                      : returned.statusCode === 409
                        ? 'user_already_exists'
                        : returned.body?.code || returned.body?.message || 'unknown',
                },
                request: {
                  headers: headersObj,
                  ip: ip || undefined,
                },
              },
              capturedConfig
            ).catch(() => {});
          }
        }

        if (path === '/sign-in' || path === '/sign-in/email') {
          const body = ctx.body || {};
          const user = returned.user || ctx.context?.returned;
          const session = returned.newSession || ctx.context?.newSession;
          if (!isError) {
            emitEvent(
              'user.logged_in',
              {
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
              },
              capturedConfig
            ).catch(() => {});

            // Also emit session.created
            if (session) {
              emitEvent(
                'session.created',
                {
                  status: 'success',
                  userId: user.id,
                  sessionId: session.id,
                  metadata: {
                    name: user.name,
                    email: body.email || user.email,
                    token: session.token,
                  },
                  request: {
                    headers: headersObj,
                    ip: ip || undefined,
                  },
                },
                capturedConfig
              ).catch(() => {});
            }
          } else if (isError) {
            emitEvent(
              'user.logged_in',
              {
                status: 'failed',
                metadata: {
                  email: body.email,
                  reason:
                    returned.statusCode === 401
                      ? 'invalid_credentials'
                      : returned.body?.code || 'unknown',
                },
                request: {
                  headers: headersObj,
                  ip: ip || undefined,
                },
              },
              capturedConfig
            ).catch(() => {});
          }
        }

        // Session created via social sign-in or OAuth callback
        if (
          path.startsWith('/sign-in/social') ||
          path.startsWith('/callback') ||
          path.startsWith('/oauth2/callback')
        ) {
          const newSession = ctx.context?.newSession || returned?.newSession;
          const user = newSession?.user || returned?.user;
          if (!isError && newSession && user) {
            emitEvent(
              'session.created',
              {
                status: 'success',
                userId: user.id,
                sessionId: newSession.session?.id || newSession.id,
                metadata: {
                  name: user.name,
                  email: user.email,
                  provider: path.includes('/callback/')
                    ? path.split('/callback/')[1]?.split('/')[0]
                    : undefined,
                },
                request: {
                  headers: headersObj,
                  ip: ip || undefined,
                },
              },
              capturedConfig
            ).catch(() => {});
          } else if (isError) {
            emitEvent(
              'session.created',
              {
                status: 'failed',
                metadata: {
                  reason:
                    returned.statusCode === 401
                      ? 'authentication_failed'
                      : returned.body?.code || 'unknown',
                  provider: path.includes('/callback/')
                    ? path.split('/callback/')[1]?.split('/')[0]
                    : undefined,
                },
                request: {
                  headers: headersObj,
                  ip: ip || undefined,
                },
              },
              capturedConfig
            ).catch(() => {});
          }
        }

        if (path === '/sign-out') {
          const session = beforeSession as any;
          const { user, session: sessionData } = session || {};
          if (!isError && user) {
            emitEvent(
              'user.logged_out',
              {
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
              },
              capturedConfig
            ).catch(() => {});

            // Also emit session.ended
            emitEvent(
              'session.ended',
              {
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
              },
              capturedConfig
            ).catch(() => {});
          } else if (isError) {
            emitEvent(
              'session.ended',
              {
                status: 'failed',
                metadata: {
                  reason: returned.body?.code || returned.body?.message || 'unknown',
                },
                request: {
                  headers: headersObj,
                  ip: ip || undefined,
                },
              },
              capturedConfig
            ).catch(() => {});
          }
        }

        if (path === '/reset-password') {
          const body = ctx.body || {};
          const user = returned?.user || ctx.context?.user;

          if (!isError && user) {
            emitEvent(
              'password.reset_completed',
              {
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
              },
              capturedConfig
            ).catch(() => {});
          } else if (isError) {
            emitEvent(
              'password.reset_completed',
              {
                status: 'failed',
                metadata: {
                  reason:
                    returned.statusCode === 400
                      ? 'invalid_token'
                      : returned.statusCode === 404
                        ? 'token_not_found'
                        : returned.body?.code || returned.body?.message || 'unknown',
                  token: body.token || body.code,
                },
                request: {
                  headers: headersObj,
                  ip: ip || undefined,
                },
              },
              capturedConfig
            ).catch(() => {});
          }
        }

        // User deleted
        // OAuth unlinked
        if (path === '/unlink-account') {
          const session = ctx.context?.session;
          const unlinkReturned = ctx.context?.returned || returned;
          const body = ctx.body || {};

          if (
            !isError &&
            session &&
            unlinkReturned &&
            typeof unlinkReturned === 'object' &&
            'status' in unlinkReturned
          ) {
            emitEvent(
              'oauth.unlinked',
              {
                status: 'success',
                userId: session.user.id,
                metadata: {
                  provider: body.providerId || body.provider,
                  accountId: body.accountId,
                  email: session.user.email,
                },
                request: {
                  headers: headersObj,
                  ip: ip || undefined,
                },
              },
              capturedConfig
            ).catch(() => {});
          } else if (isError) {
            emitEvent(
              'oauth.unlinked',
              {
                status: 'failed',
                metadata: {
                  provider: body.providerId || body.provider,
                  reason:
                    returned.statusCode === 400
                      ? 'invalid_request'
                      : returned.body?.code || returned.body?.message || 'unknown',
                },
                request: {
                  headers: headersObj,
                  ip: ip || undefined,
                },
              },
              capturedConfig
            ).catch(() => {});
          }
        }

        // OAuth linked (via callback - account already exists)
        if ((path.startsWith('/callback/') || path.startsWith('/oauth2/callback')) && !isError) {
          const newSession = ctx.context?.newSession || returned?.newSession;
          const user = newSession?.user || returned?.user;
          const existingUser = ctx.context?.existingUser;

          if (user && existingUser) {
            const provider = path.includes('/callback/')
              ? path.split('/callback/')[1]?.split('/')[0]
              : path.includes('/oauth2/callback/')
                ? path.split('/oauth2/callback/')[1]?.split('/')[0]
                : undefined;

            emitEvent(
              'oauth.linked',
              {
                status: 'success',
                userId: user.id,
                metadata: {
                  provider: provider,
                  email: user.email,
                  name: user.name,
                },
                request: {
                  headers: headersObj,
                  ip: ip || undefined,
                },
              },
              capturedConfig
            ).catch(() => {});
          }
        }

        // Organization created
        if (path === '/organization/create') {
          const orgReturned = ctx.context?.returned || returned;
          console.log({ orgReturned });
          getSessionFromCtx(ctx)
            .then((session) => {
              if (
                !isError &&
                orgReturned &&
                typeof orgReturned === 'object' &&
                'id' in orgReturned
              ) {
                emitEvent(
                  'organization.created',
                  {
                    status: 'success',
                    organizationId: orgReturned.id,
                    userId: session?.user.id,
                    metadata: {
                      organizationName: orgReturned.name,
                      organizationSlug: orgReturned.slug,
                      email: session?.user.email,
                      name: session?.user.name,
                    },
                    request: {
                      headers: headersObj,
                      ip: ip || undefined,
                    },
                  },
                  capturedConfig
                ).catch(() => {});
              } else if (isError) {
                const body = ctx.body || {};
                emitEvent(
                  'organization.created',
                  {
                    status: 'failed',
                    userId: session?.user.id,
                    metadata: {
                      organizationName: body?.name,
                      organizationSlug: body?.slug,
                      reason:
                        returned.statusCode === 400
                          ? 'validation_failed'
                          : returned.statusCode === 409
                            ? 'organization_exists'
                            : returned.body?.code || returned.body?.message || 'unknown',
                    },
                    request: {
                      headers: headersObj,
                      ip: ip || undefined,
                    },
                  },
                  capturedConfig
                ).catch(() => {});
              }
            })
            .catch(() => {});
        }
        if(path === "/admin/ban-user") {
          const body = ctx.body || {};
          const user = returned?.user || ctx.context?.returned?.user || ctx.context?.user;
          if (!isError && user) {
            emitEvent(
              'user.banned',
              {
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
              },
              capturedConfig
            ).catch(() => {});
          } else if (isError) {
            emitEvent(
              'user.banned',
              {
                status: 'failed',
                metadata: {
                  reason: returned.body?.code || returned.body?.message || 'unknown',
                },
                request: {
                  headers: headersObj,
                  ip: ip || undefined,
                },
              },
              capturedConfig
            ).catch(() => {});
          }
        }
        if(path === "/admin/unban-user") {
          const body = ctx.body || {};
          const user = returned?.user || ctx.context?.returned?.user || ctx.context?.user;
          if (!isError && user) {
            emitEvent(
              'user.unbanned',
              {
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
              },
              capturedConfig
            ).catch(() => {});
          } else if (isError) {
            emitEvent(
              'user.unbanned',
              {
                status: 'failed',
                metadata: {
                  reason: returned.body?.code || returned.body?.message || 'unknown',
                },
                request: {
                  headers: headersObj,
                  ip: ip || undefined,
                },
              },
              capturedConfig
            ).catch(() => {});
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
            beforeSession = await context.context.internalAdapter.findSession(body.token);
          },
        },
      ],
      after: [
        {
          matcher: (context: any) => {
            const path = context?.path || '';
            const shouldMatch =
              path === '/sign-up' ||
              path === '/sign-up/email' ||
              path === '/sign-in' ||
              path === '/sign-in/email' ||
              path.startsWith('/sign-in/social') ||
              path === '/sign-out' ||
              path === '/update-password' ||
              path === '/change-password' ||
              path === '/verify-email' ||
              path === '/forget-password' ||
              path === '/reset-password' ||
              path === '/delete-user' ||
              path === '/unlink-account' ||
              path.startsWith('/callback') ||
              path.startsWith('/oauth2/callback') ||
              path === '/organization/create' ||
              path === '/organization/update' ||
              path === '/organization/delete' || 
              path.startsWith('/admin/')
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
    const existingPlugin = auth.options.plugins.find(
      (p: any) => p?.id === 'better-auth-studio-events'
    );
    if (!existingPlugin) {
      auth.options.plugins.push(eventPlugin);
    }

    auth.options[INJECTED_HOOKS_MARKER] = true;

    // Wrap organization plugin hooks to emit events for member operations
    wrapOrganizationPluginHooks(auth, eventsConfig);

    // Wrap Better Auth callbacks to emit events
    wrapAuthCallbacks(auth, eventsConfig);
  } catch (error) {
    console.error('[Event Hooks] Failed to inject:', error);
  }
}
