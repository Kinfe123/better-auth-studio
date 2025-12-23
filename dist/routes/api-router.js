export async function routeApiRequest(ctx) {
    const { handleStudioApiRequest } = await import('../routes.js');
    try {
        return await handleStudioApiRequest(ctx);
    }
    catch (error) {
        console.error('API routing error:', error);
        return {
            status: 500,
            data: { error: 'Internal server error' },
        };
    }
}
//# sourceMappingURL=api-router.js.map