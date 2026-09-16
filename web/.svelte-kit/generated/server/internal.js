
import root from '../root.js';
import { set_building, set_prerendering } from '$app/env/internal';
import { set_assets } from '$app/paths/internal/server';
import { set_manifest, set_read_implementation } from '__sveltekit/server';
import { set_private_env, set_public_env } from '../../../../node_modules/@sveltejs/kit/src/runtime/shared-server.js';
import error from '../shared/error-template.js';

export const options = {
	app_template_contains_nonce: false,
	async: false,
	csp: {"mode":"auto","directives":{"upgrade-insecure-requests":false,"block-all-mixed-content":false},"reportOnly":{"upgrade-insecure-requests":false,"block-all-mixed-content":false}},
	csrf_check_origin: true,
	csrf_trusted_origins: [],
	embedded: false,
	env_public_prefix: 'PUBLIC_',
	env_private_prefix: '',
	hash_routing: false,
	hooks: null, // added lazily, via `get_hooks`
	preload_strategy: "modulepreload",
	root,
	service_worker: false,
	service_worker_options: undefined,
	server_error_boundaries: false,
	templates: {
		app: ({ head, body, assets, nonce, env }) => "<!doctype html>\n<html lang=\"en\">\n    <head>\n        <meta charset=\"utf-8\" />\n        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n\n        <!-- Open Graph -->\n        <meta property=\"og:type\" content=\"website\" />\n        <meta property=\"og:title\" content=\"happyDeliver - Test Your Email Deliverability\" />\n        <meta\n            property=\"og:description\"\n            content=\"Get detailed insights into your email configuration, authentication, spam score, and more. Open-source, self-hosted, and privacy-focused.\"\n        />\n        <meta property=\"og:image\" content=\"/img/og.webp\" />\n\n        <!-- Twitter -->\n        <meta name=\"twitter:card\" content=\"summary_large_image\" />\n        <meta name=\"twitter:title\" content=\"happyDeliver - Test Your Email Deliverability\" />\n        <meta\n            name=\"twitter:description\"\n            content=\"Get detailed insights into your email configuration, authentication, spam score, and more. Open-source, self-hosted, and privacy-focused.\"\n        />\n        <meta name=\"twitter:image\" content=\"/img/og.webp\" />\n\n        <script>\n            // Ensure window.fetch has a setter in iframe/sandboxed environments\n            // where window.fetch or Window.prototype.fetch only provides a getter.\n            (function () {\n                try {\n                    var win = typeof window !== \"undefined\" ? window : globalThis;\n                    if (!win) return;\n                    var origFetch = win.fetch ? win.fetch.bind(win) : undefined;\n                    var activeFetch = origFetch;\n\n                    try {\n                        Object.defineProperty(win, \"fetch\", {\n                            get: function () {\n                                return activeFetch;\n                            },\n                            set: function (newFetch) {\n                                activeFetch = newFetch;\n                            },\n                            configurable: true,\n                            enumerable: true,\n                        });\n                    } catch (e1) {\n                        try {\n                            if (typeof Window !== \"undefined\" && Window.prototype) {\n                                Object.defineProperty(Window.prototype, \"fetch\", {\n                                    get: function () {\n                                        return activeFetch;\n                                    },\n                                    set: function (newFetch) {\n                                        activeFetch = newFetch;\n                                    },\n                                    configurable: true,\n                                    enumerable: true,\n                                });\n                            }\n                        } catch (e2) {}\n                    }\n                } catch (e) {}\n            })();\n        </script>\n\n        " + head + "\n    </head>\n    <body data-sveltekit-preload-data=\"hover\">\n        <script>\n            // Apply theme before render to prevent flash\n            (function () {\n                const stored = localStorage.getItem(\"theme\");\n                const theme =\n                    stored ||\n                    (window.matchMedia(\"(prefers-color-scheme: dark)\").matches ? \"dark\" : \"light\");\n                document.documentElement.setAttribute(\"data-bs-theme\", theme);\n            })();\n        </script>\n        <div style=\"display: contents\">" + body + "</div>\n    </body>\n</html>\n",
		error
	},
	version_hash: "1n8cxuf"
};

export async function get_hooks() {
	let handle;
	let handleFetch;
	let handleError;
	let handleValidationError;
	let init;
	

	let reroute;
	let transport;
	

	return {
		handle,
		handleFetch,
		handleError,
		handleValidationError,
		init,
		reroute,
		transport
	};
}

export { set_assets, set_building, set_manifest, set_prerendering, set_private_env, set_public_env, set_read_implementation };
