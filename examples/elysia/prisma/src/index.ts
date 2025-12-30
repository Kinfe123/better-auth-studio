import { Elysia } from 'elysia';
import { auth } from './auth';
import { betterAuthStudio } from 'better-auth-studio/elysia';
import studioConfig from '../studio.config';

const app = new Elysia()
    .get('/health', (ctx) => {
        return {
            status: 'ok',
            message: 'Better Auth Test Project Running',
            timestamp: new Date().toISOString(),
        };
    })
    .get('/', async (context) => {
        try {
            const sessionResponse = await auth.api.getSession({ headers: context.request.headers });
            const recentAccounts = await (await auth.$context).adapter.findMany({
                model: 'account',
                where: [{ field: 'providerId', value: 'github' }],
                limit: 5,
            });
            const recentUsers = await (await auth.$context).adapter.findMany({
                model: 'user',
                limit: 5,
            });
            const sessions = await (await auth.$context).adapter.findMany({
                model: 'session',
                limit: 5,
            });
            return {
                message: 'Better Auth Test Project',
                description: 'This is a test project for Better Auth Studio with Elysia',
                sessions: JSON.stringify(sessions, null, 2),
                userCount: recentUsers.length,
                endpoints: {
                    health: '/health',
                    auth: '/api/auth/*',
                    studio: '/api/studio/*',
                },
            };
        } catch (error) {
            console.error('Root route error:', error);
            return {
                error: 'Failed to load data',
                details: error instanceof Error ? error.message : String(error),
            };
        }
    })
    .all("/api/auth", async (context) => { 
        return auth.handler(context.request);
    })
    .all('/api/auth/*', async (context) => {
        return auth.handler(context.request);
    })
    .all("/api/studio", betterAuthStudio(studioConfig))
    .all("/api/studio/*", betterAuthStudio(studioConfig));

const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, () => {
    console.log(`🚀 Better Auth Test Project running on http://localhost:${PORT}`);
});

