import { v as getContext } from "./internal.js";
import { n as navigating$1 } from "./navigation.js";
Object.defineProperty({
	get from() {
		return navigating$1.current ? navigating$1.current.from : null;
	},
	get to() {
		return navigating$1.current ? navigating$1.current.to : null;
	},
	get type() {
		return navigating$1.current ? navigating$1.current.type : null;
	},
	get willUnload() {
		return navigating$1.current ? navigating$1.current.willUnload : null;
	},
	get delta() {
		return navigating$1.current ? navigating$1.current.delta : null;
	},
	get complete() {
		return navigating$1.current ? navigating$1.current.complete : null;
	}
}, "current", { get() {
	throw new Error("Replace navigating.current.<prop> with navigating.<prop>");
} });
//#endregion
//#region ../node_modules/@sveltejs/kit/src/runtime/app/state/server.js
function context() {
	return getContext("__request__");
}
/** @param {string} name */
function context_dev(name) {
	try {
		return context();
	} catch {
		throw new Error(`Can only read '${name}' on the server during rendering (not in e.g. \`load\` functions), as it is bound to the current request via component context. This prevents state from leaking between users. For more information, see https://svelte.dev/docs/kit/state-management#avoid-shared-state-on-the-server`);
	}
}
//#endregion
//#region ../node_modules/@sveltejs/kit/src/runtime/app/state/index.js
/**
* A read-only reactive object with information about the current page, serving several use cases:
* - retrieving the combined `data` of all pages/layouts anywhere in your component tree (also see [loading data](https://svelte.dev/docs/kit/load))
* - retrieving the current value of the `form` prop anywhere in your component tree (also see [form actions](https://svelte.dev/docs/kit/form-actions))
* - retrieving the page state that was set through `goto`, `pushState` or `replaceState` (also see [goto](https://svelte.dev/docs/kit/$app-navigation#goto) and [shallow routing](https://svelte.dev/docs/kit/shallow-routing))
* - retrieving metadata such as the URL you're on, the current route and its parameters, and whether or not there was an error
*
* ```svelte
* <!--- file: +layout.svelte --->
* <script>
* 	import { page } from '$app/state';
* <\/script>
*
* <p>Currently at {page.url.pathname}</p>
*
* {#if page.error}
* 	<span class="red">Problem detected</span>
* {:else}
* 	<span class="small">All systems operational</span>
* {/if}
* ```
*
* Changes to `page` are available exclusively with runes. (The legacy reactivity syntax will not reflect any changes)
*
* ```svelte
* <!--- file: +page.svelte --->
* <script>
* 	import { page } from '$app/state';
* 	const id = $derived(page.params.id); // This will correctly update id for usage on this page
* 	$: badId = page.params.id; // Do not use; will never update after initial load
* <\/script>
* ```
*
* On the server, values can only be read during rendering (in other words _not_ in e.g. `load` functions). In the browser, the values can be read at any time.
*
* @type {import('@sveltejs/kit').Page}
*/
var page = {
	get data() {
		return context_dev("page.data").page.data;
	},
	get error() {
		return context_dev("page.error").page.error;
	},
	get form() {
		return context_dev("page.form").page.form;
	},
	get params() {
		return context_dev("page.params").page.params;
	},
	get route() {
		return context_dev("page.route").page.route;
	},
	get state() {
		return context_dev("page.state").page.state;
	},
	get status() {
		return context_dev("page.status").page.status;
	},
	get url() {
		return context_dev("page.url").page.url;
	}
};
//#endregion
export { page as t };
