import { emitEvent } from './event-ingestion.js';
/**
 * Helper to extract request info from Better Auth request object
 */
function getRequestInfo(request) {
    const headersObj = {};
    let ip;
    if (request) {
        try {
            if (request instanceof Request) {
                request.headers.forEach((value, key) => {
                    headersObj[key] = value;
                });
                ip =
                    request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
            }
            else if (request.headers) {
                if (typeof request.headers.get === 'function') {
                    ip =
                        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
                    request.headers.forEach?.((value, key) => {
                        headersObj[key] = value;
                    });
                }
                else {
                    ip = request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || undefined;
                    Object.entries(request.headers).forEach(([key, value]) => {
                        headersObj[key] = String(value);
                    });
                }
            }
        }
        catch (e) {
            // Ignore errors
        }
    }
    return { headers: headersObj, ip };
}
/**
 * Wraps Better Auth callbacks to automatically emit events
 * This should be called during Better Auth initialization
 */
export function wrapAuthCallbacks(auth, eventsConfig) {
    if (!auth || !eventsConfig?.enabled) {
        return;
    }
    try {
        const capturedConfig = eventsConfig;
        const wrapCallback = (originalCallback, eventType, eventData) => {
            return (async (...args) => {
                if (originalCallback) {
                    await originalCallback(...args);
                }
                const data = eventData(args);
                const requestInfo = getRequestInfo(args[args.length - 1]);
                emitEvent(eventType, {
                    status: 'success',
                    ...data,
                    request: requestInfo,
                }, capturedConfig).catch(() => { });
            });
        };
        const deleteUserConfig = auth.options?.user?.deleteUser || auth.user?.deleteUser;
        if (deleteUserConfig && !deleteUserConfig.__studio_wrapped) {
            const originalSendDeleteVerification = deleteUserConfig.sendDeleteAccountVerification;
            deleteUserConfig.sendDeleteAccountVerification = wrapCallback(originalSendDeleteVerification, 'user.delete_verification_requested', (args) => {
                const data = args[0];
                const user = data?.user;
                return {
                    userId: user?.id,
                    metadata: {
                        email: user?.email,
                        name: user?.name,
                        token: data?.token,
                    },
                };
            });
            // Wrap afterDelete callback
            const originalAfterDelete = deleteUserConfig.afterDelete;
            deleteUserConfig.afterDelete = wrapCallback(originalAfterDelete, 'user.deleted', (args) => {
                const user = args[0];
                return {
                    userId: user?.id,
                    metadata: {
                        email: user?.email,
                        name: user?.name,
                    },
                };
            });
            deleteUserConfig.__studio_wrapped = true;
        }
        const emailVerificationConfig = auth.options?.emailVerification || auth.emailVerification;
        if (emailVerificationConfig && !emailVerificationConfig.__studio_wrapped) {
            const originalOnEmailVerification = emailVerificationConfig.onEmailVerification;
            emailVerificationConfig.onEmailVerification = wrapCallback(originalOnEmailVerification, 'user.email_verified', (args) => {
                const user = args[0];
                return {
                    userId: user?.id,
                    metadata: {
                        email: user?.email,
                        name: user?.name,
                        verifiedAt: new Date().toISOString(),
                    },
                };
            });
            emailVerificationConfig.__studio_wrapped = true;
        }
        const emailAndPasswordConfig = auth.options?.emailAndPassword || auth.emailAndPassword;
        if (emailAndPasswordConfig && !emailAndPasswordConfig.__studio_wrapped) {
            const originalOnPasswordChange = emailAndPasswordConfig.onPasswordChange;
            emailAndPasswordConfig.onPasswordChange = wrapCallback(originalOnPasswordChange, 'user.password_changed', (args) => {
                const data = args[0];
                return {
                    userId: data?.user?.id,
                    metadata: {
                        email: data?.user?.email,
                        name: data?.user?.name,
                        revokeOtherSessions: data?.revokeOtherSessions || false,
                        changedAt: new Date().toISOString(),
                    },
                };
            });
            const originalOnPasswordReset = emailAndPasswordConfig.onPasswordReset;
            emailAndPasswordConfig.onPasswordReset = wrapCallback(originalOnPasswordReset, 'password.reset_completed', (args) => {
                console.log({ args });
                const data = args[0];
                const request = args[1];
                const requestInfo = getRequestInfo(request);
                return {
                    userId: data?.user?.id,
                    metadata: {
                        email: data?.user?.email,
                        name: data?.user?.name || data?.user?.email || 'Someone',
                        resetAt: new Date().toISOString(),
                    },
                    request: requestInfo,
                };
            });
            emailAndPasswordConfig.__studio_wrapped = true;
        }
    }
    catch (error) {
        console.error('[Auth Callbacks] Failed to wrap callbacks:', error);
    }
}
//# sourceMappingURL=auth-callbacks-injector.js.map