import type { StudioConfig } from "../types/handler.js";
/**
 * Wraps email-otp plugin callbacks to automatically emit events
 * This wraps the sendVerificationOTP callback similar to how organization hooks work
 *
 * @param eventsConfig - The events configuration
 * @param existingCallback - The original sendVerificationOTP callback
 * @param passwordResetMethodMap - Optional shared Map to track password reset method (OTP vs token)
 */
export declare function wrapEmailOTPPluginCallbacks(
  eventsConfig: StudioConfig["events"],
  existingCallback?: (
    data: {
      email: string;
      otp: string;
      type: "sign-in" | "email-verification" | "forget-password";
    },
    ctx?: any,
  ) => Promise<void>,
  passwordResetMethodMap?: Map<string, "otp" | "token">,
):
  | ((
      data: {
        email: string;
        otp: string;
        type: "sign-in" | "email-verification" | "forget-password";
      },
      ctx?: any,
    ) => Promise<void>)
  | undefined;
/**
 * Automatically wraps email-otp plugin callbacks to emit events
 * This should be called during Better Auth initialization
 * Similar to wrapOrganizationPluginHooks but for callbacks
 *
 * @param auth - The Better Auth instance
 * @param eventsConfig - The events configuration
 * @param passwordResetMethodMap - Optional shared Map to track password reset method (OTP vs token)
 */
export declare function wrapEmailOTPPluginHooks(
  auth: any,
  eventsConfig: StudioConfig["events"],
  passwordResetMethodMap?: Map<string, "otp" | "token">,
): void;
//# sourceMappingURL=email-otp-hooks-injector.d.ts.map
