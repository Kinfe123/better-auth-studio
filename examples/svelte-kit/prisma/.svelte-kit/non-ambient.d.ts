
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/api" | "/api/studio" | "/api/studio/[...path]" | "/auth";
		RouteParams(): {
			"/api/studio/[...path]": { path: string }
		};
		LayoutParams(): {
			"/": { path?: string };
			"/api": { path?: string };
			"/api/studio": { path?: string };
			"/api/studio/[...path]": { path: string };
			"/auth": Record<string, never>
		};
		Pathname(): "/" | "/api" | "/api/" | "/api/studio" | "/api/studio/" | `/api/studio/${string}` & {} | `/api/studio/${string}/` & {} | "/auth" | "/auth/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}