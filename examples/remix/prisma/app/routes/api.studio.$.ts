import { betterAuthStudio } from 'better-auth-studio/remix';
import studioConfig from '../../studio.config';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';

const handler = betterAuthStudio(studioConfig);

export async function loader({ request }: LoaderFunctionArgs) {
  return handler({ request });
}

export async function action({ request }: ActionFunctionArgs) {
  return handler({ request });
}

