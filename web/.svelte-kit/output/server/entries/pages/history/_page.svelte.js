import { O as FILENAME, b as attr, c as derived, g as push_element, h as pop_element, u as head } from "../../../chunks/internal.js";
import "../../../chunks/paths.js";
import "../../../chunks/navigation.js";
import "../../../chunks/components.js";
import "../../../chunks/api.js";
//#region src/routes/history/+page.svelte
_page[FILENAME] = "src/routes/history/+page.svelte";
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let total = 0;
		let offset = 0;
		let limit = 20;
		let creatingTest = false;
		derived(() => Math.ceil(total / limit));
		derived(() => Math.floor(offset / limit) + 1);
		head("1xl2tfr", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>Test History - happyDeliver</title>`);
			});
		});
		$$renderer.push(`<div class="container py-5">`);
		push_element($$renderer, "div", 76, 0);
		$$renderer.push(`<div class="row">`);
		push_element($$renderer, "div", 77, 4);
		$$renderer.push(`<div class="col-lg-10 mx-auto">`);
		push_element($$renderer, "div", 78, 8);
		$$renderer.push(`<div class="d-flex justify-content-between align-items-center mb-4">`);
		push_element($$renderer, "div", 79, 12);
		$$renderer.push(`<h1 class="display-6 fw-bold mb-0">`);
		push_element($$renderer, "h1", 80, 16);
		$$renderer.push(`<i class="bi bi-clock-history me-2">`);
		push_element($$renderer, "i", 81, 20);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(` Test History</h1>`);
		pop_element();
		$$renderer.push(` <button class="btn btn-primary"${attr("disabled", creatingTest, true)}>`);
		push_element($$renderer, "button", 84, 16);
		$$renderer.push(`<!--[-1--><i class="bi bi-plus-lg me-1">`);
		push_element($$renderer, "i", 88, 24);
		$$renderer.push(`</i>`);
		pop_element();
		$$renderer.push(`<!--]--> New Test</button>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` `);
		$$renderer.push(`<!--[0--><div class="text-center py-5">`);
		push_element($$renderer, "div", 95, 16);
		$$renderer.push(`<div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">`);
		push_element($$renderer, "div", 96, 20);
		$$renderer.push(`<span class="visually-hidden">`);
		push_element($$renderer, "span", 101, 24);
		$$renderer.push(`Loading...</span>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(` <p class="mt-3 text-muted">`);
		push_element($$renderer, "p", 103, 20);
		$$renderer.push(`Loading tests...</p>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(`<!--]--></div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
		$$renderer.push(`</div>`);
		pop_element();
	}, _page);
}
_page.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
export { _page as default };
