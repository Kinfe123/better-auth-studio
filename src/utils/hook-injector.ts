import { getSessionFromCtx } from 'better-auth/api';
import { createAuthMiddleware } from 'better-auth/plugins';
import type { StudioConfig } from '../types/handler.js';
import { wrapAuthCallbacks } from './auth-callbacks-injector.js';
import { emitEvent } from './event-ingestion.js';
import { wrapOrganizationPluginHooks } from './org-hooks-injector.js';

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
    setTimeout(() => {
      try {
        const path = ctx?.path || ctx?.context?.path || '';
        if (!path) return;

        const returned = ctx?.context?.returned;
        if (!returned) return;

        // Guard against Better Auth internal errors
        if (typeof returned === 'object' && returned !== null) {
          // Check if returned has problematic properties that might cause errors
          try {
            // Try to access common properties safely
            const _ = returned.statusCode;
          } catch (e) {
            // If accessing properties causes errors, skip processing
            return;
          }
        }

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
          const user = returned || ctx.context.returned;
          if (!isError) {
            emitEvent(
              'user.joined',
              {
                status: 'success',
                userId: returned.user.id,
                sessionId: '',
                metadata: {
                  email: body.email || returned.user.email || '',
                  name: body.name || returned.user.name || '',
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

        const isCallbackPath =
          path.startsWith('/callback/') ||
          path.startsWith('/callback') ||
          path.startsWith('/oauth2/callback/') ||
          path.startsWith('/oauth2/callback');

        if (isCallbackPath) {
          try {
            const newSession = ctx.context?.newSession || returned?.newSession;
            const user =
              newSession?.user ||
              returned?.user ||
              returned?.data?.user ||
              ctx.context?.user ||
              ctx.user ||
              (returned?.data && typeof returned.data === 'object' && 'user' in returned.data
                ? returned.data.user
                : null);
            const existingUser = ctx.context?.existingUser;
            const params = ctx.params;
            if (user) {
              const provider = path.includes('/callback/')
                ? path.split('/callback/')[1]?.split('/')[0]
                : path.includes('/oauth2/callback/')
                  ? path.split('/oauth2/callback/')[1]?.split('/')[0]
                  : path.includes('/callback')
                    ? path.split('/callback')[1]?.split('/')[1] ||
                      path.split('/callback')[1]?.split('?')[0]
                    : undefined;

              if (existingUser) {
                emitEvent(
                  'oauth.linked',
                  {
                    status: 'success',
                    userId: user.id,
                    metadata: {
                      provider: params.id,
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
              } else {
                // New user signing in via OAuth
                emitEvent(
                  'oauth.sign_in',
                  {
                    status: 'success',
                    userId: user.id,
                    sessionId: newSession?.session?.id || newSession?.id,
                    metadata: {
                      provider: params.id,
                      providerId: params.id,
                      userEmail: user.email,
                      email: user.email,
                      name: user.name,
                      emailVerified: user.emailVerified,
                    },
                    request: {
                      headers: headersObj,
                      ip: ip || undefined,
                    },
                  },
                  capturedConfig
                )
                  .then(() => {
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
                            provider: params.id,
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
                  })
                  .catch(() => {});
              }
            }
          } catch (callbackError: any) {
            // Suppress Better Auth internal errors
            const errorMessage = callbackError?.message || String(callbackError || '');
            if (
              !errorMessage.includes('reloadNavigation') &&
              !errorMessage.includes('Cannot read properties of undefined')
            ) {
              console.error('[OAuth Callback] Error:', errorMessage);
            }
          }
        }

        // Organization created
        if (path === '/organization/create') {
          const orgReturned = ctx.context?.returned || returned;
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
        if (path === '/admin/ban-user') {
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
        if (path === '/admin/unban-user') {
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

        if (path === '/update-user') {
          const updateReturned = ctx.context?.returned || returned;
          const session = ctx.context?.session;
          const oldData = (ctx.context as any)?._oldUserData;
          const body = ctx.body || {};

          if (!isError && updateReturned && session) {
            const updatedFields: Record<string, any> = {};
            const oldValues: Record<string, any> = {};
            if (body.name !== undefined && body.name !== oldData?.name) {
              updatedFields.name = body.name;
              oldValues.name = oldData?.name;
            }
            if (body.image !== undefined && body.image !== oldData?.image) {
              updatedFields.image = body.image;
              oldValues.image = oldData?.image;
            }
            if (body.email !== undefined && body.email !== oldData?.email) {
              updatedFields.email = body.email;
              oldValues.email = oldData?.email;
            }
            if (Object.keys(updatedFields).length > 0) {
              emitEvent(
                'user.updated',
                {
                  status: 'success',
                  userId: session.user.id,
                  metadata: {
                    email: session.user.email,
                    name: session.user.name,
                    updatedFields: updatedFields,
                    oldValues: oldValues,
                    updatedAt: new Date().toISOString(),
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
              'user.updated',
              {
                status: 'failed',
                metadata: {
                  reason:
                    returned.statusCode === 400
                      ? 'validation_failed'
                      : returned.statusCode === 401
                        ? 'unauthorized'
                        : returned.statusCode === 403
                          ? 'forbidden'
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
      } catch (error: any) {
        // Suppress Better Auth internal errors (reloadNavigation, etc.)
        const errorMessage = error?.message || String(error || '');
        if (
          errorMessage.includes('reloadNavigation') ||
          errorMessage.includes('Cannot read properties of undefined')
        ) {
          // These are Better Auth internal errors, not our issue
          return;
        }
        console.error('[Event Hook] Error:', errorMessage);
      }
    }, 0);
  });

  const oauthAccountAfter = async (account: any, context: any) => {
    if (!context || !context.internalAdapter) {
      return;
    }

    if (!account || !account.userId || !account.providerId) {
      return;
    }

    if (account.providerId !== 'credential') {
      try {
        if (
          typeof context.internalAdapter.findUserById !== 'function' ||
          typeof context.internalAdapter.findAccounts !== 'function'
        ) {
          return;
        }

        const user = await context.internalAdapter.findUserById(account.userId);

        if (user) {
          const existingAccounts = await context.internalAdapter.findAccounts(account.userId);
          const isLinking = existingAccounts && existingAccounts.length > 1; // More than just this new account

          if (isLinking) {
            await emitEvent(
              'oauth.linked',
              {
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
              },
              capturedConfig
            ).catch(() => {});
          } else {
            await emitEvent(
              'oauth.sign_in',
              {
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
              },
              capturedConfig
            ).catch(() => {});
          }
        }
      } catch (error) {
        console.error('[OAuth DB Hook] Error:', error);
      }
    }
  };

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
        {
          matcher: (context: any) => {
            return context.path === '/update-user';
          },
          handler: async (context: any) => {
            const session = context.context?.session;
            if (session?.user) {
              (context.context as any)._oldUserData = {
                name: session.user.name,
                image: session.user.image,
                email: session.user.email,
              };
            }
            return context;
          },
        },
      ],
      after: [
        {
          matcher: (context: any) => {
            const path = context?.path || context?.context?.path || '';

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
              path === '/delete-user' ||
              path === '/unlink-account' ||
              path.startsWith('/callback') ||
              path.startsWith('/oauth2/callback') ||
              path === '/organization/create' ||
              path === '/organization/update' ||
              path === '/organization/delete' ||
              path === '/update-user' ||
              path.startsWith('/admin/');

            return shouldMatch;
          },
          handler: eventMiddleware,
        },
      ],
    },
    // TODO: I cant be able to reach the database hook from this. this will be important for most of event ingestions
    // databaseHooks: {
    //   account: {
    //     create: {
    //       after: oauthAccountAfter,
    //     },
    //   },
    // },
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

    const existingPlugin = auth.options.plugins.find(
      (p: any) => p?.id === 'better-auth-studio-events'
    );
    if (!existingPlugin) {
      auth.options.plugins.push(eventPlugin);
    }

    auth.options[INJECTED_HOOKS_MARKER] = true;

    wrapOrganizationPluginHooks(auth, eventsConfig);

    wrapAuthCallbacks(auth, eventsConfig);
  } catch (error) {
    console.error('[Event Hooks] Failed to inject:', error);
  }
}
