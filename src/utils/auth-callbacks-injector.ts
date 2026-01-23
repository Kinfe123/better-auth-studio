import type { StudioConfig } from "../types/handler.js";
import { emitEvent } from "./event-ingestion.js";

/**
 * Helper to extract request info from Better Auth request object
 */
function getRequestInfo(request?: Request | any): { headers: Record<string, string>; ip?: string } {
  const headersObj: Record<string, string> = {};
  let ip: string | undefined;

  if (request) {
    try {
      if (request instanceof Request) {
        request.headers.forEach((value, key) => {
          headersObj[key] = value;
        });
        ip =
          request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
      } else if (request.headers) {
        if (typeof request.headers.get === "function") {
          ip =
            request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
          request.headers.forEach?.((value: string, key: string) => {
            headersObj[key] = value;
          });
        } else {
          ip = request.headers["x-forwarded-for"] || request.headers["x-real-ip"] || undefined;
          Object.entries(request.headers).forEach(([key, value]) => {
            headersObj[key] = String(value);
          });
        }
      }
    } catch (e) {}
  }

  return { headers: headersObj, ip };
}

/**
 * Wraps Better Auth callbacks to automatically emit events
 * This should be called during Better Auth initialization
 */
const passwordResetMethod = new Map<string, "otp" | "token">();

export function wrapAuthCallbacks(auth: any, eventsConfig: StudioConfig["events"]): void {
  if (!auth || !eventsConfig?.enabled) {
    return;
  }

  try {
    const capturedConfig = eventsConfig;

    const wrapCallback = <T extends (...args: any[]) => any>(
      originalCallback: T | undefined,
      eventType: string,
      eventData: (args: Parameters<T>) => any,
    ): T => {
      return (async (...args: Parameters<T>) => {
        if (originalCallback) {
          await originalCallback(...args);
        }

        const data = eventData(args);
        const requestInfo = getRequestInfo(args[args.length - 1]);

        emitEvent(
          eventType as any,
          {
            status: "success",
            ...data,
            request: requestInfo,
          },
          capturedConfig,
        ).catch(() => {});
      }) as T;
    };

    const deleteUserConfig = auth.options?.user?.deleteUser || auth.user?.deleteUser;
    if (deleteUserConfig && !deleteUserConfig.__studio_wrapped) {
      const originalSendDeleteVerification = deleteUserConfig.sendDeleteAccountVerification;

      deleteUserConfig.sendDeleteAccountVerification = wrapCallback(
        originalSendDeleteVerification,
        "user.delete_verification_requested",
        (args) => {
          const data = args[0] as any;
          const user = data?.user;
          return {
            userId: user?.id,
            metadata: {
              email: user?.email,
              name: user?.name,
              token: data?.token,
            },
          };
        },
      );

      // Wrap afterDelete callback
      const originalAfterDelete = deleteUserConfig.afterDelete;

      deleteUserConfig.afterDelete = wrapCallback(originalAfterDelete, "user.deleted", (args) => {
        const user = args[0] as any;
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

      emailVerificationConfig.onEmailVerification = wrapCallback(
        originalOnEmailVerification,
        "user.email_verified",
        (args) => {
          const user = args[0] as any;
          return {
            userId: user?.id,
            metadata: {
              email: user?.email,
              name: user?.name,
              verifiedAt: new Date().toISOString(),
            },
          };
        },
      );

      emailVerificationConfig.__studio_wrapped = true;
    }

    const emailAndPasswordConfig = auth.options?.emailAndPassword || auth.emailAndPassword;

    if (emailAndPasswordConfig && !emailAndPasswordConfig.__studio_wrapped) {
      const originalOnPasswordChange = emailAndPasswordConfig.onPasswordChange;

      emailAndPasswordConfig.onPasswordChange = wrapCallback(
        originalOnPasswordChange,
        "user.password_changed",
        (args) => {
          const data = args[0] as any;
          return {
            userId: data?.user?.id,
            metadata: {
              email: data?.user?.email,
              name: data?.user?.name,
              revokeOtherSessions: data?.revokeOtherSessions || false,
              changedAt: new Date().toISOString(),
            },
          };
        },
      );

      // Wrap sendResetPassword to track password.reset_requested
      const originalSendResetPassword = emailAndPasswordConfig.sendResetPassword;

      if (originalSendResetPassword) {
        emailAndPasswordConfig.sendResetPassword = async (
          ...args: Parameters<typeof originalSendResetPassword>
        ) => {
          const data = args[0] as any;
          const request = args[1] as Request | undefined;
          const requestInfo = getRequestInfo(request);

          // Mark this email as using token-based reset
          const email = data?.user?.email?.toLowerCase();
          if (email) {
            passwordResetMethod.set(email, "token");
          }

          const originalPromise = originalSendResetPassword(...args);
          const eventPromise = emitEvent(
            "password.reset_requested",
            {
              status: "success",
              userId: data?.user?.id,
              metadata: {
                email: data?.user?.email,
                name: data?.user?.name || data?.user?.email || "Someone",
                requestedAt: new Date().toISOString(),
              },
              request: requestInfo,
            },
            capturedConfig,
          ).catch(() => {});

          await originalPromise;
          eventPromise.catch(() => {});
        };
      }

      const originalOnPasswordReset = emailAndPasswordConfig.onPasswordReset;

      emailAndPasswordConfig.onPasswordReset = async (
        ...args: Parameters<typeof originalOnPasswordReset>
      ) => {
        if (originalOnPasswordReset) {
          await originalOnPasswordReset(...args);
        }

        const data = args[0] as any;
        const request = args[1] as Request | undefined;
        const requestInfo = getRequestInfo(request);

        const userEmail = data?.user?.email?.toLowerCase();
        const method = userEmail ? passwordResetMethod.get(userEmail) : undefined;
        const isOtpReset = method === "otp";

        if (userEmail) {
          passwordResetMethod.delete(userEmail);
        }

        const eventType = isOtpReset ? "password.reset_completed_otp" : "password.reset_completed";

        emitEvent(
          eventType as any,
          {
            status: "success",
            userId: data?.user?.id,
            metadata: {
              email: data?.user?.email,
              name: data?.user?.name || data?.user?.email || "Someone",
              resetAt: new Date().toISOString(),
              method: isOtpReset ? "email_otp" : "token",
            },
            request: requestInfo,
          },
          capturedConfig,
        ).catch(() => {});
      };

      emailAndPasswordConfig.__studio_wrapped = true;
    }

    const emailOtpPlugin = auth.options?.plugins?.find((p: any) => p?.id === "email-otp");

    // TODO: Fix email-otp sendVerificationOTP callback wrapping because of plugin closure
    if (emailOtpPlugin && !emailOtpPlugin.__studio_wrapped) {
      const originalSendVerificationOTP = emailOtpPlugin.options?.sendVerificationOTP;

      if (originalSendVerificationOTP) {
        const wrappedSendVerificationOTP = async (
          data: {
            email: string;
            otp: string;
            type: "sign-in" | "email-verification" | "forget-password";
          },
          ctx?: any,
        ) => {
          const requestInfo = getRequestInfo(ctx?.request || ctx);

          if (data.type === "forget-password") {
            const email = data.email.toLowerCase();
            passwordResetMethod.set(email, "otp");
          }

          const originalPromise = originalSendVerificationOTP(data, ctx);

          if (data.type === "forget-password") {
            const eventPromise = emitEvent(
              "password.reset_requested_otp",
              {
                status: "success",
                metadata: {
                  email: data.email,
                  type: "forget-password",
                  requestedAt: new Date().toISOString(),
                },
                request: requestInfo,
              },
              capturedConfig,
            ).catch(() => {});

            await originalPromise;
            eventPromise.catch(() => {});
          } else {
            await originalPromise;
          }
        };

        emailOtpPlugin.options.sendVerificationOTP = wrappedSendVerificationOTP;

        const originalInit = emailOtpPlugin.init;
        if (originalInit && typeof originalInit === "function") {
          emailOtpPlugin.init = async (authInstance: any) => {
            emailOtpPlugin.options.sendVerificationOTP = wrappedSendVerificationOTP;

            await originalInit(authInstance);

            // Re-apply after init
            if (emailOtpPlugin.options) {
              emailOtpPlugin.options.sendVerificationOTP = wrappedSendVerificationOTP;
            }
          };
        }
      }

      emailOtpPlugin.__studio_wrapped = true;
    }
  } catch (error) {}
}
