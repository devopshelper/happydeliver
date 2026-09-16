import { O as FILENAME, S as escape_html, b as attr, c as derived, f as store_get, g as push_element, h as pop_element, m as unsubscribe_stores, u as head, v as getContext } from "../../../../chunks/internal.js";
import { t as resolve } from "../../../../chunks/paths.js";
import "../../../../chunks/theme.js";
import "../../../../chunks/navigation.js";
import "../../../../chunks/components.js";
import "../../../../chunks/api.js";
//#region ../node_modules/@sveltejs/kit/src/runtime/app/stores.js
/**
* A function that returns all of the contextual stores. On the server, this must be called during component initialization.
* Only use this if you need to defer store subscription until after the component has mounted, for some reason.
*
* @deprecated Use `$app/state` instead (requires Svelte 5, [see docs for more info](https://svelte.dev/docs/kit/migrating-to-sveltekit-2#SvelteKit-2.12:-$app-stores-deprecated))
*/
var getStores = () => {
	const stores$1 = getContext("__svelte__");
	return {
		/** @type {typeof page} */
		page: { subscribe: stores$1.page.subscribe },
		/** @type {typeof navigating} */
		navigating: { subscribe: stores$1.navigating.subscribe },
		/** @type {typeof updated} */
		updated: stores$1.updated
	};
};
/**
* A readable store whose value contains page data.
*
* On the server, this store can only be subscribed to during component initialization. In the browser, it can be subscribed to at any time.
*
* @deprecated Use `page` from `$app/state` instead (requires Svelte 5, [see docs for more info](https://svelte.dev/docs/kit/migrating-to-sveltekit-2#SvelteKit-2.12:-$app-stores-deprecated))
* @type {import('svelte/store').Readable<import('@sveltejs/kit').Page>}
*/
var page = { subscribe(fn) {
	return get_store("page").subscribe(fn);
} };
/**
* @template {keyof ReturnType<typeof getStores>} Name
* @param {Name} name
* @returns {ReturnType<typeof getStores>[Name]}
*/
function get_store(name) {
	try {
		return getStores()[name];
	} catch {
		throw new Error(`Cannot subscribe to '${name}' store on the server outside of a Svelte component, as it is bound to the current request via component context. This prevents state from leaking between users.For more information, see https://svelte.dev/docs/kit/state-management#avoid-shared-state-on-the-server`);
	}
}
//#endregion
//#region src/routes/blacklist/[ip]/+page.svelte
_page[FILENAME] = "src/routes/blacklist/[ip]/+page.svelte";
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let ip = derived(() => store_get($$store_subs ??= {}, "$page", page).params.ip);
		head("1xwlips", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>${escape_html(ip())} - Blacklist Check - happyDeliver</title>`);
			});
		});
		$$renderer.push(`<div class="container py-5">`);
		push_element($$renderer, "div", 52, 0);
		$$renderer.push(`<div class="row">`);
		push_element($$renderer, "div", 53, 4);
		$$renderer.push(`<div class="col-lg-10 mx-auto">`);
		push_element($$renderer, "div", 54, 8);
		$$renderer.push(`<div class="mb-4">`);
		push_element($$renderer, "div", 56, 12);
		$$renderer.push(`<div class="d-flex align-items-center justify-content-between">`);
		push_element($$renderer, "div", 57, 16);
		$$renderer.push(`<h1 class="h2 mb-0">`);
		push_element($$renderer, "h1", 58, 20);
		$$renderer.push(`<i class="bi bi-shield-exclamation me-2">`);
		push_element($$renderer, "i", 59, 24);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(` Blacklist Analysis</h1>`);
		pop_element();
		$$renderer.push(` <a${attr("href", resolve("/blacklist"))} class="btn btn-outline-secondary">`);
		push_element($$renderer, "a", 62, 20);
		$$renderer.push(`<i class="bi bi-arrow-left me-2">`);
		push_element($$renderer, "i", 63, 24);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(` Check Another IP</a>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` `);
		$$renderer.push(`<!--[0--><div class="card shadow-sm">`);
		push_element($$renderer, "div", 71, 16);
		$$renderer.push(`<div class="card-body text-center py-5">`);
		push_element($$renderer, "div", 72, 20);
		$$renderer.push(`<div class="spinner-border text-primary mb-3" role="status">`);
		push_element($$renderer, "div", 73, 24);
		$$renderer.push(`<span class="visually-hidden">`);
		push_element($$renderer, "span", 74, 28);
		$$renderer.push(`Loading...</span>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` <h3 class="h5">`);
		push_element($$renderer, "h3", 76, 24);
		$$renderer.push(`Checking ${escape_html(ip())}...</h3>`);
		pop_element();
		$$renderer.push(` <p class="text-muted mb-0">`);
		push_element($$renderer, "p", 77, 24);
		$$renderer.push(`Querying DNS-based blacklists</p>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(`<!--]--></div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		if ($$store_subs) unsubscribe_stores($$store_subs);
	}, _page);
}
_page.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
export { _page as default };
