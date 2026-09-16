
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
	type MatcherParam<M> = M extends (param : string) => param is (infer U extends string) ? U : string;

	export interface AppTypes {
		RouteId(): "/" | "/bimi" | "/bimi/[domain]" | "/blacklist" | "/blacklist/[ip]" | "/domain" | "/domain/[domain]" | "/history" | "/test" | "/test/[test]";
		RouteParams(): {
			"/bimi/[domain]": { domain: string };
			"/blacklist/[ip]": { ip: string };
			"/domain/[domain]": { domain: string };
			"/test/[test]": { test: string }
		};
		LayoutParams(): {
			"/": { domain?: string | undefined; ip?: string | undefined; test?: string | undefined };
			"/bimi": { domain?: string | undefined };
			"/bimi/[domain]": { domain: string };
			"/blacklist": { ip?: string | undefined };
			"/blacklist/[ip]": { ip: string };
			"/domain": { domain?: string | undefined };
			"/domain/[domain]": { domain: string };
			"/history": Record<string, never>;
			"/test": { test?: string | undefined };
			"/test/[test]": { test: string }
		};
		Pathname(): "/" | "/bimi" | `/bimi/${string}` & {} | "/blacklist" | `/blacklist/${string}` & {} | "/domain" | `/domain/${string}` & {} | "/history" | "/test" | `/test/${string}` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/img/og.webp" | "/img/report.webp" | string & {};
	}
}