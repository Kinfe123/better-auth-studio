import { createFileRoute } from '@tanstack/react-router';
import { betterAuthStudio } from 'better-auth-studio/tanstack-start';
import studioConfig from '../../../../studio.config';

const handler = betterAuthStudio(studioConfig);
export const Route = createFileRoute('/api/studio/$')({
	server: {
		handlers: {
			GET: handler,
			POST: handler,
			PUT: handler,
			DELETE: handler,
			PATCH: handler,
		},
	},
});

