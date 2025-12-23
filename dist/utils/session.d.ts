export interface StudioSession {
    userId: string;
    email: string;
    name: string;
    role: string;
    image?: string;
    issuedAt: number;
    expiresAt: number;
}
export declare function encryptSession(session: StudioSession, secret: string): string;
export declare function decryptSession(token: string, secret: string): StudioSession | null;
export declare function isSessionValid(session: StudioSession | null): boolean;
export declare function createStudioSession(user: {
    id: string;
    email: string;
    name?: string;
    role?: string;
    image?: string;
}, durationMs?: number): StudioSession;
export declare const STUDIO_COOKIE_NAME = "better_auth_studio_session";
//# sourceMappingURL=session.d.ts.map