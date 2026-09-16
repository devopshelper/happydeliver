import { O as FILENAME, S as escape_html, a as onDestroy, c as derived, g as push_element, h as pop_element, u as head } from "../../../../chunks/internal.js";
import "../../../../chunks/paths.js";
import { t as page } from "../../../../chunks/state.js";
import "../../../../chunks/components.js";
import "../../../../chunks/api.js";
//#region src/routes/test/[test]/+page.svelte
_page[FILENAME] = "src/routes/test/[test]/+page.svelte";
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		derived(() => page.params.test);
		let pollInterval = null;
		let reportRetryTimeout = null;
		function stopPolling() {
			if (pollInterval) {
				clearInterval(pollInterval);
				pollInterval = null;
			}
			if (reportRetryTimeout) {
				clearTimeout(reportRetryTimeout);
				reportRetryTimeout = null;
			}
		}
		onDestroy(() => {
			stopPolling();
		});
		head("1971tca", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>
        ${escape_html("Loading...")} - happyDeliver
    </title>`);
			});
		});
		$$renderer.push(`<div class="container py-5">`);
		push_element($$renderer, "div", 243, 0);
		$$renderer.push(`<!--[0--><div class="text-center py-5">`);
		push_element($$renderer, "div", 245, 8);
		$$renderer.push(`<div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">`);
		push_element($$renderer, "div", 246, 12);
		$$renderer.push(`<span class="visually-hidden">`);
		push_element($$renderer, "span", 251, 16);
		$$renderer.push(`Loading...</span>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` <p class="mt-3 text-muted">`);
		push_element($$renderer, "p", 253, 12);
		$$renderer.push(`Loading test...</p>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(`<!--]--></div>`);
		pop_element();
	}, _page);
}
_page.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
export { _page as default };
