import type { StudioAccessConfig } from '../utils/html-injector.js';

export type ApiContext = {
  path: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  auth: any;
  basePath?: string;
  accessConfig?: StudioAccessConfig;
};

export type ApiResponse = {
  status: number;
  data: any;
  cookies?: Array<{ name: string; value: string; options: any }>;
};

export async function routeApiRequest(ctx: ApiContext): Promise<ApiResponse> {
  const { handleStudioApiRequest } = await import('../routes.js');

  try {
    return await handleStudioApiRequest(ctx);
  } catch (error) {
    console.error('API routing error:', error);
    return {
      status: 500,
      data: { error: 'Internal server error' },
    };
  }
}
