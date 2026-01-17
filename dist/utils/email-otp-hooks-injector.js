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
// Share password reset method tracking with auth-callbacks-injector
// This is used to determine if password reset was via OTP or token
// We need to access it from auth-callbacks-injector, so we'll use a shared approach
// by setting it on the email-otp plugin options temporarily, or we can use a module-level map
// For now, we'll track it in the callback and let onPasswordReset check it
// The passwordResetMethod map in auth-callbacks-injector will be used for completion tracking
/**
 * Wraps email-otp plugin callbacks to automatically emit events
 * This wraps the sendVerificationOTP callback similar to how organization hooks work
 *
 * @param eventsConfig - The events configuration
 * @param existingCallback - The original sendVerificationOTP callback
 * @param passwordResetMethodMap - Optional shared Map to track password reset method (OTP vs token)
 */
export function wrapEmailOTPPluginCallbacks(eventsConfig, existingCallback, passwordResetMethodMap) {
    if (!eventsConfig?.enabled) {
        return existingCallback;
    }
    if (!existingCallback) {
        return undefined;
    }
    const capturedConfig = eventsConfig;
    return async (data, ctx) => {
        const requestInfo = getRequestInfo(ctx?.request || ctx);
        // Call the original callback first
        const originalPromise = existingCallback(data, ctx);
        // Track and emit event for password reset OTP
        if (data.type === 'forget-password') {
            const email = data.email.toLowerCase();
            // Track that this is an OTP-based password reset
            // This will be checked by onPasswordReset in auth-callbacks-injector
            if (passwordResetMethodMap) {
                passwordResetMethodMap.set(email, 'otp');
            }
            // Emit event for password reset OTP requested
            const eventPromise = emitEvent('password.reset_requested_otp', {
                status: 'success',
                metadata: {
                    email: data.email,
                    type: 'forget-password',
                    requestedAt: new Date().toISOString(),
                },
                request: requestInfo,
            }, capturedConfig).catch(() => { });
            // Wait for original callback to complete
            await originalPromise;
            // Don't wait for event emission to avoid blocking
            eventPromise.catch(() => { });
        }
        else {
            await originalPromise;
        }
    };
}
/**
 * Automatically wraps email-otp plugin callbacks to emit events
 * This should be called during Better Auth initialization
 * Similar to wrapOrganizationPluginHooks but for callbacks
 *
 * @param auth - The Better Auth instance
 * @param eventsConfig - The events configuration
 * @param passwordResetMethodMap - Optional shared Map to track password reset method (OTP vs token)
 */
export function wrapEmailOTPPluginHooks(auth, eventsConfig, passwordResetMethodMap) {
    if (!auth || !eventsConfig?.enabled) {
        return;
    }
    try {
        const plugins = auth.options?.plugins || [];
        const emailOtpPlugin = plugins.find((p) => p?.id === 'email-otp');
        if (!emailOtpPlugin) {
            return;
        }
        // Check if already wrapped to avoid double wrapping
        if (emailOtpPlugin.__studio_callbacks_wrapped) {
            return;
        }
        // Wrap the sendVerificationOTP callback
        const existingSendVerificationOTP = emailOtpPlugin.options?.sendVerificationOTP;
        if (existingSendVerificationOTP) {
            const wrappedCallback = wrapEmailOTPPluginCallbacks(eventsConfig, existingSendVerificationOTP, passwordResetMethodMap);
            if (wrappedCallback) {
                if (!emailOtpPlugin.options) {
                    emailOtpPlugin.options = {};
                }
                emailOtpPlugin.options.sendVerificationOTP = wrappedCallback;
            }
        }
        // Mark as wrapped to prevent double wrapping
        emailOtpPlugin.__studio_callbacks_wrapped = true;
    }
    catch (error) {
        console.error('[Email OTP Callbacks] Failed to wrap callbacks:', error);
    }
}
//# sourceMappingURL=email-otp-hooks-injector.js.map