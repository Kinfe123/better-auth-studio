import type { Router as ExpressRouter, NextFunction, Request, Response } from "express";
import { Router } from "express";
import { handleStudioRequest } from "../core/handler.js";
import type { StudioConfig, UniversalRequest, UniversalResponse } from "../types/handler.js";
import { injectEventHooks } from "../utils/hook-injector.js";

/**
 * Express adapter for Better Auth Studio
 */
export function betterAuthStudio(config: StudioConfig): ExpressRouter {
  if (config.events?.enabled && config.auth) {
    injectEventHooks(config.auth, config.events);
  }

  const router = Router();

  router.all("*", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const universalReq = convertExpressToUniversal(req);

      const universalRes = await handleStudioRequest(universalReq, config);

      sendExpressResponse(res, universalRes);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function convertExpressToUniversal(req: Request): UniversalRequest {
  return {
    url: req.originalUrl,
    method: req.method,
    headers: req.headers as Record<string, string>,
    body: req.body,
  };
}

function sendExpressResponse(res: Response, universal: UniversalResponse): void {
  res.status(universal.status);

  Object.entries(universal.headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (Buffer.isBuffer(universal.body)) {
    res.end(universal.body);
  } else {
    res.send(universal.body);
  }
}
