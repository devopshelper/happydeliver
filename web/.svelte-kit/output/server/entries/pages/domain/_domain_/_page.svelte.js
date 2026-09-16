import { O as FILENAME, S as escape_html, b as attr, c as derived, g as push_element, h as pop_element, m as unsubscribe_stores, u as head } from "../../../../chunks/internal.js";
import { t as resolve } from "../../../../chunks/paths.js";
import "../../../../chunks/theme.js";
import { t as page } from "../../../../chunks/state.js";
import "../../../../chunks/components.js";
import "../../../../chunks/api.js";
//#region src/routes/domain/[domain]/+page.svelte
_page[FILENAME] = "src/routes/domain/[domain]/+page.svelte";
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let domain = derived(() => page.params.domain);
		head("ptdieu", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>${escape_html(domain())} - Domain Test - happyDeliver</title>`);
			});
		});
		$$renderer.push(`<div class="container py-5">`);
		push_element($$renderer, "div", 53, 0);
		$$renderer.push(`<div class="row">`);
		push_element($$renderer, "div", 54, 4);
		$$renderer.push(`<div class="col-lg-10 mx-auto">`);
		push_element($$renderer, "div", 55, 8);
		$$renderer.push(`<div class="mb-4">`);
		push_element($$renderer, "div", 57, 12);
		$$renderer.push(`<div class="d-flex align-items-center justify-content-between">`);
		push_element($$renderer, "div", 58, 16);
		$$renderer.push(`<h1 class="h2 mb-0">`);
		push_element($$renderer, "h1", 59, 20);
		$$renderer.push(`<i class="bi bi-globe me-2">`);
		push_element($$renderer, "i", 60, 24);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(` Domain Analysis</h1>`);
		pop_element();
		$$renderer.push(` <a${attr("href", resolve("/domain"))} class="btn btn-outline-secondary">`);
		push_element($$renderer, "a", 63, 20);
		$$renderer.push(`<i class="bi bi-arrow-left me-2">`);
		push_element($$renderer, "i", 64, 24);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(` Test Another Domain</a>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` `);
		$$renderer.push(`<!--[0--><div class="card shadow-sm svelte-ptdieu">`);
		push_element($$renderer, "div", 72, 16);
		$$renderer.push(`<div class="card-body text-center py-5">`);
		push_element($$renderer, "div", 73, 20);
		$$renderer.push(`<div class="spinner-border text-primary mb-3" role="status">`);
		push_element($$renderer, "div", 74, 24);
		$$renderer.push(`<span class="visually-hidden">`);
		push_element($$renderer, "span", 75, 28);
		$$renderer.push(`Loading...</span>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` <h3 class="h5">`);
		push_element($$renderer, "h3", 77, 24);
		$$renderer.push(`Analyzing ${escape_html(domain())}...</h3>`);
		pop_element();
		$$renderer.push(` <p class="text-muted mb-0">`);
		push_element($$renderer, "p", 78, 24);
		$$renderer.push(`Checking DNS records and configuration</p>`);
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
