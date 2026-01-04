import { betterAuthStudio } from 'better-auth-studio/svelte-kit';
import studioConfig from '../../../../../studio.config.js';

const handler = betterAuthStudio(studioConfig);

export async function GET(event) {
  return handler(event);
}

export async function POST(event) {
  return handler(event);
}

export async function PUT(event) {
  return handler(event);
}

export async function DELETE(event) {
  return handler(event);
}

export async function PATCH(event) {
  return handler(event);
}

