import { Router } from 'express';
import { handleStudioRequest } from '../core/handler.js';
import { injectEventHooks } from '../utils/hook-injector.js';
/**
 * Express adapter for Better Auth Studio
 */
export function betterAuthStudio(config) {
    // // Initialize event ingestion and inject hooks on startup
    // if (config.events?.enabled) {
    //   initializeEventIngestionAndHooks(config).catch(() => {
    //     // Silently fail - event ingestion will be retried on first /api/studio request
    //   });
    // }
    if (config.events?.enabled && config.auth) {
        injectEventHooks(config.auth, config.events);
    }
    const router = Router();
    router.all('*', async (req, res, next) => {
        try {
            const universalReq = convertExpressToUniversal(req);
            const universalRes = await handleStudioRequest(universalReq, config);
            sendExpressResponse(res, universalRes);
        }
        catch (error) {
            next(error);
        }
    });
    return router;
}
function convertExpressToUniversal(req) {
    return {
        url: req.originalUrl,
        method: req.method,
        headers: req.headers,
        body: req.body,
    };
}
function sendExpressResponse(res, universal) {
    res.status(universal.status);
    Object.entries(universal.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
    });
    if (Buffer.isBuffer(universal.body)) {
        res.end(universal.body);
    }
    else {
        res.send(universal.body);
    }
}
//# sourceMappingURL=express.js.map