import { createHmac, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
function deriveKey(secret) {
    return createHmac('sha256', secret).update('studio-session-key').digest();
}
export function encryptSession(session, secret) {
    const key = deriveKey(secret);
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const data = JSON.stringify(session);
    const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const combined = Buffer.concat([iv, authTag, encrypted]);
    return combined.toString('base64url');
}
export function decryptSession(token, secret) {
    try {
        const key = deriveKey(secret);
        const combined = Buffer.from(token, 'base64url');
        const iv = combined.subarray(0, IV_LENGTH);
        const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
        const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
        const decipher = createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return JSON.parse(decrypted.toString('utf8'));
    }
    catch {
        return null;
    }
}
export function isSessionValid(session) {
    if (!session)
        return false;
    return session.expiresAt > Date.now();
}
export function createStudioSession(user, durationMs = 7 * 24 * 60 * 60 * 1000) {
    return {
        userId: user.id,
        email: user.email,
        name: user.name || '',
        role: user.role || 'user',
        image: user.image,
        issuedAt: Date.now(),
        expiresAt: Date.now() + durationMs,
    };
}
export const STUDIO_COOKIE_NAME = 'better_auth_studio_session';
//# sourceMappingURL=session.js.map