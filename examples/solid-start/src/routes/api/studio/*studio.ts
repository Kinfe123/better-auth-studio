import { betterAuthStudio } from "better-auth-studio/solid-start";
import studioConfig from "../../../../studio.config";

const handler = betterAuthStudio(studioConfig);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
