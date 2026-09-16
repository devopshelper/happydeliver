
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/private';
 * 
 * console.log(ENVIRONMENT); // => "production"
 * console.log(PUBLIC_BASE_URL); // => throws error during build
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/private' {
	export const GOOGLE_RUNTIME: string;
	export const npm_package_dev: string;
	export const LANGUAGE: string;
	export const NO_UPDATE_NOTIFIER: string;
	export const npm_config_user_agent: string;
	export const NODE_VERSION: string;
	export const K_REVISION: string;
	export const YARN_VERSION: string;
	export const APP_URL: string;
	export const CONTROL_PLANE_PORT: string;
	export const npm_node_execpath: string;
	export const npm_package_resolved: string;
	export const SHLVL: string;
	export const DEFAULT_APP_PORT: string;
	export const npm_config_noproxy: string;
	export const PORT: string;
	export const HOME: string;
	export const npm_package_optional: string;
	export const npm_package_json: string;
	export const NODE_OPTIONS: string;
	export const npm_config_userconfig: string;
	export const npm_config_local_prefix: string;
	export const npm_package_integrity: string;
	export const HAPPYDELIVER_DISABLE_TEST_LIST: string;
	export const NG_ALLOWED_HOSTS: string;
	export const COLOR: string;
	export const CLOUD_RUN_TIMEOUT_SECONDS: string;
	export const APPLET_ID: string;
	export const K_CONFIGURATION: string;
	export const _: string;
	export const npm_config_prefix: string;
	export const npm_config_npm_version: string;
	export const APPLET_DIR: string;
	export const npm_config_cache: string;
	export const GOMEMLIMIT: string;
	export const CONTROL_PLANE_API_DIR: string;
	export const npm_config_node_gyp: string;
	export const PATH: string;
	export const NEXT_TELEMETRY_DISABLED: string;
	export const NODE: string;
	export const npm_package_name: string;
	export const HAPPYDELIVER_DOMAIN: string;
	export const CNB_GROUP_ID: string;
	export const CNB_USER_ID: string;
	export const APP_DIR: string;
	export const HAPPYDELIVER_RECEIVER_HOSTNAME: string;
	export const LANG: string;
	export const npm_lifecycle_script: string;
	export const K_SERVICE: string;
	export const HOST: string;
	export const npm_package_version: string;
	export const npm_lifecycle_event: string;
	export const NGINX_PORT: string;
	export const HAPPYDELIVER_TEST_PREFIX: string;
	export const npm_package_dev_optional: string;
	export const npm_config_globalconfig: string;
	export const npm_config_init_module: string;
	export const npm_package_peer: string;
	export const LC_ALL: string;
	export const PWD: string;
	export const npm_execpath: string;
	export const GEMINI_API_KEY: string;
	export const npm_config_global_prefix: string;
	export const AUTHORIZED_SERVICE_ACCOUNT_EMAIL: string;
	export const npm_command: string;
	export const CSP_HEADER_VALUE: string;
	export const NODE_ENV: string;
	export const CNB_STACK_ID: string;
	export const INIT_CWD: string;
	export const EDITOR: string;
}

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/public';
 * 
 * console.log(ENVIRONMENT); // => throws error during build
 * console.log(PUBLIC_BASE_URL); // => "http://site.com"
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * 
 * console.log(env.ENVIRONMENT); // => "production"
 * console.log(env.PUBLIC_BASE_URL); // => undefined
 * ```
 */
declare module '$env/dynamic/private' {
	export const env: {
		GOOGLE_RUNTIME: string;
		npm_package_dev: string;
		LANGUAGE: string;
		NO_UPDATE_NOTIFIER: string;
		npm_config_user_agent: string;
		NODE_VERSION: string;
		K_REVISION: string;
		YARN_VERSION: string;
		APP_URL: string;
		CONTROL_PLANE_PORT: string;
		npm_node_execpath: string;
		npm_package_resolved: string;
		SHLVL: string;
		DEFAULT_APP_PORT: string;
		npm_config_noproxy: string;
		PORT: string;
		HOME: string;
		npm_package_optional: string;
		npm_package_json: string;
		NODE_OPTIONS: string;
		npm_config_userconfig: string;
		npm_config_local_prefix: string;
		npm_package_integrity: string;
		HAPPYDELIVER_DISABLE_TEST_LIST: string;
		NG_ALLOWED_HOSTS: string;
		COLOR: string;
		CLOUD_RUN_TIMEOUT_SECONDS: string;
		APPLET_ID: string;
		K_CONFIGURATION: string;
		_: string;
		npm_config_prefix: string;
		npm_config_npm_version: string;
		APPLET_DIR: string;
		npm_config_cache: string;
		GOMEMLIMIT: string;
		CONTROL_PLANE_API_DIR: string;
		npm_config_node_gyp: string;
		PATH: string;
		NEXT_TELEMETRY_DISABLED: string;
		NODE: string;
		npm_package_name: string;
		HAPPYDELIVER_DOMAIN: string;
		CNB_GROUP_ID: string;
		CNB_USER_ID: string;
		APP_DIR: string;
		HAPPYDELIVER_RECEIVER_HOSTNAME: string;
		LANG: string;
		npm_lifecycle_script: string;
		K_SERVICE: string;
		HOST: string;
		npm_package_version: string;
		npm_lifecycle_event: string;
		NGINX_PORT: string;
		HAPPYDELIVER_TEST_PREFIX: string;
		npm_package_dev_optional: string;
		npm_config_globalconfig: string;
		npm_config_init_module: string;
		npm_package_peer: string;
		LC_ALL: string;
		PWD: string;
		npm_execpath: string;
		GEMINI_API_KEY: string;
		npm_config_global_prefix: string;
		AUTHORIZED_SERVICE_ACCOUNT_EMAIL: string;
		npm_command: string;
		CSP_HEADER_VALUE: string;
		NODE_ENV: string;
		CNB_STACK_ID: string;
		INIT_CWD: string;
		EDITOR: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://example.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.ENVIRONMENT); // => undefined, not public
 * console.log(env.PUBLIC_BASE_URL); // => "http://example.com"
 * ```
 * 
 * ```
 * 
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
