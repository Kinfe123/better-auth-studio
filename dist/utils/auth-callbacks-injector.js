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
// Map to track which password reset method was used (for completion event)
// Key: email, Value: 'otp' | 'token'
const passwordResetMethod = new Map();
// Clean up old entries periodically (they should be cleared after use, but just in case)
setInterval(() => {
    // Clear all entries - they should be cleared after password reset completes anyway
    passwordResetMethod.clear();
}, 60 * 60 * 1000); // Every hour
export function wrapAuthCallbacks(auth, eventsConfig) {
    if (!auth || !eventsConfig?.enabled) {
        return;
    }
    try {
        console.log('[Auth Callbacks] Starting wrapAuthCallbacks', {
            hasAuth: !!auth,
            hasOptions: !!auth.options,
            hasPlugins: !!auth.options?.plugins,
            pluginsCount: auth.options?.plugins?.length || 0,
            pluginIds: auth.options?.plugins?.map((p) => p?.id) || [],
        });
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
        console.log('[Auth Callbacks] emailAndPasswordConfig:', {
            exists: !!emailAndPasswordConfig,
            hasSendResetPassword: !!emailAndPasswordConfig?.sendResetPassword,
            hasOnPasswordReset: !!emailAndPasswordConfig?.onPasswordReset,
            alreadyWrapped: !!emailAndPasswordConfig?.__studio_wrapped,
            configKeys: Object.keys(emailAndPasswordConfig || {}),
        });
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
            // Wrap sendResetPassword to track password.reset_requested
            const originalSendResetPassword = emailAndPasswordConfig.sendResetPassword;
            console.log('[Auth Callbacks] sendResetPassword:', {
                exists: !!originalSendResetPassword,
                type: typeof originalSendResetPassword,
            });
            if (originalSendResetPassword) {
                emailAndPasswordConfig.sendResetPassword = async (...args) => {
                    console.log('[Auth Callbacks] sendResetPassword called!', { argsCount: args.length });
                    const data = args[0];
                    const request = args[1];
                    const requestInfo = getRequestInfo(request);
                    // Mark this email as using token-based reset
                    const email = data?.user?.email?.toLowerCase();
                    if (email) {
                        passwordResetMethod.set(email, 'token');
                    }
                    const originalPromise = originalSendResetPassword(...args);
                    const eventPromise = emitEvent('password.reset_requested', {
                        status: 'success',
                        userId: data?.user?.id,
                        metadata: {
                            email: data?.user?.email,
                            name: data?.user?.name || data?.user?.email || 'Someone',
                            requestedAt: new Date().toISOString(),
                        },
                        request: requestInfo,
                    }, capturedConfig).catch(() => { });
                    await originalPromise;
                    eventPromise.catch(() => { });
                };
                console.log('[Auth Callbacks] sendResetPassword wrapped successfully');
            }
            else {
                console.warn('[Auth Callbacks] sendResetPassword not found in emailAndPasswordConfig');
            }
            const originalOnPasswordReset = emailAndPasswordConfig.onPasswordReset;
            console.log('[Auth Callbacks] onPasswordReset:', {
                exists: !!originalOnPasswordReset,
                type: typeof originalOnPasswordReset,
            });
            emailAndPasswordConfig.onPasswordReset = async (...args) => {
                console.log('[Auth Callbacks] onPasswordReset called!', { argsCount: args.length });
                if (originalOnPasswordReset) {
                    await originalOnPasswordReset(...args);
                }
                const data = args[0];
                const request = args[1];
                const requestInfo = getRequestInfo(request);
                const userEmail = data?.user?.email?.toLowerCase();
                const method = userEmail ? passwordResetMethod.get(userEmail) : undefined;
                const isOtpReset = method === 'otp';
                console.log('[Auth Callbacks] onPasswordReset details:', {
                    userEmail,
                    method,
                    isOtpReset,
                    hasUser: !!data?.user,
                });
                if (userEmail) {
                    passwordResetMethod.delete(userEmail);
                }
                const eventType = isOtpReset ? 'password.reset_completed_otp' : 'password.reset_completed';
                emitEvent(eventType, {
                    status: 'success',
                    userId: data?.user?.id,
                    metadata: {
                        email: data?.user?.email,
                        name: data?.user?.name || data?.user?.email || 'Someone',
                        resetAt: new Date().toISOString(),
                        method: isOtpReset ? 'email_otp' : 'token',
                    },
                    request: requestInfo,
                }, capturedConfig).catch(() => { });
            };
            console.log('[Auth Callbacks] onPasswordReset wrapped successfully');
            emailAndPasswordConfig.__studio_wrapped = true;
        }
        const emailOtpPlugin = auth.options?.plugins?.find((p) => p?.id === 'email-otp');
        console.log('[Auth Callbacks] emailOtpPlugin:', {
            exists: !!emailOtpPlugin,
            hasOptions: !!emailOtpPlugin?.options,
            hasSendVerificationOTP: !!emailOtpPlugin?.options?.sendVerificationOTP,
            alreadyWrapped: !!emailOtpPlugin?.__studio_wrapped,
            pluginKeys: Object.keys(emailOtpPlugin || {}),
            optionsKeys: Object.keys(emailOtpPlugin?.options || {}),
            hasInit: !!emailOtpPlugin?.init,
        });
        if (emailOtpPlugin && !emailOtpPlugin.__studio_wrapped) {
            const originalSendVerificationOTP = emailOtpPlugin.options?.sendVerificationOTP;
            console.log('[Auth Callbacks] sendVerificationOTP:', {
                exists: !!originalSendVerificationOTP,
                type: typeof originalSendVerificationOTP,
                pluginHasSendVerificationOTP: !!emailOtpPlugin.sendVerificationOTP,
                pluginKeys: Object.keys(emailOtpPlugin),
            });
            if (originalSendVerificationOTP) {
                console.log('[Auth Callbacks] Wrapping sendVerificationOTP...');
                const wrappedSendVerificationOTP = async (data, ctx) => {
                    console.log('[Auth Callbacks] sendVerificationOTP called!', {
                        type: data.type,
                        email: data.email,
                        hasCtx: !!ctx,
                    });
                    const requestInfo = getRequestInfo(ctx?.request || ctx);
                    if (data.type === 'forget-password') {
                        const email = data.email.toLowerCase();
                        passwordResetMethod.set(email, 'otp');
                    }
                    const originalPromise = originalSendVerificationOTP(data, ctx);
                    if (data.type === 'forget-password') {
                        const eventPromise = emitEvent('password.reset_requested_otp', {
                            status: 'success',
                            metadata: {
                                email: data.email,
                                type: 'forget-password',
                                requestedAt: new Date().toISOString(),
                            },
                            request: requestInfo,
                        }, capturedConfig).catch(() => { });
                        await originalPromise;
                        eventPromise.catch(() => { });
                    }
                    else {
                        await originalPromise;
                    }
                };
                // Wrap directly in options
                emailOtpPlugin.options.sendVerificationOTP = wrappedSendVerificationOTP;
                // Wrap the init function to ensure our wrapper is used during init
                const originalInit = emailOtpPlugin.init;
                if (originalInit && typeof originalInit === 'function') {
                    emailOtpPlugin.init = async (authInstance) => {
                        console.log('[Auth Callbacks] emailOtpPlugin init called');
                        // Ensure our wrapper is in place BEFORE calling original init
                        emailOtpPlugin.options.sendVerificationOTP = wrappedSendVerificationOTP;
                        // Call original init
                        await originalInit(authInstance);
                        // Re-apply after init
                        if (emailOtpPlugin.options) {
                            emailOtpPlugin.options.sendVerificationOTP = wrappedSendVerificationOTP;
                            console.log('[Auth Callbacks] Re-applied sendVerificationOTP wrapper after init');
                        }
                    };
                }
                console.log('[Auth Callbacks] sendVerificationOTP wrapped successfully');
            }
            else {
                console.warn('[Auth Callbacks] sendVerificationOTP not found in emailOtpPlugin.options');
            }
            emailOtpPlugin.__studio_wrapped = true;
        }
        else if (emailOtpPlugin && emailOtpPlugin.__studio_wrapped) {
            console.log('[Auth Callbacks] emailOtpPlugin already wrapped, skipping');
        }
        else {
            console.warn('[Auth Callbacks] emailOtpPlugin not found in plugins');
        }
    }
    catch (error) {
        console.error('[Auth Callbacks] Failed to wrap callbacks:', error);
    }
}
//# sourceMappingURL=auth-callbacks-injector.js.map